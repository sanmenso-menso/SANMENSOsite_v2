import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import FlowingWorksLane from '../src/components/FlowingWorksLane.jsx';
import {
  accumulateFlowScrollDelta,
  clampFlowInertia,
  decayFlowInertia,
} from '../src/utils/flowInertia.js';

const work = {
  id: 1,
  title: 'Test work',
  type: 'music',
  year: '2026',
  role: 'Composition',
  desc: 'Description',
  color: '#ffffff',
  image: '/images/butteerflyeffectCity.webp',
  workKind: 'original',
  categories: ['music'],
  attributes: ['collaboration'],
};

describe('flowing works lane accessibility', () => {
  it('caps drag velocity and decays inertia smoothly toward rest', () => {
    expect(clampFlowInertia(1400)).toBe(900);
    expect(clampFlowInertia(-1400)).toBe(-900);

    const nextPositiveVelocity = decayFlowInertia(600, 1000 / 60);
    const nextNegativeVelocity = decayFlowInertia(-600, 1000 / 60);

    expect(nextPositiveVelocity).toBeCloseTo(528);
    expect(nextNegativeVelocity).toBeCloseTo(-528);
    expect(Math.abs(decayFlowInertia(nextPositiveVelocity, 1000 / 60))).toBeLessThan(
      Math.abs(nextPositiveVelocity),
    );
  });

  it('accumulates sub-pixel auto-scroll movement instead of rounding it away', () => {
    let remainder = 0;
    let movedPixels = 0;

    for (let frame = 0; frame < 5; frame += 1) {
      const result = accumulateFlowScrollDelta(0.4, remainder);
      movedPixels += result.pixels;
      remainder = result.remainder;
    }

    expect(movedPixels).toBe(2);
    expect(remainder).toBeCloseTo(0);
  });

  it('renders one operable set between two inert loop copies without React warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const markup = renderToStaticMarkup(
      <FlowingWorksLane
        works={[work]}
        onOpen={() => {}}
        isStopped={false}
        isDialogOpen={false}
        selectedCategory="music"
      />,
    );

    expect(consoleError).not.toHaveBeenCalled();
    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup.match(/class="works-flow-set" aria-hidden="true" inert=""/g)).toHaveLength(2);
    expect(markup).toContain('作品が一定速度で流れています。');
    expect(markup).toContain('レーンは左右にドラッグ、スワイプ、または左右キーで移動できます。');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('data-dragging="false"');
    expect(markup).toContain('data-paused="false"');
    expect(markup).not.toContain('work-card--compact');
    expect(markup).toContain('COLLABORATION');
    expect(markup).toContain('work-card--kind-original');
    expect(markup).toContain('--work-card-category-surface:#ffd9d9');
    expect(markup.match(/class="works-flow-item/g)).toHaveLength(3);

    const placementStyles = [
      ...markup.matchAll(/class="works-flow-item[^"]*" style="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(placementStyles).toHaveLength(3);
    expect(new Set(placementStyles).size).toBe(1);
    expect(placementStyles[0]).toContain('--flow-y:');
    expect(placementStyles[0]).toContain('--flow-mobile-y:');

    consoleError.mockRestore();
  });

  it('renders non-selected categories as compact squares while keeping them in the flow', () => {
    const markup = renderToStaticMarkup(
      <FlowingWorksLane
        works={[{ ...work, type: 'visual', categories: ['visual'] }]}
        onOpen={() => {}}
        isStopped={false}
        isDialogOpen={false}
        selectedCategory="music"
      />,
    );

    expect(markup).toContain('work-card--compact');
    expect(markup.match(/<button/g)).toHaveLength(1);
  });

  it('announces the persisted stop state', () => {
    const markup = renderToStaticMarkup(
      <FlowingWorksLane works={[work]} onOpen={() => {}} isStopped isDialogOpen={false} />,
    );

    expect(markup).toContain('data-paused="true"');
    expect(markup).toContain('作品の流れを停止しています。');
  });

  it('turns every loop copy into a visible shooting prize without opening details', () => {
    const markup = renderToStaticMarkup(
      <FlowingWorksLane
        works={[work]}
        onOpen={() => {}}
        isStopped
        isDialogOpen={false}
        isShootingMode
      />,
    );

    expect(markup).toContain('aria-label="射的の景品として並ぶ作品一覧"');
    expect(markup.match(/500 POINTS/g)).toHaveLength(3);
    expect(markup).toContain('data-booth-label="ポートフォリオ射的"');
    expect(markup).toContain('data-shooting-difficulty="1"');
    expect(markup).toContain('--flow-gap-after:48px');
    expect(markup).toContain('--shooting-scale:0.94');
    expect(markup.match(/data-shooting-prize="true"/g)).toHaveLength(1);
    expect(markup).not.toContain('<button');
    expect(markup).toContain('shooting-crosshair');
    expect(markup).not.toContain('work-card--compact');
    expect(markup).toContain('作品は動き続けます。中央の照準に景品を合わせて発射してください。');
  });

  it('uses category colors and project-type frames for multi-category client work', () => {
    const markup = renderToStaticMarkup(
      <FlowingWorksLane
        works={[
          {
            ...work,
            workKind: 'client',
            categories: ['music', 'visual'],
            attributes: [],
          },
        ]}
        onOpen={() => {}}
        isStopped={false}
        isDialogOpen={false}
      />,
    );

    expect(markup).toContain('work-card--kind-client');
    expect(markup).toContain(
      '--work-card-category-surface:linear-gradient(135deg, #ffd9d9 0%, #ffd9d9 50%, #fff0a6 50%, #fff0a6 100%)',
    );
  });

  it('reduces long work titles while preserving the thumbnail aspect ratio', () => {
    const markup = renderToStaticMarkup(
      <FlowingWorksLane
        works={[
          {
            ...work,
            title: 'とても長い作品タイトルの表示でもサムネイルが小さくならないようにする作品',
          },
        ]}
        onOpen={() => {}}
        isStopped={false}
        isDialogOpen={false}
      />,
    );

    expect(markup).toContain('work-card__title');
    expect(markup).toContain('text-base leading-tight md:text-lg');
    expect(markup).toContain('line-clamp-3');
    expect(markup).toContain('aspect-video w-full shrink-0');
    expect(markup).toContain('work-card__description');
    expect(markup).toContain('line-clamp-2 flex-none');
  });
});
