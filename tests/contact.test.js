import { describe, expect, it, vi } from 'vitest';
import { handleContact, validateContact } from '../server/contact.js';
import { onRequest } from '../functions/api/contact.js';

const env = {
  RESEND_API_KEY: 'PRIVATE-API',
  CONTACT_FROM: 'portfolio@sanmenso.com',
  TURNSTILE_SITE_KEY: 'public-site-key',
  TURNSTILE_SECRET_KEY: 'PRIVATE-TURNSTILE',
};
const fields = {
  name: 'テスト',
  email: 'client@example.com',
  role: '作曲、映像',
  deadline: '年内',
  budget: '相談',
  message: 'ご相談です。\n参考資料があります。',
  submissionId: '11111111-1111-4111-8111-111111111111',
  token: 'verified-token',
  website: '',
};
const request = (data = fields, options = {}) =>
  new Request('https://sanmenso.com/api/contact', {
    method: 'POST',
    headers: { Origin: 'https://sanmenso.com', 'Content-Type': 'application/json', ...options },
    body: JSON.stringify(data),
  });
const verified = (overrides = {}) =>
  new Response(
    JSON.stringify({
      success: true,
      hostname: 'sanmenso.com',
      action: 'portfolio-contact',
      ...overrides,
    }),
  );

describe('Cloudflare contact API', () => {
  it('reports setup status without exposing API keys, including through the Pages adapter', async () => {
    const req = new Request('https://sanmenso.com/api/contact');
    const ready = await onRequest({ request: req, env });
    expect(await ready.json()).toEqual({ available: true, siteKey: 'public-site-key' });
    const missing = await handleContact(req, {});
    expect(await missing.json()).toEqual({ available: false, siteKey: '' });
    const send = vi.fn();
    const disabled = await handleContact(request(), {}, send);
    expect(disabled.status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
  it('verifies Turnstile before sending all six fields to the fixed recipient', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(verified())
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'accepted-mail' })));
    const response = await handleContact(
      request({ ...fields, to: 'attacker@example.com' }),
      env,
      send,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(send.mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const [url, options] = send.mock.calls[1];
    expect(url).toBe('https://api.resend.com/emails');
    const mail = JSON.parse(options.body);
    expect(mail.to).toEqual(['sanmensoworks@gmail.com']);
    expect(mail.reply_to).toBe(fields.email);
    expect(mail.from).toBe(env.CONTACT_FROM);
    for (const key of ['name', 'email', 'role', 'deadline', 'budget', 'message'])
      expect(mail.text).toContain(fields[key]);
    expect(options.headers['Idempotency-Key']).toBe(`portfolio-contact/${fields.submissionId}`);
    expect(mail.text).not.toContain('verified-token');
  });
  it.each([{ success: false }, { hostname: 'other.example.com' }, { action: 'other-form' }])(
    'rejects invalid, expired or wrong-site Turnstile tokens before email: %j',
    async (validation) => {
      const send = vi.fn().mockResolvedValue(verified(validation));
      expect((await handleContact(request(), env, send)).status).toBe(400);
      expect(send).toHaveBeenCalledTimes(1);
    },
  );
  it('rejects foreign origins, wrong content types, honeypots and oversized payloads', async () => {
    const send = vi.fn();
    expect(
      (await handleContact(request(fields, { Origin: 'https://other.example.com' }), env, send))
        .status,
    ).toBe(403);
    expect(
      (await handleContact(request(fields, { 'Content-Type': 'text/plain' }), env, send)).status,
    ).toBe(415);
    expect(
      (await handleContact(request({ ...fields, website: 'spam.example.com' }), env, send)).status,
    ).toBe(400);
    expect(
      (await handleContact(request({ ...fields, extra: 'x'.repeat(25000) }), env, send)).status,
    ).toBe(400);
    const invalid = await handleContact(request(null), env, send);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: '入力内容を確認してください。' });
    expect(send).not.toHaveBeenCalled();
  });
  it('validates mandatory fields, email, single-line headers and limits', () => {
    for (const key of ['name', 'email', 'role', 'message'])
      expect(() => validateContact({ ...fields, [key]: '' })).toThrow();
    expect(() => validateContact({ ...fields, email: 'invalid' })).toThrow();
    expect(() => validateContact({ ...fields, name: 'bad\nheader' })).toThrow();
    expect(() => validateContact({ ...fields, message: 'x'.repeat(5001) })).toThrow();
    expect(validateContact({ ...fields, budget: '', deadline: '' })).toMatchObject({
      budget: '',
      deadline: '',
    });
  });
  it('never reports success for provider failures, timeouts or malformed success bodies', async () => {
    for (const provider of [
      new Response('SECRET-provider-detail', { status: 500 }),
      new Response('<html>ok</html>'),
      new Response('{}'),
    ]) {
      const send = vi.fn().mockResolvedValueOnce(verified()).mockResolvedValueOnce(provider);
      const response = await handleContact(request(), env, send);
      expect(response.status).toBe(502);
      expect(await response.text()).not.toMatch(/PRIVATE|SECRET|ok":true/);
    }
    const send = vi.fn().mockRejectedValue(new Error('PRIVATE timeout'));
    expect((await handleContact(request(), env, send)).status).toBe(502);
  });
});
