import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) throw new Error('SVGファイルのパスを指定してください。');
const source = await readFile(path.resolve(input), 'utf8');
const document = new JSDOM(source, { contentType: 'image/svg+xml' }).window.document;
const svg = document.documentElement;
const allowed = new Set(['svg', 'defs', 'linearGradient', 'stop', 'g', 'path', 'polygon']);
for (const node of document.querySelectorAll('*')) {
  if (!allowed.has(node.localName)) throw new Error(`未対応のSVG要素: ${node.localName}`);
  for (const attribute of node.attributes) {
    if (
      attribute.name.startsWith('on') ||
      (attribute.localName === 'href' && !attribute.value.startsWith('#'))
    )
      throw new Error('外部参照・イベントを含むSVGは切り出せません。');
    if (attribute.name === 'data-name') node.removeAttribute(attribute.name);
  }
}
const viewBox = svg.getAttribute('viewBox');
const definitions = svg.querySelector('defs')?.outerHTML || '';
const shapeGroup = svg.querySelector('g[id="_シェイプアセット"]');
const shapes = [...(shapeGroup?.children || [])].filter((node) => node.localName === 'g');
if (shapes.length !== 4) throw new Error('グラフィック4点を確認できません。');
const items = ['burst-round', 'burst-angular', 'fold', 'cross'].map((name, index) => ({
  name,
  element: shapes[index],
  definitions,
}));
for (let digit = 0; digit < 10; digit++) {
  // Illustrator exports the added zero as an ungrouped path in the shape layer.
  const element =
    svg.querySelector(`g[id="_x3${digit}_"]`) ||
    (digit === 0 ? [...shapeGroup.children].find((node) => node.localName === 'path') : null);
  if (!element) throw new Error(`数字${digit}を確認できません。`);
  items.push({ name: `digit-${digit}`, element, definitions: '' });
}
const output = path.join(root, 'public/images/portfolio-graphics');
await mkdir(output, { recursive: true });
for (const item of items) {
  const body = item.element.outerHTML;
  const wrap = (box) =>
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${box}">${item.definitions}${body}</svg>\n`;
  const { data, info } = await sharp(Buffer.from(wrap(viewBox)))
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
  if (left > right) throw new Error(`${item.name}に描画内容がありません。`);
  const box = `${left - 2} ${top - 2} ${right - left + 5} ${bottom - top + 5}`;
  await writeFile(path.join(output, `${item.name}.svg`), wrap(box), 'utf8');
}
const originals = path.join(root, 'src/assets/images_original');
const originalPath = path.join(originals, 'portfolio-assets.svg');
if (path.resolve(input) !== originalPath) await copyFile(path.resolve(input), originalPath);
console.log('SVGの形・グラデーションを維持して、グラフィック4点・数字10点を切り出しました。');
