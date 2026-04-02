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
  const textBoxRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
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

  const flippingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    triggerFlip: () => new Promise<void>((resolve) => {
      if (count <= 1) { resolve(); return; }
      if (!textBoxRef.current || !imageBoxRef.current) { resolve(); return; }
      if (flippingRef.current) {
        const checkDone = setInterval(() => {
          if (!flippingRef.current) { clearInterval(checkDone); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(checkDone); resolve(); }, 3000);
        return;
      }

      const textEl = textBoxRef.current;
      const imgEl = imageBoxRef.current;
      flippingRef.current = true;

      gsap.killTweensOf(textEl);
      gsap.killTweensOf(imgEl);

      const nextIdx = (indexRef.current + 1) % count;

      // Phase 1a: Text box flips out FIRST (0.5s)
      gsap.to(textEl, {
        rotateY: 90,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: 'power2.in',
        overwrite: 'auto',
      });

      // Phase 1b: Image box flips out AFTER 0.15s delay (0.5s)
      gsap.to(imgEl, {
        rotateY: 90,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        delay: 0.15,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          if (!textBoxRef.current || !imageBoxRef.current) { flippingRef.current = false; resolve(); return; }
          indexRef.current = nextIdx;
          setDisplayIndex(nextIdx);

          // Reset both to flipped-in position
          gsap.set(textEl, { rotateY: -90, scale: 0.95 });
          gsap.set(imgEl, { rotateY: -90, scale: 0.95 });

          // Phase 2a: Text box flips IN first (0.7s)
          gsap.to(textEl, {
            rotateY: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
            overwrite: 'auto',
          });

          // Phase 2b: Image box follows after 0.15s delay (0.7s)
          gsap.to(imgEl, {
            rotateY: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay: 0.15,
            ease: 'power2.out',
            overwrite: 'auto',
            onComplete: () => {
              flippingRef.current = false;
              resolve();
            },
          });
        },
      });
    }),
    enterView: () => new Promise<void>((resolve) => {
      if (!textBoxRef.current || !imageBoxRef.current) { resolve(); return; }
      gsap.killTweensOf(textBoxRef.current);
      gsap.killTweensOf(imageBoxRef.current);
      // Text enters first
      gsap.set(textBoxRef.current, { opacity: 0, rotateY: -100 });
      gsap.set(imageBoxRef.current, { opacity: 0, rotateY: -100 });
      gsap.to(textBoxRef.current, { opacity: 1, rotateY: 0, duration: 2, ease: 'power2.out', overwrite: true });
      gsap.to(imageBoxRef.current, { opacity: 1, rotateY: 0, duration: 2, delay: 0.2, ease: 'power2.out', overwrite: true, onComplete: resolve });
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
      <Link href={data.href} className="group block">
        <div style={{ perspective: '2500px' }}>
          <div ref={imageBoxRef} style={{ opacity: 0, transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}>
            <div className="relative overflow-hidden">
              <div className="relative aspect-[4/3]">
                {data.imageUrl ? (
                  <Image src={data.imageUrl} alt={data.title} fill className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105" sizes="(max-width: 768px) 100vw, 720px" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
                )}
              </div>
            </div>
          </div>
        </div>
        <div style={{ perspective: '2500px' }}>
          <div ref={textBoxRef} style={{ opacity: 0, transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}>
            <div className="relative bg-white mx-6 sm:mx-10 -mt-10 sm:-mt-14 px-8 sm:px-10 py-8 sm:py-10 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
              <div className="text-center">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-navy mb-3 leading-tight">{data.title}</h3>
                <p className="text-navy/50 text-sm leading-relaxed mb-6 max-w-md mx-auto">{data.excerpt}</p>
                <div className="inline-flex items-center gap-2 px-7 py-3 bg-[#003048] text-white text-sm font-semibold tracking-wide group-hover:bg-[#C12126] transition-colors duration-300">
                  <span>{btnLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
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

  /* ── Coordinated flip sequencer: top → pause → bottom → pause → repeat ── */
  useEffect(() => {
    let cancelled = false;
    let topEntered = false;
    let bottomEntered = false;
    let sequencerRunning = false; // ← CRITICAL: prevents double sequencer

    const wait = (ms: number) => new Promise<void>(r => {
      const id = setTimeout(r, ms);
      // Store for cleanup if needed
      return () => clearTimeout(id);
    });

    const sequencer = async () => {
      if (sequencerRunning) return; // ← Guard: only ONE sequencer can run
      sequencerRunning = true;

      while (!cancelled) {
        /* HOLD — let user read the current cards for 4 seconds */
        await wait(4000);
        if (cancelled) break;

        /* Flip top card first — await completion */
        if (topCardRef.current) {
          await topCardRef.current.triggerFlip();
        }
        if (cancelled) break;

        /* Pause 0.3s then flip bottom card */
        await wait(300);
        if (cancelled) break;

        /* Flip bottom card — await completion */
        if (bottomCardRef.current) {
          await bottomCardRef.current.triggerFlip();
        }
        if (cancelled) break;

        /* Settle buffer before next cycle */
        await wait(500);
      }

      sequencerRunning = false;
    };

    const tryStartSequencer = () => {
      if (topEntered && bottomEntered && !cancelled && !sequencerRunning) sequencer();
    };

    /* Each card has its own scroll trigger for entrance */
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: topWrapRef.current,
        start: 'top 10%',
        once: true,
        onEnter: async () => {
          if (topEntered) return;
          topEntered = true;
          await topCardRef.current?.enterView();
          tryStartSequencer();
        },
      });

      ScrollTrigger.create({
        trigger: bottomWrapRef.current,
        start: 'top 10%',
        once: true,
        onEnter: async () => {
          if (bottomEntered) return;
          bottomEntered = true;
          await new Promise(r => setTimeout(r, 200));
          if (cancelled) return;
          await bottomCardRef.current?.enterView();
          tryStartSequencer();
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
            <p className="text-[#C12126] text-sm sm:text-base tracking-[0.35em] uppercase font-bold mb-3">Discover</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-[#C12126] mx-auto mb-4 rounded-full" />
            <p className="text-navy/40 max-w-lg mx-auto text-base sm:text-lg tracking-wide">
              Stay connected with our latest events and community activities
            </p>
          </div>

          {/* ── Cards — sequenced: top flips, then bottom, never together ── */}
          <div className="flex flex-col gap-20 sm:gap-28">
            <div ref={topWrapRef}>
              <AutoFlipCard
                ref={topCardRef}
                articles={events}
                fallbackTitle="Upcoming Events"
                fallbackExcerpt="Discover our latest community events, celebrations, and gatherings across Taiwan"
                fallbackHref={`/${locale}/events`}
                btnLabel={locale === 'id' ? 'Lihat Acara' : '查看活動'}
                locale={locale}
              />
            </div>
            <div ref={bottomWrapRef}>
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
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
