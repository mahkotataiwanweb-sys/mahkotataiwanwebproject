'use client';

import { motion } from 'framer-motion';

/**
 * FloatingLanterns — decorative red Chinese lanterns drifting up beside
 * the Taiwan map. They appear from the middle-bottom of the section
 * (never below the map's lower edge), rise gently a short distance, and
 * fade out before reaching the map's top edge.
 *
 * Two lanterns per side, horizontally offset within the column so they
 * never overlap, and on independent delays so the left/right columns
 * never sync.
 *
 * Each lantern carries 冠 (Mandarin for "crown" / the literal
 * translation of "Mahkota"), tying the decoration to the brand.
 */

interface LanternProps {
  id: string;
  delay: number;
  duration: number;
  /** Starting vertical position from the section bottom, in %.
      Stays within the lower half so the lantern never goes below the
      Taiwan map. */
  bottomPct: number;
  /** Horizontal offset within the column (-100 to +100), so two lanterns
      in the same column never stack on the same path. */
  xOffset: number;
  /** Sway amplitude in px (horizontal breeze). */
  sway: number;
  scale: number;
}

function Lantern({ id, delay, duration, bottomPct, xOffset, sway, scale }: LanternProps) {
  const width = 56 * scale;
  return (
    <motion.div
      className="absolute"
      style={{
        width,
        left: `calc(50% + ${xOffset}px - ${width / 2}px)`,
        bottom: `${bottomPct}%`,
        willChange: 'transform, opacity',
      }}
      initial={{ y: 30, opacity: 0 }}
      animate={{
        y: [30, 0, -180, -240],
        opacity: [0, 1, 0.9, 0],
        x: [-sway, sway, -sway],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.18, 0.85, 1],
        x: { duration: duration / 2, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
      }}
      aria-hidden
    >
      <svg viewBox="0 0 80 110" className="block w-full h-auto drop-shadow-[0_0_16px_rgba(255,140,80,0.5)]">
        <defs>
          <radialGradient id={`lanternBody-${id}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FF7B3A" />
            <stop offset="40%" stopColor="#E03A30" />
            <stop offset="100%" stopColor="#9B1818" />
          </radialGradient>
          <linearGradient id={`lanternRim-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a4a10" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#7a4a10" />
          </linearGradient>
          <linearGradient id={`tassel-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#b87a08" />
          </linearGradient>
        </defs>

        <line x1="40" y1="0" x2="40" y2="8" stroke="#3a2308" strokeWidth="0.6" />
        <rect x="22" y="8" width="36" height="6" rx="1" fill={`url(#lanternRim-${id})`} />
        <ellipse cx="40" cy="11" rx="20" ry="3" fill="#1a0c03" opacity="0.4" />

        <ellipse cx="40" cy="48" rx="32" ry="34" fill={`url(#lanternBody-${id})`} />

        <path d="M 12 48 Q 40 30 68 48" fill="none" stroke="#5e0d0d" strokeWidth="0.4" opacity="0.4" />
        <path d="M 12 48 Q 40 66 68 48" fill="none" stroke="#5e0d0d" strokeWidth="0.4" opacity="0.4" />
        <path d="M 40 14 Q 30 48 40 82" fill="none" stroke="#5e0d0d" strokeWidth="0.3" opacity="0.35" />
        <path d="M 40 14 Q 50 48 40 82" fill="none" stroke="#5e0d0d" strokeWidth="0.3" opacity="0.35" />

        <ellipse cx="32" cy="38" rx="9" ry="14" fill="rgba(255,220,140,0.45)" />

        <text
          x="40"
          y="56"
          textAnchor="middle"
          fontFamily="'Noto Serif TC', 'Songti TC', 'PingFang TC', serif"
          fontWeight="700"
          fontSize="22"
          fill="#FFE8C2"
          stroke="#5e0d0d"
          strokeWidth="0.6"
          style={{ paintOrder: 'stroke' }}
        >
          冠
        </text>

        <rect x="22" y="80" width="36" height="6" rx="1" fill={`url(#lanternRim-${id})`} />
        <line x1="40" y1="86" x2="40" y2="92" stroke="#7a4a10" strokeWidth="0.7" />
        <circle cx="40" cy="93" r="2" fill="#facc15" />
        <path
          d="M 36 93 L 34 108 M 40 93 L 40 110 M 44 93 L 46 108 M 38 93 L 37 109 M 42 93 L 43 109"
          stroke={`url(#tassel-${id})`}
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

export default function FloatingLanterns() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* LEFT column — 2 lanterns, offset horizontally so they pass side
          by side instead of stacking on the same vertical path. */}
      <div className="absolute left-2 sm:left-6 md:left-12 top-0 bottom-0 w-20 sm:w-28 md:w-32">
        <Lantern id="L1" delay={0}   duration={13} bottomPct={18} xOffset={-14} sway={4} scale={1.0} />
        <Lantern id="L2" delay={5.5} duration={14} bottomPct={28} xOffset={ 16} sway={5} scale={0.85} />
      </div>

      {/* RIGHT column — same idea, opposite gutter, different delays so
          left/right never feel synced. */}
      <div className="absolute right-2 sm:right-6 md:right-12 top-0 bottom-0 w-20 sm:w-28 md:w-32">
        <Lantern id="R1" delay={2.5} duration={14} bottomPct={22} xOffset={ 14} sway={5} scale={0.95} />
        <Lantern id="R2" delay={8}   duration={13} bottomPct={32} xOffset={-16} sway={4} scale={0.9} />
      </div>
    </div>
  );
}
