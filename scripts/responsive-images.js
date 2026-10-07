// @ts-check
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { safeImage } from '../src/utils/portfolio.js';

/** Preserve originals; content-addressed variants also avoid stale CDN thumbnails. */
export async function generateResponsiveImages(root, portfolio) {
  portfolio ??= JSON.parse(await readFile(path.join(root, 'public/data/portfolio.json'), 'utf8'));
  const images = {};
  const sources = new Set(portfolio.works.map((work) => work.image).filter(Boolean));
  sources.add('/images/portfolio-graphics/about-portrait.webp');
  const target = path.join(root, 'public/images/responsive');
  await mkdir(target, { recursive: true });
  for (const source of sources) {
    const bytes = await readFile(path.join(root, 'public', decodeURIComponent(safeImage(source))));
    const { width, height } = await sharp(bytes).metadata();
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const widths = [...new Set([320, 640, 960].map((size) => Math.min(size, width)))];
    const variants = [];
    for (const size of widths) {
      const filename = `${hash}-${size}.webp`;
      await sharp(bytes)
        .resize({ width: size, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(target, filename));
      variants.push({ width: size, src: `/images/responsive/${filename}` });
    }
    images[source] = {
      src: variants[Math.min(1, variants.length - 1)].src,
      srcSet: variants.map((v) => `${v.src} ${v.width}w`).join(', '),
      width,
      height,
    };
  }
  await mkdir(path.join(root, 'src/generated'), { recursive: true });
  await writeFile(
    path.join(root, 'src/generated/portfolio-images.json'),
    JSON.stringify(images, null, 2) + '\n',
  );
  return images;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateResponsiveImages(process.cwd());
}
