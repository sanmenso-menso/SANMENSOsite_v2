import { describe, expect, it } from 'vitest';

import { WORKS_DATA } from '../src/constants.js';
import {
  clampWorkPage,
  filterAndSortWorks,
  getWorkCategoryLabel,
  getWorkCubeOrientation,
  isWorkCategory,
  isWorkKind,
  sortWorksForFlow,
  WORK_CUBE_ORIENTATIONS,
} from '../src/utils/works.js';

describe('work filtering', () => {
  it.each([
    ['original', 'all', 30],
    ['original', 'music', 23],
    ['original', 'entame', 1],
    ['original', 'fun', 6],
    ['client', 'all', 30],
    ['client', 'music', 10],
    ['client', 'entame', 19],
    ['client', 'fun', 1],
  ])('filters %s / %s and keeps newest work first', (workKind, category, expected) => {
    const works = filterAndSortWorks(WORKS_DATA, { workKind, category });

    expect(works).toHaveLength(expected);
    expect(works.every((work) => work.workKind === workKind)).toBe(true);
    if (category !== 'all') {
      expect(works.every((work) => work.type === category)).toBe(true);
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

    expect(result).toHaveLength(30);
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
    const originalIds = [7, 12, 13, 47];
    const clientIds = [15, 16, 20, 23, 25, 29, 39, 49, 53, 55];

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

    expect(works).toHaveLength(30);
    expect(works.every((work) => work.workKind === 'client')).toBe(true);
    expect(works.filter((work) => work.type === 'music')).toHaveLength(10);
    expect(works.map((work) => work.id)).toEqual(
      works.map((work) => work.id).toSorted((a, b) => b - a),
    );
  });
});

describe('work filter cube mapping', () => {
  it.each([
    ['all', { x: -20, y: -25 }],
    ['entame', { x: 0, y: 0 }],
    ['fun', { x: 0, y: -90 }],
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
    expect(getWorkCategoryLabel('music')).toBe('CREATE');
    expect(getWorkCategoryLabel('unsupported')).toBe('ALL');
  });
});
