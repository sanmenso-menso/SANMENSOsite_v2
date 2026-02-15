import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Play, Pause, SkipBack, SkipForward, Music, X } from 'lucide-react';
import { SONGS } from '../constants';
import { useNumunumu } from '../NumunumuContext';

// -----------------------------------------------------------------------------
// CONSTANTS & ASSETS
// -----------------------------------------------------------------------------

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// -----------------------------------------------------------------------------
// VECTOR STYLE 3D COMPONENT
// -----------------------------------------------------------------------------

const VectorSodaCan = ({ isPlaying, currentSong, audioAnalyser }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const canRef = useRef(null);
  const liquidRef = useRef(null);
  const bubblesRef = useRef(null);
  const frameIdRef = useRef(null);
  const dataArrayRef = useRef(new Uint8Array(0));

  // Helper to create outlines
  const createOutline = (geometry, color = 0x000000, thresholdAngle = 15) => {
    const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
    const line = new THREE.LineSegments(
      edges, 
      new THREE.LineBasicMaterial({ color: color, linewidth: 2 }) // linewidth is mostly ignored by WebGL, but good intent
    );
    return line;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // --- SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    // カメラ位置を調整して、パースを少し弱め、アイソメトリックに近い雰囲気に
    camera.position.set(0, 1, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = { scene, camera, renderer };

    // --- LIGHTING (FLAT / NO SHADOWS NEEDED FOR BASIC MAT, BUT ADDING FOR SAFETY) ---
    // 基本的にMeshBasicMaterialを使うのでライティングは影響しないが、念のため
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // --- CREATE CAN GROUP ---
    const canGroup = new THREE.Group();
    scene.add(canGroup);
    canRef.current = canGroup;

    // Common Geometry Settings
    const SEGMENTS = 32;

    // 1. LIQUID (中身)
    // ベタ塗り + アウトライン
    const liquidColor = new THREE.Color(currentSong.color);
    const liquidGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.4, SEGMENTS);
    liquidGeo.translate(0, 0.7, 0); // Pivot at bottom

    const liquidMat = new THREE.MeshBasicMaterial({
      color: liquidColor,
      transparent: true,
      opacity: 0.8, // 少し透けさせて後ろの線を見せる
      side: THREE.DoubleSide,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = -1.4;
    
    // Liquid Outline
    const liquidOutline = createOutline(liquidGeo, 0x000000, 10);
    liquidMesh.add(liquidOutline);
    
    canGroup.add(liquidMesh);
    liquidRef.current = liquidMesh;


    // 2. SHELL (外側の容器)
    // 透明なガラス感ではなく、白いワイヤーフレーム的な表現にする
    const shellGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.0, SEGMENTS, 1, true);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false // 中身が透けて見えるように
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    
    // Main Outline (The Can Shape)
    // 角度の閾値を調整して、縦の線が出ないようにし、上下の円だけ線を出す
    const shellOutline = createOutline(shellGeo, 0x000000, 80); 
    shellMesh.add(shellOutline);

    // 側面の縦線を2本だけ追加してイラスト感を出す
    const sideLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.9, 1.5, 0), new THREE.Vector3(-0.9, -1.5, 0),
        new THREE.Vector3(0.9, 1.5, 0), new THREE.Vector3(0.9, -1.5, 0)
    ]);
    const sideLines = new THREE.LineSegments(sideLineGeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
    shellMesh.add(sideLines);

    canGroup.add(shellMesh);


    // 3. RIMS (上下のフチ)
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White flat
    
    // Top Rim
    const topRimGeo = new THREE.TorusGeometry(0.9, 0.05, 8, SEGMENTS);
    const topRim = new THREE.Mesh(topRimGeo, rimMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 1.5;
    topRim.add(createOutline(topRimGeo, 0x000000, 40));
    canGroup.add(topRim);

    // Bottom Rim
    const bottomRimGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, SEGMENTS);
    const bottomRim = new THREE.Mesh(bottomRimGeo, rimMat);
    bottomRim.position.y = -1.5;
    bottomRim.add(createOutline(bottomRimGeo, 0x000000, 40));
    canGroup.add(bottomRim);

    // 4. TAB (プルタブ)
    const tabGeo = new THREE.BoxGeometry(0.3, 0.02, 0.5);
    const tabMesh = new THREE.Mesh(tabGeo, rimMat);
    tabMesh.position.set(0, 1.52, 0);
    tabMesh.add(createOutline(tabGeo, 0x000000, 1)); // Boxは全部線を描く
    canGroup.add(tabMesh);


    // --- BUBBLES (Vector Dots) ---
    // Canvasで丸いテクスチャを動的に生成（綺麗な黒縁取りの円）
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
    const dotTexture = new THREE.CanvasTexture(canvas);

    const particlesCount = 40; // 少なくして目立たせる
    const posArray = new Float32Array(particlesCount * 3);
    const speedArray = new Float32Array(particlesCount);

    for(let i = 0; i < particlesCount; i++) {
        const r = Math.random() * 0.6;
        const theta = Math.random() * Math.PI * 2;
        posArray[i * 3] = r * Math.cos(theta);
        posArray[i * 3 + 1] = -1.4 + Math.random() * 2.0;
        posArray[i * 3 + 2] = r * Math.sin(theta);
        speedArray[i] = 0.02 + Math.random() * 0.05;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speedArray, 1));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.25, // 大きめのドット
        map: dotTexture,
        transparent: true,
        alphaTest: 0.5,
        sizeAttenuation: true
    });

    const bubbles = new THREE.Points(particlesGeo, particlesMat);
    canGroup.add(bubbles);
    bubblesRef.current = bubbles;

    if (audioAnalyser) {
        dataArrayRef.current = new Uint8Array(audioAnalyser.frequencyBinCount);
    }

    // --- ANIMATION LOOP ---
    const animate = () => {
      if (!mountRef.current) return;
      const time = Date.now() * 0.001;

      // Audio Data
      let kick = 0;
      if (isPlaying && audioAnalyser) {
          audioAnalyser.getByteFrequencyData(dataArrayRef.current);
          let bassSum = 0;
          for (let i = 0; i < 10; i++) bassSum += dataArrayRef.current[i];
          kick = (bassSum / 10) / 255;
      }
      const effectiveKick = Math.max(0, (kick - 0.3) * 1.5);

      // 1. Liquid Bounce (Cartoon physics)
      if (liquidRef.current) {
          const targetScale = 1.0 + effectiveKick * 0.8;
          liquidRef.current.scale.y += (targetScale - liquidRef.current.scale.y) * 0.2;
      }

      // 2. Bubbles
      const positions = bubbles.geometry.attributes.position.array;
      const speeds = bubbles.geometry.attributes.aSpeed.array;
      
      for(let i = 0; i < particlesCount; i++) {
          let y = positions[i * 3 + 1];
          y += speeds[i] * (isPlaying ? 2.0 : 1.0) + (effectiveKick * 0.1);
          
          if (y > 1.2) {
              y = -1.4;
              const r = Math.random() * 0.6;
              const theta = Math.random() * Math.PI * 2;
              positions[i * 3] = r * Math.cos(theta);
              positions[i * 3 + 2] = r * Math.sin(theta);
          }
          positions[i * 3 + 1] = y;
      }
      bubbles.geometry.attributes.position.needsUpdate = true;

      // 3. Can Motion
      canGroup.rotation.y += 0.005;
      // 傾きを少し大げさにしてイラストっぽく
      canGroup.rotation.z = Math.sin(time * 2) * 0.05 + (effectiveKick * 0.1); 
      canGroup.position.y = Math.sin(time * 1.5) * 0.1;

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      liquidGeo.dispose(); liquidMat.dispose();
      shellGeo.dispose(); shellMat.dispose();
      topRimGeo.dispose(); bottomRimGeo.dispose();
      particlesGeo.dispose(); particlesMat.dispose();
    };
  }, [currentSong, isPlaying, audioAnalyser]);

  return <div ref={mountRef} className="w-full h-full" />;
};


// -----------------------------------------------------------------------------
// MAIN UI
// -----------------------------------------------------------------------------

const PopVectorPlayer = ({ onClose }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isNumunumuMode } = useNumunumu();
  const numuText = 'ぬむぬむとんかつ';
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const [analyser, setAnalyser] = useState(null);

  const rawSong = SONGS[currentSongIndex];
  const currentSong = useMemo(() => isNumunumuMode ? {
      ...rawSong,
      title: numuText,
      genre: numuText,
      flavor: numuText
  } : rawSong, [isNumunumuMode, rawSong]);

  const initAudio = () => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;

        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserRef.current = analyserNode;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyserNode);
        analyserNode.connect(ctx.destination);
        setAnalyser(analyserNode);
    } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        initAudio();
        audioRef.current.play().catch(e => console.error(e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) audioRef.current.play();
  }, [currentSongIndex]);

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
    >
      <audio 
          ref={audioRef} 
          src={currentSong.src} 
          onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => setDuration(audioRef.current.duration)}
          onEnded={() => setIsPlaying(false)}
      />

      {/* MAIN CONTAINER: Brutalist / Neo-Pop Style */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-4xl bg-white border-4 border-black shadow-[8px_8px_0px_#000] md:shadow-[16px_16px_0px_#000] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-12 flex flex-col md:flex-row gap-6 md:gap-12 items-center">
        <button onClick={onClose} className="absolute top-2 right-2 z-20 p-2 text-black bg-white/50 rounded-full hover:bg-black hover:text-white transition-colors">
            <X size={24} />
        </button>
        
        {/* LEFT: 3D VIEWPORT */}
        <div className="relative w-full sm:w-2/3 md:w-5/12 aspect-video sm:aspect-square md:aspect-[3/4] border-4 border-black rounded-2xl overflow-hidden bg-white">
             {/* Background Pattern inside viewport */}
             <div className="absolute inset-0 opacity-10" 
                  style={{ backgroundImage: `linear-gradient(135deg, ${currentSong.color} 25%, transparent 25%, transparent 50%, ${currentSong.color} 50%, ${currentSong.color} 75%, transparent 75%, transparent)`, backgroundSize: '20px 20px' }}>
             </div>
             
             <div className="absolute inset-0 z-10">
                <VectorSodaCan 
                    isPlaying={isPlaying} 
                    currentSong={currentSong} 
                    audioAnalyser={analyser} 
                />
             </div>

             {/* STICKER LABEL */}
             <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white border-2 border-black px-2 py-0.5 sm:px-3 sm:py-1 transform -rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest leading-none">{currentSong.flavor}</span>
             </div>
        </div>

        {/* RIGHT: UI CONTROLS */}
        <div className="w-full md:w-7/12 flex flex-col justify-between h-full space-y-3 sm:space-y-4 md:space-y-8">
            
            {/* TEXT INFO */}
            <div className="space-y-1 sm:space-y-2 text-center md:text-left">
                <div className="inline-block bg-black text-white px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2 transform -rotate-1">
                    Now Playing
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter uppercase stroke-text break-words">
                    {currentSong.title}
                </h1>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-400 font-mono border-b-4 border-black inline-block pb-1">
                    {currentSong.genre}
                </p>
            </div>

            {/* PROGRESS BAR (Rectangular, Thick Borders) */}
            <div 
                className="w-full h-8 border-4 border-black bg-gray-100 relative cursor-pointer group"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const newTime = (x / rect.width) * duration;
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                }}
            >
                <div 
                    className="h-full bg-black relative transition-all duration-100 ease-linear"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                    {/* Stripes in progress */}
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
                </div>
                {/* Time Display */}
                <div className="absolute top-8 left-0 flex justify-between w-full text-xs font-mono font-bold pt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* BUTTONS */}
            <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button onClick={handlePrev} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-4 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-lg">
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                </button>

                <button 
                    onClick={togglePlay} 
                    className={`flex-1 h-12 sm:h-16 md:h-20 border-4 border-black ${currentSong.bgAccent} flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all rounded-xl text-black`}
                >
                    {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} /> : <Play className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />}
                    <span className="font-black text-lg sm:text-xl md:text-2xl tracking-widest italic">{isPlaying ? "PAUSE" : "PLAY"}</span>
                </button>

                <button onClick={handleNext} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-4 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-lg">
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                </button>
            </div>

        </div>

      </motion.div>
    </motion.div>
  );
};

export default PopVectorPlayer;