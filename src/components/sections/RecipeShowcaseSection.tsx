'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, ArrowRight, Flame, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Recipe {
  id: string;
  title_en: string | null;
  title_id: string | null;
  title_zh: string | null;
  excerpt_en: string | null;
  excerpt_id: string | null;
  excerpt_zh: string | null;
  image_url: string | null;
  slug: string | null;
  published_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  3D Rotating Cylinder Carousel                                      */
/* ------------------------------------------------------------------ */
function CylinderCarousel({
  recipes,
  locale,
}: {
  recipes: Recipe[];
  locale: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const angleRef = useRef(0);
  const velocityRef = useRef(0.15);
  const targetVelocityRef = useRef(0.15);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const count = recipes.length;
  const angleStep = 360 / count;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { isVisibleRef.current = e.isIntersecting; }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Radius: bigger on desktop for cinematic feel
  const radius = isMobile ? 220 : 380;

  const animate = useCallback(() => {
    if (!isVisibleRef.current) { rafRef.current = requestAnimationFrame(animate); return; }
    // Smooth velocity interpolation
    velocityRef.current += (targetVelocityRef.current - velocityRef.current) * 0.03;
    angleRef.current += velocityRef.current;

    const cards = containerRef.current?.querySelectorAll('.carousel-card');
    if (!cards) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      const cardAngle = (angleRef.current + i * angleStep) * (Math.PI / 180);
      const x = Math.sin(cardAngle) * radius;
      const z = Math.cos(cardAngle) * radius;
      const scale = 0.55 + (z + radius) / (2 * radius) * 0.45;
      const opacity = 0.3 + (z + radius) / (2 * radius) * 0.7;
      const blur = 0;

      el.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
      el.style.opacity = `${opacity}`;
      el.style.filter = 'none';
      el.style.zIndex = `${Math.round(z + radius)}`;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [angleStep, radius]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Pause on hover
  useEffect(() => {
    if (hoveredIndex !== null) {
      targetVelocityRef.current = 0;
    } else {
      targetVelocityRef.current = 0.15;
    }
  }, [hoveredIndex]);

  // Drag to rotate
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    targetVelocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    angleRef.current += dx * 0.3;
    lastXRef.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    targetVelocityRef.current = 0.15;
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ height: isMobile ? '380px' : '480px', perspective: '1200px' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Center reference point */}
      <div
        ref={containerRef}
        className="absolute left-1/2 select-none touch-none"
        style={{
          top: isMobile ? '50%' : '50%',
          transformStyle: 'preserve-3d',
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      >
        {recipes.map((recipe, i) => {
          const title = getLocalizedField(recipe, 'title', locale) || recipe.title_en || '';
          return (
            <Link
              key={recipe.id}
              href={`/${locale}/recipes/${recipe.slug || recipe.id}`}
              className="carousel-card absolute will-change-transform"
              style={{
                width: isMobile ? '200px' : '280px',
                height: isMobile ? '270px' : '360px',
                marginLeft: isMobile ? '-100px' : '-140px',
                marginTop: isMobile ? '-135px' : '-180px',
                transition: 'filter 0.3s ease',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(e) => { if (isDraggingRef.current) e.preventDefault(); }}
            >
              <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden group shadow-2xl shadow-black/20">
                {/* Recipe image */}
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="280px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-red/80 to-navy" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Glass shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ChefHat className="w-3.5 h-3.5 text-red" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">Recipe</span>
                  </div>
                  <h3 className="text-white font-heading font-bold text-sm sm:text-base leading-tight line-clamp-2 mb-1.5 drop-shadow-lg">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span className="text-red text-xs font-semibold">View Recipe</span>
                    <ArrowRight className="w-3 h-3 text-red" />
                  </div>
                </div>

                {/* Top decorative badge */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Flame className="w-4 h-4 text-red" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-navy to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-navy to-transparent z-10 pointer-events-none" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Particles Background                                      */
/* ------------------------------------------------------------------ */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-red/20"
          style={{
            width: `${2 + (i % 4) * 1.5}px`,
            height: `${2 + (i % 4) * 1.5}px`,
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            animation: `particleFloat ${6 + (i % 5) * 2}s ease-in-out infinite`,
            animationDelay: `${(i % 8) * 0.5}s`,
            opacity: 0.3 + (i % 3) * 0.15,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Section                                                       */
/* ------------------------------------------------------------------ */
export default function RecipeShowcaseSection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Fetch recipe articles
  useEffect(() => {
    async function fetchRecipes() {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title_en, title_id, title_zh, excerpt_en, excerpt_id, excerpt_zh, image_url, slug, published_at')
        .eq('type', 'recipe')
        .order('published_at', { ascending: false })
        .limit(9);
      if (!error && data) setRecipes(data);
    }
    fetchRecipes();
  }, []);

  // GSAP scroll entrance
  useEffect(() => {
    if (!sectionRef.current || !headingRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current!.children,
        { opacity: 0, y: 80, scale: 0.7, rotateX: -40, filter: 'blur(2px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 1.8,
          stagger: 0.15,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  if (recipes.length === 0) return null;

  const heading = locale === 'id' ? 'Resep Inspirasi' : locale === 'zh-TW' ? '靈感食譜' : 'Recipe Inspirations';
  const subtitle = locale === 'id'
    ? 'Temukan resep lezat dengan produk Mahkota Taiwan'
    : locale === 'zh-TW'
    ? '探索使用皇冠台灣產品的美味食譜'
    : 'Discover delicious recipes crafted with Mahkota Taiwan products';
  const ctaText = locale === 'id' ? 'Lihat Semua Resep' : locale === 'zh-TW' ? '查看所有食譜' : 'View All Recipes';

  return (
    <section
      ref={sectionRef}
      className="relative py-16 sm:py-24 bg-navy overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">

<div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(rgba(250,237,211,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <FloatingParticles />

      {/* Top wave separator */}
      <div className="absolute -top-px left-0 right-0 z-10">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-[40px] sm:h-[60px] rotate-180">
          <path d="M0 60V30C360 5 720 15 1080 8C1260 4 1350 12 1440 25V60H0Z" fill="var(--color-cream-deeper)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-6 sm:mb-10 px-6" style={{ perspective: '800px' }}>
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-red" />
            <span className="text-red text-xs font-bold tracking-[0.3em] uppercase">
              {t('fromOurKitchen')}
            </span>
            <Sparkles className="w-4 h-4 text-red" />
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-[1.05]">
            {heading}
          </h2>

          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent mx-auto mb-4" />

          <p className="text-cream/40 max-w-lg mx-auto text-base sm:text-lg tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* 3D Cylinder Carousel */}
        <CylinderCarousel recipes={recipes} locale={locale} />

        {/* CTA Button */}
        <div className="text-center mt-6 sm:mt-10 px-6">
          <Link
            href={`/${locale}/recipes`}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red to-red/80 text-white font-heading font-bold text-sm sm:text-base tracking-wide shadow-[0_8px_32px_rgba(193,33,38,0.35)] hover:shadow-[0_12px_48px_rgba(193,33,38,0.5)] transition-all duration-500 hover:scale-105"
          >
            <ChefHat className="w-5 h-5" />
            {ctaText}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Bottom wave separator */}
      <div className="absolute -bottom-px left-0 right-0 z-10">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-[40px] sm:h-[60px]">
          <path d="M0 60V25C180 40 360 8 720 20C1080 32 1260 5 1440 18V60H0Z" fill="var(--color-cream)" />
        </svg>
      </div>
    </section>
  );
}
