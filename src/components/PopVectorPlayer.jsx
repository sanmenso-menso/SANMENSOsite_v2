import { motion, useReducedMotion } from 'framer-motion';
import React, { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
const VectorSodaCan = lazy(() => import('./VectorSodaCan'));
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { SONGS } from '../constants';
import { NUMUNUMU_TEXT, useNumunumu } from '../NumunumuContext';

// -----------------------------------------------------------------------------
// CONSTANTS & ASSETS
// -----------------------------------------------------------------------------

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// -----------------------------------------------------------------------------
// VECTOR STYLE 3D COMPONENT
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// MAIN UI
// -----------------------------------------------------------------------------

const PopVectorPlayer = ({ onClose }) => {
  const shouldReduceMotion = useReducedMotion();
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isNumunumuMode } = useNumunumu();
  const numuText = NUMUNUMU_TEXT;
  
  const audioRef = useRef(null);
  const playRequestRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const [analyser, setAnalyser] = useState(null);

  const rawSong = SONGS[currentSongIndex];
  const currentSong = useMemo(() => isNumunumuMode ? {
      ...rawSong,
      title: numuText,
      genre: numuText,
      flavor: numuText
  } : rawSong, [isNumunumuMode, numuText, rawSong]);

  const initAudio = async () => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Web Audio API is not supported');
        const ctx = new AudioContext();
        try {
          const analyserNode = ctx.createAnalyser();
          analyserNode.fftSize = 256;
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyserNode);
          analyserNode.connect(ctx.destination);
          audioContextRef.current = ctx;
          analyserRef.current = analyserNode;
          mediaSourceRef.current = source;
          setAnalyser(analyserNode);
        } catch (error) {
          void ctx.close().catch(() => {});
          throw error;
        }
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
    if (audioContextRef.current.state === 'closed') {
        throw new Error('AudioContext is closed');
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    const request = ++playRequestRef.current;
    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        try {
          const audio = audioRef.current;
          if (!audio.getAttribute('src')) { audio.src = rawSong.src; audio.load(); }
          await initAudio();
          if (request !== playRequestRef.current) return;
          await audio.play();
          if (request === playRequestRef.current) setIsPlaying(true);
        } catch (error) {
          console.error('Audio playback failed:', error);
          if (request === playRequestRef.current) setIsPlaying(false);
        }
    }
  };

  const handleNext = () => {
    playRequestRef.current += 1;
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
  };

  const handlePrev = () => {
    playRequestRef.current += 1;
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
  };

  const handleClose = () => {
    playRequestRef.current += 1;
    audioRef.current?.pause();
    setIsPlaying(false);
    onClose();
  };

  useEffect(() => {
    const audio = audioRef.current;
    audio?.pause();
    audio?.removeAttribute('src');
    audio?.load();
    setCurrentTime(0);
    setDuration(0);
  }, [currentSongIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
    playRequestRef.current += 1;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    mediaSourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    mediaSourceRef.current = null;
    analyserRef.current = null;
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch(() => {});
    }
    };
  }, []);

  return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
    >
      <audio 
          ref={audioRef} 
          preload="none"
          onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0)}
          onDurationChange={() => setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
      />

      {/* MAIN CONTAINER: Brutalist / Neo-Pop Style */}
      <motion.div 
        initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="relative z-10 w-full max-w-4xl bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.3)] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-12 flex flex-col md:flex-row gap-6 md:gap-12 items-center">
        <button type="button" data-dialog-close aria-label="ドリンクバーを閉じる" onClick={handleClose} className="absolute top-2 right-2 z-20 p-2 text-black bg-white/50 rounded-full hover:bg-black hover:text-white transition-colors">
            <X size={24} />
        </button>
        
        {/* LEFT: 3D VIEWPORT */}
        <div className="relative w-full sm:w-2/3 md:w-5/12 aspect-video sm:aspect-square md:aspect-[3/4] border-4 border-black rounded-2xl overflow-hidden bg-white">
             {/* Background Pattern inside viewport */}
             <div className="absolute inset-0 opacity-10" 
                  style={{ backgroundImage: `linear-gradient(135deg, ${currentSong.color} 25%, transparent 25%, transparent 50%, ${currentSong.color} 50%, ${currentSong.color} 75%, transparent 75%, transparent)`, backgroundSize: '20px 20px' }}>
             </div>
             
             <div className="absolute inset-0 z-10">
                <Suspense fallback={null}>
                <VectorSodaCan 
                    isPlaying={isPlaying} 
                    currentSong={currentSong} 
                    audioAnalyser={analyser} 
                />
                </Suspense>
             </div>

             {/* STICKER LABEL */}
             <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white border-2 border-black px-2 py-0.5 sm:px-3 sm:py-1 transform -rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] flex items-center justify-center">
                <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest leading-none">{currentSong.flavor}</span>
             </div>
        </div>

        {/* RIGHT: UI CONTROLS */}
        <div className="w-full md:w-7/12 flex flex-col justify-between h-full space-y-3 sm:space-y-4 md:space-y-8">
            
            {/* TEXT INFO */}
            <div className="space-y-1 sm:space-y-2 text-center md:text-left">
                <div className="inline-block bg-black text-white px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2 transform -rotate-1">
                    {isNumunumuMode ? numuText : 'Now Playing'}
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter uppercase stroke-text break-words">
                    {currentSong.title}
                </h1>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-400 font-mono border-b-4 border-black inline-block pb-1">
                    {currentSong.genre}
                </p>
            </div>

            {/* PROGRESS BAR (Rectangular, Thick Borders) */}
            <div className="w-full h-8 border-4 border-black bg-gray-100 relative cursor-pointer group">
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={Math.min(currentTime, duration || 0)}
                    disabled={!duration}
                    aria-label="再生位置"
                    aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                    onChange={(event) => {
                        const newTime = Number(event.target.value);
                        if (!audioRef.current) return;
                        audioRef.current.currentTime = newTime;
                        setCurrentTime(newTime);
                    }}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div 
                    className="h-full bg-black relative transition-all duration-100 ease-linear"
                    style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                >
                    {/* Stripes in progress */}
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
                </div>
                {/* Time Display */}
                <div className="absolute top-8 left-0 flex justify-between w-full text-xs font-mono font-bold pt-1">
                    <span>{isNumunumuMode ? numuText : formatTime(currentTime)}</span>
                    <span>{isNumunumuMode ? numuText : formatTime(duration)}</span>
                </div>
            </div>

            {/* BUTTONS */}
            <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button type="button" aria-label="前の曲" onClick={handlePrev} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-4 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-lg">
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                </button>

                <button 
                    type="button"
                    onClick={togglePlay} 
                    className={`flex-1 h-12 sm:h-16 md:h-20 border-4 border-black ${currentSong.bgAccent} flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all rounded-xl text-black`}
                >
                    {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} /> : <Play className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />}
                    <span className="font-black text-lg sm:text-xl md:text-2xl tracking-widest italic">
                      {isNumunumuMode ? numuText : isPlaying ? 'PAUSE' : 'PLAY'}
                    </span>
                </button>

                <button type="button" aria-label="次の曲" onClick={handleNext} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-4 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-lg">
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                </button>
            </div>

        </div>

      </motion.div>
    </motion.div>
  );
};

export default PopVectorPlayer;
