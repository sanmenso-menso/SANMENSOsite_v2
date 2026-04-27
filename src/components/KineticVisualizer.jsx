import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import './KineticVisualizer.css';
import { KINETIC_VISUALIZER_SONGS } from '../constants';

// --- Popcorn Physics System ---
// 物理パラメータ
const gravity = 0.8; // 重力（下に落ちる力）
const friction = 0.98; // 空気抵抗・摩擦
const floorBounce = 0.6; // 床に落ちたときの弾み具合

const KineticVisualizer = ({ onClose }) => {
  // 再生する曲の状態管理
  const [song, setSong] = useState(KINETIC_VISUALIZER_SONGS.find(s => s.id === 1) || KINETIC_VISUALIZER_SONGS[0]);
  const [statusText, setStatusText] = useState('Initializing...');
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // isPlaying の最新値を requestAnimationFrame ループ内で参照するための ref
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const meterBassRef = useRef(null);
  const meterMidRef = useRef(null);
  const meterTrebleRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameIdRef = useRef(null);
  const isRunningRef = useRef(false);

  // Make charRadius responsive to window size
  const getCharRadius = useCallback(() => (window.innerWidth < 768 ? 30 : 50), []);
  const [charRadius, setCharRadius] = useState(getCharRadius());

  // 物理演算ループ
  const updatePhysics = useCallback((bassVal) => {
    const particles = particlesRef.current;
    if (!particles.length) return;

    const boundsY = window.innerHeight / 2 - charRadius;
    const floorY = window.innerHeight / 2 - 20 - charRadius;

    // Dynamic box dimensions
    const boxHeight = window.innerWidth < 768 ? 200 : 250;
    const boxTopY = floorY - (boxHeight * 0.8);
    const boxHalfWidth = (Math.min(window.innerWidth * 0.9, 600) / 2) - charRadius;

    // 1. 力の適用と位置更新
    particles.forEach(p => {
      p.vy += gravity * p.mass;

      if (bassVal > 0.55 && p.y > boxTopY) {
        if (Math.random() > 0.6) {
          // 低音の反応を少し抑え、ポップの高さを調整します。
          p.vy = -(20 + Math.random() * 50 * bassVal);
          p.vx = (Math.random() - 0.5) * 25;
          p.vr = (Math.random() - 0.5) * 20;
          p.isPopping = true;
          setTimeout(() => { p.isPopping = false; }, 300);
        }
      }

      p.vx *= friction;
      p.vy *= friction;
      p.vr *= 0.99;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;

      let currentBoundX = window.innerWidth / 2 - charRadius;
      if (p.y > boxTopY - 400) {
        const progress = Math.max(0, Math.min(1, (p.y - (boxTopY - 400)) / 400));
        currentBoundX = (window.innerWidth / 2 - charRadius) - ((window.innerWidth / 2 - charRadius) - boxHalfWidth) * progress;
      }

      if (p.x < -currentBoundX) { p.x = -currentBoundX; p.vx = Math.abs(p.vx) * 0.5 + (p.y < boxTopY ? 2 : 0); }
      if (p.x > currentBoundX) { p.x = currentBoundX; p.vx = -Math.abs(p.vx) * 0.5 - (p.y < boxTopY ? 2 : 0); }
      if (p.y < -boundsY) { p.y = -boundsY; p.vy *= -0.5; }
      if (p.y > floorY) { p.y = floorY; p.vy *= -floorBounce; p.vx *= 0.8; p.vr *= 0.8; }
    });

    // 2. パーティクル同士の衝突判定
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        let p1 = particles[i];
        let p2 = particles[j];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0) {
          let overlap = minDist - dist;
          let nx = dx / dist;
          let ny = dy / dist;
          let totalMass = p1.mass + p2.mass;
          let m1Ratio = p2.mass / totalMass;
          let m2Ratio = p1.mass / totalMass;

          p1.x -= nx * overlap * m1Ratio;
          p1.y -= ny * overlap * m1Ratio;
          p2.x += nx * overlap * m2Ratio;
          p2.y += ny * overlap * m2Ratio;

          let kx = (p1.vx - p2.vx);
          let ky = (p1.vy - p2.vy);
          let restitution = 0.5;
          let impact = 2.0 * (nx * kx + ny * ky) / totalMass;

          p1.vx = (p1.vx - impact * p2.mass * nx) * restitution;
          p1.vy = (p1.vy - impact * p2.mass * ny) * restitution;
          p2.vx = (p2.vx + impact * p1.mass * nx) * restitution;
          p2.vy = (p2.vy + impact * p1.mass * ny) * restitution;

          p1.vr += (Math.random() - 0.5) * impact * 0.5;
          p2.vr += (Math.random() - 0.5) * impact * 0.5;
        }
      }
    }

    // 3. DOMへ描画反映
    particles.forEach(p => {
      const popScale = p.isPopping ? 1.3 : 1;
      p.el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) rotate(${p.rotation}deg) scale(${popScale})`;
    });
  }, [charRadius]);

  // パーティクルの初期化
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const floorY = window.innerHeight / 2 - 20 - charRadius;

    // Dynamic box dimensions for initialization
    const boxHeight = window.innerWidth < 768 ? 200 : 250;
    const boxTopY = floorY - (boxHeight * 0.8);
    const boxHalfWidth = (Math.min(window.innerWidth * 0.9, 600) / 2) - charRadius;

    const textString = song.text || "POP!CORN!";
    const chars = textString.split('');
    particlesRef.current = chars.map((char, index) => {
      const el = document.createElement('div');
      el.className = 'particle-char';
      el.innerText = char;
      stage.appendChild(el);

      return {
        el: el,
        char: char,
        x: (Math.random() - 0.5) * boxHalfWidth * 1.8, // 箱の幅に合わせてランダムに配置
        y: boxTopY + Math.random() * (boxHeight * 0.7), // 箱の中にランダムに配置
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5, // 初期速度も少しランダムに
        vr: (Math.random() - 0.5) * 20,
        rotation: Math.random() * 360,
        radius: charRadius,
        mass: 1 + Math.random() * 0.5,
        index: index,
        isPopping: false
      };
    });

    // 新しく生成されたパーティクルの初期位置をDOMに即時反映させる
    updatePhysics(0);

    // コンポーネントのアンマウント時にDOM要素をクリーンアップ
    return () => {
      particlesRef.current.forEach(p => p.el.remove());
      particlesRef.current = [];
    };
  }, [charRadius, song, updatePhysics]);

  // オーディオ処理と描画ループ
  const renderFrame = useCallback(() => {
    if (!isRunningRef.current) return;
    animationFrameIdRef.current = requestAnimationFrame(renderFrame);

    let bassVal = 0, midVal = 0, trebleVal = 0;

    if (isPlayingRef.current) { // isPlaying state の代わりに ref を参照する
      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const getAverageVolume = (array, startIndex, endIndex) => {
        let sum = 0;
        for (let i = startIndex; i < endIndex; i++) sum += array[i];
        return sum / (endIndex - startIndex);
      };

      const bassAvg = getAverageVolume(dataArray, 0, 5) / 255;
      const midAvg = getAverageVolume(dataArray, 5, 40) / 255;
      const trebleAvg = getAverageVolume(dataArray, 40, 100) / 255;

      bassVal = Math.pow(bassAvg, 2.0);
      midVal = Math.pow(midAvg, 1.2);
      trebleVal = Math.pow(trebleAvg, 2.0);
    }

    if (rootRef.current) {
      rootRef.current.style.setProperty('--audio-bass', bassVal);
      rootRef.current.style.setProperty('--audio-mid', midVal);
      rootRef.current.style.setProperty('--audio-treble', trebleVal);
    }
    if (meterBassRef.current) meterBassRef.current.style.height = `${bassVal * 100}%`;
    if (meterMidRef.current) meterMidRef.current.style.height = `${midVal * 100}%`;
    if (meterTrebleRef.current) meterTrebleRef.current.style.height = `${trebleVal * 100}%`;

    // 物理演算は常に実行し、ポーズ中は bassVal が 0 になる
    updatePhysics(bassVal);
  }, [updatePhysics]);

  // オーディオの初期化と再生
  const loadAudio = async (songToLoad) => {
    if (isLoading) return;

    setIsLoading(true);
    setStatusText('Loading audio...');

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;

      const response = await fetch(songToLoad.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      source.connect(analyser);
      analyser.connect(audioContext.destination);

      source.start(0);
      // 初期状態は一時停止
      audioContext.suspend();

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      isRunningRef.current = true;
      setIsLoading(false);
      setIsAudioActive(true); // オーディオは準備完了
      setStatusText('Ready to POP!'); // ステータス変更

      renderFrame();
    } catch (err) {
      console.error('Error loading or playing audio:', err);
      setStatusText('Audio Error');
      setIsLoading(false);
    }
  };

  // 再生/一時停止のトグル関数
  const togglePlayPause = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (isPlaying) {
      audioContext.suspend();
      setStatusText('Paused');
    } else {
      audioContext.resume();
      setStatusText('Popping!');
    }
    setIsPlaying(!isPlaying);
  };

  // 曲を変更するハンドラ
  const handleSongChange = (newSong) => {
    if (newSong.id === song.id || isLoading) return;

    // 現在のオーディオを停止・クリーンアップ
    if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch (e) { /* Can only be called once */ }
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    isRunningRef.current = false;
    if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
    }

    // 状態をリセットして新しい曲を設定
    setIsAudioActive(false);
    setIsPlaying(false);
    setSong(newSong);

    // 新しい曲を自動的にロード
    loadAudio(newSong);
  };

  // イベントリスナーとクリーンアップ
  useEffect(() => {
    // 初回マウント時にデフォルトの曲をロード
    loadAudio(song);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setCharRadius(getCharRadius()); // Update radius on resize
      if (!particlesRef.current) return;
      particlesRef.current.forEach(p => {
        if (p.y > window.innerHeight / 2) {
          p.y = window.innerHeight / 2 - p.radius;
        }
      });
    };

    window.addEventListener('resize', handleResize);

    // 物理演算を初期描画のために一度だけ呼び出す
    updatePhysics(0);

    return () => {
      window.removeEventListener('resize', handleResize);
      isRunningRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch (e) {
          // AudioBufferSourceNode.stop() can only be called once.
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [updatePhysics, getCharRadius]);

  // フレーバーカラーを適用
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.style.setProperty('--accent-red', song.flavor);
    }
  }, [song]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="visualizer-container fixed inset-0 z-[60]"
      ref={rootRef}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-[200] p-2 text-white bg-black/50 rounded-full hover:bg-white hover:text-black transition-colors">
          <X size={32} />
      </button>

      <svg className="noise-overlay">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0.2" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"></rect>
      </svg>

      <div className="controls">
        <div className="song-info">
          <h2 className="song-title">{song.title}</h2>
          <p className="song-genre">{song.genre}</p>
        </div>

        <div className="song-selector">
          {KINETIC_VISUALIZER_SONGS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSongChange(s)}
              className={`song-button ${song.id === s.id ? 'active' : ''}`}
              disabled={isLoading}
              title={`Play ${s.title} (${s.genre})`}
            >
              {s.genre}
            </button>
          ))}
        </div>

        {isLoading && <button disabled>Loading...</button>}
        {!isLoading && isAudioActive && (
          <button onClick={togglePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
        <div className={`status ${isAudioActive ? 'active' : ''}`}>
          <div className="status-indicator"></div>
          <span style={{ color: statusText === 'Audio Error' ? 'red' : isPlaying ? 'var(--accent-red)' : '#888' }}>
            {statusText}
          </span>
        </div>
      </div>

      <div id="stage" ref={stageRef}></div>

      <div className="popcorn-box-container">
        <div className="popcorn-box-front">
          <div className="box-label">POP!</div>
        </div>
      </div>

      <div className="meters">
        <div className="meter-bar" title="Heat (Bass)">
          <div className="meter-fill" ref={meterBassRef} style={{ background: 'var(--accent-red)' }}></div>
        </div>
        <div className="meter-bar" title="Pop (Mid)">
          <div className="meter-fill" ref={meterMidRef}></div>
        </div>
        <div className="meter-bar" title="Sizzle (Treble)">
          <div className="meter-fill" ref={meterTrebleRef} style={{ background: 'var(--burnt-brown)' }}></div>
        </div>
      </div>
    </motion.div>
  );
};

export default KineticVisualizer;