'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * Decorative twin sailing ships flanking the empty space in the
 * "Find Us" section, with a stylised blue sea wave running underneath.
 *
 *   Left ship  → red hull, yellow sail with the Mahkota Taiwan logo.
 *   Right ship → yellow hull, blue sail with the Indonesian flag and the
 *                Indonesian phrase "Makanan Indonesia".
 *
 * Both ships gently rock + bob to suggest movement on water.
 */
export default function SailingShips() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none"
      aria-hidden
    >
      <div className="relative w-full h-[260px] sm:h-[320px]">
        {/* ── Sea wave layers ────────────────────────────────────────── */}
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 w-full h-[140px] sm:h-[160px]"
        >
          <defs>
            <linearGradient id="seaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"  stopColor="#5BA8D6" />
              <stop offset="55%" stopColor="#1E73B8" />
              <stop offset="100%" stopColor="#0D416E" />
            </linearGradient>
          </defs>
          {/* Back wave — slower */}
          <motion.path
            d="M0,90 C200,40 420,140 720,80 C1020,20 1240,120 1440,70 L1440,160 L0,160 Z"
            fill="#1E73B8"
            opacity="0.4"
            animate={{ x: [0, -40, 0] }}
            transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
          />
          {/* Mid wave */}
          <motion.path
            d="M0,110 C220,70 460,160 720,110 C980,60 1220,150 1440,100 L1440,160 L0,160 Z"
            fill="url(#seaGradient)"
            opacity="0.85"
            animate={{ x: [0, 30, 0] }}
            transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
          />
          {/* Foamy crest line */}
          <motion.path
            d="M0,108 C220,68 460,158 720,108 C980,58 1220,148 1440,98"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.55"
            animate={{ x: [0, 30, 0] }}
            transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
          />
        </svg>

        {/* ── Left ship (red hull + yellow sail + Mahkota logo) ──────── */}
        <motion.div
          className="absolute left-2 sm:left-12 bottom-[70px] sm:bottom-[90px] w-[110px] sm:w-[150px]"
          animate={{ y: [0, -6, 0, -4, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 4.2, ease: 'easeInOut', repeat: Infinity }}
        >
          <ShipLeft />
        </motion.div>

        {/* ── Right ship (yellow hull + blue sail + Indo flag) ───────── */}
        <motion.div
          className="absolute right-2 sm:right-12 bottom-[70px] sm:bottom-[90px] w-[110px] sm:w-[150px]"
          animate={{ y: [0, -5, 0, -7, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 4.6, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
        >
          <ShipRight />
        </motion.div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Left ship — red hull, yellow sail w/ Mahkota Taiwan logo overlay  */
/* ────────────────────────────────────────────────────────────────── */
function ShipLeft() {
  return (
    <div className="relative w-full" style={{ aspectRatio: '5 / 6' }}>
      <svg viewBox="0 0 200 240" className="absolute inset-0 w-full h-full">
        {/* Mast */}
        <line x1="100" y1="40" x2="100" y2="180" stroke="#4a2c1a" strokeWidth="3" />
        {/* Yellow sail (rounded) */}
        <path
          d="M100,40 Q170,90 100,170 Z"
          fill="#facc15"
          stroke="#B8860B"
          strokeWidth="1.5"
        />
        <path
          d="M100,40 Q40,90 100,170 Z"
          fill="#fde047"
          stroke="#B8860B"
          strokeWidth="1.5"
          opacity="0.85"
        />
        {/* Red hull */}
        <path
          d="M30,180 L170,180 L150,215 Q100,232 50,215 Z"
          fill="#C12126"
          stroke="#7a1416"
          strokeWidth="1.5"
        />
        <path d="M30,180 L170,180" stroke="#7a1416" strokeWidth="1" />
        {/* Pennant flag */}
        <path d="M100,38 L130,30 L100,46 Z" fill="#facc15" />
      </svg>

      {/* Mahkota Taiwan logo overlay on the sail */}
      <div className="absolute" style={{ left: '38%', top: '32%', width: '24%' }}>
        <Image
          src="/images/logo.png"
          alt="Mahkota Taiwan"
          width={80}
          height={80}
          className="w-full h-auto drop-shadow-sm"
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Right ship — yellow hull, blue sail w/ Indo flag + label          */
/* ────────────────────────────────────────────────────────────────── */
function ShipRight() {
  return (
    <div className="relative w-full" style={{ aspectRatio: '5 / 6' }}>
      <svg viewBox="0 0 200 240" className="absolute inset-0 w-full h-full">
        {/* Mast */}
        <line x1="100" y1="40" x2="100" y2="180" stroke="#1a2a4a" strokeWidth="3" />
        {/* Blue sail */}
        <path
          d="M100,40 Q170,90 100,170 Z"
          fill="#1E73B8"
          stroke="#0a3a66"
          strokeWidth="1.5"
        />
        <path
          d="M100,40 Q40,90 100,170 Z"
          fill="#2f8acc"
          stroke="#0a3a66"
          strokeWidth="1.5"
          opacity="0.9"
        />
        {/* Yellow hull */}
        <path
          d="M30,180 L170,180 L150,215 Q100,232 50,215 Z"
          fill="#facc15"
          stroke="#a37700"
          strokeWidth="1.5"
        />
        <path d="M30,180 L170,180" stroke="#a37700" strokeWidth="1" />
        {/* Pennant flag — Indonesian colours (red over white) */}
        <g transform="translate(100, 30)">
          <rect x="0" y="0" width="30" height="7" fill="#C12126" />
          <rect x="0" y="7" width="30" height="7" fill="#ffffff" stroke="#0a3a66" strokeWidth="0.5" />
        </g>

        {/* Indonesian flag emblem on the sail */}
        <g transform="translate(80, 92)">
          <rect x="0" y="0" width="40" height="14" fill="#C12126" stroke="#ffffff" strokeWidth="0.8" />
          <rect x="0" y="14" width="40" height="14" fill="#ffffff" stroke="#ffffff" strokeWidth="0.8" />
        </g>

        {/* 'Makanan Indonesia' label below the flag */}
        <text
          x="100"
          y="140"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="700"
          style={{ letterSpacing: '0.05em' }}
        >
          MAKANAN
        </text>
        <text
          x="100"
          y="154"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="700"
          style={{ letterSpacing: '0.05em' }}
        >
          INDONESIA
        </text>
      </svg>
    </div>
  );
}
