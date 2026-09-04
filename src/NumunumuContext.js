import { createContext, useContext } from 'react';

export const NUMUNUMU_TEXT = 'ぬむぬむとんかつ';
export const NUMUNUMU_SHORT_TEXT = 'ぬむ';
export const NUMUNUMU_IMAGE = '/images/numunumu_icon.webp';

export const NumunumuContext = createContext({
    isNumunumuMode: false,
});

export const useNumunumu = () => useContext(NumunumuContext);
