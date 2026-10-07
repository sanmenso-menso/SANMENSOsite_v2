// Public data contract shared by the importer and the page.
export const PORTFOLIO_VERSION = 1;

const text = (value) => String(value ?? '').trim();

export function safeLink(value) {
  const candidate = text(value);
  if (!candidate) return '';
  const url = new URL(candidate);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('リンクは認証情報を含まないHTTPS URLにしてください。');
  }
  return url.href;
}

export function safeImage(value) {
  const candidate = text(value);
  if (!candidate) return '';
  if (!candidate.startsWith('/images/') || /[\\?#]/.test(candidate)) {
    throw new Error('サムネイルは /images/ 以下のローカル画像を指定してください。');
  }
  const decoded = decodeURIComponent(candidate);
  if (decoded.split('/').some((part) => part === '..' || part === '.') || /[\\?#]/.test(decoded)) {
    throw new Error('サムネイルのパスが不正です。');
  }
  return candidate;
}

function validDate(value) {
  const source = text(value);
  if (!source) return '';
  const parts = source.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/);
  if (!parts) {
    throw new Error('公開日は YYYY、YYYY-MM、YYYY-MM-DD のいずれかにしてください。');
  }
  const date = parts
    .slice(1)
    .filter(Boolean)
    .map((part) => part.padStart(2, '0'))
    .join('-');
  const full = date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date;
  const parsed = new Date(`${full}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== full) {
    throw new Error('公開日が実在しない日付です。');
  }
  return date;
}

export function linkKey(value) {
  if (!value) return '';
  const url = new URL(safeLink(value));
  const host = url.hostname.toLowerCase();
  const youtubeId =
    host === 'youtu.be'
      ? url.pathname.slice(1).split('/')[0]
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)
        ? url.searchParams.get('v') || url.pathname.match(/^\/(?:live|shorts|embed)\/([^/]+)/)?.[1]
        : null;
  if (youtubeId) return `youtube:${youtubeId}`;
  url.hash = '';
  if (host === 'twitter.com' || host === 'www.twitter.com') url.hostname = 'x.com';
  return url.href.replace(/\/$/, '');
}

function workId(identity) {
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash = Math.imul(hash ^ identity.charCodeAt(index), 16777619);
  }
  return `work-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function sortWorks(works) {
  return [...works].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

/** Parse RFC 4180 CSV, including quoted commas, newlines and escaped quotes. */
export function parseCsv(source) {
  const input = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closed = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += character;
    } else if (character === '"') {
      if (field || closed) throw new Error('CSVの引用符が不正です。');
      quoted = true;
    } else if (character === ',' || character === '\n' || character === '\r') {
      row.push(field);
      field = '';
      closed = false;
      if (character !== ',') {
        if (character === '\r' && input[index + 1] === '\n') index += 1;
        rows.push(row);
        row = [];
      }
    } else {
      if (closed) throw new Error('CSVの閉じた引用符の後に文字があります。');
      field += character;
    }
  }
  if (quoted) throw new Error('CSVの引用符が閉じていません。');
  if (field || row.length || closed) rows.push([...row, field]);
  return rows;
}

export function rowsToPortfolio(rows, generatedAt = new Date().toISOString()) {
  return validatePortfolio({
    schemaVersion: PORTFOLIO_VERSION,
    generatedAt,
    works: readWorkRows(rows, false),
  });
}

/** Public activity history, including original works. Working notes stay private. */
export function rowsToActivities(rows) {
  return sortWorks(readWorkRows(rows, true));
}

function readWorkRows(rows, allCategories) {
  const headers = rows[0]?.map(text) ?? [];
  const required = ['公開日', '区分', '作品名', '担当アーティスト', '役職', 'リンク'];
  for (const header of required) {
    if (headers.filter((value) => value === header).length !== 1) {
      throw new Error(`ヘッダー「${header}」がない、または重複しています。`);
    }
  }
  const works = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const get = (header) => text(row[headers.indexOf(header)]);
    const category = get('区分');
    if (!category || (!allCategories && category !== '案件')) continue;
    const visibility = get('公開').toLowerCase();
    if (['false', '0', '非公開', 'いいえ'].includes(visibility)) continue;
    try {
      const title = get('作品名');
      if (!title) throw new Error('作品名が空です。');
      const artist = get('担当アーティスト');
      const url = safeLink(get('リンク'));
      const identity = `${linkKey(url)}\n${title}\n${artist}`;
      works.push({
        id: workId(identity),
        category,
        title,
        artist,
        roles: get('役職')
          .split(/[、,，／/\n]+/)
          .map(text)
          .filter(Boolean),
        date: validDate(get('公開日')),
        url,
        image: allCategories ? '' : safeImage(get('サムネイル')),
        description: get('説明'),
      });
    } catch (error) {
      throw new Error(`${index + 1}行目: ${error.message}`, { cause: error });
    }
  }
  return works;
}

/** Allowlist fields so working notes and unrelated metadata never reach public JSON. */
export function validatePortfolio(data) {
  if (data?.schemaVersion !== PORTFOLIO_VERSION || !Array.isArray(data.works)) {
    throw new Error('ポートフォリオJSONの形式が不正です。');
  }
  if (typeof data.generatedAt !== 'string' || !Number.isFinite(Date.parse(data.generatedAt))) {
    throw new Error('JSONの更新日時が不正です。');
  }
  const validateWorks = (items, allCategories = false) => {
    const ids = new Set();
    const numbers = new Set();
    return items.map((work) => {
      if (
        !work ||
        (!allCategories && work.category !== '案件') ||
        !text(work.category) ||
        !/^work-[a-f0-9]{8}$/.test(work.id) ||
        !text(work.title)
      ) {
        throw new Error('作品のID・区分・作品名が不正です。');
      }
      if (ids.has(work.id)) throw new Error(`作品が重複しています: ${work.title}`);
      ids.add(work.id);
      if (work.number !== undefined) {
        if (!Number.isSafeInteger(work.number) || work.number < 1 || numbers.has(work.number))
          throw new Error('作品番号が不正、または重複しています。');
        numbers.add(work.number);
      }
      if (!Array.isArray(work.roles) || !work.roles.every((role) => typeof role === 'string')) {
        throw new Error('役職は文字列の配列にしてください。');
      }
      return {
        id: work.id,
        ...(work.number !== undefined ? { number: work.number } : {}),
        category: text(work.category),
        title: text(work.title),
        artist: text(work.artist),
        roles: [...new Set(work.roles.map(text).filter(Boolean))],
        date: validDate(work.date),
        url: safeLink(work.url),
        image: allCategories ? '' : safeImage(work.image),
        description: text(work.description),
      };
    });
  };
  const works = validateWorks(data.works);
  if (data.activities !== undefined && !Array.isArray(data.activities)) {
    throw new Error('活動一覧は配列にしてください。');
  }
  return {
    schemaVersion: PORTFOLIO_VERSION,
    generatedAt: data.generatedAt,
    works: sortWorks(works),
    ...(data.activities ? { activities: sortWorks(validateWorks(data.activities, true)) } : {}),
  };
}

export function filterWorks(works, { query = '', role = '', year = '' } = {}) {
  const needle = query.normalize('NFKC').trim().toLocaleLowerCase('ja');
  return works.filter(
    (work) =>
      (!role || work.roles.includes(role)) &&
      (!year || work.date.slice(0, 4) === year) &&
      (!needle ||
        [work.title, work.artist, ...work.roles, work.description]
          .join(' ')
          .normalize('NFKC')
          .toLocaleLowerCase('ja')
          .includes(needle)),
  );
}
