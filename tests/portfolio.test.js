import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import {
  filterWorks,
  parseCsv,
  rowsToPortfolio,
  rowsToActivities,
  safeImage,
  validatePortfolio,
} from '../src/utils/portfolio.js';

const headers = [
  '公開日',
  '区分',
  '作品名',
  '担当アーティスト',
  '役職',
  'リンク',
  'メモ',
  '公開',
  '説明',
];
const rows = [
  headers,
  [
    '2026-08-21',
    '案件',
    '作品A',
    'CDs',
    '作曲、映像',
    'https://youtu.be/abcdefghijk',
    'PRIVATE NOTE',
    '',
    '公開用説明',
  ],
  ['2026-09-01', 'オリジナル', '自主制作', '三面相', '', '', 'PRIVATE NOTE'],
  ['2026-07', '案件', 'リンクなしの出演', '', 'DJ', ''],
  ['2026-10-01', '案件', '非公開の案件', '', '', '', 'PRIVATE NOTE', 'FALSE'],
];

describe('spreadsheet to public portfolio', () => {
  it('includes original activities with dates, roles and links while omitting private notes and images', () => {
    const portfolio = rowsToPortfolio(rows);
    const activities = rowsToActivities(rows);
    expect(activities).toHaveLength(3);
    expect(activities.find((work) => work.category === 'オリジナル')).toMatchObject({
      title: '自主制作',
      date: '2026-09-01',
      image: '',
    });
    const clean = validatePortfolio({
      ...portfolio,
      activities: activities.map((work) => ({
        ...work,
        memo: 'PRIVATE',
        image: '/images/example.jpg',
      })),
    });
    expect(clean.activities).toHaveLength(3);
    expect(clean.activities.every((work) => !work.image)).toBe(true);
    expect(JSON.stringify(clean)).not.toMatch(/PRIVATE|非公開の案件|メモ/);
    expect(() =>
      validatePortfolio({ ...portfolio, activities: [activities[0], activities[0]] }),
    ).toThrow('重複');
    expect(() => validatePortfolio({ ...portfolio, activities: {} })).toThrow();
  });
  it('handles UTF-8 BOM, commas, quoted newlines and escaped quotes without dropping data', () => {
    expect(
      parseCsv('\uFEFF作品名,役職\r\n"Hello, Morning","作曲\n映像"\r\n"""作品""",DJ\r\n'),
    ).toEqual([
      ['作品名', '役職'],
      ['Hello, Morning', '作曲\n映像'],
      ['"作品"', 'DJ'],
    ]);
    expect(() => parseCsv('a,"unclosed')).toThrow();
    expect(() => parseCsv('a,"closed"oops')).toThrow();
  });

  it('publishes only commissions, omits working notes and supports missing optional metadata', () => {
    const result = rowsToPortfolio(rows);
    expect(result.works).toHaveLength(2);
    expect(result.works[0]).toMatchObject({
      title: '作品A',
      roles: ['作曲', '映像'],
      description: '公開用説明',
    });
    expect(result.works[1]).toMatchObject({ artist: '', url: '', date: '2026-07' });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|自主制作|非公開の案件|メモ/);
  });

  it('keeps IDs independent of row order and date corrections', () => {
    const first = rowsToPortfolio(rows).works;
    const changed = rowsToPortfolio([headers, rows[3], ['2025', ...rows[1].slice(1)]]).works;
    expect(changed.map((work) => work.id).sort()).toEqual(first.map((work) => work.id).sort());
  });

  it('fails on schema drift, duplicate works, unsafe URLs and invalid dates', () => {
    expect(() => rowsToPortfolio([['作品名'], ['test']])).toThrow('ヘッダー');
    expect(() => rowsToPortfolio([headers, rows[1], rows[1]])).toThrow('重複');
    expect(() => rowsToPortfolio([headers, ['2026-02-30', ...rows[1].slice(1)]])).toThrow('2行目');
    expect(() => rowsToPortfolio([headers, ['2026-13', ...rows[1].slice(1)]])).toThrow();
    expect(() =>
      rowsToPortfolio([headers, ['2026', '案件', 'x', '', '', 'javascript:alert(1)']]),
    ).toThrow();
    expect(() =>
      rowsToPortfolio([headers, ['2026', '案件', 'x', '', '', 'https://user:pass@example.com']]),
    ).toThrow();
    expect(() => safeImage('/images/%2e%2e/secret.jpg')).toThrow();
    expect(() => safeImage('https://example.com/image.jpg')).toThrow();
  });

  it('revalidates imported JSON and strips arbitrary fields', () => {
    const data = rowsToPortfolio(rows);
    data.works[0].memo = 'PRIVATE';
    data.internal = 'PRIVATE';
    expect(JSON.stringify(validatePortfolio(data))).not.toContain('PRIVATE');
    expect(() => validatePortfolio({ ...data, schemaVersion: 999 })).toThrow();
  });

  it('combines year, exact role and normalized text filters', () => {
    const { works } = rowsToPortfolio(rows);
    expect(filterWorks(works, { query: 'ｃｄｓ', role: '作曲', year: '2026' })).toHaveLength(1);
    expect(filterWorks(works, { query: '出演', role: 'DJ' })).toHaveLength(1);
    expect(filterWorks(works, { role: 'DJ', year: '2025' })).toHaveLength(0);
    expect(filterWorks(works, { query: 'missing' })).toHaveLength(0);
  });

  it('ships valid public JSON with existing local images and no raw source columns', async () => {
    const data = JSON.parse(
      await readFile(new URL('../public/data/portfolio.json', import.meta.url), 'utf8'),
    );
    expect(validatePortfolio(data).works.length).toBeGreaterThan(0);
    expect(JSON.stringify(data)).not.toMatch(/"メモ"|"memo"|"spreadsheetId"|出典:|要確認:/);
    await Promise.all(
      data.works
        .filter((work) => work.image)
        .map((work) => access(new URL(`../public${work.image}`, import.meta.url))),
    );
  });
});
