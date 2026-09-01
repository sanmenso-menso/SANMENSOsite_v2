import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';
import AccessibleDialog from './AccessibleDialog';

const AboutPage = ({ onClose }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    return (
        <AccessibleDialog
            onClose={onClose}
            labelledBy="about-dialog-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-8"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:border-4 md:border-black p-8 md:p-20 overflow-y-auto shadow-none md:shadow-[16px_16px_0px_rgba(0,0,0,1)]"
            >
                <button 
                    type="button"
                    onClick={onClose}
                    aria-label="プロフィールを閉じる"
                    data-dialog-close
                    className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-black hover:text-white transition-colors rounded-full z-10"
                >
                    <X size={32} />
                </button>
                
                <div className="max-w-7xl mx-auto w-full min-h-full flex flex-col justify-center">
                    <h2 id="about-dialog-title" className="text-5xl md:text-8xl font-black mb-8 md:mb-12 border-b-4 md:border-b-8 border-black inline-block tracking-tighter">
                        {isNumunumuMode ? numuText : 'WHO?'}
                    </h2>
                    
                    <div className="space-y-6 md:space-y-10 font-bold text-lg md:text-3xl leading-relaxed font-sans text-left">
                        {isNumunumuMode ? (
                            <p>{numuText}</p>
                        ) : (
                            <>
                                <p>2005年生まれ、大阪在住。</p>
                                <p>音と映像とインターネットのあいだで、楽しいものをつくる「楽し師」。</p>
                                <p>音楽を軸に、映像やデザイン、その他いろいろ。異なる世界の音や物を混ぜ、つなぎ、コラージュしながら、実験的だけどポップな作品をつくっている。</p>
                                <p>気持ちいいタイミングと、ユーモアを大切にしている。</p>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AccessibleDialog>
    );
};

export default AboutPage;
