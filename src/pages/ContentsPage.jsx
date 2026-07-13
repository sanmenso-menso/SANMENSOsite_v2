import React, { Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';
import AccessibleDialog from '../components/AccessibleDialog';

const PopVectorPlayer = lazy(() => import('../components/PopVectorPlayer'));
const KineticVisualizer = lazy(() => import('../components/KineticVisualizer'));

const contents = [
    {
        id: 'pop-vector-player',
        title: 'デモトラック＠ドリンクバー',
        description: 'エレクトロなデモトラックが聴けます。缶に入った炭酸ドリンクを楽しめます。※音が出ます',
        component: PopVectorPlayer,
    },
    {
        id: 'kinetic-visualizer',
        title: 'デモトラック＠ポップスコーンマシーン',
        description: 'ポップな歌モノのデモトラックが聴けます。曲に合わせてポップコーンが弾けます。※音が出ます',
        component: KineticVisualizer,
    },
    // 将来的にここにコンテンツを追加
];

const ContentsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const displayContents = isNumunumuMode ? contents.map(c => ({
        ...c,
        title: numuText,
        description: numuText
    })) : contents;

    const selectedContent = displayContents.find(c => c.id === id);

    const handleSelectContent = (content) => {
        navigate(`/contents/${content.id}`);
    };

    const handleBack = () => {
        navigate('/contents');
    };

    const title = isNumunumuMode ? numuText : "Interactive Contents";
    const titleChars = title.split("");
    const SelectedComponent = selectedContent?.component;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: 0.23, // アニメーション全体の開始を0.1秒遅らせる
                staggerChildren: 0.03, // 各文字のアニメーション開始をずらす
            },
        },
    };

    const letterVariants = {
        hidden: {
            x: '20vw',      // 右側から登場
            opacity: 0,
            skewY: 10,      // Y軸を傾けて、上部が遅れるような効果を出す
        },
        visible: {
            x: 0,
            opacity: 1,
            skewY: 0,
            transition: {
                type: "spring", // バネのような物理アニメーション
                damping: 15,    // バネの減衰（値が小さいほど弾む）
                stiffness: 200, // バネの硬さ
            },
        },
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
            <header className="mb-8 md:mb-12 border-b-4 border-black pb-6 border-double">
                <div>
                    <div className="overflow-hidden">
                        <motion.h1 className="text-[9.5vw] sm:text-6xl md:text-8xl font-black tracking-tighter leading-none font-sans whitespace-nowrap" variants={containerVariants} initial={id ? "visible" : "hidden"} animate="visible" aria-label={title}>
                            {titleChars.map((char, index) => (
                                <motion.span key={`${char}-${index}`} variants={letterVariants} className="inline-block">
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            ))}
                        </motion.h1>
                    </div>
                    <p className="font-mono font-bold text-black text-sm sm:text-base md:text-lg tracking-wide mt-2">
                        {isNumunumuMode ? numuText : '三面相が制作した、触って遊べるコンテンツです。'}
                    </p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                {displayContents.map(content => (
                    <button
                        type="button"
                        key={content.id} 
                        aria-label={`${content.title}を開く。音声が再生されます`}
                        className="group relative bg-white border-4 border-black p-4 h-full flex flex-col text-left transition-all duration-300 hover:-translate-y-2 hover:rotate-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.3)] shadow-[6px_6px_0px_rgba(0,0,0,0.3)] cursor-pointer overflow-hidden"
                        onClick={() => handleSelectContent(content)}
                    >
                        <div className="flex-grow">
                             <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none font-sans mb-3">{content.title}</h2>
                            <p className="text-sm font-medium leading-snug opacity-80 mb-4 flex-grow font-sans">{content.description}</p>
                        </div>
                        <div className="flex justify-end mt-auto">
                            <div className="flex items-center gap-1 font-bold text-sm border-b-2 border-transparent group-hover:border-black transition-all font-sans">
                                {isNumunumuMode ? numuText : 'PLAY NOW'} <ArrowUpRight size={16} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {selectedContent && SelectedComponent && (
                    <AccessibleDialog
                        onClose={handleBack}
                        ariaLabel={selectedContent.title}
                        closeOnBackdrop={false}
                        className="fixed inset-0 z-[59]"
                    >
                        <Suspense fallback={(
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 text-white" role="status">
                                コンテンツを読み込んでいます…
                            </div>
                        )}>
                            <SelectedComponent onClose={handleBack} />
                        </Suspense>
                    </AccessibleDialog>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContentsPage;
