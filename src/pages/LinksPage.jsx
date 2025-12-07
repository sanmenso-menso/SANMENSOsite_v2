import React, { useState, useEffect, useRef } from 'react';
import { EXCAVATION_LINKS } from '../constants';
import { useNumunumu } from '../NumunumuContext';

const LinksPage = ({ onSecretClick }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const canvasRef = useRef(null);
    const inputLayerRef = useRef(null);
    const containerRef = useRef(null);
    const [isBroken, setIsBroken] = useState(false);
    const [shakeLevel, setShakeLevel] = useState(0);
    const currentHpRef = useRef(820000);
    const maxHp = 40000;
    const [randomPositions, setRandomPositions] = useState([]);

    const numuExcavationLinks = EXCAVATION_LINKS.map(link => ({...link, title: numuText, desc: numuText}));
    const finalLinks = isNumunumuMode ? numuExcavationLinks : EXCAVATION_LINKS;

    useEffect(() => {
        const positions = finalLinks.map(() => ({
            top: Math.random() * 60 + 10 + '%', 
            left: Math.random() * 60 + 10 + '%', 
            rotate: Math.random() * 30 - 15 + 'deg',
        }));
        setRandomPositions(positions);
    }, [finalLinks]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const inputLayer = inputLayerRef.current;
        const container = containerRef.current;
        if (!canvas || !inputLayer || !container) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const drawRock = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = '#1e5e3a'; 
            ctx.fillRect(0, 0, width, height);
            const noiseCount = (width * height) / 30;
            for (let i = 0; i < noiseCount; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#143d26' : '#2E8B57';
                const x = Math.random() * width;
                const y = Math.random() * height;
                ctx.fillRect(x, y, 2, 2);
            }
        };

        drawRock();
        window.addEventListener('resize', drawRock);

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
                        onSecretClick();
                    } else {
                        window.open(link.href, '_blank');
                    }
                }
                inputLayer.style.display = 'block';
            }
        };

        const scratch = (e) => {
            if (isBroken) return;
            e.preventDefault();
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
            if (ratio < 0.7) setShakeLevel(1);
            if (ratio < 0.3) setShakeLevel(2);
            if (ratio <= 0 && !isBroken) setIsBroken(true);
        };

        inputLayer.addEventListener('mousemove', scratch);
        inputLayer.addEventListener('touchmove', scratch, { passive: true });
        inputLayer.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('resize', drawRock);
            if(inputLayer) {
                inputLayer.removeEventListener('mousemove', scratch);
                inputLayer.removeEventListener('touchmove', scratch);
                inputLayer.removeEventListener('click', handleClick);
            }
        };
    }, [isBroken, onSecretClick]);

    const getShakeClass = () => {
        if (isNumunumuMode) return '';
        if (shakeLevel === 1) return 'animate-shake-light';
        if (shakeLevel === 2) return 'animate-shake-heavy';
        return '';
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-20 px-4 w-full relative">
            <style>{`
                @keyframes shake-light { 0% { transform: translate(0, 0); } 50% { transform: translate(1px, 1px); } 100% { transform: translate(-1px, -1px); } }
                @keyframes shake-heavy { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-2px, 2px) rotate(1deg); } 50% { transform: translate(2px, -2px) rotate(-1deg); } 75% { transform: translate(-2px, -2px) rotate(0.5deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
                .animate-shake-light { animation: shake-light 0.1s infinite; }
                .animate-shake-heavy { animation: shake-heavy 0.05s infinite; }
                @keyframes fly-away { 0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.8); opacity: 0; } }
            `}</style>

            <div className="text-center mb-8 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000] relative z-50 pointer-events-none">
                <h1 className="text-4xl font-black font-sans mb-2 text-black">{isNumunumuMode ? numuText : '相互リンク'}</h1>
                <span className="font-serif text-sm bg-black text-[#FFD700] px-2 py-1 inline-block transform -rotate-1">{isNumunumuMode ? numuText : 'ページを削って相互リンクを掘り起こせ'}</span>
            </div>

            <div ref={containerRef} className={`relative w-full max-w-4xl h-[70vh] bg-black border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.5)] overflow-hidden ${getShakeClass()} z-10`}>
                <div className="absolute inset-0 flex items-center justify-center z-0" style={{ background: 'radial-gradient(circle at center, #300 0%, #000 90%)' }}>
                    <a href="#" data-secret="true" onClick={(e) => { e.preventDefault(); onSecretClick(); }} className={`w-64 h-64 rounded-full border-2 border-red-500/50 flex flex-col items-center justify-center text-red-500 bg-black/90 rotate-12 hover:scale-105 hover:bg-red-900/20 transition-all cursor-pointer font-serif duration-1000 ${isBroken || isNumunumuMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <span className="text-3xl font-bold">{isNumunumuMode ? numuText : 'SECRET'}</span>
                    </a>
                </div>
                <div className={`absolute inset-0 z-10 pointer-events-none ${isBroken ? 'opacity-0 transform scale-150 transition-all duration-1000' : 'opacity-100'}`}>
                    {randomPositions.length > 0 && finalLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="absolute bg-white border-2 border-black p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:scale-110 hover:z-50 transition-transform cursor-pointer pointer-events-auto w-48 h-24" style={{ top: randomPositions[i]?.top || '50%', left: randomPositions[i]?.left || '50%', transform: `rotate(${randomPositions[i]?.rotate || '0deg'})`, backgroundColor: isNumunumuMode ? '#f0f0f0' : link.color || 'white' }}>
                            <span className="font-black font-sans text-lg leading-none">{link.title}</span>
                            <span className="font-serif text-xs opacity-70 mt-1">{link.desc}</span>
                        </a>
                    ))}
                </div>
                <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full z-20 cursor-crosshair transition-opacity duration-1000 pointer-events-none ${isBroken || isNumunumuMode ? 'opacity-0' : 'opacity-100'}`} />
                <div ref={inputLayerRef} className={`absolute inset-0 w-full h-full z-30 cursor-crosshair ${isBroken || isNumunumuMode ? 'hidden' : 'block'}`}></div>
                {(isBroken || isNumunumuMode) && (
                    <div className="absolute inset-0 pointer-events-none z-40">
                        {isNumunumuMode ? null : (
                            <>
                                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#1e5e3a] origin-bottom-right animate-[fly-away_1.5s_ease-out_forwards]" style={{'--tx': '-100%', '--ty': '-100%', '--rot': '-45deg', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'}}></div>
                                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#1e5e3a] origin-bottom-left animate-[fly-away_1.5s_ease-out_forwards]" style={{'--tx': '100%', '--ty': '-100%', '--rot': '45deg', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'}}></div>
                                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#1e5e3a] origin-top-right animate-[fly-away_1.5s_ease-out_forwards]" style={{'--tx': '-100%', '--ty': '100%', '--rot': '45deg', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'}}></div>
                                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#1e5e3a] origin-top-left animate-[fly-away_1.5s_ease-out_forwards]" style={{'--tx': '100%', '--ty': '100%', '--rot': '-45deg', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'}}></div>
                            </>
                        )}
                    </div>
                )}
                {(isBroken || isNumunumuMode) && (
                    <button onClick={() => window.location.reload()} className="absolute bottom-4 right-4 z-50 text-white font-mono text-xs opacity-50 hover:opacity-100 pointer-events-auto">{isNumunumuMode ? numuText : '[ RESTORE REALITY ]'}</button>
                )}
            </div>
        </div>
    );
};

export default LinksPage;