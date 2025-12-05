import React, { useState, useEffect, useRef, useCallback } from 'react';

const SecretPage = ({ onBack }) => {
    const containerRef = useRef(null);
    const [windows, setWindows] = useState([]);
    const [chaosItems, setChaosItems] = useState([]);
    const [isNoiseActive, setIsNoiseActive] = useState(true);
    const [colors, setColors] = useState({ bg: '#000000', text: '#00FF00', border: '#FFFFFF' });
    const maxZRef = useRef(5000);
    const timeRef = useRef(0);
    const reqRef = useRef(null);
    const itemsRef = useRef([]);

    const ORACLE_MESSAGES = [
        "SYSTEM_HALTED // SOUL_NOT_FOUND", "The void stares back.", "Error 404: Future missing.",
        "Rebooting consciousness...", "Data corruption in sector 9.", "I see you.", "Connection reset by peer.",
        "Buffer overflow in dream.exe", "Who is watching the watcher?", "Digital decay detected."
    ];

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const generateRandomFace = () => {
        const size = 200;
        const color = '#FF00FF'; 
        
        const eyeSize = Math.random() * 15 + 5;
        const eyeOffset = Math.random() * 40 + 20;
        const mouthWidth = Math.random() * 60 + 20;
        const mouthCurve = Math.random() * 40 - 20;
        const facePoints = [];
        
        for(let i=0; i<8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = 70 + Math.random() * 30;
            facePoints.push(`${100 + Math.cos(angle)*r},${100 + Math.sin(angle)*r}`);
        }

        const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
                <polygon points="${facePoints.join(' ')}" fill="none" stroke="${color}" stroke-width="3" />
                <circle cx="${100 - eyeOffset}" cy="80" r="${eyeSize}" fill="none" stroke="${color}" stroke-width="3" />
                <circle cx="${100 - eyeOffset}" cy="80" r="3" fill="${color}" />
                <circle cx="${100 + eyeOffset}" cy="${80 + (Math.random()*20-10)}" r="${eyeSize * (0.8 + Math.random()*0.4)}" fill="none" stroke="${color}" stroke-width="3" />
                <circle cx="${100 + eyeOffset}" cy="${80 + (Math.random()*20-10)}" r="3" fill="${color}" />
                <path d="M ${100 - mouthWidth/2} 140 Q 100 ${140 + mouthCurve} ${100 + mouthWidth/2} 140" fill="none" stroke="${color}" stroke-width="3" />
                ${Array.from({length: 8}).map(() => {
                    const x1 = Math.random() * 200;
                    const y1 = Math.random() * 200;
                    return `<line x1="${x1}" y1="${y1}" x2="${x1 + Math.random()*40 - 20}" y2="${y1 + Math.random()*40 - 20}" stroke="${color}" stroke-width="1" opacity="0.8" />`;
                }).join('')}
            </svg>
        `;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    const createWindow = useCallback((content, title = `LOG_${Math.floor(Math.random()*999)}.TXT`, type='text') => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const id = generateId();
        const newItem = {
            id,
            type: 'window',
            x: Math.random() * (winW - 300),
            y: Math.random() * (winH - 300) + 50,
            baseX: Math.random() * (winW - 300),
            baseY: Math.random() * (winH - 300) + 50,
            title,
            content,
            contentType: type,
            params: {
                phase: Math.random() * Math.PI * 2,
                scrollSpeedY: (Math.random() - 0.5) * 3,
                scrollSpeedX: (Math.random() - 0.5) * 2,
                rotateSpeedX: (Math.random() - 0.5) * 5.0, 
                rotateSpeedY: (Math.random() - 0.5) * 5.0,
                rotateSpeedZ: (Math.random() - 0.5) * 3.0,
                isDragging: false
            }
        };
        
        setWindows(prev => [...prev, newItem]);
        itemsRef.current.push(newItem);
    }, []);

    const consultOracle = () => {
        if (Math.random() > 0.5) {
            const text = ORACLE_MESSAGES[Math.floor(Math.random() * ORACLE_MESSAGES.length)];
            createWindow(text, 'ORACLE_RESPONSE', 'text');
        } else {
            const faceSvg = generateRandomFace();
            createWindow(faceSvg, 'ENTITY_DETECTED', 'image');
        }
    };

    const injectChaos = () => {
        const newChaos = [];
        for(let i=0; i<20; i++) {
            const id = generateId();
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            
            const isFace = Math.random() > 0.8;

            if (isFace) {
                const item = {
                    id,
                    type: 'chaos_face', 
                    content: generateRandomFace(),
                    x: Math.random() * winW,
                    y: Math.random() * winH,
                    width: Math.random() * 150 + 50,
                    params: {
                        scrollSpeedY: (Math.random() - 0.5) * 15,
                        rotateSpeed: (Math.random() - 0.5) * 5,
                        baseX: Math.random() * winW,
                        baseY: Math.random() * winH,
                    }
                };
                newChaos.push(item);
                itemsRef.current.push(item);
            } else {
                const item = {
                    id,
                    type: 'chaos_text',
                    text: ["NULL", "ERROR", "VOID", "0x00", "NaN", "???", "†", "█"][Math.floor(Math.random()*8)],
                    x: Math.random() * winW,
                    y: Math.random() * winH,
                    color: ['#FF00FF', '#00FF00', '#FFFFFF', '#FFFF00'][Math.floor(Math.random()*4)],
                    fontSize: Math.random() * 8 + 4 + 'rem',
                    params: {
                        scrollSpeedY: (Math.random() - 0.5) * 25,
                        rotateSpeed: (Math.random() - 0.5) * 10,
                        baseX: Math.random() * winW,
                        baseY: Math.random() * winH,
                    }
                };
                newChaos.push(item);
                itemsRef.current.push(item);
            }
        }
        setChaosItems(prev => [...prev, ...newChaos]);
    };

    const randomizeColors = () => {
        const rc = () => '#' + Math.floor(Math.random()*16777215).toString(16);
        setColors({ bg: rc(), text: rc(), border: rc() });
    };

    useEffect(() => {
        const works = [
            { type: 'image', title: 'IMG_0092.JPG', src: 'https://placehold.co/250x300/blue/white?text=MY_ART_01', caption: 'fig.01: Distortion Study' },
            { type: 'image', title: 'SCAN_ERROR.PNG', src: 'https://placehold.co/300x200/red/black?text=GLITCH_FACE', caption: 'fig.02: Face Reconstruction' },
            { type: 'text', title: 'NOTE.TXT', content: 'There is nothing here but raw data.', caption: 'memo' },
            { type: 'image', title: 'UNKNOWN_ENTITY.SVG', src: generateRandomFace(), caption: 'detected_entity' }
        ];
        
        itemsRef.current = [];
        setWindows([]);
        
        works.forEach(w => createWindow(w.src || w.content, w.title, w.type));
        injectChaos();

        const loop = () => {
            timeRef.current += 0.02;
            const t = timeRef.current;
            const scrollY = window.scrollY;

            itemsRef.current.forEach(item => {
                const el = document.getElementById(item.id);
                if (!el || (item.params.isDragging && item.type === 'window')) return;

                if (!isNoiseActive) {
                        el.style.transform = `translate3d(${item.x}px, ${item.y - scrollY}px, 0)`;
                        return;
                }

                let nx, ny;

                if (item.type === 'window') {
                    const floatX = Math.sin(t + item.params.phase) * 10;
                    const floatY = Math.cos(t * 0.8 + item.params.phase) * 10;
                    const sY = -scrollY * item.params.scrollSpeedY;
                    const sX = scrollY * item.params.scrollSpeedX;
                    const rotX = scrollY * (item.params.rotateSpeedX || 0.5);
                    const rotY = scrollY * (item.params.rotateSpeedY || 0.5);
                    const rotZ = Math.sin(t*0.5)*5 + scrollY * (item.params.rotateSpeedZ || 0.2);
                    const moveZ = Math.sin(t * 0.3 + item.params.phase) * 100;

                    nx = item.x + floatX + sX;
                    ny = item.y + floatY + sY;
                    
                    el.style.transform = `translate3d(${nx}px, ${ny}px, ${moveZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
                } else if (item.type === 'chaos_text') {
                    const sY = -scrollY * item.params.scrollSpeedY;
                    const rotSpeed = scrollY * item.params.rotateSpeed;
                    const timeRot = Math.sin(t * 0.5) * 5;
                    nx = item.x;
                    ny = item.y + sY;
                    el.style.transform = `translate3d(${nx}px, ${ny}px, 0) rotate(${rotSpeed + timeRot}deg)`;
                } else if (item.type === 'chaos_face') {
                    const sY = -scrollY * item.params.scrollSpeedY;
                    const rotSpeed = scrollY * item.params.rotateSpeed;
                    const timeRot = Math.sin(t * 0.5) * 10;
                    nx = item.x;
                    ny = item.y + sY;
                    el.style.transform = `translate3d(${nx}px, ${ny}px, 0) rotate(${rotSpeed + timeRot}deg)`;
                }
            });
            reqRef.current = requestAnimationFrame(loop);
        };
        
        reqRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isNoiseActive, createWindow]);

    const handleDragStart = (e, id) => {
        const item = itemsRef.current.find(i => i.id === id);
        if(!item) return;

        item.params.isDragging = true;
        const el = document.getElementById(id);
        maxZRef.current++;
        el.style.zIndex = maxZRef.current;
        el.style.borderColor = '#FFFFFF';
        el.style.boxShadow = '10px 10px 0px #FF00FF';
        
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;
        const rect = el.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        const handleMove = (ev) => {
            const cx = ev.clientX || ev.touches?.[0].clientX;
            const cy = ev.clientY || ev.touches?.[0].clientY;
            const newX = cx - offsetX;
            const newY = cy - offsetY;
            el.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
            item.x = newX;
            item.y = newY;
        };

        const handleUp = () => {
            item.params.isDragging = false;
            el.style.borderColor = colors.border;
            el.style.boxShadow = '5px 5px 0px rgba(255,255,255,0.2)';
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
    };

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 z-[9000] overflow-hidden" 
            style={{ 
                backgroundColor: '#000000', 
                color: '#00FF00', 
                fontFamily: '"Courier New", monospace, serif',
                perspective: '1200px',
                backgroundImage: `
                    linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
            }}
        >
            <div className="absolute inset-0 pointer-events-none z-[9998]" 
                    style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
                        backgroundSize: '100% 4px',
                        opacity: 0.3
                    }}
            />
            
            <button 
                onClick={() => onBack('home')} 
                className="fixed top-4 left-4 z-[9999] bg-black border-2 border-white text-white px-2 py-1 hover:bg-white hover:text-black font-mono font-bold text-sm tracking-widest"
            >
                ← ROOT_DIR
            </button>

            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
                {[
                    { l: '🔮 CONSULT_ORACLE', fn: consultOracle }, 
                    { l: '💉 INJECT_CHAOS', fn: injectChaos }, 
                    { l: isNoiseActive ? 'NOISE: ON' : 'NOISE: OFF', fn: () => setIsNoiseActive(!isNoiseActive) }, 
                    { l: '🎨 COLOR_CHAOS', fn: randomizeColors }
                ].map((btn, i) => (
                    <button 
                        key={i} 
                        onClick={btn.fn} 
                        className="bg-black border border-green-500 text-green-500 px-2 py-1 min-w-[140px] text-xs font-mono hover:bg-green-500 hover:text-black active:border-white transition-colors"
                    >
                        {btn.l}
                    </button>
                ))}
            </div>

            {windows.map(win => (
                <div 
                    id={win.id} 
                    key={win.id} 
                    onMouseDown={(e) => handleDragStart(e, win.id)} 
                    onTouchStart={(e) => handleDragStart(e, win.id)} 
                    className="absolute bg-black border-2 flex flex-col w-[250px] shadow-[5px_5px_0px_rgba(255,255,255,0.2)] select-none" 
                    style={{ 
                        borderColor: '#FFFFFF', 
                        top: 0, left: 0, 
                        transformStyle: 'preserve-3d' 
                    }}
                >
                    <div className="flex justify-between items-center px-2 py-0.5 text-xs text-black bg-white cursor-move font-bold font-mono">
                        <span>{win.title}</span>
                        <span className="cursor-pointer hover:text-red-500" onClick={() => { setWindows(w => w.filter(x => x.id !== win.id)); itemsRef.current = itemsRef.current.filter(x => x.id !== win.id); }}>[x]</span>
                    </div>
                    <div className="p-2 flex flex-col gap-2 bg-black">
                        <fieldset className="border border-green-500 p-2 m-0">
                            <legend className="px-1 text-[10px] font-mono text-green-500">preview</legend>
                            {win.contentType === 'image' ? (
                                <img src={win.content} alt="content" className="w-full h-auto border border-green-500 pointer-events-none bg-white/10" />
                            ) : (
                                <div className="font-mono text-xs whitespace-pre-wrap h-32 overflow-y-auto text-green-500 scrollbar-hide">
                                    {win.content}
                                </div>
                            )}
                        </fieldset>
                        {win.params.caption && <div className="text-[10px] text-gray-400 underline font-mono">{win.params.caption}</div>}
                    </div>
                </div>
            ))}
            
            {chaosItems.map(item => (
                <div 
                    id={item.id} 
                    key={item.id} 
                    className="absolute font-black pointer-events-none mix-blend-exclusion whitespace-nowrap"
                    style={{ 
                        color: item.color || '#00FF00', 
                        fontSize: item.fontSize, 
                        top: 0, left: 0,
                        width: item.width 
                    }}
                >
                    {item.type === 'chaos_text' ? item.text : (
                        <img src={item.content} alt="chaos" style={{ width: '100%', height: 'auto' }} />
                    )}
                </div>
            ))}
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-serif text-white/10 pointer-events-none whitespace-nowrap rotate-[-15deg] mix-blend-overlay">
                DATA_LOSS // VOID
            </div>
        </div>
    );
};

export default SecretPage;