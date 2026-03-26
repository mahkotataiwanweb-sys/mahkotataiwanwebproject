'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { Calendar as CalendarIcon, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { GalleryImage } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Helper: group images by event_name + event_date                   */
/* ------------------------------------------------------------------ */
interface EventGroup {
  key: string;
  eventName: string;
  eventDate: string;
  images: GalleryImage[];
}

function groupByEvent(images: GalleryImage[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const img of images) {
    const key = `${img.event_name}__${img.event_date}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        eventName: img.event_name,
        eventDate: img.event_date,
        images: [],
      });
    }
    map.get(key)!.images.push(img);
  }
  return Array.from(map.values());
}

function formatDate(dateStr: string, locale: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale === 'id' ? 'id-ID' : locale === 'zh' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
export default function GalleryPage() {
  const locale = useLocale();
  const t = useTranslations();

  /* ---------- state ---------- */
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calOpen, setCalOpen] = useState(false); // collapsed on mobile by default
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Event filter
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);

  /* ---------- fetch ---------- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: false })
        .order('sort_order', { ascending: true });

      if (!error && data) setImages(data as GalleryImage[]);
      setLoading(false);
    }
    load();
  }, []);

  /* ---------- GSAP animation ---------- */
  useEffect(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.gallery-card');
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
  }, [loading, selectedDate, selectedEvent]);

  /* ---------- derived data ---------- */
  // Dates that have images (YYYY-MM-DD strings)
  const datesWithImages = new Set(images.map((img) => img.event_date));

  // Unique event names for pills
  const eventNames = Array.from(new Set(images.map((img) => img.event_name)));

  // Filtered images
  const filtered = images.filter((img) => {
    if (selectedDate && img.event_date !== selectedDate) return false;
    if (selectedEvent && img.event_name !== selectedEvent) return false;
    return true;
  });

  const groups = groupByEvent(filtered);

  /* ---------- calendar navigation ---------- */
  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }
  function nextMonth() {
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
    if (datesWithImages.has(dateStr)) {
      setSelectedDate(dateStr === selectedDate ? null : dateStr);
      setSelectedEvent(null);
    }
  }

  function clearFilters() {
    setSelectedDate(null);
    setSelectedEvent(null);
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

  const dayHasImages = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return datesWithImages.has(`${calYear}-${mm}-${dd}`);
  };

  const dayIsSelected = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return selectedDate === `${calYear}-${mm}-${dd}`;
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <main className="min-h-screen bg-[#FFF8F0]">
      {/* ===================== HERO BANNER ===================== */}
      <section className="relative bg-[#003048] text-white overflow-hidden">
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#003048] via-[#00425e] to-[#003048] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(193,33,38,0.15),transparent_70%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[#C12126] font-semibold tracking-widest uppercase text-sm mb-4"
          >
            Gallery
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
          >
            {t('gallery.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/70 text-lg max-w-2xl mx-auto"
          >
            {t('gallery.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* ===================== CONTENT ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
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
          {/* ---------- CALENDAR SIDEBAR ---------- */}
          <AnimatePresence>
            {(calOpen || typeof window !== 'undefined') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`${calOpen ? 'block' : 'hidden'} lg:block lg:w-80 flex-shrink-0`}
              >
                <div className="bg-white rounded-2xl shadow-lg p-5 sticky top-24">
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#003048]" />
                    </button>
                    <h3 className="font-bold text-[#003048] text-lg">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-5 h-5 text-[#003048]" />
                    </button>
                  </div>

                  {/* Day labels */}
                  <div className="grid grid-cols-7 mb-2">
                    {DAY_LABELS.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-semibold text-gray-400 py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-y-1">
                    {calendarCells.map((day, i) => {
                      if (day === null) {
                        return <div key={`empty-${i}`} />;
                      }
                      const hasImages = dayHasImages(day);
                      const isSel = dayIsSelected(day);
                      const isTdy = isToday(day);
                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          disabled={!hasImages}
                          className={`
                            relative flex flex-col items-center justify-center h-10 rounded-lg text-sm transition-all
                            ${hasImages ? 'cursor-pointer hover:bg-[#003048]/10 font-medium text-[#003048]' : 'text-gray-300 cursor-default'}
                            ${isSel ? 'bg-[#003048] !text-white hover:bg-[#003048]/90' : ''}
                            ${isTdy && !isSel ? 'bg-[#FFF8F0] ring-1 ring-[#003048]/30' : ''}
                          `}
                        >
                          {day}
                          {hasImages && !isSel && (
                            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#C12126]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear filter */}
                  {(selectedDate || selectedEvent) && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 w-full py-2 rounded-lg bg-[#C12126] text-white text-sm font-semibold hover:bg-[#a51c21] transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- MAIN GALLERY ---------- */}
          <div className="flex-1 min-w-0">
            {/* Event pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setSelectedDate(null);
                }}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  !selectedEvent
                    ? 'bg-[#003048] text-white shadow-lg'
                    : 'bg-white text-[#003048] border border-[#003048]/20 hover:border-[#003048]/50'
                }`}
              >
                All Events
              </button>
              {eventNames.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedEvent(name === selectedEvent ? null : name);
                    setSelectedDate(null);
                  }}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedEvent === name
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
                <span className="text-sm text-[#003048]/70">Showing images from:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#003048] text-white text-sm rounded-full font-medium">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDate(selectedDate, locale)}
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
              <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-[#003048]/20 border-t-[#003048] rounded-full animate-spin" />
              </div>
            )}

            {/* Empty */}
            {!loading && groups.length === 0 && (
              <div className="text-center py-24">
                <CalendarIcon className="w-16 h-16 text-[#003048]/20 mx-auto mb-4" />
                <p className="text-[#003048]/50 text-lg font-medium">No images found</p>
                {(selectedDate || selectedEvent) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-[#C12126] font-semibold text-sm hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Gallery groups */}
            <div ref={gridRef} className="space-y-12">
              {groups.map((group) => (
                <div key={group.key}>
                  {/* Section header */}
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold text-[#003048]">{group.eventName}</h2>
                    <p className="text-[#003048]/50 text-sm mt-1">
                      {formatDate(group.eventDate, locale)}
                    </p>
                  </div>

                  {/* Image grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.images.map((img) => (
                      <motion.div
                        key={img.id}
                        className="gallery-card group relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        whileHover={{ y: -4 }}
                        onClick={() => setLightbox(img)}
                      >
                        <Image
                          src={img.image_url}
                          alt={getLocalizedField(img, 'description', locale) || img.event_name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-xs font-medium line-clamp-2">
                            {getLocalizedField(img, 'description', locale) || img.event_name}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LIGHTBOX ===================== */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image */}
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={lightbox.image_url}
                  alt={getLocalizedField(lightbox, 'description', locale) || lightbox.event_name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  priority
                />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#003048]">{lightbox.event_name}</h3>
                <p className="text-sm text-[#003048]/50 mb-2">
                  {formatDate(lightbox.event_date, locale)}
                </p>
                {getLocalizedField(lightbox, 'description', locale) && (
                  <p className="text-[#003048]/70 text-sm leading-relaxed">
                    {getLocalizedField(lightbox, 'description', locale)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
