import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { generateResponsiveImages } from '../scripts/responsive-images.js';

it('preserves sources, generates bounded variants and changes URLs when the image changes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sanmenso-responsive-'));
  try {
    const dir = path.join(root, 'public/images/portfolio-graphics');
    await mkdir(dir, { recursive: true });
    const source = '/images/portfolio-graphics/about-portrait.webp';
    const filename = path.join(root, 'public', source);
    const bytes = await sharp({
      create: { width: 500, height: 800, channels: 3, background: '#aabbcc' },
    })
      .webp()
      .toBuffer();
    await writeFile(filename, bytes);
    const portfolio = { works: [{ image: source }] };
    const first = await generateResponsiveImages(root, portfolio);
    expect(await readFile(filename)).toEqual(bytes);
    expect(first[source].srcSet.split(', ')).toHaveLength(2);
    for (const item of first[source].srcSet.split(', ')) {
      const [url, width] = item.split(' ');
      const metadata = await sharp(await readFile(path.join(root, 'public', url))).metadata();
      expect(metadata.width).toBe(Number(width.slice(0, -1)));
      expect(metadata.width).toBeLessThanOrEqual(500);
      expect(metadata.height / metadata.width).toBeCloseTo(800 / 500, 2);
    }
    await writeFile(filename, await sharp(bytes).negate().webp().toBuffer());
    const second = await generateResponsiveImages(root, portfolio);
    expect(second[source].src).not.toBe(first[source].src);
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  }
});
