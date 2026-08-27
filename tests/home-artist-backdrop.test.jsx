import React from 'react';
import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomeArtistBackdrop from '../src/components/HomeArtistBackdrop.jsx';

describe('home artist backdrop', () => {
  it('renders the reference typography as a decorative, non-interactive layer', () => {
    const markup = renderToStaticMarkup(<HomeArtistBackdrop />);

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('data-home-artist-backdrop="true"');
    expect(markup.match(/class="home-artist-backdrop__service"/g)).toHaveLength(4);
    for (const label of ['音楽', 'DJ', '映像', 'デザイン', '三', '面', '相']) {
      expect(markup).toContain(label);
    }
    expect(markup).not.toMatch(/<(?:a|button|input)\b/);
  });

  it('is mounted only inside the HOME route behind the cube and notice layers', async () => {
    const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
    const componentSource = await readFile(
      new URL('../src/components/HomeArtistBackdrop.jsx', import.meta.url),
      'utf8',
    );
    const cssSource = await readFile(
      new URL('../src/components/HomeArtistBackdrop.css', import.meta.url),
      'utf8',
    );

    expect(appSource.match(/<HomeArtistBackdrop \/>/g)).toHaveLength(1);
    expect(componentSource).toContain('aria-hidden="true"');
    expect(cssSource).toContain('z-index: 0');
    expect(cssSource).toContain('pointer-events: none');
    expect(cssSource).toContain('overflow: hidden');
    expect(cssSource).toContain("'A-OTF Futo Go B101 Pr6N'");
    expect(cssSource).toContain('width: fit-content');
    expect(cssSource).toContain('max-width: 100%');
    expect(cssSource).not.toContain('translateY(-51%)');
    expect(cssSource).toContain('justify-content: flex-start');
    expect(cssSource).toContain('justify-content: center');
    expect(cssSource).not.toContain('justify-content: space-evenly');
    expect(cssSource).toContain('gap: clamp(0.55rem, 1.8vh, 1rem)');
    expect(cssSource).toContain('gap: clamp(0.4rem, 1.4vh, 0.7rem)');
    expect(cssSource).toContain('text-align: left');
    expect(cssSource.match(/background: transparent/g)).toHaveLength(2);
    expect(cssSource.match(/border-radius: 999px/g)).toHaveLength(2);
    expect(cssSource).not.toContain('border-radius: 50% / 7%');
    expect(cssSource).not.toContain('home-artist-backdrop__service:nth-child');
    expect(cssSource).toContain('border: clamp(3px, 0.3vw, 5px) solid currentColor');
    expect(cssSource).toContain('width: clamp(6.5rem, 11vw, 10rem)');
    expect(cssSource).toContain('height: clamp(17.5rem, 47vh, 29rem)');
    expect(cssSource).toContain('height: clamp(13rem, 36vh, 17.5rem)');
    expect(cssSource).toContain('height: 44vh');
    expect(cssSource).toContain('height: 41vh');
    expect(cssSource).toContain('min-height: clamp(5.5rem, 10.8vw, 10rem)');
    expect(cssSource).toContain('min-height: 3.25rem');
    expect(cssSource).toContain('min-height: clamp(3rem, 12vh, 4.8rem)');
    expect(cssSource).toContain('min-height: 2.75rem');
    expect(cssSource).toContain('margin-top: clamp(-1.3rem, -1.4vw, -0.7rem)');
    expect(cssSource).toContain('margin-top: -0.45rem');
    expect(cssSource).toContain('padding: 0.1em clamp(1rem, 2.2vw, 2rem)');
    expect(cssSource).toContain('padding-inline: clamp(0.65rem, 3.2vw, 1rem)');
    expect(cssSource).toContain('padding-block: 0');
  });
});
