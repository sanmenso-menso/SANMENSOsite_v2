import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';
import { motion, AnimatePresence } from 'framer-motion';
import ContactHeader from '../components/ContactHeader';

const ContactPage = () => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';
    const [isHovered, setIsHovered] = useState(false);

    const spinningText = "LET'S HAVE FUN TOGETHER ";

    return (
        <>
            <ContactHeader />
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center overflow-hidden">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&display=swap');
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin 20s linear infinite;
                }
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-spin-slow-reverse {
                    animation: spin-reverse 20s linear infinite;
                }
                @keyframes wobble-and-slide {
                    0%, 100% {
                        transform: scaleX(1);
                        font-variation-settings: 'wght' 500;
                    }
                    50% {
                        transform: scaleX(3.0);
                        font-variation-settings: 'wght' 900;
                    }
                }
                `}
            </style>
            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_#000]">
                <h2 className="text-4xl md:text-6xl font-black font-sans mb-6">{isNumunumuMode ? numuText : 'CONTACT'}</h2>
                <p className="font-serif font-bold text-base md:text-lg mb-6">{isNumunumuMode ? numuText : 'お仕事のご依頼やお問い合わせは、'}<br/>{isNumunumuMode ? '' : '以下のメールアドレスまでご連絡ください。'}</p>
                
                <div 
                    className="relative mb-8"
                    onMouseEnter={() => !isNumunumuMode && setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <a href={isNumunumuMode ? '#' : "mailto:sanmensoworks@gmail.com"} className="relative z-10 inline-flex items-center gap-2 md:gap-3 bg-[#FFD700] text-black px-6 py-3 md:px-8 md:py-4 font-bold text-lg md:text-xl hover:bg-black hover:text-[#FFD700] hover:-translate-y-1 transition-all border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                        <Mail size={24} />
                        {isNumunumuMode ? numuText : 'sanmensoworks@gmail.com'}
                    </a>

                    <AnimatePresence>
                        {isHovered && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {/* Circle 1 (Original) */}
                                <SpinningCircle initialRadius="420px" finalRadius="210px" animationClass="animate-spin-slow" text={spinningText} delay={0} />
                                {/* Circle 2 (Medium, Reverse) */}
                                <SpinningCircle initialRadius="580px" finalRadius="290px" animationClass="animate-spin-slow-reverse" text={spinningText} delay={0.15} />
                                {/* Circle 3 (Large, Normal) */}
                                <SpinningCircle initialRadius="740px" finalRadius="370px" animationClass="animate-spin-slow" text={spinningText} delay={0.3} />

                                <motion.p
                                    className="absolute top-full mt-4 text-sm font-serif font-bold bg-white p-2 border-2 border-black shadow-md"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: 0.5, ease: "easeOut" } }}
                                    exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                                >
                                    楽曲制作や出演のブッキング等、<br/>なんでもご相談ください！
                                </motion.p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            </div>
        </>
    );
};

const SpinningCircle = ({ initialRadius, finalRadius, animationClass, text, delay }) => {
    const initialDiameter = `calc(${initialRadius} * 2)`;
    const finalDiameter = `calc(${finalRadius} * 2)`;

    return (
        <motion.div
            className={`absolute ${animationClass}`}
            style={{
                width: 'var(--diameter)',
                height: 'var(--diameter)',
            }}
            initial={{
                opacity: 0,
                '--diameter': initialDiameter,
                '--radius': initialRadius,
            }}
            animate={{
                opacity: 1,
                '--diameter': finalDiameter,
                '--radius': finalRadius,
                transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
            }}
            exit={{
                opacity: 0,
                transition: { duration: 0.2 }
            }}
        >
            {text.split('').map((char, i) => (
                <span /* Positioning wrapper */
                    key={i}
                    className="absolute left-1/2 top-0"
                    style={{
                        transform: `rotate(${i * (360 / text.length)}deg)`,
                        transformOrigin: `0 var(--radius)`,
                    }}
                >
                    <span /* Animation target */
                        className="inline-block text-xl font-bold"
                        style={{
                            fontFamily: "'Recursive', sans-serif",
                            animation: `wobble-and-slide 2.5s ease-in-out infinite`,
                            animationDelay: `${(text.length - 1 - i) * 0.06}s`,
                            transformOrigin: 'left center'
                        }}
                    >
                        {char}
                    </span>
                </span>
            ))}
        </motion.div>
    );
};

export default ContactPage;