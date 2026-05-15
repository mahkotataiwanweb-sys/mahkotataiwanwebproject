'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSlider from '@/components/sections/HeroSlider';
import HeroFireworksBanner from '@/components/sections/HeroFireworksBanner';
import ProductCatalogSection from '@/components/sections/ProductCatalogSection';
import RecipeShowcaseSection from '@/components/sections/RecipeShowcaseSection';
import VideoShowcaseSection from '@/components/sections/VideoShowcaseSection';
import WhereToBuySection from '@/components/sections/WhereToBuySection';
// import SandTexture from '@/components/effects/SandTexture';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────
   WavyTextureBackground
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

/* ──────────────────────────────────────
   ManualNavCard — image flip + sliding text box, user-controlled (Prev/Next)
────────────────────────────────────────── */
interface ManualNavCardProps {
  articles: Article[];
  fallbackTitle: string;
  fallbackExcerpt: string;
  fallbackHref: string;
  btnLabel: string;
  locale: string;
  /** 'left' = image on the left, text box slides in from the right (Events).
   *  'right' = mirror layout (Activity). */
  imageSide: 'left' | 'right';
}

function ManualNavCard({ articles, fallbackTitle, fallbackExcerpt, fallbackHref, btnLabel, locale, imageSide }: ManualNavCardProps) {
  const textBoxRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const count = articles.length;
  const hasMany = count > 1;

  const getArticleData = useCallback((idx: number) => {
    if (count === 0) return { title: fallbackTitle, excerpt: fallbackExcerpt, href: fallbackHref, imageUrl: '' };
    const a = articles[idx % count];
    return {
      title: getLocalizedField(a, 'title', locale) || fallbackTitle,
      excerpt: getLocalizedField(a, 'excerpt', locale) || fallbackExcerpt,
      href: `/${locale}/articles/${a.slug}`,
      imageUrl: a.image_url || '',
    };
  }, [articles, count, locale, fallbackTitle, fallbackExcerpt, fallbackHref]);

  const goNext = () => {
    if (!hasMany) return;
    setDirection(1);
    setIndex((i) => (i + 1) % count);
  };
  const goPrev = () => {
    if (!hasMany) return;
    setDirection(-1);
    setIndex((i) => (i - 1 + count) % count);
  };

  const data = getArticleData(index);
  const slideFromX = imageSide === 'left' ? 60 : -60;

  /* Layout order — image on the requested side, text box on the other. */
  const flexDir = imageSide === 'left' ? 'md:flex-row' : 'md:flex-row-reverse';

  return (
    <div className={`flex flex-col gap-2 sm:gap-3 ${flexDir} items-stretch`}>
      {/* IMAGE — flips on key change (rotateY) — no background plate so the
          card edges don't leave a ghost rectangle while mid-rotation */}
      <div className="w-full md:w-1/2" style={{ perspective: '2400px' }}>
        <Link href={data.href} className="block aspect-[4/3] relative rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={`img-${index}`}
              initial={{ rotateY: -100, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 100, opacity: 0 }}
              transition={{
                duration: 1.1,
                ease: [0.22, 0.68, 0, 1],
                opacity: { duration: 0.35 },
              }}
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.18))',
              }}
              className="absolute inset-0 rounded-2xl overflow-hidden"
            >
              {data.imageUrl ? (
                <Image src={data.imageUrl} alt={data.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 540px" priority loading="eager" quality={75} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
              )}
            </motion.div>
          </AnimatePresence>
        </Link>
      </div>

      {/* TEXT BOX — slides in from the open side after the image flips */}
      <div className="w-full md:w-1/2 flex">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`text-${index}`}
            initial={{ x: slideFromX, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -slideFromX, opacity: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0.22, 0.68, 0, 1],
              opacity: { duration: 0.5, delay: 0.5 },
            }}
            className="bg-yellow-400 rounded-2xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.10)] flex flex-col justify-between w-full"
          >
            <div>
              <h3 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-navy mb-3 leading-tight">{data.title}</h3>
              <p className="text-navy/80 text-sm leading-relaxed mb-5">{data.excerpt}</p>
            </div>

            <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
              <Link
                href={data.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:bg-red-dark transition-colors duration-300"
              >
                <span>{btnLabel}</span>
                <span aria-hidden>→</span>
              </Link>

              {hasMany && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous"
                    className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy-light transition-colors"
                  >
                    ‹
                  </button>
                  <span className="text-navy/70 text-xs font-semibold tabular-nums px-1">
                    {index + 1} / {count}
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next"
                    className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy-light transition-colors"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function HomePage() {
  const locale = useLocale();
  const t = useEditableT('discover', 'home');
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const topWrapRef = useRef<HTMLDivElement>(null);
  const bottomWrapRef = useRef<HTMLDivElement>(null);

  /* state — fetch ALL articles for each type */
  const [events, setEvents] = useState<Article[]>([]);
  const [activities, setActivities] = useState<Article[]>([]);

  useEffect(() => {
    async function fetchAll() {
      const [evRes, lifeRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(10),
        supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(10),
      ]);

      if (evRes.data) setEvents(evRes.data as Article[]);
      if (lifeRes.data) setActivities(lifeRes.data as Article[]);

      // Preload every article cover so Discover flips are instant.
      const all = [...(evRes.data || []), ...(lifeRes.data || [])] as Article[];
      all.forEach((a) => {
        if (a.image_url) {
          const img = new window.Image();
          img.src = a.image_url;
        }
      });
    }
    fetchAll();
  }, []);

  /* Header animation */
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 50, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.6,
            stagger: 0.2,
            ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <HeroSlider />
      <HeroFireworksBanner />
      <ProductCatalogSection />
      <RecipeShowcaseSection />

      {/* ═══════════════════════════════════════════════
          DISCOVER — manual nav (Prev/Next), side-by-side
          Top: image LEFT, yellow text box RIGHT
          Bottom: image RIGHT, yellow text box LEFT
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 relative z-10">
          <div ref={headerRef} className="text-center mb-12 sm:mb-16">
            <p className="text-[#C12126] text-sm sm:text-base tracking-[0.35em] uppercase font-bold mb-3">{t('label')}</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              {t('title')}
            </h2>
            <div className="w-16 h-[2px] bg-[#C12126] mx-auto mb-4 rounded-full" />
            <p className="text-navy/40 max-w-lg mx-auto text-base sm:text-lg tracking-wide">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-12 sm:gap-16">
            <div ref={topWrapRef}>
              <ManualNavCard
                articles={events}
                fallbackTitle={t('fallbackTitle1')}
                fallbackExcerpt={t('fallbackExcerpt1')}
                fallbackHref={`/${locale}/events`}
                btnLabel={t('viewEvents')}
                locale={locale}
                imageSide="left"
              />
            </div>
            <div ref={bottomWrapRef}>
              <ManualNavCard
                articles={activities}
                fallbackTitle={t('fallbackTitle2')}
                fallbackExcerpt={t('fallbackExcerpt2')}
                fallbackHref={`/${locale}/activity`}
                btnLabel={t('viewActivities')}
                locale={locale}
                imageSide="right"
              />
            </div>
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
