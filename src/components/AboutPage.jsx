import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';

const AboutPage = ({ onClose }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return ReactDOM.createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-8"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:border-4 md:border-black p-8 md:p-20 overflow-y-auto shadow-none md:shadow-[16px_16px_0px_rgba(0,0,0,1)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-black hover:text-white transition-colors rounded-full z-10"
                >
                    <X size={32} />
                </button>
                
                <div className="max-w-7xl mx-auto w-full min-h-full flex flex-col justify-center">
                    <h2 className="text-5xl md:text-8xl font-black mb-8 md:mb-12 border-b-4 md:border-b-8 border-black inline-block tracking-tighter">
                        {isNumunumuMode ? numuText : 'WHO?'}
                    </h2>
                    
                    <div className="space-y-6 md:space-y-10 font-bold text-lg md:text-3xl leading-relaxed font-sans text-left">
                        {isNumunumuMode ? (
                            <p>{numuText}</p>
                        ) : (
                            <>
                                <p>2005年生まれ、大阪在住。</p>
                                <p>インターネットの片隅で、コラージュを軸に音楽やビジュアルなどのコンテンツを制作し活動している。</p>
                                <p>『楽し師』を名乗り、面白さで世界の境界線を破壊・再構築し、実験的かつ親しみのある作品世界を目指す。</p>
                                <p className="text-gray-500 text-sm md:text-xl mt-8 pt-8 border-t-2 border-gray-200">制作デスクにはいつもスルメ</p>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
        , document.body
    );
};

export default AboutPage;