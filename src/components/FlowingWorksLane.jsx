import React, { useEffect, useRef, useState } from 'react';
import { NUMUNUMU_TEXT } from '../NumunumuContext';
import {
  accumulateFlowScrollDelta,
  clampFlowInertia,
  decayFlowInertia,
} from '../utils/flowInertia';
import {
  getShootingDifficulty,
  getShootingHitDirection,
  getShootingPoints,
  getShootingPrizePoints,
  getShootingShiftOffset,
  isShootingPointInBounds,
} from '../utils/shootingGallery';
import { workMatchesCategory } from '../utils/works';
import WorkCard from './WorkCard';

const FLOW_LAYOUTS = [
  { y: -108, rotate: -2.6, gap: 44, z: 3 },
  { y: 82, rotate: 1.8, gap: 18, z: 5 },
  { y: -24, rotate: -1.1, gap: -14, z: 2 },
  { y: 116, rotate: 2.7, gap: 54, z: 4 },
  { y: -88, rotate: 1.2, gap: 28, z: 6 },
  { y: 44, rotate: -2.1, gap: 60, z: 2 },
  { y: 104, rotate: 1.4, gap: 12, z: 5 },
  { y: -54, rotate: 2.3, gap: -10, z: 3 },
  { y: 12, rotate: -1.7, gap: 48, z: 4 },
  { y: 112, rotate: -2.8, gap: 22, z: 6 },
  { y: -96, rotate: 1.9, gap: 58, z: 2 },
  { y: -8, rotate: 0.8, gap: 32, z: 4 },
];

const COMPACT_Y_OFFSETS = [126, -132, 96, -104, 18, 136, -118, 72, -62, 118, -92, 4];
const DRAG_THRESHOLD_PX = 6;
const INERTIA_MIN_SPEED_PX_PER_SECOND = 8;
const INERTIA_RELEASE_TIMEOUT_MS = 100;
const KEYBOARD_SCROLL_PX = 96;
const MAX_AUTO_SCROLL_FRAME_MS = 64;
const NOOP = () => {};

const normalizeLoopingScrollPosition = (viewport, setWidth) => {
  if (!viewport || setWidth <= 0) return;

  if (viewport.scrollLeft <= 0) {
    viewport.scrollLeft += setWidth;
  } else if (viewport.scrollLeft >= setWidth * 2) {
    viewport.scrollLeft -= setWidth;
  }
};

const applyPreciseScrollDelta = (viewport, delta, remainderRef) => {
  const { pixels, remainder } = accumulateFlowScrollDelta(delta, remainderRef.current);
  remainderRef.current = remainder;
  if (pixels !== 0) viewport.scrollLeft += pixels;
};

const getFlowPlacementStyle = (workId, index, isCompact) => {
  const numericId = Number(workId) || 0;
  const placementIndex = Math.abs(numericId * 5 + index * 3) % FLOW_LAYOUTS.length;
  const layout = FLOW_LAYOUTS[placementIndex];
  const y = isCompact ? COMPACT_Y_OFFSETS[placementIndex] : layout.y;
  const mobileY = Math.max(-12, Math.min(12, Math.round(y * 0.1)));
  const mobileRotate = Math.max(-1.5, Math.min(1.5, layout.rotate * 0.5));

  return {
    '--flow-y': `${y}px`,
    '--flow-rotate': `${layout.rotate}deg`,
    '--flow-gap-after': `${layout.gap}px`,
    '--flow-z': `${layout.z}`,
    '--flow-mobile-y': `${mobileY}px`,
    '--flow-mobile-rotate': `${mobileRotate}deg`,
    '--flow-mobile-gap': `${Math.max(layout.gap, isCompact ? 22 : 38)}px`,
  };
};

const FlowingWorksLane = ({
  works,
  onOpen,
  isBulletInFlight = false,
  isStopped,
  isDialogOpen,
  selectedCategory = 'all',
  isNumunumuMode = false,
  isShootingMode = false,
  shotToken = 0,
  projectileToken = 0,
  onShotResult = NOOP,
  children = null,
}) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hitStates, setHitStates] = useState(() => new Map());
  const viewportRef = useRef(null);
  const primarySetRef = useRef(null);
  const dragStateRef = useRef(null);
  const inertiaVelocityRef = useRef(0);
  const previousShotTokenRef = useRef(shotToken);
  const scrollRemainderRef = useRef(0);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef(null);

  const isPaused = isShootingMode
    ? isDialogOpen
    : isStopped || isDialogOpen || isCardHovered || isDragging;
  const selectedCount = isShootingMode
    ? works.length
    : works.filter((work) => workMatchesCategory(work, selectedCategory)).length;
  const compactCount = works.length - selectedCount;
  const duration = Math.max(32, selectedCount * 8 + compactCount * 2.4);
  const renderFlowItems = (isClone = false) =>
    works.map((work, index) => {
      const isCompact = isShootingMode
        ? false
        : !workMatchesCategory(work, selectedCategory);
      const hitState = hitStates.get(work.id);
      const isKnockedDown = hitState?.direction === 'center';
      const isSideShifted = Boolean(hitState && !isKnockedDown && hitState.offsetX !== 0);
      const placementStyle = getFlowPlacementStyle(work.id, index, isCompact);
      const prizePoints = getShootingPrizePoints(work);
      const shootingDifficulty = getShootingDifficulty(work);

      return (
        <div
          key={isClone ? `clone-${work.id}` : work.id}
          className={`works-flow-item${isCompact ? ' works-flow-item--compact' : ''}${
            isKnockedDown ? ' works-flow-item--hit works-flow-item--hit-center' : ''
          }${isSideShifted ? ' works-flow-item--side-shifted' : ''}${
            isShootingMode ? ' works-flow-item--shooting-prize' : ''
          }`}
          style={{
            ...placementStyle,
            ...(isShootingMode
              ? {
                  '--flow-y': '0px',
                  '--flow-rotate': '0deg',
                  '--flow-gap-after': '48px',
                  '--flow-mobile-y': '0px',
                  '--flow-mobile-rotate': '0deg',
                  '--flow-mobile-gap': '36px',
                  '--shooting-offset-x': `${hitState?.offsetX ?? 0}px`,
                  '--shooting-scale': shootingDifficulty.scale,
                  '--shooting-float-distance': `${shootingDifficulty.floatDistance}px`,
                  '--shooting-float-duration': `${shootingDifficulty.floatDuration}s`,
                }
              : {}),
          }}
          data-work-id={work.id}
          data-shooting-difficulty={isShootingMode ? shootingDifficulty.level : undefined}
          onMouseEnter={isClone ? undefined : () => setIsCardHovered(true)}
          onMouseLeave={isClone ? undefined : () => setIsCardHovered(false)}
        >
          {isShootingMode && (
            <span className="shooting-prize-points">
              {isNumunumuMode ? NUMUNUMU_TEXT : `${prizePoints} POINTS`}
            </span>
          )}
          <WorkCard
            work={work}
            onOpen={onOpen}
            isReadMoreDisabled={isBulletInFlight || isKnockedDown}
            isNumunumuMode={isNumunumuMode}
            isCompact={isCompact}
            isFlowItem
            isClone={isClone}
            isShootingTarget={isShootingMode}
          />
        </div>
      );
    });

  useEffect(() => {
    const viewport = viewportRef.current;
    const primarySet = primarySetRef.current;
    if (!viewport || !primarySet) return undefined;

    let previousSetWidth = primarySet.offsetWidth;
    scrollRemainderRef.current = 0;
    viewport.scrollLeft = previousSetWidth;

    const resizeObserver = new ResizeObserver(() => {
      const nextSetWidth = primarySet.offsetWidth;
      if (nextSetWidth <= 0 || nextSetWidth === previousSetWidth) return;

      viewport.scrollLeft += nextSetWidth - previousSetWidth;
      previousSetWidth = nextSetWidth;
      normalizeLoopingScrollPosition(viewport, nextSetWidth);
    });

    resizeObserver.observe(primarySet);
    return () => resizeObserver.disconnect();
  }, [works]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const primarySet = primarySetRef.current;
    if (!viewport || !primarySet) return undefined;

    let animationFrameId;
    let previousTime = performance.now();

    const advanceFlow = (currentTime) => {
      const elapsed = Math.min(currentTime - previousTime, MAX_AUTO_SCROLL_FRAME_MS);
      previousTime = currentTime;

      if (!dragStateRef.current?.moved) {
        const setWidth = primarySet.offsetWidth;
        if (setWidth > 0) {
          let scrollDelta = 0;

          if (isDialogOpen) {
            inertiaVelocityRef.current = 0;
          } else if (
            Math.abs(inertiaVelocityRef.current) >= INERTIA_MIN_SPEED_PX_PER_SECOND
          ) {
            scrollDelta += inertiaVelocityRef.current * (elapsed / 1000);
            inertiaVelocityRef.current = decayFlowInertia(inertiaVelocityRef.current, elapsed);
          } else {
            inertiaVelocityRef.current = 0;
          }

          if (!isPaused) {
            scrollDelta += (setWidth / duration) * (elapsed / 1000);
          }

          applyPreciseScrollDelta(viewport, scrollDelta, scrollRemainderRef);
          normalizeLoopingScrollPosition(viewport, setWidth);
        }
      }

      animationFrameId = window.requestAnimationFrame(advanceFlow);
    };

    animationFrameId = window.requestAnimationFrame(advanceFlow);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [duration, isDialogOpen, isPaused]);

  useEffect(
    () => () => {
      if (suppressClickTimerRef.current) window.clearTimeout(suppressClickTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (isShootingMode) return;

    setHitStates(new Map());
    setIsCardHovered(false);
    previousShotTokenRef.current = shotToken;
  }, [isShootingMode, shotToken]);

  useEffect(() => {
    if (!isShootingMode || shotToken === previousShotTokenRef.current) return;
    previousShotTokenRef.current = shotToken;

    const viewport = viewportRef.current;
    const primarySet = primarySetRef.current;
    if (!viewport || !primarySet) return;

    const viewportBounds = viewport.getBoundingClientRect();
    const hitX = viewportBounds.left + viewportBounds.width * 0.5;
    const hitY = viewportBounds.top + viewportBounds.height * 0.5;
    // Geometry also works when page scrolling puts the aim outside the viewport.
    const targetCard = Array.from(viewport.querySelectorAll('.work-card')).find((card) => {
      const item = card.closest('.works-flow-item');
      return item && !item.classList.contains('works-flow-item--hit-center') &&
        isShootingPointInBounds(hitX, hitY, card.getBoundingClientRect());
    });
    const target = targetCard?.closest('.works-flow-item');

    const targetWork = works.find((work) => String(work.id) === target?.dataset.workId);
    const workId = targetWork?.id;
    const currentHitState = hitStates.get(workId);
    if (!target || !workId || currentHitState?.direction === 'center') {
      onShotResult({ hit: false, points: 0 });
      return;
    }

    const targetBounds = targetCard.getBoundingClientRect();
    const direction = getShootingHitDirection(hitX, targetBounds.left, targetBounds.width);
    const points = getShootingPoints(direction, targetWork);
    setHitStates((currentStates) => {
      const nextStates = new Map(currentStates);
      const previousState = currentStates.get(workId);
      nextStates.set(workId, {
        direction,
        offsetX: getShootingShiftOffset(direction, previousState?.offsetX ?? 0),
      });
      return nextStates;
    });
    onShotResult({ hit: true, points, direction, workId });
  }, [hitStates, isShootingMode, onShotResult, shotToken, works]);

  const handlePointerDown = (event) => {
    if (isShootingMode) return;
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    inertiaVelocityRef.current = 0;
    scrollRemainderRef.current = 0;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      moved: false,
      velocity: 0,
    };
  };

  const handlePointerMove = (event) => {
    if (isShootingMode) return;
    const dragState = dragStateRef.current;
    const viewport = viewportRef.current;
    if (!dragState || !viewport || dragState.pointerId !== event.pointerId) return;

    const totalDistance = Math.abs(event.clientX - dragState.startX);
    if (!dragState.moved && totalDistance >= DRAG_THRESHOLD_PX) {
      dragState.moved = true;
      suppressClickRef.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (!dragState.moved) return;

    event.preventDefault();
    const scrollDelta = dragState.lastX - event.clientX;
    const elapsed = Math.max(event.timeStamp - dragState.lastTime, 1);
    const instantVelocity = (scrollDelta / elapsed) * 1000;

    applyPreciseScrollDelta(viewport, scrollDelta, scrollRemainderRef);
    dragState.lastX = event.clientX;
    dragState.lastTime = event.timeStamp;
    dragState.velocity = dragState.velocity * 0.65 + instantVelocity * 0.35;
    normalizeLoopingScrollPosition(viewport, primarySetRef.current?.offsetWidth ?? 0);
  };

  const finishPointerDrag = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const timeSinceLastMove = Math.max(event.timeStamp - dragState.lastTime, 0);
    inertiaVelocityRef.current =
      dragState.moved && event.type === 'pointerup' && timeSinceLastMove < INERTIA_RELEASE_TIMEOUT_MS
        ? clampFlowInertia(
            dragState.velocity * (1 - timeSinceLastMove / INERTIA_RELEASE_TIMEOUT_MS),
          )
        : 0;

    if (dragState.moved) setIsCardHovered(false);

    dragStateRef.current = null;
    setIsDragging(false);

    if (suppressClickRef.current) {
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, 0);
    }
  };

  const handleClickCapture = (event) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleScroll = () => {
    normalizeLoopingScrollPosition(
      viewportRef.current,
      primarySetRef.current?.offsetWidth ?? 0,
    );
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    if (isShootingMode) return;
    if (!viewportRef.current) return;

    scrollRemainderRef.current = 0;
    viewportRef.current.scrollLeft +=
      event.key === 'ArrowRight' ? KEYBOARD_SCROLL_PX : -KEYBOARD_SCROLL_PX;
    handleScroll();
  };

  if (works.length === 0) {
    return (
      <p className="works-empty-state" role="status">
        {isNumunumuMode ? NUMUNUMU_TEXT : 'この条件に該当する作品はありません。'}
      </p>
    );
  }

  return (
    <section
      className={`works-waterway${isShootingMode ? ' works-waterway--shooting' : ''}`}
      aria-label={isShootingMode ? '射的の景品として並ぶ作品一覧' : '作品が流れる一覧'}
      data-booth-label={isNumunumuMode ? NUMUNUMU_TEXT : 'ポートフォリオ射的'}
    >
      <p id="works-flow-instructions" className="sr-only" aria-live="polite">
        {isShootingMode ? (
          <>作品は動き続けます。中央の照準に景品を合わせて発射してください。</>
        ) : (
          <>
            {isPaused ? '作品の流れを停止しています。' : '作品が一定速度で流れています。'}
            レーンは左右にドラッグ、スワイプ、または左右キーで移動できます。
          </>
        )}
      </p>
      <div
        ref={viewportRef}
        className="works-flow-viewport"
        data-dragging={isDragging ? 'true' : 'false'}
        tabIndex="0"
        aria-describedby="works-flow-instructions"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onClickCapture={handleClickCapture}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        {isShootingMode && (
          <>
            <div className="shooting-crosshair" aria-hidden="true" />
            {projectileToken > 0 && (
              <span key={projectileToken} className="shooting-projectile" aria-hidden="true" />
            )}
          </>
        )}
        <div
          className="works-flow-track"
          data-paused={isPaused ? 'true' : 'false'}
        >
          <div className="works-flow-set" aria-hidden={isShootingMode ? undefined : true} inert={isShootingMode ? undefined : ''}>
            {renderFlowItems(true)}
          </div>
          <div ref={primarySetRef} className="works-flow-set">
            {renderFlowItems()}
          </div>
          <div className="works-flow-set" aria-hidden={isShootingMode ? undefined : true} inert={isShootingMode ? undefined : ''}>
            {renderFlowItems(true)}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
};

export default FlowingWorksLane;
