import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SecretProfileFace = ({ isMobile }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="w-full h-full relative" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} style={{ transformStyle: 'preserve-3d' }}>
            <motion.div className="absolute inset-0 bg-white flex flex-col items-center justify-center select-none border-r-2 border-black origin-left z-20 backface-hidden" animate={{ rotateY: isOpen ? -110 : 0 }} transition={{ type: "spring", stiffness: 60, damping: 12 }} style={{ backfaceVisibility: 'hidden' }}>
                <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full border-4 border-black overflow-hidden mb-2 shadow-md relative group`}>
                    <img src="/images/sanmenso_icon.png" alt="Profile" className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold ${isMobile ? 'text-[10px]' : 'text-xs'} transition-opacity`}>OPEN</div>
                </div>
                <span className={`font-bold ${isMobile ? 'text-[10px]' : 'text-xs'} bg-black text-white px-2 py-1`}>SANMENSO</span>
            </motion.div>
            <div className="absolute inset-0 bg-[#f0f0f0] flex flex-col items-center justify-center select-none z-10 p-4 text-center" style={{ transform: 'translateZ(-2px)' }}>
                <img src="/images/numunumu_icon.png" alt="Numunumu" className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} object-cover rounded-full border-2 border-black mb-2`} />
                <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] transform rotate-2">
                    <p className={`font-serif font-bold ${isMobile ? 'text-[10px]' : 'text-xs'} leading-tight`}>これは<br/><span className="text-red-500">ぬむぬむとんかつ</span><br/>です</p>
                </div>
            </div>
        </div>
    );
};

export default SecretProfileFace;