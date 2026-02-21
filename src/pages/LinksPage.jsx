import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXCAVATION_LINKS, SOCIAL_LINKS } from '../constants';
import { useNumunumu } from '../NumunumuContext';
import ImageWithFallback from '../components/ImageWithFallback';
import { ExternalLink, Mail } from 'lucide-react';

const LinksPage = () => {
    const navigate = useNavigate();
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    // 壁の色定義
    const MOSS_COLOR = '#1e5e3a';
    const MOSS_NOISE_1 = '#143d26';
    const MOSS_NOISE_2 = '#2E8B57';
    const CONCRETE_COLOR = '#52525b'; // zinc-600

    const canvasRef = useRef(null);
    const inputLayerRef = useRef(null);
    const containerRef = useRef(null);
    const touchStartPos = useRef({ x: 0, y: 0 });
    const isScrolling = useRef(null);
    const [isBroken, setIsBroken] = useState(false);
    const [isWallLocked, setIsWallLocked] = useState(false);
    const [shakeLevel, setShakeLevel] = useState(0);
    const isMobile = useMemo(() => typeof window !== 'undefined' && 'ontouchstart' in window, []);
    const maxHp = isMobile ? 500000 : 1100000;
    const currentHpRef = useRef(maxHp);
    const [randomPositions, setRandomPositions] = useState([]);
    const [isSucking, setIsSucking] = useState(false);

    const triggerSecretTransition = useCallback(() => {
        setIsSucking(true);
        setTimeout(() => {
            navigate('/secret');
        }, 1500);
    }, [navigate]);

    const finalLinks = useMemo(() => {
        if (isNumunumuMode) {
            return EXCAVATION_LINKS.map(link => (link.type === 'banner' 
                ? {...link, alt: numuText, image: '/images/numunumu_icon.png'} 
                : {...link, title: numuText, desc: numuText}
            ));
        }
        return EXCAVATION_LINKS;
    }, [isNumunumuMode]);

    const numuSocialLinks = SOCIAL_LINKS.map(link => ({ ...link, name: numuText }));
    const finalSocialLinks = isNumunumuMode ? numuSocialLinks : SOCIAL_LINKS;

    const shardsData = useMemo(() => {
        const generateShards = () => {
            const items = [];
        const rows = 8;
        const cols = 8;
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const top = (r / rows) * 100;
                const left = (c / cols) * 100;
                const width = 100 / cols;
                const height = 100 / rows;
                const cx = (c + 0.5) * (100 / cols) - 50;
                const cy = (r + 0.5) * (100 / rows) - 50;
                const angle = Math.atan2(cy, cx);
                const force = 100 + Math.random() * 100;

                const vertexCount = rand(3, 6);
                const vertices = [];
                const startAngle = Math.random() * Math.PI * 2;
                
                for (let i = 0; i < vertexCount; i++) {
                    const ang = startAngle + (i * (Math.PI * 2) / vertexCount) + (Math.random() * 0.5 - 0.25);
                    const radius = rand(30, 90);
                    let x = 50 + Math.cos(ang) * radius;
                    let y = 50 + Math.sin(ang) * radius;
                    vertices.push(`${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`);
                }
                const clipPath = `polygon(${vertices.join(', ')})`;

                items.push({
                    top: `${top}%`,
                    left: `${left}%`,
                    width: `${width + 5}%`,
                    height: `${height + 5}%`,
                    tx: Math.cos(angle) * force + '%',
                    ty: Math.sin(angle) * force + '%',
                    rot: (Math.random() - 0.5) * 720 + 'deg',
                    delay: Math.random() * 0.1 + 's',
                    clipPath
                });
            }
        }
            return items;
        };
        return { concrete: generateShards() };
    }, []);

    useEffect(() => {
        const positions = finalLinks.map(() => ({
            top: Math.random() * 60 + 10 + '%', 
            left: Math.random() * 60 + 10 + '%', 
            rotate: Math.random() * 30 - 15 + 'deg',
            tx: (Math.random() - 0.5) * 150 + 'vw',
            ty: (Math.random() - 0.5) * 150 + 'vh',
            rotEnd: (Math.random() * 2000 - 1000) + 'deg',
            delay: Math.random() * 0.1 + 's'
        }));
        setRandomPositions(positions);
    }, [finalLinks]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const inputLayer = inputLayerRef.current;
        const container = containerRef.current;
        if (!canvas || !inputLayer || !container) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        let prevWidth = container.clientWidth;
        
        const drawRock = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = MOSS_COLOR; 
            ctx.fillRect(0, 0, width, height);
            const noiseCount = (width * height) / 30;
            for (let i = 0; i < noiseCount; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? MOSS_NOISE_1 : MOSS_NOISE_2;
                const x = Math.random() * width;
                const y = Math.random() * height;
                ctx.fillRect(x, y, 2, 2);
            }
        };

        const handleResize = () => {
            const currentWidth = container.clientWidth;
            if (currentWidth !== prevWidth) {
                prevWidth = currentWidth;
                drawRock();
            }
        };

        drawRock();
        window.addEventListener('resize', handleResize);

        const handleTouchStart = (e) => {
            // 最初のタッチ位置を記録し、スクロール判定をリセット
            if (e.touches.length === 1) {
                touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            isScrolling.current = null;
        };

        const handleClick = (e) => {
            const rect = inputLayer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            if (pixel[3] < 10) {
                inputLayer.style.display = 'none';
                const el = document.elementFromPoint(e.clientX, e.clientY);
                const link = el?.closest('a');
                if (link) {
                    if (link.dataset.secret) {
                        e.preventDefault();
                        triggerSecretTransition();
                    } else {
                        window.open(link.href, '_blank');
                    }
                }
                inputLayer.style.display = 'block';
            } else if (isMobile && !isWallLocked) {
                setIsWallLocked(true);
            }
        };

        const scratch = (e) => {
            if (isBroken || (isMobile && isWallLocked)) return;

            // タッチ操作の場合、スクロールか削る操作かを判定
            if (e.touches) {
                if (isScrolling.current === null) {
                    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
                    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
                    // 縦方向の移動が優位な場合はスクロールとみなす
                    if (dy > dx && dy > 5) {
                        isScrolling.current = true;
                    } else {
                        isScrolling.current = false;
                    }
                }
                // スクロールと判定された場合は、何もしないでブラウザのスクロールに任せる
                if (isScrolling.current === true) return;
            }

            e.preventDefault(); // 削る操作なので、ページのスクロールを止める
            const rect = inputLayer.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            ctx.globalCompositeOperation = 'destination-out';
            const density = 20;
            for (let i = 0; i < density; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * 25;
                const size = Math.random() * 5 + 2;
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, size, 0, Math.PI * 2);
                ctx.fill();
            }
            takeDamage(150);
        };

        const takeDamage = (amount) => {
            currentHpRef.current -= amount;
            if (currentHpRef.current < 0) currentHpRef.current = 0;
            const ratio = currentHpRef.current / maxHp;
            
            if (ratio <= 0 && !isBroken) {
                setIsBroken(true);
            } else if (ratio < 0.05) {
                setShakeLevel(3);
            } else if (ratio < 0.1) {
                setShakeLevel(2);
            } else if (ratio < 0.2) {
                setShakeLevel(1);
            }
        };

        inputLayer.addEventListener('touchstart', handleTouchStart, { passive: true });
        inputLayer.addEventListener('mousemove', scratch);
        inputLayer.addEventListener('touchmove', scratch, { passive: false });
        inputLayer.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('resize', handleResize);
            if(inputLayer) {
                inputLayer.removeEventListener('touchstart', handleTouchStart);
                inputLayer.removeEventListener('mousemove', scratch);
                inputLayer.removeEventListener('touchmove', scratch);
                inputLayer.removeEventListener('click', handleClick);
            }
        };
    }, [isBroken, navigate, isMobile, isWallLocked, triggerSecretTransition]);

    const getShakeClass = () => {
        if (isNumunumuMode) return '';
        if (shakeLevel === 1) return 'animate-shake-light';
        if (shakeLevel === 2) return 'animate-shake-heavy';
        if (shakeLevel === 3) return 'animate-shake-extreme';
        return '';
    };

    // Show a message when the wall is locked
    const WallLockIndicator = () => (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black text-white text-xs font-mono px-2 py-1 rounded-full pointer-events-none animate-pulse">
            WALL LOCKED
        </div>
    );

    const restoreWall = () => {
        setIsBroken(false);
        setShakeLevel(0);
        setIsWallLocked(false);
        currentHpRef.current = maxHp;
    };

    return (
            <>
            <div className="flex flex-col items-center pt-24 pb-12 px-4 w-full">
                <div className="w-full max-w-2xl">
                    <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_#000]">
                        <h2 className="text-2xl md:text-4xl font-black font-sans mb-6 text-center">{isNumunumuMode ? numuText : '三面相のリンクたち'}</h2>

                        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                            {finalSocialLinks.map((link, i) => (
                                <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base font-bold hover:bg-[#FFD700] hover:text-black hover:-translate-y-1 transition-all border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                                    <ExternalLink size={18} /> {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-start pb-20 px-4 w-full relative">
            <style>{`
                @keyframes shake-light { 0% { transform: translate(0, 0); } 50% { transform: translate(1px, 1px); } 100% { transform: translate(-1px, -1px); } }
                @keyframes shake-heavy { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-2px, 2px) rotate(1deg); } 50% { transform: translate(2px, -2px) rotate(-1deg); } 75% { transform: translate(-2px, -2px) rotate(0.5deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
                @keyframes shake-extreme { 0% { transform: translate(0, 0) rotate(0deg); } 10% { transform: translate(-4px, -4px) rotate(-2deg); } 20% { transform: translate(4px, 4px) rotate(2deg); } 30% { transform: translate(-4px, 4px) rotate(-2deg); } 40% { transform: translate(4px, -4px) rotate(2deg); } 50% { transform: translate(-4px, -4px) rotate(-2deg); } 60% { transform: translate(4px, 4px) rotate(2deg); } 70% { transform: translate(-4px, 4px) rotate(-2deg); } 80% { transform: translate(4px, -4px) rotate(2deg); } 90% { transform: translate(0, 0) rotate(0deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
                .animate-shake-light { animation: shake-light 0.1s infinite; }
                .animate-shake-heavy { animation: shake-heavy 0.05s infinite; }
                .animate-shake-extreme { animation: shake-extreme 0.05s infinite; }
                @keyframes fly-away { 0% { transform: translate(0, 0) rotate(var(--start-rot, 0deg)) scale(1); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0); opacity: 0; } }
                @keyframes suck-in { 0% { transform: scale(1) rotate(0deg); filter: brightness(1); } 100% { transform: scale(15) rotate(1080deg); filter: brightness(0); } }
            `}</style>

            <div className="text-center mb-6 md:mb-8 bg-white border-4 border-black p-4 shadow-[8px_8px_0px_#000] relative z-20 pointer-events-none">
                <h1 className="text-3xl md:text-4xl font-black font-sans mb-2 text-black">{isNumunumuMode ? numuText : '相互リンク'}</h1>
                <span className="font-serif text-sm bg-black text-[#FFD700] px-2 py-1 inline-block transform -rotate-1">{isNumunumuMode ? numuText : 'ページを削って相互リンクを掘り起こせ'}</span>
            </div>

            <div ref={containerRef} className={`relative w-full max-w-4xl h-[60vh] sm:h-[70vh] bg-black border-4 border-black shadow-[8px_8px_0px_#000] ${isBroken ? 'overflow-visible z-50' : 'overflow-hidden z-10'} ${isSucking ? 'animate-[suck-in_1.5s_ease-in_forwards] pointer-events-none' : getShakeClass()}`}>
                <div className={`absolute inset-0 flex items-center justify-center ${isBroken || isNumunumuMode ? 'z-40' : 'z-0'}`} style={{ background: 'radial-gradient(circle at center, #300 0%, #000 90%)' }}>
                    <a href="/secret" data-secret="true" onClick={(e) => { e.preventDefault(); triggerSecretTransition(); }} className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-red-500/50 flex flex-col items-center justify-center text-red-500 bg-black/90 rotate-12 hover:scale-105 hover:bg-red-900/20 transition-all cursor-pointer font-serif duration-1000 ${isBroken || isNumunumuMode ? 'opacity-100 pointer-events-auto delay-500' : 'opacity-0 pointer-events-none'}`}>
                        <span className="text-2xl md:text-3xl font-bold">{isNumunumuMode ? numuText : 'SECRET'}</span>
                    </a>
                </div>

                {/* 二階層目（コンクリート） */}
                {!isBroken && !isNumunumuMode && (
                    <div className="absolute inset-0 z-5" style={{ backgroundColor: CONCRETE_COLOR }}>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                    </div>
                )}

                <div className={`absolute inset-0 pointer-events-none ${isBroken ? 'z-[60]' : 'z-10'}`}>
                    {randomPositions.length > 0 && finalLinks.map((link, i) => (
                        link.type === 'banner' ? (
                            <a 
                                key={i} 
                                href={link.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`absolute block hover:scale-110 hover:z-50 transition-transform cursor-pointer pointer-events-auto w-32 h-8 sm:w-48 sm:h-12 md:w-64 md:h-16 overflow-hidden ${isBroken ? 'animate-[fly-away_1.0s_ease-in_forwards]' : ''}`}
                                style={{ 
                                    top: randomPositions[i]?.top || '50%', 
                                    left: randomPositions[i]?.left || '50%', 
                                    transform: `rotate(${randomPositions[i]?.rotate || '0deg'})`,
                                    '--tx': randomPositions[i]?.tx, 
                                    '--ty': randomPositions[i]?.ty, 
                                    '--rot': randomPositions[i]?.rotEnd, 
                                    '--start-rot': randomPositions[i]?.rotate, 
                                    animationDelay: randomPositions[i]?.delay 
                                }}
                            >
                                <ImageWithFallback
                                    src={link.image}
                                    alt={link.alt}
                                    className="w-full h-full object-contain"
                                    fallback={(
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 p-2 text-center text-xs text-gray-600">
                                            {link.alt}
                                        </div>
                                    )}
                                />
                            </a>
                        ) : (
                            <a 
                                key={i} 
                                href={link.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`absolute bg-white border-2 border-black p-1 sm:p-2 md:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:scale-110 hover:z-50 transition-transform cursor-pointer pointer-events-auto w-28 h-20 sm:w-40 sm:h-24 md:w-48 ${isBroken ? 'animate-[fly-away_1.0s_ease-in_forwards]' : ''}`}
                                style={{ 
                                    top: randomPositions[i]?.top || '50%', 
                                    left: randomPositions[i]?.left || '50%', 
                                    transform: `rotate(${randomPositions[i]?.rotate || '0deg'})`, 
                                    backgroundColor: isNumunumuMode ? '#f0f0f0' : 'white',
                                    '--tx': randomPositions[i]?.tx, 
                                    '--ty': randomPositions[i]?.ty, 
                                    '--rot': randomPositions[i]?.rotEnd, 
                                    '--start-rot': randomPositions[i]?.rotate, 
                                    animationDelay: randomPositions[i]?.delay 
                                }}
                            >
                                <span className="font-black font-sans text-xs sm:text-base md:text-lg leading-none flex items-center justify-center gap-2">{link.title}</span>
                                <span className="font-serif text-[8px] sm:text-[10px] md:text-xs opacity-70 mt-1">{link.desc}</span>
                            </a>
                        )
                    ))}
                </div>
                <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full z-20 cursor-crosshair pointer-events-none ${isBroken || isNumunumuMode ? 'opacity-0' : 'opacity-100'}`} />
                <div ref={inputLayerRef} className={`absolute inset-0 w-full h-full z-30 ${isBroken || isNumunumuMode ? 'hidden' : 'block'} ${isMobile && isWallLocked ? 'cursor-default' : 'cursor-crosshair'}`}></div>
                {(isBroken || isNumunumuMode) && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                        {isNumunumuMode ? null : (
                            <>
                                {shardsData.concrete.map((s, i) => (
                                    <div 
                                        key={`concrete-${i}`}
                                        className="absolute animate-[fly-away_1.5s_ease-out_forwards]"
                                        style={{
                                            backgroundColor: CONCRETE_COLOR,
                                            top: s.top,
                                            left: s.left,
                                            width: s.width,
                                            height: s.height,
                                            clipPath: s.clipPath,
                                            '--tx': s.tx,
                                            '--ty': s.ty,
                                            '--rot': s.rot,
                                            animationDelay: s.delay
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}
                {isMobile && isWallLocked && !isBroken && <WallLockIndicator />}
                {(isBroken || isNumunumuMode) && (
                    <button onClick={restoreWall} className="absolute bottom-4 right-4 z-50 text-white font-mono text-xs opacity-50 hover:opacity-100 pointer-events-auto">{isNumunumuMode ? numuText : '[ RESTORE REALITY ]'}</button>
                )}
            </div>
            </div>

            <div className="flex flex-col items-center pb-24 px-4 w-full">
                <p className="font-bold font-sans mb-4 text-lg">{isNumunumuMode ? numuText : '三面相の相互リンクはこちら！'}</p>
                <div className="border-4 border-black p-2 bg-white shadow-[4px_4px_0px_#000]">
                    <img src="/images/banner/sanmenso_banner.png" alt="三面相のバナー" className="max-w-full h-auto" />
                </div>
            </div>
        </>
    );
};

export default LinksPage;