import { describe, expect, it } from 'vitest';
import { assignWorkNumbers } from '../src/utils/portfolio-numbers.js';
import { validatePortfolio } from '../src/utils/portfolio.js';

describe('release-order portfolio work numbers', () => {
  it('migrates old numbers to oldest-first numbers with stable same-day ties and keeps display order', () => {
    const works = [
      { id: 'work-f91e3574', date: '2026-08-14', number: 1 },
      { id: 'work-22222222', date: '2024-01-01', number: 4 },
      { id: 'work-11111111', date: '2024-01-01', number: 3 },
      { id: 'work-33333333', date: '2022-04-14', number: 2 },
    ];
    const result = assignWorkNumbers(works);
    expect(result.works.map((work) => work.number)).toEqual([4, 3, 2, 1]);
    expect(result.works.map((work) => work.id)).toEqual(works.map((work) => work.id));
    expect(assignWorkNumbers(works.toReversed()).assignments).toEqual(result.assignments);
    expect(works[0].number).toBe(1);
  });
  it('recalculates after a historical addition, date correction or removal, with partial and missing dates', () => {
    const works = [
      { id: 'work-11111111', date: '2025-02-10' },
      { id: 'work-22222222', date: '' },
      { id: 'work-33333333', date: '2025' },
      { id: 'work-44444444', date: '2025-02' },
    ];
    expect(assignWorkNumbers(works).works.map((work) => work.number)).toEqual([3, 4, 1, 2]);
    const added = [{ id: 'work-55555555', date: '2020-01-01' }, ...works];
    expect(assignWorkNumbers(added).works.map((work) => work.number)).toEqual([1, 4, 5, 2, 3]);
    const corrected = works.map((work) =>
      work.id === 'work-11111111' ? { ...work, date: '2024-12-31' } : work,
    );
    expect(assignWorkNumbers(corrected).works.map((work) => work.number)).toEqual([1, 4, 2, 3]);
    expect(assignWorkNumbers(works.slice(0, 2)).works.map((work) => work.number)).toEqual([1, 2]);
    expect(assignWorkNumbers([]).assignments).toEqual({});
    expect(() => assignWorkNumbers([works[0], works[0]])).toThrow(/重複/);
    expect(() => assignWorkNumbers([{ id: 'wrong', date: '' }])).toThrow(/不正/);
  });
  it('validates and preserves published numbers and rejects number collisions', () => {
    const work = {
      id: 'work-11111111',
      category: '案件',
      title: '作品',
      artist: '',
      roles: [],
      date: '',
      url: '',
      image: '',
      description: '',
      number: 12,
    };
    const data = { schemaVersion: 1, generatedAt: '2026-10-03T00:00:00Z', works: [work] };
    expect(validatePortfolio(data).works[0].number).toBe(12);
    expect(() =>
      validatePortfolio({ ...data, works: [work, { ...work, id: 'work-22222222' }] }),
    ).toThrow(/作品番号/);
    expect(() => validatePortfolio({ ...data, works: [{ ...work, number: -1 }] })).toThrow(
      /作品番号/,
    );
  });
});
