import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const AccessibleDialog = ({
    children,
    onClose,
    ariaLabel = undefined,
    labelledBy = undefined,
    className = '',
    closeOnBackdrop = true,
}) => {
    const dialogRef = useRef(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const appRoot = document.getElementById('root');
        const previousRootInert = appRoot?.inert;
        const previousOverflow = document.body.style.overflow;

        if (appRoot) appRoot.inert = true;
        document.body.style.overflow = 'hidden';

        const focusDialog = window.requestAnimationFrame(() => {
            const preferredTarget = dialogRef.current?.querySelector('[data-dialog-close]');
            const firstFocusable = dialogRef.current?.querySelector(FOCUSABLE_SELECTOR);
            (preferredTarget || firstFocusable || dialogRef.current)?.focus();
        });

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.cancelAnimationFrame(focusDialog);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            if (appRoot) appRoot.inert = previousRootInert;
            if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
                previouslyFocused.focus();
            }
        };
    }, []);

    const handleBackdropClick = (event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onCloseRef.current();
    };

    return createPortal(
        <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={className}
            onMouseDown={handleBackdropClick}
        >
            {children}
        </motion.div>,
        document.body,
    );
};

export default AccessibleDialog;
