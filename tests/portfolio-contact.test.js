// @vitest-environment jsdom
/* global document, window */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PortfolioContactForm from '../src/components/PortfolioContactForm.jsx';

let root, container, callback;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubGlobal('FormData', window.FormData);
  window.turnstile = {
    render: vi.fn((_target, options) => {
      callback = options.callback;
      return 'widget';
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  delete window.turnstile;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
async function render() {
  await act(async () => root.render(React.createElement(PortfolioContactForm)));
}
function fill() {
  for (const [name, value] of Object.entries({
    name: '依頼者',
    email: 'client@example.com',
    role: '映像',
    deadline: '年内',
    budget: '相談',
    message: 'ご相談したいです。',
  }))
    container.querySelector(`[name="${name}"]`).value = value;
}
async function submit() {
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
}

it('keeps all six fields usable, but blocks sending when the provider is not configured', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ available: false }) });
  vi.stubGlobal('fetch', fetchMock);
  await render();
  fill();
  expect(container.querySelectorAll('.portfolio-form-grid input, textarea')).toHaveLength(6);
  expect(container.querySelector('button').disabled).toBe(true);
  expect(container.textContent).toContain('送信は準備中');
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('retains inputs and the request ID on failure, then clears them only after a confirmed success', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true, siteKey: 'public-key' }),
    })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: '送信に失敗しました。' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal('fetch', fetchMock);
  await render();
  fill();
  await act(async () => callback('verified-1'));
  await submit();
  expect(container.querySelector('[role=alert]').textContent).toContain('送信に失敗');
  expect(container.querySelector('[name=message]').value).toBe('ご相談したいです。');
  expect(container.querySelector('button').disabled).toBe(true);
  await act(async () => callback('verified-2'));
  await submit();
  expect(container.textContent).toContain('送信しました');
  expect(container.querySelector('[name=message]').value).toBe('');
  const first = JSON.parse(fetchMock.mock.calls[1][1].body);
  const second = JSON.parse(fetchMock.mock.calls[2][1].body);
  expect(first.submissionId).toBe(second.submissionId);
  expect(second.token).toBe('verified-2');
  expect(first).toMatchObject({
    name: '依頼者',
    email: 'client@example.com',
    role: '映像',
    deadline: '年内',
    budget: '相談',
    message: 'ご相談したいです。',
  });
});
