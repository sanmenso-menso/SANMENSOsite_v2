import { describe, expect, it } from 'vitest';

import { WORKS_DATA } from '../src/constants.js';
import {
  clampWorkPage,
  filterAndSortWorks,
  getWorkAttributeLabel,
  getWorkCategories,
  getWorkCategoryLabel,
  getWorkCubeOrientation,
  isWorkAttribute,
  isWorkCategory,
  isWorkKind,
  sortWorksForFlow,
  workMatchesCategory,
  WORK_CUBE_ORIENTATIONS,
} from '../src/utils/works.js';

describe('work filtering', () => {
  it.each([
    ['original', 'all', 31],
    ['original', 'music', 27],
    ['original', 'live', 2],
    ['original', 'visual', 6],
    ['client', 'all', 34],
    ['client', 'music', 12],
    ['client', 'live', 22],
    ['client', 'visual', 1],
  ])('filters %s / %s and keeps newest work first', (workKind, category, expected) => {
    const works = filterAndSortWorks(WORKS_DATA, { workKind, category });

    expect(works).toHaveLength(expected);
    expect(works.every((work) => work.workKind === workKind)).toBe(true);
    if (category !== 'all') {
      expect(works.every((work) => workMatchesCategory(work, category))).toBe(true);
    }
    expect(works.map((work) => work.id)).toEqual(
      works.map((work) => work.id).toSorted((a, b) => b - a),
    );
  });

  it('uses safe defaults for unsupported filters without mutating source data', () => {
    const source = [...WORKS_DATA];
    const result = filterAndSortWorks(source, {
      workKind: 'unsupported',
      category: 'unsupported',
    });

    expect(result).toHaveLength(31);
    expect(result.every((work) => work.workKind === 'original')).toBe(true);
    expect(source).toEqual(WORKS_DATA);
    expect(result).not.toBe(source);
  });

  it('clamps a stale page before slicing newly filtered results', () => {
    expect(clampWorkPage(4, 1)).toBe(1);
    expect(clampWorkPage(0, 4)).toBe(1);
    expect(clampWorkPage(2, 4)).toBe(2);
    expect(clampWorkPage(Number.NaN, 0)).toBe(1);
  });

  it('keeps the confirmed individual and compilation classifications', () => {
    const originalIds = [7, 12, 13, 47, 63];
    const clientIds = [15, 16, 20, 23, 25, 29, 39, 49, 53, 55, 61, 62, 64, 65];

    for (const id of originalIds) {
      expect(WORKS_DATA.find((work) => work.id === id)?.workKind).toBe('original');
    }
    for (const id of clientIds) {
      expect(WORKS_DATA.find((work) => work.id === id)?.workKind).toBe('client');
    }
  });

  it('keeps every selected project type in FLOW in newest-first order', () => {
    const works = sortWorksForFlow(WORKS_DATA, {
      workKind: 'client',
    });

    expect(works).toHaveLength(34);
    expect(works.every((work) => work.workKind === 'client')).toBe(true);
    expect(works.filter((work) => workMatchesCategory(work, 'music'))).toHaveLength(12);
    expect(works.map((work) => work.id)).toEqual(
      works.map((work) => work.id).toSorted((a, b) => b - a),
    );
  });

  it('keeps cross-disciplinary work visible in every assigned category', () => {
    for (const id of [33, 50, 52, 63, 65]) {
      const work = WORKS_DATA.find((candidate) => candidate.id === id);

      expect(getWorkCategories(work)).toEqual(['music', 'visual']);
      expect(workMatchesCategory(work, 'music')).toBe(true);
      expect(workMatchesCategory(work, 'visual')).toBe(true);
      expect(workMatchesCategory(work, 'live')).toBe(false);
    }
  });
});

describe('work filter cube mapping', () => {
  it.each([
    ['all', { x: -20, y: -25 }],
    ['live', { x: 0, y: 0 }],
    ['visual', { x: 0, y: -90 }],
    ['music', { x: -90, y: 0 }],
  ])('maps %s to the expected face', (category, orientation) => {
    expect(getWorkCubeOrientation(category)).toEqual(orientation);
    expect(getWorkCubeOrientation(category)).toBe(WORK_CUBE_ORIENTATIONS[category]);
  });

  it('falls back to ALL and exposes category/kind validators', () => {
    expect(getWorkCubeOrientation('unsupported')).toBe(WORK_CUBE_ORIENTATIONS.all);
    expect(isWorkCategory('music')).toBe(true);
    expect(isWorkCategory('unsupported')).toBe(false);
    expect(isWorkKind('client')).toBe(true);
    expect(isWorkKind('unsupported')).toBe(false);
    expect(isWorkAttribute('collaboration')).toBe(true);
    expect(isWorkAttribute('unsupported')).toBe(false);
    expect(getWorkCategoryLabel('music')).toBe('MUSIC');
    expect(getWorkCategoryLabel('visual')).toBe('VISUAL');
    expect(getWorkCategoryLabel('live')).toBe('LIVE & CULTURE');
    expect(getWorkCategoryLabel('unsupported')).toBe('ALL');
    expect(getWorkAttributeLabel('appearance')).toBe('APPEARANCE');
    expect(getWorkAttributeLabel('press')).toBe('PRESS');
    expect(getWorkAttributeLabel('collaboration')).toBe('COLLABORATION');
    expect(getWorkAttributeLabel('unsupported')).toBe('');
  });
});
