'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { Calendar as CalendarIcon, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Helper: extract YYYY-MM-DD from an ISO date string                */
/* ------------------------------------------------------------------ */
function extractDateKey(isoStr: string): string {
  try {
    return new Date(isoStr).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Helper: group articles by published_at date                       */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Helper: format a YYYY-MM-DD string for display                    */
/* ------------------------------------------------------------------ */
function formatDateDisplay(dateStr: string, locale: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(
      locale === 'id' ? 'id-ID' : locale === 'zh' ? 'zh-TW' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  } catch {
    return dateStr;
  }
}

/* ------------------------------------------------------------------ */
/*  Calendar helpers                                                   */
/* ------------------------------------------------------------------ */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function EventsPage() {
  const locale = useLocale();

  /* ---------- state ---------- */
  const [events, setEvents] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<Article | null>(null);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calOpen, setCalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Event name filter
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);

  // Calendar transition direction
  const [calDirection, setCalDirection] = useState(0);

  // Refs
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /* ---------- fetch ---------- */
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .eq('is_active', true)
          .order('published_at', { ascending: false });

        if (!error && data) {
          setEvents(data as Article[]);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // GSAP header animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  /* ---------- GSAP grid animation ---------- */
  useEffect(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.event-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: 'power3.out',
        }
      );
    }
  }, [loading, selectedDate, selectedEventName]);

  /* ---------- format date for card display ---------- */
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(
        locale === 'zh-TW' ? 'zh-TW' : locale === 'id' ? 'id-ID' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      );
    } catch {
      return dateStr;
    }
  };

  /* ---------- derived data ---------- */
  // Dates that have events (YYYY-MM-DD strings)
  const datesWithContent = new Set(events.map((ev) => extractDateKey(ev.published_at)));

  // Unique event titles for pills
  const eventTitles = Array.from(
    new Set(events.map((ev) => getLocalizedField(ev, 'title', locale)))
  );

  // Filtered events
  const filtered = events.filter((ev) => {
    if (selectedDate && extractDateKey(ev.published_at) !== selectedDate) return false;
    if (selectedEventName && getLocalizedField(ev, 'title', locale) !== selectedEventName)
      return false;
    return true;
  });

  const groups = groupByDate(filtered);

  /* ---------- calendar navigation ---------- */
  function prevMonth() {
    setCalDirection(-1);
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    setCalDirection(1);
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  function handleDayClick(day: number) {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${calYear}-${mm}-${dd}`;
    if (datesWithContent.has(dateStr)) {
      setSelectedDate(dateStr === selectedDate ? null : dateStr);
      setSelectedEventName(null);
    }
  }

  function clearFilters() {
    setSelectedDate(null);
    setSelectedEventName(null);
  }

  /* ---------- calendar grid ---------- */
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() &&
    calMonth === today.getMonth() &&
    calYear === today.getFullYear();

  const dayHasContent = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return datesWithContent.has(`${calYear}-${mm}-${dd}`);
  };

  const dayIsSelected = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return selectedDate === `${calYear}-${mm}-${dd}`;
  };

  /* Calendar month slide variants */
  const calSlideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-cream">
      {/* ===================== HERO BANNER ===================== */}
      <div className="relative bg-navy pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-red/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-cream/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-cream/60 hover:text-cream text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              What&apos;s Happening
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Event
            </h1>
            <div className="w-20 h-[3px] bg-red mb-6" />
            <p className="text-cream/60 max-w-lg text-lg">
              Stay updated with our latest events, promotions, and community gatherings.
            </p>
          </div>
        </div>
      </div>

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* ---------- Calendar Toggle (mobile) ---------- */}
        <div className="mb-6 lg:hidden">
          <button
            onClick={() => setCalOpen(!calOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#003048] text-white text-sm font-medium shadow hover:bg-[#003048]/90 transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            {calOpen ? 'Hide Calendar' : 'Show Calendar'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ---------- PREMIUM CALENDAR SIDEBAR ---------- */}
          <AnimatePresence>
            {(calOpen || typeof window !== 'undefined') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`${calOpen ? 'block' : 'hidden'} lg:block lg:w-80 flex-shrink-0`}
              >
                <div className="sticky top-24 bg-gradient-to-br from-[#003048] to-[#00425e] rounded-2xl shadow-2xl ring-1 ring-white/10 p-6 relative overflow-hidden">
                  {/* Decorative glassmorphism reflections */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-[#C12126]/10 blur-2xl pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Month header */}
                  <div className="relative flex items-center justify-between mb-5">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-5 h-5 text-white/80" />
                    </button>
                    <h3 className="font-bold text-white text-lg tracking-wide">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-5 h-5 text-white/80" />
                    </button>
                  </div>

                  {/* Day labels */}
                  <div className="relative grid grid-cols-7 mb-2 pb-2 border-b border-white/10">
                    {DAY_LABELS.map((d) => (
                      <div
                        key={d}
                        className="text-center text-[10px] font-semibold text-white/40 uppercase tracking-wider py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day cells with month transition */}
                  <div className="relative overflow-hidden min-h-[240px]">
                    <AnimatePresence mode="wait" custom={calDirection}>
                      <motion.div
                        key={`${calYear}-${calMonth}`}
                        custom={calDirection}
                        variants={calSlideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="grid grid-cols-7 gap-y-1 will-change-transform"
                      >
                        {calendarCells.map((day, i) => {
                          if (day === null) {
                            return <div key={`empty-${i}`} className="h-10" />;
                          }
                          const hasContent = dayHasContent(day);
                          const isSel = dayIsSelected(day);
                          const isTdy = isToday(day);
                          return (
                            <motion.button
                              key={day}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.015, duration: 0.25, ease: 'easeOut' }}
                              onClick={() => handleDayClick(day)}
                              disabled={!hasContent}
                              className={`
                                relative flex flex-col items-center justify-center h-10 rounded-xl text-sm transition-all duration-200
                                ${hasContent
                                  ? 'cursor-pointer hover:bg-white/10 font-bold text-amber-300'
                                  : 'text-white/40 cursor-default'
                                }
                                ${isSel
                                  ? 'bg-[#C12126] !text-white shadow-lg shadow-[#C12126]/30 scale-110 hover:bg-[#C12126]/90 font-bold'
                                  : ''
                                }
                                ${isTdy && !isSel
                                  ? 'ring-2 ring-white/30 rounded-xl'
                                  : ''
                                }
                              `}
                            >
                              {day}
                              {/* Glowing amber indicator for days with content */}
                              {hasContent && !isSel && (
                                <span className="absolute bottom-0.5 flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                                  <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping opacity-40" />
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Legend */}
                  <div className="relative mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                    <span className="relative flex items-center justify-center w-3 h-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    </span>
                    <span className="text-white/40 text-xs">= has events</span>
                  </div>

                  {/* Clear filter button */}
                  {(selectedDate || selectedEventName) && (
                    <button
                      onClick={clearFilters}
                      className="relative mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C12126] to-[#a51c21] text-white text-sm font-semibold shadow-lg shadow-[#C12126]/20 hover:shadow-[#C12126]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- MAIN CONTENT ---------- */}
          <div className="flex-1 min-w-0">
            {/* Event name pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedEventName(null);
                  setSelectedDate(null);
                }}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  !selectedEventName
                    ? 'bg-[#003048] text-white shadow-lg'
                    : 'bg-white text-[#003048] border border-[#003048]/20 hover:border-[#003048]/50'
                }`}
              >
                All Events
              </button>
              {eventTitles.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedEventName(name === selectedEventName ? null : name);
                    setSelectedDate(null);
                  }}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedEventName === name
                      ? 'bg-[#003048] text-white shadow-lg'
                      : 'bg-white text-[#003048] border border-[#003048]/20 hover:border-[#003048]/50'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Active filter indicator */}
            {selectedDate && (
              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-[#003048]/70">Showing events from:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#003048] text-white text-sm rounded-full font-medium">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDateDisplay(selectedDate, locale)}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="ml-1 hover:text-white/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[16/10] bg-cream-dark" />
                    <div className="p-6 bg-white space-y-3">
                      <div className="h-3 bg-cream-dark rounded w-24" />
                      <div className="h-5 bg-cream-dark rounded w-48" />
                      <div className="h-3 bg-cream-dark rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && groups.length === 0 && (
              <div className="text-center py-24">
                <CalendarIcon className="w-16 h-16 text-[#003048]/20 mx-auto mb-4" />
                <p className="text-[#003048]/50 text-lg font-medium">No events found</p>
                {(selectedDate || selectedEventName) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-[#C12126] font-semibold text-sm hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Events grouped by date */}
            <div ref={gridRef} className="space-y-12">
              {groups.map((group) => (
                <div key={group.key}>
                  {/* Section header */}
                  <div className="mb-5">
                    <p className="text-[#003048]/50 text-sm">
                      {formatDateDisplay(group.date, locale)}
                    </p>
                  </div>

                  {/* Event cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {group.articles.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08, duration: 0.5 }}
                        className="event-card group cursor-pointer"
                        onClick={() => setModalEvent(event)}
                      >
                        <div className="bg-white rounded-2xl overflow-hidden hover-lift premium-shadow h-full">
                          {/* Image */}
                          <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-cream to-cream-dark">
                            {event.image_url ? (
                              <Image
                                src={event.image_url}
                                alt={getLocalizedField(event, 'title', locale)}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <CalendarIcon className="w-16 h-16 text-navy/10" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
                            {/* Date badge */}
                            <div className="absolute bottom-4 left-4 bg-red px-3 py-1.5 rounded-lg shadow-lg">
                              <span className="text-white text-xs font-semibold">
                                {formatDate(event.published_at)}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6">
                            <h3 className="font-heading text-xl font-bold text-navy mb-2 group-hover:text-red transition-colors duration-300 line-clamp-2">
                              {getLocalizedField(event, 'title', locale)}
                            </h3>
                            <p className="text-navy/50 text-sm leading-relaxed line-clamp-3">
                              {getLocalizedField(event, 'excerpt', locale)}
                            </p>
                            <div className="mt-4 text-red text-sm font-semibold uppercase tracking-wide group-hover:underline">
                              Read More →
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== EVENT DETAIL MODAL ===================== */}
      <AnimatePresence>
        {modalEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                {modalEvent.image_url ? (
                  <div className="aspect-[16/9] relative">
                    <Image
                      src={modalEvent.image_url}
                      alt={getLocalizedField(modalEvent, 'title', locale)}
                      fill
                      className="object-cover rounded-t-2xl"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent rounded-t-2xl" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-navy to-red-dark rounded-t-2xl flex items-center justify-center">
                    <CalendarIcon className="w-20 h-20 text-white/30" />
                  </div>
                )}

                <button
                  onClick={() => setModalEvent(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Date badge */}
                <div className="absolute bottom-4 left-6 bg-red px-4 py-2 rounded-lg shadow-lg">
                  <span className="text-white text-sm font-semibold">
                    {formatDate(modalEvent.published_at)}
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy mt-2 mb-4">
                  {getLocalizedField(modalEvent, 'title', locale)}
                </h2>
                <div className="w-16 h-[2px] bg-red mb-6" />
                <div
                  className="prose prose-navy max-w-none text-navy/70 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: getLocalizedField(modalEvent, 'content', locale),
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
