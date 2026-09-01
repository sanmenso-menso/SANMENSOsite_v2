import React from 'react';
import { ArrowUpRight, Music, Palette, RadioTower } from 'lucide-react';
import { getWorkAttributeLabel, getWorkCategories, getWorkCategoryLabel } from '../utils/works';
import ImageWithFallback from './ImageWithFallback';

const getFallbackIcon = (type, size = 64) => {
  if (type === 'music') return <Music size={size} className="opacity-50" />;
  if (type === 'visual') return <Palette size={size} className="opacity-50" />;
  return <RadioTower size={size} className="opacity-50" />;
};

const CompactWorkCardContents = ({ work, isClone }) => (
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
      {getWorkCategories(work)
        .map((category) => getWorkCategoryLabel(category).slice(0, 1))
        .join('/')}
    </span>
  </div>
);

const WorkCardContents = ({ work, isNumunumuMode, isClone }) => (
  <>
    <div className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rotate-[-2deg] bg-yellow-400/80 opacity-80 shadow-sm" />
    <div className="relative mb-3 flex aspect-video w-full items-center justify-center overflow-hidden border-2 border-black bg-gray-100">
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
      <h3 className="font-sans text-xl font-black leading-none tracking-tight md:text-2xl">
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
          {getWorkCategoryLabel(category)}
        </span>
      ))}
      <span className={`work-kind-badge work-kind-badge--${work.workKind}`}>
        <span className="work-kind-badge__shape" aria-hidden="true" />
        {work.workKind === 'original' ? 'ORIGINAL' : 'CLIENT'}
      </span>
      {(work.attributes ?? []).map((attribute) => (
        <span
          key={attribute}
          className={`work-attribute-badge work-attribute-badge--${attribute}`}
        >
          {getWorkAttributeLabel(attribute)}
        </span>
      ))}
      <span className="font-mono text-xs opacity-60">{work.role}</span>
    </div>
    <p className="mb-3 line-clamp-3 flex-grow font-sans text-sm font-medium leading-snug opacity-80">
      {work.desc}
    </p>
    <div className="mt-auto flex justify-end">
      <span className="flex items-center gap-1 border-b-2 border-transparent font-sans text-sm font-bold transition-all group-hover:border-black">
        {isNumunumuMode ? 'ぬむぬむとんかつ' : 'READ MORE'} <ArrowUpRight size={16} />
      </span>
    </div>
  </>
);

const WorkCard = ({
  work,
  onOpen,
  isNumunumuMode = false,
  isClone = false,
  isCompact = false,
  isFlowItem = false,
}) => {
  const flowClass = isFlowItem
    ? isCompact
      ? 'work-card--compact'
      : 'work-card--flow-selected'
    : '';
  const className = `work-card ${flowClass} group relative flex flex-col overflow-hidden border-4 border-black bg-white p-3 text-left shadow-[6px_6px_0px_rgba(0,0,0,0.3)] transition-all duration-300 md:p-4 ${isClone ? 'pointer-events-none' : 'cursor-pointer hover:-translate-y-2 hover:rotate-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.3)]'}`;

  const contents = isCompact ? (
    <CompactWorkCardContents work={work} isClone={isClone} />
  ) : (
    <WorkCardContents work={work} isNumunumuMode={isNumunumuMode} isClone={isClone} />
  );

  if (isClone) {
    return (
      <div className={className} aria-hidden="true" inert="">
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
    >
      {contents}
    </button>
  );
};

export default WorkCard;
