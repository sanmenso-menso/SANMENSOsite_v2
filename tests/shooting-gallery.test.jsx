import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ShootingGalleryControls, {
  ShootingModeToggle,
} from '../src/components/ShootingGalleryControls.jsx';
import {
  getShootingDifficulty,
  getShootingHitDirection,
  getShootingPoints,
  getShootingPrizePoints,
  getShootingShiftOffset,
  isShootingPointInBounds,
  SHOOTING_ATTRIBUTE_BONUS_POINTS,
  SHOOTING_CLIENT_POINTS,
  SHOOTING_ORIGINAL_POINTS,
} from '../src/utils/shootingGallery.js';

describe('shooting gallery', () => {
  it('keeps hits consistent when scrolling moves the aim off screen', () => {
    for (const offset of [0, -1000, 1000]) {
      const bounds = { left: 100, right: 200, top: 100 + offset,
        bottom: 300 + offset, width: 100, height: 200 };
      expect(isShootingPointInBounds(150, 200 + offset, bounds)).toBe(true);
      expect(isShootingPointInBounds(250, 200 + offset, bounds)).toBe(false);
      expect(isShootingPointInBounds(150, 301 + offset, bounds)).toBe(false);
    }
  });
  it('classifies center and offset hits against the target width', () => {
    expect(getShootingHitDirection(125, 100, 100)).toBe('left');
    expect(getShootingHitDirection(142, 100, 100)).toBe('left');
    expect(getShootingHitDirection(143, 100, 100)).toBe('center');
    expect(getShootingHitDirection(150, 100, 100)).toBe('center');
    expect(getShootingHitDirection(157, 100, 100)).toBe('center');
    expect(getShootingHitDirection(158, 100, 100)).toBe('right');
    expect(getShootingHitDirection(175, 100, 100)).toBe('right');
    expect(getShootingHitDirection(150, 100, 0)).toBe('center');
    expect(SHOOTING_ORIGINAL_POINTS).toBe(400);
    expect(SHOOTING_CLIENT_POINTS).toBe(600);
    expect(SHOOTING_ATTRIBUTE_BONUS_POINTS).toBe(100);
  });

  it('scores by project type and cross-cutting attributes only on center hits', () => {
    const original = { workKind: 'original', attributes: [] };
    const originalCollaboration = { workKind: 'original', attributes: ['collaboration'] };
    const client = { workKind: 'client', attributes: [] };
    const clientWithTwoAttributes = {
      workKind: 'client',
      attributes: ['collaboration', 'appearance'],
    };

    expect(getShootingPrizePoints(original)).toBe(400);
    expect(getShootingPrizePoints(originalCollaboration)).toBe(500);
    expect(getShootingPrizePoints(client)).toBe(600);
    expect(getShootingPrizePoints(clientWithTwoAttributes)).toBe(800);
    expect(getShootingPoints('center', client)).toBe(600);
    expect(getShootingPoints('left', client)).toBe(0);
    expect(getShootingPoints('right', client)).toBe(0);
  });

  it('makes higher-value prizes smaller and more mobile', () => {
    const easy = getShootingDifficulty({ workKind: 'original', attributes: [] });
    const hard = getShootingDifficulty({
      workKind: 'client',
      attributes: ['collaboration'],
    });

    expect(easy).toEqual({ level: 0, scale: 1, floatDistance: 0, floatDuration: 3.4 });
    expect(hard.level).toBe(3);
    expect(hard.scale).toBeLessThan(easy.scale);
    expect(hard.floatDistance).toBeGreaterThan(easy.floatDistance);
    expect(hard.floatDuration).toBeLessThan(easy.floatDuration);
  });

  it('shifts side hits away from the impact', () => {
    expect(getShootingShiftOffset('left')).toBe(48);
    expect(getShootingShiftOffset('right')).toBe(-48);
    expect(getShootingShiftOffset('left', 72)).toBe(96);
    expect(getShootingShiftOffset('right', -72)).toBe(-96);
  });

  it('renders the score, result, gun controls, and exit action while active', () => {
    const markup = renderToStaticMarkup(
      <ShootingGalleryControls
        isActive
        isTransitioning={false}
        curtainCycle={1}
        curtainMessage="開店準備中・・・"
        score={1000}
        lastResult="HIT! +500 pt"
        shotToken={2}
        isBulletInFlight={false}
        finalScore={null}
        disabled={false}
        isNumunumuMode={false}
        onFire={() => {}}
        onToggle={() => {}}
      />,
    );

    expect(markup).toContain('1,000 pt');
    expect(markup).toContain('HIT! +500 pt');
    expect(markup).toContain('発射！');
    expect(markup).toContain('shooting-muzzle__bore');
    expect(markup.match(/shooting-muzzle__barrel/g)).toHaveLength(1);
    expect(markup).toContain('shooting-gun__flash');
  });

  it('renders the mode entry action independently below the lane', () => {
    const markup = renderToStaticMarkup(
      <ShootingModeToggle
        isActive={false}
        isTransitioning={false}
        isNumunumuMode={false}
        onToggle={() => {}}
      />,
    );

    expect(markup).toContain('射的モード');
    expect(markup).toContain('aria-label="射的モードを開始"');
    expect(markup).toContain('aria-pressed="false"');
  });

  it('renders the preparation sign and final score independently from active play', () => {
    const preparingMarkup = renderToStaticMarkup(
      <ShootingGalleryControls
        isActive={false}
        isTransitioning
        curtainCycle={2}
        curtainMessage="開店準備中・・・"
        score={0}
        lastResult={null}
        shotToken={0}
        isBulletInFlight={false}
        finalScore={null}
        disabled={false}
        isNumunumuMode={false}
        onFire={() => {}}
        onToggle={() => {}}
      />,
    );
    const finalMarkup = renderToStaticMarkup(
      <ShootingGalleryControls
        isActive={false}
        isTransitioning={false}
        curtainCycle={2}
        curtainMessage="閉店作業中"
        score={0}
        lastResult={null}
        shotToken={0}
        isBulletInFlight={false}
        finalScore={1500}
        disabled={false}
        isNumunumuMode={false}
        onFire={() => {}}
        onToggle={() => {}}
      />,
    );
    const closingMarkup = renderToStaticMarkup(
      <ShootingGalleryControls
        isActive
        isTransitioning
        curtainCycle={3}
        curtainMessage="閉店作業中"
        score={1500}
        lastResult={null}
        shotToken={0}
        isBulletInFlight={false}
        finalScore={null}
        disabled={false}
        isNumunumuMode={false}
        onFire={() => {}}
        onToggle={() => {}}
      />,
    );

    expect(preparingMarkup).toContain('開店準備中・・・');
    expect(closingMarkup).toContain('閉店作業中');
    expect(finalMarkup).toContain('最終ポイント');
    expect(finalMarkup).toContain('1,500');
    expect(finalMarkup).toContain('POINTS');
    expect(finalMarkup).toContain('shooting-final-score__lights');
  });
});
