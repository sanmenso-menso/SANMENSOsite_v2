import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const readPublicConfig = (name) => readFile(new URL(`../public/${name}`, import.meta.url), 'utf8');

describe('static hosting security and routing', () => {
  it('serves only known SPA content routes and returns a real 404 for unknown IDs', async () => {
    const redirects = await readPublicConfig('_redirects');

    expect(redirects).toContain('/contents/pop-vector-player');
    expect(redirects).toContain('/contents/kinetic-visualizer');
    expect(redirects).toMatch(/\/contents\/\*\s+\/404\.html\s+404/);
    expect(redirects).not.toMatch(/\/contents\/\*\s+\/index\.html\s+200/);
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
