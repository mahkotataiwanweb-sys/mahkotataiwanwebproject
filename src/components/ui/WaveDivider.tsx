'use client';

interface WaveDividerProps {
  variant?: 'bulge' | 'concave' | 'wave' | 'arc' | 'blob' | 'ribbon';
  fillColor?: string;
  bgColor?: string;
  flip?: boolean;
  className?: string;
  height?: number;
}

export default function WaveDivider({
  variant = 'bulge',
  fillColor = 'var(--color-cream)',
  bgColor,
  flip = false,
  className = '',
  height = 80,
}: WaveDividerProps) {
  const flipStyle = flip ? { transform: 'scaleY(-1)' } : {};

  const paths: Record<string, string> = {
    bulge:
      'M0,0 L0,20 Q250,120 500,20 L500,0 Z',
    concave:
      'M0,80 Q250,-20 500,80 L500,100 L0,100 Z',
    wave:
      'M0,60 C80,100 150,0 250,50 C350,100 420,10 500,60 L500,100 L0,100 Z',
    arc:
      'M0,80 Q250,0 500,80 L500,100 L0,100 Z',
    blob:
      'M0,70 C60,100 120,30 200,50 C280,70 350,20 420,60 C460,80 490,40 500,70 L500,100 L0,100 Z',
    // Gentle S-curve — subtle, not extreme
    ribbon:
      'M0,40 C175,70 325,30 500,60 L500,100 L0,100 Z',
  };

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none ${className}`}
      style={{
        height: `${height}px`,
        marginTop: '-1px',
        marginBottom: '-1px',
        backgroundColor: bgColor || 'transparent',
        ...flipStyle,
      }}
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
