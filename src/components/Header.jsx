import React from 'react';
import { motion } from 'framer-motion';
import { useNumunumu } from '../NumunumuContext';

const Header = ({ onNavigate, isOpening }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const numuIcon = '/images/numunumu_icon.png';

    return (
        <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: isOpening ? -100 : 0, opacity: isOpening ? 0 : 1 }}
            transition={{ duration: 0.8, delay: 2, type: "spring" }}
            className="fixed top-0 left-0 p-4 md:p-8 z-50 pointer-events-auto cursor-pointer" 
            onClick={() => onNavigate('home')}
        >
            <div className="group flex flex-row items-center gap-4">
    　 　       <img src={isNumunumuMode ? numuIcon : "/images/SANMENlogo.png"} alt={isNumunumuMode ? numuText : "SANMENSO logo"} className="w-50 h-14 md:w-50 md:h-20"/>
                <div className="flex flex-col items-start">
                    <h1 className="text-2xl md:text-4xl font-black font-sans tracking-tighter leading-none text-black group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-[#2E8B57] to-[#FFD700] transition-all">{isNumunumuMode ? numuText : 'SANMENSO'}</h1>
                    <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">{isNumunumuMode ? numuText : 'PORTFOLIO 2025'}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default Header;