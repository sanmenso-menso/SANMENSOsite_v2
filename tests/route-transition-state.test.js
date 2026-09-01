import { describe, expect, it } from 'vitest';

import {
  CUBE_ROUTE_TRANSITION_SECONDS,
  ROUTE_TRANSITION_LOCK_MS,
  canCompleteReturningCubeIntro,
  canStartRouteTransition,
  isHomeEntryReady,
} from '../src/utils/routeTransition.js';

describe('route transition state', () => {
  it('accepts only the completion belonging to the current HOME entry', () => {
    expect(
      isHomeEntryReady({ pathname: '/', currentEntryKey: 'home-2', completedEntryKey: 'home-2' }),
    ).toBe(true);
    expect(
      isHomeEntryReady({ pathname: '/', currentEntryKey: 'home-2', completedEntryKey: 'home-1' }),
    ).toBe(false);
    expect(
      isHomeEntryReady({
        pathname: '/works',
        currentEntryKey: 'works-1',
        completedEntryKey: 'works-1',
      }),
    ).toBe(false);
  });

  it('blocks re-entry and navigation during the HOME intro', () => {
    expect(
      canStartRouteTransition({
        currentPath: '/',
        targetPath: '/works',
        isTransitioning: false,
        isCurrentHomeReady: false,
      }),
    ).toBe(false);
    expect(
      canStartRouteTransition({
        currentPath: '/',
        targetPath: '/works',
        isTransitioning: true,
        isCurrentHomeReady: true,
      }),
    ).toBe(false);
    expect(
      canStartRouteTransition({
        currentPath: '/',
        targetPath: '/works',
        isTransitioning: false,
        isCurrentHomeReady: true,
      }),
    ).toBe(true);
  });

  it('keeps the route lock longer than the shared CUBE animation', () => {
    expect(ROUTE_TRANSITION_LOCK_MS).toBeGreaterThan(CUBE_ROUTE_TRANSITION_SECONDS * 1000);
  });

  it('waits for both the return animation and opening sequence before enabling HOME', () => {
    expect(
      canCompleteReturningCubeIntro({
        isReturningFromWorks: true,
        isOpening: false,
        hasReturnAnimationCompleted: true,
      }),
    ).toBe(true);
    expect(
      canCompleteReturningCubeIntro({
        isReturningFromWorks: true,
        isOpening: true,
        hasReturnAnimationCompleted: true,
      }),
    ).toBe(false);
    expect(
      canCompleteReturningCubeIntro({
        isReturningFromWorks: true,
        isOpening: false,
        hasReturnAnimationCompleted: false,
      }),
    ).toBe(false);
  });
});
