'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';

/**
 * Floating "selamat pagi/siang/malam" banner that straddles the seam between
 * the Hero slider and the Product Showcase section. Two firework bursts at
 * the bottom-left + bottom-right corners of the hero extend down into the
 * top corners of the showcase. Greeting follows Taiwan local time (UTC+8).
 */

type Period = 'pagi' | 'siang' | 'sore' | 'malam';

function getTaiwanPeriod(date = new Date()): Period {
  // Taiwan is UTC+8, no DST. Compute the hour in Taipei time.
  const utcHour = date.getUTCHours();
  const utcMin = date.getUTCMinutes();
  const taipeiMinutes = (utcHour * 60 + utcMin + 8 * 60) % (24 * 60);
  const hour = Math.floor(taipeiMinutes / 60);
  if (hour >= 5 && hour < 11) return 'pagi';
  if (hour >= 11 && hour < 15) return 'siang';
  if (hour >= 15 && hour < 18) return 'sore';
  return 'malam';
}

function greetingForLocale(period: Period, locale: string): string {
  if (locale === 'id') {
    return period === 'pagi'
      ? 'Selamat Pagi'
      : period === 'siang'
        ? 'Selamat Siang'
        : period === 'sore'
          ? 'Selamat Sore'
          : 'Selamat Malam';
  }
  if (locale === 'zh-TW') {
    return period === 'pagi' ? '早安' : period === 'siang' ? '午安' : period === 'sore' ? '下午好' : '晚安';
  }
  // English (always serve along with the Indonesian original below)
  return period === 'pagi'
    ? 'Good Morning'
    : period === 'siang'
      ? 'Good Afternoon'
      : period === 'sore'
        ? 'Good Evening'
        : 'Good Night';
}

/* ------------------------------------------------------------------ */
/*  Firework — repeating burst of yellow/red sparks from a single point */
/* ------------------------------------------------------------------ */
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
  // Tinted toward red on one side, yellow on the other; both palettes share.
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
      {/* Central pop flash */}
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

/* ------------------------------------------------------------------ */
/*  Public wrapper — absolutely positioned between Hero and Showcase    */
/* ------------------------------------------------------------------ */
export default function HeroFireworksBanner() {
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>(() => getTaiwanPeriod());

  // Re-evaluate the greeting every minute so it crosses the
  // morning/afternoon/evening/night boundaries automatically.
  useEffect(() => {
    const id = setInterval(() => setPeriod(getTaiwanPeriod()), 60_000);
    return () => clearInterval(id);
  }, []);

  const text = greetingForLocale(period, locale);

  return (
    <div
      className="pointer-events-none relative w-full"
      style={{ height: 0 }}
      aria-hidden
    >
      {/* The decoration band: 280 px tall, vertically centred on the seam.
          Top half overlays the bottom of the hero, bottom half overlays the
          top of the product-showcase section that follows. */}
      <div className="absolute left-0 right-0 -translate-y-1/2 h-[280px] z-30 overflow-visible">
        {/* Fireworks — bottom-left + bottom-right of hero,
            top-left + top-right of showcase together via 2 instances per side */}
        <Firework origin={{ x: '6%',  y: '32%' }} side="left"  delay={0} />
        <Firework origin={{ x: '10%', y: '72%' }} side="left"  delay={0.8} />
        <Firework origin={{ x: '94%', y: '32%' }} side="right" delay={0.4} />
        <Firework origin={{ x: '90%', y: '72%' }} side="right" delay={1.2} />

        {/* Greeting pill — sits in the middle, half over the hero, half over
            the next section. Navy background + white text. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={period}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
              className="relative px-7 py-3 sm:px-9 sm:py-3.5 rounded-full font-heading font-bold text-base sm:text-xl tracking-wide bg-gradient-to-br from-[#003048] via-[#003048] to-[#001E2E] text-white shadow-[0_18px_40px_-12px_rgba(0,48,72,0.45),0_0_0_1px_rgba(250,204,21,0.18)]"
            >
              {/* Yellow ring outline */}
              <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-yellow-400/60" />
              <span className="relative z-10">{text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
