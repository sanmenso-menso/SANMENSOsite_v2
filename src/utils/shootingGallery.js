export const SHOOTING_ORIGINAL_POINTS = 400;
export const SHOOTING_CLIENT_POINTS = 600;
export const SHOOTING_ATTRIBUTE_BONUS_POINTS = 100;
export const SHOOTING_SHIFT_STEP_PX = 48;
export const SHOOTING_MAX_SHIFT_PX = 96;

export const isShootingPointInBounds = (x, y, bounds) =>
  bounds.width > 0 && bounds.height > 0 &&
  x >= bounds.left && x <= bounds.right &&
  y >= bounds.top && y <= bounds.bottom;

export const getShootingPrizePoints = (work) => {
  const basePoints =
    work?.workKind === 'client' ? SHOOTING_CLIENT_POINTS : SHOOTING_ORIGINAL_POINTS;
  const attributeCount = Array.isArray(work?.attributes) ? work.attributes.length : 0;

  return basePoints + attributeCount * SHOOTING_ATTRIBUTE_BONUS_POINTS;
};

export const getShootingDifficulty = (work) => {
  const points = getShootingPrizePoints(work);
  const level = Math.max(0, (points - SHOOTING_ORIGINAL_POINTS) / 100);

  return {
    level,
    scale: Math.max(0.76, 1 - level * 0.06),
    floatDistance: Math.min(10, level * 2),
    floatDuration: Math.max(2, 3.4 - level * 0.25),
  };
};

export const getShootingHitDirection = (hitX, targetLeft, targetWidth) => {
  if (targetWidth <= 0) return 'center';

  const normalizedOffset = (hitX - (targetLeft + targetWidth / 2)) / targetWidth;
  if (Math.abs(normalizedOffset) <= 0.07) return 'center';
  return normalizedOffset < 0 ? 'left' : 'right';
};

export const getShootingShiftOffset = (hitDirection, currentOffset = 0) => {
  if (hitDirection === 'center') return currentOffset;

  const shiftDelta =
    hitDirection === 'left' ? SHOOTING_SHIFT_STEP_PX : -SHOOTING_SHIFT_STEP_PX;
  return Math.max(
    -SHOOTING_MAX_SHIFT_PX,
    Math.min(SHOOTING_MAX_SHIFT_PX, currentOffset + shiftDelta),
  );
};

export const getShootingPoints = (hitDirection, work) =>
  hitDirection === 'center' ? getShootingPrizePoints(work) : 0;
