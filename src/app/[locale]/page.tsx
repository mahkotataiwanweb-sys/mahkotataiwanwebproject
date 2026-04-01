'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
   AutoFlipCard — controlled via ref
────────────────────────────────────────── */
interface AutoFlipCardHandle {
  triggerFlip: () => Promise<void>;
  enterView: () => Promise<void>;
}

const AutoFlipCard = React.forwardRef<AutoFlipCardHandle, {
  articles: Article[];
  fallbackTitle: string;
  fallbackExcerpt: string;
  fallbackHref: string;
  btnLabel: string;
  locale: string;
}>(function AutoFlipCardInner({ articles, fallbackTitle, fallbackExcerpt, fallbackHref, btnLabel, locale }, ref) {
  const cardRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const count = articles.length;

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

  useImperativeHandle(ref, () => ({
    triggerFlip: () => new Promise<void>((resolve) => {
      if (count <= 1 || !cardRef.current) { resolve(); return; }
      const nextIdx = (indexRef.current + 1) % count;
      gsap.to(cardRef.current, {
        rotateY: 90, opacity: 0.3, duration: 0.5,
        ease: 'power2.in', transformPerspective: 2500, transformOrigin: 'center center',
        onComplete: () => {
          indexRef.current = nextIdx;
          setDisplayIndex(nextIdx);
          gsap.set(cardRef.current, { rotateY: -90 });
          gsap.to(cardRef.current, {
            rotateY: 0, opacity: 1, duration: 1,
            ease: 'power2.out', transformPerspective: 2500,
            onComplete: resolve,
          });
        },
      });
    }),
    enterView: () => new Promise<void>((resolve) => {
      if (!cardRef.current) { resolve(); return; }
      gsap.set(cardRef.current, { opacity: 0, rotateY: -100, transformPerspective: 2500, transformOrigin: 'center center' });
      gsap.to(cardRef.current, { opacity: 1, rotateY: 0, duration: 2, ease: 'power2.out', onComplete: resolve });
    }),
  }), [count]);

  const data = getArticleData(displayIndex);
  const dots = count > 1 ? (
    <div className="flex justify-center gap-2 mt-5">
      {articles.map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === displayIndex ? 'bg-[#C12126] scale-125' : 'bg-navy/20'}`} />
      ))}
    </div>
  ) : null;

  return (
    <div>
      <div ref={cardRef} style={{ perspective: '2500px', opacity: 0 }}>
        <Link href={data.href} className="group block">
          <div className="relative overflow-hidden">
            <div className="relative aspect-[4/3]">
              {data.imageUrl ? (
                <Image src={data.imageUrl} alt={data.title} fill className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105" sizes="(max-width: 768px) 100vw, 720px" unoptimized />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
              )}
            </div>
          </div>
          <div className="relative bg-white mx-6 sm:mx-10 -mt-10 sm:-mt-14 px-8 sm:px-10 py-8 sm:py-10 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
            <div className="text-center">
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-navy mb-3 leading-tight">{data.title}</h3>
              <p className="text-navy/50 text-sm leading-relaxed mb-6 max-w-md mx-auto">{data.excerpt}</p>
              <div className="inline-flex items-center gap-2 px-7 py-3 bg-[#003048] text-white text-sm font-semibold tracking-wide group-hover:bg-[#C12126] transition-colors duration-300">
                <span>{btnLabel}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
      {dots}
    </div>
  );
});

export default function HomePage() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const topCardRef = useRef<AutoFlipCardHandle>(null);
  const bottomCardRef = useRef<AutoFlipCardHandle>(null);

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
    }
    fetchAll();
  }, []);

  /* Header animation */
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
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true },
          },
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ── Coordinated flip sequencer: top → pause → bottom → pause → repeat ── */
  useEffect(() => {
    let cancelled = false;
    let enteredView = false;

    const sequencer = async () => {
      while (!cancelled) {
        await new Promise(r => setTimeout(r, 5000));
        if (cancelled) break;
        /* Flip top card */
        await topCardRef.current?.triggerFlip();
        if (cancelled) break;
        /* Pause between cards — 1.5s */
        await new Promise(r => setTimeout(r, 1500));
        if (cancelled) break;
        /* Flip bottom card */
        await bottomCardRef.current?.triggerFlip();
      }
    };

    /* Start entrance + sequencer when section scrolls into view */
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 35%',
        once: true,
        onEnter: async () => {
          if (enteredView) return;
          enteredView = true;
          /* Entrance: top first, then bottom after 2.5s delay */
          await topCardRef.current?.enterView();
          await new Promise(r => setTimeout(r, 2500));
          if (cancelled) return;
          await bottomCardRef.current?.enterView();
          /* Start sequenced flipping */
          sequencer();
        },
      });
    });

    return () => { cancelled = true; ctx.revert(); };
  }, []);

  return (
    <>
      <SandTexture fixed />
      <HeroSlider />
      <MarqueeSection />
      <ProductCatalogSection />
      <RecipeShowcaseSection />

      {/* ═══════════════════════════════════════════════
          DISCOVER SECTION — Auto-flipping article cards
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-20 sm:py-28 bg-cream relative overflow-hidden">
        <DiscoverWavyTexture />

        <div className="max-w-3xl mx-auto px-6 sm:px-10 relative z-10">
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

          {/* ── Cards — sequenced: top flips, then bottom, never together ── */}
          <div className="flex flex-col gap-20 sm:gap-28">
            <AutoFlipCard
              ref={topCardRef}
              articles={events}
              fallbackTitle="Upcoming Events"
              fallbackExcerpt="Discover our latest community events, celebrations, and gatherings across Taiwan"
              fallbackHref={`/${locale}/events`}
              btnLabel={locale === 'id' ? 'Lihat Acara' : '查看活動'}
              locale={locale}
            />
            <AutoFlipCard
              ref={bottomCardRef}
              articles={activities}
              fallbackTitle="Community Activities"
              fallbackExcerpt="See how our community enjoys Mahkota Taiwan products in their daily life"
              fallbackHref={`/${locale}/lifestyle`}
              btnLabel={locale === 'id' ? 'Lihat Aktivitas' : '查看活動'}
              locale={locale}
            />
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
