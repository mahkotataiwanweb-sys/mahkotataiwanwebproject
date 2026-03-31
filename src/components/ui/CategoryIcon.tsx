'use client';

import React from 'react';

interface CategoryIconProps {
  slug: string;
  size?: number;
  className?: string;
}

/**
 * Professional, hand-crafted category icons for Mahkota Taiwan.
 * Each icon is an inline SVG designed to match the brand identity —
 * clean lines, rounded caps, elegant weight.
 */
export default function CategoryIcon({ slug, size = 20, className = '' }: CategoryIconProps) {
  const strokeWidth = 1.8;
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (slug) {
    /* ── Abon Sapi: Stylized shredded beef on a plate ── */
    case 'abon-sapi':
      return (
        <svg {...props}>
          {/* Plate / bowl base */}
          <path d="M4 16c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5" />
          <ellipse cx="12" cy="16" rx="8" ry="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" />
          {/* Shredded strips */}
          <path d="M8 14.5c0.3-2.5 0.8-5 1.5-7" strokeWidth="1.6" />
          <path d="M11 14.5c0.2-2.8 0.5-5.5 0.8-7.5" strokeWidth="1.6" />
          <path d="M14 14.5c-0.2-2.5-0.6-5-1.2-7" strokeWidth="1.6" />
          <path d="M16.5 14c-0.5-2-1-4.5-1.8-6" strokeWidth="1.6" />
          {/* Subtle aroma lines */}
          <path d="M9 5.5c0.5-1 0-2 0.5-3" strokeWidth="1.2" opacity="0.5" />
          <path d="M13 4.5c0.5-1 0-2 0.5-3" strokeWidth="1.2" opacity="0.5" />
        </svg>
      );

    /* ── Bumbu: Mortar & pestle with spice accent ── */
    case 'bumbu':
      return (
        <svg {...props}>
          {/* Mortar bowl */}
          <path d="M5 12c0 5 3.1 8 7 8s7-3 7-8" />
          <path d="M4 12h16" />
          {/* Mortar base */}
          <ellipse cx="12" cy="12" rx="8" ry="1.5" fill="currentColor" fillOpacity="0.06" />
          {/* Pestle - diagonal */}
          <path d="M16 4l-5.5 7" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16.5" cy="3.5" r="1.2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
          {/* Small spice dots */}
          <circle cx="9" cy="15" r="0.7" fill="currentColor" opacity="0.4" stroke="none" />
          <circle cx="12" cy="16" r="0.7" fill="currentColor" opacity="0.4" stroke="none" />
          <circle cx="14.5" cy="14.5" r="0.7" fill="currentColor" opacity="0.4" stroke="none" />
        </svg>
      );

    /* ── Cita Rasa Indonesia: Bowl with chopsticks & steam ── */
    case 'cita-rasa-indonesia':
      return (
        <svg {...props}>
          {/* Bowl */}
          <path d="M3 13h18" />
          <path d="M5 13c0 4.5 3.1 7 7 7s7-2.5 7-7" />
          <path d="M8 20h8" strokeWidth="1.5" />
          {/* Bowl fill */}
          <path d="M5 13c0 4.5 3.1 7 7 7s7-2.5 7-7z" fill="currentColor" fillOpacity="0.06" />
          {/* Elegant steam wisps */}
          <path d="M8 10c0.8-1.5-0.3-3 0.8-4.5" strokeWidth="1.4" opacity="0.45" />
          <path d="M12 9.5c0.8-1.5-0.3-3 0.8-4.5" strokeWidth="1.4" opacity="0.45" />
          <path d="M16 10c0.8-1.5-0.3-3 0.8-4.5" strokeWidth="1.4" opacity="0.45" />
        </svg>
      );

    /* ── Frozen: Geometric snowflake / ice crystal ── */
    case 'frozen':
      return (
        <svg {...props}>
          {/* Main cross lines */}
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          {/* Diagonal lines */}
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth="1.4" />
          <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" strokeWidth="1.4" />
          {/* Branch tips - top/bottom */}
          <path d="M12 2l-2 3" strokeWidth="1.4" />
          <path d="M12 2l2 3" strokeWidth="1.4" />
          <path d="M12 22l-2-3" strokeWidth="1.4" />
          <path d="M12 22l2-3" strokeWidth="1.4" />
          {/* Branch tips - left/right */}
          <path d="M2 12l3-2" strokeWidth="1.4" />
          <path d="M2 12l3 2" strokeWidth="1.4" />
          <path d="M22 12l-3-2" strokeWidth="1.4" />
          <path d="M22 12l-3 2" strokeWidth="1.4" />
          {/* Center crystal */}
          <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );

    /* ── Nasi Rempah Instant: Rice bowl with aromatic steam ── */
    case 'nasi-rempah-instant':
      return (
        <svg {...props}>
          {/* Bowl body */}
          <path d="M3 14h18" />
          <path d="M4.5 14c0.5 3.5 3.5 6 7.5 6s7-2.5 7.5-6" />
          {/* Pedestal base */}
          <path d="M9 20l-0.5 2h7l-0.5-2" strokeWidth="1.5" />
          {/* Rice mound */}
          <path d="M5.5 14c1-3 3-5 6.5-5s5.5 2 6.5 5" fill="currentColor" fillOpacity="0.06" />
          <path d="M5.5 14c1-3 3-5 6.5-5s5.5 2 6.5 5" />
          {/* Rice grain texture */}
          <ellipse cx="9.5" cy="12" rx="1" ry="0.5" fill="currentColor" opacity="0.25" stroke="none" />
          <ellipse cx="12.5" cy="11.5" rx="1" ry="0.5" fill="currentColor" opacity="0.25" stroke="none" />
          <ellipse cx="14.5" cy="12.5" rx="1" ry="0.5" fill="currentColor" opacity="0.25" stroke="none" />
          {/* Aromatic steam - spice-like swirls */}
          <path d="M9 7c0.6-1.2-0.2-2.5 0.6-3.5" strokeWidth="1.3" opacity="0.4" />
          <path d="M12.5 6.5c0.6-1.2-0.2-2.5 0.6-3.5" strokeWidth="1.3" opacity="0.4" />
        </svg>
      );

    /* ── Snack: Crispy chip / cracker with crumbs ── */
    case 'snack':
      return (
        <svg {...props}>
          {/* Main chip shape - wavy/organic */}
          <path d="M6 8c-1 2-1.5 5-0.5 7.5 1.5 3.5 5 5 9 4.5 3-0.5 5-2.5 5.5-5.5 0.5-3.5-1-6.5-3.5-8.5C14 4 10 3.5 7.5 5.5" />
          <path d="M6 8c-1 2-1.5 5-0.5 7.5 1.5 3.5 5 5 9 4.5 3-0.5 5-2.5 5.5-5.5 0.5-3.5-1-6.5-3.5-8.5C14 4 10 3.5 7.5 5.5z" fill="currentColor" fillOpacity="0.06" />
          {/* Texture / ridges on chip */}
          <path d="M8 9.5c2.5 1 5 1.5 8 0.5" strokeWidth="1.2" opacity="0.3" />
          <path d="M7 13c2.5 1.2 6 1.5 9 0" strokeWidth="1.2" opacity="0.3" />
          <path d="M8.5 16.5c2 0.8 4.5 0.8 6.5-0.3" strokeWidth="1.2" opacity="0.3" />
          {/* Small crumbs */}
          <circle cx="3.5" cy="17" r="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" />
          <circle cx="5" cy="19.5" r="0.7" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      );

    /* ── Fallback: Generic food/utensils icon ── */
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <circle cx="12" cy="15" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
