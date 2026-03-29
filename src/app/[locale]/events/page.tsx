'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar as CalendarIcon, ArrowLeft, X, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
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

function groupByDate(events: Article[]): Record<string, Article[]> {
  const groups: Record<string, Article[]> = {};
  events.forEach((e) => {
    const key = extractDateKey(e.published_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

function formatDateDisplay(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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

/* ───────────── page ───────────── */

export default function EventsPage() {
  const locale = useLocale();

  /* state */
  const [events, setEvents] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Article | null>(null);
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
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('type', 'event')
        .eq('is_active', true)
        .order('published_at', { ascending: false });
      if (!error && data) setEvents(data as Article[]);
      setLoading(false);
    })();
  }, []);

  /* GSAP hero entrance */
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-anim]', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  /* GSAP grid stagger on filter change */
  const filteredEvents = useCallback(() => {
    let list = [...events];
    if (nameFilter) {
      list = list.filter((e) => getLocalizedField(e, 'title', locale) === nameFilter);
    }
    if (dateFilter) {
      list = list.filter((e) => extractDateKey(e.published_at) === dateFilter);
    }
    return list;
  }, [events, nameFilter, dateFilter, locale]);

  const filtered = filteredEvents();
  const grouped = groupByDate(filtered);
  const sortedDateKeys = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  /* flat list for grid */
  const flatFiltered = sortedDateKeys.flatMap((k) => grouped[k]);
  const featuredEvent = flatFiltered[0] || null;
  const restEvents = flatFiltered.slice(1);

  /* unique names for pills */
  const uniqueNames = Array.from(new Set(events.map((e) => getLocalizedField(e, 'title', locale))));

  /* dates that have events (for calendar dots) */
  const eventDateKeys = new Set(events.map((e) => extractDateKey(e.published_at)));

  /* GSAP grid reveal */
  useEffect(() => {
    if (!gridRef.current) return;
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('[data-card]');
      if (!cards || cards.length === 0) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
          },
        },
      );
    }, gridRef);
    return () => ctx.revert();
  }, [filtered.length, nameFilter, dateFilter]);

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
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedEvent]);

  /* calendar helpers */
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }
  function handleDayClick(day: number) {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const key = `${calYear}-${m}-${d}`;
    setDateFilter(key === dateFilter ? null : key);
    setCalendarOpen(false);
  }

  function formatBadgeDate(dateStr: string) {
    const d = new Date(dateStr);
    return { day: d.getDate(), month: monthNames[d.getMonth()].slice(0, 3).toUpperCase(), year: d.getFullYear() };
  }

  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#FFF8EE]">
      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-[#003048] pt-28 pb-20 md:pt-36 md:pb-28"
      >
        {/* grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* decorative blurred circles */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#C12126]/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-[#FAEDD3]/15 blur-[90px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C12126]/10 blur-[80px]" />

        {/* animated vertical line on right */}
        <motion.div
          className="absolute right-12 top-16 bottom-16 hidden w-px bg-gradient-to-b from-transparent via-[#FAEDD3]/20 to-transparent lg:block"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
          style={{ transformOrigin: 'top' }}
        />

        <div className="relative mx-auto max-w-7xl px-6">
          {/* back */}
          <div data-hero-anim>
            <Link
              href={`/${locale}`}
              className="group mb-10 inline-flex items-center gap-2 text-sm text-[#FAEDD3]/60 transition hover:text-[#FAEDD3]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>

          {/* label */}
          <p
            data-hero-anim
            className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#C12126]"
          >
            What&apos;s Happening
          </p>

          {/* heading */}
          <h1
            data-hero-anim
            className="font-heading text-5xl font-bold text-[#FAEDD3] md:text-7xl lg:text-8xl"
          >
            Events
          </h1>

          {/* accent line */}
          <div data-hero-anim className="mt-6 h-[3px] w-20 bg-[#C12126] rounded-full" />

          {/* subtitle */}
          <p
            data-hero-anim
            className="mt-6 max-w-lg text-base leading-relaxed text-[#FAEDD3]/60 md:text-lg"
          >
            Discover our latest events, cultural celebrations, and community gatherings.
          </p>
        </div>
      </section>

      {/* ═══════ STICKY FILTER BAR ═══════ */}
      <div className="sticky top-0 z-30 border-b border-[#003048]/5 bg-[#FFF8EE]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          {/* scrollable pills */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setNameFilter(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                !nameFilter
                  ? 'bg-[#003048] text-white shadow-md'
                  : 'border border-[#003048]/10 bg-white text-[#003048]/70 hover:border-[#003048]/30'
              }`}
            >
              All Events
            </button>
            {uniqueNames.map((name) => (
              <button
                key={name}
                onClick={() => setNameFilter(name === nameFilter ? null : name)}
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

          {/* calendar toggle */}
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

            {/* calendar dropdown */}
            <AnimatePresence>
              {calendarOpen && (
                <motion.div
                  data-cal-dropdown
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 z-40 w-72 overflow-hidden rounded-2xl bg-[#003048] p-4 shadow-2xl"
                >
                  {/* month nav */}
                  <div className="mb-3 flex items-center justify-between">
                    <button onClick={prevMonth} className="rounded-full p-1 text-[#FAEDD3]/70 hover:text-[#FAEDD3] transition">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-[#FAEDD3]">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    <button onClick={nextMonth} className="rounded-full p-1 text-[#FAEDD3]/70 hover:text-[#FAEDD3] transition">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* day labels */}
                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {dayLabels.map((d) => (
                      <div key={d} className="text-center text-[10px] font-medium uppercase text-[#FAEDD3]/40">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const m = String(calMonth + 1).padStart(2, '0');
                      const d = String(day).padStart(2, '0');
                      const key = `${calYear}-${m}-${d}`;
                      const hasEvent = eventDateKeys.has(key);
                      const isActive = dateFilter === key;
                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`relative flex h-8 w-full items-center justify-center rounded-lg text-xs transition ${
                            isActive
                              ? 'bg-[#C12126] text-white font-bold'
                              : hasEvent
                              ? 'text-[#FAEDD3] hover:bg-[#FAEDD3]/10 font-medium'
                              : 'text-[#FAEDD3]/30 hover:bg-[#FAEDD3]/5'
                          }`}
                        >
                          {day}
                          {hasEvent && !isActive && (
                            <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#C12126]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* clear date */}
                  {dateFilter && (
                    <button
                      onClick={() => { setDateFilter(null); setCalendarOpen(false); }}
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

        {/* active filter badges */}
        {(nameFilter || dateFilter) && (
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 pb-3">
            {nameFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#003048]/10 px-3 py-1 text-xs font-medium text-[#003048]">
                {nameFilter}
                <button onClick={() => setNameFilter(null)} className="text-[#003048]/50 hover:text-[#003048] transition">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {dateFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C12126]/10 px-3 py-1 text-xs font-medium text-[#C12126]">
                {formatDateDisplay(dateFilter)}
                <button onClick={() => setDateFilter(null)} className="text-[#C12126]/50 hover:text-[#C12126] transition">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {loading ? (
          /* skeleton loader */
          <div className="space-y-8">
            <div className="h-64 w-full animate-pulse rounded-2xl bg-[#003048]/5" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 animate-pulse rounded-2xl bg-[#003048]/5" />
              ))}
            </div>
          </div>
        ) : flatFiltered.length === 0 ? (
          /* empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-24 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#003048]/5">
              <CalendarIcon className="h-8 w-8 text-[#003048]/30" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-[#003048]">No events found</h3>
            <p className="mt-2 max-w-sm text-[#003048]/50">
              Try adjusting your filters or check back later for upcoming events.
            </p>
            <button
              onClick={() => { setNameFilter(null); setDateFilter(null); }}
              className="mt-6 rounded-full bg-[#003048] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#003048]/90"
            >
              Clear all filters
            </button>
          </motion.div>
        ) : (
          <div ref={gridRef}>
            {/* FEATURED EVENT */}
            {featuredEvent && (
              <motion.div
                data-card
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="group relative mb-10 cursor-pointer overflow-hidden rounded-2xl premium-shadow"
                onClick={() => setSelectedEvent(featuredEvent)}
              >
                <div className="relative aspect-[21/9] w-full">
                  {featuredEvent.image_url ? (
                    <Image
                      src={featuredEvent.image_url}
                      alt={getLocalizedField(featuredEvent, 'title', locale)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#003048] to-[#003048]/80" />
                  )}
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* date badge */}
                  {(() => {
                    const bd = formatBadgeDate(featuredEvent.published_at);
                    return (
                      <div className="absolute bottom-6 left-6 flex flex-col items-center rounded-xl bg-[#C12126] px-3 py-2 text-white shadow-lg md:px-4 md:py-3">
                        <span className="text-lg font-bold leading-none md:text-2xl">{bd.day}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider md:text-xs">{bd.month}</span>
                      </div>
                    );
                  })()}

                  {/* title overlay */}
                  <div className="absolute bottom-6 left-24 right-6 md:left-28">
                    <span className="mb-2 inline-block rounded-full bg-[#C12126]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C12126] backdrop-blur-sm">
                      Featured
                    </span>
                    <h2 className="font-heading text-xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
                      {getLocalizedField(featuredEvent, 'title', locale)}
                    </h2>
                    <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-white/70 md:line-clamp-2 md:block">
                      {getLocalizedField(featuredEvent, 'excerpt', locale)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DATE-GROUPED REMAINING CARDS */}
            {sortedDateKeys.map((dateKey) => {
              const groupEvents = grouped[dateKey].filter((e) => e.id !== featuredEvent?.id);
              if (groupEvents.length === 0) return null;
              return (
                <div key={dateKey} className="mb-12">
                  <div className="mb-6 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#C12126]" />
                    <h3 className="font-heading text-lg font-semibold text-[#003048]">
                      {formatDateDisplay(dateKey)}
                    </h3>
                    <div className="h-px flex-1 bg-[#003048]/10" />
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {groupEvents.map((event, idx) => {
                      const bd = formatBadgeDate(event.published_at);
                      return (
                        <motion.article
                          data-card
                          key={event.id}
                          initial={{ opacity: 0, y: 40 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ duration: 0.5, delay: idx * 0.07, ease: 'easeOut' }}
                          className="group cursor-pointer overflow-hidden rounded-2xl bg-white premium-shadow hover-lift"
                          onClick={() => setSelectedEvent(event)}
                        >
                          {/* image */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden">
                            {event.image_url ? (
                              <Image
                                src={event.image_url}
                                alt={getLocalizedField(event, 'title', locale)}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-[#003048]/80 to-[#003048]/50" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                            {/* date badge bottom-left of image */}
                            <div className="absolute bottom-3 left-3 flex flex-col items-center rounded-lg bg-[#C12126] px-2.5 py-1.5 text-white shadow-md">
                              <span className="text-base font-bold leading-none">{bd.day}</span>
                              <span className="text-[9px] font-semibold uppercase tracking-wider">{bd.month}</span>
                            </div>
                          </div>

                          {/* content */}
                          <div className="p-5">
                            <h4 className="font-heading text-lg font-bold leading-snug text-[#003048] transition-colors group-hover:text-[#C12126]">
                              {getLocalizedField(event, 'title', locale)}
                            </h4>
                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#003048]/60">
                              {getLocalizedField(event, 'excerpt', locale)}
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#C12126] transition-all group-hover:gap-2">
                              Read More <span aria-hidden>→</span>
                            </span>
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

      {/* ═══════ MODAL ═══════ */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onClick={() => setSelectedEvent(null)}
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
              {/* image header */}
              <div className="relative aspect-[16/9] w-full">
                {selectedEvent.image_url ? (
                  <Image
                    src={selectedEvent.image_url}
                    alt={getLocalizedField(selectedEvent, 'title', locale)}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#003048] to-[#003048]/70" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* close button */}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:rotate-90"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* date badge on image */}
                {(() => {
                  const bd = formatBadgeDate(selectedEvent.published_at);
                  return (
                    <div className="absolute bottom-4 left-4 flex flex-col items-center rounded-xl bg-[#C12126] px-4 py-2.5 text-white shadow-lg">
                      <span className="text-2xl font-bold leading-none">{bd.day}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{bd.month}</span>
                      <span className="text-[10px] text-white/70">{bd.year}</span>
                    </div>
                  );
                })()}
              </div>

              {/* body */}
              <div className="p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-[#003048] md:text-3xl">
                  {getLocalizedField(selectedEvent, 'title', locale)}
                </h2>

                {/* red divider */}
                <div className="mt-4 h-[3px] w-16 rounded-full bg-[#C12126]" />

                {/* excerpt */}
                <p className="mt-4 text-sm leading-relaxed text-[#003048]/60">
                  {getLocalizedField(selectedEvent, 'excerpt', locale)}
                </p>

                {/* HTML content */}
                <div
                  className="prose prose-sm mt-6 max-w-none text-[#003048]/80 prose-headings:font-heading prose-headings:text-[#003048] prose-a:text-[#C12126]"
                  dangerouslySetInnerHTML={{
                    __html: getLocalizedField(selectedEvent, 'content', locale),
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
