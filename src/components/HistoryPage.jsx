import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';

const HistoryPage = ({ onClose }) => {
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
                        {isNumunumuMode ? numuText : 'HISTORY'}
                    </h2>
                    
                    <div className="space-y-10 font-mono text-lg md:text-3xl leading-relaxed text-left">
                        {isNumunumuMode ? <p>{numuText}</p> : (
                            <p className="font-bold">2022: 三日月タロウとして活動開始<br/>↓<br/>2024: 三面相に改名<br/><br/>CDs所属</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
        , document.body
    );
};

export default HistoryPage;