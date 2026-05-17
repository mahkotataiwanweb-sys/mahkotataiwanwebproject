'use client';

import { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setScrollData } from '@/lib/scrollStore';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    // Expose the Lenis instance so imperative components (e.g. category
    // click → scroll to product grid) can call lenis.scrollTo() instead of
    // window.scrollTo, which Lenis hijacks and may swallow.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Feed scroll data into the module-level store
    // Components read from this in their RAF loops — zero re-renders
    lenis.on('scroll', (e: { velocity: number; direction: number; progress: number }) => {
      ScrollTrigger.update();
      setScrollData(e.velocity, e.direction, e.progress);
    });

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      (window as unknown as { __lenis?: Lenis }).__lenis = undefined;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
