import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  ExternalLink,
  Music,
  Palette,
  Pause,
  Play,
  RadioTower,
  Tag,
  User,
  X,
} from 'lucide-react';
import AccessibleDialog from '../components/AccessibleDialog';
import FlowingWorksLane from '../components/FlowingWorksLane';
import ImageWithFallback from '../components/ImageWithFallback';
import ShootingGalleryControls, {
  ShootingModeToggle,
} from '../components/ShootingGalleryControls';
import WorkCard from '../components/WorkCard';
import WorkFilterCube from '../components/WorkFilterCube';
import { WORKS_DATA } from '../constants';
import { NUMUNUMU_IMAGE, NUMUNUMU_TEXT, useNumunumu } from '../NumunumuContext';
import {
  clampWorkPage,
  filterAndSortWorks,
  getWorkAttributeLabel,
  getWorkCategories,
  getWorkCategoryLabel,
  sortWorksForFlow,
} from '../utils/works';
import './WorksPage.css';

const ITEMS_PER_PAGE = 9;
const SHOOTING_CURTAIN_SWITCH_MS = 2600;
const SHOOTING_CURTAIN_TOTAL_MS = 3400;
const SHOOTING_BULLET_TRAVEL_MS = 650;
const SHOOTING_FINAL_SCORE_MS = 3500;

const CATEGORIES = [
  { id: 'all', label: 'ALL', icon: null },
  { id: 'music', label: getWorkCategoryLabel('music'), icon: Music },
  { id: 'visual', label: getWorkCategoryLabel('visual'), icon: Palette },
  { id: 'live', label: getWorkCategoryLabel('live'), icon: RadioTower },
];

const WORK_KIND_OPTIONS = [
  { id: 'original', label: 'ORIGINAL' },
  { id: 'client', label: 'CLIENT' },
];

const decorateWorks = (works, isNumunumuMode, numuText) => {
  if (!isNumunumuMode) return works;

  return works.map((work) => ({
    ...work,
    title: numuText,
    desc: numuText,
    detailText: numuText,
    role: numuText,
    credits: [numuText],
    year: ' ',
    type: 'visual',
    categories: ['visual'],
    attributes: [],
    image: NUMUNUMU_IMAGE,
  }));
};

const WorksPage = ({ filter = 'all', onFilterChange = () => {}, onRouteAnimationComplete }) => {
  const { isNumunumuMode } = useNumunumu();
  const shouldReduceMotion = useReducedMotion();
  const numuText = NUMUNUMU_TEXT;
  const [selectedWork, setSelectedWork] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [workKind, setWorkKind] = useState('original');
  const [viewMode, setViewMode] = useState('flow');
  const [isFlowStopped, setIsFlowStopped] = useState(false);
  const [isShootingMode, setIsShootingMode] = useState(false);
  const [isShootingTransitioning, setIsShootingTransitioning] = useState(false);
  const [curtainCycle, setCurtainCycle] = useState(0);
  const [curtainMessage, setCurtainMessage] = useState('開店準備中・・・');
  const [shootingScore, setShootingScore] = useState(0);
  const [lastShotResult, setLastShotResult] = useState(null);
  const [shotToken, setShotToken] = useState(0);
  const [resolvedShotToken, setResolvedShotToken] = useState(0);
  const [isBulletInFlight, setIsBulletInFlight] = useState(false);
  const [finalShootingScore, setFinalShootingScore] = useState(null);
  const shootingTimersRef = useRef([]);
  const shotSequenceRef = useRef(0);
  const activeViewMode =
    isShootingMode || finalShootingScore !== null
      ? 'flow'
      : shouldReduceMotion
        ? 'index'
        : viewMode;

  useEffect(
    () => () => {
      shootingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    },
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, workKind]);

  useEffect(() => {
    if (!isNumunumuMode) return;
    setSelectedWork((currentWork) =>
      currentWork ? decorateWorks([currentWork], true, numuText)[0] : currentWork,
    );
  }, [isNumunumuMode, numuText]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  const handleFilterChange = (newFilter) => {
    onFilterChange(newFilter);
    setCurrentPage(1);
  };

  const handleOpenWork = (work) => {
    if (isShootingMode && (isBulletInFlight || isShootingTransitioning)) return;
    setSelectedWork(work);
  };

  const handleCloseWork = () => {
    setSelectedWork(null);
    setIsFlowStopped(false);
  };

  const resetShootingGame = useCallback(() => {
    setShootingScore(0);
    setLastShotResult(null);
    setShotToken(0);
    setResolvedShotToken(0);
    setIsBulletInFlight(false);
    shotSequenceRef.current = 0;
  }, []);

  const handleToggleShootingMode = () => {
    if (isShootingTransitioning) return;

    const nextMode = !isShootingMode;
    const completedScore = shootingScore;
    shootingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    shootingTimersRef.current = [];
    setFinalShootingScore(null);
    setCurtainMessage(nextMode ? '開店準備中・・・' : '閉店作業中');

    if (shouldReduceMotion) {
      resetShootingGame();
      setSelectedWork(null);
      setViewMode('flow');
      setIsFlowStopped(false);
      setIsShootingMode(nextMode);
      if (!nextMode) {
        setFinalShootingScore(completedScore);
        const finalScoreTimer = window.setTimeout(
          () => setFinalShootingScore(null),
          SHOOTING_FINAL_SCORE_MS,
        );
        shootingTimersRef.current = [finalScoreTimer];
      }
      return;
    }

    setIsShootingTransitioning(true);
    setCurtainCycle((cycle) => cycle + 1);

    const switchTimer = window.setTimeout(() => {
      resetShootingGame();
      setSelectedWork(null);
      setViewMode('flow');
      setIsFlowStopped(false);
      setIsShootingMode(nextMode);
    }, SHOOTING_CURTAIN_SWITCH_MS);
    const completionTimer = window.setTimeout(() => {
      setIsShootingTransitioning(false);
      if (!nextMode) {
        setFinalShootingScore(completedScore);
      }
    }, SHOOTING_CURTAIN_TOTAL_MS);

    const finalScoreTimer = !nextMode
      ? window.setTimeout(
          () => setFinalShootingScore(null),
          SHOOTING_CURTAIN_TOTAL_MS + SHOOTING_FINAL_SCORE_MS,
        )
      : null;

    shootingTimersRef.current = [switchTimer, completionTimer, finalScoreTimer].filter(Boolean);
  };

  const handleFire = () => {
    if (!isShootingMode || isShootingTransitioning || isBulletInFlight || selectedWork) return;

    const nextShotToken = shotSequenceRef.current + 1;
    shotSequenceRef.current = nextShotToken;
    setShotToken(nextShotToken);
    setIsBulletInFlight(true);

    const impactTimer = window.setTimeout(() => {
      setResolvedShotToken(nextShotToken);
      setIsBulletInFlight(false);
    }, SHOOTING_BULLET_TRAVEL_MS);
    shootingTimersRef.current.push(impactTimer);
  };

  const handleShotResult = useCallback((result) => {
    if (result.hit && result.points > 0) {
      setShootingScore((score) => score + result.points);
      setLastShotResult(`HIT! +${result.points} pt`);
    } else if (result.hit) {
      setLastShotResult('HIT! 景品がずれた！');
    } else {
      setLastShotResult('MISS!');
    }
  }, []);

  const filteredWorks = useMemo(() => {
    const filtered = filterAndSortWorks(WORKS_DATA, {
      category: filter,
      workKind,
    });

    return decorateWorks(filtered, isNumunumuMode, numuText);
  }, [filter, isNumunumuMode, numuText, workKind]);

  const flowWorks = useMemo(() => {
    const sorted = isShootingMode
      ? [...WORKS_DATA].sort((a, b) => b.id - a.id)
      : sortWorksForFlow(WORKS_DATA, {
          workKind,
        });

    return decorateWorks(sorted, isNumunumuMode, numuText);
  }, [isNumunumuMode, isShootingMode, numuText, workKind]);

  const totalPages = Math.ceil(filteredWorks.length / ITEMS_PER_PAGE);
  const activePage = clampWorkPage(currentPage, totalPages);
  const currentWorks = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredWorks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activePage, filteredWorks]);

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <nav
        aria-label="作品一覧のページ送り"
        className="flex items-center justify-center gap-2 py-8 md:gap-4"
      >
        <button
          type="button"
          aria-label="前のページ"
          onClick={() => handlePageChange(Math.max(activePage - 1, 1))}
          disabled={activePage === 1}
          className="flex h-12 w-12 items-center justify-center border-2 border-black bg-white font-bold text-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        >
          &lt;
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            type="button"
            key={page}
            aria-label={`${page}ページ目`}
            aria-current={activePage === page ? 'page' : undefined}
            onClick={() => handlePageChange(page)}
            className={`flex h-12 w-12 items-center justify-center border-2 border-black font-bold shadow-[4px_4px_0px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] ${
              activePage === page
                ? 'bg-black text-[#FFD700]'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          aria-label="次のページ"
          onClick={() => handlePageChange(Math.min(activePage + 1, totalPages))}
          disabled={activePage === totalPages}
          className="flex h-12 w-12 items-center justify-center border-2 border-black bg-white font-bold text-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        >
          &gt;
        </button>
      </nav>
    );
  };

  return (
    <div
      className={`works-page min-h-screen bg-white px-4 py-8 md:px-6${
        isShootingMode ? ' works-page--shooting' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="works-header mb-8 border-b-4 border-double border-black pb-6 md:mb-12">
          <div className="works-heading">
            <div>
              <h1
                className="font-sans text-5xl font-black leading-none tracking-tighter text-[#FFD700] drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)] sm:text-6xl md:text-8xl"
                style={{ WebkitTextStroke: '2px black' }}
              >
                {isNumunumuMode ? numuText : 'WORKS'}
              </h1>
              <p className="mt-2 font-mono text-base font-bold tracking-wide text-black md:text-lg">
                <span className="bg-black px-2 py-1 text-[#FFD700]">
                  {isNumunumuMode ? numuText : "SANMENso's ARCHIVE"}
                </span>
              </p>
            </div>
            <WorkFilterCube category={filter} onRouteAnimationComplete={onRouteAnimationComplete} />
          </div>

          <div className="works-control-panel" aria-label="作品の絞り込みと表示方法">
            <fieldset className="works-control-group">
              <legend>{isNumunumuMode ? numuText : 'CATEGORY'}</legend>
              <div className="works-control-row">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      type="button"
                      key={category.id}
                      aria-pressed={isShootingMode ? category.id === 'all' : filter === category.id}
                      onClick={() => handleFilterChange(category.id)}
                      disabled={isShootingMode || isShootingTransitioning}
                      className="works-control-button"
                    >
                      {Icon && <Icon size={17} aria-hidden="true" />}
                      <span>{isNumunumuMode ? numuText : category.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="works-control-group">
              <legend>{isNumunumuMode ? numuText : 'PROJECT TYPE'}</legend>
              <div className="works-control-row">
                {WORK_KIND_OPTIONS.map((kind) => (
                  <button
                    type="button"
                    key={kind.id}
                    aria-pressed={isShootingMode || workKind === kind.id}
                    onClick={() => setWorkKind(kind.id)}
                    disabled={isShootingMode || isShootingTransitioning}
                    className={`works-control-button works-kind-control works-kind-control--${kind.id}`}
                  >
                    <span className="works-kind-control__shape" aria-hidden="true" />
                    {isNumunumuMode ? numuText : kind.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="works-control-group">
              <legend>{isNumunumuMode ? numuText : 'VIEW'}</legend>
              <div className="works-control-row">
                <button
                  type="button"
                  aria-pressed={activeViewMode === 'flow'}
                  onClick={() => setViewMode('flow')}
                  disabled={shouldReduceMotion || isShootingMode || isShootingTransitioning}
                  className="works-control-button"
                  title={
                    shouldReduceMotion
                      ? '端末の「視差効果を減らす」設定によりINDEX表示になります'
                      : undefined
                  }
                >
                  {isNumunumuMode ? numuText : 'FLOW'}
                </button>
                <button
                  type="button"
                  aria-pressed={activeViewMode === 'index'}
                  onClick={() => setViewMode('index')}
                  disabled={isShootingMode || isShootingTransitioning}
                  className="works-control-button"
                >
                  {isNumunumuMode ? numuText : 'INDEX'}
                </button>
                {activeViewMode === 'flow' && (
                  <button
                    type="button"
                    aria-label={isFlowStopped ? '作品の流れを再開' : '作品の流れを停止'}
                    onClick={() => setIsFlowStopped((stopped) => !stopped)}
                    disabled={isShootingMode || isShootingTransitioning}
                    className="works-control-button works-flow-toggle"
                  >
                    {isFlowStopped ? (
                      <Play size={17} aria-hidden="true" />
                    ) : (
                      <Pause size={17} aria-hidden="true" />
                    )}
                    {isNumunumuMode ? numuText : isFlowStopped ? 'RESUME' : 'STOP'}
                  </button>
                )}
              </div>
            </fieldset>
          </div>

          {shouldReduceMotion && (
            <p className="works-motion-note" role="status">
              {isNumunumuMode
                ? numuText
                : '端末の「視差効果を減らす」設定に合わせ、静止したINDEXで表示しています。'}
            </p>
          )}
        </header>

        <p className="sr-only" role="status">
          {isShootingMode
            ? '全カテゴリー、ORIGINALとCLIENTの全プロジェクト、'
            : `${workKind === 'original' ? 'ORIGINAL' : 'CLIENT'}、${getWorkCategoryLabel(filter)}、`}
          {activeViewMode === 'flow'
            ? `${flowWorks.length}作品をFLOW表示中`
            : `${filteredWorks.length}作品をINDEX表示中`}
        </p>

        {activeViewMode === 'index' && <PaginationControls />}

        {activeViewMode === 'flow' ? (
          <FlowingWorksLane
            works={flowWorks}
            onOpen={handleOpenWork}
            isStopped={isFlowStopped}
            isDialogOpen={Boolean(selectedWork)}
            isBulletInFlight={isBulletInFlight}
            selectedCategory={filter}
            isNumunumuMode={isNumunumuMode}
            isShootingMode={isShootingMode}
            shotToken={resolvedShotToken}
            projectileToken={shotToken}
            onShotResult={handleShotResult}
          >
            <ShootingGalleryControls
              isActive={isShootingMode}
              isTransitioning={isShootingTransitioning}
              curtainCycle={curtainCycle}
              curtainMessage={curtainMessage}
              score={shootingScore}
              lastResult={lastShotResult}
              shotToken={shotToken}
              isBulletInFlight={isBulletInFlight}
              finalScore={finalShootingScore}
              isNumunumuMode={isNumunumuMode}
              onFire={handleFire}
            />
          </FlowingWorksLane>
        ) : currentWorks.length > 0 ? (
          <div className="works-index-grid">
            {currentWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onOpen={handleOpenWork}
                isNumunumuMode={isNumunumuMode}
              />
            ))}
          </div>
        ) : (
          <p className="works-empty-state" role="status">
            {isNumunumuMode ? numuText : 'この条件に該当する作品はありません。'}
          </p>
        )}

        {activeViewMode === 'index' && <PaginationControls />}
      </div>

      {activeViewMode === 'flow' && (
        <div className="shooting-mode-entry">
          <ShootingModeToggle
            isActive={isShootingMode}
            isTransitioning={isShootingTransitioning}
            isNumunumuMode={isNumunumuMode}
            onToggle={handleToggleShootingMode}
          />
        </div>
      )}

      <AnimatePresence>
        {selectedWork && (
          <AccessibleDialog
            onClose={handleCloseWork}
            labelledBy="work-dialog-title"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-2 sm:p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative z-10 flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden border-4 border-black bg-[#f0f0f0] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] sm:h-[90vh] md:flex-row md:border-[6px] md:shadow-[16px_16px_0px_rgba(0,0,0,0.3)]"
            >
              <button
                type="button"
                data-dialog-close
                aria-label="作品詳細を閉じる"
                onClick={handleCloseWork}
                className="absolute right-0 top-0 z-20 bg-black p-3 text-white transition-colors hover:bg-[#FFD700] hover:text-black"
              >
                <X size={32} />
              </button>
              <div className="group relative flex h-1/3 w-full items-center justify-center overflow-hidden border-b-4 border-black bg-gray-200 md:h-full md:w-2/5 md:border-b-0 md:border-r-4">
                <ImageWithFallback
                  src={selectedWork.image}
                  alt={selectedWork.title}
                  className="h-full w-full object-cover"
                  fallback={
                    <>
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundColor: selectedWork.color }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-black opacity-50">
                        {selectedWork.type === 'music' && <Music size={120} className="stroke-1" />}
                        {selectedWork.type === 'visual' && (
                          <Palette size={120} className="stroke-1" />
                        )}
                        {selectedWork.type === 'live' && (
                          <RadioTower size={120} className="stroke-1" />
                        )}
                      </div>
                    </>
                  }
                />
                <div className="absolute bottom-4 left-4 border-2 border-black bg-white px-3 py-1 font-mono text-sm shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                  {isNumunumuMode ? numuText : `ID: ${selectedWork.id.toString().padStart(3, '0')}`}
                </div>
              </div>
              <div className="flex w-full flex-col gap-6 overflow-y-auto bg-white p-6 md:w-3/5 md:gap-8 md:p-8 lg:p-12">
                <div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {getWorkCategories(selectedWork).map((category) => (
                      <span
                        key={category}
                        className="flex items-center gap-1 border border-black bg-yellow-300 px-2 py-0.5 font-mono text-xs"
                      >
                        <Tag size={12} />
                        {isNumunumuMode ? numuText : getWorkCategoryLabel(category)}
                      </span>
                    ))}
                    <span className={`work-kind-badge work-kind-badge--${selectedWork.workKind}`}>
                      <span className="work-kind-badge__shape" aria-hidden="true" />
                      {isNumunumuMode
                        ? numuText
                        : selectedWork.workKind === 'original'
                          ? 'ORIGINAL'
                          : 'CLIENT'}
                    </span>
                    {(selectedWork.attributes ?? []).map((attribute) => (
                      <span
                        key={attribute}
                        className={`work-attribute-badge work-attribute-badge--${attribute}`}
                      >
                        {isNumunumuMode ? numuText : getWorkAttributeLabel(attribute)}
                      </span>
                    ))}
                    <span className="flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-xs">
                      <Calendar size={12} />
                      {isNumunumuMode ? numuText : selectedWork.year}
                    </span>
                    <span className="flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-xs">
                      <User size={12} />
                      {isNumunumuMode ? numuText : selectedWork.role}
                    </span>
                  </div>
                  <h2
                    id="work-dialog-title"
                    className="mb-4 font-sans text-3xl font-black leading-none tracking-tighter md:text-4xl lg:text-5xl"
                  >
                    {selectedWork.title}
                  </h2>
                  <div className="h-1 w-24 bg-black" />
                </div>
                <div className="whitespace-pre-line font-serif text-lg leading-loose text-gray-800">
                  {selectedWork.detailText || selectedWork.desc}
                </div>
                {selectedWork.credits && (
                  <div className="mt-4 border-2 border-black/20 bg-gray-100 p-6">
                    <h3 className="mb-3 border-b border-black/20 pb-2 font-sans font-bold">
                      {isNumunumuMode ? numuText : 'CREDITS'}
                    </h3>
                    <ul className="space-y-1 font-mono text-sm">
                      {selectedWork.credits.map((credit) => (
                        <li key={credit}>- {credit}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedWork.url && (
                  <div className="mt-auto pt-8">
                    <a
                      href={selectedWork.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 border-2 border-black bg-black py-4 font-sans text-xl font-bold text-white shadow-[8px_8px_0px_#FFD700] transition-all hover:translate-y-1 hover:bg-gray-900 hover:shadow-none"
                    >
                      {isNumunumuMode ? numuText : 'VIEW MORE'}
                      <ExternalLink size={20} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </AccessibleDialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorksPage;
