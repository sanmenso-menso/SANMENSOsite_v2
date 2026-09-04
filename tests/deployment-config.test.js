import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const readPublicConfig = (name) => readFile(new URL(`../public/${name}`, import.meta.url), 'utf8');

describe('static hosting security and routing', () => {
  it('serves only known SPA content routes and returns a real 404 for unknown IDs', async () => {
    const redirects = await readPublicConfig('_redirects');
    const notFoundPage = await readPublicConfig('404.html');

    for (const route of [
      '/works',
      '/works/',
      '/links',
      '/links/',
      '/contact',
      '/contact/',
      '/secret',
      '/secret/',
      '/contents',
      '/contents/',
      '/contents/pop-vector-player',
      '/contents/pop-vector-player/',
      '/contents/kinetic-visualizer',
      '/contents/kinetic-visualizer/',
    ]) {
      expect(redirects).toMatch(new RegExp(`^${route.replaceAll('/', '\\/')}\\s+\\/\\s+200$`, 'm'));
    }

    expect(redirects).not.toContain('/index.html');
    expect(redirects).not.toMatch(/\s404(?:\s|$)/);
    expect(notFoundPage).toContain('<!doctype html>');
  });

  it('declares browser hardening headers without third-party font or image allowlists', async () => {
    const headers = await readPublicConfig('_headers');

    expect(headers).toContain('Strict-Transport-Security: max-age=31536000');
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("img-src 'self' data:");
    expect(headers).toContain("font-src 'self' data:");
    expect(headers).not.toContain('fonts.googleapis.com');
    expect(headers).not.toContain('fonts.gstatic.com');
  });
});
