import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { enrichImages, existingImage, validateMedia } from '../scripts/portfolio-media.js';

let temporary;
afterEach(async () => {
  vi.unstubAllGlobals();
  if (temporary) await rm(temporary, { recursive: true, force: true });
  temporary = undefined;
});

describe('portfolio image resolution', () => {
  it('matches unlinked event posters only when title and year are unique', () => {
    const work = { title: 'イベント', date: '2025-10-19', url: '', image: '' };
    const candidate = { title: 'イベント', year: 2025, image: '/images/poster.jpg' };
    expect(existingImage(work, [candidate])).toBe('/images/poster.jpg');
    expect(existingImage(work, [candidate, candidate])).toBe('');
    expect(existingImage(work, [{ ...candidate, year: 2024 }])).toBe('');
    expect(existingImage(work, [{ ...candidate, url: 'https://example.com/other' }])).toBe('');
  });

  it('uses canonical video links and preserves explicit sheet images', () => {
    const work = { title: '作品', date: '2026', url: 'https://youtu.be/abcdefghijk', image: '' };
    const candidate = {
      url: 'https://www.youtube.com/watch?v=abcdefghijk',
      image: '/images/video.jpg',
    };
    expect(existingImage(work, [candidate])).toBe('/images/video.jpg');
    expect(existingImage({ ...work, image: '/images/sheet.jpg' }, [candidate])).toBe(
      '/images/sheet.jpg',
    );
  });

  it('rejects unverified hosts, unsafe destinations and duplicate curated URLs', () => {
    const entry = {
      url: 'https://example.com/work',
      image: '/images/portfolio/poster.webp',
      sourceUrl: 'https://pbs.twimg.com/media/poster.jpg',
    };
    expect(validateMedia([entry])).toHaveLength(1);
    expect(() => validateMedia([{ ...entry, sourceUrl: 'https://example.com/p.jpg' }])).toThrow();
    expect(() => validateMedia([{ ...entry, image: '/images/../data/portfolio.json' }])).toThrow();
    expect(() => validateMedia([entry, entry])).toThrow();
  });

  it('falls back from tiny deleted-video placeholders and caches a real WebP thumbnail', async () => {
    temporary = await mkdtemp(path.join(os.tmpdir(), 'portfolio-media-'));
    const tiny = await sharp({
      create: { width: 120, height: 90, channels: 3, background: 'black' },
    })
      .jpeg()
      .toBuffer();
    const thumbnail = await sharp({
      create: { width: 480, height: 360, channels: 3, background: 'blue' },
    })
      .jpeg()
      .toBuffer();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(tiny, { headers: { 'content-type': 'image/jpeg' } }))
      .mockResolvedValueOnce(
        new Response(thumbnail, { headers: { 'content-type': 'image/jpeg' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const portfolio = {
      works: [{ title: '動画', date: '2026', url: 'https://youtu.be/abcdefghijk', image: '' }],
    };
    const result = await enrichImages(portfolio, temporary, [], []);
    const image = result.works[0].image;
    expect(image).toBe('/images/portfolio/youtube-abcdefghijk.webp');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://i.ytimg.com/vi/abcdefghijk/maxresdefault.jpg',
      'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
    ]);
    const metadata = await sharp(await readFile(path.join(temporary, 'public', image))).metadata();
    expect(metadata).toMatchObject({ format: 'webp', width: 480, height: 360 });
    await enrichImages(portfolio, temporary, [], []);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
