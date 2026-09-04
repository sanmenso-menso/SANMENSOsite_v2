const INERTIA_DECAY_PER_FRAME = 0.88;
const MAX_INERTIA_SPEED_PX_PER_SECOND = 900;

export const clampFlowInertia = (velocity) =>
  Math.max(
    -MAX_INERTIA_SPEED_PX_PER_SECOND,
    Math.min(MAX_INERTIA_SPEED_PX_PER_SECOND, velocity),
  );

export const decayFlowInertia = (velocity, elapsedMilliseconds) =>
  velocity * Math.pow(INERTIA_DECAY_PER_FRAME, elapsedMilliseconds / (1000 / 60));

export const accumulateFlowScrollDelta = (delta, previousRemainder = 0) => {
  const preciseDelta = delta + previousRemainder;
  const pixels = Math.trunc(preciseDelta);

  return {
    pixels,
    remainder: preciseDelta - pixels,
  };
};
