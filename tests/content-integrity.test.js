import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  EXCAVATION_LINKS,
  KINETIC_VISUALIZER_SONGS,
  SOCIAL_LINKS,
  SONGS,
  WORK_ATTRIBUTES,
  WORK_ATTRIBUTES_BY_ID,
  WORKS_DATA,
  WORK_KIND_BY_ID,
  WORK_KINDS,
} from '../src/constants.js';
import { WORK_CATEGORIES } from '../src/utils/works.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const expectPublicFile = async (publicUrl) => {
  expect(publicUrl).toMatch(/^\//);
  await expect(
    access(path.join(repositoryRoot, 'public', publicUrl.slice(1))),
  ).resolves.toBeUndefined();
};

describe('published content integrity', () => {
  it('keeps work IDs unique and the corrected ID 50 URL', () => {
    const ids = WORKS_DATA.map((work) => work.id);
    expect(new Set(ids).size).toBe(ids.length);

    const work49 = WORKS_DATA.find((work) => work.id === 49);
    const work50 = WORKS_DATA.find((work) => work.id === 50);
    expect(work50?.url).toBe('https://www.nicovideo.jp/watch/sm45639345');
    expect(work49?.url).not.toBe(work50?.url);
  });

  it('assigns exactly one supported project type to every work', () => {
    const ids = WORKS_DATA.map((work) => work.id).sort((a, b) => a - b);
    const classifiedIds = Object.keys(WORK_KIND_BY_ID)
      .map(Number)
      .sort((a, b) => a - b);

    expect(classifiedIds).toEqual(ids);
    expect(WORKS_DATA.every((work) => work.workKind === WORK_KIND_BY_ID[work.id])).toBe(true);
    expect(WORKS_DATA.every((work) => Object.values(WORK_KINDS).includes(work.workKind))).toBe(
      true,
    );
  });

  it('assigns one supported primary category and only supported cross-cutting attributes', () => {
    const supportedAttributes = Object.values(WORK_ATTRIBUTES);

    expect(
      WORKS_DATA.every(
        (work) =>
          WORK_CATEGORIES.includes(work.type) &&
          work.categories.length > 0 &&
          work.categories.includes(work.type) &&
          new Set(work.categories).size === work.categories.length &&
          work.categories.every((category) => WORK_CATEGORIES.includes(category)),
      ),
    ).toBe(true);
    expect(
      WORKS_DATA.every((work) =>
        work.attributes.every((attribute) => supportedAttributes.includes(attribute)),
      ),
    ).toBe(true);

    for (const work of WORKS_DATA) {
      expect(work.attributes).toEqual(WORK_ATTRIBUTES_BY_ID[work.id] ?? []);
    }
  });

  it('keeps the purpose-led category decisions for cross-disciplinary work', () => {
    const expectedCategories = {
      28: 'live',
      32: 'music',
      38: 'visual',
      47: 'music',
      48: 'live',
      54: 'visual',
      61: 'music',
      62: 'live',
    };

    for (const [id, category] of Object.entries(expectedCategories)) {
      expect(WORKS_DATA.find((work) => work.id === Number(id))?.type).toBe(category);
    }

    for (const id of [33, 50, 52, 63, 65]) {
      expect(WORKS_DATA.find((work) => work.id === id)?.categories).toEqual(['music', 'visual']);
    }
  });

  it('keeps the published credits for おお阪 IN DA PARTY!2', () => {
    expect(WORKS_DATA.find((work) => work.id === 64)?.credits).toEqual([
      'DJ,LIVE:オーバーネット2(おおつく、米教タルタル、POPFACES、namitape),異亖2. × Negitoro,Hqdwe,d.j.ァネイロ × 三面相,原始主義ドラゴン(mealerrand、デバカエル),.+ × Molluscholar,U / 会長 × simotaka,r-906 × フロクロ,駱駝法師 × おおつく,四度寝 × MIDy',
      'VJ:.+,Mano.Hsmt,おおつく',
      'Staff:くらいん,simotaka,U / 会長,Lil ZiLLA,.+,異亖2.,おおつく',
    ]);
  });

  it('keeps the published credits for Dream Jail set', () => {
    expect(WORKS_DATA.find((work) => work.id === 62)?.credits).toEqual([
      'director：長谷川迷子',
      'Shooting,Sound:三面相,d.j.ァネイロ',
      'Composite：藤白詩集',
    ]);
  });

  it('uses HTTPS for every external content link', () => {
    const urls = [
      ...WORKS_DATA.map((work) => work.url),
      ...EXCAVATION_LINKS.map((link) => link.url),
      ...SOCIAL_LINKS.map((link) => link.url),
    ].filter(Boolean);

    expect(urls.every((url) => url.startsWith('https://'))).toBe(true);
  });

  it('references only existing local work images', async () => {
    await Promise.all(WORKS_DATA.map((work) => expectPublicFile(work.image)));
  });

  it('references only existing local audio files', async () => {
    await Promise.all(
      [...SONGS, ...KINETIC_VISUALIZER_SONGS].map((song) => expectPublicFile(song.src)),
    );
  });

  it('does not auto-load third-party reciprocal-link images', async () => {
    for (const link of EXCAVATION_LINKS) {
      expect(link.image == null || link.image.startsWith('/images/')).toBe(true);
      if (link.image) await expectPublicFile(link.image);
    }
  });
});
