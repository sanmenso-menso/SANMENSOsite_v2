import React from 'react';

const CubeFace = ({ text, color }) => {
    return (
        <div 
            className="w-full h-full flex items-center justify-center select-none pointer-events-none p-2"
            style={{ backgroundColor: color || 'white' }}
        >
            <h2 
                className="font-black tracking-tighter text-center text-black uppercase"
                // clamp() を使用して、画面サイズに応じて滑らかにフォントサイズを調整します。
                // clamp(最小値, 推奨値, 最大値)
                style={{
                    fontSize: 'clamp(1.8rem, 12vmin, 3.8rem)',
                    lineHeight: '1',
                }}
            >
                {text}
            </h2>
        </div>
    );
};

export default CubeFace;