// @ts-check
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

import { linkKey, safeImage, safeLink } from '../src/utils/portfolio.js';

/** A URL match is preferred. Unlinked events need a unique title and year match. */
export function existingImage(work, candidates) {
  if (work.image) return safeImage(work.image);
  if (work.url) {
    const matches = candidates.filter(
      (candidate) => candidate.url && linkKey(candidate.url) === linkKey(work.url),
    );
    return matches.length === 1 ? safeImage(matches[0].image) : '';
  }
  const normalize = (value) => String(value).normalize('NFKC').trim();
  const matches = candidates.filter(
    (candidate) =>
      !candidate.url &&
      normalize(candidate.title) === normalize(work.title) &&
      String(candidate.year) === work.date.slice(0, 4),
  );
  return matches.length === 1 ? safeImage(matches[0].image) : '';
}

const imageHosts = new Set(['i.ytimg.com', 'pbs.twimg.com', 'shared.akamai.steamstatic.com']);

export function validateMedia(entries) {
  if (!Array.isArray(entries)) throw new Error('portfolio-media.json は配列にしてください。');
  const keys = new Set();
  return entries.map((entry) => {
    const key = linkKey(entry.url);
    if (!key || keys.has(key)) throw new Error('画像補完の作品URLが空、または重複しています。');
    keys.add(key);
    const image = safeImage(entry.image);
    if (!image) throw new Error('画像補完の保存先を指定してください。');
    const sourceUrl = safeLink(entry.sourceUrl);
    if (!sourceUrl || !imageHosts.has(new URL(sourceUrl).hostname)) {
      throw new Error('画像の取得先は確認済みの公式画像ホストを指定してください。');
    }
    return { key, image, sourceUrl };
  });
}

async function imageBytes(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!response.ok) throw new Error(`画像取得HTTP ${response.status}`);
  if (!/^image\/(jpeg|png|webp)/i.test(response.headers.get('content-type') || '')) {
    throw new Error('取得したデータが画像ではありません。');
  }
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > 10 * 1024 * 1024) throw new Error('画像が10MBを超えています。');
  const chunks = [];
  let length = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 10 * 1024 * 1024) throw new Error('画像が10MBを超えています。');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
  }
  const bytes = Buffer.concat(chunks);
  const metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.width || metadata.width < 320 || !metadata.height || metadata.height < 180) {
    throw new Error('画像の解像度が小さすぎます（削除済み動画の代替画像など）。');
  }
  return sharp(bytes, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

async function storeImage(root, image, sources) {
  const target = path.join(root, 'public', decodeURIComponent(safeImage(image)));
  try {
    await access(target);
    return image;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  let lastError;
  for (const source of sources) {
    try {
      const bytes = await imageBytes(source);
      await mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, bytes, { flag: 'wx' });
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true });
      }
      return image;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Explicit Sheet image > curated source > existing asset > automatic YouTube thumbnail. */
export async function enrichImages(portfolio, root, candidates, media) {
  const overrides = validateMedia(media);
  const works = [];
  for (const work of portfolio.works) {
    let image = work.image;
    const key = linkKey(work.url);
    if (!image) {
      const override = overrides.find((entry) => entry.key === key);
      if (override) image = await storeImage(root, override.image, [override.sourceUrl]);
      else image = existingImage(work, candidates);
    }
    if (!image && /^youtube:[\w-]{11}$/.test(key)) {
      const id = key.slice('youtube:'.length);
      image = await storeImage(root, `/images/portfolio/youtube-${id}.webp`, [
        `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      ]);
    }
    if (image) await access(path.join(root, 'public', decodeURIComponent(safeImage(image))));
    works.push({ ...work, image });
  }
  return { ...portfolio, works };
}

export async function readMedia(root) {
  return JSON.parse(await readFile(path.join(root, 'portfolio-media.json'), 'utf8'));
}
