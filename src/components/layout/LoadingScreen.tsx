'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

/* ─── crown sparkle effect ─── */
function Sparkle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
      style={{ left: '50%', top: '50%' }}
      animate={{
        x: [0, x],
        y: [0, y],
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 0.3,
    angle: i * 45,
    distance: 60 + Math.random() * 30,
  }));

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            backgroundColor: '#F5F5F5',
            backgroundImage: "url('/images/bg-pattern.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          <div className="relative">
            {/* sparkles around logo */}
            {sparkles.map((s, i) => (
              <Sparkle key={i} {...s} />
            ))}

            {/* glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(193,33,38,0.3) 0%, transparent 60%)',
                transform: 'scale(2)',
              }}
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1.8, 2.2, 1.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* logo */}
            <motion.div
              className="relative w-36 h-36 sm:w-44 sm:h-44"
              initial={{ scale: 0.3, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src="/images/logo.png"
                alt="Mahkota Taiwan"
                width={176}
                height={176}
                priority
                className="relative z-10 drop-shadow-[0_0_40px_rgba(193,33,38,0.4)]"
              />
            </motion.div>
          </div>

          {/* loading bar */}
          <motion.div
            className="mt-8 h-[3px] rounded-full overflow-hidden bg-navy/10"
            style={{ width: 160 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #C12126, #FACC15, #C12126)',
                backgroundSize: '200% 100%',
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%', backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ width: { duration: 2.8, ease: 'easeInOut' }, backgroundPosition: { duration: 1.5, repeat: Infinity } }}
            />
          </motion.div>

          <motion.p
            className="mt-4 text-[11px] uppercase tracking-[0.3em] text-navy/60 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading Website
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
