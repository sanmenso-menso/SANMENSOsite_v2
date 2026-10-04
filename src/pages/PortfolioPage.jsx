import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';

import { filterWorks, validatePortfolio } from '../utils/portfolio';
import { resolvePortfolioPath, PORTFOLIO_PAGES } from '../utils/routes';
import { shuffleWorks, splitSelectedWorks, workField } from '../utils/portfolio-presentation';
import { WORKS_SHUFFLE_INTERVAL } from '../config/portfolio';
import PortfolioMasks from '../components/PortfolioMasks';
import PortfolioBackdrop from '../components/PortfolioBackdrop';
import PortfolioAboutTypography from '../components/PortfolioAboutTypography';
import PortfolioContactForm from '../components/PortfolioContactForm';
import PortfolioWorkNumber, { PortfolioGraphicText } from '../components/PortfolioWorkNumber';
import { assignWorkNumbers } from '../utils/portfolio-numbers';
import './PortfolioPage.css';

function WorkImage({ work }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="portfolio-work-image" data-field={workField(work)}>
      <div className="portfolio-image-media">
        {work.image && !failed ? (
          <img
            src={work.image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="portfolio-image-placeholder" aria-hidden="true">
            <span>
              <PortfolioGraphicText text={work.roles[0] || 'WORK'} />
            </span>
            <span>{work.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function GraphicDivider({ shape }) {
  return (
    <div className="portfolio-graphic-divider" aria-hidden="true">
      <img src={`/images/portfolio-graphics/${shape}.svg`} alt="" />
    </div>
  );
}

function WorkCard({ work }) {
  const content = (
    <>
      <WorkImage work={work} />
      <div className="portfolio-work-meta">
        <PortfolioWorkNumber number={work.number} />
        {work.date ? (
          <time dateTime={work.date}>{work.date.replaceAll('-', '.')}</time>
        ) : (
          <span>—</span>
        )}
      </div>
      {work.artist && (
        <p className="portfolio-work-artist">
          <PortfolioGraphicText text={work.artist} />
        </p>
      )}
      <h3>
        <span>{work.title}</span>
        {work.url && <ArrowUpRight size={19} aria-hidden="true" />}
      </h3>
      {!!work.roles.length && (
        <p className="portfolio-work-roles">
          <PortfolioGraphicText text={work.roles.join(' / ')} />
        </p>
      )}
      {work.description && (
        <p className="portfolio-work-description">
          <PortfolioGraphicText text={work.description} />
        </p>
      )}
    </>
  );
  return (
    <li className="portfolio-work">
      {work.url ? (
        <a
          href={work.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${work.title} — 作品を見る（新しいタブ）`}
        >
          {content}
        </a>
      ) : (
        <div tabIndex={0}>{content}</div>
      )}
    </li>
  );
}

function usePortfolioData() {
  const [state, setState] = useState({ status: 'loading', data: null, orderedWorks: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let active = true;
    setState({ status: 'loading', data: null, orderedWorks: [] });
    fetch('/data/portfolio.json', { signal: controller.signal, cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Portfolio fetch failed');
        return response.json();
      })
      .then(validatePortfolio)
      .then((data) => {
        // Recalculate old and new JSON before the initial selection or any display shuffle.
        data = { ...data, works: assignWorkNumbers(data.works).works };
        const { selected, remaining } = splitSelectedWorks(data.works);
        if (active)
          setState({
            status: 'ready',
            data,
            orderedWorks: [...selected, ...shuffleWorks(remaining)],
          });
      })
      .catch(() => {
        if (active) setState({ status: 'error', data: null, orderedWorks: [] });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { state, setState, retry: () => setAttempt((value) => value + 1) };
}

function WorksContent() {
  const { state, setState, retry } = usePortfolioData();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [year, setYear] = useState('');
  const [automatic, setAutomatic] = useState(true);
  const interaction = useRef({ hover: false, focus: false });

  useEffect(() => {
    if (state.status !== 'ready' || !automatic) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden || interaction.current.hover || interaction.current.focus) return;
      setState((current) => ({ ...current, orderedWorks: shuffleWorks(current.orderedWorks) }));
    }, WORKS_SHUFFLE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [state.status, automatic, setState]);

  const works = state.data?.works;
  const roles = useMemo(
    () =>
      [...new Set((works || []).flatMap((work) => work.roles))].sort((a, b) =>
        a.localeCompare(b, 'ja'),
      ),
    [works],
  );
  const years = useMemo(
    () =>
      [...new Set((works || []).map((work) => work.date.slice(0, 4)).filter(Boolean))]
        .sort()
        .reverse(),
    [works],
  );
  const filtered = useMemo(
    () => filterWorks(state.orderedWorks, { query, role, year }),
    [state.orderedWorks, query, role, year],
  );
  const reset = () => {
    setQuery('');
    setRole('');
    setYear('');
  };

  return (
    <section
      id="portfolio-works"
      className="portfolio-works-section"
      aria-labelledby="portfolio-works-title"
      tabIndex={-1}
    >
      <div className="portfolio-section-title">
        <h1 id="portfolio-works-title">
          Works<span>制作・参加実績</span>
        </h1>
        <span className="portfolio-total">
          {works ? String(works.length).padStart(2, '0') : '—'} WORKS
        </span>
      </div>

      {state.status === 'ready' && (
        <>
          <div className="portfolio-filters">
            <label className="portfolio-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="作品名・アーティスト・担当で検索"
                placeholder="作品名・アーティストで検索"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              担当
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="">すべて</option>
                {roles.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              年
              <select value={year} onChange={(event) => setYear(event.target.value)}>
                <option value="">すべて</option>
                {years.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="portfolio-results">
            <p role="status">
              {filtered.length} / {works.length} 件
            </p>
            <button
              type="button"
              aria-pressed={!automatic}
              onClick={() => setAutomatic((value) => !value)}
            >
              {automatic ? '自動並べ替えを停止' : '自動並べ替えを再開'}
            </button>
            {(query || role || year) && (
              <button type="button" onClick={reset}>
                絞り込みを解除
              </button>
            )}
          </div>
          {filtered.length ? (
            <div className="portfolio-work-stage">
              <div
                className="portfolio-work-group"
                onMouseEnter={() => {
                  interaction.current.hover = true;
                }}
                onMouseLeave={() => {
                  interaction.current.hover = false;
                }}
                onFocus={() => {
                  interaction.current.focus = true;
                }}
                onBlur={(event) => {
                  interaction.current.focus = event.currentTarget.contains(event.relatedTarget);
                }}
              >
                <GraphicDivider shape="burst-round" />
                <ul className="portfolio-grid">
                  {filtered.map((work, index) => (
                    <React.Fragment key={work.id}>
                      <WorkCard work={work} />
                      {(index + 1) % 12 === 0 && index < filtered.length - 1 && (
                        <li
                          className="portfolio-work-divider"
                          aria-hidden="true"
                          role="presentation"
                        >
                          <GraphicDivider
                            shape={['burst-angular', 'fold', 'cross'][Math.floor(index / 12) % 3]}
                          />
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="portfolio-state">
              {works.length
                ? '条件に合う作品はありません。検索や絞り込みを変更してください。'
                : '制作実績は準備中です。'}
            </p>
          )}
        </>
      )}
      {state.status === 'loading' && (
        <p className="portfolio-state" role="status">
          作品を読み込んでいます…
        </p>
      )}
      {state.status === 'error' && (
        <div className="portfolio-state" role="alert">
          <p>作品を読み込めませんでした。</p>
          <button type="button" onClick={retry}>
            もう一度読み込む
          </button>
        </div>
      )}
    </section>
  );
}

function ActivitiesContent() {
  const { state, retry } = usePortfolioData();
  const activities = state.data?.activities || state.data?.works || [];
  return (
    <section className="portfolio-activities" aria-labelledby="portfolio-activities-title">
      <GraphicDivider shape="fold" />
      <div className="portfolio-activities-heading">
        <h2 id="portfolio-activities-title">Activities</h2>
        <p>オリジナル・制作・参加の記録</p>
      </div>
      {state.status === 'loading' && <p role="status">活動一覧を読み込んでいます…</p>}
      {state.status === 'error' && (
        <div className="portfolio-state" role="alert">
          <p>活動一覧を読み込めませんでした。</p>
          <button type="button" onClick={retry}>
            もう一度読み込む
          </button>
        </div>
      )}
      {state.status === 'ready' &&
        (activities.length ? (
          <div
            className="portfolio-activity-scroll"
            role="region"
            aria-label="活動一覧"
            tabIndex={0}
          >
            <table className="portfolio-activity-table">
              <caption>{activities.length}件の活動</caption>
              <thead>
                <tr>
                  <th scope="col">時期</th>
                  <th scope="col">区分</th>
                  <th scope="col">作品・活動</th>
                  <th scope="col">アーティスト</th>
                  <th scope="col">担当</th>
                  <th scope="col">リンク</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((work) => (
                  <tr key={work.id}>
                    <td>
                      {work.date ? (
                        <time dateTime={work.date}>{work.date.replaceAll('-', '.')}</time>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <PortfolioGraphicText text={work.category} />
                    </td>
                    <td className="portfolio-activity-title">{work.title}</td>
                    <td>
                      <PortfolioGraphicText text={work.artist || '—'} />
                    </td>
                    <td>
                      <PortfolioGraphicText text={work.roles.join(' / ') || '—'} />
                    </td>
                    <td>
                      {work.url ? (
                        <a
                          href={work.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${work.title} — 公開先（新しいタブ）`}
                        >
                          公開先 <ArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="portfolio-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>活動一覧は準備中です。</p>
        ))}
    </section>
  );
}

function AboutContent() {
  return (
    <section className="portfolio-text-page" aria-labelledby="portfolio-about-title">
      <div className="portfolio-section-title">
        <h1 id="portfolio-about-title">
          About<span>三面相について</span>
        </h1>
      </div>
      <PortfolioAboutTypography />
      <ActivitiesContent />
    </section>
  );
}

function ContactContent() {
  return (
    <section className="portfolio-text-page" aria-labelledby="portfolio-contact-title">
      <div className="portfolio-section-title">
        <h1 id="portfolio-contact-title">
          Contact<span>ご依頼・お問い合わせ</span>
        </h1>
      </div>
      <div className="portfolio-contact-body">
        <p>制作のご依頼・ご相談、出演のご相談は、フォーム・メール・Discordからご連絡ください。</p>
        <PortfolioContactForm />
        <div className="portfolio-contact-direct">
          <GraphicDivider shape="cross" />
          <h2>メール・Discordから連絡する</h2>
          <a className="portfolio-email" href="mailto:sanmensoworks@gmail.com">
            sanmensoworks@gmail.com <ArrowUpRight size={22} aria-hidden="true" />
          </a>
          <a
            className="portfolio-discord"
            href="https://discord.com/users/661901822352687105"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discordで連絡する <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <p className="portfolio-contact-note">Discordでのご連絡も可能です。</p>
        </div>
      </div>
    </section>
  );
}

export default function PortfolioPage() {
  const { pathname } = useLocation();
  const path = resolvePortfolioPath(pathname);
  const section = PORTFOLIO_PAGES[path];
  const title = `${section} — 三面相 / SANMENSO`;
  const description =
    section === 'About'
      ? '三面相のプロフィール。コラージュを軸に音楽やビジュアルなどのコンテンツを制作しています。'
      : section === 'Contact'
        ? '三面相への制作のご依頼・ご相談、出演のお問い合わせ。'
        : '三面相の制作・参加実績。音楽制作、リミックス、映像、デザイン、DJなどの作品を紹介します。';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <div className="portfolio-page">
      <PortfolioBackdrop />
      <PortfolioMasks />
      <Helmet>
        <title>{title}</title>
        <link rel="canonical" href={`https://sanmenso.com${path}`} />
        <meta name="robots" content="index, follow" />
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:url" content={`https://sanmenso.com${path}`} />
        <meta property="og:description" content={description} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Helmet>
      <a className="portfolio-skip" href="#portfolio-main">
        本文へ移動
      </a>
      <header className="portfolio-header">
        <Link to="/portfolio" className="portfolio-wordmark" aria-label="三面相 ポートフォリオ">
          三面相<span>SANMENSO / PORTFOLIO</span>
        </Link>
        <nav aria-label="ポートフォリオのナビゲーション">
          {Object.entries(PORTFOLIO_PAGES).map(([href, label]) => (
            <Link key={href} to={href} aria-current={path === href ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="portfolio-main" tabIndex={-1}>
        {section === 'About' ? (
          <AboutContent />
        ) : section === 'Contact' ? (
          <ContactContent />
        ) : (
          <WorksContent />
        )}
      </main>
      <footer className="portfolio-footer">
        <span>© {new Date().getFullYear()} SANMENSO</span>
        <Link to="/">
          三面相のウェブサイト <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
