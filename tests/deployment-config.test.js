import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';
import { buildNotFoundHtml } from '../scripts/build-404.js';

const readPublicConfig = (name) => readFile(new URL(`../public/${name}`, import.meta.url), 'utf8');

describe('static hosting security and routing', () => {
  it('serves only known SPA content routes and returns a real 404 for unknown IDs', async () => {
    const redirects = await readPublicConfig('_redirects');

    expect(redirects).toContain('/contents/pop-vector-player');
    expect(redirects).toContain('/contents/kinetic-visualizer');
    for (const route of [
      '/portfolio',
      '/portfolio/',
      '/portfolio/about',
      '/portfolio/works',
      '/portfolio/works/',
      '/portfolio/contact',
    ])
      expect(redirects).toMatch(new RegExp(`^${route.replaceAll('/', '\\/')}\\s+\\/\\s+200$`, 'm'));
    expect(redirects).not.toMatch(/\s404(?:\s|$)/);
    expect(redirects).not.toContain('/index.html');
    expect(redirects).not.toMatch(/\/portfolio\/\*/);
    expect(redirects).not.toMatch(/\/contents\/\*/);
  });

  it('preserves the compiled app for the original 404 design and excludes it from indexing', () => {
    const entry =
      '<html><head><title>Site</title><link rel="canonical" href="https://sanmenso.com/" /><script type="module" src="/assets/index-release.js"></script><link rel="stylesheet" href="/assets/index-release.css" /></head><body><div id="root"></div></body></html>';
    const html = buildNotFoundHtml(entry);
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('ページが見つかりません');
    expect(html).toContain('src="/assets/index-release.js"');
    expect(html).toContain('href="/assets/index-release.css"');
    expect(html).not.toContain('rel="canonical"');
    expect(() => buildNotFoundHtml('<h1>404</h1>')).toThrow();
  });

  it('declares browser hardening headers without third-party font or image allowlists', async () => {
    const headers = await readPublicConfig('_headers');

    expect(headers).toContain('Strict-Transport-Security: max-age=31536000');
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("img-src 'self' data:");
    expect(headers).toContain("font-src 'self' data:");
    expect(headers).not.toContain('fonts.googleapis.com');
    expect(headers).not.toContain('fonts.gstatic.com');
    expect(headers).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(headers).toContain('frame-src https://challenges.cloudflare.com');
    expect(headers).toMatch(/\/data\/portfolio\.json\s+Cache-Control: no-cache/);
  });

  it('limits Pages Functions routing to the contact endpoint', async () => {
    const routes = JSON.parse(await readPublicConfig('_routes.json'));
    expect(routes).toEqual({ version: 1, include: ['/api/contact'], exclude: [] });
  });
});
