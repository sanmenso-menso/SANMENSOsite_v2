import { generateResponsiveImages } from './responsive-images.js';
// @ts-check
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WORKS_DATA } from '../src/constants.js';
import {
  parseCsv,
  rowsToActivities,
  rowsToPortfolio,
  validatePortfolio,
} from '../src/utils/portfolio.js';
import { enrichImages, readMedia } from './portfolio-media.js';
import { assignWorkNumbers } from '../src/utils/portfolio-numbers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/data/portfolio.json');
const temporary = `${output}.${randomUUID()}.tmp`;

async function main() {
  const args = process.argv.slice(2);
  let input = '';
  let allowEmpty = false;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--input' && args[index + 1] && !args[index + 1].startsWith('--')) {
      input = args[++index];
    } else if (args[index] === '--allow-empty') allowEmpty = true;
    else if (args[index] === '--help') {
      console.log(
        'npm run portfolio:sync [-- --input path/to/works.csv|portfolio.json] [--allow-empty]',
      );
      return;
    } else throw new Error(`不明な引数: ${args[index]}`);
  }

  let source;
  if (input) {
    source = await readFile(path.resolve(input), 'utf8');
  } else {
    const config = JSON.parse(await readFile(path.join(root, 'portfolio.config.json'), 'utf8'));
    if (!/^[\w-]+$/.test(config.spreadsheetId) || !Number.isSafeInteger(config.sheetId)) {
      throw new Error('portfolio.config.json のスプレッドシートID・シートIDが不正です。');
    }
    const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${config.sheetId}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      throw new Error(
        `スプシを読み取れません (HTTP ${response.status})。共有状態を確認するか、ダウンロードしたCSVを --input で指定してください。`,
      );
    }
    if (!response.headers.get('content-type')?.includes('text/csv')) {
      throw new Error(
        'CSVを取得できませんでした。ログイン画面・エラーページをJSONとして保存することはありません。',
      );
    }
    source = await response.text();
  }

  const trimmed = source.replace(/^\uFEFF/, '').trimStart();
  let portfolio;
  if (trimmed.startsWith('{')) portfolio = validatePortfolio(JSON.parse(trimmed));
  else {
    const rows = parseCsv(source);
    portfolio = { ...rowsToPortfolio(rows), activities: rowsToActivities(rows) };
  }
  if (!portfolio.works.length && !allowEmpty) {
    throw new Error(
      '公開する案件が0件のため更新を中止しました。意図的に空にする場合だけ --allow-empty を指定してください。',
    );
  }

  portfolio = await enrichImages(portfolio, root, WORKS_DATA, await readMedia(root));
  portfolio = validatePortfolio(portfolio);
  await generateResponsiveImages(root, portfolio);

  const numbersPath = path.join(root, 'portfolio-numbers.json');
  const numbered = assignWorkNumbers(portfolio.works);
  portfolio = validatePortfolio({ ...portfolio, works: numbered.works });

  await mkdir(path.dirname(output), { recursive: true });
  try {
    // This generated map is a release-order snapshot; it is never an input to numbering.
    const numbersTemporary = `${numbersPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(numbersTemporary, `${JSON.stringify(numbered.assignments, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      });
      await rename(numbersTemporary, numbersPath);
    } finally {
      await rm(numbersTemporary, { force: true });
    }
    await writeFile(temporary, `${JSON.stringify(portfolio, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log(
    `portfolio.json を更新: ${portfolio.works.length}件の案件 / 画像 ${portfolio.works.filter((work) => work.image).length}件 / 全活動 ${portfolio.activities?.length ?? portfolio.works.length}件`,
  );
  console.log('確認: npm run dev → http://127.0.0.1:5173/portfolio');
  console.log('公開用: npm run check → dist/ を通常のサイト更新手順で配布');
}

main().catch((error) => {
  console.error(`ポートフォリオ更新失敗: ${error.message}`);
  process.exitCode = 1;
});
