import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { THEME } from '../constants';

export const BrutalistBreaker = ({ onClose }) => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('menu'); // menu, playing, gameover, win
    const [score, setScore] = useState(0);

    // ゲーム定数
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 16;
    const BALL_SIZE = 12;
    const BRICK_ROW_COUNT = 5;
    const BRICK_COLUMN_COUNT = 8;
    
    // カラーパレット
    const COLORS = [THEME.brandGreen, THEME.accentGold, '#FF6B6B', '#4ECDC4'];

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // ゲーム変数
        let x = canvas.width / 2;
        let y = canvas.height - 30;
        let dx = 4;
        let dy = -4;
        let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
        let particles = [];
        let shake = 0;

        // ブロック初期化
        const bricks = [];
        for(let c=0; c<BRICK_COLUMN_COUNT; c++) {
            bricks[c] = [];
            for(let r=0; r<BRICK_ROW_COUNT; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1, color: COLORS[r % COLORS.length] };
            }
        }
        const brickPadding = 10;
        const brickOffsetTop = 60;
        const brickOffsetLeft = 35;
        const brickWidth = (canvas.width - (brickOffsetLeft * 2) - (brickPadding * BRICK_COLUMN_COUNT)) / BRICK_COLUMN_COUNT + brickPadding;
        const brickHeight = 24;

        // 入力ハンドリング
        let rightPressed = false;
        let leftPressed = false;

        const keyDownHandler = (e) => {
            if(e.key == "Right" || e.key == "ArrowRight") rightPressed = true;
            else if(e.key == "Left" || e.key == "ArrowLeft") leftPressed = true;
        };
        const keyUpHandler = (e) => {
            if(e.key == "Right" || e.key == "ArrowRight") rightPressed = false;
            else if(e.key == "Left" || e.key == "ArrowLeft") leftPressed = false;
        };
        const touchHandler = (e) => {
            const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
            if(relativeX > 0 && relativeX < canvas.width) {
                paddleX = relativeX - PADDLE_WIDTH / 2;
            }
        };
        const mouseMoveHandler = (e) => {
            const relativeX = e.clientX - canvas.getBoundingClientRect().left;
            if(relativeX > 0 && relativeX < canvas.width) {
                paddleX = relativeX - PADDLE_WIDTH / 2;
            }
        }

        window.addEventListener("keydown", keyDownHandler);
        window.addEventListener("keyup", keyUpHandler);
        canvas.addEventListener("touchmove", touchHandler, {passive: false});
        
        if (gameState === 'playing') {
            canvas.addEventListener("mousemove", mouseMoveHandler);
            canvas.style.cursor = 'none';
        } else {
            canvas.style.cursor = 'default';
        }

        // パーティクルクラス
        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.size = Math.random() * 5 + 2;
                this.speedX = Math.random() * 6 - 3;
                this.speedY = Math.random() * 6 - 3;
                this.life = 1.0;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life -= 0.02;
                this.size *= 0.95;
            }
            draw(ctx) {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life;
                ctx.fillRect(this.x, this.y, this.size, this.size);
                ctx.globalAlpha = 1.0;
            }
        }

        const draw = () => {
            // シェイク効果
            ctx.save();
            if (shake > 0) {
                const shakeX = Math.random() * shake - shake/2;
                const shakeY = Math.random() * shake - shake/2;
                ctx.translate(shakeX, shakeY);
                shake *= 0.9;
            }

            // 背景クリア (トレイル効果のために完全には消さない)
            ctx.fillStyle = 'rgba(18, 18, 18, 0.3)';
            ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

            if (gameState !== 'playing') {
                ctx.restore();
                return;
            }

            // ブロック描画
            let activeBricks = 0;
            for(let c=0; c<BRICK_COLUMN_COUNT; c++) {
                for(let r=0; r<BRICK_ROW_COUNT; r++) {
                    if(bricks[c][r].status == 1) {
                        const b = bricks[c][r];
                        const brickX = (c * (brickWidth)) + brickOffsetLeft;
                        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                        b.x = brickX;
                        b.y = brickY;
                        
                        ctx.fillStyle = b.color;
                        ctx.fillRect(brickX, brickY, brickWidth - brickPadding, brickHeight);
                        // 影
                        ctx.fillStyle = "rgba(0,0,0,0.5)";
                        ctx.fillRect(brickX + 4, brickY + 4, brickWidth - brickPadding, brickHeight);
                        activeBricks++;
                    }
                }
            }

            if(activeBricks === 0) {
                setGameState('win');
            }

            // ボール描画 (四角形)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x, y, BALL_SIZE, BALL_SIZE);

            // パドル描画
            ctx.fillStyle = THEME.accentGold;
            ctx.fillRect(paddleX, canvas.height - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
            // パドルの装飾
            ctx.fillStyle = "#000";
            ctx.fillRect(paddleX + 5, canvas.height - PADDLE_HEIGHT - 5, PADDLE_WIDTH - 10, 2);


            // 衝突判定
            // 壁
            if(x + dx > canvas.width-BALL_SIZE || x + dx < 0) dx = -dx;
            if(y + dy < 0) dy = -dy;
            else if(y + dy > canvas.height-BALL_SIZE) {
                if(x > paddleX && x < paddleX + PADDLE_WIDTH) {
                    dy = -dy * 1.05; // ヒットするたびに加速
                    dx = dx * 1.05;
                    shake = 5;
                }
                else {
                    setGameState('gameover');
                }
            }

            // ブロック
            for(let c=0; c<BRICK_COLUMN_COUNT; c++) {
                for(let r=0; r<BRICK_ROW_COUNT; r++) {
                    let b = bricks[c][r];
                    if(b.status == 1) {
                        if(x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                            dy = -dy;
                            b.status = 0;
                            setScore(prev => prev + 100);
                            shake = 10;
                            // パーティクル生成
                            for(let i=0; i<8; i++) {
                                particles.push(new Particle(b.x + brickWidth/2, b.y + brickHeight/2, b.color));
                            }
                        }
                    }
                }
            }

            // パーティクル更新
            for(let i=particles.length-1; i>=0; i--) {
                particles[i].update();
                particles[i].draw(ctx);
                if(particles[i].life <= 0) particles.splice(i, 1);
            }

            // 移動
            if(rightPressed && paddleX < canvas.width-PADDLE_WIDTH) paddleX += 7;
            else if(leftPressed && paddleX > 0) paddleX -= 7;

            x += dx;
            y += dy;

            ctx.restore();
            animationFrameId = requestAnimationFrame(draw);
        };

        if(gameState === 'playing') {
            draw();
        }

        return () => {
            window.removeEventListener("keydown", keyDownHandler);
            window.removeEventListener("keyup", keyUpHandler);
            canvas.removeEventListener("touchmove", touchHandler);
            canvas.removeEventListener("mousemove", mouseMoveHandler);
            cancelAnimationFrame(animationFrameId);
            if (canvas) {
                canvas.style.cursor = 'default';
            }
        };
    }, [gameState]);

    const startGame = () => {
        setScore(0);
        setGameState('playing');
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        >
            <div className="relative bg-[#f2f5f3] p-2 md:p-4 border-4 border-black shadow-[0_0_50px_rgba(255,215,0,0.2)] max-w-4xl w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                    <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter">
                        BRUTAL_BREAKER
                    </h2>
                    <div className="font-mono text-xl font-bold">SCORE: {score.toString().padStart(5, '0')}</div>
                    <button onClick={onClose} className="p-2 hover:bg-black hover:text-white transition-colors">
                        <X size={32} />
                    </button>
                </div>

                {/* Canvas Container */}
                <div className="relative w-full aspect-[4/3] bg-[#121212] border-4 border-black overflow-hidden">
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={600} 
                        className="w-full h-full object-contain"
                    />

                    {/* UI Overlays */}
                    {gameState === 'menu' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                            <h3 className="text-4xl font-black text-[#FFD700] mb-4 animate-pulse">READY?</h3>
                            <button onClick={startGame} className="bg-white text-black px-8 py-3 font-black text-xl hover:bg-[#FFD700] transform hover:-translate-y-1 transition-transform">
                                START GAME
                            </button>
                            <p className="mt-4 font-mono text-sm opacity-60">ARROW KEYS or TOUCH to Move</p>
                        </div>
                    )}
                    
                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 text-white">
                            <h3 className="text-6xl font-black text-white mb-4 tracking-tighter">GAME OVER</h3>
                            <p className="font-mono text-xl mb-6">SCORE: {score}</p>
                            <button onClick={startGame} className="bg-black text-white border-2 border-white px-8 py-3 font-black text-xl hover:bg-[#FFD700] hover:text-black hover:border-black flex items-center gap-2">
                                <RotateCcw /> RETRY
                            </button>
                        </div>
                    )}

                    {gameState === 'win' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFD700]/90 text-black">
                            <h3 className="text-6xl font-black mb-4 tracking-tighter">YOU WIN</h3>
                            <p className="font-black text-2xl mb-6">EXCELLENT WORK</p>
                            <button onClick={startGame} className="bg-black text-white px-8 py-3 font-black text-xl hover:scale-110 transition-transform">
                                PLAY AGAIN
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
