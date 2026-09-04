import React from 'react';
import { NUMUNUMU_TEXT } from '../NumunumuContext';

export const ShootingModeToggle = ({
  isActive,
  isTransitioning,
  isNumunumuMode,
  onToggle,
}) => {
  const displayText = (text) => (isNumunumuMode ? NUMUNUMU_TEXT : text);

  return (
    <button
      type="button"
      className="shooting-mode-toggle"
      aria-pressed={isActive}
      aria-label={isActive ? '射的モードを終了' : '射的モードを開始'}
      disabled={isTransitioning}
      onClick={onToggle}
    >
      {displayText(isTransitioning ? '準備中…' : isActive ? '射的モード終了' : '射的モード')}
    </button>
  );
};

const ShootingGalleryControls = ({
  isActive,
  isTransitioning,
  curtainCycle,
  curtainMessage,
  score,
  lastResult,
  shotToken,
  isBulletInFlight,
  finalScore,
  isNumunumuMode,
  onFire,
}) => {
  const displayText = (text) => (isNumunumuMode ? NUMUNUMU_TEXT : text);

  return (
    <>
      {isTransitioning && (
        <div key={curtainCycle} className="shooting-curtain" aria-hidden="true">
          <div className="shooting-curtain__panel shooting-curtain__panel--left" />
          <div className="shooting-curtain__panel shooting-curtain__panel--right" />
          <div className="shooting-curtain__sign">{displayText(curtainMessage)}</div>
        </div>
      )}

      {isActive && (
        <>
          <aside className="shooting-result" aria-live="polite">
            <span>{displayText('SCORE')}</span>
            <strong>{displayText(`${score.toLocaleString()} pt`)}</strong>
            <small>{displayText(lastResult ?? '照準を景品に合わせて発射！')}</small>
          </aside>

          <div className="shooting-controls">
            <div className="shooting-muzzle" aria-hidden="true">
              <span className="shooting-muzzle__barrel">
                <span className="shooting-muzzle__bore" />
              </span>
              {shotToken > 0 && <span key={shotToken} className="shooting-gun__flash" />}
            </div>
            <button
              type="button"
              className="shooting-fire-button"
              aria-label="発射"
              disabled={isBulletInFlight}
              onClick={onFire}
            >
              {displayText(isBulletInFlight ? '飛翔中…' : '発射！')}
            </button>
          </div>
        </>
      )}

      {finalScore !== null && (
        <div className="shooting-final-score" role="status">
          <span className="shooting-final-score__chain shooting-final-score__chain--left" />
          <span className="shooting-final-score__chain shooting-final-score__chain--right" />
          <span className="shooting-final-score__lights" aria-hidden="true" />
          <span className="shooting-final-score__label">{displayText('最終ポイント')}</span>
          <strong>{displayText(finalScore.toLocaleString())}</strong>
          <small>POINTS</small>
        </div>
      )}
    </>
  );
};

export default ShootingGalleryControls;
