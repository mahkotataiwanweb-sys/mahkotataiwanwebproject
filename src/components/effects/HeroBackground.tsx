'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * HeroBackground — shared animated background for all page hero sections.
 * Renders: grid overlay, decorative blurred circles, floating sparkles, vertical accent line.
 * Place inside a `position: relative; overflow: hidden` parent with a navy/dark background.
 */
export default function HeroBackground() {
  return (
    <>
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#C12126]/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#FAEDD3]/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C12126]/8 blur-[80px]" />

      {/* Floating sparkle elements */}
      <motion.div
        className="pointer-events-none absolute top-20 right-[15%] text-[#FAEDD3]/10"
        animate={{ y: [0, -15, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="h-8 w-8" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute bottom-16 left-[20%] text-[#FAEDD3]/8"
        animate={{ y: [0, 12, 0], rotate: [0, -90, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute top-1/2 right-[8%] text-[#C12126]/15"
        animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <Sparkles className="h-5 w-5" />
      </motion.div>

      {/* Animated vertical accent line */}
      <motion.div
        className="absolute right-12 top-16 bottom-16 hidden w-px bg-gradient-to-b from-transparent via-[#FAEDD3]/15 to-transparent lg:block"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
        style={{ transformOrigin: 'top' }}
      />
    </>
  );
}
