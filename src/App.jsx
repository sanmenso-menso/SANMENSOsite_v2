import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME, FONTS } from './constants';
import { NumunumuContext } from './NumunumuContext';
// コンポーネントのインポート
import LivingBackground from './components/LivingBackground';
import Header from './components/Header';
import NavigationDock from './components/NavigationDock';
import MagicCube from './components/MagicCube';

// ページのインポート

import { BrutalistBreaker } from './components/BrutalistBreaker';
import WorksPage from './pages/WorksPage';
import LinksPage from './pages/LinksPage';
import ContactPage from './pages/ContactPage';
import ContentsPage from './pages/ContentsPage';
import SecretPage from './pages/SecretPage';

function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();

    const getActivePage = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        return path.substring(1);
    };
    const activePage = getActivePage();

    const [worksFilter, setWorksFilter] = useState('all');
    const [isOpening, setIsOpening] = useState(true);
    const [showGame, setShowGame] = useState(false);
    const [isNumunumuMode, setIsNumunumuMode] = useState(false);
    const [input, setInput] = useState('');
    const target = 'numunumu';

    useEffect(() => {
        const handler = (e) => {
            setInput(prevInput => {
                const new_input = (prevInput + e.key.toLowerCase()).slice(-target.length);
                if (new_input === target) {
                    setIsNumunumuMode(true);
                }
                return new_input;
            });
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsOpening(false);
        }, 900); 
        return () => {
            clearTimeout(timer);
        };
    }, []);

    const handleCubeSelect = (key) => {
        if (['music', 'entame', 'fun'].includes(key)) {
            setWorksFilter(key);
            navigate('/works');
        } 
    };

    const handleNavSelect = (page) => {
        const path = page === 'home' ? '/' : `/${page}`;
        navigate(path);
        if (page === 'works') setWorksFilter('all');
    };

    const PageWrapper = ({ children }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full min-h-screen pt-20 pb-28 sm:pt-24 sm:pb-32">
            {children}
        </motion.div>
    );

    return (
        <NumunumuContext.Provider value={{ isNumunumuMode }}>
            <div className="min-h-screen w-full relative overflow-x-hidden selection:bg-black selection:text-[#FFD700]">
                {/* フォント等のスタイル定義 */}
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

                <AnimatePresence>
                    {showGame && <BrutalistBreaker onClose={() => setShowGame(false)} />}
                </AnimatePresence>

                {activePage !== 'secret' && (
                    <>
                        <Header onNavigate={handleNavSelect} isOpening={isOpening} />
                        <NavigationDock activePage={activePage} onNavigate={handleNavSelect} isOpening={isOpening} />
                    </>
                )}

                <AnimatePresence mode='wait' onExitComplete={() => window.scrollTo(0, 0)}>
                    <Routes location={location} key={location.pathname.startsWith('/contents') ? 'contents' : location.pathname}>
                        <Route path="/" element={
                            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
                                <div className="mb-16 sm:mb-20"><MagicCube onSelect={handleCubeSelect} isOpening={isOpening} /></div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: isOpening ? 0 : 1 }} transition={{ delay: 2.5 }} className="absolute bottom-28 sm:bottom-32 pointer-events-none">
                                    <p className="font-serif text-xs sm:text-sm md:text-lg bg-black text-[#FFD700] px-3 py-1 sm:px-4 md:px-6 md:py-2 transform -rotate-2 border-2 border-white shadow-[4px_4px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">{isNumunumuMode ? 'ぬむぬむとんかつ' : 'ドラッグして CUBE を回せ'}</p>
                                </motion.div>
                            </motion.div>
                        } />
                        <Route path="/works" element={<PageWrapper><WorksPage initialFilter={worksFilter} /></PageWrapper>} />
                        <Route path="/contents" element={<PageWrapper><ContentsPage /></PageWrapper>} />
                        <Route path="/contents/:id" element={<PageWrapper><ContentsPage /></PageWrapper>} />
                        <Route path="/links" element={<PageWrapper><LinksPage /></PageWrapper>} />
                        <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                        <Route path="/secret" element={<SecretPage />} />
                    </Routes>
                </AnimatePresence>
            </div>
        </NumunumuContext.Provider>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;