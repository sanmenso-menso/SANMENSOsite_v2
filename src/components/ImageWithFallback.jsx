import React, { useState } from 'react';
import { useNumunumu } from '../NumunumuContext';

const ImageWithFallback = ({ src, alt, fallback, ...props }) => {
    const [error, setError] = useState(false);
    const { isNumunumuMode } = useNumunumu();

    const handleError = () => {
        // If numunumu mode is active, don't trigger the fallback,
        // to prevent an infinite loop if the numunumu icon itself is missing.
        if (isNumunumuMode) {
            return;
        }
        setError(true);
    };

    return error ? (
        fallback
    ) : (
        <img src={src} alt={alt} onError={handleError} {...props} />
    );
};

export default ImageWithFallback;
