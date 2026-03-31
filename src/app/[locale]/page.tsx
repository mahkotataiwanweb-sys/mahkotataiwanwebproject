'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Calendar, ArrowRight, ArrowUpRight } from 'lucide-react';
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
   BentoArticleGrid — Premium magazine layout
────────────────────────────────────────── */
function BentoArticleGrid({
  slides,
  locale,
}: {
  slides: DiscoverSlide[];
  locale: string;
}) {
  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#003048]/5 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-[#003048]/25" />
        </div>
        <p className="text-[#003048]/40 text-sm">No articles yet — check back soon!</p>
      </div>
    );
  }

  const featured = slides[0];
  const rest = slides.slice(1, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* ── FEATURED CARD — 3 columns, 2 rows ── */}
      <Link
        href={`/${locale}/articles/${featured.slug}`}
        className="lg:col-span-3 lg:row-span-2 group relative rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-auto shadow-2xl shadow-[#003048]/15 ring-1 ring-white/10"
      >
        {featured.imageUrl ? (
          <Image
            src={featured.imageUrl}
            alt={featured.title}
            fill
            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 60vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
        )}
        {/* overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        {/* glossy top */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent pointer-events-none" />

        {/* content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
          <span className="inline-block px-3 py-1 mb-3 rounded-full bg-[#C12126] text-white text-[10px] font-bold uppercase tracking-[0.15em] shadow-lg shadow-[#C12126]/30">
            Featured
          </span>
          <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 line-clamp-2 drop-shadow-lg">
            {featured.title}
          </h3>
          <p className="text-white/60 text-xs sm:text-sm line-clamp-2 max-w-lg mb-4">
            {featured.description}
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#C12126] group-hover:gap-3 transition-all duration-300">
            Read Article <ArrowRight className="w-4 h-4" />
          </span>
        </div>

        {/* hover arrow */}
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
          <ArrowUpRight className="w-5 h-5 text-white" />
        </div>
      </Link>

      {/* ── SECONDARY CARDS — 2 columns each ── */}
      {rest.map((slide, i) => (
        <Link
          key={i}
          href={`/${locale}/articles/${slide.slug}`}
          className="lg:col-span-2 group relative rounded-2xl overflow-hidden aspect-[16/9] shadow-xl shadow-[#003048]/10 ring-1 ring-white/10"
        >
          {slide.imageUrl ? (
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 40vw"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[#C12126] text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{slide.date}</p>
            <h3 className="font-heading text-sm lg:text-base font-bold text-white leading-snug mb-1 line-clamp-2">
              {slide.title}
            </h3>
            <p className="text-white/45 text-xs line-clamp-1">{slide.description}</p>
          </div>

          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>
        </Link>
      ))}
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
          DISCOVER SECTION — Premium Bento Grid
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        {/* decorative elements */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C12126]/5 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#003048]/5 blur-[100px]" />

        <div className="max-w-7xl mx-auto px-6">
          {/* ── Header ── */}
          <div ref={headerRef} className="text-center mb-14">
            <p className="text-[#C12126] text-xs tracking-[0.35em] uppercase font-bold mb-3">Discover</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#003048] tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-[#C12126] mx-auto mb-4 rounded-full" />
            <p className="text-[#003048]/45 max-w-lg mx-auto text-sm tracking-wide">
              Stay up to date with our latest events and community activities
            </p>
          </div>

          {/* ── Tab Switcher ── */}
          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-7 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'events'
                  ? 'bg-[#C12126] text-white shadow-xl shadow-[#C12126]/25 scale-[1.02]'
                  : 'bg-[#003048]/5 text-[#003048]/50 hover:bg-[#003048]/10 hover:text-[#003048]/70'
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
                  ? 'bg-[#003048] text-white shadow-xl shadow-[#003048]/25 scale-[1.02]'
                  : 'bg-[#003048]/5 text-[#003048]/50 hover:bg-[#003048]/10 hover:text-[#003048]/70'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Activities
              </span>
            </button>
          </div>

          {/* ── Bento Grid ── */}
          <div ref={gridRef}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 25, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
              >
                <BentoArticleGrid
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#003048]/5 text-[#003048] text-sm font-semibold hover:bg-[#003048] hover:text-white transition-all duration-300 group"
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
