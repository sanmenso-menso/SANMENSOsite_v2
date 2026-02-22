import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Gamepad2, Smile, ArrowUpRight, X, Calendar, User, Tag, ExternalLink } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import { WORKS_DATA } from '../constants';
import { useNumunumu } from '../NumunumuContext';

const WorksPage = ({ initialFilter = 'all' }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const [filter, setFilter] = useState(initialFilter);
    const [selectedWork, setSelectedWork] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9; // 1ページあたりの表示件数

    // 詳細モーダルが開いている間はスクロールを無効化
    useEffect(() => {
        if (selectedWork) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedWork]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // フィルターが変更されたら、1ページ目に戻す
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        // 1ページ目に戻してスクロール
        handlePageChange(1);
    };
    
    const filteredWorks = useMemo(() => {
        const sorted = [...WORKS_DATA].sort((a, b) => b.id - a.id);

        if (isNumunumuMode) {
            return sorted.map(work => ({
                ...work,
                title: numuText,
                desc: numuText,
                detailText: numuText,
                role: numuText,
                credits: [numuText],
                year: ' ',
                type: 'fun',
                image: '/images/numunumu_icon.png',
            }));
        }

        const filtered = filter === 'all' ? sorted : sorted.filter(w => w.type === filter);
        return filtered;
    }, [filter, isNumunumuMode]);

    // 現在のページに表示する作品と総ページ数を計算
    const { currentWorks, totalPages } = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentWorks = filteredWorks.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredWorks.length / ITEMS_PER_PAGE);
        return { currentWorks, totalPages };
    }, [filteredWorks, currentPage]);

    const PaginationControls = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center items-center gap-2 md:gap-4 py-8">
                <button 
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} 
                    disabled={currentPage === 1}
                    className="h-12 w-12 flex items-center justify-center border-2 border-black bg-white text-black font-bold shadow-[4px_4px_0px_#000] hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                    &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => handlePageChange(page)} className={`h-12 w-12 flex items-center justify-center border-2 border-black font-bold shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all ${currentPage === page ? 'bg-black text-[#FFD700]' : 'bg-white text-black hover:bg-yellow-100'}`}>
                        {page}
                    </button>
                ))}
                <button 
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="h-12 w-12 flex items-center justify-center border-2 border-black bg-white text-black font-bold shadow-[4px_4px_0px_#000] hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                    &gt;
                </button>
            </div>
        );
    };

    const CATEGORIES = [
        { id: 'all', label: 'ALL', icon: null },
        { id: 'music', label: 'MUSIC', icon: Music },
        { id: 'entame', label: 'ENTAME', icon: Gamepad2 },
        { id: 'fun', label: 'FUN', icon: Smile },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 min-h-screen flex flex-col">
            <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 border-b-4 border-black pb-4 md:pb-6 border-double bg-white/80 backdrop-blur-sm p-2 md:p-4">
                <div>
                    <h2 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none mix-blend-hard-light text-[#FFD700] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] font-sans" style={{ WebkitTextStroke: '2px black' }}>{isNumunumuMode ? numuText : 'WORKS'}</h2>
                    <p className="font-mono font-bold text-black text-base md:text-lg tracking-wide mt-2">
                        <span className="bg-black text-[#FFD700] px-2 py-1">{isNumunumuMode ? numuText : 'IMAMADENO ARCHIVE'}</span> {isNumunumuMode ? '' : '2022 - 2025'}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-start md:justify-end">
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => handleFilterChange(cat.id)} className={`h-10 px-3 md:h-12 md:px-4 flex items-center justify-center gap-2 border-2 border-black transition-all shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-none font-bold font-sans text-sm md:text-base ${filter === cat.id ? 'bg-black text-[#FFD700]' : 'bg-white text-black hover:bg-yellow-100'}`}>
                            {cat.icon && <cat.icon size={18} />}<span>{isNumunumuMode ? numuText : cat.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <PaginationControls />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-16">
                <AnimatePresence mode='popLayout'>
                    {currentWorks.map((work) => (
                        <motion.div key={work.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} onClick={() => setSelectedWork(work)} className="group relative bg-white border-4 border-black p-3 md:p-4 h-full flex flex-col transition-all duration-300 hover:-translate-y-2 hover:rotate-1 hover:shadow-[12px_12px_0px_#000] shadow-[6px_6px_0px_#000] cursor-pointer overflow-hidden">
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-yellow-400/80 rotate-[-2deg] opacity-80 shadow-sm z-10"></div>
                            <div className="w-full aspect-video border-2 border-black mb-3 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                <ImageWithFallback
                                    src={work.image}
                                    alt={work.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    fallback={(
                                        <>
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: work.color || '#cccccc' }}></div>
                                            {work.type === 'music' && <Music size={64} className="opacity-50" />}
                                            {work.type === 'entame' && <Gamepad2 size={64} className="opacity-50" />}
                                            {work.type === 'fun' && <Smile size={64} className="opacity-50" />}
                                        </>
                                    )}
                                />
                            </div>
                            <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2 border-dashed">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight leading-none font-sans">{work.title}</h3>
                                <span className="font-mono text-xs bg-black text-white px-1 py-0.5 transform rotate-3">{work.year}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold border border-black rounded-full px-2 py-0.5 bg-yellow-300 font-mono">{work.type.toUpperCase()}</span>
                                <span className="text-xs font-mono opacity-60">{work.role}</span>
                            </div>
                            <p className="text-sm font-medium leading-snug opacity-80 line-clamp-3 mb-3 flex-grow font-sans">{work.desc}</p>
                            <div className="flex justify-end mt-auto">
                                <div className="flex items-center gap-1 font-bold text-sm border-b-2 border-transparent group-hover:border-black transition-all font-sans">{isNumunumuMode ? numuText : 'READ MORE'} <ArrowUpRight size={16} /></div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <PaginationControls />

            <AnimatePresence>
                {selectedWork && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-8">
                        <div className="absolute inset-0 bg-black/75" onClick={() => setSelectedWork(null)}></div>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] bg-[#f0f0f0] border-4 md:border-[6px] border-black shadow-[8px_8px_0px_#000] md:shadow-[16px_16px_0px_#000] flex flex-col md:flex-row overflow-hidden z-10">
                            <button onClick={() => setSelectedWork(null)} className="absolute top-0 right-0 z-20 bg-black text-white p-3 hover:bg-[#FFD700] hover:text-black transition-colors"><X size={32} /></button>
                            <div className="w-full md:w-2/5 h-1/3 md:h-full bg-gray-200 border-b-4 md:border-b-0 md:border-r-4 border-black relative overflow-hidden group flex items-center justify-center">
                                <ImageWithFallback
                                    src={selectedWork.image}
                                    alt={selectedWork.title}
                                    className="w-full h-full object-cover"
                                    fallback={(
                                        <>
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: selectedWork.color }}></div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-50 text-black">
                                                {selectedWork.type === 'music' && <Music size={120} className="stroke-1" />}
                                                {selectedWork.type === 'entame' && <Gamepad2 size={120} className="stroke-1" />}
                                                {selectedWork.type === 'fun' && <Smile size={120} className="stroke-1" />}
                                            </div>
                                        </>
                                    )}
                                />
                                <div className="absolute bottom-4 left-4 bg-white border-2 border-black px-3 py-1 font-mono text-sm shadow-[4px_4px_0px_#000]">{isNumunumuMode ? numuText : `ID: ${selectedWork.id.toString().padStart(3, '0')}`}</div>
                            </div>
                            <div className="w-full md:w-3/5 overflow-y-auto bg-white p-6 md:p-8 lg:p-12 flex flex-col gap-6 md:gap-8">
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="flex items-center gap-1 font-mono text-xs border border-black px-2 py-0.5 bg-yellow-300"><Tag size={12} /> {isNumunumuMode ? numuText : selectedWork.type.toUpperCase()}</span>
                                        <span className="flex items-center gap-1 font-mono text-xs border border-black px-2 py-0.5 bg-white"><Calendar size={12} /> {isNumunumuMode ? numuText : selectedWork.year}</span>
                                        <span className="flex items-center gap-1 font-mono text-xs border border-black px-2 py-0.5 bg-white"><User size={12} /> {isNumunumuMode ? numuText : selectedWork.role}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-none mb-4 font-sans">{selectedWork.title}</h2>
                                    <div className="h-1 w-24 bg-black"></div>
                                </div>
                                <div className="font-serif text-lg leading-loose text-gray-800 whitespace-pre-line">{selectedWork.detailText || selectedWork.desc}</div>
                                {selectedWork.credits && (
                                    <div className="bg-gray-100 p-6 border-2 border-black/20 mt-4">
                                        <h4 className="font-bold border-b border-black/20 pb-2 mb-3 font-sans">{isNumunumuMode ? numuText : 'CREDITS'}</h4>
                                        <ul className="space-y-1 font-mono text-sm">{selectedWork.credits.map((c, i) => <li key={i}>- {c}</li>)}</ul>
                                    </div>
                                )}
                                {selectedWork.url && (
                                    <div className="pt-8 mt-auto">
                                        <a href={selectedWork.url} target="_blank" rel="noreferrer" className="w-full bg-black text-white font-bold py-4 text-xl flex items-center justify-center gap-2 border-2 border-black shadow-[8px_8px_0px_#FFD700] hover:translate-y-1 hover:shadow-none hover:bg-gray-900 transition-all font-sans">{isNumunumuMode ? numuText : 'VIEW MORE'} <ExternalLink size={20} /></a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorksPage;