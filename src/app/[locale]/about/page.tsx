'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Store, Package, Users, Shield, Heart, Sparkles, ChevronRight, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SandTexture from '@/components/effects/SandTexture';

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
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)',
    transition: 'transform 0.6s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.6s ease',
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [edgeGlare, setEdgeGlare] = useState({ angle: 0, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
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
  }, []);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)',
      transition: 'transform 0.8s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.8s ease',
      boxShadow: '0 16px 32px -10px rgba(0,48,72,0.2), 0 8px 16px -6px rgba(0,0,0,0.08)',
    });
    setGlare({ x: 50, y: 50, opacity: 0 });
    setEdgeGlare({ angle: 0, opacity: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        boxShadow: style.boxShadow || '0 16px 32px -10px rgba(0,48,72,0.2), 0 8px 16px -6px rgba(0,0,0,0.08)',
      }}
    >
      {children}
      {/* Mouse-following radial glare */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
          transition: 'background 0.15s ease-out',
        }}
      />
      {/* Edge shine reflection */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20 overflow-hidden"
        style={{
          background: `linear-gradient(${edgeGlare.angle + 90}deg, transparent 35%, rgba(255,255,255,${edgeGlare.opacity * 0.06}) 50%, transparent 65%)`,
          transition: 'background 0.15s ease-out',
        }}
      />
      {/* Subtle border shimmer */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20"
        style={{
          border: `1px solid rgba(255,255,255,${glare.opacity > 0 ? 0.1 : 0.04})`,
          transition: 'border-color 0.3s ease',
        }}
      />
    </div>
  );
}

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale();
  const heroRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const redLineRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
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

  // GSAP hero entrance animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP scroll-triggered animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Description section blur-deblur
      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { opacity: 0, y: 40, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: textRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Red decorative line draw on scroll
      if (redLineRef.current) {
        gsap.fromTo(
          redLineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: redLineRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Stats — cinematic bubble entrance
      if (statsRef.current) {
        const bubbleItems = statsRef.current.querySelectorAll('.stat-bubble-item');
        
        gsap.fromTo(
          bubbleItems,
          { opacity: 0, scale: 0.5, y: 60, filter: 'blur(12px)' },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            stagger: 0.15,
            ease: 'elastic.out(1, 0.6)',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );

        // Continuous floating animation for each bubble (different rhythm per bubble)
        bubbleItems.forEach((item, i) => {
          gsap.to(item, {
            y: -10 - (i * 2),
            duration: 2.8 + (i * 0.4),
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 1.2 + (i * 0.2),
          });
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

      // Values section — ultra premium cinematic reveal
      if (valuesRef.current) {
        const cards = valuesRef.current.querySelectorAll('.value-card');

        // Set initial state
        gsap.set(cards, {
          opacity: 0,
          y: 120,
          scale: 0.7,
          rotationX: 25,
          rotationY: -8,
          filter: 'blur(16px) brightness(0.4)',
          transformPerspective: 1200,
          transformOrigin: 'center bottom',
        });

        // Staggered cinematic entrance
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          filter: 'blur(0px) brightness(1)',
          duration: 1.2,
          stagger: {
            each: 0.18,
            from: 'start',
          },
          ease: 'expo.out',
          scrollTrigger: {
            trigger: valuesRef.current,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        });

        // Subtle floating animation after entrance (continuous)
        cards.forEach((card, i) => {
          gsap.to(card, {
            y: -6,
            duration: 2.5 + i * 0.3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 1.5 + i * 0.18,
          });
        });
      }

      // Partners section fade-in
      if (partnersRef.current) {
        gsap.fromTo(
          partnersRef.current,
          { opacity: 0, y: 40, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.8,
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

      // Timeline dot markers scale in
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        gsap.fromTo(
          dot,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: dot,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Story chapters stagger from alternating sides
      if (storyRef.current) {
        const chapters = storyRef.current.querySelectorAll('.story-chapter');
        chapters.forEach((chapter, i) => {
          const fromLeft = i % 2 === 0;
          gsap.fromTo(
            chapter,
            { opacity: 0, x: fromLeft ? -40 : 40, filter: 'blur(6px)' },
            {
              opacity: 1,
              x: 0,
              filter: 'blur(0px)',
              duration: 0.8,
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
      <section ref={heroRef} className="py-24 sm:py-32 bg-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-cream/70 hover:text-cream text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div ref={headerRef} className="text-center">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3 leading-[1.1]">
              {t('title')}
            </h1>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-cream/70 max-w-lg mx-auto text-sm tracking-wide">
              {t('mission')}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Mission / Description Section
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6">
          <div ref={textRef} className="text-center">
            <p className="text-navy/60 leading-relaxed text-sm tracking-wide max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            {/* Decorative red line that draws on scroll */}
            <div
              ref={redLineRef}
              className="w-16 h-[2px] bg-red mx-auto mb-10 origin-left"
            />

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
              {['highlight1', 'highlight2', 'highlight3'].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red shrink-0 shadow-[0_0_8px_rgba(193,33,38,0.3)]" />
                  <p className="text-navy/60 text-sm">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Stats Section — Navy Strip
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={statsSectionRef} className="py-28 sm:py-36 bg-navy relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-red/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-blue-500/6 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="flex flex-col items-center group stat-bubble-item">
                  {/* ── Floating Red Glossy Bubble ── */}
                  <div className="relative mb-6">
                    {/* Outer glow aura */}
                    <div className="absolute -inset-3 rounded-full bg-red/20 blur-xl group-hover:bg-red/30 transition-all duration-700" />
                    
                    {/* Main red bubble */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-[0_8px_32px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.15),inset_0_-4px_12px_rgba(0,0,0,0.3)]">
                      {/* Gradient fill — deep red to vibrant */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-red to-red-800 rounded-full" />
                      
                      {/* Top glossy reflection arc */}
                      <div className="absolute top-0 left-[10%] right-[10%] h-[45%] bg-gradient-to-b from-white/40 via-white/15 to-transparent rounded-t-full" />
                      
                      {/* Secondary inner shine */}
                      <div className="absolute top-[8%] left-[15%] w-[35%] h-[25%] bg-white/25 rounded-full blur-[6px]" />
                      
                      {/* Bottom rim reflection */}
                      <div className="absolute bottom-0 left-[15%] right-[15%] h-[15%] bg-gradient-to-t from-white/10 to-transparent rounded-b-full" />
                      
                      {/* Edge light ring */}
                      <div className="absolute inset-0 rounded-full ring-1 ring-white/20 ring-inset" />
                      
                      {/* Blue icon in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-300 drop-shadow-[0_2px_8px_rgba(96,165,250,0.6)] relative z-10" />
                      </div>
                    </div>
                    
                    {/* Subtle bottom shadow for 3D depth */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-red/30 rounded-full blur-md" />
                  </div>

                  {/* ── Number with glow effect ── */}
                  <div className="text-4xl sm:text-5xl font-heading font-bold text-white mb-1.5 relative">
                    <span className="absolute inset-0 text-red/20 blur-lg select-none pointer-events-none" aria-hidden="true">
                      {stat.prefix}{stat.value}{stat.suffix}
                    </span>
                    <span className="relative">
                      {stat.prefix}
                      <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
                      {stat.suffix}
                    </span>
                  </div>

                  {/* ── Label ── */}
                  <p className="text-white/60 text-sm font-medium tracking-[0.15em] uppercase">{t(`stats.${stat.key}`)}</p>
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
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div ref={valuesRef} className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">What We Stand For</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">Our Values</h2>
              <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <TiltCard
                  key={val.title}
                  className="value-card relative bg-navy rounded-3xl p-8 sm:p-10 text-center group cursor-default overflow-hidden ring-1 ring-white/[0.06]"
                >
                  {/* Ambient glow underneath card */}
                  <div className="absolute -inset-1 bg-gradient-to-b from-navy/40 via-red/[0.07] to-navy/40 rounded-[1.6rem] blur-xl -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Top-right decorative glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  {/* Bottom-left soft light */}
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
                  {/* Top-edge highlight line */}
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                    <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-3xl bg-red/20 flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:bg-red/30 transition-all duration-500 shadow-[0_0_40px_rgba(193,33,38,0.2)] group-hover:shadow-[0_0_50px_rgba(193,33,38,0.35)]">
                      <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-red group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{val.title}</h3>
                    <div className="w-10 h-[2px] bg-red/50 mx-auto mb-4 sm:mb-5 group-hover:w-16 transition-all duration-500" />
                    <p className="text-cream/60 text-xs sm:text-sm leading-relaxed">{val.description}</p>
                  </div>

                  {/* Bottom accent glow bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-red/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-8 bg-red/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
        <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div ref={partnersRef} className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div ref={storyRef} className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
        <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
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
            <div className="absolute top-0 right-0 w-72 h-72 bg-red/15 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/[0.06] rounded-full blur-[60px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-red/5 rounded-full blur-[100px] rotate-12" />

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
