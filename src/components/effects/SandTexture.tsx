'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SandTexture — ultra-subtle animated sand grain overlay.
 * Generates a noise texture via canvas (once), then drifts it on scroll.
 * Place inside a `position: relative; overflow: hidden` parent, or use `fixed` mode.
 */
export default function SandTexture({ fixed = false }: { fixed?: boolean }) {
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const currentY = useRef(0);
  const targetY = useRef(0);
  const [noiseUrl, setNoiseUrl] = useState<string | null>(null);

  /* Generate sand grain texture once via canvas */
  useEffect(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Warm sand tones — subtle brown/beige noise
      const grain = Math.random();
      const intensity = 140 + Math.floor(grain * 80); // 140-220 range
      const warmth = Math.floor(grain * 15); // Slight warm offset

      data[i] = intensity + warmth;     // R (warmer)
      data[i + 1] = intensity + Math.floor(warmth * 0.6); // G
      data[i + 2] = intensity - warmth;  // B (cooler = less blue)
      data[i + 3] = Math.floor(grain * 18); // Very low alpha (0-18)
    }

    ctx.putImageData(imageData, 0, 0);
    setNoiseUrl(canvas.toDataURL('image/png'));
  }, []);

  /* Smooth scroll-driven drift */
  useEffect(() => {
    if (!noiseUrl) return;

    const onScroll = () => {
      targetY.current = window.scrollY;
    };

    const tick = () => {
      // Smooth lerp — sand drifts lazily behind scroll
      currentY.current += (targetY.current - currentY.current) * 0.05;

      const y1 = currentY.current * 0.12;
      const x1 = Math.sin(currentY.current * 0.0015) * 8;
      const y2 = currentY.current * 0.06;
      const x2 = Math.cos(currentY.current * 0.001) * 5;

      if (layer1Ref.current) {
        layer1Ref.current.style.transform = `translate3d(${x1}px, ${-y1 % 256}px, 0)`;
      }
      if (layer2Ref.current) {
        layer2Ref.current.style.transform = `translate3d(${x2}px, ${-y2 % 256}px, 0) scale(1.5)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [noiseUrl]);

  if (!noiseUrl) return null;

  const positionClass = fixed
    ? 'fixed inset-0 z-[1] pointer-events-none'
    : 'absolute inset-0 pointer-events-none';

  return (
    <div className={positionClass} aria-hidden="true" style={{ overflow: 'hidden' }}>
      {/* Primary sand layer */}
      <div
        ref={layer1Ref}
        className="absolute will-change-transform"
        style={{
          inset: '-260px',
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
          opacity: 0.7,
        }}
      />
      {/* Secondary layer — scaled up for depth, slightly different drift */}
      <div
        ref={layer2Ref}
        className="absolute will-change-transform"
        style={{
          inset: '-260px',
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
          opacity: 0.4,
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
