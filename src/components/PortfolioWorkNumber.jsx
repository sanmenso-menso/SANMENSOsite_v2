import React from 'react';

// Preserve the original text for reading, copying and text-based filtering.
export function PortfolioGraphicText({ text }) {
  return String(text)
    .split(/(\d+)/)
    .map((part, index) =>
      /^\d+$/.test(part) ? (
        <span className="portfolio-graphic-number" key={index}>
          <span className="portfolio-number-text">{part}</span>
          <span className="portfolio-number-art" aria-hidden="true">
            {[...part].map((digit, digitIndex) => (
              <img key={digitIndex} src={`/images/portfolio-graphics/digit-${digit}.svg`} alt="" />
            ))}
          </span>
        </span>
      ) : (
        part
      ),
    );
}

export default function PortfolioWorkNumber({ number }) {
  const text = String(number).padStart(2, '0');
  return (
    <span className="portfolio-work-number" role="img" aria-label={`作品ID ${text}`}>
      <span className="portfolio-work-number-label" aria-hidden="true">
        ID:
      </span>
      {[...text].map((digit, index) => (
        <img
          key={index}
          src={`/images/portfolio-graphics/digit-${digit}.svg`}
          alt=""
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
