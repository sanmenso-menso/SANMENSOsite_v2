import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNumunumu } from '../NumunumuContext';

const SecretPage = () => {
    const navigate = useNavigate();
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const containerRef = useRef(null);
    const [windows, setWindows] = useState([]);
    const [chaosItems, setChaosItems] = useState([]);
    const [isNoiseActive, setIsNoiseActive] = useState(true);
    const [colors, setColors] = useState({ bg: '#000000', text: '#00FF00', border: '#FFFFFF' });
    const maxZRef = useRef(5000);
    const timeRef = useRef(0);
    const isNoiseActiveRef = useRef(isNoiseActive);
    const reqRef = useRef(null);
    const itemsRef = useRef([]);
    const mousePosRef = useRef({ x: 0, y: 0 });

    const ORACLE_MESSAGES = isNumunumuMode ? [numuText] : [
        "2030年を迎えるまでに何ができるのか考えるんだけど、毎月の生活費の見通しさえできない自分にとってはパピコを買う事しか出来なかった。", "わたくしといふ現象は、仮定された有機交流電燈のひとつの青い照明です（あらゆる透明な幽霊の複合体）風景やみんなといつしよにせはしくせはしく明滅しながら、いかにもたしかにともりつづける因果交流電燈のひとつの青い照明です（ひかりはたもち　その電燈は失はれ）", "Error 404: 何故見たのですか？",
        "このページに特に深い意味はない。漂うだけ", "エンコード失敗", "I see you.", "適当な発言をするムーブをする奴が本質を突く発言を通せると思うな",
        "バッファサイズを見誤る", "ごめんね", { type: 'link', url: 'https://youtu.be/SyGYHXMDgSw', image: '/images/secret/omuset.jpg', text: '培養オムのライブセットです' }, { type: 'link', url: 'https://www.nicovideo.jp/watch/sm45857005', image: '/images/secret/timeset.png', text: 'ボカライフより、DJmix『TIME』です' }, { type: 'link', url: 'https://soundcloud.com/lb3uw4iphdxy', image: '/images/secret/jyonkoni.png', text: 'ジョンジョン小錦　～魅惑のシンフォニー～' }
        // リンクを表示したい場合は以下のようにオブジェクトを追加してください
        // { type: 'link', url: 'https://example.com', image: '/images/example.jpg', text: 'リンクの説明' }
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

    const createWindow = useCallback((content, title = `LOG_${Math.floor(Math.random()*999)}.TXT`, type='text', overrides = {}) => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const id = generateId();
        const baseX = overrides.x ?? (Math.random() * (winW - 300));
        const baseY = overrides.y ?? (Math.random() * (winH - 300) + 50);
        const newItem = {
            id,
            type: 'window',
            x: baseX,
            y: baseY,
            baseX: baseX,
            baseY: baseY,
            title,
            content,
            contentType: type,
            params: {
                phase: Math.random() * Math.PI * 2,
                vx: 0,
                vy: 0,
                behavior: Math.random() > 0.5 ? 'attract' : 'repel',
                isDragging: false,
                ...overrides.params
            }
        };
        
        setWindows(prev => [...prev, newItem]);
        itemsRef.current.push(newItem);
    }, []);

    const consultOracle = () => {
        if (Math.random() > 0.43) {
            const msg = ORACLE_MESSAGES[Math.floor(Math.random() * ORACLE_MESSAGES.length)];
            if (typeof msg === 'string') {
                createWindow(msg, 'ORACLE_RESPONSE', 'text');
            } else if (msg && msg.type === 'link') {
                createWindow(msg, 'LINK_ACCESS', 'link');
            }
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
            const baseX = Math.random() * winW;
            const baseY = Math.random() * winH;

            if (isFace) {
                const item = {
                    id,
                    type: 'chaos_face', 
                    content: generateRandomFace(),
                    x: baseX,
                    y: baseY,
                    baseX: baseX,
                    baseY: baseY,
                    width: Math.random() * 150 + 50,
                    params: {
                        phase: Math.random() * Math.PI * 2,
                        vx: 0,
                        vy: 0,
                        behavior: Math.random() > 0.5 ? 'attract' : 'repel',
                    }
                };
                newChaos.push(item);
                itemsRef.current.push(item);
            } else {
                const item = {
                    id,
                    type: 'chaos_text',
                    text: isNumunumuMode ? numuText : ["(ﾟ∀ﾟ)", "？", "Ö", "！", "(ﾉ)・ω・(ヾ)", "ⓘ", "･ﾟ･(ﾉд<)･ﾟ", "(=^・・^=)"][Math.floor(Math.random()*8)],
                    x: baseX,
                    y: baseY,
                    baseX: baseX,
                    baseY: baseY,
                    color: ['#FF00FF', '#00FF00', '#FFFFFF', '#FFFF00'][Math.floor(Math.random()*4)],
                    fontSize: Math.random() * 8 + 4 + 'rem',
                    params: {
                        phase: Math.random() * Math.PI * 2,
                        vx: 0,
                        vy: 0,
                        behavior: Math.random() > 0.5 ? 'attract' : 'repel',
                    }
                };
                newChaos.push(item);
                itemsRef.current.push(item);
            }
        }
        setChaosItems(prev => [...prev, ...newChaos]);
    };

    const randomizeColors = () => {
        const rc = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        setColors({ bg: rc(), text: rc(), border: rc() });
    };

    useEffect(() => {
        isNoiseActiveRef.current = isNoiseActive;
    }, [isNoiseActive]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const works = isNumunumuMode ? [
            { type: 'text', title: numuText, content: numuText, caption: numuText },
            { type: 'text', title: numuText, content: numuText, caption: numuText },
            { type: 'text', title: numuText, content: numuText, caption: numuText },
            { type: 'text', title: numuText, content: numuText, caption: numuText }
        ] : [
            { type: 'image', title: 'IMG_2023.PMG', src: '/images/before_icon.png', caption: 'fig.01: かつての姿' },
            { type: 'image', title: 'SCAN_Collage.PNG', src: '/images/colage1.jpg', caption: 'fig.02: Face or prototype' },
            { type: 'text', title: 'NOTE.TXT', content: 'ここはシークレットページです。特に何かがあるわけじゃないけど。まあ見てってよ。', caption: 'memo' },
            { type: 'image', title: 'UNKNOWN_ENTITY.SVG', src: generateRandomFace(), caption: 'detected_entity' }
        ];
        
        itemsRef.current = [];
        setWindows([]);
        
        works.forEach(w => createWindow(w.src || w.content, w.title, w.type));
        injectChaos();

        const REPULSION_RADIUS = 200;
        const REPULSION_STRENGTH = 15;
        const SPRING_STRENGTH = 0.01;
        const DAMPING = 0.9;
        const FOLLOW_RADIUS = 400;

        const loop = () => {
            timeRef.current += 0.02;
            const t = timeRef.current;
            const mouseX = mousePosRef.current.x;
            const mouseY = mousePosRef.current.y;

            itemsRef.current.forEach(item => {
                const el = document.getElementById(item.id);
                if (!el) return;

                if (item.params.isDragging) {
                    item.params.vx = 0;
                    item.params.vy = 0;
                    el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
                } else {
                    if (!isNoiseActiveRef.current) {
                        item.x += (item.baseX - item.x) * 0.1;
                        item.y += (item.baseY - item.y) * 0.1;
                    } else {
                        let springTargetX = item.baseX;
                        let springTargetY = item.baseY;
                        let interactionX = 0;
                        let interactionY = 0;

                        if (item.params.behavior === 'attract') {
                            const distFromBaseToMouse = Math.sqrt(Math.pow(mouseX - item.baseX, 2) + Math.pow(mouseY - item.baseY, 2));
                            if (distFromBaseToMouse < FOLLOW_RADIUS) {
                                // マウスが定位置の近くにいる場合、目標地点をマウスにする
                                springTargetX = mouseX;
                                springTargetY = mouseY;
                            }
                        } else { // 'repel'
                            const dx = item.x - mouseX;
                            const dy = item.y - mouseY;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < REPULSION_RADIUS) {
                                const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
                                const angle = Math.atan2(dy, dx);
                                interactionX = Math.cos(angle) * force * REPULSION_STRENGTH;
                                interactionY = Math.sin(angle) * force * REPULSION_STRENGTH;
                            }
                        }

                        // 目標地点へのスプリング力
                        const springX = (springTargetX - item.x) * SPRING_STRENGTH;
                        const springY = (springTargetY - item.y) * SPRING_STRENGTH;
                        item.params.vx += springX + interactionX;
                        item.params.vy += springY + interactionY;
                        item.params.vx *= DAMPING;
                        item.params.vy *= DAMPING;
                        item.x += item.params.vx;
                        item.y += item.params.vy;
                    }
                    
                    const floatX = Math.sin(t + item.params.phase) * 5;
                    const floatY = Math.cos(t * 0.8 + item.params.phase) * 5;
                    const rotZ = Math.sin(t * 0.5 + item.params.phase) * 3;
                    el.style.transform = `translate3d(${item.x + floatX}px, ${item.y + floatY}px, 0) rotateZ(${rotZ}deg)`;
                }
            });
            reqRef.current = requestAnimationFrame(loop);
        };
        
        reqRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(reqRef.current);
    }, [createWindow, isNumunumuMode]);

    const handleDragStart = (e, id) => {
        const item = itemsRef.current.find(i => i.id === id);
        if(!item) return;
        if (e.type === 'mousedown') e.preventDefault();

        item.params.isDragging = true;
        const el = document.getElementById(id);
        maxZRef.current++;
        el.style.zIndex = maxZRef.current;
        el.style.borderColor = '#FFFFFF';
        el.style.boxShadow = '10px 10px 0px #FF00FF';
        
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;
        const offsetX = clientX - item.x;
        const offsetY = clientY - item.y;

        const handleMove = (ev) => {
            const cx = ev.clientX || ev.touches?.[0].clientX;
            const cy = ev.clientY || ev.touches?.[0].clientY;
            item.x = cx - offsetX;
            item.y = cy - offsetY;
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
                backgroundColor: colors.bg, 
                color: colors.text, 
                fontFamily: '"Courier New", monospace, serif',
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
                onClick={() => navigate('/')} 
                className="fixed top-4 left-4 z-[9999] bg-black border-2 border-white text-white px-2 py-1 hover:bg-white hover:text-black font-mono font-bold text-xs sm:text-sm tracking-widest"
            >
                ← ROOT_DIR
            </button>

            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
                {[
                    { l: 'ORACLE', fn: consultOracle }, 
                    { l: 'CHAOS', fn: injectChaos }, 
                    { l: isNoiseActive ? 'NOISE: ON' : 'NOISE: OFF', fn: () => setIsNoiseActive(!isNoiseActive) }, 
                    { l: 'COLOR', fn: randomizeColors }
                ].map((btn, i) => (
                    <button 
                        key={i} 
                        onClick={btn.fn} 
                        className="bg-black border border-green-500 text-green-500 px-2 py-1 min-w-[100px] sm:min-w-[140px] text-[10px] sm:text-xs font-mono hover:bg-green-500 hover:text-black active:border-white transition-colors"
                    >
                        {btn.l}
                    </button>
                ))}
            </div>

            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                {windows.map(win => (
                    <div 
                        id={win.id} 
                        key={win.id} 
                        onMouseDown={(e) => handleDragStart(e, win.id)} 
                        onTouchStart={(e) => handleDragStart(e, win.id)} 
                        className="absolute bg-black border-2 flex flex-col w-[200px] sm:w-[250px] shadow-[5px_5px_0px_rgba(255,255,255,0.2)] select-none touch-none" 
                        style={{ 
                            borderColor: colors.border, 
                            top: 0, left: 0, 
                            transformStyle: 'preserve-3d' 
                        }}
                    >
                        <div className="flex justify-between items-center px-2 py-0.5 text-[10px] sm:text-xs text-black bg-white cursor-move font-bold font-mono">
                            <span>{win.title}</span>
                            <span className="cursor-pointer hover:text-red-500" onClick={() => { setWindows(w => w.filter(x => x.id !== win.id)); itemsRef.current = itemsRef.current.filter(x => x.id !== win.id); }}>[x]</span>
                        </div>
                        <div className="p-2 flex flex-col gap-2 bg-black">
                            <fieldset className="border p-2 m-0" style={{ borderColor: colors.text }}>
                                <legend className="px-1 text-[8px] sm:text-[10px] font-mono" style={{ color: colors.text }}>preview</legend>
                                {win.contentType === 'image' ? (
                                    <img src={win.content} alt="content" className="w-full h-auto border pointer-events-none bg-white/10" style={{ borderColor: colors.text }} />
                                ) : win.contentType === 'link' ? (
                                    <a href={win.content.url} target="_blank" rel="noreferrer" className="block group cursor-pointer">
                                        <div className="relative overflow-hidden border" style={{ borderColor: colors.text }}>
                                            <img src={win.content.image} alt="link thumbnail" className="w-full h-auto object-cover transition-transform group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors pointer-events-none" />
                                        </div>
                                        {win.content.text && <div className="mt-1 font-mono text-[10px] sm:text-xs break-words" style={{ color: colors.text }}>{`> ${win.content.text}`}</div>}
                                    </a>
                                ) : (
                                    <div className="font-mono text-[10px] sm:text-xs whitespace-pre-wrap h-32 overflow-y-auto scrollbar-hide" style={{ color: colors.text }}>
                                        {win.content}
                                    </div>
                                )}
                            </fieldset>
                            {win.params.caption && <div className="text-[8px] sm:text-[10px] text-gray-400 underline font-mono">{win.params.caption}</div>}
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
            </div>
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-serif text-white/10 pointer-events-none whitespace-nowrap rotate-[-15deg] mix-blend-overlay">
                {isNumunumuMode ? numuText : 'DATA_LOSS // VOID'}
            </div>
        </div>
    );
};

export default SecretPage;