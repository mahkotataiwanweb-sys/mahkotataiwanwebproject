'use client';

/**
 * Organic curved / bulging dividers between sections.
 * Each variant creates a convex or concave edge instead of a hard box line.
 */

interface WaveDividerProps {
  /** Shape of the divider */
  variant?: 'bulge' | 'concave' | 'wave' | 'arc' | 'blob' | 'ribbon';
  /** CSS color of the shape — should match the NEXT section's background */
  fillColor?: string;
  /** Flip vertically (use at top of section) */
  flip?: boolean;
  /** Extra Tailwind classes */
  className?: string;
  /** Height of the divider */
  height?: number;
}

export default function WaveDivider({
  variant = 'bulge',
  fillColor = 'var(--color-cream)',
  flip = false,
  className = '',
  height = 80,
}: WaveDividerProps) {
  const flipStyle = flip ? { transform: 'scaleY(-1)' } : {};

  const paths: Record<string, string> = {
    // Convex bulge — center pushes down
    bulge:
      'M0,0 L0,20 Q250,120 500,20 L500,0 Z',
    // Concave — center pushes up (bowl shape)
    concave:
      'M0,80 Q250,-20 500,80 L500,100 L0,100 Z',
    // Organic wave with double hump
    wave:
      'M0,60 C80,100 150,0 250,50 C350,100 420,10 500,60 L500,100 L0,100 Z',
    // Simple smooth arc
    arc:
      'M0,80 Q250,0 500,80 L500,100 L0,100 Z',
    // Blob-like organic shape
    blob:
      'M0,70 C60,100 120,30 200,50 C280,70 350,20 420,60 C460,80 490,40 500,70 L500,100 L0,100 Z',
    // Flowing ribbon S-curve — organic wave like a flowing ribbon
    ribbon:
      'M0,75 C50,90 100,40 180,55 C260,70 300,20 360,35 C420,50 460,85 500,70 L500,100 L0,100 Z',
  };

  // Ribbon variant gets a special treatment: a stroke line on top for the 3D ribbon feel
  if (variant === 'ribbon') {
    return (
      <div
        className={`relative w-full overflow-hidden pointer-events-none ${className}`}
        style={{ height: `${height}px`, marginTop: `-1px`, marginBottom: `-1px`, ...flipStyle }}
      >
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 500 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow / depth layer */}
          <path
            d="M0,78 C50,93 100,43 180,58 C260,73 300,23 360,38 C420,53 460,88 500,73 L500,100 L0,100 Z"
            fill="rgba(0,0,0,0.08)"
          />
          {/* Main fill */}
          <path d={paths.ribbon} fill={fillColor} />
          {/* Top stroke line for ribbon 3D feel */}
          <path
            d="M0,75 C50,90 100,40 180,55 C260,70 300,20 360,35 C420,50 460,85 500,70"
            fill="none"
            stroke="var(--color-red)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none ${className}`}
      style={{ height: `${height}px`, marginTop: `-1px`, marginBottom: `-1px`, ...flipStyle }}
    >
      <svg
        className="absolute bottom-0 w-full h-full"
        viewBox="0 0 500 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={paths[variant] || paths.bulge} fill={fillColor} />
      </svg>
    </div>
  );
}
