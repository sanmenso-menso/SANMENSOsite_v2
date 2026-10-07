// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import FlowingWorksLane from '../src/components/FlowingWorksLane.jsx';

it('keeps manual drag inertia working while automatic scrolling is stopped', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const frames = new Map();
  let next = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frames.set(++next, callback); return next; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => frames.delete(id));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<FlowingWorksLane
      works={[{ id: 1, title: 'Test', role: 'Music', year: '2026', categories: ['music'], attributes: [], workKind: 'original' }]}
      onOpen={() => {}} isStopped isDialogOpen={false}
    />));
    const viewport = container.querySelector('.works-flow-viewport');
    viewport.setPointerCapture = () => {};
    viewport.hasPointerCapture = () => false;
    const pointer = async (type, x, time) => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0 });
      Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'mouse' }, isPrimary: { value: true }, timeStamp: { value: time } });
      await act(async () => viewport.dispatchEvent(event));
    };
    expect(frames.size).toBe(0);
    await pointer('pointerdown', 200, 0);
    await pointer('pointermove', 100, 100);
    await pointer('pointerup', 100, 101);
    const released = viewport.scrollLeft;
    const pending = [...frames.values()]; frames.clear();
    await act(async () => pending.forEach(callback => callback(120)));
    expect(viewport.scrollLeft).toBeGreaterThan(released);
    // Once inertia decays, the paused lane must have no scheduled frame.
    for (let time = 160; time < 10000 && frames.size; time += 40) {
      const pending = [...frames.values()]; frames.clear();
      await act(async () => pending.forEach(callback => callback(time)));
    }
    expect(frames.size).toBe(0);
  } finally {
    await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  }
});
