import React from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { SOCIAL_LINKS } from '../constants';
import { useNumunumu } from '../NumunumuContext';

const ContactPage = () => {
    const { isNumunumuMode } = useNumunumu();
    const numuText = 'ぬむぬむとんかつ';

    const numuSocialLinks = SOCIAL_LINKS.map(link => ({ ...link, name: numuText }));
    const finalSocialLinks = isNumunumuMode ? numuSocialLinks : SOCIAL_LINKS;

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000]">
                <h2 className="text-4xl md:text-6xl font-black font-sans mb-6">{isNumunumuMode ? numuText : 'CONTACT'}</h2>
                <p className="font-serif font-bold text-lg mb-6">{isNumunumuMode ? numuText : 'お仕事のご依頼やお問い合わせは、'}<br/>{isNumunumuMode ? '' : '以下のメールアドレスまでご連絡ください。'}</p>
                
                <div className="mb-8">
                    <a href={isNumunumuMode ? '#' : "mailto:sanmensoworks@gmail.com"} className="inline-flex items-center gap-3 bg-[#FFD700] text-black px-8 py-4 font-bold text-xl hover:bg-black hover:text-[#FFD700] hover:-translate-y-1 transition-all border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                        <Mail size={24} />
                        {isNumunumuMode ? numuText : 'sanmensoworks@gmail.com'}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;