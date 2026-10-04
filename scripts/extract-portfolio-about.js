import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) throw new Error('about タイポ.svg のパスを指定してください。');
const source = await readFile(path.resolve(input), 'utf8');
const document = new JSDOM(source, { contentType: 'image/svg+xml' }).window.document;
const svg = document.documentElement;
const attributes = new Set([
  'id',
  'data-name',
  'xmlns',
  'xmlns:xlink',
  'version',
  'viewBox',
  'transform',
  'font-family',
  'font-weight',
  'font-size',
  'letter-spacing',
  'x',
  'y',
  'width',
  'height',
  'xml:space',
  'xlink:href',
  'href',
]);
for (const node of document.querySelectorAll('*')) {
  if (!['svg', 'g', 'text', 'tspan', 'image'].includes(node.localName))
    throw new Error(`未対応のSVG要素: ${node.localName}`);
  for (const attribute of [...node.attributes]) {
    if (!attributes.has(attribute.name) || /url\(/i.test(attribute.value))
      throw new Error(`未対応のSVG属性: ${attribute.name}`);
    if (['id', 'data-name', 'version', 'xmlns', 'xmlns:xlink'].includes(attribute.name))
      node.removeAttribute(attribute.name);
  }
}
if (svg.getAttribute('viewBox') !== '0 0 1920 1080')
  throw new Error('元の1920×1080の配置を確認してください。');
const images = [...svg.querySelectorAll('image')];
if (images.length !== 1) throw new Error('プロフィール画像が1点ではありません。');
const image = images[0];
const href = image.getAttribute('xlink:href') || image.getAttribute('href');
if (!/^data:image\/png;base64,[A-Za-z0-9+/=\s]+$/.test(href || ''))
  throw new Error('埋め込みPNG以外の画像は取り込めません。');
const directory = path.join(root, 'public/images/portfolio-graphics');
await mkdir(directory, { recursive: true });
await sharp(Buffer.from(href.split(',')[1], 'base64'))
  .resize({ width: 768, withoutEnlargement: true })
  .webp({ quality: 94 })
  .toFile(path.join(directory, 'about-portrait.webp'));
const originals = path.join(root, 'src/assets/images_original');
await mkdir(originals, { recursive: true });
const original = path.join(originals, 'portfolio-about-typography.svg');
if (path.resolve(input) !== original) await copyFile(path.resolve(input), original);
console.log(
  'Aboutの原版とプロフィール画像を更新しました。ページの配置・本文はコンポーネントで調整します。',
);
