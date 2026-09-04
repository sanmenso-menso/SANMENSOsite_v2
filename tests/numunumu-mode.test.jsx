import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  NUMUNUMU_IMAGE,
  NUMUNUMU_TEXT,
  NumunumuContext,
} from '../src/NumunumuContext.js';
import HomeArtistBackdrop from '../src/components/HomeArtistBackdrop.jsx';
import HomeUpdateNotice from '../src/components/HomeUpdateNotice.jsx';
import WorkCard from '../src/components/WorkCard.jsx';
import WorkFilterCube from '../src/components/WorkFilterCube.jsx';
import {
  activatesNumunumuMode,
  advanceNumunumuInput,
} from '../src/utils/numunumu.js';

const renderInNumunumuMode = (component) =>
  renderToStaticMarkup(
    <NumunumuContext.Provider value={{ isNumunumuMode: true }}>
      {component}
    </NumunumuContext.Provider>,
  );

describe('numunumu mode', () => {
  it('activates only after the complete hidden input, regardless of letter case', () => {
    let input = '';
    for (const key of 'NUMUNUMU') input = advanceNumunumuInput(input, key);

    expect(activatesNumunumuMode(input)).toBe(true);
    expect(activatesNumunumuMode(advanceNumunumuInput('', 'n'))).toBe(false);
  });

  it('replaces every HOME backdrop and update-notice label', () => {
    const backdrop = renderInNumunumuMode(<HomeArtistBackdrop />);
    const notice = renderInNumunumuMode(
      <HomeUpdateNotice onOpenWorks={() => {}} reduceMotion />,
    );

    expect(backdrop.match(new RegExp(NUMUNUMU_TEXT, 'g'))).toHaveLength(4);
    expect(backdrop).not.toContain('音楽');
    expect(notice).toContain(NUMUNUMU_TEXT);
    expect(notice).not.toContain('アップデートしたヨ！');
    expect(notice).not.toContain('WORKSページをチェック');
  });

  it('replaces the WORKS cube, card image and visible metadata', () => {
    const cube = renderInNumunumuMode(<WorkFilterCube category="all" />);
    const card = renderInNumunumuMode(
      <WorkCard
        work={{
          id: 1,
          title: NUMUNUMU_TEXT,
          type: 'visual',
          year: ' ',
          role: NUMUNUMU_TEXT,
          desc: NUMUNUMU_TEXT,
          color: '#ffffff',
          image: NUMUNUMU_IMAGE,
          workKind: 'original',
          categories: ['visual'],
          attributes: [],
        }}
        onOpen={() => {}}
        isNumunumuMode
      />,
    );

    expect(cube).not.toContain('VISUAL');
    expect(cube).not.toContain('MUSIC');
    expect(cube.match(new RegExp(NUMUNUMU_TEXT, 'g'))).toHaveLength(6);
    expect(card).toContain(NUMUNUMU_IMAGE);
    expect(card).not.toContain('ORIGINAL');
    expect(card).not.toContain('VISUAL');
    expect(card).not.toContain('READ MORE');
  });
});
