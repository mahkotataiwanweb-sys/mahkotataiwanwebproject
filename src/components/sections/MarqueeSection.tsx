'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Crown } from 'lucide-react';
import { getScrollVelocity } from '@/lib/scrollStore';

const marqueeItems = [
  'Mahkota Taiwan',
  'Rasa Indonesia',
  'Hadir di Taiwan',
  'Halal Certified',
  'Premium Quality',
  '300+ Stores',
];

const DEFAULT_SPEED = 1.5; // px per frame (leftward)
const FRICTION = 0.95;     // momentum decay per frame
const RETURN_RATE = 0.05;  // how fast velocity returns to default after release

export default function MarqueeSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const offsetRef = useRef(0);
  const velocityRef = useRef(-DEFAULT_SPEED);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const rafRef = useRef<number>(0);
  const singleSetWidthRef = useRef(0);

  // ✨ Smooth scroll velocity tracking for premium skew effect
  const currentSkewRef = useRef(0);

  // Tripled items for seamless infinite loop
  const items = [...marqueeItems, ...marqueeItems, ...marqueeItems];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { isVisibleRef.current = e.isIntersecting; }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const measureSetWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    singleSetWidthRef.current = track.scrollWidth / 3;
  }, []);

  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!isVisibleRef.current) { rafRef.current = requestAnimationFrame(animate); return; }

    const setWidth = singleSetWidthRef.current;

    // ✨ Read scroll velocity for reactive behavior
    const scrollVel = getScrollVelocity();
    // Scroll down (positive) → marquee accelerates left; Scroll up → slows/reverses
    const velocityBoost = -scrollVel * 0.12;
    // Smooth skew interpolation — buttery transition
    const targetSkew = Math.max(-6, Math.min(6, scrollVel * 0.03));
    currentSkewRef.current += (targetSkew - currentSkewRef.current) * 0.08;

    if (!isDraggingRef.current) {
      // Blend velocity toward scroll-influenced target speed
      const targetSpeed = -DEFAULT_SPEED + velocityBoost;
      velocityRef.current += (targetSpeed - velocityRef.current) * RETURN_RATE;

      // Apply friction to any momentum beyond target
      const excess = velocityRef.current - targetSpeed;
      if (Math.abs(excess) > 0.01) {
        velocityRef.current = targetSpeed + excess * FRICTION;
      }
    }

    if (!isDraggingRef.current) {
      offsetRef.current += velocityRef.current;
    }

    // Seamless loop: wrap offset within one set width
    if (setWidth > 0) {
      while (offsetRef.current < -setWidth) {
        offsetRef.current += setWidth;
      }
      while (offsetRef.current > 0) {
        offsetRef.current -= setWidth;
      }
    }

    // ✨ Apply transform with velocity-reactive skew for premium feel
    const skew = currentSkewRef.current.toFixed(3);
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0) skewX(${skew}deg)`;

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    measureSetWidth();
    rafRef.current = requestAnimationFrame(animate);

    const handleResize = () => measureSetWidth();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [animate, measureSetWidth]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dx = e.clientX - lastPointerXRef.current;
    const dt = now - lastMoveTimeRef.current;

    if (dt > 0) {
      dragVelocityRef.current = (dx / dt) * 16;
    }

    offsetRef.current += dx;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = now;

    const track = trackRef.current;
    const setWidth = singleSetWidthRef.current;
    if (track && setWidth > 0) {
      while (offsetRef.current < -setWidth) {
        offsetRef.current += setWidth;
      }
      while (offsetRef.current > 0) {
        offsetRef.current -= setWidth;
      }
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    velocityRef.current = dragVelocityRef.current || -DEFAULT_SPEED;
  }, []);

  return (
    <section ref={sectionRef} className="py-6 bg-navy overflow-hidden relative">
      {/* Gradient overlay at left edge */}
      <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-navy to-transparent z-10 pointer-events-none" />
      {/* Gradient overlay at right edge */}
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-navy to-transparent z-10 pointer-events-none" />

      <div
        className="flex whitespace-nowrap select-none touch-none cursor-grab active:cursor-grabbing will-change-transform"
        ref={trackRef}
        style={{ transformOrigin: 'center center' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {items.map((item, i) => (
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
