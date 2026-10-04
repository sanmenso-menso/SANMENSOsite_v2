import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  shuffleWorks,
  splitSelectedWorks,
  workField,
} from '../src/utils/portfolio-presentation.js';
import { SELECTED_WORK_IDS } from '../src/config/portfolio.js';

describe('portfolio presentation', () => {
  it('pins the six requested works in order, and excludes them from the random pool', async () => {
    const data = JSON.parse(
      await readFile(new URL('../public/data/portfolio.json', import.meta.url), 'utf8'),
    );
    const { selected, remaining } = splitSelectedWorks(data.works);
    expect(selected.map((work) => work.id)).toEqual(SELECTED_WORK_IDS);
    expect(selected.map((work) => work.title)).toEqual([
      '妹、他者、パラノイア',
      'CDs YouTubeMusicWeekend 2026',
      'Hello, Morning (rework by CDs)',
      '神風帝国 メインテーマ',
      'VIRAL 2025.10.19',
      'GOLD DISC 25.08.16',
    ]);
    expect(remaining).toHaveLength(data.works.length - 6);
    expect(remaining.some((work) => SELECTED_WORK_IDS.includes(work.id))).toBe(false);
  });
  it('shuffles without dropping, duplicating, mutating or sorting by dates', () => {
    const works = [
      { id: 'a', date: '2026' },
      { id: 'b', date: '2023' },
      { id: 'c', date: '2025' },
    ];
    const result = shuffleWorks(works, () => 0);
    expect(result.map((work) => work.id)).toEqual(['b', 'c', 'a']);
    expect(works.map((work) => work.id)).toEqual(['a', 'b', 'c']);
    expect(shuffleWorks([], () => 0)).toEqual([]);
  });
  it('uses a game override/URL, DJ role, video role and music fallback', () => {
    const work = { id: 'test', url: '', roles: [] };
    expect(workField({ ...work, id: 'work-4a8b5a3c', roles: ['作曲'] })).toBe('game');
    expect(workField({ ...work, url: 'https://store.steampowered.com/app/1' })).toBe('game');
    expect(workField({ ...work, roles: ['DJ', '映像'] })).toBe('dj');
    expect(workField({ ...work, roles: ['映像', '作曲'] })).toBe('video');
    expect(workField({ ...work, roles: ['リミックス'] })).toBe('music');
  });
});
