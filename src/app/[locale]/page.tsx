'use client';

import { useRef, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import HeroSlider from '@/components/sections/HeroSlider';
import MarqueeSection from '@/components/sections/MarqueeSection';
import ProductCatalogSection from '@/components/sections/ProductCatalogSection';
import RecipeShowcaseSection from '@/components/sections/RecipeShowcaseSection';
import VideoShowcaseSection from '@/components/sections/VideoShowcaseSection';
import WhereToBuySection from '@/components/sections/WhereToBuySection';
import SandTexture from '@/components/effects/SandTexture';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────
   WavyTextureBackground — same as ProductCatalog
────────────────────────────────────────── */
function DiscoverWavyTexture() {
  const rowHeight = 30;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wavy-discover" x="0" y="0" width="180" height={rowHeight} patternUnits="userSpaceOnUse">
            <path d={`M0,${rowHeight/2} Q30,${rowHeight/2-8} 45,${rowHeight/2} T90,${rowHeight/2} Q120,${rowHeight/2+8} 135,${rowHeight/2} T180,${rowHeight/2}`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          </pattern>
          <pattern id="wavy-discover-2" x="40" y="7" width="220" height={rowHeight+5} patternUnits="userSpaceOnUse">
            <path d={`M0,${(rowHeight+5)/2} Q40,${(rowHeight+5)/2-6} 55,${(rowHeight+5)/2} T110,${(rowHeight+5)/2} Q150,${(rowHeight+5)/2+6} 165,${(rowHeight+5)/2} T220,${(rowHeight+5)/2}`} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wavy-discover)" />
        <rect width="100%" height="100%" fill="url(#wavy-discover-2)" />
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────
   HomePage
────────────────────────────────────────── */
export default function HomePage() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  /* state */
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [latestActivity, setLatestActivity] = useState<Article | null>(null);

  /* ── fetch featured content ── */
  useEffect(() => {
    async function fetchFeatured() {
      const [evRes, lifeRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1),
      ]);

      if (evRes.data?.[0]) setFeaturedArticle(evRes.data[0] as Article);
      if (lifeRes.data?.[0]) setLatestActivity(lifeRes.data[0] as Article);
    }
    fetchFeatured();
  }, []);

  /* ── GSAP flip-right scroll animation (alphornsound.ch style) ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Header fade-up */
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 45 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true },
          },
        );
      }

      /* Flip-right animation for each card column — exact alphornsound.ch behavior */
      if (cardsContainerRef.current) {
        const cards = cardsContainerRef.current.querySelectorAll('.discover-flip-card');
        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            {
              opacity: 0,
              rotateY: -90,
              transformOrigin: 'right center',
              transformPerspective: 1200,
            },
            {
              opacity: 1,
              rotateY: 0,
              duration: 1.5,
              delay: i * 0.3,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: cardsContainerRef.current,
                start: 'top 80%',
                once: true,
              },
            },
          );
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const featuredTitle = featuredArticle ? getLocalizedField(featuredArticle, 'title', locale) : '';
  const featuredExcerpt = featuredArticle ? getLocalizedField(featuredArticle, 'excerpt', locale) : '';
  const activityTitle = latestActivity ? getLocalizedField(latestActivity, 'title', locale) : '';
  const activityExcerpt = latestActivity ? getLocalizedField(latestActivity, 'excerpt', locale) : '';

  return (
    <>
      <SandTexture fixed />
      <HeroSlider />
      <MarqueeSection />
      <ProductCatalogSection />
      <RecipeShowcaseSection />

      {/* ═══════════════════════════════════════════════
          DISCOVER SECTION — Alphornsound-style Flip Cards
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-20 sm:py-28 bg-cream relative overflow-hidden">

        {/* Wavy texture background */}
        <DiscoverWavyTexture />

        <div className="max-w-6xl mx-auto px-6 sm:px-10 relative z-10">
          {/* ── Header ── */}
          <div ref={headerRef} className="text-center mb-16">
            <p className="text-[#C12126] text-xs tracking-[0.35em] uppercase font-bold mb-3">Discover</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-[#C12126] mx-auto mb-4 rounded-full" />
            <p className="text-navy/40 max-w-lg mx-auto text-sm tracking-wide">
              Stay connected with our latest events and community activities
            </p>
          </div>

          {/* ── Alphornsound-style Cards Grid ── */}
          <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">

            {/* ════════ CARD 1: EVENTS ════════ */}
            <div className="discover-flip-card" style={{ perspective: '1200px' }}>
              <Link
                href={featuredArticle ? `/${locale}/articles/${featuredArticle.slug}` : `/${locale}/events`}
                className="group block"
              >
                {/* ── Image Section ── */}
                <div className="relative mx-[-20px] sm:mx-[-40px]">
                  <div className="relative aspect-[4/3] rounded-none overflow-hidden">
                    {featuredArticle?.image_url ? (
                      <Image
                        src={featuredArticle.image_url}
                        alt={featuredTitle || 'Events'}
                        fill
                        className="object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
                    )}
                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-[#C12126]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                {/* ── White Content Card (overlapping image) ── */}
                <div className="relative -mt-16 mx-auto bg-white px-8 sm:px-10 py-8 sm:py-10 shadow-[0_15px_50px_-15px_rgba(0,48,72,0.12)] group-hover:shadow-[0_25px_60px_-15px_rgba(0,48,72,0.2)] transition-shadow duration-500">
                  {/* Red accent line at top */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[#C12126] rounded-full" />

                  <div className="text-center">
                    {/* Badge */}
                    <div className="flex justify-center mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C12126]/10 text-[#C12126] text-[10px] font-bold uppercase tracking-[0.15em]">
                        <Calendar className="w-3 h-3" />
                        Events
                      </span>
                    </div>

                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-navy mb-3 leading-tight group-hover:text-[#C12126] transition-colors duration-300">
                      {featuredTitle || 'Upcoming Events'}
                    </h3>

                    <p className="text-navy/50 text-sm leading-relaxed mb-6 line-clamp-3 max-w-sm mx-auto">
                      {featuredExcerpt || 'Discover our latest community events, celebrations, and gatherings across Taiwan'}
                    </p>

                    {/* Button — alphornsound.ch style */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-semibold tracking-wide group-hover:bg-[#C12126] transition-colors duration-300 rounded-sm">
                      <span>View Events</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* ════════ CARD 2: ACTIVITY ════════ */}
            <div className="discover-flip-card" style={{ perspective: '1200px' }}>
              <Link
                href={latestActivity ? `/${locale}/articles/${latestActivity.slug}` : `/${locale}/lifestyle`}
                className="group block"
              >
                {/* ── Image Section ── */}
                <div className="relative mx-[-20px] sm:mx-[-40px]">
                  <div className="relative aspect-[4/3] rounded-none overflow-hidden">
                    {latestActivity?.image_url ? (
                      <Image
                        src={latestActivity.image_url}
                        alt={activityTitle || 'Activity'}
                        fill
                        className="object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#004A6E] to-[#002236]" />
                    )}
                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-[#C12126]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                {/* ── White Content Card (overlapping image) ── */}
                <div className="relative -mt-16 mx-auto bg-white px-8 sm:px-10 py-8 sm:py-10 shadow-[0_15px_50px_-15px_rgba(0,48,72,0.12)] group-hover:shadow-[0_25px_60px_-15px_rgba(0,48,72,0.2)] transition-shadow duration-500">
                  {/* Red accent line at top */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[#C12126] rounded-full" />

                  <div className="text-center">
                    {/* Badge */}
                    <div className="flex justify-center mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/10 text-navy text-[10px] font-bold uppercase tracking-[0.15em]">
                        <Sparkles className="w-3 h-3" />
                        Activity
                      </span>
                    </div>

                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-navy mb-3 leading-tight group-hover:text-[#C12126] transition-colors duration-300">
                      {activityTitle || 'Community Activities'}
                    </h3>

                    <p className="text-navy/50 text-sm leading-relaxed mb-6 line-clamp-3 max-w-sm mx-auto">
                      {activityExcerpt || 'See how our community enjoys Mahkota Taiwan products in their daily life'}
                    </p>

                    {/* Button — alphornsound.ch style */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-semibold tracking-wide group-hover:bg-[#C12126] transition-colors duration-300 rounded-sm">
                      <span>View Activity</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
