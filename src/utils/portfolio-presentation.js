import { SELECTED_WORK_IDS, WORK_FIELD_OVERRIDES } from '../config/portfolio.js';

export function shuffleWorks(works, random = Math.random) {
  const result = [...works];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function splitSelectedWorks(works, selectedIds = SELECTED_WORK_IDS) {
  const selected = selectedIds.map((id) => works.find((work) => work.id === id)).filter(Boolean);
  const ids = new Set(selectedIds);
  return { selected, remaining: works.filter((work) => !ids.has(work.id)) };
}

export function workField(work) {
  if (WORK_FIELD_OVERRIDES[work.id]) return WORK_FIELD_OVERRIDES[work.id];
  if (work.url && new URL(work.url).hostname === 'store.steampowered.com') return 'game';
  if (work.roles.includes('DJ')) return 'dj';
  if (work.roles.some((role) => ['映像', '編集', '撮影'].includes(role))) return 'video';
  return 'music';
}
