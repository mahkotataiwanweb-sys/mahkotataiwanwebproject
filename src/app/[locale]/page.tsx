'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
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

/* ------------------------------------------------------------------ */
/*  Types & config                                                     */
/* ------------------------------------------------------------------ */
interface UnifiedSlide {
  title: string;
  description: string;
  imageUrl: string | null;
  categoryLabel: string;
  categoryHref: string;
  categoryIcon: typeof Calendar;
}

const CATEGORY_META: Record<string, { label: string; href: string; icon: typeof Calendar }> = {
  event: { label: 'Event', href: '/events', icon: Calendar },
  activity: { label: 'Activity', href: '/lifestyle', icon: Sparkles },
};

/* ------------------------------------------------------------------ */
/*  StackedCardSlider                                                  */
/* ------------------------------------------------------------------ */
function StackedCardSlider({ 
  slides, 
  locale, 
  label,
  accentColor = 'bg-red',
  delayOffset = 0,
}: { 
  slides: UnifiedSlide[]; 
  locale: string; 
  label: string;
  accentColor?: string;
  delayOffset?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const VISIBLE = Math.min(4, slides.length);

  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setActiveIndex((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsAnimating(false), 1600);
      }, 5500);
      return () => clearInterval(interval);
    }, delayOffset);
    return () => clearTimeout(timer);
  }, [slides.length, isHovered, delayOffset]);

  if (slides.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-gradient-to-br from-navy to-navy/80 shadow-lg ring-1 ring-white/10">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Sparkles className="w-12 h-12 text-white/30 mb-3" />
          <span className="text-white/50 text-sm font-medium">Coming Soon</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section label — larger, bolder, more prominent */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-3 h-3 rounded-full ${accentColor} shadow-[0_0_12px_rgba(193,33,38,0.5)]`} />
        <span className="text-navy font-heading font-bold text-base sm:text-lg uppercase tracking-[0.15em]">{label}</span>
        <span className="ml-auto text-navy/40 text-sm font-mono font-semibold">
          {String(activeIndex + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
        </span>
      </div>

      {/* Card stack container */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1]" style={{ perspective: '1200px' }}>
        {slides.map((slide, i) => {
          let pos = i - activeIndex;
          if (pos < 0) pos += slides.length;
          const isVisible = pos < VISIBLE;
          const isFront = pos === 0;

          return (
            <motion.div
              key={`${label}-${i}`}
              className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform"
              animate={{
                y: isVisible ? pos * 18 : -80,
                x: isVisible ? pos * 5 : 0,
                scale: isVisible ? 1 - pos * 0.035 : 0.85,
                opacity: isVisible ? 1 - pos * 0.2 : 0,
                rotateX: isVisible ? pos * -1.8 : -10,
                zIndex: isVisible ? VISIBLE - pos + 1 : 0,
                filter: isFront ? 'blur(0px) brightness(1)' : `blur(${pos * 0.6}px) brightness(${1 - pos * 0.05})`,
              }}
              transition={{
                duration: 1.5,
                ease: [0.22, 0.68, 0, 1.04],
              }}
              style={{ 
                transformOrigin: 'center 85%',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Card background */}
              <Link
                href={`/${locale}${slide.categoryHref}`}
                className="block absolute inset-0 group"
              >
                {slide.imageUrl ? (
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title || label}
                    fill
                    className="object-cover transition-transform duration-[8s] ease-linear group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 90vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/90 to-navy-dark" />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5 group-hover:from-black/85 transition-all duration-500" />

                {/* Glossy top reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />

                {/* Subtle edge shadow for each stacked card */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] pointer-events-none" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <AnimatePresence mode="wait">
                    {isFront && (
                      <motion.div
                        key={`content-${activeIndex}`}
                        initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 0.68, 0, 1] }}
                      >
                        <h3 className="text-white font-bold text-lg sm:text-xl lg:text-2xl mb-1.5 line-clamp-1 drop-shadow-lg">
                          {slide.title}
                        </h3>
                        <p className="text-white/65 text-xs sm:text-sm line-clamp-2 max-w-xl">
                          {slide.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hover arrow indicator */}
                {isFront && (
                  <div className="absolute top-4 sm:top-5 right-4 sm:right-5 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                )}
              </Link>

              {/* Edge shadow for depth on stacked cards */}
              {!isFront && isVisible && (
                <div className="absolute inset-0 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)] rounded-2xl sm:rounded-3xl pointer-events-none" />
              )}
            </motion.div>
          );
        })}

        {/* Progress bar at bottom — pushed further from card stack */}
        {slides.length > 1 && (
          <div className="absolute -bottom-12 left-0 right-0 flex gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveIndex(i); setIsAnimating(true); setTimeout(() => setIsAnimating(false), 1600); }}
                className="relative h-1 flex-1 rounded-full overflow-hidden bg-navy/10"
              >
                {i === activeIndex && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${accentColor === 'bg-navy' ? 'bg-navy' : 'bg-red'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5.5, ease: 'linear' }}
                    style={{ transformOrigin: 'left' }}
                    key={`progress-${activeIndex}`}
                  />
                )}
                {i < activeIndex && (
                  <div className={`absolute inset-0 rounded-full ${accentColor === 'bg-navy' ? 'bg-navy/40' : 'bg-red/40'}`} />
                )}
              </button>
            ))}
          </div>
        )}
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
  const [eventSlides, setEventSlides] = useState<UnifiedSlide[]>([]);
  const [activitySlides, setActivitySlides] = useState<UnifiedSlide[]>([]);

  /* ---------- Fetch all content in parallel ---------- */
  useEffect(() => {
    async function fetchAll() {
      const [eventsRes, lifestyleRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .order('published_at', { ascending: false })
          .limit(4),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .order('published_at', { ascending: false })
          .limit(4),
      ]);

      const toSlides = (articles: Article[] | null, catKey: string): UnifiedSlide[] => {
        const meta = CATEGORY_META[catKey];
        return (articles || [])
          .filter((item) => getLocalizedField(item, 'title', locale))
          .map((item) => ({
            title: getLocalizedField(item, 'title', locale) || '',
            description: getLocalizedField(item, 'excerpt', locale) || '',
            imageUrl: item.image_url || null,
            categoryLabel: meta.label,
            categoryHref: meta.href,
            categoryIcon: meta.icon,
          }));
      };

      setEventSlides(toSlides(eventsRes.data as Article[] | null, 'event'));
      setActivitySlides(toSlides(lifestyleRes.data as Article[] | null, 'activity'));
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

      {/* Recipe Showcase — Premium 3D Rotating Carousel */}
      <RecipeShowcaseSection />

      {/* Discover Section — Dual Stacked Card Sliders */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-16">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Discover
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">
              Stay up to date with our latest events and community activities
            </p>
          </div>

          {/* Two Stacked Card Sliders — 30% smaller on desktop, centered */}
          <div ref={sliderWrapRef} className="space-y-20 lg:max-w-[55%] lg:mx-auto">
            <StackedCardSlider
              slides={eventSlides}
              locale={locale}
              label="Events"
              accentColor="bg-red"
              delayOffset={0}
            />
            <StackedCardSlider
              slides={activitySlides}
              locale={locale}
              label="Activities"
              accentColor="bg-navy"
              delayOffset={4000}
            />
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />

    </>
  );
}
