import React from 'react';

export default function PortfolioMasks() {
  return (
    <svg className="portfolio-mask-definitions" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="portfolio-mask-video" clipPathUnits="objectBoundingBox">
          <polygon points=".29,.08 .87,.5 .29,.92" />
        </clipPath>
        <clipPath id="portfolio-mask-game" clipPathUnits="objectBoundingBox">
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M.28.24 C.19.24 .16.32 .12.52 L.07.76 C.05.88 .15.94 .24.84 L.36.68 H.64 L.76.84 C.85.94 .95.88 .93.76 L.88.52 C.84.32 .81.24 .72.24 Z M.27.38 H.33 V.46 H.40 V.53 H.33 V.61 H.27 V.53 H.20 V.46 H.27 Z M.71.37 A.035.045 0 1 0 .71.46 A.035.045 0 1 0 .71.37 Z M.79.48 A.035.045 0 1 0 .79.57 A.035.045 0 1 0 .79.48 Z"
          />
        </clipPath>
        <clipPath id="portfolio-mask-music" clipPathUnits="objectBoundingBox">
          <path
            d="M.35.24 L.79.12 V.73 C.79.91 .52.95 .51.80 C.50.70 .62.64 .72.68 V.38 L.42.47 V.82 C.42.99 .15.99 .14.85 C.13.74 .25.70 .35.73 Z M.42.30 V.37 L.72.28 V.21 Z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </clipPath>
        <clipPath id="portfolio-mask-dj" clipPathUnits="objectBoundingBox">
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M.5.04 A.30.46 0 1 0 .5.96 A.30.46 0 1 0 .5.04 Z M.5.44 A.04.06 0 1 0 .5.56 A.04.06 0 1 0 .5.44 Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
