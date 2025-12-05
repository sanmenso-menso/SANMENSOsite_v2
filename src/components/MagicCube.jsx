import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Music, Gamepad2, Smile } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';
import SecretProfileFace from './SecretProfileFace';

const MagicCube = ({ onSelect, isOpening, isMobile }) => { 
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const containerRef = useRef(null);
    const rotateX = useMotionValue(-20); 
    const rotateY = useMotionValue(-25);
    const z = useMotionValue(2000); 

    const springConfig = { stiffness: 30, damping: 18, mass: 1 };
    
    const springRotateX = useSpring(rotateX, springConfig);
    const springRotateY = useSpring(rotateY, springConfig);
    const springZ = useSpring(z, springConfig); 

    const isDragging = useRef(false);
    const prevPos = useRef({ x: 0, y: 0 });
    const downPos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);
    const [cubeSize, setCubeSize] = useState(300);

    const handlePointerDown = (e) => {
        if(isOpening) return;
        isDragging.current = true;
        hasDragged.current = false;
        const pos = { x: e.clientX, y: e.clientY };
        prevPos.current = pos;
        downPos.current = pos;
        e.preventDefault
        ();
    };

    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 768) {
                setCubeSize(180); 
            } else {
                setCubeSize(300); 
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (isOpening) {
            z.set(2000); 
            rotateY.set(-25 + 720);
            rotateX.set(-20 + 360); 
        } else {
            z.set(0);
            rotateY.set(rotateY.get() + 360);

            const timer = setTimeout(() => {
                rotateX.set(rotateX.get() + 360);
            }, 1600);
            return () => clearTimeout(timer);
        }
    }, [isOpening, rotateX, rotateY, z]);

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!isDragging.current) return;
            
            if (!hasDragged.current) {
                const deltaXSinceDown = Math.abs(e.clientX - downPos.current.x);
                const deltaYSinceDown = Math.abs(e.clientY - downPos.current.y);
                if (deltaXSinceDown > 5 || deltaYSinceDown > 5) {
                    hasDragged.current = true;
                }
            }

            const deltaX = e.clientX - prevPos.current.x;
            const deltaY = e.clientY - prevPos.current.y;
            prevPos.current = { x: e.clientX, y: e.clientY };
            rotateY.set(rotateY.get() + deltaX * 0.5);
            rotateX.set(rotateX.get() - deltaY * 0.5);
        };
        const handlePointerUp = () => {
            isDragging.current = false;
        };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [rotateX, rotateY]);

    const HALF_SIZE = cubeSize / 2;

    return (
        <div ref={containerRef} className="relative z-20 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none" style={{ width: '100%', height: '60vh', perspective: '1200px' }} onPointerDown={handlePointerDown}>
            <motion.div style={{ width: cubeSize, height: cubeSize, position: 'relative', transformStyle: 'preserve-3d', rotateX: springRotateX, rotateY: springRotateY, z: springZ, rotateZ: -5 }}>
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(0deg)" color="bg-brandGreen" borderColor="border-black" label="エンタメ" icon={<Gamepad2 size={isMobile ? 48 : 64} className="text-white" />} textColor="text-white" onClick={() => !hasDragged.current && onSelect('entame')} isMobile={isMobile} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(90deg)" color="bg-accentGold" borderColor="border-black" label="楽しさ" icon={<Smile size={isMobile ? 48 : 64} className="text-black" />} textColor="text-black" onClick={() => !hasDragged.current && onSelect('fun')} isMobile={isMobile} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateX(90deg)" color="bg-red-600" borderColor="border-black" label="音楽" icon={<Music size={isMobile ? 48 : 64} className="text-white" />} textColor="text-white" onClick={() => !hasDragged.current && onSelect('music')} isMobile={isMobile} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(-90deg)" color="bg-transparent" borderColor="border-black" customContent={<SecretProfileFace isMobile={isMobile} />} onClick={() => {}} isMobile={isMobile} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateX(-90deg)" color="bg-black" borderColor="border-white" customContent={
                    <div className="w-full h-full p-6 flex flex-col justify-center items-center text-white text-center select-none bg-black">
                   <h4 className={`font-black ${isMobile ? 'text-xl' : 'text-2xl'} mb-2 text-[#FFD700]`}>{isNumunumuMode ? numuText : 'HISTORY'}</h4>
                        <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} leading-tight mb-4 opacity-80`}>{isNumunumuMode ? numuText : '2022: 三日月タロウとして活動開始'}<br/>{isNumunumuMode ? '' : '↓'}<br/>{isNumunumuMode ? '' : '2024: 三面相に改名'}</p>
                        <h4 className={`font-black ${isMobile ? 'text-xl' : 'text-2xl'} mb-2 text-[#FFD700]`}>{isNumunumuMode ? numuText : "I'm in the"}</h4>
                        <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} leading-tight mb-4 opacity-80`}>{isNumunumuMode ? numuText : 'CDs'}</p>     
                    </div>
                } isMobile={isMobile} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(180deg)" color="bg-white" borderColor="border-black" customContent={
                    <div className="w-full h-full p-6 flex flex-col justify-center text-center select-none bg-white">
                        <h3 className={`font-black ${isMobile ? 'text-2xl' : 'text-3xl'} mb-4 border-b-4 border-black inline-block self-center`}>{isNumunumuMode ? numuText : 'WHO?'}</h3>
                        <p className={`font-serif ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed text-left font-bold`}>{isNumunumuMode ? numuText : 'インターネットの片隅で、コラージュを軸に音楽やビジュアルなどのコンテンツを制作し活動している。'}<br/>{isNumunumuMode ? '' : '面白さで世界の境界線を破壊・再構築し、実験的かつ親しみのある作品世界を目指す。'}<br/><br/>{isNumunumuMode ? '' : '制作デスクにはいつもスルメ'}</p>
                    </div>
                } isMobile={isMobile} />
                <div className="absolute inset-0 m-auto bg-black animate-pulse pointer-events-none" style={{ width: cubeSize * 0.5, height: cubeSize * 0.5, transform: 'translateZ(0)' }} />
            </motion.div>
        </div>
    );
};

const CubeFace = ({ size, halfSize, rotate, color, borderColor, label, icon, onClick, textColor, customContent, isMobile }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const numuIcon = <img src="/images/numunumu_icon.png" alt={numuText} className={isMobile ? "w-12 h-12" : "w-16 h-16"} />;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div className={`absolute inset-0 border-[6px] ${borderColor} ${color} flex items-center justify-center cursor-pointer overflow-hidden group select-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]`} style={{ width: size, height: size, transform: `${rotate} translateZ(${halfSize}px)`, backfaceVisibility: 'visible' }} onHoverStart={() => !isMobile && setIsHovered(true)} onHoverEnd={() => !isMobile && setIsHovered(false)} onClick={onClick}>
            {isNumunumuMode ? (
                <div className={`absolute inset-0 flex flex-col items-center justify-center ${textColor}`}>{numuIcon}<h3 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-black mt-4 font-sans tracking-tight`}>{numuText}</h3></div>
            ) : customContent ? (
                <div className={`absolute inset-0 ${textColor} w-full h-full`}>{customContent}</div>
            ) : (
                <>
                    {!isMobile && (
                        <motion.div className={`absolute inset-0 ${color} z-10 flex items-center justify-center border-4 border-white/20`} animate={{ x: isHovered ? "100%" : "0%" }} transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                            <div className={`w-20 h-20 border-4 ${textColor === 'text-white' ? 'border-white' : 'border-black'} rounded-full flex items-center justify-center`}><div className={`w-4 h-4 ${textColor === 'text-white' ? 'bg-white' : 'bg-black'} rounded-full animate-ping`} /></div>
                        </motion.div>
                    )}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center ${textColor}`}>{icon}<h3 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-black mt-4 font-sans tracking-tight`}>{label}</h3></div>
                </>
            )}
        </motion.div>
    );
};

export default MagicCube;