'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Crown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const marqueeItems = [
  'Mahkota Taiwan',
  'Rasa Indonesia',
  'Hadir di Taiwan',
  'Halal Certified',
  'Premium Quality',
  '300+ Stores',
];

export default function MarqueeSection() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        xPercent: -50,
        ease: 'none',
        duration: 25,
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-6 bg-navy overflow-hidden relative">
      {/* Gradient overlay at left edge */}
      <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-navy to-transparent z-10 pointer-events-none" />
      {/* Gradient overlay at right edge */}
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-navy to-transparent z-10 pointer-events-none" />

      <div ref={marqueeRef} className="flex whitespace-nowrap">
        {[...marqueeItems, ...marqueeItems].map((item, i) => (
          <div key={i} className="flex items-center gap-6 mx-6">
            <Crown className="w-4 h-4 text-red shrink-0" />
            <span className="text-cream/80 text-lg sm:text-xl font-heading font-semibold tracking-wide">
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
