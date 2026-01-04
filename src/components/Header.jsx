import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNumunumu } from '../NumunumuContext';

const Header = ({ onNavigate, isOpening }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const numuIcon = '/images/numunumu_icon.png';

    // スクロール位置を監視
    const { scrollY } = useScroll();
    // scrollYの値(0pxから200px)を、ヘッダーのy座標(0pxから-120px)に変換します。
    // clamp: true は、指定した範囲外の値にならないようにする設定です。
    const y = useTransform(scrollY, [0, 200], [0, -120], { clamp: true });

    const headerVariants = {
        hidden: { y: -120, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            // 初期表示用のアニメーション設定
            transition: { duration: 0.8, delay: isOpening ? 2 : 0, type: "spring", stiffness: 80 }
        },
    };

    return (
        <motion.div
            variants={headerVariants}
            initial="hidden"
            animate={isOpening ? "hidden" : "visible"}
            // オープニングアニメーション完了後に、スクロールと連動したy座標の動きを適用します
            style={!isOpening ? { y } : {}}
            className="fixed top-0 left-0 px-4 py-3 md:p-8 z-50 pointer-events-auto cursor-pointer"
            onClick={() => onNavigate('home')}
        >
            <div className="group flex flex-row items-center gap-3 md:gap-4">
                <img src={isNumunumuMode ? numuIcon : "/images/SANMENlogo.jpg"} alt={isNumunumuMode ? numuText : "SANMENSO logo"} className="w-auto h-14 md:h-20"/>
                <div className="flex flex-col items-start">
                    <h1 className="text-2xl md:text-4xl font-black font-sans tracking-tighter leading-none text-black group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-[#2E8B57] to-[#FFD700] transition-all">{isNumunumuMode ? numuText : 'SANMENSO'}</h1>
                    <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">{isNumunumuMode ? numuText : 'OFFICIAL SITE 2025'}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default Header;