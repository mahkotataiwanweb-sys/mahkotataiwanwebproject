'use client';

import { motion } from 'framer-motion';

/**
 * FloatingLanterns — decorative red Chinese lanterns rising from the
 * bottom of a section toward the top, with a slow sway and a soft glow.
 * Designed to sit absolutely inside a `position: relative` parent. The
 * lanterns hug the left and right gutters so they never overlap the
 * section's main content.
 *
 * Each lantern carries the character 冠 (Mandarin for "crown" — the
 * literal translation of "Mahkota"), tying the decoration back to the
 * brand identity.
 */

interface LanternProps {
  delay: number;
  duration: number;
  startBottom: number; // % — staggers lanterns vertically inside the column
  drift: number; // horizontal sway amplitude in px
  scale: number;
}

function Lantern({ delay, duration, startBottom, drift, scale }: LanternProps) {
  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ width: 64 * scale, bottom: `${startBottom}%`, willChange: 'transform, opacity' }}
      initial={{ y: 120, opacity: 0 }}
      animate={{
        y: [-20, -260, -440],
        opacity: [0, 1, 0.95, 0],
        x: [-drift, drift, -drift],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.15, 0.85, 1],
        x: { duration: duration / 2, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
      }}
      aria-hidden
    >
      <svg viewBox="0 0 80 110" className="block w-full h-auto drop-shadow-[0_0_18px_rgba(255,140,80,0.55)]">
        <defs>
          <radialGradient id={`lanternBody-${delay}-${scale}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FF7B3A" />
            <stop offset="40%" stopColor="#E03A30" />
            <stop offset="100%" stopColor="#9B1818" />
          </radialGradient>
          <linearGradient id={`lanternRim-${delay}-${scale}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a4a10" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#7a4a10" />
          </linearGradient>
          <linearGradient id={`tassel-${delay}-${scale}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#b87a08" />
          </linearGradient>
        </defs>

        {/* String to ceiling */}
        <line x1="40" y1="0" x2="40" y2="8" stroke="#3a2308" strokeWidth="0.6" />
        {/* Top rim */}
        <rect x="22" y="8" width="36" height="6" rx="1" fill={`url(#lanternRim-${delay}-${scale})`} />
        <ellipse cx="40" cy="11" rx="20" ry="3" fill="#1a0c03" opacity="0.4" />

        {/* Main body */}
        <ellipse cx="40" cy="48" rx="32" ry="34" fill={`url(#lanternBody-${delay}-${scale})`} />

        {/* Vertical bands for depth */}
        <path d="M 12 48 Q 40 30 68 48" fill="none" stroke="#5e0d0d" strokeWidth="0.4" opacity="0.4" />
        <path d="M 12 48 Q 40 66 68 48" fill="none" stroke="#5e0d0d" strokeWidth="0.4" opacity="0.4" />
        <path d="M 40 14 Q 30 48 40 82" fill="none" stroke="#5e0d0d" strokeWidth="0.3" opacity="0.35" />
        <path d="M 40 14 Q 50 48 40 82" fill="none" stroke="#5e0d0d" strokeWidth="0.3" opacity="0.35" />

        {/* Inner glow highlight */}
        <ellipse cx="32" cy="38" rx="9" ry="14" fill="rgba(255,220,140,0.45)" />

        {/* Brand character (冠 = crown / mahkota) */}
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

        {/* Bottom rim */}
        <rect x="22" y="80" width="36" height="6" rx="1" fill={`url(#lanternRim-${delay}-${scale})`} />
        {/* Tassel cord + knot */}
        <line x1="40" y1="86" x2="40" y2="92" stroke="#7a4a10" strokeWidth="0.7" />
        <circle cx="40" cy="93" r="2" fill="#facc15" />
        {/* Tassel strands */}
        <path
          d="M 36 93 L 34 108 M 40 93 L 40 110 M 44 93 L 46 108 M 38 93 L 37 109 M 42 93 L 43 109"
          stroke={`url(#tassel-${delay}-${scale})`}
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
      {/* LEFT column */}
      <div className="absolute left-2 sm:left-6 md:left-10 top-0 bottom-0 w-16 sm:w-20 md:w-24">
        <Lantern delay={0}    duration={14} startBottom={-10} drift={6}  scale={1.0} />
        <Lantern delay={4.5}  duration={16} startBottom={-15} drift={5}  scale={0.85} />
        <Lantern delay={9}    duration={15} startBottom={-12} drift={7}  scale={0.95} />
      </div>

      {/* RIGHT column — offset so the columns don't sync */}
      <div className="absolute right-2 sm:right-6 md:right-10 top-0 bottom-0 w-16 sm:w-20 md:w-24">
        <Lantern delay={2}    duration={15} startBottom={-12} drift={6}  scale={0.95} />
        <Lantern delay={6.5}  duration={14} startBottom={-10} drift={5}  scale={1.05} />
        <Lantern delay={11}   duration={16} startBottom={-15} drift={7}  scale={0.9} />
      </div>
    </div>
  );
}
