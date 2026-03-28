'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, Sparkles, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';
import HeroSlider from '@/components/sections/HeroSlider';
import MarqueeSection from '@/components/sections/MarqueeSection';
import ProductCatalogSection from '@/components/sections/ProductCatalogSection';
import VideoShowcaseSection from '@/components/sections/VideoShowcaseSection';
import WhereToBuySection from '@/components/sections/WhereToBuySection';
import SandTexture from '@/components/effects/SandTexture';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';
import type { GalleryImage } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Types & config                                                     */
/* ------------------------------------------------------------------ */
interface UnifiedSlide {
  title: string;
  description: string;
  imageUrl: string | null;
  categoryLabel: string;
  categoryHref: string;
  categoryIcon: typeof ChefHat;
}

const CATEGORY_META: Record<string, { label: string; href: string; icon: typeof ChefHat }> = {
  recipes: { label: 'Recipes', href: '/recipes', icon: ChefHat },
  event: { label: 'Event', href: '/events', icon: Calendar },
  activity: { label: 'Activity', href: '/lifestyle', icon: Sparkles },
  gallery: { label: 'Gallery', href: '/gallery', icon: ImageIcon },
};

/* Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  UnifiedDiscoverSlider                                              */
/* ------------------------------------------------------------------ */
function UnifiedDiscoverSlider({ slides, locale }: { slides: UnifiedSlide[]; locale: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, startTimer]);

  const goTo = (i: number) => {
    setDirection(i > activeIndex ? 1 : -1);
    setActiveIndex(i);
    startTimer();
  };

  if (slides.length === 0) {
    return (
      <div className="relative w-full aspect-[16/7] sm:aspect-[16/6] rounded-2xl overflow-hidden bg-gradient-to-br from-navy to-navy/80 shadow-lg ring-1 ring-white/10">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Sparkles className="w-12 h-12 text-white/30 mb-3" />
          <span className="text-white/50 text-sm font-medium">Coming Soon</span>
        </div>
      </div>
    );
  }

  const current = slides[activeIndex];
  const Icon = current.categoryIcon;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 80 : -80, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -80 : 80, scale: 0.97 }),
  };

  return (
    <div className="relative w-full">
      <Link
        href={`/${locale}${current.categoryHref}`}
        className="group block relative w-full aspect-[16/7] sm:aspect-[16/6] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 ring-1 ring-black/5 hover:ring-red/20"
      >
        {/* Background image crossfade */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 will-change-transform"
          >
            {current.imageUrl ? (
              <Image
                src={current.imageUrl}
                alt={current.title || current.categoryLabel}
                fill
                className="object-cover transition-transform duration-[8s] ease-linear group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 90vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/80" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />

        {/* Category badge top-left */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Icon className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold uppercase tracking-wider">{current.categoryLabel}</span>
        </div>

        {/* Content overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-white font-bold text-xl sm:text-2xl lg:text-3xl mb-2 line-clamp-1">{current.title}</h3>
              <p className="text-white/70 text-sm sm:text-base line-clamp-2 max-w-2xl">{current.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          {slides.length > 1 && (
            <div className="flex gap-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeIndex ? 'w-8 bg-red' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hover arrow */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </Link>

      {/* Slide counter */}
      <div className="absolute bottom-4 sm:bottom-8 right-5 sm:right-8 text-white/40 text-xs font-mono pointer-events-none">
        {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HomePage                                                           */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sliderWrapRef = useRef<HTMLDivElement>(null);

  /* ---------- Dynamic content state ---------- */
  const [allSlides, setAllSlides] = useState<UnifiedSlide[]>([]);

  /* ---------- Fetch all content in parallel ---------- */
  useEffect(() => {
    async function fetchAll() {
      const [recipesRes, eventsRes, lifestyleRes, galleryRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'recipe')
          .order('published_at', { ascending: false })
          .limit(5),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .order('published_at', { ascending: false })
          .limit(5),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .order('published_at', { ascending: false })
          .limit(5),
        supabase
          .from('gallery_images')
          .select('*')
          .eq('is_active', true)
          .order('event_date', { ascending: false })
          .limit(5),
      ]);

      const toUnified = (articles: Article[] | null, catKey: string): UnifiedSlide[] => {
        const meta = CATEGORY_META[catKey];
        return (articles || []).map((item) => ({
          title: getLocalizedField(item, 'title', locale) || '',
          description: getLocalizedField(item, 'excerpt', locale) || '',
          imageUrl: item.image_url || null,
          categoryLabel: meta.label,
          categoryHref: meta.href,
          categoryIcon: meta.icon,
        }));
      };

      const gallerySlides: UnifiedSlide[] = ((galleryRes.data as GalleryImage[] | null) || []).map((item) => ({
        title: item.event_name || '',
        description: getLocalizedField(item, 'description', locale) || '',
        imageUrl: item.image_url || null,
        categoryLabel: CATEGORY_META.gallery.label,
        categoryHref: CATEGORY_META.gallery.href,
        categoryIcon: CATEGORY_META.gallery.icon,
      }));

      const combined = [
        ...toUnified(recipesRes.data as Article[] | null, 'recipes'),
        ...toUnified(eventsRes.data as Article[] | null, 'event'),
        ...toUnified(lifestyleRes.data as Article[] | null, 'activity'),
        ...gallerySlides,
      ].filter((s) => s.title); // Only items with titles

      setAllSlides(shuffle(combined));
    }

    fetchAll();
  }, [locale]);

  /* ---------- ✨ GSAP scroll entrance for discover section ---------- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header: staggered fade-in entrance
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Slider: scale + fade entrance
      if (sliderWrapRef.current) {
        gsap.fromTo(sliderWrapRef.current,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sliderWrapRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Global sand texture — visible through all cream-colored areas */}
      <SandTexture fixed />

      <HeroSlider />
      <MarqueeSection />

      {/* Product Catalog Showcase — flush with marquee, no card-reveal gap */}
      <ProductCatalogSection />

      {/* Discover Section — Single Unified Slider */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-14">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Discover
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">
              Authentic Indonesian flavors — recipes, stories &amp; community
            </p>
            <p className="text-navy/60 max-w-lg mx-auto mt-2">
              Dive into our world of Indonesian flavors — from recipes and lifestyle stories to exciting community events.
            </p>
          </div>

          {/* Single Unified Slider */}
          <div ref={sliderWrapRef}>
            <UnifiedDiscoverSlider slides={allSlides} locale={locale} />
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />

    </>
  );
}
