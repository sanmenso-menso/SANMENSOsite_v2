// @ts-check
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Preserve the compiled application entry so unknown URLs render the original animated 404. */
export function buildNotFoundHtml(html) {
  if (!html.includes('id="root"') || !/src="\/assets\/[^"\s]+\.js"/.test(html))
    throw new Error('404 must be generated from the compiled application entry.');
  return html
    .replace(/<title>[^<]*<\/title>/, '<title>ページが見つかりません | 三面相</title>')
    .replace(/<link[^>]+rel="canonical"[^>]*>/g, '')
    .replace('<head>', '<head>\n    <meta data-rh="true" name="robots" content="noindex" />');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  await writeFile(new URL('../dist/404.html', import.meta.url), buildNotFoundHtml(html));
  console.log('Built 404.html with the original application and a noindex directive.');
}
