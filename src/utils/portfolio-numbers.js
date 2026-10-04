// @ts-check
/** Number the current public works by release date, independently of their display order. */
export function assignWorkNumbers(works) {
  const ids = new Set();
  for (const work of works) {
    if (!/^work-[a-f0-9]{8}$/.test(work.id) || ids.has(work.id))
      throw new Error('作品番号を割り当てる作品IDが不正、または重複しています。');
    ids.add(work.id);
  }
  const ordered = [...works].sort((a, b) => {
    // Undated works follow dated works; ties never depend on the Sheet or shuffle order.
    if (!a.date && b.date) return 1;
    if (a.date && !b.date) return -1;
    return (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id);
  });
  /** @type {Record<string, number>} */
  const assignments = Object.fromEntries(ordered.map((work, index) => [work.id, index + 1]));
  return { assignments, works: works.map((work) => ({ ...work, number: assignments[work.id] })) };
}
