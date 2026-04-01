'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { ArrowLeft, MapPin, Store, Globe, Sparkles, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroBackground from '@/components/effects/HeroBackground';
import type { StoreLocation } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

// Dynamic import to avoid SSR issues with Leaflet
const StoreMap = dynamic(() => import('@/components/map/StoreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] sm:h-[750px] lg:h-[900px] rounded-[2rem] bg-cream-light border border-cream-dark/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-red border-t-transparent rounded-full animate-spin" />
        <p className="text-navy/40 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

/* ─── Floating Particle Component ─── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0
              ? 'rgba(193, 33, 38, 0.15)'
              : i % 3 === 1
                ? 'rgba(0, 48, 72, 0.1)'
                : 'rgba(250, 237, 211, 0.4)',
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Decorative Geometric Shapes ─── */
function DecorativeShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Rotating diamond */}
      <motion.div
        className="absolute top-20 right-[8%] w-16 h-16 border border-red/10 rotate-45"
        animate={{ rotate: [45, 405], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      {/* Pulsing circle */}
      <motion.div
        className="absolute bottom-32 left-[5%] w-24 h-24 rounded-full border border-navy/5"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Floating cross */}
      <motion.div
        className="absolute top-[40%] left-[12%]"
        animate={{ y: [0, -15, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-8 h-0.5 bg-red/10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-red/10" />
        </div>
      </motion.div>
      {/* Dotted arc */}
      <motion.svg
        className="absolute top-[15%] right-[15%] w-32 h-32 text-navy/5"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="64" cy="64" r="50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" />
      </motion.svg>
      {/* Small triangles */}
      <motion.div
        className="absolute bottom-[20%] right-[10%]"
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-red/15" />
      </motion.div>
      <motion.div
        className="absolute top-[60%] right-[25%]"
        animate={{ y: [0, 15, 0], opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-navy/10" />
      </motion.div>
    </div>
  );
}

/* ─── Shimmer Line Decoration ─── */
function ShimmerLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(193,33,38,0.2), transparent)' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,48,72,0.15), transparent)' }}
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  );
}

export default function WhereToBuyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stores from API
  useEffect(() => {
    fetch('/api/store-locations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStores(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // GSAP Animations — hero, map, parallax (runs once on mount)
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero text entrance — premium staggered blur reveal
      gsap.from('.hero-text', {
        opacity: 0,
        y: 60,
        filter: 'blur(16px)',
        scale: 0.9,
        duration: 1.6,
        stagger: 0.25,
        ease: 'power4.out',
      });

      // Stats cards — clean, stable reveal (no heavy blur/scale)
      const statCards = gsap.utils.toArray('.stat-card') as HTMLElement[];
      statCards.forEach((card, i) => {
        gsap.fromTo(card,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.stats-section',
              start: 'top 85%',
              once: true,
            },
          }
        );
      });

      // Map section entrance — dramatic reveal
      gsap.fromTo('.map-section',
        {
          opacity: 0,
          y: 100,
          scale: 0.95,
          filter: 'blur(14px)',
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.8,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.map-section',
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Map section header text stagger
      gsap.from('.map-header-text', {
        opacity: 0,
        y: 40,
        filter: 'blur(10px)',
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.map-section',
          start: 'top 78%',
          once: true,
        },
      });

      // Decorative glow orb parallax
      gsap.to('.parallax-orb-1', {
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });
      gsap.to('.parallax-orb-2', {
        y: -40,
        x: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Counter animation — runs when store data arrives
  const hasAnimatedRef = useRef(false);
  useEffect(() => {
    if (stores.length === 0 || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const statCards = gsap.utils.toArray('.stat-card') as HTMLElement[];
    statCards.forEach((card) => {
      const numberEl = card.querySelector('.stat-number') as HTMLElement | null;
      if (!numberEl) return;
      const raw = numberEl.getAttribute('data-value') || '';

      // "24/7" and other non-numeric values: just display directly, no animation
      const pureDigits = raw.replace(/\D/g, '');
      if (!pureDigits || raw.includes('/')) {
        numberEl.textContent = raw;
        return;
      }

      const numericPart = parseInt(pureDigits, 10);
      const suffix = raw.replace(/[0-9]/g, '');

      const counter = { val: 0 };
      gsap.to(counter, {
        val: numericPart,
        duration: 2.5,
        delay: 0.3,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.stats-section',
          start: 'top 82%',
          once: true,
        },
        onUpdate() {
          numberEl.textContent = Math.round(counter.val) + suffix;
        },
      });
    });
  }, [stores]);

  /* ─── Dynamic stats computed from DB data ─── */
  const storeCount = stores.length;
  const cityCount = new Set(stores.map((s) => s.city)).size;
  const stats = [
    {
      number: String(storeCount), label: 'Partner Stores', icon: Store,
      gradient: '#C12126, transparent 40%, #FAEDD3, transparent 60%, #C12126',
      iconBg: 'bg-gradient-to-br from-red/10 to-red/[0.03]',
      iconColor: 'text-red',
      numberGradient: 'linear-gradient(135deg, #C12126 0%, #8B1A1E 100%)',
      glowColor: 'rgba(193,33,38,0.1)',
      accentColor: '#C12126',
    },
    {
      number: String(cityCount), label: 'Cities Covered', icon: MapPin,
      gradient: '#003048, transparent 40%, #A8D8EA, transparent 60%, #003048',
      iconBg: 'bg-gradient-to-br from-navy/10 to-navy/[0.03]',
      iconColor: 'text-navy',
      numberGradient: 'linear-gradient(135deg, #003048 0%, #0070A0 100%)',
      glowColor: 'rgba(0,48,72,0.1)',
      accentColor: '#003048',
    },
    {
      number: '100%', label: 'Island Coverage', icon: Shield,
      gradient: '#C12126, transparent 40%, #003048, transparent 60%, #C12126',
      iconBg: 'bg-gradient-to-br from-red/8 to-navy/[0.03]',
      iconColor: 'text-red',
      numberGradient: 'linear-gradient(135deg, #C12126 0%, #003048 100%)',
      glowColor: 'rgba(193,33,38,0.07)',
      accentColor: '#C12126',
    },
    {
      number: '24/7', label: 'Always Online', icon: Globe,
      gradient: '#003048, transparent 40%, #C12126, transparent 60%, #003048',
      iconBg: 'bg-gradient-to-br from-navy/10 to-red/[0.03]',
      iconColor: 'text-navy',
      numberGradient: 'linear-gradient(135deg, #003048 0%, #C12126 100%)',
      glowColor: 'rgba(0,48,72,0.07)',
      accentColor: '#003048',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-cream relative">
      {/* ─── Parallax Glow Orbs ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="parallax-orb-1 absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-red/[0.04] blur-[120px]" />
        <div className="parallax-orb-2 absolute top-[50%] right-[5%] w-[400px] h-[400px] rounded-full bg-navy/[0.04] blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[350px] h-[350px] rounded-full bg-red/[0.03] blur-[100px]" />
      </div>

      {/* ─── Dark Navy Hero ─── */}
      <section className="relative bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-32 pb-24 overflow-hidden">
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
            ✦ Find Us ✦
          </motion.span>
          <h1 className="hero-text text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-5">
            Where to Buy
          </h1>
          <p className="hero-text text-cream/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Discover Mahkota Taiwan products at <span className="text-cream/90 font-semibold">{storeCount || '...'}</span> retail locations across <span className="text-cream/90 font-semibold">{cityCount || '...'} cities</span> in Taiwan
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

      {/* ─── Stats Section — Clean & Compact ─── */}
      <section className="stats-section relative py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="stat-card group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 md:p-6 text-center transition-all duration-500 ease-out hover:-translate-y-1"
                style={{ boxShadow: '0 1px 3px rgba(0,48,72,0.06), 0 0 0 1px rgba(0,48,72,0.04)' }}
              >
                {/* Compact icon */}
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4"
                  style={{ background: idx % 2 === 0 ? 'rgba(193,33,38,0.08)' : 'rgba(0,48,72,0.07)' }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: idx % 2 === 0 ? '#C12126' : '#003048' }} />
                </div>

                {/* Number — clean single color */}
                <div
                  className="stat-number text-2xl md:text-3xl font-heading font-bold mb-1.5 tracking-[-0.02em] leading-none text-navy"
                  data-value={stat.number}
                >
                  {stat.number.includes('/') ? stat.number : loading ? '\u2014' : '0'}
                </div>

                {/* Label */}
                <div className="text-navy/35 text-[10px] font-semibold uppercase tracking-[0.2em]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Interactive Map Section ─── */}
      <section className="map-section relative pb-20 md:pb-32">
        <DecorativeShapes />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="map-header-text inline-block text-red/80 text-sm font-semibold tracking-[0.25em] uppercase">
              Interactive Map
            </span>
            <h2 className="map-header-text text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mt-3 mb-4">
              Find a Store Near You
            </h2>
            <p className="map-header-text text-navy/50 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Click on any pin to see store details, contact information, and get directions
            </p>
            <motion.div
              className="map-header-text w-20 h-1 bg-gradient-to-r from-red to-red/40 mx-auto mt-5 rounded-full"
              animate={{ scaleX: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Map with premium frame */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-red/10 via-transparent to-navy/10 rounded-[2.5rem] blur-xl opacity-60" />

            {/* Map wrapper */}
            <div className="relative rounded-[2rem] overflow-hidden border border-cream-dark/20 shadow-[0_25px_80px_-15px_rgba(0,48,72,0.12)]">
              {!loading && <StoreMap stores={stores} />}
              {loading && (
                <div className="w-full h-[600px] sm:h-[750px] lg:h-[900px] bg-cream-light flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-red border-t-transparent rounded-full animate-spin" />
                    <p className="text-navy/40 text-sm">Loading stores...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
