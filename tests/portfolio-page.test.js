// @vitest-environment jsdom
/* global document, window */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PortfolioPage from '../src/pages/PortfolioPage.jsx';
import portfolio from '../public/data/portfolio.json';
import { rowsToPortfolio } from '../src/utils/portfolio.js';
import { SELECTED_WORK_IDS, WORKS_SHUFFLE_INTERVAL } from '../src/config/portfolio.js';

const data = rowsToPortfolio([
  ['公開日', '区分', '作品名', '担当アーティスト', '役職', 'リンク'],
  ['2026-08-21', '案件', '新しい作品', 'CDs', '作曲、映像', 'https://example.com/work'],
  ['2025', '案件', 'イベント', '', 'DJ', ''],
]);
let root;
let container;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function renderPage(path = '/portfolio/works') {
  await act(async () =>
    root.render(
      React.createElement(
        HelmetProvider,
        null,
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(PortfolioPage),
        ),
      ),
    ),
  );
}

describe('portfolio page', () => {
  it('hides the two configured commissions from Works, filters and shuffle without renumbering or removing About activities', async () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => portfolio }));
    const snapshot = JSON.stringify(portfolio);
    const hiddenTitles = ['電脳 / 32 Observers Chorus cover', '音楽と夢想'];
    const assertWorks = () => {
      const cards = [...container.querySelectorAll('.portfolio-work')];
      expect(cards).toHaveLength(portfolio.works.length - 2);
      expect(container.querySelector('.portfolio-total').textContent).toBe(
        `${String(portfolio.works.length - 2).padStart(2, '0')} WORKS`,
      );
      for (const title of hiddenTitles) {
        expect(cards.some((card) => card.querySelector('h3').textContent === title)).toBe(false);
      }
      for (const card of cards) {
        const work = portfolio.works.find(
          (item) => item.title === card.querySelector('h3').textContent,
        );
        expect(card.querySelector('.portfolio-work-number').getAttribute('aria-label')).toBe(
          `作品ID ${String(work.number).padStart(2, '0')}`,
        );
      }
      expect(
        container.querySelector('.portfolio-filters select:last-child option[value="2022"]'),
      ).toBeNull();
    };
    await renderPage();
    assertWorks();
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL * 2));
    assertWorks();
    await act(async () => container.querySelector('nav a[href="/portfolio"]').click());
    const table = container.querySelector('.portfolio-activity-table');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(portfolio.activities.length);
    for (const title of hiddenTitles) expect(table.textContent).toContain(title);
    expect(JSON.stringify(portfolio)).toBe(snapshot);
  });

  it('scatters the role only on activation, restores it, and clears the timer on leaving About', async () => {
    vi.useFakeTimers();
    const scheduled = vi.spyOn(window, 'setTimeout');
    const cleared = vi.spyOn(window, 'clearTimeout');
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage('/portfolio/about');
    const letters = () => [...container.querySelectorAll('.portfolio-role-letters > span')];
    expect(letters().every((letter) => !letter.hasAttribute('style'))).toBe(true);
    const role = container.querySelector('.portfolio-role-box');
    await act(async () => {
      role.focus();
      role.dispatchEvent(new Event('pointerover', { bubbles: true }));
      vi.advanceTimersByTime(60_000);
    });
    expect(letters().every((letter) => !letter.hasAttribute('style'))).toBe(true);
    await act(async () => role.click());
    expect(
      letters().every((letter) => letter.style.getPropertyValue('--letter-x') === '11px'),
    ).toBe(true);
    await act(async () => vi.advanceTimersByTime(1200));
    expect(letters().every((letter) => !letter.style.getPropertyValue('--letter-x'))).toBe(true);
    await act(async () => role.click());
    const pendingRoleTimer =
      scheduled.mock.results[scheduled.mock.calls.findLastIndex((call) => call[1] === 1200)].value;
    await act(async () => container.querySelector('nav a[href="/portfolio/contact"]').click());
    expect(cleared).toHaveBeenCalledWith(pendingRoleTimer);
  });

  it('keeps the role still when motion is reduced and reacts to preference changes', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    let changed;
    const motion = {
      matches: true,
      addEventListener: vi.fn((_event, callback) => {
        changed = callback;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => motion),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage('/portfolio/about');
    const letter = container.querySelector('.portfolio-role-letters > span');
    await act(async () => {
      container.querySelector('.portfolio-role-box').click();
      vi.advanceTimersByTime(60_000);
    });
    expect(letter.style.getPropertyValue('--letter-x')).toBe('');
    await act(async () => {
      motion.matches = false;
      changed();
      container.querySelector('.portfolio-role-box').click();
    });
    expect(letter.style.getPropertyValue('--letter-x')).toBe('11px');
    await act(async () => {
      motion.matches = true;
      changed();
    });
    expect(letter.style.getPropertyValue('--letter-x')).toBe('');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('switches chaos to pop, reveals and closes creative fields, and keeps the CDs and birthday assets', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage('/portfolio/about');
    const composition = container.querySelector('.portfolio-about-composition');
    const chaos = container.querySelector('.portfolio-chaos-trigger');
    const pop = container.querySelector('.portfolio-pop-trigger');
    expect(composition.dataset.mood).toBe('normal');
    await act(async () => {
      chaos.dispatchEvent(new Event('pointerover', { bubbles: true }));
      chaos.focus();
    });
    expect(composition.dataset.mood).toBe('normal');
    await act(async () => chaos.click());
    expect(composition.dataset.mood).toBe('chaos');
    expect(chaos.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.portfolio-chaos-letter').hasAttribute('style')).toBe(true);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    await act(async () => chaos.click());
    const scene = container.querySelector('.portfolio-fold-scene');
    const panelTransforms = () =>
      [0, 1, 2].map((index) => scene.style.getPropertyValue(`--men-chaos-panel-${index}`));
    const firstScatter = panelTransforms();
    random.mockReturnValue(0.8);
    await act(async () => chaos.click());
    expect(panelTransforms().every((transform, index) => transform !== firstScatter[index])).toBe(
      true,
    );
    await act(async () => pop.focus());
    expect(composition.dataset.mood).toBe('chaos');
    await act(async () => pop.click());
    expect(composition.dataset.mood).toBe('pop');
    expect(
      container.querySelector('.portfolio-chaos-letter').style.getPropertyValue('--letter-angle'),
    ).toBe('');
    const fields = container.querySelector('.portfolio-fields-trigger');
    await act(async () => fields.click());
    expect(fields.getAttribute('aria-expanded')).toBe('true');
    expect(
      [...container.querySelectorAll('#about-floating-fields [role="listitem"]')].map(
        (item) => item.textContent,
      ),
    ).toEqual(['Web', '映像', 'グラフィック', '楽器演奏', 'フィールドレコーディング']);
    await act(async () => fields.click());
    expect(fields.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#about-floating-fields').dataset.state).toBe('leaving');
    expect(container.querySelector('#about-floating-fields').getAttribute('aria-hidden')).toBe(
      'true',
    );
    await act(async () => vi.advanceTimersByTime(1200));
    expect(container.querySelector('#about-floating-fields')).toBeNull();
    expect(container.querySelector('.portfolio-cds-link').getAttribute('href')).toBe(
      'https://cds-inter.net/',
    );
    expect(container.querySelector('#about-cds-disc').getAttribute('aria-hidden')).toBe('true');
    expect(
      [
        ...container.querySelectorAll('.portfolio-about-introduction .portfolio-number-art img'),
      ].map((image) => image.getAttribute('src')),
    ).toEqual(['2', '0', '0', '5'].map((digit) => `/images/portfolio-graphics/digit-${digit}.svg`));
    await act(async () => container.querySelector('nav a[href="/portfolio/works"]').click());
    expect(container.querySelector('[data-mood]')).toBeNull();
  });

  it('can reopen departing fields and clears departure work when leaving About or reducing motion', async () => {
    vi.useFakeTimers();
    const scheduled = vi.spyOn(window, 'setTimeout');
    const cleared = vi.spyOn(window, 'clearTimeout');
    let changed;
    const motion = {
      matches: false,
      addEventListener: vi.fn((_event, callback) => {
        changed = callback;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => motion),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage('/portfolio');
    const fields = container.querySelector('.portfolio-fields-trigger');
    await act(async () => fields.click());
    await act(async () => fields.click());
    await act(async () => fields.click());
    await act(async () => vi.advanceTimersByTime(2000));
    expect(fields.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('#about-floating-fields').dataset.state).toBe('open');
    await act(async () => fields.click());
    await act(async () => {
      motion.matches = true;
      changed();
    });
    expect(container.querySelector('#about-floating-fields')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => fields.click());
    await act(async () => fields.click());
    expect(container.querySelector('#about-floating-fields')).toBeNull();
    await act(async () => {
      motion.matches = false;
      changed();
    });
    await act(async () => fields.click());
    await act(async () => fields.click());
    const departureTimer =
      scheduled.mock.results[scheduled.mock.calls.findLastIndex((call) => call[1] === 1200)].value;
    await act(async () => container.querySelector('nav a[href="/portfolio/works"]').click());
    expect(cleared).toHaveBeenCalledWith(departureTimer);
  });

  it('starts with selected works, then reshuffles all works every 30 seconds and pauses for hover, focus, hidden tabs and the stop button', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const visibility = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const pinned = {
      ...data,
      works: [
        ...SELECTED_WORK_IDS.map((id, index) => ({ ...data.works[0], id, title: `固定${index}` })),
        ...data.works,
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => pinned }));
    await renderPage();
    const titles = () =>
      [...container.querySelectorAll('.portfolio-grid h3')].map((node) => node.textContent);
    const initial = titles();
    const numbers = () =>
      Object.fromEntries(
        [...container.querySelectorAll('.portfolio-work')].map((card) => [
          card.querySelector('h3').textContent,
          card.querySelector('.portfolio-work-number').getAttribute('aria-label'),
        ]),
      );
    const initialNumbers = numbers();
    expect(initial.slice(0, SELECTED_WORK_IDS.length)).toEqual(
      SELECTED_WORK_IDS.map((_id, index) => `固定${index}`),
    );
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL - 1));
    expect(titles()).toEqual(initial);
    await act(async () => vi.advanceTimersByTime(1));
    expect(titles()).toEqual([...initial.slice(1), initial[0]]);
    expect([...titles()].sort()).toEqual([...initial].sort());
    expect(numbers()).toEqual(initialNumbers);
    const listWrapper = container.querySelector('.portfolio-work-group');
    await act(async () => listWrapper.dispatchEvent(new Event('mouseover', { bubbles: true })));
    const before = titles();
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL));
    expect(titles()).toEqual(before);
    await act(async () => listWrapper.dispatchEvent(new Event('mouseout', { bubbles: true })));
    const card = container.querySelector('.portfolio-work a');
    await act(async () => card.focus());
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL));
    expect(titles()).toEqual(before);
    await act(async () => card.blur());
    visibility.mockReturnValue(true);
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL));
    expect(titles()).toEqual(before);
    visibility.mockReturnValue(false);
    const stop = container.querySelector('button[aria-pressed]');
    await act(async () => stop.click());
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL * 2));
    expect(titles()).toEqual(before);
    await act(async () => stop.click());
    await act(async () => vi.advanceTimersByTime(WORKS_SHUFFLE_INTERVAL));
    expect(titles()).toEqual([...before.slice(1), before[0]]);
  });

  it('lists original activities with dates, roles and outbound links, without thumbnails', async () => {
    const activities = [
      ...data.works,
      { ...data.works[0], id: 'work-abcdef01', title: 'オリジナル作品', category: 'オリジナル' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...data, activities }) }),
    );
    await renderPage('/portfolio/about');
    const table = container.querySelector('.portfolio-activity-table');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(table.textContent).toContain('オリジナル作品');
    expect(table.textContent).toContain('2026.08.21');
    expect(table.textContent).toContain('作曲 / 映像');
    expect(table.querySelector('a').getAttribute('href')).toBe('https://example.com/work');
    expect(table.querySelector('.portfolio-work-image')).toBeNull();
    expect(
      [...table.querySelectorAll('img')].every((image) =>
        image.getAttribute('src').includes('/digit-'),
      ),
    ).toBe(true);
  });
  it('starts with Works and keeps the introduction and contact on separate pages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage();
    expect(container.querySelector('h1').textContent).toBe('Works制作・参加実績');
    expect(container.textContent).not.toContain('その向こう');
    expect(container.querySelector('a[href="mailto:sanmensoworks@gmail.com"]')).toBeNull();
    expect(container.querySelector('a[aria-current="page"]').textContent).toBe('Works');
  });

  it('keeps the links in the supplied About typography usable with the portfolio router', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage('/portfolio/about');
    const artwork = container.querySelector('.portfolio-about-artwork');
    expect(artwork.querySelector('a[href="mailto:sanmensoworks@gmail.com"]')).not.toBeNull();
    const discord = artwork.querySelector('a[href="https://discord.com/users/661901822352687105"]');
    expect(discord.getAttribute('rel')).toBe('noopener noreferrer');
    await act(async () =>
      artwork
        .querySelector('a[href="/portfolio/works"]')
        .dispatchEvent(
          new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
        ),
    );
    expect(container.querySelector('h1').textContent).toContain('Works');
    await act(async () => container.querySelector('nav a[href="/portfolio"]').click());
    await act(async () =>
      container
        .querySelector('.portfolio-about-artwork a[href="/portfolio/contact"]')
        .dispatchEvent(
          new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
        ),
    );
    expect(container.querySelector('h1').textContent).toContain('Contact');
    expect(container.querySelector('input[name="name"]')).not.toBeNull();
  });

  it.each([
    ['/portfolio', 'About三面相について', '2005年生まれ', '/data/portfolio.json'],
    ['/portfolio/about', 'About三面相について', '2005年生まれ', '/data/portfolio.json'],
    [
      '/portfolio/contact/',
      'Contactご依頼・お問い合わせ',
      'sanmensoworks@gmail.com',
      '/api/contact',
    ],
  ])('opens an independent page with its own data: %s', async (path, heading, text, endpoint) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal('fetch', fetchMock);
    await renderPage(path);
    expect(container.querySelector('h1').textContent).toBe(heading);
    expect(container.textContent).toContain(text);
    expect(container.querySelector('.portfolio-grid')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(endpoint);
  });

  it('navigates between the three pages and keeps the selected navigation current', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal('fetch', fetchMock);
    await renderPage();
    await act(async () => container.querySelector('nav a[href="/portfolio"]').click());
    expect(container.querySelector('h1').textContent).toContain('About');
    expect(container.querySelector('a[aria-current="page"]').textContent).toBe('About');
    await act(async () => container.querySelector('nav a[href="/portfolio/contact"]').click());
    expect(container.querySelector('.portfolio-email').getAttribute('href')).toBe(
      'mailto:sanmensoworks@gmail.com',
    );
    await act(async () => container.querySelector('nav a[href="/portfolio/works"]').click());
    expect(container.querySelectorAll('.portfolio-work')).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it('loads JSON, exposes real work links, filters by role/year and resets empty results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await renderPage();
    expect(container.querySelectorAll('.portfolio-work')).toHaveLength(2);
    expect(container.querySelector('.portfolio-work a').getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
    expect(container.querySelectorAll('.portfolio-work a')).toHaveLength(1);
    const selects = container.querySelectorAll('select');
    await act(async () => {
      selects[0].value = 'DJ';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.querySelectorAll('.portfolio-work')).toHaveLength(1);
    expect(container.querySelector('.portfolio-work h3').textContent).toBe('イベント');
    await act(async () => {
      selects[1].value = '2026';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.textContent).toContain('条件に合う作品はありません');
    await act(async () =>
      [...container.querySelectorAll('.portfolio-results button')]
        .find((button) => button.textContent === '絞り込みを解除')
        .click(),
    );
    expect(container.querySelectorAll('.portfolio-work')).toHaveLength(2);
  });

  it('shows a recoverable error for invalid JSON and successfully retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ schemaVersion: 999 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => data });
    vi.stubGlobal('fetch', fetchMock);
    await renderPage();
    expect(container.querySelector('[role="alert"]').textContent).toContain('読み込めません');
    await act(async () => container.querySelector('[role="alert"] button').click());
    expect(container.querySelectorAll('.portfolio-work')).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
