// Presentation settings. IDs are stable across row/date changes in the Sheet.
export const SELECTED_WORK_IDS = [
  'work-f91e3574', // 妹、他者、パラノイア
  'work-e017e5c6', // CDs YouTubeMusicWeekend 2026
  'work-64c6297b', // Hello, Morning (rework by CDs)
  'work-4a8b5a3c', // 神風帝国 メインテーマ
  'work-033e578b', // VIRAL 2025.10.19
  'work-8102ef39', // GOLD DISC 25.08.16
  'work-5dace6ae', // It started to Rein
];

export const WORKS_SHUFFLE_INTERVAL = 30_000;

// Overrides take precedence over URL/role inference for mixed-media works.
export const WORK_FIELD_OVERRIDES = {
  'work-4a8b5a3c': 'game',
};
