'use client';

import { useRef, useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';
import type { GalleryImage } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */
interface SlideItem {
  title: string;
  description: string;
  imageUrl: string | null;
}

interface CategoryConfig {
  key: string;
  label: string;
  href: string;
  icon: typeof ChefHat;
  interval: number;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'recipes', label: 'Recipes', href: '/recipes', icon: ChefHat, interval: 4000 },
  { key: 'event', label: 'Event', href: '/events', icon: Calendar, interval: 4500 },
  { key: 'activity', label: 'Activity', href: '/lifestyle', icon: Sparkles, interval: 5000 },
  { key: 'gallery', label: 'Gallery', href: '/gallery', icon: ImageIcon, interval: 5500 },
];

/* ------------------------------------------------------------------ */
/*  ContentSliderCard                                                  */
/* ------------------------------------------------------------------ */
function ContentSliderCard({
  category,
  items,
  locale,
}: {
  category: CategoryConfig;
  items: SlideItem[];
  locale: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const Icon = category.icon;

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, category.interval);
    return () => clearInterval(id);
  }, [items.length, category.interval]);

  /* Empty state */
  if (items.length === 0) {
    return (
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-navy to-navy/80 shadow-lg ring-1 ring-white/10">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-12 h-12 text-white/30 mb-3" />
          <span className="text-white/50 text-sm font-medium">Coming Soon</span>
        </div>
        {/* Category badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Icon className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold uppercase tracking-wider">{category.label}</span>
        </div>
      </div>
    );
  }

  const current = items[activeIndex];

  return (
    <Link
      href={`/${locale}${category.href}`}
      className="group block relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ring-1 ring-black/5 hover:ring-red/20"
    >
      {/* Background image with AnimatePresence crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 will-change-transform"
        >
          {current.imageUrl ? (
            <Image
              src={current.imageUrl}
              alt={current.title || category.label}
              fill
              className="object-cover transition-transform duration-[8s] ease-linear group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/80" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />

      {/* Category badge top-left */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <Icon className="w-4 h-4 text-white" />
        <span className="text-white text-xs font-semibold uppercase tracking-wider">{category.label}</span>
      </div>

      {/* Content overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{current.title}</h3>
            <p className="text-white/70 text-sm line-clamp-2">{current.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex gap-1.5 mt-3">
            {items.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === activeIndex ? 'w-6 bg-red' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hover arrow */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ArrowRight className="w-4 h-4 text-white" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  HomePage                                                           */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ---------- Dynamic content state ---------- */
  const [contentMap, setContentMap] = useState<Record<string, SlideItem[]>>({
    recipes: [],
    event: [],
    activity: [],
    gallery: [],
  });

  /* ---------- Fetch all content in parallel ---------- */
  useEffect(() => {
    async function fetchAll() {
      const [recipesRes, eventsRes, lifestyleRes, galleryRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'recipe')
          .order('published_at', { ascending: false })
          .limit(3),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .order('published_at', { ascending: false })
          .limit(3),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .order('published_at', { ascending: false })
          .limit(3),
        supabase
          .from('gallery_images')
          .select('*')
          .eq('is_active', true)
          .order('event_date', { ascending: false })
          .limit(3),
      ]);

      const toSlides = (articles: Article[] | null): SlideItem[] =>
        (articles || []).map((item) => ({
          title: getLocalizedField(item, 'title', locale) || '',
          description: getLocalizedField(item, 'excerpt', locale) || '',
          imageUrl: item.image_url || null,
        }));

      const gallerySlides: SlideItem[] = ((galleryRes.data as GalleryImage[] | null) || []).map((item) => ({
        title: item.event_name || '',
        description: getLocalizedField(item, 'description', locale) || '',
        imageUrl: item.image_url || null,
      }));

      setContentMap({
        recipes: toSlides(recipesRes.data as Article[] | null),
        event: toSlides(eventsRes.data as Article[] | null),
        activity: toSlides(lifestyleRes.data as Article[] | null),
        gallery: gallerySlides,
      });
    }

    fetchAll();
  }, [locale]);

  /* ---------- GSAP animations ---------- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 50, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            stagger: 0.12,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Card animations with scale-in
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 60, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <HeroSlider />

      {/* Elegant divider between Hero and Marquee */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      {/* Scroll indicator */}
      <div className="relative -mt-8 flex justify-center z-10 pointer-events-none">
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.div
            className="w-px h-6 bg-gradient-to-b from-navy/30 to-transparent"
            animate={{ scaleY: [1, 0.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      <MarqueeSection />

      {/* Product Catalog Showcase */}
      <ProductCatalogSection />

      {/* Discover Section */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Decorative */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
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

          {/* Dynamic Content Slider Cards — 2×2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {CATEGORIES.map((category, index) => (
              <div
                key={category.key}
                ref={(el) => { cardRefs.current[index] = el; }}
              >
                <ContentSliderCard
                  category={category}
                  items={contentMap[category.key] || []}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider between Discover and Video */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <VideoShowcaseSection />

      {/* Divider between Video and WhereToBuy */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <WhereToBuySection />
    </>
  );
}
