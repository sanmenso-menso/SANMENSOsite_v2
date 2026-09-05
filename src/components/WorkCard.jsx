import React from 'react';
import { ArrowUpRight, Music, Palette, RadioTower } from 'lucide-react';
import { NUMUNUMU_SHORT_TEXT, NUMUNUMU_TEXT } from '../NumunumuContext';
import { getWorkAttributeLabel, getWorkCategories, getWorkCategoryLabel } from '../utils/works';
import ImageWithFallback from './ImageWithFallback';

const getFallbackIcon = (type, size = 64) => {
  if (type === 'music') return <Music size={size} className="opacity-50" />;
  if (type === 'visual') return <Palette size={size} className="opacity-50" />;
  return <RadioTower size={size} className="opacity-50" />;
};

const WORK_CATEGORY_SURFACES = Object.freeze({
  music: '#ffd9d9',
  visual: '#fff0a6',
  live: '#d8f5df',
});

const getWorkCategorySurface = (work) => {
  const colors = getWorkCategories(work).map(
    (category) => WORK_CATEGORY_SURFACES[category] ?? '#ffffff',
  );

  if (colors.length <= 1) return colors[0] ?? '#ffffff';

  const segmentWidth = 100 / colors.length;
  const colorStops = colors.flatMap((color, index) => [
    `${color} ${index * segmentWidth}%`,
    `${color} ${(index + 1) * segmentWidth}%`,
  ]);

  return `linear-gradient(135deg, ${colorStops.join(', ')})`;
};

const getWorkTitleSizeClass = (title = '') => {
  const titleLength = Array.from(title).length;

  if (titleLength >= 32) return 'text-base leading-tight md:text-lg';
  if (titleLength >= 20) return 'text-lg leading-tight md:text-xl';
  return 'text-xl leading-none md:text-2xl';
};

const CompactWorkCardContents = ({ work, isClone, isNumunumuMode }) => (
  <div className="work-card-compact__image">
    <ImageWithFallback
      src={work.image}
      alt={isClone ? '' : work.title}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      fallback={
        <>
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: work.color || '#cccccc' }}
          />
          {getFallbackIcon(work.type, 28)}
        </>
      }
    />
    <span className="work-card-compact__category" aria-hidden="true">
      {isNumunumuMode
        ? NUMUNUMU_SHORT_TEXT
        : getWorkCategories(work)
            .map((category) => getWorkCategoryLabel(category).slice(0, 1))
            .join('/')}
    </span>
  </div>
);

const WorkCardContents = ({ work, isNumunumuMode, isClone, isFlowItem, onReadMore, isReadMoreDisabled }) => (
  <>
    <div className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rotate-[-2deg] bg-yellow-400/80 opacity-80 shadow-sm" />
    <div className="relative mb-3 flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden border-2 border-black bg-gray-100">
      <ImageWithFallback
        src={work.image}
        alt={isClone ? '' : work.title}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        fallback={
          <>
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundColor: work.color || '#cccccc' }}
            />
            {getFallbackIcon(work.type)}
          </>
        }
      />
    </div>
    <div className="mb-2 flex items-start justify-between border-b-2 border-dashed border-black pb-2">
      <h3
        className={`work-card__title font-sans font-black tracking-tight ${getWorkTitleSizeClass(work.title)} ${
          isFlowItem ? 'line-clamp-3' : ''
        }`}
      >
        {work.title}
      </h3>
      <span className="rotate-3 bg-black px-1 py-0.5 font-mono text-xs text-white">
        {work.year}
      </span>
    </div>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {getWorkCategories(work).map((category) => (
        <span
          key={category}
          className="rounded-full border border-black bg-yellow-300 px-2 py-0.5 font-mono text-xs font-bold"
        >
          {isNumunumuMode ? NUMUNUMU_TEXT : getWorkCategoryLabel(category)}
        </span>
      ))}
      <span className={`work-kind-badge work-kind-badge--${work.workKind}`}>
        <span className="work-kind-badge__shape" aria-hidden="true" />
        {isNumunumuMode ? NUMUNUMU_TEXT : work.workKind === 'original' ? 'ORIGINAL' : 'CLIENT'}
      </span>
      {(work.attributes ?? []).map((attribute) => (
        <span
          key={attribute}
          className={`work-attribute-badge work-attribute-badge--${attribute}`}
        >
          {isNumunumuMode ? NUMUNUMU_TEXT : getWorkAttributeLabel(attribute)}
        </span>
      ))}
      <span className="font-mono text-xs opacity-60">{work.role}</span>
    </div>
    <p
      className={`work-card__description mb-3 font-sans text-sm font-medium leading-snug opacity-80 ${
        isFlowItem ? 'line-clamp-2 flex-none' : 'line-clamp-3 flex-grow'
      }`}
    >
      {work.desc}
    </p>
    <div className="mt-auto flex justify-end">
      {onReadMore ? (
        <button type="button" onClick={onReadMore} disabled={isReadMoreDisabled}
          aria-label={`${work.title}の詳細を開く`}
          className="border-b-2 border-black text-sm font-bold disabled:opacity-50">
          {isNumunumuMode ? NUMUNUMU_TEXT : 'READ MORE'} ↗
        </button>
      ) : (
      <span className="flex items-center gap-1 border-b-2 border-transparent font-sans text-sm font-bold transition-all group-hover:border-black">
        {isNumunumuMode ? NUMUNUMU_TEXT : 'READ MORE'} <ArrowUpRight size={16} />
      </span>
      )}
    </div>
  </>
);

const WorkCard = ({
  work,
  onOpen,
  isReadMoreDisabled = false,
  isNumunumuMode = false,
  isClone = false,
  isCompact = false,
  isFlowItem = false,
  isShootingTarget = false,
}) => {
  const flowClass = isFlowItem
    ? isCompact
      ? 'work-card--compact'
      : 'work-card--flow-selected'
    : '';
  const interactionClass = isClone
    ? 'pointer-events-none'
    : isShootingTarget
      ? 'cursor-crosshair'
      : 'cursor-pointer hover:-translate-y-2 hover:rotate-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.3)]';
  const className = `work-card work-card--kind-${work.workKind} ${flowClass} group relative flex flex-col overflow-hidden border-4 p-3 text-left shadow-[6px_6px_0px_rgba(0,0,0,0.3)] transition-all duration-300 md:p-4 ${interactionClass}`;
  const cardStyle = { '--work-card-category-surface': getWorkCategorySurface(work) };

  const contents = isCompact ? (
    <CompactWorkCardContents
      work={work}
      isClone={isClone}
      isNumunumuMode={isNumunumuMode}
    />
  ) : (
    <WorkCardContents
      work={work}
      isNumunumuMode={isNumunumuMode}
      isClone={isClone}
      isFlowItem={isFlowItem}
      onReadMore={isShootingTarget ? () => onOpen(work) : undefined}
      isReadMoreDisabled={isReadMoreDisabled}
    />
  );

  if (isClone && !isShootingTarget) {
    return (
      <div className={className} style={cardStyle} aria-hidden="true" inert="">
        {contents}
      </div>
    );
  }

  if (isShootingTarget) {
    return (
      <div className={className} style={cardStyle} data-shooting-prize="true">
        {contents}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(work)}
      aria-label={`${work.title}${isCompact ? '（選択カテゴリー外）' : ''}の詳細を開く`}
      className={className}
      style={cardStyle}
    >
      {contents}
    </button>
  );
};

export default WorkCard;
