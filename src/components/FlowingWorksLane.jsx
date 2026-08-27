import React, { useState } from 'react';
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
  isStopped,
  isDialogOpen,
  selectedCategory = 'all',
  isNumunumuMode = false,
}) => {
  const [isCardHovered, setIsCardHovered] = useState(false);

  if (works.length === 0) {
    return (
      <p className="works-empty-state" role="status">
        この条件に該当する作品はありません。
      </p>
    );
  }

  const isPaused = isStopped || isDialogOpen || isCardHovered;
  const selectedCount = works.filter(
    (work) => selectedCategory === 'all' || work.type === selectedCategory,
  ).length;
  const compactCount = works.length - selectedCount;
  const duration = Math.max(32, selectedCount * 8 + compactCount * 2.4);
  const renderFlowItems = (isClone = false) =>
    works.map((work, index) => {
      const isCompact = selectedCategory !== 'all' && work.type !== selectedCategory;

      return (
        <div
          key={isClone ? `clone-${work.id}` : work.id}
          className={`works-flow-item${isCompact ? ' works-flow-item--compact' : ''}`}
          style={getFlowPlacementStyle(work.id, index, isCompact)}
          onMouseEnter={isClone ? undefined : () => setIsCardHovered(true)}
          onMouseLeave={isClone ? undefined : () => setIsCardHovered(false)}
        >
          <WorkCard
            work={work}
            onOpen={onOpen}
            isNumunumuMode={isNumunumuMode}
            isCompact={isCompact}
            isFlowItem
            isClone={isClone}
          />
        </div>
      );
    });

  return (
    <section className="works-waterway" aria-label="作品が流れる一覧">
      <p className="sr-only" aria-live="polite">
        {isPaused ? '作品の流れを停止しています。' : '作品が一定速度で流れています。'}
      </p>
      <div className="works-flow-viewport">
        <div
          className="works-flow-track"
          data-paused={isPaused ? 'true' : 'false'}
          style={{ '--works-flow-duration': `${duration}s` }}
        >
          <div className="works-flow-set">{renderFlowItems()}</div>
          <div className="works-flow-set" aria-hidden="true" inert="">
            {renderFlowItems(true)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlowingWorksLane;
