import React, { useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { useNumunumu } from '../NumunumuContext';
import { useLocation } from 'react-router-dom';

const LivingBackground = ({ isOpening }) => {
    const location = useLocation();
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const { isNumunumuMode } = useNumunumu();
    const smoothX = useSpring(mouseX, { stiffness: 40, damping: 30, mass: 1 });
    const smoothY = useSpring(mouseY, { stiffness: 40, damping: 30, mass: 1 });
    const moveX = useTransform(smoothX, [0, 1], [30, -30]);
    const moveY = useTransform(smoothY, [0, 1], [30, -30]);

    // /contents/xxx のような詳細ページを開いているかを判定
    const isContentDetail = location.pathname.startsWith('/contents/') && location.pathname.split('/').length > 2;

    useEffect(() => {
        if (isContentDetail) {
            mouseX.set(0.5);
            mouseY.set(0.5);
        }

        const handleMouseMove = (e) => {
            if (isContentDetail) return;
            mouseX.set(e.clientX / window.innerWidth);
            mouseY.set(e.clientY / window.innerHeight);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY, isContentDetail]);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f2f5f3]">
            {/* Typography - Fades in after opening */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpening ? 0 : 0.03 }}
                transition={{ duration: 1, delay: 2.5 }}
                className="absolute inset-0 flex flex-col justify-center items-center z-0 pointer-events-none select-none overflow-hidden"
            >
                <h1 className="text-[25vw] leading-[0.8] font-black text-black whitespace-nowrap tracking-tighter transform -translate-y-4">{isNumunumuMode ? 'ぬむぬむ' : 'SANMEN'}</h1>
                <h1 className="text-[25vw] leading-[0.8] font-black text-black whitespace-nowrap tracking-tighter transform translate-y-4 ml-[20vw]">{isNumunumuMode ? 'とんかつ' : 'SO.'}</h1>
            </motion.div>

            {/* Geometric Shapes - Slide in after opening */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpening ? 0 : 1 }}
                transition={{ duration: 1, delay: 2 }}
                className="absolute inset-0 z-0" 
                style={{ x: moveX, y: moveY }}
            >
                <div className="absolute top-[15%] left-[5%] w-64 h-64 border-[4px] border-black/5 rounded-full mix-blend-multiply" />
                <div className="absolute top-[55%] right-[10%] w-96 h-96 opacity-5">
                    <svg viewBox="0 0 100 100" className="w-full h-full stroke-black stroke-1 fill-none">
                        <polygon points="50,10 90,90 10,90" />
                    </svg>
                </div>
                <div className="absolute bottom-[5%] left-[15%] w-48 h-48 bg-black/5 transform rotate-12" />
                <div className="absolute top-[30%] right-[30%] w-[40vw] h-[2px] bg-black/5 -rotate-12" />
            </motion.div>
        </div>
    );
};

export default LivingBackground;