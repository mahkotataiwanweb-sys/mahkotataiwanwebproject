'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Calendar, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
   Types
────────────────────────────────────────── */
interface DiscoverSlide {
  title: string;
  description: string;
  imageUrl: string | null;
  slug: string;
  date: string;
  type: string;
}

/* ──────────────────────────────────────────
   CinematicScrollShowcase — Horizontal scroll cards
────────────────────────────────────────── */
function CinematicScrollShowcase({
  slides,
  locale,
}: {
  slides: DiscoverSlide[];
  locale: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  /* Update scroll navigation state + progress bar */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    if (progressRef.current) {
      const max = el.scrollWidth - el.clientWidth;
      const progress = max > 0 ? el.scrollLeft / max : 0;
      progressRef.current.style.width = `${Math.max(10, progress * 100)}%`;
    }
  }, []);

  /* Arrow click handler */
  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -440 : 440, behavior: 'smooth' });
  }, []);

  /* GSAP card entrance — stagger from below with blur-deblur */
  useEffect(() => {
    if (!cardsContainerRef.current) return;
    const cards = cardsContainerRef.current.querySelectorAll('.discover-card');
    if (cards.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 70, filter: 'blur(14px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.1,
        },
      );
    });
    return () => ctx.revert();
  }, [slides]);

  /* Scroll listener */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState, slides]);

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-white/25" />
        </div>
        <p className="text-white/40 text-sm">No articles yet — check back soon!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hide scrollbar across browsers */}
      <style dangerouslySetInnerHTML={{ __html: `.discover-scroll::-webkit-scrollbar{display:none}` }} />

      {/* Edge fade overlays */}
      <div className="absolute left-0 top-0 bottom-6 w-8 sm:w-20 bg-gradient-to-r from-[#003048] to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-6 w-8 sm:w-20 bg-gradient-to-l from-[#003048] to-transparent z-20 pointer-events-none" />

      {/* Navigation arrows */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className={`absolute left-2 sm:left-4 top-[calc(50%-12px)] -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/25 hover:scale-110 hover:shadow-lg hover:shadow-white/10 ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className={`absolute right-2 sm:right-4 top-[calc(50%-12px)] -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/25 hover:scale-110 hover:shadow-lg hover:shadow-white/10 ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Horizontal scroll-snap container */}
      <div
        ref={scrollRef}
        className="discover-scroll flex gap-5 sm:gap-7 overflow-x-auto snap-x snap-mandatory pb-4 px-4 sm:px-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div ref={cardsContainerRef} className="flex gap-5 sm:gap-7">
          {slides.map((slide, i) => (
            <Link
              key={`${slide.slug}-${i}`}
              href={`/${locale}/articles/${slide.slug}`}
              className="discover-card snap-center flex-shrink-0 group relative rounded-2xl sm:rounded-3xl overflow-hidden min-w-[320px] sm:min-w-[420px] aspect-[3/4] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 hover:shadow-[0_25px_60px_-10px_rgba(193,33,38,0.3)] transition-shadow duration-700"
            >
              {/* Full image background */}
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 320px, 420px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#004A6E] to-[#001a2c]" />
              )}

              {/* Multi-layer gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#003048]/30 via-transparent to-transparent" />

              {/* Hover warm glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#C12126]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Glassmorphism content panel */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <div className="relative backdrop-blur-xl bg-white/[0.07] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  {/* Category badge + Date row */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C12126] text-white text-[10px] font-bold uppercase tracking-[0.12em] shadow-lg shadow-[#C12126]/40">
                      {slide.type === 'event' ? 'Event' : 'Activity'}
                    </span>
                    {slide.date && (
                      <span className="text-white/40 text-[11px] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {slide.date}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-base sm:text-lg font-bold text-white leading-snug mb-1.5 line-clamp-2 drop-shadow-md">
                    {slide.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-white/40 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
                    {slide.description}
                  </p>

                  {/* Read link with hover arrow */}
                  <div className="flex items-center gap-2 text-[#C12126] text-xs sm:text-sm font-semibold">
                    Read Article
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </div>

              {/* Top-right hover arrow */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 border border-white/15">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll progress bar */}
      <div className="mt-6 flex justify-center">
        <div className="w-40 sm:w-56 h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
          <div
            ref={progressRef}
            className="h-full rounded-full bg-gradient-to-r from-[#C12126] to-[#C12126]/50 transition-[width] duration-150 ease-out"
            style={{ width: '10%' }}
          />
        </div>
      </div>
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
  const gridRef = useRef<HTMLDivElement>(null);

  /* state */
  const [eventSlides, setEventSlides] = useState<DiscoverSlide[]>([]);
  const [activitySlides, setActivitySlides] = useState<DiscoverSlide[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'activities'>('events');

  /* ── fetch articles ── */
  useEffect(() => {
    async function fetchAll() {
      const [evRes, lifeRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(4),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(4),
      ]);

      const toSlides = (items: Article[] | null): DiscoverSlide[] =>
        (items || [])
          .filter((a) => getLocalizedField(a, 'title', locale))
          .map((a) => ({
            title: getLocalizedField(a, 'title', locale) || '',
            description: getLocalizedField(a, 'excerpt', locale) || '',
            imageUrl: a.image_url || null,
            slug: a.slug,
            date: a.published_at
              ? new Date(a.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '',
            type: a.type,
          }));

      setEventSlides(toSlides(evRes.data as Article[] | null));
      setActivitySlides(toSlides(lifeRes.data as Article[] | null));
    }
    fetchAll();
  }, [locale]);

  /* ── GSAP scroll entrance ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
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
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        );
      }

      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current,
          { opacity: 0, y: 50, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <SandTexture fixed />
      <HeroSlider />
      <MarqueeSection />
      <ProductCatalogSection />
      <RecipeShowcaseSection />

      {/* ═══════════════════════════════════════════════
          DISCOVER SECTION — Cinematic Horizontal Scroll
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-[#003048] relative overflow-hidden">
        {/* Ambient blur orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#C12126]/[0.08] blur-[150px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-[#C12126]/[0.04] blur-[100px]" />

        {/* Subtle dot grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="max-w-7xl mx-auto px-6">
          {/* ── Header ── */}
          <div ref={headerRef} className="text-center mb-14">
            <p className="text-[#C12126] text-xs tracking-[0.35em] uppercase font-bold mb-3">Discover</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-[#C12126] mx-auto mb-4 rounded-full" />
            <p className="text-[#FAF6F1]/40 max-w-lg mx-auto text-sm tracking-wide">
              Stay up to date with our latest events and community activities
            </p>
          </div>

          {/* ── Tab Switcher ── */}
          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-7 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'events'
                  ? 'bg-[#C12126] text-white shadow-xl shadow-[#C12126]/30 scale-[1.02]'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/[0.08]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Events
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-7 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'activities'
                  ? 'bg-white text-[#003048] shadow-xl shadow-white/15 scale-[1.02]'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/[0.08]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Activities
              </span>
            </button>
          </div>

          {/* ── Cinematic Scroll Showcase ── */}
          <div ref={gridRef}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 25, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
              >
                <CinematicScrollShowcase
                  slides={activeTab === 'events' ? eventSlides : activitySlides}
                  locale={locale}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── View All link ── */}
          <div className="text-center mt-10">
            <Link
              href={`/${locale}/${activeTab === 'events' ? 'events' : 'lifestyle'}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.06] text-white text-sm font-semibold hover:bg-white hover:text-[#003048] transition-all duration-300 group border border-white/[0.1] hover:border-white"
            >
              View All {activeTab === 'events' ? 'Events' : 'Activities'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
