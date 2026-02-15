import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Sparkles, HelpCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNumunumu } from '../NumunumuContext';
import { THEME } from '../constants';

const TIPS_LIST = [
  <>道に迷ったら、まずは深呼吸！<br/>ブラウザの「戻る」ボタンを押して、トップページに戻ろう！</>,
  <>ぬむぬむとんかつって、<br/>実は元々ただの落書きなんだよね・・・</>,
  <span className="text-lg font-bold">狂ってるサーバー、<br/>バーサーバー。</span>,
  <span className="text-lg font-bold">関西のサイト、<br/>関サイト。</span>,
  <>404エラー！<br/>でも焦らないで。下のボタンで安全に帰還できます。マジで。</>,
  <>相互バナーを掘り出すための壁<br/>どうやら少し脆いらしい・・・<br/>削りすぎると壊れちゃうかも？</>
];

const NotFoundPage = () => {
  const canvasRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [randomTip, setRandomTip] = useState(TIPS_LIST[0]);
  const [isHovering, setIsHovering] = useState(false);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const navigate = useNavigate();
  const { isNumunumuMode } = useNumunumu();
  const numuText = 'ぬむぬむとんかつ';

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let timeoutId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const fontSize = 24;
    const columns = Math.ceil(canvas.width / fontSize);
    // 初期位置を画面全体にランダムに分散させる（0行目から画面最下部の行まで）
    const drops = new Array(columns).fill(0).map(() => Math.random() * (canvas.height / fontSize));
    
    const charGroups = isNumunumuMode 
      ? ["ぬむぬむ", "とんかつ", "ぬむぬむ"] 
      : ["おさがしの", "ぺーじは", "ありません"];
    const getRandomChar = (colIndex) => {
      const groupIndex = Math.min(Math.floor((colIndex / columns) * 3), 2);
      const targetChars = charGroups[groupIndex];
      return targetChars[Math.floor(Math.random() * targetChars.length)];
    };

    // 各列の現在の文字を保持する配列を作成
    const currentChars = new Array(columns).fill('').map((_, i) => getRandomChar(i));
    // 最後に文字を変更した行を保持する配列
    const lastSwitchRow = new Array(columns).fill(0);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 前のフレームを完全に消去して一文字だけを表示する

      ctx.fillStyle = '#000000';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const currentRow = Math.floor(drops[i]);

        // 文字を切り替える間隔（グリッド数）: この数値を変更してください
        const switchInterval = 6;
        if (currentRow - lastSwitchRow[i] >= switchInterval) {
          currentChars[i] = getRandomChar(i);
          lastSwitchRow[i] = currentRow;
        }

        const text = currentChars[i];
        ctx.fillText(text, i * fontSize, currentRow * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          lastSwitchRow[i] = 0;
          // リセット時のみ新しい文字を抽選
          currentChars[i] = getRandomChar(i);
        }
        drops[i] += 0.092;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    timeoutId = setTimeout(() => {
      setIsCanvasVisible(true);
      draw();
    }, 900);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [mounted, isNumunumuMode]);

  useEffect(() => {
    setMounted(true);
    setRandomTip(TIPS_LIST[Math.floor(Math.random() * TIPS_LIST.length)]);
    const handleMouseMove = (e) => {
      // 正規化 (-1 to 1)
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className="relative w-full h-screen overflow-hidden text-black font-mono selection:bg-yellow-400 selection:text-black"
      style={{ backgroundColor: THEME.bgBase }}
    >
      {/* Font & Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap');
        
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        .pattern-dot {
          background-image: radial-gradient(#000 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        
        .hard-shadow {
          box-shadow: 6px 6px 0px 0px #000;
        }
        .hard-shadow-sm {
          box-shadow: 4px 4px 0px 0px #000;
        }
        .text-stroke {
          -webkit-text-stroke: 2px black;
        }
      `}</style>

      {/* Background Matrix Effect */}
      <canvas ref={canvasRef} className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-[3000ms] ${isCanvasVisible ? 'opacity-10' : 'opacity-0'}`} />

      {/* Floating Pop Shapes (Parallax) */}
      <motion.div 
        className="absolute top-10 right-[10%] w-20 h-20 md:w-32 md:h-32 bg-[#FF0080] rounded-full border-4 border-black z-0 mix-blend-multiply opacity-80"
        animate={{ x: mousePosition.x * -20, y: mousePosition.y * -20 }}
      />
      <motion.div 
        className="absolute bottom-[20%] left-[5%] w-16 h-16 md:w-24 md:h-24 bg-[#00E0FF] rotate-12 border-4 border-black z-0 mix-blend-multiply opacity-80"
        animate={{ x: mousePosition.x * 30, y: mousePosition.y * 30, rotate: 12 + mousePosition.x * 10 }}
      />

      {/* 2. Main Content */}
      <div className="relative z-20 w-full h-full flex flex-col justify-center items-center px-4 md:px-6 text-center">
        
        {/* Badge */}
        <motion.div 
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full hard-shadow-sm mb-6 flex items-center gap-2 transform -rotate-3"
        >
          <Zap size={16} fill="black" />
          <span className="font-bold tracking-tight text-sm">{isNumunumuMode ? numuText : 'OOPS! SYSTEM ERROR'}</span>
        </motion.div>

        {/* Pop Art 404 Typography - Distorted Interactive Version */}
        <div 
          className="relative mb-8 md:mb-10 cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Cyan Layer - 逆方向に大きく歪む */}
          <motion.h1 
            className="absolute top-0 left-0 text-[35vw] md:text-[25vw] leading-[0.8] font-syne font-extrabold text-[#00E0FF] select-none z-0"
            animate={{ 
              x: isHovering ? mousePosition.x * 50 : mousePosition.x * 30, 
              y: isHovering ? mousePosition.y * 50 : mousePosition.y * 30,
              skewX: isHovering ? mousePosition.x * 40 : mousePosition.x * 20, // 横方向の歪み
              rotate: isHovering ? mousePosition.x * -10 : mousePosition.x * -5, // わずかな回転
              color: ["#00E0FF", "#00FF99", "#FFFF00", "#FF0099", "#00E0FF"]
            }}
            transition={{ 
              default: { type: "spring", stiffness: 150, damping: 15 },
              color: { duration: 42, repeat: Infinity, ease: "linear" }
            }}
            style={{ WebkitTextStroke: '3px black' }}
          >
            404
          </motion.h1>
          
          {/* Magenta Layer - 順方向に大きく歪む */}
          <motion.h1 
            className="absolute top-0 left-0 text-[35vw] md:text-[25vw] leading-[0.8] font-syne font-extrabold text-[#FF0080] select-none z-10 mix-blend-multiply"
            animate={{ 
              x: isHovering ? mousePosition.x * -50 : mousePosition.x * -30, 
              y: isHovering ? mousePosition.y * -50 : mousePosition.y * -30,
              skewX: isHovering ? mousePosition.x * -40 : mousePosition.x * -20,
              rotate: isHovering ? mousePosition.x * 10 : mousePosition.x * 5,
              color: ["#FF0080", "#8000FF", "#0080FF", "#FF8000", "#FF0080"]
            }}
            transition={{ 
              default: { type: "spring", stiffness: 150, damping: 15 },
              color: { duration: 42, repeat: Infinity, ease: "linear" }
            }}
            style={{ WebkitTextStroke: '3px black' }}
          >
            404
          </motion.h1>
          
          {/* Main White Layer - 中心に留まりつつ、伸縮する */}
          <motion.h1 
            className="relative text-[35vw] md:text-[25vw] leading-[0.8] font-syne font-extrabold text-white select-none z-20 drop-shadow-2xl"
            animate={{ 
              x: isHovering ? mousePosition.x * 10 : mousePosition.x * 5,
              y: isHovering ? mousePosition.y * 10 : mousePosition.y * 5,
              skewX: isHovering ? mousePosition.x * 10 : mousePosition.x * 5,
              scaleY: 1 + Math.abs(mousePosition.y) * (isHovering ? 0.4 : 0.2), // マウスが上下に動くと文字が縦に伸びる
              scaleX: 1 - Math.abs(mousePosition.y) * (isHovering ? 0.1 : 0.05), // 少し横に縮む（ストレッチ感）
            }}
            transition={{ 
              default: { type: "spring", stiffness: 200, damping: 20 }
            }}
            style={{ WebkitTextStroke: '4px black' }}
          >
            404
          </motion.h1>
        </div>

        {/* Message */}
        <div className="relative z-30 w-full max-w-lg mx-auto mt-8 md:mt-0">
          <div className="bg-white border-4 border-black p-4 md:p-6 hard-shadow rotate-1 transform transition-transform hover:rotate-0 mx-2 md:mx-0">
            <h2 className="font-syne text-2xl md:text-3xl font-bold mb-2">
              {isNumunumuMode ? numuText : <>おっと・・・<br/>ここにページはないみたい</>}
            </h2>
            <p className="font-mono text-sm text-gray-600 mb-6">
              {isNumunumuMode ? numuText : <>探しているデータは、デジタルの彼方へ<br/>飛んでいってしまったようです。</>}
            </p>

            {/* Pop Button */}
            <motion.button 
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05, boxShadow: "8px 8px 0px 0px #000" }}
              whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #000", x: 4, y: 4 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF0080] border-4 border-black text-white font-bold text-lg hard-shadow-sm transition-all"
            >
              <ArrowLeft size={24} strokeWidth={3} />
              {isNumunumuMode ? numuText : 'RETURN HOME'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3. Tips Section (Floating Card) */}
      <AnimatePresence>
        {showTips && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-40 w-auto md:w-80"
          >
            <div className="relative bg-[#00E0FF] border-4 border-black p-4 hard-shadow">
              {/* Close Button */}
              <button 
                onClick={() => setShowTips(false)}
                className="absolute -top-3 -right-3 bg-white border-2 border-black w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors hard-shadow-sm rounded-full"
              >
                <X size={16} strokeWidth={3} />
              </button>

              <div className="flex items-start gap-3">
                <div className="bg-white border-2 border-black p-2 rounded-full shrink-0">
                  <HelpCircle size={24} className="text-black" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg leading-tight mb-1">{isNumunumuMode ? numuText : 'Explorer Tips'}</h3>
                  <p className="font-mono text-xs md:text-sm leading-relaxed bg-white/50 p-2 border-2 border-black/10 rounded">
                    {isNumunumuMode ? numuText : randomTip}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotFoundPage;