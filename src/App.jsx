import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME, FONTS } from './constants';
import { NumunumuContext } from './NumunumuContext';

// コンポーネントのインポート
import LivingBackground from './components/LivingBackground';
import Header from './components/Header';
import NavigationDock from './components/NavigationDock';
import MagicCube from './components/MagicCube';

// ページのインポート
import WorksPage from './pages/WorksPage';
import LinksPage from './pages/LinksPage';
import ContactPage from './pages/ContactPage';
import SecretPage from './pages/SecretPage';

function App() {
    const [activePage, setActivePage] = useState('home');
    const [worksFilter, setWorksFilter] = useState('all');
    const [isOpening, setIsOpening] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
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
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        const timer = setTimeout(() => {
            setIsOpening(false);
        }, 900); 
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const handleCubeSelect = (key) => {
        if (['music', 'entame', 'fun'].includes(key)) {
            setWorksFilter(key);
            setActivePage('works');
        } 
    };

    const handleNavSelect = (page) => {
        setActivePage(page);
        if (page === 'works') setWorksFilter('all');
    };

    const PageWrapper = ({ children }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full min-h-screen pt-24 pb-32">
            {children}
        </motion.div>
    );

    return (
        <NumunumuContext.Provider value={{ isNumunumuMode }}>
            <div className="min-h-screen w-full relative overflow-x-hidden selection:bg-black selection:text-[#FFD700]" style={{ backgroundColor: THEME.bgBase }}>
                {/* フォント等のスタイル定義 */}
                <style>{`
                    body { font-family: ${FONTS.sans}; }
                    .font-serif { font-family: ${FONTS.serif}; }
                    .font-sans { font-family: ${FONTS.sans}; }
                    .bg-brandGreen { background-color: ${THEME.brandGreen}; }
                    .bg-accentGold { background-color: ${THEME.accentGold}; }
                `}</style>

                {/* <LivingBackground isOpening={isOpening} /> */}

                {activePage === 'secret' ? (
                    <SecretPage onBack={() => setActivePage('home')} />
                ) : (
                    <>
                        <Header onNavigate={handleNavSelect} isOpening={isOpening} />
                        <NavigationDock activePage={activePage} onNavigate={handleNavSelect} isOpening={isOpening} />
                        
                        <AnimatePresence mode='wait'>
                            {activePage === 'home' && (
                                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
                                    <div className="mb-20"><MagicCube onSelect={handleCubeSelect} isOpening={isOpening} isMobile={isMobile} /></div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: isOpening ? 0 : 1 }} transition={{ delay: 2.5 }} className="absolute bottom-32 pointer-events-none">
                                        <p className="font-serif text-sm md:text-lg bg-black text-[#FFD700] px-4 py-1 md:px-6 md:py-2 transform -rotate-2 border-2 border-white shadow-[4px_4px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">{isNumunumuMode ? 'ぬむぬむとんかつ' : 'ドラッグして CUBE を回せ'}</p>
                                    </motion.div>
                                </motion.div>
                            )}
                            {activePage === 'works' && <PageWrapper key="works"><WorksPage initialFilter={worksFilter} /></PageWrapper>}
                            {activePage === 'links' && <PageWrapper key="links"><LinksPage onSecretClick={() => setActivePage('secret')} /></PageWrapper>}
                            {activePage === 'contact' && <PageWrapper key="contact"><ContactPage /></PageWrapper>}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </NumunumuContext.Provider>
    );
}

export default App;