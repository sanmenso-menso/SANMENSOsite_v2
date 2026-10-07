// @vitest-environment jsdom
/* global document, window */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createAnimationLoop } from '../src/utils/animation-loop.js';
let callbacks;
let hidden;
let loop;
let intersect;
beforeEach(() => {
  callbacks = new Map();
  hidden = false;
  let id = 0;
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callbacks.set(++id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => callbacks.delete(id));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  loop?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const step = (time) => {
  const pending = [...callbacks.values()];
  callbacks.clear();
  pending.forEach((callback) => callback(time));
};

it('stops scheduling on a hidden page and offscreen element, resumes with a bounded delta', () => {
  const draw = vi.fn();
  loop = createAnimationLoop(draw, { element: document.body });
  step(16);
  expect(callbacks.size).toBe(1);
  hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  expect(callbacks.size).toBe(0);
  const count = draw.mock.calls.length;
  step(10000);
  expect(draw).toHaveBeenCalledTimes(count);
  hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  step(10016);
  expect(draw.mock.calls.at(-1)[0]).toBeLessThanOrEqual(100);
  intersect([{ isIntersecting: false }]);
  expect(callbacks.size).toBe(0);
  intersect([{ isIntersecting: true }]);
  expect(callbacks.size).toBe(1);
  loop.dispose();
  document.dispatchEvent(new Event('visibilitychange'));
  expect(callbacks.size).toBe(0);
});
it('leaves no ongoing frame when inactive and can restart on interaction', () => {
  let active = false;
  loop = createAnimationLoop(vi.fn(), { active: () => active });
  expect(callbacks.size).toBe(0);
  active = true;
  loop.invalidate();
  expect(callbacks.size).toBe(1);
  active = false;
  step(16);
  expect(callbacks.size).toBe(0);
});
it('caps updates independently of a high refresh rate display', () => {
  const draw = vi.fn();
  loop = createAnimationLoop(draw, { fps: () => 30 });
  for (let time = 0; time <= 1000; time += 8.333) step(time);
  expect(draw.mock.calls.length).toBeLessThanOrEqual(32);
  expect(draw.mock.calls.length).toBeGreaterThanOrEqual(28);
});
