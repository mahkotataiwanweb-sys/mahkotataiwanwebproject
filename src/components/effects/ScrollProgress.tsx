'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(barRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });

      // Glow dot follows the progress bar tip
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          left: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none">
      <div
        ref={barRef}
        className="h-full w-full origin-left relative"
        style={{
          transform: 'scaleX(0)',
          background:
            'linear-gradient(90deg, var(--color-red) 0%, var(--color-red-light) 50%, var(--color-red) 100%)',
        }}
      >
        {/* Glow dot at the tip */}
        <div
          ref={glowRef}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            left: '0%',
            background: 'var(--color-red-light)',
            boxShadow: '0 0 12px 4px rgba(224, 51, 56, 0.6), 0 0 24px 8px rgba(224, 51, 56, 0.3)',
            transform: 'translate(50%, -50%)',
          }}
        />
      </div>
    </div>
  );
}
