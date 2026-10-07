// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PopVectorPlayer from '../src/components/PopVectorPlayer.jsx';
import KineticVisualizer from '../src/components/KineticVisualizer.jsx';

vi.mock('../src/components/VectorSodaCan.jsx', () => ({ default: () => null }));
vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal()),
  WebGLRenderer: class {
    domElement = document.createElement('canvas');
    renderLists = { dispose() {} };
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
    forceContextLoss() {}
  },
}));
let root;
let container;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    beginPath() {},
    arc() {},
    fill() {},
    stroke() {},
  });
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'suspended';
      createAnalyser() {
        return {
          fftSize: 256,
          frequencyBinCount: 128,
          getByteFrequencyData() {},
          connect() {},
          disconnect() {},
        };
      }
      createMediaElementSource() {
        return { connect() {}, disconnect() {} };
      }
      createBufferSource() {
        return { connect() {}, disconnect() {}, start() {}, stop() {} };
      }
      async decodeAudioData() {
        return {};
      }
      async suspend() {
        this.state = 'suspended';
      }
      async resume() {
        this.state = 'running';
      }
      async close() {
        this.state = 'closed';
      }
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('audio is acquired only on explicit playback', () => {
  it('keeps the drink audio source unset on entry and after selecting another track', async () => {
    await act(async () => root.render(<PopVectorPlayer onClose={() => {}} />));
    const audio = container.querySelector('audio');
    expect(audio.getAttribute('src')).toBeNull();
    expect(audio.preload).toBe('none');
    const next = container.querySelector('[aria-label="次の曲"]');
    await act(async () => next.click());
    expect(audio.getAttribute('src')).toBeNull();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
  it('does not fetch/decode a popcorn song before Play, including after song selection', async () => {
    const fetch = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal('fetch', fetch);
    await act(async () => root.render(<KineticVisualizer onClose={() => {}} />));
    expect(fetch).not.toHaveBeenCalled();
    const choices = [...container.querySelectorAll('.song-button')];
    // The initial source must stay idle regardless of whether the song list is expanded.
    for (const choice of choices) await act(async () => choice.click());
    expect(fetch).not.toHaveBeenCalled();
    expect(
      [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Play')
        ?.disabled,
    ).toBe(false);
  });
  it('plays the requested drink and discards an old pending Play after track selection', async () => {
    let complete;
    HTMLMediaElement.prototype.play.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    await act(async () => root.render(<PopVectorPlayer onClose={() => {}} />));
    const audio = container.querySelector('audio');
    const play = [...container.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === 'PLAY',
    );
    await act(async () => play.click());
    expect(audio.getAttribute('src')).toContain('.mp3');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    await act(async () => container.querySelector('[aria-label="次の曲"]').click());
    await act(async () => complete());
    expect(audio.getAttribute('src')).toBeNull();
    expect(
      [...container.querySelectorAll('button')].some((b) => b.textContent.trim() === 'PAUSE'),
    ).toBe(false);
  });
  it('fetches and starts popcorn audio on Play, pauses and resumes without another download', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
    vi.stubGlobal('fetch', fetch);
    await act(async () => root.render(<KineticVisualizer onClose={() => {}} />));
    const button = () =>
      [...container.querySelectorAll('button')].find((b) =>
        ['Play', 'Pause'].includes(b.textContent.trim()),
      );
    await act(async () => button().click());
    expect(fetch).toHaveBeenCalledOnce();
    expect(button().textContent).toBe('Pause');
    await act(async () => button().click());
    expect(button().textContent).toBe('Play');
    await act(async () => button().click());
    expect(fetch).toHaveBeenCalledOnce();
    expect(button().textContent).toBe('Pause');
  });
});
