import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { FONTS, SITE_META, THEME } from './constants';
import { NumunumuContext } from './NumunumuContext';
import AppErrorBoundary from './components/AppErrorBoundary';
import Header from './components/Header';
import HomeArtistBackdrop from './components/HomeArtistBackdrop';
import HomeUpdateNotice from './components/HomeUpdateNotice';
import NavigationDock from './components/NavigationDock';
import { reportClientError } from './utils/reportClientError';
import {
    ROUTE_TRANSITION_LOCK_MS,
    canStartRouteTransition,
    isHomeEntryReady,
} from './utils/routeTransition';
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

const PageWrapper = ({ children, animatePosition = true }) => (
    <motion.main
        initial={animatePosition ? { opacity: 0, y: 20 } : { opacity: 0 }}
        animate={animatePosition ? { opacity: 1, y: 0 } : { opacity: 1 }}
        exit={animatePosition ? { opacity: 0, y: -20 } : { opacity: 0 }}
        className="w-full min-h-screen pt-20 pb-28 sm:pt-24 sm:pb-32"
    >
        {children}
    </motion.main>
);

const RouteTransitionFrame = ({ children, hasOpaqueBackground = false }) => {
    const isPresent = useIsPresent();

    return (
        <motion.div
            data-route-layer={isPresent ? 'current' : 'exiting'}
            aria-hidden={isPresent ? undefined : true}
            className={`${isPresent ? 'relative z-10' : 'pointer-events-none absolute inset-x-0 top-0 z-0 h-screen overflow-hidden'} col-start-1 row-start-1 min-h-screen min-w-0 w-full${hasOpaqueBackground ? ' bg-white' : ''}`}
        >
            {children}
        </motion.div>
    );
};

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
    const isReturningFromWorks = pathname === '/' && location.state?.transitionFrom === '/works';
    const isNotFound = !isKnownPath(pathname);
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    const activePage = pathname === '/' ? 'home' : firstSegment;

    const [worksFilter, setWorksFilter] = useState('all');
    const [isOpening, setIsOpening] = useState(true);
    const [completedHomeEntryKey, setCompletedHomeEntryKey] = useState(null);
    const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
    const [isNumunumuMode, setIsNumunumuMode] = useState(false);
    const [, setInput] = useState('');
    const routeTransitionLockRef = useRef(false);
    const routeTransitionTimerRef = useRef(null);
    const target = 'numunumu';
    const isCurrentHomeReady = isHomeEntryReady({
        pathname,
        currentEntryKey: location.key,
        completedEntryKey: completedHomeEntryKey,
    });

    const finishRouteTransition = useCallback(() => {
        window.clearTimeout(routeTransitionTimerRef.current);
        routeTransitionTimerRef.current = null;
        routeTransitionLockRef.current = false;
        setIsRouteTransitioning(false);
    }, []);

    const beginRouteTransition = useCallback((targetPath) => {
        const canNavigate = canStartRouteTransition({
            currentPath: pathname,
            targetPath,
            isTransitioning: routeTransitionLockRef.current,
            isCurrentHomeReady,
        });
        if (!canNavigate) return false;

        routeTransitionLockRef.current = true;
        setIsRouteTransitioning(true);
        window.clearTimeout(routeTransitionTimerRef.current);
        window.scrollTo(0, 0);
        navigate(targetPath, { state: { transitionFrom: pathname } });
        routeTransitionTimerRef.current = window.setTimeout(
            finishRouteTransition,
            ROUTE_TRANSITION_LOCK_MS,
        );
        return true;
    }, [finishRouteTransition, isCurrentHomeReady, navigate, pathname]);

    useEffect(() => () => window.clearTimeout(routeTransitionTimerRef.current), []);

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
        if (!beginRouteTransition('/works')) return;
        setWorksFilter(key);
    };

    const handleNavSelect = (page) => {
        const targetPath = page === 'home' ? '/' : `/${page}`;
        if (!beginRouteTransition(targetPath)) return;
        if (page === 'works') setWorksFilter('all');
    };

    const handleCubeIntroComplete = useCallback((entryKey) => {
        setCompletedHomeEntryKey(entryKey);
    }, []);

    const routeKey = pathname.startsWith('/contents/') ? 'contents' : pathname;
    const contextValue = useMemo(() => ({ isNumunumuMode }), [isNumunumuMode]);

    return (
        <NumunumuContext.Provider value={contextValue}>
            <RouteMetadata pathname={pathname} isNotFound={isNotFound} />
            <div
                className="min-h-screen w-full relative overflow-x-hidden selection:bg-black selection:text-[#FFD700]"
                data-route-transitioning={isRouteTransitioning ? 'true' : 'false'}
            >
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
                        <NavigationDock
                            activePage={activePage}
                            onNavigate={handleNavSelect}
                            isOpening={isOpening}
                            disabled={isRouteTransitioning || (pathname === '/' && !isCurrentHomeReady)}
                        />
                    </>
                )}

                <Suspense fallback={<LoadingFallback />}>
                    <LayoutGroup id="site-cube-route-transition">
                        <div className="relative grid min-h-screen w-full">
                            <AnimatePresence mode="sync">
                                <RouteTransitionFrame
                                    key={routeKey}
                                    hasOpaqueBackground={pathname === '/' || pathname === '/works'}
                                >
                                <Routes location={location}>
                            <Route path="/" element={(
                                <motion.main
                                    key="home"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative z-10 w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-white p-4"
                                >
                                    <HomeArtistBackdrop />
                                    {isCurrentHomeReady && (
                                        <HomeUpdateNotice onOpenWorks={() => handleNavSelect('works')} reduceMotion={shouldReduceMotion} />
                                    )}
                                    <div className="relative z-20 mb-16 sm:mb-20">
                                        <MagicCube
                                            onSelect={handleCubeSelect}
                                            onIntroComplete={handleCubeIntroComplete}
                                            onRouteAnimationComplete={finishRouteTransition}
                                            entryKey={location.key}
                                            isOpening={isOpening}
                                            layoutId="site-cube"
                                            isReturningFromWorks={isReturningFromWorks}
                                        />
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
                                <PageWrapper animatePosition={false}>
                                    <WorksPage
                                        filter={worksFilter}
                                        onFilterChange={setWorksFilter}
                                        onRouteAnimationComplete={finishRouteTransition}
                                    />
                                </PageWrapper>
                            )} />
                            <Route path="/contents" element={<PageWrapper><ContentsPage /></PageWrapper>} />
                            <Route path="/contents/:id" element={<ContentRoute />} />
                            <Route path="/links" element={<PageWrapper><LinksPage /></PageWrapper>} />
                            <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                            <Route path="/secret" element={<SecretPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                                </RouteTransitionFrame>
                            </AnimatePresence>
                        </div>
                    </LayoutGroup>
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
