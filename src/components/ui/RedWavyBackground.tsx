'use client';

/**
 * Reusable red brand background with a subtle wavy/swirl line texture.
 * Stroke colour is a darker red so the pattern reads as embossing on the
 * brand red base — matches the reference asset shared by the design team.
 *
 * Render this as the FIRST child inside a `relative overflow-hidden` parent.
 * Keep the parent's content (heading, cards, etc.) inside a `relative z-10`
 * wrapper so it sits above the texture.
 */
export default function RedWavyBackground() {
  const rowHeight = 36;
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ backgroundColor: 'var(--color-red)' }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="red-wavy-1"
            x="0"
            y="0"
            width="200"
            height={rowHeight}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M0,${rowHeight / 2} Q35,${rowHeight / 2 - 10} 50,${rowHeight / 2} T100,${rowHeight / 2} Q135,${rowHeight / 2 + 10} 150,${rowHeight / 2} T200,${rowHeight / 2}`}
              fill="none"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </pattern>
          <pattern
            id="red-wavy-2"
            x="50"
            y={rowHeight / 2 + 4}
            width="240"
            height={rowHeight + 6}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M0,${(rowHeight + 6) / 2} Q45,${(rowHeight + 6) / 2 - 8} 60,${(rowHeight + 6) / 2} T120,${(rowHeight + 6) / 2} Q165,${(rowHeight + 6) / 2 + 8} 180,${(rowHeight + 6) / 2} T240,${(rowHeight + 6) / 2}`}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </pattern>
          <pattern
            id="red-wavy-3"
            x="100"
            y="18"
            width="280"
            height={rowHeight + 12}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M0,${(rowHeight + 12) / 2} Q50,${(rowHeight + 12) / 2 + 6} 70,${(rowHeight + 12) / 2} T140,${(rowHeight + 12) / 2} Q190,${(rowHeight + 12) / 2 - 6} 210,${(rowHeight + 12) / 2} T280,${(rowHeight + 12) / 2}`}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#red-wavy-1)" />
        <rect width="100%" height="100%" fill="url(#red-wavy-2)" />
        <rect width="100%" height="100%" fill="url(#red-wavy-3)" />
      </svg>
    </div>
  );
}
