'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowLeft, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ───────────── helpers ───────────── */

function extractDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface DateGroup {
  key: string;
  date: string;
  articles: Article[];
}

function groupByDate(articles: Article[]): DateGroup[] {
  const map = new Map<string, DateGroup>();
  for (const article of articles) {
    const dateKey = extractDateKey(article.published_at);
    if (!dateKey) continue;
    if (!map.has(dateKey)) {
      map.set(dateKey, { key: dateKey, date: dateKey, articles: [] });
    }
    map.get(dateKey)!.articles.push(article);
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function formatDateDisplay(dateKey: string, locale: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(
    locale === 'id' ? 'id-ID' : locale === 'zh' ? 'zh-TW' : 'en-US',
    { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' },
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* ───────────── masonry size pattern ───────────── */
// Returns CSS classes for a given item index within a group
// Pattern creates visual variety: first = large (col-span-2 row-span-2), then alternating medium/small
function getMasonryClasses(index: number, total: number): { span: string; aspect: string; isLarge: boolean } {
  if (total === 1) {
    return { span: 'sm:col-span-2 lg:col-span-3', aspect: 'aspect-[21/9]', isLarge: true };
  }
  if (index === 0) {
    return { span: 'col-span-2 row-span-2', aspect: 'aspect-square md:aspect-auto', isLarge: true };
  }
  // Alternate medium / small
  const pos = (index - 1) % 4;
  if (pos === 0 || pos === 3) {
    return { span: '', aspect: 'aspect-[4/5]', isLarge: false };
  }
  return { span: '', aspect: 'aspect-square', isLarge: false };
}

/* ───────────── page ───────────── */

export default function LifestylePage() {
  const locale = useLocale();

  /* state */
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  /* refs */
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const calBtnRef = useRef<HTMLButtonElement>(null);

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

  /* derived data */
  const filteredArticles = useCallback(() => {
    let list = [...articles];
    if (nameFilter) {
      list = list.filter((a) => getLocalizedField(a, 'title', locale) === nameFilter);
    }
    if (dateFilter) {
      list = list.filter((a) => extractDateKey(a.published_at) === dateFilter);
    }
    return list;
  }, [articles, nameFilter, dateFilter, locale]);

  const filtered = filteredArticles();
  const groups = groupByDate(filtered);

  // Flat list for featured extraction
  const flatFiltered = groups.flatMap((g) => g.articles);
  const featuredArticle = flatFiltered[0] || null;

  // Unique names for pills
  const uniqueNames = Array.from(new Set(articles.map((a) => getLocalizedField(a, 'title', locale))));

  // Dates that have articles
  const articleDateKeys = new Set(articles.map((a) => extractDateKey(a.published_at)));

  /* GSAP grid reveal on filter change */
  useEffect(() => {
    if (!gridRef.current || loading) return;
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('[data-card]');
      if (!cards || cards.length === 0) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 88%',
          },
        },
      );
    }, gridRef);
    return () => ctx.revert();
  }, [filtered.length, nameFilter, dateFilter, loading]);

  /* close calendar on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        calendarOpen &&
        calBtnRef.current &&
        !calBtnRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-cal-dropdown]')
      ) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [calendarOpen]);

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

  /* calendar helpers */
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }
  function handleDayClick(day: number) {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const key = `${calYear}-${m}-${d}`;
    setDateFilter(key === dateFilter ? null : key);
    setCalendarOpen(false);
  }

  function clearFilters() {
    setNameFilter(null);
    setDateFilter(null);
  }

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

          {/* Accent line — white/50 to differentiate from Events */}
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
          STICKY FILTER BAR
      ═══════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 border-b border-[#003048]/5 bg-[#FFF8EE]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          {/* Scrollable pills */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => { setNameFilter(null); setDateFilter(null); }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                !nameFilter
                  ? 'bg-[#003048] text-white shadow-md'
                  : 'border border-[#003048]/10 bg-white text-[#003048]/70 hover:border-[#003048]/30'
              }`}
            >
              All Activities
            </button>
            {uniqueNames.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setNameFilter(name === nameFilter ? null : name);
                  setDateFilter(null);
                }}
                className={`shrink-0 truncate rounded-full px-4 py-2 text-sm font-medium transition ${
                  nameFilter === name
                    ? 'bg-[#003048] text-white shadow-md'
                    : 'border border-[#003048]/10 bg-white text-[#003048]/70 hover:border-[#003048]/30'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Calendar dropdown toggle */}
          <div className="relative">
            <button
              ref={calBtnRef}
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                calendarOpen || dateFilter
                  ? 'bg-[#003048] text-white'
                  : 'border border-[#003048]/10 bg-white text-[#003048]/60 hover:border-[#003048]/30'
              }`}
              aria-label="Toggle calendar"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>

            {/* Calendar dropdown */}
            <AnimatePresence>
              {calendarOpen && (
                <motion.div
                  data-cal-dropdown
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 z-40 w-72 overflow-hidden rounded-2xl bg-[#003048] p-4 shadow-2xl ring-1 ring-white/10"
                >
                  {/* Month navigation */}
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={prevMonth}
                      className="rounded-full p-1 text-[#FAEDD3]/70 hover:text-[#FAEDD3] transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-[#FAEDD3]">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    <button
                      onClick={nextMonth}
                      className="rounded-full p-1 text-[#FAEDD3]/70 hover:text-[#FAEDD3] transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Day labels */}
                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {dayLabels.map((d) => (
                      <div key={d} className="text-center text-[10px] font-medium uppercase text-[#FAEDD3]/40">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const m = String(calMonth + 1).padStart(2, '0');
                      const d = String(day).padStart(2, '0');
                      const key = `${calYear}-${m}-${d}`;
                      const hasArticle = articleDateKeys.has(key);
                      const isActive = dateFilter === key;
                      const td = new Date();
                      const isTdy =
                        day === td.getDate() &&
                        calMonth === td.getMonth() &&
                        calYear === td.getFullYear();
                      return (
                        <button
                          key={day}
                          onClick={() => hasArticle && handleDayClick(day)}
                          disabled={!hasArticle}
                          className={`relative flex h-8 w-full items-center justify-center rounded-lg text-xs transition ${
                            isActive
                              ? 'bg-[#C12126] text-white font-bold shadow-lg shadow-[#C12126]/30'
                              : hasArticle
                              ? 'text-[#FAEDD3] hover:bg-[#FAEDD3]/10 font-medium cursor-pointer'
                              : 'text-[#FAEDD3]/20 cursor-default'
                          } ${isTdy && !isActive ? 'ring-1 ring-[#FAEDD3]/30' : ''}`}
                        >
                          {day}
                          {hasArticle && !isActive && (
                            <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#C12126] shadow-[0_0_4px_rgba(193,33,38,0.7)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear date */}
                  {dateFilter && (
                    <button
                      onClick={() => {
                        setDateFilter(null);
                        setCalendarOpen(false);
                      }}
                      className="mt-3 w-full rounded-lg bg-[#FAEDD3]/10 py-1.5 text-xs font-medium text-[#FAEDD3] transition hover:bg-[#FAEDD3]/20"
                    >
                      Clear date filter
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active filter badges */}
        {(nameFilter || dateFilter) && (
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 pb-3">
            {nameFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#003048]/10 px-3 py-1 text-xs font-medium text-[#003048]">
                {nameFilter}
                <button
                  onClick={() => setNameFilter(null)}
                  className="text-[#003048]/50 hover:text-[#003048] transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {dateFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C12126]/10 px-3 py-1 text-xs font-medium text-[#C12126]">
                <CalendarIcon className="h-3 w-3" />
                {formatDateDisplay(dateFilter, locale)}
                <button
                  onClick={() => setDateFilter(null)}
                  className="text-[#C12126]/50 hover:text-[#C12126] transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          CONTENT SECTION
      ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {loading ? (
          /* ── Skeleton Loader ── */
          <div className="space-y-8">
            {/* Featured skeleton */}
            <div className="h-72 w-full animate-pulse rounded-2xl bg-[#003048]/5 md:h-96" />
            {/* Grid skeletons */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`animate-pulse rounded-2xl bg-[#003048]/5 ${
                    n === 1 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : flatFiltered.length === 0 ? (
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
              Try adjusting your filters or check back later for new activities.
            </p>
            {(nameFilter || dateFilter) && (
              <button
                onClick={clearFilters}
                className="mt-6 rounded-full bg-[#003048] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#003048]/90"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        ) : (
          /* ── Main Content ── */
          <div ref={gridRef}>
            {/* ────── FEATURED ARTICLE — Editorial Horizontal Split ────── */}
            {featuredArticle && (
              <motion.div
                data-card
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="group relative mb-12 cursor-pointer overflow-hidden rounded-2xl premium-shadow"
                onClick={() => setSelectedArticle(featuredArticle)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image — 60% width on desktop */}
                  <div className="relative w-full md:w-[60%] overflow-hidden">
                    <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px]">
                      {featuredArticle.image_url ? (
                        <Image
                          src={featuredArticle.image_url}
                          alt={getLocalizedField(featuredArticle, 'title', locale)}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 60vw"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#003048] to-[#003048]/80" />
                      )}
                      {/* Gradient overlay on image */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 md:bg-gradient-to-r md:from-transparent md:to-black/30" />
                    </div>
                  </div>

                  {/* Content — 40% on desktop */}
                  <div className="relative flex w-full flex-col justify-center bg-gradient-to-br from-[#003048] to-[#002236] p-8 md:w-[40%] md:p-10 lg:p-14">
                    {/* Decorative accent */}
                    <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#C12126]/10 blur-[60px]" />
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:hidden" />

                    <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#FAEDD3]/80 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </span>

                    <h2 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
                      {getLocalizedField(featuredArticle, 'title', locale)}
                    </h2>

                    <div className="mt-4 h-[2px] w-12 rounded-full bg-white/40" />

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#FAEDD3]/60 md:text-base">
                      {getLocalizedField(featuredArticle, 'excerpt', locale)}
                    </p>

                    <p className="mt-3 text-xs text-[#FAEDD3]/40">
                      {formatDateDisplay(extractDateKey(featuredArticle.published_at), locale)}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FAEDD3]/80 transition-all group-hover:gap-3 group-hover:text-white">
                      Read More <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────── DATE-GROUPED MASONRY CARDS ────── */}
            {groups.map((group) => {
              const groupArticles = group.articles.filter(
                (a) => a.id !== featuredArticle?.id,
              );
              if (groupArticles.length === 0) return null;

              return (
                <div key={group.key} className="mb-14">
                  {/* Date section header */}
                  <div className="mb-6 flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-[#003048]/40" />
                    <h3 className="font-heading text-lg font-semibold text-[#003048]">
                      {formatDateDisplay(group.date, locale)}
                    </h3>
                    <div className="h-px flex-1 bg-[#003048]/10" />
                  </div>

                  {/* Pinterest-style masonry grid */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                    {groupArticles.map((article, index) => {
                      const { span, aspect, isLarge } = getMasonryClasses(
                        index,
                        groupArticles.length,
                      );

                      return (
                        <motion.article
                          data-card
                          key={article.id}
                          initial={{ opacity: 0, y: 40 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.06,
                            ease: 'easeOut',
                          }}
                          className={`lifestyle-card group cursor-pointer overflow-hidden rounded-2xl ${span}`}
                          onClick={() => setSelectedArticle(article)}
                        >
                          <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-[#003048]/5 ${isLarge && groupArticles.length > 1 ? 'min-h-[300px] md:min-h-[400px]' : ''}`}>
                            <div className={`relative ${aspect} ${isLarge && groupArticles.length > 1 ? 'md:aspect-auto md:h-full' : ''}`}>
                              {article.image_url ? (
                                <Image
                                  src={article.image_url}
                                  alt={getLocalizedField(article, 'title', locale)}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                  sizes={
                                    isLarge
                                      ? '(max-width: 768px) 100vw, 66vw'
                                      : '(max-width: 768px) 50vw, 33vw'
                                  }
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#003048]/80 to-[#C12126]/40">
                                  <Sparkles className="h-12 w-12 text-white/30" />
                                </div>
                              )}

                              {/* Dark gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-85" />

                              {/* Date tag */}
                              <div className="absolute top-3 left-3">
                                <span className="inline-block rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                                  {formatDateDisplay(extractDateKey(article.published_at), locale)}
                                </span>
                              </div>

                              {/* Text overlay at bottom — slides up on hover */}
                              <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 transition-transform duration-500 group-hover:translate-y-0 md:p-5">
                                <h4
                                  className={`font-heading font-bold leading-snug text-white drop-shadow-lg ${
                                    isLarge
                                      ? 'text-lg md:text-2xl line-clamp-3'
                                      : 'text-sm md:text-base line-clamp-2'
                                  }`}
                                >
                                  {getLocalizedField(article, 'title', locale)}
                                </h4>

                                {/* Excerpt only on large cards */}
                                {isLarge && (
                                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/60 md:text-sm">
                                    {getLocalizedField(article, 'excerpt', locale)}
                                  </p>
                                )}

                                {/* Read more hint on hover */}
                                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white/0 transition-colors duration-500 group-hover:text-white/70">
                                  View Details <span aria-hidden>→</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
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

                {/* Close button with rotation */}
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
                  {formatDateDisplay(
                    extractDateKey(selectedArticle.published_at),
                    locale,
                  )}
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
