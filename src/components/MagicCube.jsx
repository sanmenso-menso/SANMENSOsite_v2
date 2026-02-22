import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Music, Gamepad2, Smile } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';
import SecretProfileFace from './SecretProfileFace';

const MagicCube = ({ onSelect, isOpening }) => { 
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
    const isScrolling = useRef(null);
    const prevPos = useRef({ x: 0, y: 0 });
    const downPos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);
    const [cubeSize, setCubeSize] = useState(300);
    const [isProfileFlipped, setIsProfileFlipped] = useState(false);

    const handlePointerDown = (e) => {
        if(isOpening) return;
        isDragging.current = true;
        hasDragged.current = false;
        isScrolling.current = false;
        const pos = { x: e.clientX, y: e.clientY };
        prevPos.current = pos;
        downPos.current = pos;
    };    

    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 768) {
                setCubeSize(195); 
            } else {
                setCubeSize(280); 
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpening]);

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!isDragging.current) return;

            
            // If it's a drag (or a mouse move), rotate the cube.
            if (!hasDragged.current) {
                const deltaXSinceDown = Math.abs(e.clientX - downPos.current.x);
                const deltaYSinceDown = Math.abs(e.clientY - downPos.current.y);
                if (deltaXSinceDown > 20 || deltaYSinceDown > 20) {
                    hasDragged.current = true;
                }
            }

            const deltaX = e.clientX - prevPos.current.x;
            const deltaY = e.clientY - prevPos.current.y;
            prevPos.current = { x: e.clientX, y: e.clientY };

            const xAngle = rotateX.get() * (Math.PI / 180);
            const direction = Math.cos(xAngle);

            rotateY.set(rotateY.get() + deltaX * 0.5 * direction);
            rotateX.set(rotateX.get() - deltaY * 0.5);
        };
        const handlePointerUp = () => {
            isDragging.current = false;
            isScrolling.current = null;
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
        <div ref={containerRef} className="relative z-20 flex items-center justify-center cursor-grab active:cursor-grabbing" style={{ width: '100%', height: '60vh', perspective: '1200px', touchAction: 'none' }} onPointerDown={handlePointerDown}>
            <motion.div style={{ width: cubeSize, height: cubeSize, position: 'relative', transformStyle: 'preserve-3d', rotateX: springRotateX, rotateY: springRotateY, z: springZ, rotateZ: -5, willChange: 'transform' }}>
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(0deg)" color="bg-brandGreen" borderColor="border-black" label="エンタメ" icon={<Gamepad2 className="text-white w-12 h-12 md:w-16 md:h-16" />} textColor="text-white" onClick={() => !hasDragged.current && onSelect('entame')} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(90deg)" color="bg-accentGold" borderColor="border-black" label="楽しさ" icon={<Smile className="text-black w-12 h-12 md:w-16 md:h-16" />} textColor="text-black" onClick={() => !hasDragged.current && onSelect('fun')} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateX(90deg)" color="bg-red-600" borderColor="border-black" label="音楽" icon={<Music className="text-white w-12 h-12 md:w-16 md:h-16" />} textColor="text-white" onClick={() => !hasDragged.current && onSelect('music')} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(-90deg)" color="bg-transparent" borderColor="border-black" customContent={<SecretProfileFace isFlipped={isProfileFlipped} />} onClick={() => !hasDragged.current && setIsProfileFlipped(prev => !prev)} />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateX(-90deg)" color="bg-black" borderColor="border-white" customContent={
                    <div className="w-full h-full p-6 flex flex-col justify-center items-center text-white text-center select-none bg-black">
                   <h4 className="font-black text-xl md:text-2xl mb-2 text-[#FFD700]">{isNumunumuMode ? numuText : 'HISTORY'}</h4>
                        <p className="font-mono text-xs md:text-sm leading-tight mb-4 opacity-80">{isNumunumuMode ? numuText : '2022: 三日月タロウとして活動開始'}<br/>{isNumunumuMode ? '' : '↓'}<br/>{isNumunumuMode ? '' : '2024: 三面相に改名'}</p>
                        <h4 className="font-black text-xl md:text-2xl mb-2 text-[#FFD700]">{isNumunumuMode ? numuText : "I'm in the"}</h4>
                        <p className="font-mono text-xs md:text-sm leading-tight mb-4 opacity-80">{isNumunumuMode ? numuText : 'CDs'}</p>     
                    </div>
                } />
                <CubeFace size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(180deg)" color="bg-white" borderColor="border-black" customContent={
                    <div className="w-full h-full p-3 md:p-6 flex flex-col justify-center text-center select-none bg-white">
                        <h3 className="font-black text-xl md:text-3xl mb-3 md:mb-5 border-b-2 md:border-b-4 border-black inline-block self-center">{isNumunumuMode ? numuText : 'WHO?'}</h3>
                        <p className="font-serif text-[10px] md:text-sm leading-snug md:leading-relaxed text-left font-bold">{isNumunumuMode ? numuText : '大阪在住。'}<br/>{isNumunumuMode ? '' : 'インターネットの片隅で、コラージュを軸に音楽やビジュアルなどのコンテンツを制作し活動している。'}<br/>{isNumunumuMode ? '' : '面白さで世界の境界線を破壊・再構築し、実験的かつ親しみのある作品世界を目指す。'}<br/>{isNumunumuMode ? '' : '制作デスクにはいつもスルメ'}</p>
                    </div>
                } />
                <div className="absolute inset-0 m-auto bg-black animate-pulse pointer-events-none" style={{ width: cubeSize * 0.5, height: cubeSize * 0.5, transform: 'translateZ(0)' }} />
            </motion.div>
        </div>
    );
};

const CubeFace = ({ size, halfSize, rotate, color, borderColor, label, icon, onClick, textColor, customContent }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const numuIcon = <img src="/images/numunumu_icon.png" alt={numuText} className="w-12 h-12 md:w-16 md:h-16" />;

    return (
        <motion.div className={`absolute inset-0 border-[4px] ${borderColor} ${color} flex items-center justify-center cursor-pointer overflow-hidden group select-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]`} style={{ width: size, height: size, transform: `${rotate} translateZ(${halfSize}px)`, backfaceVisibility: 'visible', outline: '1px solid transparent' }} onClick={onClick}>
            {isNumunumuMode ? (
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 ${textColor}`}>{numuIcon}<h3 className="text-xl md:text-4xl font-black mt-4 font-sans tracking-tight">{numuText}</h3></div>
            ) : customContent ? (
                <div className={`absolute inset-0 ${textColor} w-full h-full`}>{customContent}</div>
            ) : (
                <>
                    <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 ${textColor}`}>{icon}<h3 className="text-2xl md:text-4xl font-black mt-4 font-sans tracking-tight">{label}</h3></div>
                </>
            )}
        </motion.div>
    );
};

export default MagicCube;