import { createContext, useContext } from 'react';

export const NumunumuContext = createContext({
    isNumunumuMode: false,
});

export const useNumunumu = () => useContext(NumunumuContext);
