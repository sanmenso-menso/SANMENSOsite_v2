// @vitest-environment jsdom
/* global window, document, MouseEvent */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PortfolioBackdrop from '../src/components/PortfolioBackdrop.jsx';

let root;
let container;
let motion;

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  motion = { matches: false };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => motion),
  );
  container = document.createElement('div');
  container.className = 'portfolio-page';
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(PortfolioBackdrop),
        React.createElement('button', { onClick: () => {} }, '操作'),
        React.createElement('input', { 'aria-label': '入力' }),
      ),
    ),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const fold = () => container.querySelector('.portfolio-backdrop').dataset.fold;

it('changes connected folds only on portfolio clicks, while leaving the control action intact', async () => {
  vi.useFakeTimers();
  const button = container.querySelector('button');
  const controlAction = vi.fn();
  button.addEventListener('click', controlAction);
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  try {
    expect(fold()).toBe('0');
    await act(async () => {
      window.dispatchEvent(new Event('scroll'));
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
      button.dispatchEvent(new Event('mouseover', { bubbles: true }));
      outside.click();
      vi.advanceTimersByTime(60_000);
    });
    expect(fold()).toBe('0');
    for (const expected of ['1', '2', '3', '0']) {
      await act(async () => button.click());
      expect(fold()).toBe(expected);
    }
    expect(controlAction).toHaveBeenCalledTimes(4);
    expect(container.querySelectorAll('.portfolio-fold-panel')).toHaveLength(3);
    const first = container.querySelector('.portfolio-fold-panel-0');
    const second = first.querySelector('.portfolio-fold-panel-1');
    expect(second.querySelector('.portfolio-fold-panel-2')).not.toBeNull();
    expect(container.querySelector('.portfolio-backdrop').getAttribute('aria-hidden')).toBe('true');
  } finally {
    outside.remove();
  }
});

it('supports clicks on inputs and keyboard activation without reacting to typing or right clicks', async () => {
  const input = container.querySelector('input');
  await act(async () => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 2 }));
  });
  expect(fold()).toBe('0');
  await act(async () => input.click());
  expect(fold()).toBe('1');
  const button = container.querySelector('button');
  await act(async () =>
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })),
  );
  expect(fold()).toBe('2');
});

it('respects changes to reduced-motion preference and cleans up the click observer on unmount', async () => {
  const remove = vi.spyOn(document, 'removeEventListener');
  const button = container.querySelector('button');
  motion.matches = true;
  await act(async () => button.click());
  expect(fold()).toBe('0');
  motion.matches = false;
  await act(async () => button.click());
  expect(fold()).toBe('1');
  motion.matches = true;
  await act(async () => button.click());
  expect(fold()).toBe('1');
  await act(async () => root.render(null));
  expect(remove).toHaveBeenCalledWith('click', expect.any(Function), true);
  remove.mockRestore();
});
