export const WORK_CATEGORIES = Object.freeze(['all', 'music', 'entame', 'fun']);
export const WORK_KINDS = Object.freeze(['original', 'client']);

export const WORK_CATEGORY_LABELS = Object.freeze({
  all: 'ALL',
  music: 'CREATE',
  entame: 'ENTAME',
  fun: 'FUN',
});

export const WORK_CUBE_ORIENTATIONS = Object.freeze({
  all: Object.freeze({ x: -20, y: -25 }),
  entame: Object.freeze({ x: 0, y: 0 }),
  fun: Object.freeze({ x: 0, y: -90 }),
  music: Object.freeze({ x: -90, y: 0 }),
});

export const isWorkCategory = (value) => WORK_CATEGORIES.includes(value);
export const isWorkKind = (value) => WORK_KINDS.includes(value);

export const getWorkCategoryLabel = (category) =>
  WORK_CATEGORY_LABELS[isWorkCategory(category) ? category : 'all'];

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
    .filter((work) => normalizedCategory === 'all' || work.type === normalizedCategory)
    .filter((work) => work.workKind === normalizedKind)
    .sort((a, b) => b.id - a.id);
};

export const sortWorksForFlow = (works, { workKind = 'original' } = {}) => {
  const normalizedKind = isWorkKind(workKind) ? workKind : 'original';

  return [...works].filter((work) => work.workKind === normalizedKind).sort((a, b) => b.id - a.id);
};
