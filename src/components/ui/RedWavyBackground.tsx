'use client';

/**
 * Brand red background with the organic swirl/loop texture from the reference
 * asset. Uses the actual artwork at `/images/red-swirl-bg.png` tiled at
 * natural scale so the swirls keep the same density on tall and short
 * sections.
 *
 * Render this as the FIRST child inside a `relative overflow-hidden` parent.
 * Keep the parent's content (heading, cards, etc.) inside a `relative z-10`
 * wrapper so it sits above the texture.
 */
export default function RedWavyBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundColor: '#D8232A',
        backgroundImage: 'url(/images/red-swirl-bg.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '800px auto',
        backgroundPosition: 'center',
      }}
    />
  );
}
