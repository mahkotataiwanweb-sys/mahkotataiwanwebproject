'use client';

import { useRef, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
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
   HomePage
────────────────────────────────────────── */
export default function HomePage() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

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

  /* ── GSAP AOS-style flip-right animation ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Header fade-up */
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

      /* flip-right for each card — AOS flip-right style:
         rotateY(-100deg) → rotateY(0) with perspective(2500px)
         Triggered when card is well into view (top 40%), 2s slow flip */
      if (cardsContainerRef.current) {
        const cards = cardsContainerRef.current.querySelectorAll('.discover-card');
        cards.forEach((card, i) => {
          gsap.set(card, { opacity: 0, rotateY: -100, transformPerspective: 2500, transformOrigin: 'center center' });
          ScrollTrigger.create({
            trigger: card,
            start: 'top 40%',
            once: true,
            onEnter: () => {
              gsap.to(card, {
                opacity: 1,
                rotateY: 0,
                duration: 2,
                delay: i * 0.5,
                ease: 'power2.out',
              });
            },
          });
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const featuredTitle = featuredArticle ? getLocalizedField(featuredArticle, 'title', locale) : '';
  const featuredExcerpt = featuredArticle ? getLocalizedField(featuredArticle, 'excerpt', locale) : '';
  const activityTitle = latestActivity ? getLocalizedField(latestActivity, 'title', locale) : '';
  const activityExcerpt = latestActivity ? getLocalizedField(latestActivity, 'excerpt', locale) : '';

  /* Card data */
  const cards = [
    {
      article: featuredArticle,
      title: featuredTitle || 'Upcoming Events',
      excerpt: featuredExcerpt || 'Discover our latest community events, celebrations, and gatherings across Taiwan',
      href: featuredArticle ? `/${locale}/articles/${featuredArticle.slug}` : `/${locale}/events`,
      btnLabel: locale === 'id' ? 'Lihat Acara' : '查看活動',
    },
    {
      article: latestActivity,
      title: activityTitle || 'Community Activities',
      excerpt: activityExcerpt || 'See how our community enjoys Mahkota Taiwan products in their daily life',
      href: latestActivity ? `/${locale}/articles/${latestActivity.slug}` : `/${locale}/lifestyle`,
      btnLabel: locale === 'id' ? 'Lihat Aktivitas' : '查看活動',
    },
  ];

  return (
    <>
      <SandTexture fixed />
      <HeroSlider />
      <MarqueeSection />
      <ProductCatalogSection />
      <RecipeShowcaseSection />

      {/* ═══════════════════════════════════════════════
          DISCOVER SECTION — Alphornsound.ch-style flip-right
      ═══════════════════════════════════════════════ */}
      <section ref={sectionRef} className="py-20 sm:py-28 bg-cream relative overflow-hidden">
        {/* Wavy texture background */}
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

          {/* ── Cards — STACKED VERTICALLY (alphornsound.ch exact match) ── */}
          <div ref={cardsContainerRef} className="flex flex-col gap-20 sm:gap-28">
            {cards.map((card, i) => (
              <div key={i} className="discover-card" style={{ perspective: '2500px' }}>
                <Link
                  href={card.href}
                  className="group block"
                >
                  {/* ── Image — full width, NO rounded corners, edge-to-edge ── */}
                  <div className="relative overflow-hidden">
                    <div className="relative aspect-[4/3]">
                      {card.article?.image_url ? (
                        <Image
                          src={card.article.image_url}
                          alt={card.title}
                          fill
                          className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 720px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
                      )}
                    </div>
                  </div>

                  {/* ── White content box — overlaps onto image bottom (exact reference style) ── */}
                  <div className="relative bg-white mx-6 sm:mx-10 -mt-10 sm:-mt-14 px-8 sm:px-10 py-8 sm:py-10 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
                    <div className="text-center">
                      <h3 className="font-heading text-xl sm:text-2xl font-bold text-navy mb-3 leading-tight">
                        {card.title}
                      </h3>

                      <p className="text-navy/50 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                        {card.excerpt}
                      </p>

                      {/* Solid rectangle button — exact reference style */}
                      <div className="inline-flex items-center gap-2 px-7 py-3 bg-[#003048] text-white text-sm font-semibold tracking-wide group-hover:bg-[#C12126] transition-colors duration-300">
                        <span>{card.btnLabel}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VideoShowcaseSection />
      <WhereToBuySection />
    </>
  );
}
