'use client';

/**
 * Organic curved / bulging dividers between sections.
 * Each variant creates a convex or concave edge instead of a hard box line.
 *
 * Usage:
 *   <WaveDivider variant="bulge" fillColor="var(--color-cream)" />
 *   <WaveDivider variant="concave" fillColor="var(--color-red)" flip />
 */

interface WaveDividerProps {
  /** Shape of the divider */
  variant?: 'bulge' | 'concave' | 'wave' | 'arc' | 'blob';
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
  };

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
