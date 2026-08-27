import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomeUpdateNotice from '../src/components/HomeUpdateNotice.jsx';

describe('home update notice', () => {
  it('renders the update message as an accessible WORKS button', () => {
    const markup = renderToStaticMarkup(<HomeUpdateNotice onOpenWorks={() => {}} reduceMotion />);

    expect(markup).toContain('data-home-update-notice="true"');
    expect(markup).toContain('<button');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-label="アップデートしたヨ！ WORKSページをチェック"');
    expect(markup).toContain('アップデートしたヨ！');
    expect(markup).toContain('WORKSページをチェック');
    expect(markup).not.toMatch(/<a(?:\s|>)/);
  });
});
