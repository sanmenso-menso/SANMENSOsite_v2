import React, { useCallback, useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, animate, AnimatePresence, useIsPresent, useReducedMotion } from 'framer-motion';
import { Music, Palette, RadioTower } from 'lucide-react';
import * as THREE from 'three';
import { useNumunumu } from '../NumunumuContext';
import SecretProfileFace from './SecretProfileFace';
import AboutPage from './AboutPage';
import HistoryPage from './HistoryPage';
import {
    CUBE_ROUTE_TRANSITION_SECONDS,
    canCompleteReturningCubeIntro,
} from '../utils/routeTransition';

const MagicCube = ({
    onSelect,
    onIntroComplete,
    onRouteAnimationComplete,
    entryKey,
    isOpening,
    layoutId = undefined,
    isReturningFromWorks = false,
}) => {
    const { isNumunumuMode } = useNumunumu();
    const shouldReduceMotion = useReducedMotion();
    const isPresent = useIsPresent();
    const numuText = 'ぬむぬむとんかつ';

    const containerRef = useRef(null);
    
    // Quaternion rotation state
    const targetQ = useRef(new THREE.Quaternion());
    const currentQ = useRef(new THREE.Quaternion());
    const transformMV = useMotionValue('');
    const introRotationY = useMotionValue(0);
    const introRotationX = useMotionValue(0);
    const rotationSpeed = useRef({ x: 0, y: 0 });

    const isDragging = useRef(false);
    const isScrolling = useRef(null);
    const prevPos = useRef({ x: 0, y: 0 });
    const downPos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);
    const [cubeSize, setCubeSize] = useState(300);
    const [isProfileFlipped, setIsProfileFlipped] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isInteractionReady, setIsInteractionReady] = useState(false);
    const introCompletionRef = useRef(false);
    const returnAnimationCompletionRef = useRef(false);
    const isCubeDisabled = !isPresent || !isInteractionReady;

    const markIntroComplete = useCallback(() => {
        if (!isPresent || introCompletionRef.current) return;
        introCompletionRef.current = true;
        setIsInteractionReady(true);
        onIntroComplete?.(entryKey);
    }, [entryKey, isPresent, onIntroComplete]);

    const handlePointerDown = (e) => {
        if(isCubeDisabled || isOpening || showAbout || showHistory) return;
        isDragging.current = true;
        hasDragged.current = false;
        isScrolling.current = false;
        rotationSpeed.current = { x: 0, y: 0 };
        const pos = { x: e.clientX, y: e.clientY };
        prevPos.current = pos;
        downPos.current = pos;
    };    

    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 768) {
                setCubeSize(185);
            } else {
                setCubeSize(280); 
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        let isCancelled = false;
        let activeAnimation;
        let introStartTimer;

        introCompletionRef.current = false;
        returnAnimationCompletionRef.current = false;
        setIsInteractionReady(false);

        if (!isPresent) return undefined;

        introRotationY.set(0);
        introRotationX.set(0);
        rotationSpeed.current = { x: 0, y: 0 };

        // Reset rotation to the final resting pose before applying the intro offsets.
        const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -20 * Math.PI / 180);
        const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -25 * Math.PI / 180);
        targetQ.current.multiplyQuaternions(qx, qy);
        currentQ.current.copy(targetQ.current);

        if (shouldReduceMotion) {
            markIntroComplete();
            return undefined;
        }

        if (isReturningFromWorks) return undefined;

        // Start rotating shortly after the independent floating animation begins.
        const playIntro = async () => {
            introRotationY.set(Math.PI * 2);
            activeAnimation = animate(introRotationY, 0, {
                type: "tween",
                duration: 1.2,
                ease: "easeInOut"
            });
            await activeAnimation;
            if (isCancelled) return;

            introRotationX.set(Math.PI * 2);
            activeAnimation = animate(introRotationX, 0, {
                type: "tween",
                duration: 1,
                ease: "easeInOut"
            });
            await activeAnimation;
            if (isCancelled) return;

            markIntroComplete();
        };
        introStartTimer = window.setTimeout(playIntro, 200);

        return () => {
            isCancelled = true;
            window.clearTimeout(introStartTimer);
            activeAnimation?.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPresent, isReturningFromWorks, markIntroComplete, shouldReduceMotion]);

    useEffect(() => {
        if (canCompleteReturningCubeIntro({
            isReturningFromWorks,
            isOpening,
            hasReturnAnimationCompleted: returnAnimationCompletionRef.current,
        })) {
            markIntroComplete();
        }
    }, [isOpening, isReturningFromWorks, markIntroComplete]);

    useAnimationFrame(() => {
        if (!isPresent || showAbout || showHistory) return; // Stop animation if a page is open or exiting

        if (shouldReduceMotion) {
            currentQ.current.copy(targetQ.current);
        } else if (!isOpening && !isDragging.current) {
            // Apply inertia
            if (Math.abs(rotationSpeed.current.x) > 0.0001 || Math.abs(rotationSpeed.current.y) > 0.0001) {
                const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed.current.x);
                const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeed.current.y);
                targetQ.current.premultiply(qy);
                targetQ.current.premultiply(qx);
                rotationSpeed.current.x *= 0.95;
                rotationSpeed.current.y *= 0.95;
            }
        }

        // Smoothly interpolate currentQ towards targetQ (Base orientation)
        if (!shouldReduceMotion) currentQ.current.slerp(targetQ.current, 0.1);

        // Calculate render quaternion with intro animations applied
        const renderQ = currentQ.current.clone();
        
        const valY = introRotationY.get();
        if (valY > 0.001) {
            const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), valY);
            renderQ.premultiply(qY);
        }

        const valX = introRotationX.get();
        if (valX > 0.001) {
            const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-1, 0, 0), valX);
            renderQ.premultiply(qX);
        }

        // Build transformation matrix
        const matrix = new THREE.Matrix4();
        matrix.makeRotationFromQuaternion(renderQ);
        
        // Keep the cube on a stable depth plane. The intro uses rotation only.
        matrix.setPosition(0, 0, 0);

        // Apply fixed Z rotation (-5deg)
        const rotZ = new THREE.Matrix4().makeRotationZ(-5 * Math.PI / 180);
        matrix.premultiply(rotZ);

        transformMV.set(`matrix3d(${matrix.elements.join(',')})`);
    });

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

            const sensitivity = 0.005;
            const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * sensitivity);
            const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -deltaY * sensitivity);
            
            targetQ.current.premultiply(qy);
            targetQ.current.premultiply(qx);

            rotationSpeed.current = { x: deltaX * sensitivity, y: -deltaY * sensitivity };
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
    }, []);

    const HALF_SIZE = cubeSize / 2;
    const entryInitial = isReturningFromWorks
        ? { y: 0, scale: 0.86 }
        : shouldReduceMotion
          ? false
          : { opacity: 0, y: 48, scale: 0.84 };
    const entryAnimation = isReturningFromWorks
        ? { y: [0, -64, 0], scale: [0.86, 1.08, 1] }
        : shouldReduceMotion
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: [0, 0.72, 1], y: [48, 18, 0], scale: [0.84, 0.94, 1] };
    const entryTransition = isReturningFromWorks
        ? {
            duration: CUBE_ROUTE_TRANSITION_SECONDS,
            times: [0, 0.5, 1],
            ease: [0.22, 1, 0.36, 1],
          }
        : shouldReduceMotion
          ? { duration: 0.01 }
          : { duration: 1.8, times: [0, 0.5, 1], ease: [0.4, 0, 0.2, 1] };

    return (
        <div
            ref={containerRef}
            data-cube-ready={isInteractionReady && isPresent ? 'true' : 'false'}
            aria-busy={!isInteractionReady}
            className={`relative z-20 flex items-center justify-center pl-[100px] md:pl-0 ${isCubeDisabled ? 'pointer-events-none cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
            style={{ width: '100%', height: '60vh', perspective: '1200px', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
        >
            <motion.div
                data-shared-cube="home"
                layoutId={layoutId}
                transition={{ layout: { duration: CUBE_ROUTE_TRANSITION_SECONDS, ease: [0.22, 1, 0.36, 1] } }}
                onLayoutAnimationComplete={onRouteAnimationComplete}
                style={{ width: cubeSize, height: cubeSize, position: 'relative', zIndex: isReturningFromWorks ? 60 : undefined, transformStyle: 'preserve-3d' }}
            >
                <motion.div
                    data-cube-returning={isReturningFromWorks ? 'true' : 'false'}
                    initial={entryInitial}
                    animate={entryAnimation}
                    transition={entryTransition}
                    onAnimationComplete={() => {
                        if (!isReturningFromWorks) return;
                        returnAnimationCompletionRef.current = true;
                        if (canCompleteReturningCubeIntro({
                            isReturningFromWorks,
                            isOpening,
                            hasReturnAnimationCompleted: returnAnimationCompletionRef.current,
                        })) {
                            markIntroComplete();
                        }
                    }}
                    style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', willChange: 'transform' }}
                >
                    <motion.div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transform: transformMV, willChange: 'transform' }}>
                <CubeFace disabled={isCubeDisabled} ariaLabel="Live & Culture作品を見る" size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(0deg)" color="bg-brandGreen" borderColor="border-black" label={<>LIVE &amp;<br />CULTURE</>} icon={<RadioTower className="text-white w-12 h-12 md:w-16 md:h-16" />} textColor="text-white" onClick={() => !hasDragged.current && onSelect('live')} />
                <CubeFace disabled={isCubeDisabled} ariaLabel="Visual作品を見る" size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(90deg)" color="bg-accentGold" borderColor="border-black" label="VISUAL" icon={<Palette className="text-black w-12 h-12 md:w-16 md:h-16" />} textColor="text-black" onClick={() => !hasDragged.current && onSelect('visual')} />
                <CubeFace disabled={isCubeDisabled} ariaLabel="Music作品を見る" size={cubeSize} halfSize={HALF_SIZE} rotate="rotateX(90deg)" color="bg-red-600" borderColor="border-black" label="MUSIC" icon={<Music className="text-white w-12 h-12 md:w-16 md:h-16" />} textColor="text-white" onClick={() => !hasDragged.current && onSelect('music')} />
                <CubeFace disabled={isCubeDisabled} ariaLabel={isProfileFlipped ? 'プロフィール画像へ戻す' : '隠しプロフィールを表示'} ariaPressed={isProfileFlipped} size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(-90deg)" color="bg-transparent" borderColor="border-black" customContent={<SecretProfileFace isFlipped={isProfileFlipped} />} onClick={() => !hasDragged.current && setIsProfileFlipped(prev => !prev)} />
                <CubeFace disabled={isCubeDisabled} ariaLabel="活動履歴を開く" size={cubeSize} halfSize={HALF_SIZE} rotate="rotateX(-90deg)" color="bg-black" borderColor="border-white" onClick={() => !hasDragged.current && setShowHistory(true)} customContent={
                    <div className="w-full h-full p-6 flex flex-col justify-center items-center text-white text-center select-none bg-black">
                        <h4 className="font-black text-xl md:text-2xl mb-2 text-[#FFD700]">{isNumunumuMode ? numuText : 'HISTORY'}</h4>
                        <p className="font-mono text-xs md:text-sm leading-tight mb-4 opacity-80">{isNumunumuMode ? numuText : '2022: 三日月タロウとして活動開始'}<br/>{isNumunumuMode ? '' : '↓'}<br/>{isNumunumuMode ? '' : '2024: 三面相に改名'}</p>
                        <h4 className="font-black text-xl md:text-2xl mb-2 text-[#FFD700]">{isNumunumuMode ? numuText : "I'm in the"}</h4>
                        <p className="font-mono text-xs md:text-sm leading-tight mb-4 opacity-80">{isNumunumuMode ? numuText : 'CDs'}</p>     
                    </div>
                } />
                <CubeFace disabled={isCubeDisabled} ariaLabel="プロフィールを開く" size={cubeSize} halfSize={HALF_SIZE} rotate="rotateY(180deg)" color="bg-white" borderColor="border-black" onClick={() => !hasDragged.current && setShowAbout(true)} customContent={
                    <div className="w-full h-full p-2 md:p-6 flex flex-col justify-center text-center select-none bg-white">
                        <h3 className="font-black text-xl md:text-3xl mb-2 md:mb-5 border-b-2 md:border-b-4 border-black inline-block self-center">{isNumunumuMode ? numuText : 'WHO?'}</h3>
                        {isNumunumuMode ? (
                            <p className="font-sans text-[11px] md:text-sm font-bold">{numuText}</p>
                        ) : (
                            <div className="space-y-1 font-sans text-[9px] md:text-[11px] leading-tight text-left font-bold tracking-tight">
                                <p>2005年生まれ、大阪在住。</p>
                                <p>音と映像とインターネットのあいだで、楽しいものをつくる「楽し師」。</p>
                                <p>音楽を軸に、映像やデザイン、その他いろいろ。異なる世界の音や物を混ぜ、つなぎ、コラージュしながら、実験的だけどポップな作品をつくっている。</p>
                                <p>気持ちいいタイミングと、ユーモアを大切にしている。</p>
                            </div>
                        )}
                    </div>
                } />
                    <div className="absolute inset-0 m-auto bg-black pointer-events-none" style={{ width: cubeSize * 0.5, height: cubeSize * 0.5, transform: 'translateZ(0)' }} />
                    </motion.div>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
                {showHistory && <HistoryPage onClose={() => setShowHistory(false)} />}
            </AnimatePresence>
        </div>
    );
};

const CubeFace = ({
    disabled = false,
    ariaLabel,
    ariaPressed = undefined,
    size,
    halfSize,
    rotate,
    color,
    borderColor,
    label = '',
    icon = null,
    onClick,
    textColor = '',
    customContent = null,
}) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const numuIcon = <img src="/images/numunumu_icon.webp" alt={numuText} className="w-12 h-12 md:w-16 md:h-16" />;

    return (
        <motion.button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-pressed={ariaPressed}
            className={`absolute inset-0 border-[4px] ${borderColor} ${color} flex items-center justify-center cursor-pointer overflow-hidden group select-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-600`}
            style={{
                width: size,
                height: size,
                transform: `${rotate} translateZ(${halfSize}px)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
            }}
            onClick={onClick}
        >
            {isNumunumuMode ? (
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 ${textColor}`}>{numuIcon}<h3 className="text-xl md:text-4xl font-black mt-4 font-sans tracking-tight">{numuText}</h3></div>
            ) : customContent ? (
                <div className={`absolute inset-0 ${textColor} w-full h-full`}>{customContent}</div>
            ) : (
                <>
                    <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 ${textColor}`}>{icon}<h3 className="text-2xl md:text-4xl font-black mt-4 font-sans tracking-tight">{label}</h3></div>
                </>
            )}
        </motion.button>
    );
};

export default MagicCube;
