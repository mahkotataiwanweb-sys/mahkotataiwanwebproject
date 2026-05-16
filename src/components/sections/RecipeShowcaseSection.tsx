'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, ArrowRight, Flame, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import RedWavyBackground from '@/components/ui/RedWavyBackground';
import { BLUR_DATA_URL } from '@/lib/imageBlur';

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
  const velocityRef = useRef(0.1);
  const targetVelocityRef = useRef(0.1);
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
  const radius = isMobile ? 200 : 320;

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
      targetVelocityRef.current = 0.1;
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
    targetVelocityRef.current = 0.1;
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ height: isMobile ? '320px' : '380px', perspective: '1200px' }}
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
                width: isMobile ? '180px' : '220px',
                height: isMobile ? '240px' : '290px',
                marginLeft: isMobile ? '-90px' : '-110px',
                marginTop: isMobile ? '-120px' : '-145px',
                transition: 'filter 0.3s ease',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(e) => { if (isDraggingRef.current) e.preventDefault(); }}
            >
              <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden group">
                {/* Recipe image */}
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="280px"
                    priority={i < 3}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    quality={65}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-red to-red-dark" />
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
          className="absolute rounded-full bg-white/30"
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
  const t = useEditableT('recipes');
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
      if (!error && data) {
        setRecipes(data);
        // Pre-warm via new Image() warmed the raw Supabase URL — but the
        // <Image> component reads /_next/image, so the warm-up never hit
        // the actual cache. Removed to avoid 9 wasted network requests.
      }
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

  const heading = t('heading');
  const subtitle = t('headingSub');
  const ctaText = t('viewAll');

  return (
    <section
      ref={sectionRef}
      className="relative py-12 sm:py-16 overflow-hidden"
    >
      {/* Clip-path SVG definition for wavy edges */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="recipe-section-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.08 C0.25,0.0 0.5,0.05 0.75,0.01 C0.88,0.0 1,0.04 1,0.04 L1,0.93 C0.85,0.98 0.65,1.0 0.5,0.97 C0.35,0.94 0.15,1.0 0,0.95 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Brand-red background with wavy clip edges - body pattern shows through */}
      <div className="absolute inset-0" style={{ clipPath: 'url(#recipe-section-clip)' }}>
        <RedWavyBackground />
        <FloatingParticles />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-6 sm:mb-10 px-6" style={{ perspective: '800px' }}>
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-bold tracking-[0.3em] uppercase">
              {t('fromOurKitchen')}
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-[1.05]">
            {heading}
          </h2>

          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mb-4" />

          <p className="text-white/70 max-w-lg mx-auto text-base sm:text-lg tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* 3D Cylinder Carousel */}
        <CylinderCarousel recipes={recipes} locale={locale} />

        {/* CTA Button */}
        <div className="text-center mt-6 sm:mt-10 px-6">
          <Link
            href={`/${locale}/recipes`}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-400 text-navy font-heading font-bold text-xs sm:text-sm tracking-wide shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.25)] hover:bg-yellow-300 transition-all duration-300 hover:scale-105"
          >
            <ChefHat className="w-4 h-4" />
            {ctaText}
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>


    </section>
  );
}
