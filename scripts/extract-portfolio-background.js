import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
const side = process.argv[3] || 'combined';
if (!input || !['combined', 'surface', 'line'].includes(side))
  throw new Error('面.svg のパスと combined / surface / line を指定してください。');

const source = await readFile(path.resolve(input), 'utf8');
const document = new JSDOM(source, { contentType: 'image/svg+xml' }).window.document;
const svg = document.documentElement;
for (const node of document.querySelectorAll('*')) {
  if (!['svg', 'g', 'path'].includes(node.localName))
    throw new Error(`未対応のSVG要素: ${node.localName}`);
  for (const attribute of [...node.attributes]) {
    if (
      attribute.name.startsWith('on') ||
      attribute.localName === 'href' ||
      /url\(/i.test(attribute.value)
    )
      throw new Error('外部参照・イベントを含むSVGは取り込めません。');
    if (attribute.name === 'id' || attribute.name === 'data-name')
      node.removeAttribute(attribute.name);
  }
}
const children = [...svg.children];
const surface = children.find((node) => node.localName === 'path');
const line = children.find((node) => node.localName === 'g');
if (children.length !== 2 || !surface || !line)
  throw new Error('面側のpathと線側のgを確認できません。');

// The supplied upper/lower curves have the same geometry, offset vertically by 594.6 units.
const step = 594.6;
const wrap = (box, nodes = children) => {
  const body = nodes.map((node) => node.outerHTML).join('');
  const stack = [0, 1, 2]
    .map((index) => `<g transform="translate(0 ${index * step})">${body}</g>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${stack}</svg>\n`;
};
// All color masks share the combined bounds, so the line and surface stay aligned.
const { data, info } = await sharp(Buffer.from(wrap(`0 0 1296 ${1728 + step * 2}`)))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
let left = info.width,
  top = info.height,
  right = 0,
  bottom = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * info.channels + info.channels - 1]) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
}
if (left > right) throw new Error('SVGに描画内容がありません。');
const directory = path.join(root, 'public/images/portfolio-graphics');
await mkdir(directory, { recursive: true });
const box = `${left - 3} ${top - 3} ${right - left + 7} ${bottom - top + 7}`;
await writeFile(
  path.join(directory, 'men-background.svg'),
  wrap(box, side === 'surface' ? [surface] : side === 'line' ? [line] : children),
  'utf8',
);
await writeFile(path.join(directory, 'men-surface.svg'), wrap(box, [surface]), 'utf8');
await writeFile(path.join(directory, 'men-line.svg'), wrap(box, [line]), 'utf8');
const originals = path.join(root, 'src/assets/images_original');
await mkdir(originals, { recursive: true });
const original = path.join(originals, 'portfolio-men.svg');
if (path.resolve(input) !== original) await copyFile(path.resolve(input), original);
console.log(`面.svg の${side}を3つ縦に連結し、背景SVGを保存しました。`);
