import React from 'react';
import { Home, Tag, Globe, Send, Gamepad2 } from 'lucide-react';
import { useNumunumu } from '../NumunumuContext';

const NavigationDock = ({ activePage, onNavigate, isOpening }) => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const items = [
        { id: 'home', label: 'HOME', icon: Home },
        { id: 'works', label: 'WORKS', icon: Tag },
        { id: 'contents', label: 'CONTENTS', icon: Gamepad2 },
        { id: 'links', label: 'LINKS', icon: Globe },
        { id: 'contact', label: 'CONTACT', icon: Send },

    ];

    // isOpeningのアニメーションを単純なスタイルで代替
    const openingStyle = {
        transform: isOpening ? 'translateY(100px)' : 'translateY(0)',
        opacity: isOpening ? 0 : 1,
        transition: isOpening 
            ? 'transform 0.8s 2.2s, opacity 0.8s 2.2s' 
            : 'transform 0.8s 0s, opacity 0.8s 0s',
    };

    return (
        <div 
            style={openingStyle}
            className="fixed bottom-4 md:bottom-8 left-0 z-50 w-full flex justify-center pointer-events-none"
        >
            <div className="bg-[#121212]/90 backdrop-blur-md text-white rounded-full px-2 py-1 md:px-4 md:py-2 flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/10 pointer-events-auto">
                {items.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                        <button key={item.id} onClick={() => onNavigate(item.id)} className="relative w-14 md:w-28 px-2 py-2 md:px-6 md:py-3 group flex flex-col items-center justify-center">
                            {isActive && <div className="absolute inset-0 bg-white/10 rounded-full" />}
                            <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-[#FFD700]' : 'text-white group-hover:text-[#FFD700]'}`}>
                                <span className="hidden md:inline text-xs font-bold tracking-widest">{isNumunumuMode ? numuText : item.label}</span>
                                <item.icon className="md:hidden" size={20} />
                            </span>
                            {isActive && <div className="absolute bottom-1 md:bottom-2 w-1 h-1 bg-[#FFD700] rounded-full" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default NavigationDock;