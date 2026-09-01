export const CUBE_ROUTE_TRANSITION_SECONDS = 0.95;
export const ROUTE_TRANSITION_LOCK_MS = 1100;

export const isHomeEntryReady = ({ pathname, currentEntryKey, completedEntryKey }) =>
  pathname === '/' && Boolean(currentEntryKey) && completedEntryKey === currentEntryKey;

export const canCompleteReturningCubeIntro = ({
  isReturningFromWorks,
  isOpening,
  hasReturnAnimationCompleted,
}) => isReturningFromWorks && !isOpening && hasReturnAnimationCompleted;

export const canStartRouteTransition = ({
  currentPath,
  targetPath,
  isTransitioning,
  isCurrentHomeReady,
}) => {
  if (currentPath === targetPath || isTransitioning) return false;
  if (currentPath === '/' && !isCurrentHomeReady) return false;
  return true;
};
