import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  EXCAVATION_LINKS,
  KINETIC_VISUALIZER_SONGS,
  SOCIAL_LINKS,
  SONGS,
  WORKS_DATA,
} from '../src/constants.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const expectPublicFile = async (publicUrl) => {
  expect(publicUrl).toMatch(/^\//);
  await expect(
    access(path.join(repositoryRoot, 'public', publicUrl.slice(1))),
  ).resolves.toBeUndefined();
};

describe('published content integrity', () => {
  it('keeps work IDs unique and the corrected ID 50 URL', () => {
    const ids = WORKS_DATA.map((work) => work.id);
    expect(new Set(ids).size).toBe(ids.length);

    const work49 = WORKS_DATA.find((work) => work.id === 49);
    const work50 = WORKS_DATA.find((work) => work.id === 50);
    expect(work50?.url).toBe('https://www.nicovideo.jp/watch/sm45639345');
    expect(work49?.url).not.toBe(work50?.url);
  });

  it('uses HTTPS for every external content link', () => {
    const urls = [
      ...WORKS_DATA.map((work) => work.url),
      ...EXCAVATION_LINKS.map((link) => link.url),
      ...SOCIAL_LINKS.map((link) => link.url),
    ].filter(Boolean);

    expect(urls.every((url) => url.startsWith('https://'))).toBe(true);
  });

  it('references only existing local work images', async () => {
    await Promise.all(WORKS_DATA.map((work) => expectPublicFile(work.image)));
  });

  it('references only existing local audio files', async () => {
    await Promise.all(
      [...SONGS, ...KINETIC_VISUALIZER_SONGS].map((song) => expectPublicFile(song.src)),
    );
  });

  it('does not auto-load third-party reciprocal-link images', async () => {
    for (const link of EXCAVATION_LINKS) {
      expect(link.image == null || link.image.startsWith('/images/')).toBe(true);
      if (link.image) await expectPublicFile(link.image);
    }
  });
});
