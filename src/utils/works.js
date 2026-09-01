export const WORK_CATEGORIES = Object.freeze(['all', 'music', 'live', 'visual']);
export const WORK_KINDS = Object.freeze(['original', 'client']);
export const WORK_ATTRIBUTES = Object.freeze(['appearance', 'press', 'collaboration']);

export const WORK_CATEGORY_LABELS = Object.freeze({
  all: 'ALL',
  music: 'MUSIC',
  visual: 'VISUAL',
  live: 'LIVE & CULTURE',
});

export const WORK_ATTRIBUTE_LABELS = Object.freeze({
  appearance: 'APPEARANCE',
  press: 'PRESS',
  collaboration: 'COLLABORATION',
});

export const WORK_CUBE_ORIENTATIONS = Object.freeze({
  all: Object.freeze({ x: -20, y: -25 }),
  live: Object.freeze({ x: 0, y: 0 }),
  visual: Object.freeze({ x: 0, y: -90 }),
  music: Object.freeze({ x: -90, y: 0 }),
});

export const isWorkCategory = (value) => WORK_CATEGORIES.includes(value);
export const isWorkKind = (value) => WORK_KINDS.includes(value);
export const isWorkAttribute = (value) => WORK_ATTRIBUTES.includes(value);

export const getWorkCategoryLabel = (category) =>
  WORK_CATEGORY_LABELS[isWorkCategory(category) ? category : 'all'];

export const getWorkAttributeLabel = (attribute) =>
  isWorkAttribute(attribute) ? WORK_ATTRIBUTE_LABELS[attribute] : '';

export const getWorkCategories = (work) => {
  const categories = Array.isArray(work?.categories) ? work.categories : [work?.type];

  return categories.filter((category) => category !== 'all' && isWorkCategory(category));
};

export const workMatchesCategory = (work, category) => {
  const normalizedCategory = isWorkCategory(category) ? category : 'all';

  return normalizedCategory === 'all' || getWorkCategories(work).includes(normalizedCategory);
};

export const getWorkCubeOrientation = (category) =>
  WORK_CUBE_ORIENTATIONS[isWorkCategory(category) ? category : 'all'];

export const clampWorkPage = (page, totalPages) => {
  const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const normalizedTotal = Number.isFinite(totalPages) ? Math.floor(totalPages) : 1;
  const lastPage = Math.max(1, normalizedTotal);

  return Math.min(Math.max(1, normalizedPage), lastPage);
};

export const filterAndSortWorks = (works, { category = 'all', workKind = 'original' } = {}) => {
  const normalizedCategory = isWorkCategory(category) ? category : 'all';
  const normalizedKind = isWorkKind(workKind) ? workKind : 'original';

  return [...works]
    .filter((work) => workMatchesCategory(work, normalizedCategory))
    .filter((work) => work.workKind === normalizedKind)
    .sort((a, b) => b.id - a.id);
};

export const sortWorksForFlow = (works, { workKind = 'original' } = {}) => {
  const normalizedKind = isWorkKind(workKind) ? workKind : 'original';

  return [...works].filter((work) => work.workKind === normalizedKind).sort((a, b) => b.id - a.id);
};
