import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import FlowingWorksLane from '../src/components/FlowingWorksLane.jsx';

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
  it('renders one operable set and an inert, hidden visual duplicate without React warnings', () => {
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
    expect(markup).toContain('aria-hidden="true" inert=""');
    expect(markup).toContain('作品が一定速度で流れています。');
    expect(markup).not.toContain('work-card--compact');
    expect(markup).toContain('COLLABORATION');
    expect(markup.match(/class="works-flow-item/g)).toHaveLength(2);

    const placementStyles = [
      ...markup.matchAll(/class="works-flow-item[^"]*" style="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(placementStyles).toHaveLength(2);
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
});
