import React, { useEffect, useRef, useState } from 'react';

// Relative hinge angles keep all three panels connected as mountain/valley folds alternate.
const FOLDS = [
  [-18, 58, -54, -18, -7],
  [22, -67, 71, 20, 7],
  [-32, 76, -50, -26, 2],
  [30, -80, 62, 26, -5],
];
const randomOffset = (limit) => Math.round((Math.random() * 2 - 1) * limit);

function scatterPanels() {
  return {
    '--men-chaos-strip': `rotateY(${randomOffset(36)}deg) rotateZ(${randomOffset(28)}deg) scale(1.15)`,
    '--men-chaos-panel-0': `translate3d(${-16 + randomOffset(9)}vw, ${-7 + randomOffset(8)}vh, ${100 + randomOffset(100)}px) rotateX(${24 + randomOffset(40)}deg) rotateZ(${-35 + randomOffset(55)}deg)`,
    '--men-chaos-panel-1': `translate3d(${16 + randomOffset(9)}vw, ${16 + randomOffset(8)}vh, ${-80 + randomOffset(100)}px) rotateX(${-58 + randomOffset(45)}deg) rotateZ(${72 + randomOffset(55)}deg)`,
    '--men-chaos-panel-2': `translate3d(${-20 + randomOffset(9)}vw, ${10 + randomOffset(8)}vh, ${160 + randomOffset(100)}px) rotateX(${64 + randomOffset(45)}deg) rotateZ(${-90 + randomOffset(55)}deg)`,
  };
}

function FoldPanel({ index }) {
  return (
    <div className={`portfolio-fold-panel portfolio-fold-panel-${index}`}>
      <div className="portfolio-fold-surface" />
      <div className="portfolio-fold-line" />
      {index < 2 && <FoldPanel index={index + 1} />}
    </div>
  );
}

export default function PortfolioBackdrop() {
  const backdrop = useRef(null);
  const [fold, setFold] = useState(0);
  const [chaos, setChaos] = useState({});

  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onClick = (event) => {
      if (motion?.matches || event.button > 0) return;
      // Observe the portfolio's existing controls without intercepting their actions.
      const page = backdrop.current?.parentElement;
      if (event.target instanceof Element && page?.contains(event.target)) {
        setFold((current) => (current + 1) % FOLDS.length);
        if (event.target.closest('.portfolio-chaos-trigger')) setChaos(scatterPanels());
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  const [first, second, third, yaw, roll] = FOLDS[fold];
  return (
    <div ref={backdrop} className="portfolio-backdrop" aria-hidden="true" data-fold={fold}>
      <div
        className="portfolio-fold-scene"
        style={{
          '--men-fold-0': `${first}deg`,
          '--men-fold-1': `${second}deg`,
          '--men-fold-2': `${third}deg`,
          '--men-yaw': `${yaw}deg`,
          '--men-roll': `${roll}deg`,
          ...chaos,
        }}
      >
        <div className="portfolio-fold-strip">
          <FoldPanel index={0} />
        </div>
      </div>
    </div>
  );
}
