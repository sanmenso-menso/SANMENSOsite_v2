import { describe, expect, it } from 'vitest';

import {
  CONTENT_TITLES,
  getPageTitle,
  isKnownPath,
  normalizePathname,
} from '../src/utils/routes.js';

describe('route contracts', () => {
  it.each([
    ['/works/', '/works'],
    ['/works////', '/works'],
    ['/contents/kinetic-visualizer/', '/contents/kinetic-visualizer'],
    ['/', '/'],
  ])('normalizes trailing slashes: %s', (input, expected) => {
    expect(normalizePathname(input)).toBe(expected);
  });

  it.each([
    '/',
    '/works',
    '/contents',
    '/links',
    '/contact',
    '/secret',
    ...Object.keys(CONTENT_TITLES).map((id) => `/contents/${id}`),
  ])('accepts a public route: %s', (pathname) => {
    expect(isKnownPath(pathname)).toBe(true);
  });

  it.each(['/unknown', '/contents/unknown', '/contents/kinetic-visualizer/extra'])(
    'rejects an unknown route: %s',
    (pathname) => {
      expect(isKnownPath(pathname)).toBe(false);
      expect(getPageTitle(pathname)).toBe('ページが見つかりません');
    },
  );

  it('keeps route-specific document titles', () => {
    expect(getPageTitle('/works')).toBe('作品');
    expect(getPageTitle('/contents/kinetic-visualizer')).toBe(CONTENT_TITLES['kinetic-visualizer']);
  });
});
