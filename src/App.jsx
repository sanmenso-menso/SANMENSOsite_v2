import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { FONTS, SITE_META, THEME } from './constants';
import { NumunumuContext } from './NumunumuContext';
import AppErrorBoundary from './components/AppErrorBoundary';
import Header from './components/Header';
import NavigationDock from './components/NavigationDock';
import { reportClientError } from './utils/reportClientError';
import { CONTENT_TITLES, getPageTitle, isKnownPath, normalizePathname } from './utils/routes';

const MagicCube = lazy(() => import('./components/MagicCube'));
const WorksPage = lazy(() => import('./pages/WorksPage'));
const LinksPage = lazy(() => import('./pages/LinksPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ContentsPage = lazy(() => import('./pages/ContentsPage'));
const SecretPage = lazy(() => import('./pages/SecretPage'));
const NotFoundPage = lazy(() => import('./pages/NotfoundPage'));

const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center px-4" role="status" aria-live="polite">
        <span className="bg-black text-[#FFD700] border-2 border-white px-4 py-2 font-mono font-bold">
            LOADING...
        </span>
    </div>
);

const PageWrapper = ({ children }) => (
    <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full min-h-screen pt-20 pb-28 sm:pt-24 sm:pb-32"
    >
        {children}
    </motion.main>
);

const RouteMetadata = ({ pathname, isNotFound }) => {
    const pageTitle = getPageTitle(pathname, isNotFound);
    const fullTitle = pageTitle ? `${pageTitle} | ${SITE_META.title}` : SITE_META.title;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta property="og:title" content={fullTitle} />
        </Helmet>
    );
};

const ContentRoute = () => {
    const { id } = useParams();

    if (!CONTENT_TITLES[id]) {
        return <NotFoundPage />;
    }

    return (
        <PageWrapper>
            <ContentsPage />
        </PageWrapper>
    );
};

const GlobalErrorReporter = () => {
    useEffect(() => {
        const handleError = (event) => {
            reportClientError(event.error || new Error(event.message || 'Unknown window error'), {
                source: 'window.error',
            });
        };
        const handleRejection = (event) => {
            const error = event.reason instanceof Error
                ? event.reason
                : new Error(String(event.reason || 'Unhandled promise rejection'));
            reportClientError(error, { source: 'unhandledrejection' });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
};

function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();
    const pathname = normalizePathname(location.pathname);
    const isNotFound = !isKnownPath(pathname);
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    const activePage = pathname === '/' ? 'home' : firstSegment;

    const [worksFilter, setWorksFilter] = useState('all');
    const [isOpening, setIsOpening] = useState(true);
    const [isNumunumuMode, setIsNumunumuMode] = useState(false);
    const [, setInput] = useState('');
    const target = 'numunumu';

    useEffect(() => {
        const handler = (event) => {
            const targetElement = event.target;
            if (
                event.key.length !== 1
                || targetElement instanceof HTMLInputElement
                || targetElement instanceof HTMLTextAreaElement
                || targetElement?.isContentEditable
            ) {
                return;
            }

            setInput((previousInput) => {
                const nextInput = (previousInput + event.key.toLowerCase()).slice(-target.length);
                if (nextInput === target) setIsNumunumuMode(true);
                return nextInput;
            });
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (shouldReduceMotion) {
            setIsOpening(false);
            return undefined;
        }

        const timer = window.setTimeout(() => setIsOpening(false), 900);
        return () => window.clearTimeout(timer);
    }, [shouldReduceMotion]);

    const handleCubeSelect = (key) => {
        if (!['music', 'entame', 'fun'].includes(key)) return;
        setWorksFilter(key);
        navigate('/works');
    };

    const handleNavSelect = (page) => {
        if (page === 'works') setWorksFilter('all');
        navigate(page === 'home' ? '/' : `/${page}`);
    };

    const routeKey = pathname.startsWith('/contents/') ? 'contents' : pathname;
    const contextValue = useMemo(() => ({ isNumunumuMode }), [isNumunumuMode]);

    return (
        <NumunumuContext.Provider value={contextValue}>
            <RouteMetadata pathname={pathname} isNotFound={isNotFound} />
            <div className="min-h-screen w-full relative overflow-x-hidden selection:bg-black selection:text-[#FFD700]">
                <style>{`
                    body {
                        font-family: ${FONTS.sans};
                        background-color: ${THEME.bgBase};
                    }
                    .font-serif { font-family: ${FONTS.serif}; }
                    .font-sans { font-family: ${FONTS.sans}; }
                    .bg-brandGreen { background-color: ${THEME.brandGreen}; }
                    .bg-accentGold { background-color: ${THEME.accentGold}; }
                `}</style>

                {pathname !== '/secret' && !isNotFound && (
                    <>
                        <Header onNavigate={handleNavSelect} isOpening={isOpening} />
                        <NavigationDock activePage={activePage} onNavigate={handleNavSelect} isOpening={isOpening} />
                    </>
                )}

                <Suspense fallback={<LoadingFallback />}>
                    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
                        <Routes location={location} key={routeKey}>
                            <Route path="/" element={(
                                <motion.main
                                    key="home"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4"
                                >
                                    <div className="mb-16 sm:mb-20">
                                        <MagicCube onSelect={handleCubeSelect} isOpening={isOpening} />
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: isOpening ? 0 : 1 }}
                                        transition={{ delay: shouldReduceMotion ? 0 : 2.5 }}
                                        className="absolute bottom-28 sm:bottom-32 pointer-events-none z-50"
                                    >
                                        <p className="font-serif text-xs sm:text-sm md:text-lg bg-black text-[#FFD700] px-3 py-1 sm:px-4 md:px-6 md:py-2 transform -rotate-2 border-2 border-white shadow-[4px_4px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">
                                            {isNumunumuMode ? 'ぬむぬむとんかつ' : 'ドラッグして CUBE を回せ。'}
                                        </p>
                                    </motion.div>
                                </motion.main>
                            )} />
                            <Route path="/works" element={(
                                <PageWrapper>
                                    <WorksPage filter={worksFilter} onFilterChange={setWorksFilter} />
                                </PageWrapper>
                            )} />
                            <Route path="/contents" element={<PageWrapper><ContentsPage /></PageWrapper>} />
                            <Route path="/contents/:id" element={<ContentRoute />} />
                            <Route path="/links" element={<PageWrapper><LinksPage /></PageWrapper>} />
                            <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                            <Route path="/secret" element={<SecretPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </AnimatePresence>
                </Suspense>

                <div className="absolute bottom-2 right-4 text-[13px] text-gray-500 font-sans pointer-events-none z-0">
                    Copyright © 2026 {isNumunumuMode ? 'ぬむぬむとんかつ' : 'SANMENso'}
                </div>
            </div>
        </NumunumuContext.Provider>
    );
}

function App() {
    return (
        <HelmetProvider>
            <MotionConfig reducedMotion="user">
                <AppErrorBoundary>
                    <BrowserRouter>
                        <Helmet>
                            <meta name="description" content={SITE_META.description} />
                            <link rel="icon" href={SITE_META.favicon} />
                            <meta property="og:url" content={SITE_META.url} />
                            <meta property="og:type" content={SITE_META.type} />
                            <meta property="og:description" content={SITE_META.description} />
                            <meta property="og:image" content={SITE_META.image} />
                            <meta name="twitter:card" content="summary_large_image" />
                            <meta name="twitter:site" content={SITE_META.twitterUsername} />
                        </Helmet>
                        <GlobalErrorReporter />
                        <AppContent />
                    </BrowserRouter>
                </AppErrorBoundary>
            </MotionConfig>
        </HelmetProvider>
    );
}

export default App;
