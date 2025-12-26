import React, { useState } from 'react';
import PopVectorPlayer from '../components/PopVectorPlayer';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const contents = [
    {
        id: 'pop-vector-player',
        title: 'デモトラック＠ドリンクバー',
        description: 'デモトラックが聴けます。缶に入った炭酸ドリンクを楽しめます。※音が出ます',
        component: PopVectorPlayer,
    },
    // 将来的にここにコンテンツを追加
];

const ContentsPage = () => {
    const [selectedContent, setSelectedContent] = useState(null);

    const handleSelectContent = (content) => {
        setSelectedContent(content);
    };

    const handleBack = () => {
        setSelectedContent(null);
    };

    if (selectedContent) {
        const ContentComponent = selectedContent.component;
        return <ContentComponent onClose={handleBack} />;
    }

    const title = "Interactive Contents";
    const titleChars = title.split("");

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
        <div className="max-w-7xl mx-auto px-6 py-8">
            <header className="mb-12 border-b-4 border-black pb-6 border-double">
                <div>
                    <motion.h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none font-sans overflow-hidden" variants={containerVariants} initial="hidden" animate="visible" aria-label={title}>
                        {titleChars.map((char, index) => (
                            <motion.span key={`${char}-${index}`} variants={letterVariants} className="inline-block">
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </motion.h1>
                    <p className="font-mono font-bold text-black text-lg md:text-xl tracking-wide mt-2">
                        三面相が制作した、触って遊べるコンテンツです。
                    </p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                {contents.map(content => (
                    <div 
                        key={content.id} 
                        className="group relative bg-white border-4 border-black p-4 h-full flex flex-col transition-all duration-300 hover:-translate-y-2 hover:rotate-1 hover:shadow-[12px_12px_0px_#000] shadow-[6px_6px_0px_#000] cursor-pointer overflow-hidden"
                        onClick={() => handleSelectContent(content)}
                    >
                        <div className="flex-grow">
                             <h2 className="text-2xl font-black tracking-tight leading-none font-sans mb-3">{content.title}</h2>
                            <p className="text-sm font-medium leading-snug opacity-80 mb-4 flex-grow font-sans">{content.description}</p>
                        </div>
                        <div className="flex justify-end mt-auto">
                            <div className="flex items-center gap-1 font-bold text-sm border-b-2 border-transparent group-hover:border-black transition-all font-sans">
                                PLAY NOW <ArrowUpRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContentsPage;