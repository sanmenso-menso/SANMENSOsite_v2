export const CONTENT_TITLES = {
    'pop-vector-player': 'デモトラック＠ドリンクバー',
    'kinetic-visualizer': 'デモトラック＠ポップスコーンマシーン',
};

export const PAGE_TITLES = {
    '/': 'ホーム',
    '/works': '作品',
    '/contents': 'インタラクティブコンテンツ',
    '/links': 'リンク',
    '/contact': 'お問い合わせ',
    '/secret': 'SECRET',
};

export const normalizePathname = (pathname) => {
    if (pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
};

export const isKnownPath = (pathname) => {
    if (PAGE_TITLES[pathname]) return true;
    const contentMatch = pathname.match(/^\/contents\/([^/]+)$/);
    return Boolean(contentMatch && CONTENT_TITLES[contentMatch[1]]);
};

export const getPageTitle = (pathname, isNotFound = !isKnownPath(pathname)) => {
    if (isNotFound) return 'ページが見つかりません';
    const contentMatch = pathname.match(/^\/contents\/([^/]+)$/);
    return contentMatch ? CONTENT_TITLES[contentMatch[1]] : PAGE_TITLES[pathname];
};
