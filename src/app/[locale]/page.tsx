'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  ShoppingBag,
  ChefHat,
  MapPin,
  Camera,
  Heart,
  TrendingUp,
  Store,
  Package,
  Users,
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
   Animated Counter
────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;
    const el = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: value,
            duration: 2,
            ease: 'power3.out',
            onUpdate: () => {
              el.textContent = Math.round(obj.val).toLocaleString() + suffix;
            },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ──────────────────────────────────────────
   Interactive Bento Tile
────────────────────────────────────────── */
function BentoTile({
  href,
  icon: Icon,
  title,
  description,
  className = '',
  accentColor = 'bg-red/10',
  iconColor = 'text-red',
  children,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  accentColor?: string;
  iconColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`bento-tile group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-15px_rgba(0,48,72,0.2)] ${className}`}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-red/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 h-full flex flex-col p-6 sm:p-7">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl ${accentColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-300`} />
        </div>

        {/* Content */}
        <h3 className="font-heading text-lg sm:text-xl font-bold text-navy mb-1.5 group-hover:text-navy/90 transition-colors">
          {title}
        </h3>
        <p className="text-navy/45 text-sm leading-relaxed flex-1">
          {description}
        </p>

        {children}

        {/* Arrow */}
        <div className="flex items-center gap-2 mt-4 text-red text-sm font-semibold">
          <span className="group-hover:translate-x-1 transition-transform duration-300">Explore</span>
          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-400" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
    </Link>
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
        const tiles = gridRef.current.querySelectorAll('.bento-tile');
        gsap.fromTo(
          tiles,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        );
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
          DISCOVER SECTION — Interactive Bento Grid
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">

        {/* Wavy texture background */}
        <DiscoverWavyTexture />

        <div className="max-w-7xl mx-auto px-6">
          {/* ── Header ── */}
          <div ref={headerRef} className="text-center mb-14">
            <p className="text-[#C12126] text-xs tracking-[0.35em] uppercase font-bold mb-3">Discover</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-[#C12126] mx-auto mb-4 rounded-full" />
            <p className="text-navy/40 max-w-lg mx-auto text-sm tracking-wide">
              Your gateway to authentic Indonesian products, recipes, events, and community
            </p>
          </div>

          {/* ── Bento Grid ── */}
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-auto">

            {/* ── Featured Event (large card, spans 2 cols) ── */}
            <Link
              href={featuredArticle ? `/${locale}/articles/${featuredArticle.slug}` : `/${locale}/events`}
              className="bento-tile group relative sm:col-span-2 lg:row-span-2 rounded-3xl overflow-hidden min-h-[320px] lg:min-h-[420px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_-15px_rgba(0,48,72,0.25)]"
            >
              {/* Background Image */}
              {featuredArticle?.image_url ? (
                <Image
                  src={featuredArticle.image_url}
                  alt={featuredTitle || 'Featured'}
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
              )}

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#003048]/20 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#C12126]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-[#C12126] text-white text-[10px] font-bold uppercase tracking-[0.15em] shadow-lg">
                    <Calendar className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                    Latest Event
                  </span>
                </div>
                <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                  {featuredTitle || 'Upcoming Events'}
                </h3>
                <p className="text-white/60 text-sm line-clamp-2 mb-4 max-w-md">
                  {featuredExcerpt || 'Discover our latest community events and celebrations'}
                </p>
                <div className="flex items-center gap-2 text-white text-sm font-semibold">
                  <span>View Event</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>

            {/* ── Our Products Tile ── */}
            <BentoTile
              href={`/${locale}/products`}
              icon={ShoppingBag}
              title="Our Products"
              description="Explore 26+ authentic Indonesian products carefully curated for you"
              className="bg-white/80 backdrop-blur-sm border border-navy/[0.06] shadow-sm"
              accentColor="bg-navy/10"
              iconColor="text-navy"
            >
              <div className="flex items-center gap-4 mt-3">
                <div className="flex -space-x-2">
                  {[Package, Heart, TrendingUp].map((Ic, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-cream border-2 border-white flex items-center justify-center">
                      <Ic className="w-3 h-3 text-navy/50" />
                    </div>
                  ))}
                </div>
                <span className="text-navy/30 text-xs font-medium">26+ items</span>
              </div>
            </BentoTile>

            {/* ── Recipes Tile ── */}
            <BentoTile
              href={`/${locale}/recipes`}
              icon={ChefHat}
              title="Recipes"
              description="Cooking inspiration with authentic Indonesian flavors"
              className="bg-white/80 backdrop-blur-sm border border-navy/[0.06] shadow-sm"
              accentColor="bg-red/10"
              iconColor="text-red"
            />

            {/* ── Stats Bar (spans 2 cols) ── */}
            <div className="bento-tile sm:col-span-2 rounded-3xl bg-navy overflow-hidden relative">
              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Glow orbs */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-red/20 blur-[60px]" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-cream/10 blur-[50px]" />

              <div className="relative z-10 p-6 sm:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-4 h-4 text-red/70" />
                  <span className="text-cream/40 text-xs tracking-[0.2em] uppercase font-semibold">Our Impact</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { value: 300, suffix: '+', label: 'Partner Stores', icon: Store },
                    { value: 26, suffix: '+', label: 'Products', icon: Package },
                    { value: 1, suffix: 'M+', label: 'Customers', icon: Users },
                    { value: 4, suffix: '+', label: 'Years Trusted', icon: Heart },
                  ].map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <div key={stat.label} className="text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                          <StatIcon className="w-3.5 h-3.5 text-red/60" />
                          <span className="font-heading text-2xl sm:text-3xl font-bold text-white">
                            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                          </span>
                        </div>
                        <p className="text-cream/35 text-xs font-medium">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Latest Activity (medium card, spans 2 cols) ── */}
            <Link
              href={latestActivity ? `/${locale}/articles/${latestActivity.slug}` : `/${locale}/lifestyle`}
              className="bento-tile group relative sm:col-span-2 rounded-3xl overflow-hidden min-h-[220px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,48,72,0.2)]"
            >
              {latestActivity?.image_url ? (
                <Image
                  src={latestActivity.image_url}
                  alt={activityTitle || 'Activity'}
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#004A6E] to-[#002236]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-red/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.15em] border border-white/10">
                    <Sparkles className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                    Activity
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-white leading-snug mb-1 drop-shadow-md">
                  {activityTitle || 'Community Activities'}
                </h3>
                <p className="text-white/50 text-sm line-clamp-2 max-w-lg">
                  {activityExcerpt || 'See how our community enjoys Mahkota Taiwan products'}
                </p>
              </div>
            </Link>

            {/* ── Find a Store Tile ── */}
            <BentoTile
              href={`/${locale}/where-to-buy`}
              icon={MapPin}
              title="Find a Store"
              description="300+ partner stores across Taiwan — find one near you"
              className="bg-white/80 backdrop-blur-sm border border-navy/[0.06] shadow-sm"
              accentColor="bg-red/10"
              iconColor="text-red"
            />

            {/* ── Gallery Tile ── */}
            <BentoTile
              href={`/${locale}/gallery`}
              icon={Camera}
              title="Gallery"
              description="Browse photos from our events and community moments"
              className="bg-white/80 backdrop-blur-sm border border-navy/[0.06] shadow-sm"
              accentColor="bg-navy/10"
              iconColor="text-navy"
            />
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
