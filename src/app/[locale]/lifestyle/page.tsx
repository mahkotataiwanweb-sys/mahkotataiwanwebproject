'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ───────────── helpers ───────────── */

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatElegantDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ───────────── page ───────────── */

export default function LifestylePage() {
  const locale = useLocale();

  /* state */
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  /* refs */
  const heroRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* fetch */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (!error && data) setArticles(data as Article[]);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* sorted articles */
  const sortedArticles = useMemo(() => {
    const list = [...articles];
    list.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [articles, sortOrder]);

  /* GSAP hero entrance */
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-anim]', {
        opacity: 0,
        y: 50,
        clipPath: 'inset(100% 0 0 0)',
        duration: 1,
        ease: 'power3.out',
        stagger: 0.14,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  /* GSAP card slide-in animations */
  useEffect(() => {
    if (!listRef.current || loading) return;
    const ctx = gsap.context(() => {
      const cards = listRef.current?.querySelectorAll('[data-card]');
      if (!cards || cards.length === 0) return;
      cards.forEach((card) => {
        const isEven = card.getAttribute('data-card') === 'even';
        gsap.fromTo(
          card,
          { opacity: 0, x: isEven ? 80 : -80 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
            },
          },
        );
      });
    }, listRef);
    return () => ctx.revert();
  }, [sortedArticles.length, sortOrder, loading]);

  /* lock scroll when modal open */
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedArticle]);

  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#FFF8EE]">
      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-28 pb-24 md:pt-36 md:pb-32"
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Decorative blurred circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#C12126]/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#FAEDD3]/10 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C12126]/8 blur-[80px]" />

        {/* Floating sparkle elements */}
        <motion.div
          className="pointer-events-none absolute top-20 right-[15%] text-[#FAEDD3]/10"
          animate={{ y: [0, -15, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-8 w-8" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute bottom-16 left-[20%] text-[#FAEDD3]/8"
          animate={{ y: [0, 12, 0], rotate: [0, -90, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute top-1/2 right-[8%] text-[#C12126]/15"
          animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>

        {/* Animated vertical accent line */}
        <motion.div
          className="absolute right-12 top-16 bottom-16 hidden w-px bg-gradient-to-b from-transparent via-[#FAEDD3]/15 to-transparent lg:block"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
          style={{ transformOrigin: 'top' }}
        />

        <div className="relative mx-auto max-w-7xl px-6">
          {/* Back link */}
          <div data-hero-anim>
            <Link
              href={`/${locale}`}
              className="group mb-10 inline-flex items-center gap-2 text-sm text-[#FAEDD3]/60 transition hover:text-[#FAEDD3]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>

          {/* Subtitle tag */}
          <p
            data-hero-anim
            className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            <span className="text-[#C12126]">Showcase</span>
            <span className="inline-block h-px w-8 bg-[#FAEDD3]/30" />
            <span className="text-[#FAEDD3]/40">Lifestyle</span>
          </p>

          {/* Heading */}
          <h1
            data-hero-anim
            className="font-heading text-5xl font-bold text-white md:text-7xl lg:text-8xl"
          >
            Activity
          </h1>

          {/* Accent line */}
          <div data-hero-anim className="mt-6 h-[3px] w-20 rounded-full bg-white/50" />

          {/* Description */}
          <p
            data-hero-anim
            className="mt-6 max-w-lg text-base leading-relaxed text-[#FAEDD3]/60 md:text-lg"
          >
            See how our community enjoys Mahkota Taiwan products in their everyday life.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CONTENT SECTION
      ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Sort Toggle */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-[#003048]/40 text-sm mr-1">Sort by:</span>
          <button
            onClick={() => setSortOrder('newest')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              sortOrder === 'newest'
                ? 'bg-[#003048] text-white shadow-md'
                : 'border border-[#003048]/15 text-[#003048]/60 hover:border-[#003048]/30'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortOrder('oldest')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              sortOrder === 'oldest'
                ? 'bg-[#003048] text-white shadow-md'
                : 'border border-[#003048]/15 text-[#003048]/60 hover:border-[#003048]/30'
            }`}
          >
            Oldest
          </button>
        </div>

        {loading ? (
          /* ── Skeleton Loader ── */
          <div className="space-y-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 w-full animate-pulse rounded-2xl bg-[#003048]/5"
              />
            ))}
          </div>
        ) : sortedArticles.length === 0 ? (
          /* ── Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-24 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#003048]/5">
              <Sparkles className="h-8 w-8 text-[#003048]/30" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-[#003048]">
              No activities found
            </h3>
            <p className="mt-2 max-w-sm text-[#003048]/50">
              Check back later for new activities and community highlights.
            </p>
          </motion.div>
        ) : (
          /* ═══════ EDITORIAL CARD LIST ═══════ */
          <div ref={listRef} className="space-y-8">
            {sortedArticles.map((article, index) => {
              const isEven = index % 2 === 1;
              return (
                <article
                  key={article.id}
                  data-card={isEven ? 'even' : 'odd'}
                  className="group cursor-pointer overflow-hidden rounded-2xl shadow-[0_4px_30px_rgba(0,48,72,0.08)] hover:shadow-[0_8px_40px_rgba(0,48,72,0.14)] transition-shadow duration-500"
                  onClick={() => setSelectedArticle(article)}
                >
                  <div
                    className={`flex flex-col ${
                      isEven ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
                  >
                    {/* IMAGE SIDE */}
                    <div className="relative w-full md:w-[45%] shrink-0">
                      <div className="relative aspect-[4/3] md:aspect-auto md:h-full w-full overflow-hidden">
                        {article.image_url ? (
                          <Image
                            src={article.image_url}
                            alt={getLocalizedField(article, 'title', locale)}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 45vw"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-[#003048] to-[#003048]/70" />
                        )}
                        {/* subtle gradient towards content side */}
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-[#003048]/30 ${
                            isEven ? 'md:bg-gradient-to-l' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* CONTENT SIDE */}
                    <div className="relative flex w-full md:w-[55%] flex-col justify-center bg-[#003048] p-6 md:p-10 lg:p-14">
                      {/* decorative accent line */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C12126] via-[#C12126]/60 to-transparent md:hidden" />
                      <div
                        className={`hidden md:block absolute top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#C12126] via-[#C12126]/60 to-transparent ${
                          isEven ? 'right-0' : 'left-0'
                        }`}
                      />

                      {/* date */}
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#C12126]">
                        {formatElegantDate(article.published_at)}
                      </p>

                      {/* title */}
                      <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold leading-tight text-[#FAEDD3] group-hover:text-white transition-colors duration-300">
                        {getLocalizedField(article, 'title', locale)}
                      </h2>

                      {/* excerpt */}
                      <p className="mt-4 line-clamp-3 text-sm md:text-base leading-relaxed text-[#FAEDD3]/60">
                        {getLocalizedField(article, 'excerpt', locale)}
                      </p>

                      {/* read more */}
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C12126] transition-all group-hover:gap-3 duration-300">
                        Read More <span aria-hidden className="text-base">→</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════
          ARTICLE DETAIL MODAL
      ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              {/* Image header */}
              <div className="relative aspect-[16/9] w-full">
                {selectedArticle.image_url ? (
                  <Image
                    src={selectedArticle.image_url}
                    alt={getLocalizedField(selectedArticle, 'title', locale)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#003048] to-[#002236] flex items-center justify-center">
                    <Sparkles className="h-20 w-20 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Close button */}
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:rotate-90"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8">
                {/* Badge */}
                <span className="inline-block rounded-full bg-[#C12126]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#C12126]">
                  Activity
                </span>

                {/* Title */}
                <h2 className="mt-4 font-heading text-2xl font-bold text-[#003048] md:text-3xl">
                  {getLocalizedField(selectedArticle, 'title', locale)}
                </h2>

                {/* Red divider */}
                <div className="mt-4 h-[3px] w-16 rounded-full bg-[#C12126]" />

                {/* Date */}
                <p className="mt-4 text-xs text-[#003048]/40">
                  {formatElegantDate(selectedArticle.published_at)}
                </p>

                {/* Excerpt */}
                {getLocalizedField(selectedArticle, 'excerpt', locale) && (
                  <p className="mt-3 text-sm leading-relaxed text-[#003048]/60">
                    {getLocalizedField(selectedArticle, 'excerpt', locale)}
                  </p>
                )}

                {/* HTML content */}
                <div
                  className="prose prose-sm mt-6 max-w-none text-[#003048]/80 prose-headings:font-heading prose-headings:text-[#003048] prose-a:text-[#C12126]"
                  dangerouslySetInnerHTML={{
                    __html: getLocalizedField(selectedArticle, 'content', locale),
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
