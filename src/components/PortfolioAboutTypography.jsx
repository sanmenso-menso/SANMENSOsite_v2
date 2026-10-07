import { responsiveImage } from '../utils/responsive-image';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortfolioGraphicText } from './PortfolioWorkNumber';

const FIELDS = ['Web', '映像', 'グラフィック', '楽器演奏', 'フィールドレコーディング'];
const FIELD_POSITIONS = [
  [-100, 'top'],
  [160, 'top'],
  [-165, 'bottom'],
  [185, 'bottom'],
  [0, 'bottom'],
];
const FIELD_ENTRIES = [
  [0.05, 0.1],
  [0.95, 0.12],
  [0.05, 0.85],
  [0.95, 0.88],
  [0.5, 0.95],
];
const FIELD_EXITS = [
  [-0.3, -0.2],
  [1.3, -0.2],
  [-0.3, 1.2],
  [1.3, 1.2],
  [0.5, 1.4],
];
const randomOffset = (limit) => Math.round((Math.random() * 2 - 1) * limit);

export default function PortfolioAboutTypography() {
  const [roleOffsets, setRoleOffsets] = useState(null);
  const [mood, setMood] = useState('normal');
  const [chaosOffsets, setChaosOffsets] = useState([]);
  const [fieldsState, setFieldsState] = useState('closed');
  const fieldsOpen = fieldsState === 'open';
  const roleTimer = useRef(null);
  const fieldsTimer = useRef(null);
  const music = useRef(null);
  const fieldsTrigger = useRef(null);

  useLayoutEffect(() => {
    if (!fieldsOpen) return;
    const area = music.current;
    const trigger = fieldsTrigger.current;
    const paragraph = trigger.parentElement;
    const measure = () => {
      const bounds = area.getBoundingClientRect();
      const target = trigger.getBoundingClientRect();
      const text = paragraph.getBoundingClientRect();
      area.style.setProperty(
        '--fields-anchor-x',
        `${target.left + target.width / 2 - bounds.left}px`,
      );
      area.style.setProperty('--fields-top', `${text.top - bounds.top - 26}px`);
      area.style.setProperty('--fields-bottom', `${text.bottom - bounds.top + 30}px`);
      for (const [index, label] of [...area.querySelectorAll('[role="listitem"]')].entries()) {
        label.style.setProperty('--field-edge', `${label.offsetWidth / 2 + 12}px`);
        const position = label.getBoundingClientRect();
        const margin = label.offsetWidth / 2 + 24;
        const entryX = Math.max(
          margin,
          Math.min(window.innerWidth - margin, window.innerWidth * FIELD_ENTRIES[index][0]),
        );
        label.style.setProperty('--arrive-x', `${entryX - position.left - position.width / 2}px`);
        label.style.setProperty(
          '--arrive-y',
          `${window.innerHeight * FIELD_ENTRIES[index][1] - position.top - position.height / 2}px`,
        );
      }
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(area);
    observer?.observe(paragraph);
    observer?.observe(trigger);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [fieldsOpen]);

  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const preferenceChanged = () => {
      window.clearTimeout(roleTimer.current);
      window.clearTimeout(fieldsTimer.current);
      setRoleOffsets(null);
      setFieldsState((current) => (current === 'leaving' ? 'closed' : current));
    };
    motion?.addEventListener?.('change', preferenceChanged);
    return () => {
      window.clearTimeout(roleTimer.current);
      window.clearTimeout(fieldsTimer.current);
      motion?.removeEventListener?.('change', preferenceChanged);
    };
  }, []);

  const scatterRole = () => {
    window.clearTimeout(roleTimer.current);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setRoleOffsets(
      Array.from({ length: 3 }, () => ({
        x: randomOffset(14),
        y: randomOffset(15),
        angle: randomOffset(18),
      })),
    );
    roleTimer.current = window.setTimeout(() => setRoleOffsets(null), 1200);
  };

  const toggleFields = () => {
    window.clearTimeout(fieldsTimer.current);
    if (!fieldsOpen) {
      setFieldsState('open');
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setFieldsState('closed');
      return;
    }
    for (const [index, label] of [
      ...music.current.querySelectorAll('[role="listitem"]'),
    ].entries()) {
      const position = label.getBoundingClientRect();
      const x = position.left + position.width / 2;
      const y = position.top + position.height / 2;
      label.style.setProperty('--exit-start-x', `${x}px`);
      label.style.setProperty('--exit-start-y', `${y}px`);
      label.style.setProperty('--exit-x', `${window.innerWidth * FIELD_EXITS[index][0] - x}px`);
      label.style.setProperty('--exit-y', `${window.innerHeight * FIELD_EXITS[index][1] - y}px`);
    }
    setFieldsState('leaving');
    fieldsTimer.current = window.setTimeout(() => {
      setFieldsState('closed');
      fieldsTimer.current = null;
    }, 1200);
  };

  const changeMood = (next) => {
    if (next === 'chaos')
      setChaosOffsets(
        Array.from({ length: 6 }, () => ({
          x: randomOffset(30),
          y: randomOffset(18),
          angle: randomOffset(95),
        })),
      );
    else setChaosOffsets([]);
    setMood(next);
  };
  return (
    <div className="portfolio-about-composition portfolio-about-artwork" data-mood={mood}>
      <img
        className="portfolio-about-portrait"
        {...responsiveImage(
          '/images/portfolio-graphics/about-portrait.webp',
          '(max-width: 700px) 180px, 260px',
        )}
        alt="三面相のプロフィールアイコン"
        width="768"
        height="768"
      />
      <section
        className="portfolio-about-introduction"
        aria-labelledby="about-introduction-heading"
      >
        <h2 id="about-introduction-heading">【自己紹介】</h2>
        <p className="portfolio-about-name">三面相 / SANMENso です。</p>
        <p className="portfolio-about-role">
          <button
            type="button"
            className="portfolio-role-box portfolio-about-play"
            aria-label="楽し師"
            onClick={scatterRole}
          >
            <span className="portfolio-number-text">「楽し師」</span>
            <span className="portfolio-role-letters" aria-hidden="true">
              「
              {[...'楽し師'].map((letter, index) => (
                <span
                  key={letter}
                  style={
                    roleOffsets
                      ? {
                          '--letter-x': roleOffsets[index].x + 'px',
                          '--letter-y': roleOffsets[index].y + 'px',
                          '--letter-angle': roleOffsets[index].angle + 'deg',
                        }
                      : undefined
                  }
                >
                  {letter}
                </span>
              ))}
              」
            </span>
          </button>
          <span>です。</span>
        </p>
        <p>
          <PortfolioGraphicText text="2005" />
          年生まれです。
        </p>
        <p>今は大阪に住んでいます。</p>
      </section>
      <section className="portfolio-about-practice" aria-labelledby="about-practice-heading">
        <h2 id="about-practice-heading">【何をしているか】</h2>
        <p>
          <button
            type="button"
            className="portfolio-about-play portfolio-chaos-trigger"
            onClick={() => changeMood('chaos')}
            aria-pressed={mood === 'chaos'}
          >
            <span className="portfolio-number-text">めちゃくちゃ</span>
            <span aria-hidden="true">
              {[...'めちゃくちゃ'].map((letter, index) => (
                <span
                  className="portfolio-chaos-letter"
                  key={index}
                  style={
                    mood === 'chaos'
                      ? {
                          '--letter-x': chaosOffsets[index].x + 'px',
                          '--letter-y': chaosOffsets[index].y + 'px',
                          '--letter-angle': chaosOffsets[index].angle + 'deg',
                        }
                      : undefined
                  }
                >
                  {letter}
                </span>
              ))}
            </span>
          </button>
          に混ぜるけど、
          <br />
          <button
            type="button"
            className="portfolio-about-play portfolio-pop-trigger"
            onClick={() => changeMood('pop')}
            aria-pressed={mood === 'pop'}
          >
            ちゃんとポップ
          </button>
          に。
        </p>
        <p>異なる世界をコラージュして活動しています。</p>
        <p>
          主な活動実績は
          <Link
            to="/portfolio/works"
            aria-label="制作・参加実績を見る"
            className="portfolio-about-type-link"
          >
            【こちら】
          </Link>
          から見れます。
        </p>
      </section>
      <div ref={music} className="portfolio-about-music">
        <p>
          主に音楽をつくっていますが、最近は
          <button
            ref={fieldsTrigger}
            type="button"
            className="portfolio-about-play portfolio-fields-trigger"
            aria-expanded={fieldsOpen}
            aria-controls="about-floating-fields"
            onClick={toggleFields}
          >
            色んなもの
          </button>
          に取り組み始めています。
        </p>
        {fieldsState !== 'closed' && (
          <div
            id="about-floating-fields"
            className="portfolio-floating-fields"
            data-state={fieldsState}
            role="list"
            aria-label="取り組んでいる分野"
            aria-hidden={fieldsState === 'leaving' || undefined}
          >
            {FIELDS.map((field, index) => (
              <span
                role="listitem"
                key={field}
                style={{
                  '--float-delay': index * 100 + 'ms',
                  '--float-x': (index % 2 ? -1 : 1) * (6 + index * 2) + 'px',
                  '--float-y': (index % 2 ? 1 : -1) * (8 + index * 2) + 'px',
                  '--float-angle': (index % 2 ? -1 : 1) * (2 + index) + 'deg',
                  '--arrive-angle': (index % 2 ? 1 : -1) * (8 + index) + 'deg',
                  '--exit-delay': index * 40 + 'ms',
                  '--exit-angle': (index % 2 ? -1 : 1) * (360 + index * 90) + 'deg',
                  '--orbit-x': FIELD_POSITIONS[index][0] + 'px',
                  '--field-y': `var(--fields-${FIELD_POSITIONS[index][1]})`,
                  '--field-row-offset': index === 4 ? '48px' : '0px',
                }}
              >
                <span className="portfolio-field-flight">
                  <span className="portfolio-field-word">{field}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      <section className="portfolio-about-affiliation" aria-labelledby="about-affiliation-heading">
        <h2 id="about-affiliation-heading">【所属など】</h2>
        <p>
          <a
            className="portfolio-about-type-link portfolio-cds-link"
            href="https://cds-inter.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CDs
            <span id="about-cds-disc" className="portfolio-cds-disc" aria-hidden="true" />
          </a>{' '}
          で音楽を作ったり、
          <br />
          イベントに出演していたりしています。
        </p>
      </section>
      <section
        className="portfolio-about-consultation"
        aria-labelledby="about-consultation-heading"
      >
        <h2 id="about-consultation-heading">【制作のご相談】</h2>
        <p>
          <Link
            to="/portfolio/contact"
            aria-label="連絡フォームで相談する"
            className="portfolio-about-type-link"
          >
            連絡フォーム
          </Link>
          からも入力可能です。
        </p>
        <p>
          <a
            href="mailto:sanmensoworks@gmail.com"
            aria-label="メールで連絡する"
            className="portfolio-about-type-link"
          >
            メール
          </a>
          もしくは
          <a
            href="https://discord.com/users/661901822352687105"
            aria-label="Discordで連絡する"
            className="portfolio-about-type-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            ディスコード
          </a>
          で<br />
          連絡お待ちしております。
        </p>
      </section>
    </div>
  );
}
