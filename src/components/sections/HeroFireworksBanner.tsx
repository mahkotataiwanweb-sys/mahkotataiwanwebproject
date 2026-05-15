'use client';

import { motion } from 'framer-motion';

/**
 * Decorative firework bursts that straddle the seam between the Hero slider
 * and the next section. Two bursts on each bottom corner — top half overlays
 * the bottom of the hero, bottom half overlays the top of the next section.
 */

function Firework({
  origin,
  delay = 0,
  side,
}: {
  origin: { x: string; y: string };
  delay?: number;
  side: 'left' | 'right';
}) {
  const SPARK_COUNT = 14;
  const palette = side === 'left'
    ? ['#facc15', '#fde047', '#fff', '#C12126']
    : ['#facc15', '#fbbf24', '#fff', '#C12126'];

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: origin.x, top: origin.y, transform: 'translate(-50%, -50%)' }}
      aria-hidden
    >
      {Array.from({ length: SPARK_COUNT }).map((_, i) => {
        const angle = (i / SPARK_COUNT) * Math.PI * 2;
        const distance = 60 + (i % 3) * 18;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const color = palette[i % palette.length];
        return (
          <motion.span
            key={i}
            className="absolute block rounded-full"
            style={{
              left: 0,
              top: 0,
              width: 6,
              height: 6,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}, 0 0 18px ${color}`,
            }}
            animate={{
              x: [0, dx],
              y: [0, dy, dy + 30],
              opacity: [0, 1, 0],
              scale: [0.4, 1, 0.2],
            }}
            transition={{
              duration: 1.6,
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 1.4,
              delay: delay + (i / SPARK_COUNT) * 0.05,
            }}
          />
        );
      })}
      <motion.span
        className="absolute block rounded-full"
        style={{
          left: 0,
          top: 0,
          width: 14,
          height: 14,
          backgroundColor: '#facc15',
          filter: 'blur(2px)',
          boxShadow: '0 0 22px #facc15, 0 0 40px #C12126',
        }}
        animate={{ scale: [0, 1.4, 0], opacity: [0, 0.95, 0] }}
        transition={{ duration: 0.7, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.3, delay }}
      />
    </div>
  );
}

export default function HeroFireworksBanner() {
  return (
    <div
      className="pointer-events-none relative w-full"
      style={{ height: 0 }}
      aria-hidden
    >
      <div className="absolute left-0 right-0 -translate-y-1/2 h-[280px] z-30 overflow-visible">
        <Firework origin={{ x: '6%',  y: '32%' }} side="left"  delay={0} />
        <Firework origin={{ x: '10%', y: '72%' }} side="left"  delay={0.8} />
        <Firework origin={{ x: '94%', y: '32%' }} side="right" delay={0.4} />
        <Firework origin={{ x: '90%', y: '72%' }} side="right" delay={1.2} />
      </div>
    </div>
  );
}
