'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Image src="/images/logo.png" alt="Mahkota Taiwan" width={80} height={80} priority />
          </motion.div>
          <motion.div
            className="mt-6 h-[2px] bg-red rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
