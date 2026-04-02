'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Store, Package, Users, Shield, Heart, Sparkles, ChevronRight, Star, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SandTexture from '@/components/effects/SandTexture';
import HeroBackground from '@/components/effects/HeroBackground';

gsap.registerPlugin(ScrollTrigger);

/* ─── Physics-based marquee constants ─── */
const PARTNER_MARQUEE_SPEED = 1.2;
const PARTNER_FRICTION = 0.95;
const PARTNER_RETURN_RATE = 0.05;

interface StorePartner {
  id: number;
  name: string;
  logo_url: string;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const stats = [
  { icon: Award, key: 'since', value: 2021, prefix: '', suffix: '', displayType: 'number' as const },
  { icon: Store, key: 'stores', value: 300, prefix: '', suffix: '+', displayType: 'number' as const },
  { icon: Package, key: 'products', value: 26, prefix: '', suffix: '', displayType: 'number' as const },
  { icon: Users, key: 'customers', value: 1, prefix: '', suffix: 'M+', displayType: 'million' as const },
];

const values = [
  {
    icon: Shield,
    title: 'Quality First',
    description: 'Every product is carefully selected and tested to meet the highest standards of quality before reaching our shelves.',
  },
  {
    icon: Heart,
    title: 'Cultural Bridge',
    description: 'We bridge the gap between Indonesian heritage and Taiwanese daily life, bringing authentic flavors to every home.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building a strong community of over 1 million customers who trust us to deliver the tastes of home.',
  },
  {
    icon: Star,
    title: 'Integrity',
    description: 'Operating with transparency and trust in every partnership and transaction, ensuring lasting relationships built on mutual respect.',
  },
];

const milestones = [
  { year: '2021', title: 'Founded', description: 'Mahkota Taiwan was established with a vision to bring authentic Indonesian products to Taiwan.' },
  { year: '2022', title: '100+ Stores', description: 'Expanded our network to over 100 retail partner stores across northern Taiwan.' },
  { year: '2023', title: '300+ Stores', description: 'Reached 300+ partner stores island-wide, becoming the leading Indonesian product distributor.' },
  { year: '2024', title: 'Expanded Product Lines', description: 'Introduced new product categories including beverages, snacks, and household essentials.' },
  { year: '2025', title: '1 Million+ Customers', description: 'Proudly serving over 1 million customers, a testament to our quality and community trust.' },
];

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)',
    transition: 'transform 0.6s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.6s ease',
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [edgeGlare, setEdgeGlare] = useState({ angle: 0, opacity: 0 });

  useEffect(() => {
    setIsMobileDevice(window.innerWidth < 768);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isMobileDevice) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -20;
    const rotateY = (x - 0.5) * 20;
    const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI);

    setStyle({
      transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03) translateZ(12px)`,
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      boxShadow: `0 20px 40px -12px rgba(0,48,72,0.3), 0 30px 60px -20px rgba(0,0,0,0.15), ${rotateY * 0.3}px ${rotateX * -0.3}px 25px rgba(193,33,38,0.06)`,
    });
    setGlare({ x: x * 100, y: y * 100, opacity: 0.12 });
    setEdgeGlare({ angle, opacity: 0.2 });
  }, [isMobileDevice]);

  const handleMouseLeave = useCallback(() => {
    if (isMobileDevice) return;
    setStyle({
      transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)',
      transition: 'transform 0.8s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.8s ease',
      boxShadow: '0 16px 32px -10px rgba(0,48,72,0.2), 0 8px 16px -6px rgba(0,0,0,0.08)',
    });
    setGlare({ x: 50, y: 50, opacity: 0 });
    setEdgeGlare({ angle: 0, opacity: 0 });
  }, [isMobileDevice]);

  // Mobile: flat card, no 3D transforms
  const mobileStyle: React.CSSProperties = {
    boxShadow: '0 8px 24px -8px rgba(0,48,72,0.18), 0 4px 8px -4px rgba(0,0,0,0.06)',
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={isMobileDevice ? mobileStyle : {
        ...style,
        transformStyle: 'preserve-3d',
        boxShadow: style.boxShadow || '0 16px 32px -10px rgba(0,48,72,0.2), 0 8px 16px -6px rgba(0,0,0,0.08)',
      }}
    >
      {children}
      {/* Mouse-following radial glare — desktop only */}
      {!isMobileDevice && (
        <>
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none z-20"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
              transition: 'background 0.15s ease-out',
            }}
          />
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none z-20 overflow-hidden"
            style={{
              background: `linear-gradient(${edgeGlare.angle + 90}deg, transparent 35%, rgba(255,255,255,${edgeGlare.opacity * 0.06}) 50%, transparent 65%)`,
              transition: 'background 0.15s ease-out',
            }}
          />
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none z-20"
            style={{
              border: `1px solid rgba(255,255,255,${glare.opacity > 0 ? 0.1 : 0.04})`,
              transition: 'border-color 0.3s ease',
            }}
          />
        </>
      )}
    </div>
  );
}

/* ── LineReveal: professional line-by-line cascade reveal ── */
function LineReveal({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([]);
  const measured = useRef(false);

  /* Step 1: Render hidden text, measure which words fall on which visual line */
  useEffect(() => {
    if (!containerRef.current || measured.current) return;
    const el = containerRef.current;
    const words = text.split(' ');

    // Create hidden measurement container matching the real layout
    const measurer = document.createElement('p');
    measurer.className = className || '';
    measurer.style.cssText = 'visibility:hidden;position:absolute;top:0;left:0;right:0;pointer-events:none;';
    el.parentElement?.appendChild(measurer);

    const detectedLines: string[] = [];
    let currentLine = '';
    let lastTop = -1;

    words.forEach((word, i) => {
      const testText = currentLine ? currentLine + ' ' + word : word;
      measurer.textContent = testText;
      // Use a span to measure position of last word
      measurer.innerHTML = '';
      testText.split(' ').forEach((w, wi) => {
        if (wi > 0) measurer.appendChild(document.createTextNode(' '));
        const span = document.createElement('span');
        span.textContent = w;
        measurer.appendChild(span);
      });
      const spans = measurer.querySelectorAll('span');
      const lastSpan = spans[spans.length - 1];
      const top = lastSpan.offsetTop;

      if (lastTop === -1) {
        lastTop = top;
        currentLine = word;
      } else if (top > lastTop) {
        // New visual line detected
        detectedLines.push(currentLine);
        currentLine = word;
        lastTop = top;
      } else {
        currentLine = currentLine + ' ' + word;
      }
    });
    if (currentLine) detectedLines.push(currentLine);
    measurer.remove();

    measured.current = true;
    setLines(detectedLines);
  }, [text, className]);

  /* Step 2: Animate each line with GSAP cascade */
  useEffect(() => {
    if (!containerRef.current || lines.length === 0) return;
    const lineEls = containerRef.current.querySelectorAll('.lr-line');
    if (lineEls.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineEls,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });
    return () => ctx.revert();
  }, [lines]);

  return (
    <div ref={containerRef} className={className}>
      {lines.length === 0 ? (
        /* Before measurement — invisible placeholder to reserve space */
        <p style={{ visibility: 'hidden' }}>{text}</p>
      ) : (
        lines.map((line, i) => (
          <span
            key={i}
            className="lr-line"
            style={{ display: 'block', opacity: 0, willChange: 'transform, opacity, filter' }}
          >
            {line}
          </span>
        ))
      )}
    </div>
  );
}

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale();
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const redLineRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const valuesTitleRef = useRef<HTMLDivElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  /* ─── Physics marquee refs ─── */
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(-PARTNER_MARQUEE_SPEED);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const rafRef = useRef<number>(0);
  const singleSetWidthRef = useRef(0);

  const [partners, setPartners] = useState<StorePartner[]>([]);

  // Fetch partner logos from Supabase
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from('store_partners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        if (!error && data) {
          setPartners(data);
        }
      } catch (e) {
        // silently fail — placeholder will show
      }
    };
    fetchPartners();
  }, []);

  /* ─── Physics-based marquee animation loop ─── */
  const startMarqueeLoop = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    // Measure one set width (1/3 of track since we triple the items)
    const totalWidth = track.scrollWidth;
    const oneSetWidth = totalWidth / 3;
    singleSetWidthRef.current = oneSetWidth;

    const loop = () => {
      if (!isDraggingRef.current) {
        // Blend velocity back toward default speed
        velocityRef.current += (-PARTNER_MARQUEE_SPEED - velocityRef.current) * PARTNER_RETURN_RATE;
        // Apply friction to any momentum beyond default
        const excess = velocityRef.current - (-PARTNER_MARQUEE_SPEED);
        velocityRef.current = -PARTNER_MARQUEE_SPEED + excess * PARTNER_FRICTION;
      }

      // Update offset
      offsetRef.current += velocityRef.current;

      // Wrap offset within one set width for seamless loop
      const setW = singleSetWidthRef.current;
      if (setW > 0) {
        if (offsetRef.current < -setW) {
          offsetRef.current += setW;
        } else if (offsetRef.current > 0) {
          offsetRef.current -= setW;
        }
      }

      // Apply transform
      if (track) {
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Start marquee when partners load
  useEffect(() => {
    if (partners.length === 0) return;
    // Small delay to let DOM render the tripled items
    const timer = setTimeout(() => {
      startMarqueeLoop();
    }, 100);
    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [partners, startMarqueeLoop]);

  /* ─── Marquee pointer handlers ─── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = Date.now();
    dragVelocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const now = Date.now();
    const dx = e.clientX - lastPointerXRef.current;
    const dt = now - lastMoveTimeRef.current;

    if (dt > 0) {
      dragVelocityRef.current = dx / Math.max(dt, 1) * 16; // normalise to ~frame time
    }

    offsetRef.current += dx;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = now;

    // Apply transform immediately for responsiveness
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    velocityRef.current = dragVelocityRef.current || -PARTNER_MARQUEE_SPEED;
  }, []);

  const onPointerCancel = useCallback(() => {
    isDraggingRef.current = false;
    velocityRef.current = -PARTNER_MARQUEE_SPEED;
  }, []);

  // GSAP hero entrance animation — Premium staggered reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-text', {
        opacity: 0,
        y: 60,
        scale: 0.9,
        duration: 1.6,
        stagger: 0.25,
        ease: 'power4.out',
      });
    });
    return () => ctx.revert();
  }, []);

  // GSAP scroll-triggered animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Mission section — elegant staggered reveal at top 40%
      if (textRef.current) {
        const headingBlock = textRef.current.querySelector('.text-center');
        const descBlock = textRef.current.children[1]; // description paragraph div
        const pillsBlock = textRef.current.querySelector('.flex-wrap');

        // 1. Heading block: label, title, subtitle — each child staggers
        if (headingBlock) {
          const headingChildren = Array.from(headingBlock.children).filter(
            (el) => el !== redLineRef.current
          );
          gsap.fromTo(
            headingChildren,
            { opacity: 0, y: 80, scale: 0.85, rotateX: -25, filter: 'blur(8px)' },
            {
              opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)',
              duration: 1.8, stagger: 0.2, ease: 'expo.out',
              scrollTrigger: {
                trigger: textRef.current,
                start: 'top 40%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // 2. Red line — draws in after heading
        if (redLineRef.current) {
          gsap.fromTo(
            redLineRef.current,
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1, opacity: 1,
              duration: 1.4, ease: 'expo.inOut', delay: 0.4,
              scrollTrigger: {
                trigger: textRef.current,
                start: 'top 40%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // 3. Description paragraph — cinematic clip reveal + rise
        if (descBlock) {
          // First: clip-path wipe from bottom to top
          gsap.fromTo(
            descBlock,
            { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0, y: 50, scale: 0.96 },
            {
              clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, y: 0, scale: 1,
              duration: 2.0, ease: 'expo.out', delay: 0.8,
              scrollTrigger: {
                trigger: textRef.current,
                start: 'top 40%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // 4. Highlight pills — pop in one by one
        if (pillsBlock) {
          gsap.fromTo(
            pillsBlock.children,
            { opacity: 0, y: 40, scale: 0.8 },
            {
              opacity: 1, y: 0, scale: 1,
              duration: 1.2, stagger: 0.15, ease: 'back.out(1.4)', delay: 1.0,
              scrollTrigger: {
                trigger: textRef.current,
                start: 'top 40%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      }

      // Stats — dramatic pop-up reveal, repeating continuously
      const isMobile = window.innerWidth < 768;

      if (statsRef.current) {
        const bubbleItems = statsRef.current.querySelectorAll('.stat-bubble-item');

        // Dramatic pop-up entrance with continuous repeat
        bubbleItems.forEach((item, i) => {
          gsap.fromTo(item,
            { opacity: 0, scale: 0.3, y: 40 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 1,
              delay: i * 0.12,
              ease: 'back.out(2.5)',
              repeat: -1,
              repeatDelay: 2.5,
              yoyo: true,
              yoyoEase: 'power2.in',
              scrollTrigger: {
                trigger: statsRef.current,
                start: 'top 85%',
                toggleActions: 'play pause resume reverse',
              },
            }
          );
        });
      }

      // Counter animation with dramatic counting
      counterRefs.current.forEach((el, i) => {
        if (!el) return;
        const stat = stats[i];
        const target = stat.value;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: stat.displayType === 'million' ? 1.8 : 2.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          onUpdate: () => {
            if (el) el.textContent = Math.round(obj.val).toLocaleString();
          },
        });
      });

      // Values title — dramatic reveal, triggers just before cards
      if (valuesTitleRef.current) {
        const titleChildren = valuesTitleRef.current.children;
        gsap.set(titleChildren, {
          opacity: 0,
          y: 80,
          scale: 0.7,
          rotationX: -40,
          transformPerspective: 800,
          filter: 'blur(10px)',
        });

        gsap.to(titleChildren, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          filter: 'blur(0px)',
          duration: 1.4,
          stagger: 0.15,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: valuesTitleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      // Values section — sequential flip-forward animation + smooth float
      if (valuesRef.current) {
        const cards = valuesRef.current.querySelectorAll('.value-card');

        if (isMobile) {
          // ── MOBILE: clean flip-forward, lighter transforms ──
          gsap.set(cards, {
            opacity: 0,
            rotationX: -70,
            transformPerspective: 1000,
            transformOrigin: 'center center',
            scale: 0.85,
          });

          const flipTl = gsap.timeline({
            scrollTrigger: {
              trigger: valuesRef.current,
              start: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          });

          cards.forEach((card, i) => {
            flipTl.to(card, {
              opacity: 1,
              rotationX: 0,
              scale: 1,
              duration: 2.7,
              ease: 'power3.out',
            }, i * 0.7);
          });

          // Gentle float after flip completes
          flipTl.call(() => {
            cards.forEach((card, i) => {
              gsap.to(card, {
                y: -5,
                duration: 2.6 + i * 0.3,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: 0.15 * i,
              });
            });
          });

        } else {
          // ── DESKTOP: dramatic sequential flip-forward toward screen ──
          gsap.set(cards, {
            opacity: 0,
            rotationX: -90,
            transformPerspective: 1200,
            transformOrigin: 'center center',
            scale: 0.8,
            filter: 'brightness(0.5)',
            y: 30,
          });

          const flipTl = gsap.timeline({
            scrollTrigger: {
              trigger: valuesRef.current,
              start: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          });

          // Flip each card forward one after another
          cards.forEach((card, i) => {
            flipTl.to(card, {
              opacity: 1,
              rotationX: 0,
              scale: 1,
              filter: 'brightness(1)',
              y: 0,
              duration: 2.9,
              ease: 'back.out(1.2)',
            }, i * 0.8);
          });

          // After all cards have flipped, add smooth floating effect
          flipTl.call(() => {
            cards.forEach((card, i) => {
              gsap.to(card, {
                y: -8,
                duration: 2.8 + i * 0.35,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: 0.2 * i,
              });
            });
          }, [], '+=0.2');
        }
      }

      // Partners section — dramatic fade-in
      if (partnersRef.current) {
        gsap.fromTo(
          partnersRef.current,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: partnersRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Timeline line draws itself on scroll
      if (timelineLineRef.current && storyRef.current) {
        gsap.fromTo(
          timelineLineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: storyRef.current,
              start: 'top 70%',
              end: 'bottom 60%',
              scrub: 0.3,
            },
          }
        );
      }

      // Timeline dot markers scale in — dramatic
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        gsap.fromTo(
          dot,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.8,
            ease: 'elastic.out(1, 0.4)',
            scrollTrigger: {
              trigger: dot,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Story chapters stagger from alternating sides — dramatic
      if (storyRef.current) {
        const chapters = storyRef.current.querySelectorAll('.story-chapter');
        chapters.forEach((chapter, i) => {
          const fromLeft = i % 2 === 0;
          gsap.fromTo(
            chapter,
            { opacity: 0, x: fromLeft ? -80 : 80, y: 30, scale: 0.92 },
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: 2.2,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: chapter,
                start: 'top 82%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }
    });
    return () => ctx.revert();
  }, []);

  /* ─── Tripled partners list for seamless loop ─── */
  const tripledPartners = partners.length > 0
    ? [...partners, ...partners, ...partners]
    : [];

  return (
    <div className="min-h-screen bg-cream">
      <SandTexture fixed />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      ` }} />

      {/* ═══════════════════════════════════════════════════════════════
          Hero Section
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-32 pb-24 overflow-hidden">
        <HeroBackground />

        {/* Extra hero decorations */}
        <motion.div
          className="absolute top-16 left-[10%] pointer-events-none"
          animate={{ y: [0, -10, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-10 h-10 text-cream/20" />
        </motion.div>
        <motion.div
          className="absolute bottom-10 right-[15%] pointer-events-none"
          animate={{ y: [0, 8, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-3 h-3 rounded-full bg-red/30" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Back link */}
          <div className="hero-text mb-8">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>

          <motion.span
            className="hero-text inline-block text-base sm:text-lg font-bold tracking-[0.35em] uppercase mb-5 px-6 py-2 rounded-full border border-cream/20"
            style={{
              background: 'linear-gradient(135deg, rgba(193,33,38,0.15), rgba(250,237,211,0.1))',
              color: '#FAEDD3',
              textShadow: '0 0 20px rgba(250,237,211,0.4), 0 0 40px rgba(193,33,38,0.2)',
            }}
            animate={{ opacity: [0.85, 1, 0.85], scale: [0.98, 1, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦ {t('label')} ✦
          </motion.span>
          <h1 className="hero-text text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-5">
            {t('title')}
          </h1>
          <p className="hero-text text-cream/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('mission')}
          </p>

          {/* Animated separator */}
          <div className="hero-text relative mt-8 flex items-center justify-center gap-3">
            <motion.div
              className="w-12 h-px bg-gradient-to-r from-transparent to-red/60"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 1.5, delay: 1.2, ease: 'power4.out' }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-red"
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 1.8 }}
            />
            <motion.div
              className="w-12 h-px bg-gradient-to-l from-transparent to-red/60"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 1.5, delay: 1.2, ease: 'power4.out' }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Mission / Description Section
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <div ref={textRef}>
            {/* Centered heading */}
            <div className="text-center mb-12">
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Our Mission</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight mb-4">
                Bridging Indonesian Flavors to Taiwan
              </h2>
              <div
                ref={redLineRef}
                className="w-16 h-[2px] bg-red mx-auto mb-6 origin-center"
              />
              <p className="text-red/80 font-medium text-sm sm:text-base tracking-wide">
                More than a distributor — a cultural ambassador bringing the taste of home.
              </p>
            </div>

            {/* Clean description paragraph */}
            <div className="mb-12">
              <p className="text-navy/60 leading-[1.9] text-base sm:text-lg text-center max-w-3xl mx-auto">
                {t('description')}
              </p>
            </div>

            {/* Highlights — clean horizontal pills */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {['highlight1', 'highlight2', 'highlight3'].map((key) => (
                <div key={key} className="flex items-center gap-2.5 bg-white/80 border border-navy/[0.06] rounded-full px-5 py-2.5 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red shrink-0" />
                  <p className="text-navy/70 text-sm font-medium">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Stats Section — Navy Strip
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={statsSectionRef} className="py-6 sm:py-8 relative overflow-hidden -mt-4">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="stat-bubble-item text-center group">
                  <div className="bg-white border border-navy/[0.06] rounded-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="w-8 h-8 rounded-lg bg-navy/[0.06] flex items-center justify-center mx-auto mb-2.5 group-hover:bg-red/10 transition-colors duration-300">
                      <Icon className="w-4 h-4 text-navy/50 group-hover:text-red transition-colors duration-300" />
                    </div>
                    <div className="text-xl sm:text-2xl font-heading font-bold text-navy mb-0.5">
                      {stat.prefix}
                      <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
                      {stat.suffix}
                    </div>
                    <p className="text-navy/40 text-[10px] sm:text-[11px] font-medium tracking-[0.12em] uppercase">{t(`stats.${stat.key}`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Values Section
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
<div ref={valuesRef} className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div ref={valuesTitleRef}>
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">What We Stand For</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">Our Values</h2>
              <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <TiltCard
                  key={val.title}
                  className="value-card relative bg-navy rounded-3xl p-6 sm:p-8 text-center group cursor-default overflow-hidden ring-1 ring-white/[0.06]"
                >
                  {/* Ambient glow underneath card */}
{/* Top-right decorative glow */}
{/* Bottom-left soft light */}
{/* Top-edge highlight line */}
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-red/20 flex items-center justify-center mx-auto mb-4 sm:mb-5 group-hover:bg-red/30 transition-all duration-500 shadow-[0_0_35px_rgba(193,33,38,0.2)] group-hover:shadow-[0_0_45px_rgba(193,33,38,0.35)]">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-red group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="font-heading text-base sm:text-lg font-bold text-white mb-2 sm:mb-2.5">{val.title}</h3>
                    <div className="w-9 h-[2px] bg-red/50 mx-auto mb-3.5 sm:mb-4 group-hover:w-14 transition-all duration-500" />
                    <p className="text-cream/60 text-xs sm:text-sm leading-relaxed">{val.description}</p>
                  </div>

                  {/* Bottom accent glow bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-red/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
</TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Our Partners Section — Physics-Based Interactive Marquee
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
<div ref={partnersRef} className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Collaboration</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">Trusted Partners</h2>
              <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
              <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">Working with Taiwan&apos;s leading retailers to bring you the best Indonesian products</p>
            </motion.div>
          </div>

          {partners.length > 0 ? (
            <div
              className="relative overflow-hidden"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              {/* Gradient fade overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" />

              {/* Physics-driven track */}
              <div
                ref={trackRef}
                className="flex whitespace-nowrap select-none touch-none cursor-grab active:cursor-grabbing gap-6"
                style={{ willChange: 'transform' }}
              >
                {tripledPartners.map((partner, i) => (
                  partner.website_url && partner.website_url !== '#' ? (
                    <a
                      key={`${partner.id}-${i}`}
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center min-w-[180px] h-24 cursor-pointer group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-12 max-w-[120px] object-contain pointer-events-none group-hover:scale-110 transition-transform duration-300"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-navy/60 font-semibold text-sm pointer-events-none">{partner.name}</span>
                      )}
                    </a>
                  ) : (
                    <div
                      key={`${partner.id}-${i}`}
                      className="flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-center justify-center min-w-[180px] h-24"
                    >
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-12 max-w-[120px] object-contain pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-navy/60 font-semibold text-sm pointer-events-none">{partner.name}</span>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center h-24"
                >
                  <div className="flex items-center gap-2 text-navy/30">
                    <Store className="w-5 h-5" />
                    <span className="text-sm font-medium">Partner Store</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Our Story Section — Timeline
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
<div ref={storyRef} className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Our Story</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">The Journey So Far</h2>
              <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line that draws on scroll */}
            <div
              ref={timelineLineRef}
              className="absolute left-[20px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-red/30 via-navy/20 to-red/30 origin-top"
            />

            <div className="space-y-12 md:space-y-16">
              {milestones.map((milestone, i) => (
                <div
                  key={milestone.year}
                  className="story-chapter relative"
                >
                  {/* Dot marker — scales in on scroll */}
                  <div
                    ref={(el) => { dotRefs.current[i] = el; }}
                    className="absolute left-[20px] md:left-1/2 -translate-x-1/2 top-1 z-10"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-red border-[3px] border-cream shadow-[0_0_12px_rgba(193,33,38,0.3)]" />
                  </div>

                  <div className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-0`}>
                    {/* Year side */}
                    <div className={`md:w-1/2 pl-12 md:pl-0 ${i % 2 === 0 ? 'md:text-right md:pr-14' : 'md:order-2 md:pl-14'}`}>
                      <span className="inline-block text-xs font-bold text-red tracking-widest uppercase bg-red/5 px-3 py-1.5 rounded-full border border-red/10">
                        {milestone.year}
                      </span>
                    </div>

                    {/* Content side */}
                    <div className={`md:w-1/2 pl-12 md:pl-0 ${i % 2 === 0 ? 'md:pl-14' : 'md:order-1 md:text-right md:pr-14'}`}>
                      <div className="bg-white rounded-2xl border border-navy/[0.06] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <h3 className="font-heading text-lg sm:text-xl font-bold text-navy mb-2">{milestone.title}</h3>
                        <p className="text-navy/55 text-sm leading-relaxed">{milestone.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Bottom CTA — Premium Floating Box
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-cream relative overflow-hidden">
<motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 2.3, ease: [0.22, 0.68, 0, 1] }}
          className="max-w-4xl mx-auto px-6 sm:px-8"
        >
          <div
            className="relative bg-navy rounded-[2rem] p-10 sm:p-14 lg:p-16 text-center overflow-hidden shadow-[0_40px_100px_-25px_rgba(0,48,72,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
            style={{ animation: 'floatSubtle 6s ease-in-out infinite' }}
          >
            {/* Glossy shine overlays */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.1] via-transparent to-white/[0.02] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            {/* Animated gradient orbs */}


{/* Moving shimmer */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" style={{ animation: 'shimmerSlide 4s ease-in-out infinite' }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <Sparkles className="w-10 h-10 text-red/60 mx-auto mb-5" />
              </motion.div>

              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Want to Learn More?
              </h2>
              <p className="text-cream/70 mb-10 max-w-lg mx-auto text-sm tracking-wide">
                Discover our products or get in touch with our team today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/${locale}/products`}
                  className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red/90 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red/20 text-base"
                >
                  Browse Products
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/30 text-base backdrop-blur-sm"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
