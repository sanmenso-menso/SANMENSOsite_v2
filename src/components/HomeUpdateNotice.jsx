import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap } from 'lucide-react';

const HomeUpdateNotice = ({ onOpenWorks, reduceMotion = false }) => (
  <motion.button
    type="button"
    data-home-update-notice
    aria-label="アップデートしたヨ！ WORKSページをチェック"
    onClick={onOpenWorks}
    initial={reduceMotion ? false : { opacity: 0, x: 80, rotate: 4 }}
    animate={{ opacity: 1, x: 0, rotate: -1 }}
    whileHover={reduceMotion ? undefined : { scale: 1.03, rotate: 0, boxShadow: '8px 8px 0 #000' }}
    whileTap={reduceMotion ? undefined : { x: 4, y: 4, boxShadow: '0 0 0 #000' }}
    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 150, damping: 16 }}
    className="absolute right-4 top-24 z-40 max-w-[calc(100vw-2rem)] cursor-pointer border-4 border-black bg-[#00E0FF] px-4 py-3 text-left shadow-[6px_6px_0_#000] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#FF0080] sm:right-6 sm:top-6 md:right-8 md:top-8"
  >
    <p className="flex items-center gap-3 whitespace-nowrap font-sans text-base font-black tracking-tight sm:text-lg">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white" aria-hidden="true">
        <Zap size={18} strokeWidth={3} fill="black" />
      </span>
      <span>アップデートしたヨ！</span>
    </p>
    <span className="mt-2 flex items-center justify-end gap-1 border-t-2 border-black pt-2 font-mono text-xs font-bold sm:text-sm">
      WORKSページをチェック
      <ArrowUpRight size={16} strokeWidth={3} aria-hidden="true" />
    </span>
  </motion.button>
);

export default HomeUpdateNotice;
