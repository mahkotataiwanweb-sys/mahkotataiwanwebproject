'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { ArrowLeft, MapPin, Store } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroBackground from '@/components/effects/HeroBackground';
import type { StoreLocation } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

// Dynamic import to avoid SSR issues with Leaflet
const StoreMap = dynamic(() => import('@/components/map/StoreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-[2rem] bg-navy-dark/50 border border-cream/10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-red border-t-transparent rounded-full animate-spin" />
        <p className="text-cream/40 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

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

  // Animations
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero text entrance — premium blur reveal
      gsap.from('.hero-text', {
        opacity: 0,
        y: 50,
        filter: 'blur(12px)',
        scale: 0.95,
        duration: 1.4,
        stagger: 0.2,
        ease: 'power4.out',
      });

      // Map section entrance
      gsap.from('.map-section', {
        opacity: 0,
        y: 80,
        filter: 'blur(14px)',
        scale: 0.96,
        duration: 1.8,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.map-section',
          start: 'top 80%',
          once: true,
        },
      });

      // Stats cards entrance
      gsap.from('.stat-card', {
        opacity: 0,
        y: 50,
        filter: 'blur(10px)',
        scale: 0.92,
        duration: 1.4,
        stagger: 0.15,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.stats-section',
          start: 'top 80%',
          once: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-cream">
      {/* ─── Dark Navy Hero ─── */}
      <section className="relative bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-32 pb-20 overflow-hidden">
        <HeroBackground />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Back link */}
          <div className="hero-text mb-8">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <span className="hero-text inline-block text-red/80 text-sm font-semibold tracking-widest uppercase mb-3">
            Find Us
          </span>
          <h1 className="hero-text text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-4">
            Where to Buy
          </h1>
          <p className="hero-text text-cream/60 text-base sm:text-lg max-w-2xl mx-auto">
            Discover Mahkota Taiwan products at 300+ retail locations across the island
          </p>
          <div className="hero-text w-20 h-1 bg-red mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* ─── Stats Section ─── */}
      <section className="stats-section py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { number: '300+', label: 'Partner Stores', icon: Store },
              { number: '22', label: 'Cities Covered', icon: MapPin },
              { number: '6', label: 'Store Types', icon: Store },
              { number: '24/7', label: 'Online Available', icon: MapPin },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="stat-card bg-white/80 backdrop-blur-sm border border-cream-dark/20 rounded-2xl p-5 text-center hover:shadow-lg hover:border-red/20 transition-all duration-500 group"
              >
                <stat.icon className="w-5 h-5 text-red mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-heading font-bold text-navy mb-1">
                  {stat.number}
                </div>
                <div className="text-navy/50 text-xs font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Interactive Map Section ─── */}
      <section className="map-section pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-10">
            <span className="text-red/80 text-sm font-semibold tracking-widest uppercase">
              Interactive Map
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy mt-2 mb-3">
              Find a Store Near You
            </h2>
            <p className="text-navy/50 text-sm max-w-lg mx-auto">
              Click on any pin to see store details, contact information, and get directions
            </p>
          </div>

          {/* Map */}
          {!loading && <StoreMap stores={stores} />}
          {loading && (
            <div className="w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-[2rem] bg-navy-dark/50 border border-cream/10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red border-t-transparent rounded-full animate-spin" />
                <p className="text-cream/40 text-sm">Loading stores...</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
