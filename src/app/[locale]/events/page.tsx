'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';
import HeroBackground from '@/components/effects/HeroBackground';

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


function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getEventDatesSet(events: Article[]) {
  const s = new Set<string>();
  events.forEach((e) => {
    if (e.published_at) s.add(e.published_at.slice(0, 10));
  });
  return s;
}

/* ───────────── Calendar Dropdown ───────────── */

function CalendarDropdown({
  events,
  selectedDate,
  onSelectDate,
  onClear,
}: {
  events: Article[];
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  const eventDates = useMemo(() => getEventDatesSet(events), [events]);
  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
          selectedDate
            ? 'bg-[#C12126] text-white border-[#C12126]'
            : 'bg-white/80 text-[#003048] border-[#003048]/20 hover:border-[#003048]/50'
        }`}
      >
        <CalendarIcon className="w-4 h-4" />
        {selectedDate ? formatElegantDate(selectedDate) : 'Calendar'}
        {selectedDate && (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#003048]/10 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                  else setViewMonth(viewMonth - 1);
                }}
                className="p-1 rounded-lg hover:bg-[#FAEDD3] text-[#003048] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[#003048]">{monthLabel}</span>
              <button
                onClick={() => {
                  if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                  else setViewMonth(viewMonth + 1);
                }}
                className="p-1 rounded-lg hover:bg-[#FAEDD3] text-[#003048] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((d) => (
                <span key={d} className="text-[10px] text-center text-[#003048]/40 font-medium">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <span key={`e-${i}`} />
              ))}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = eventDates.has(iso);
                const isSelected = selectedDate === iso;
                return (
                  <button
                    key={day}
                    disabled={!hasEvent}
                    onClick={() => { onSelectDate(iso); setOpen(false); }}
                    className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#C12126] text-white font-bold'
                        : hasEvent
                          ? 'bg-[#003048]/10 text-[#003048] font-semibold hover:bg-[#003048] hover:text-white cursor-pointer'
                          : 'text-[#003048]/20 cursor-default'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── page ───────────── */

export default function EventsPage() {
  const locale = useLocale();

  /* state */
  const [events, setEvents] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* refs */
  const heroRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  /* sorted events */
  const sortedEvents = useMemo(() => {
    let list = [...events];
    if (selectedDate) {
      list = list.filter((e) => e.published_at?.slice(0, 10) === selectedDate);
    }
    list.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [events, sortOrder, selectedDate]);

  /* GSAP hero entrance */
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', {
        opacity: 0,
        y: 40,
        filter: 'blur(12px)',
        scale: 0.95,
      }, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.9,
        ease: 'power4.out',
        stagger: 0.25,
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
          { opacity: 0, x: isEven ? 80 : -80, filter: 'blur(8px)', scale: 0.92 },
          {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            scale: 1,
            duration: 1.8,
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
  }, [sortedEvents.length, sortOrder, loading]);



  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#FFF8EE]">
      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-28 pb-20 md:pt-36 md:pb-28"
      >
        <HeroBackground />

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

      {/* ═══════ CONTENT ═══════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Sort + Calendar */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
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
          <CalendarDropdown
            events={events}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            onClear={() => setSelectedDate(null)}
          />
        </div>

        {/* Active date filter */}
        {selectedDate && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-[#003048]/40">Filtered:</span>
            <span className="inline-flex items-center gap-1 bg-[#C12126]/10 text-[#C12126] text-xs px-3 py-1 rounded-full">
              {formatElegantDate(selectedDate)}
              <button onClick={() => setSelectedDate(null)} className="hover:text-[#003048] transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {loading ? (
          /* skeleton loader */
          <div className="space-y-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 w-full animate-pulse rounded-2xl bg-[#003048]/5"
              />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          /* empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-24 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#003048]/5">
              <svg
                className="h-8 w-8 text-[#003048]/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold text-[#003048]">
              No events found
            </h3>
            <p className="mt-2 max-w-sm text-[#003048]/50">
              Check back later for upcoming events and community gatherings.
            </p>
          </motion.div>
        ) : (
          /* ═══════ EDITORIAL CARD LIST ═══════ */
          <div ref={listRef} className="space-y-8">
            {sortedEvents.map((event, index) => {
              const isEven = index % 2 === 1;
              return (
                <Link
                  href={`/${locale}/articles/${event.slug}`}
                  key={event.id}
                  data-card={isEven ? 'even' : 'odd'}
                  className="group block cursor-pointer overflow-hidden rounded-2xl shadow-[0_4px_30px_rgba(0,48,72,0.08)] hover:shadow-[0_8px_40px_rgba(0,48,72,0.14)] transition-shadow duration-500"
                >
                  <div
                    className={`flex flex-col ${
                      isEven ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
                  >
                    {/* IMAGE SIDE */}
                    <div className="relative w-full md:w-[45%] shrink-0">
                      <div className="relative aspect-[4/3] md:aspect-auto md:h-full w-full overflow-hidden">
                        {event.image_url ? (
                          <Image
                            src={event.image_url}
                            alt={getLocalizedField(event, 'title', locale)}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                        {formatElegantDate(event.published_at)}
                      </p>

                      {/* title */}
                      <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold leading-tight text-[#FAEDD3] group-hover:text-white transition-colors duration-300">
                        {getLocalizedField(event, 'title', locale)}
                      </h2>

                      {/* excerpt */}
                      <p className="mt-4 line-clamp-3 text-sm md:text-base leading-relaxed text-[#FAEDD3]/60">
                        {getLocalizedField(event, 'excerpt', locale)}
                      </p>

                      {/* read more */}
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C12126] transition-all group-hover:gap-3 duration-300">
                        Read More <span aria-hidden className="text-base">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>


    </main>
  );
}
