import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNumunumu } from '../NumunumuContext';

// 勢いの強いイージングカーブのセット
const strongEasings = [
    [0.8, -0.6, 0.2, 1.4],
    [0.34, 1.56, 0.64, 1],
    [0.6, -0.28, 0.735, 0.045],
    [0.68, -0.55, 0.265, 1.55],
    [0.76, 0, 0.24, 1],
    [0.17, 0.89, 0.32, 1.49],
    // 最終位置に向かって減速するイーズアウトのカーブを追加
    [0.22, 1, 0.36, 1], // 急加速からスムーズに減速
    [0, 0.55, 0.45, 1],   // 円を描くような滑らかな減速
];

const ContactHeader = () => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const textLines = useMemo(() => isNumunumuMode 
        ? [numuText, numuText, numuText] 
        : ["世の中に", "楽しいことを", "もっと"], [isNumunumuMode]);

    // Find the dimensions of our "character grid"
    const GRID_ROWS = textLines.length;
    const GRID_COLS = Math.max(...textLines.map(line => line.length));

    // 各文字のランダムな値を事前に計算してメモ化
    const linesWithCharData = useMemo(() => {
        // 中心からの距離を計算し、外側の要素ほど遅延が小さくなるように設定
        const calculateDelay = (row, col) => {
            const centerRow = (GRID_ROWS - 1) / 2;
            const centerCol = (GRID_COLS - 1) / 2;
            const dist = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
            const maxDist = Math.sqrt(Math.pow(GRID_ROWS / 2, 2) + Math.pow(GRID_COLS / 2, 2));
            // 外側から始まる (maxDist - dist)
            // 0.7秒の範囲で遅延を分散させる
            return ((maxDist - dist) / maxDist) * 0.7;
        };

        return textLines.map((line, lineIndex) => {
            return line.split('').map((char, charIndex) => {
                // 0:top, 1:bottom, 2:left, 3:right の4方向からランダムに登場方向を決定
                const motionType = Math.floor(Math.random() * 4);
                let yInitial = 0;
                let xInitial = 0;
                // 主軸の移動距離（画面外から来る感じを強く）
                const mainAxisOffset = 900 + Math.random() * 600;
                // 副軸の移動距離（少しだけブレさせる）
                const subAxisOffset = (Math.random() - 0.5) * 400;

                switch (motionType) {
                    case 0: // 上から
                        yInitial = -mainAxisOffset;
                        xInitial = subAxisOffset;
                        break;
                    case 1: // 下から
                        yInitial = mainAxisOffset;
                        xInitial = subAxisOffset;
                        break;
                    case 2: // 左から
                        yInitial = subAxisOffset;
                        xInitial = -mainAxisOffset;
                        break;
                    case 3: // 右から
                        yInitial = subAxisOffset;
                        xInitial = mainAxisOffset;
                        break;
                    default:
                        break;
                }

                return {
                    char,
                    custom: {
                        delay: calculateDelay(lineIndex, charIndex),
                        yInitial,
                        xInitial,
                        yScale: 2 + Math.random() * 2,       // 初期の縦方向スケール（少し抑える）
                        xScale: 2 + Math.random() * 2,       // 初期の横方向スケール（少し抑える）
                        finalScale: 1, // 最終的な均一スケールを1に固定
                        ease: strongEasings[Math.floor(Math.random() * strongEasings.length)], // 文字ごとに異なるイージングを適用
                    }
                };
            });
        });
    }, [textLines, GRID_ROWS, GRID_COLS]);

    const charBoxVariants = {
        initial: (custom) => ({
            opacity: 0,
            x: custom.xInitial,
            y: custom.yInitial,
            scaleX: custom.xScale,
            scaleY: custom.yScale,
            fontVariationSettings: "'wght' 300",
        }),
        animate: (custom) => ({
            opacity: [0, 1, 1, 1],
            y: [custom.yInitial, 0, -60, 0], // Yで移動後、ホップする動きを大きく
            x: [custom.xInitial, custom.xInitial, 0, 0],
            scaleY: [custom.yScale, 1, 1, 1], // Y移動と同時にスケールを戻す
            scaleX: [custom.xScale, custom.xScale, 1, 1], // X移動と同時にスケールを戻す
            fontVariationSettings: ["'wght' 300", "'wght' 1000", "'wght' 1000", "'wght' 900"],
            transition: {
                duration: 1.2, // アニメーションをさらに高速化
                delay: 0.1 + custom.delay, // 初期遅延を短縮して、より早く開始
                ease: custom.ease, // 各文字に設定されたカスタムイージングを使用
                // Y移動 -> X移動+ホップ -> 着地 のキーフレームタイミング
                times: [0, 0.5, 0.9, 1.0],
            }
        }),
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-center py-16 sm:py-20 md:py-28 overflow-hidden">
            <motion.div
                className="text-center"
                initial="initial"
                animate="animate"
            >
                {linesWithCharData.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex justify-center" aria-label={textLines[lineIndex]}>
                        {line.map((charData, charIndex) => (
                            <motion.div
                                key={charIndex}
                                className="text-4xl sm:text-5xl md:text-7xl font-black text-black leading-tight tracking-tighter"
                                style={{ fontFamily: "'Recursive', sans-serif" }}
                                variants={charBoxVariants}
                                custom={charData.custom}
                            >
                                {/* The character itself. Using a span to prevent breaking layout and handle spaces. */}
                                <span style={{ display: 'inline-block' }}>
                                    {charData.char === ' ' ? '\u00A0' : charData.char}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default ContactHeader;