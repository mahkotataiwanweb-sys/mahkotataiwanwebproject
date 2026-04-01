'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Camera,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ZoomIn,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { GalleryImage } from '@/types/database';
import HeroBackground from '@/components/effects/HeroBackground';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────── helpers ─────────────────────── */

function groupByEvent(images: GalleryImage[]) {
  const groups: Record<string, GalleryImage[]> = {};
  images.forEach((img) => {
    const key = img.event_name;
    if (!groups[key]) groups[key] = [];
    groups[key].push(img);
  });
  return groups;
}

function formatDate(dateStr: string, locale: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'zh' ? 'zh-TW' : locale === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getEventDatesSet(images: GalleryImage[]) {
  const s = new Set<string>();
  images.forEach((img) => {
    if (img.event_date) s.add(img.event_date.slice(0, 10));
  });
  return s;
}

function getUniqueEvents(images: GalleryImage[]) {
  const seen = new Set<string>();
  const events: { name: string; date: string }[] = [];
  images.forEach((img) => {
    if (!seen.has(img.event_name)) {
      seen.add(img.event_name);
      events.push({ name: img.event_name, date: img.event_date });
    }
  });
  return events;
}

/* ─────────────────── aspect helpers ─────────────────── */

function getCardStyle(globalIndex: number): {
  aspect: string;
  colSpan: string;
} {
  if ((globalIndex + 1) % 7 === 0) {
    return { aspect: 'aspect-[4/3]', colSpan: 'col-span-2' };
  }
  if ((globalIndex + 1) % 5 === 0) {
    return { aspect: 'aspect-[3/4]', colSpan: 'col-span-1' };
  }
  return { aspect: 'aspect-square', colSpan: 'col-span-1' };
}

/* ─────────────────── calendar dropdown ─────────────────── */

function CalendarDropdown({
  images,
  selectedDate,
  onSelectDate,
  onClear,
}: {
  images: GalleryImage[];
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  const eventDates = useMemo(() => getEventDatesSet(images), [images]);
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
        {selectedDate ? formatDate(selectedDate, 'en') : 'Calendar'}
        {selectedDate && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
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
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear(viewYear - 1);
                  } else {
                    setViewMonth(viewMonth - 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-[#FAEDD3] text-[#003048] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[#003048]">{monthLabel}</span>
              <button
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear(viewYear + 1);
                  } else {
                    setViewMonth(viewMonth + 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-[#FAEDD3] text-[#003048] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((d) => (
                <span key={d} className="text-[10px] text-center text-[#003048]/40 font-medium">
                  {d}
                </span>
              ))}
            </div>

            {/* Dates */}
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
                    onClick={() => {
                      onSelectDate(iso);
                      setOpen(false);
                    }}
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

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function GalleryPage() {
  const locale = useLocale();
  const t = useTranslations();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  /* ── fetch ── */
  useEffect(() => {
    async function fetchImages() {
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
    fetchImages();
  }, []);

  /* ── derived ── */
  const events = useMemo(() => getUniqueEvents(images), [images]);

  const filtered = useMemo(() => {
    let result = images;
    if (activeEvent) result = result.filter((img) => img.event_name === activeEvent);
    if (selectedDate) result = result.filter((img) => img.event_date?.slice(0, 10) === selectedDate);
    return result;
  }, [images, activeEvent, selectedDate]);

  const grouped = useMemo(() => groupByEvent(filtered), [filtered]);

  /* ── flat filtered array for lightbox navigation ── */
  const flatFiltered = useMemo(() => {
    const arr: GalleryImage[] = [];
    Object.values(grouped).forEach((group) => arr.push(...group));
    return arr;
  }, [grouped]);

  /* ── lightbox helpers ── */
  const openLightbox = useCallback(
    (image: GalleryImage) => {
      const idx = flatFiltered.findIndex((img) => img.id === image.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [flatFiltered]
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex <= 0 ? flatFiltered.length - 1 : lightboxIndex - 1);
  }, [lightboxIndex, flatFiltered.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex >= flatFiltered.length - 1 ? 0 : lightboxIndex + 1);
  }, [lightboxIndex, flatFiltered.length]);

  /* ── keyboard ── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  /* ── GSAP hero ── */
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-anim', {
        y: 60,
        opacity: 0,
        filter: 'blur(12px)',
        scale: 0.95,
      }, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        stagger: 0.25,
        duration: 2.0,
        ease: 'power4.out',
      });
      gsap.from('.hero-orb', {
        scale: 0,
        opacity: 0,
        stagger: 0.2,
        duration: 1.4,
        ease: 'elastic.out(1,0.5)',
        delay: 0.3,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  /* ── GSAP grid stagger ── */
  useEffect(() => {
    if (!gridRef.current || loading) return;
    const cards = gridRef.current.querySelectorAll('.gallery-card');
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0, filter: 'blur(8px)', scale: 0.92 },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          scale: 1,
          stagger: 0.06,
          duration: 1.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
          },
        }
      );
    }, gridRef);
    return () => ctx.revert();
  }, [filtered, loading]);

  /* ── global image counter across groups ── */
  let globalIndex = 0;

  const lightboxImage = lightboxIndex !== null ? flatFiltered[lightboxIndex] : null;

  return (
    <main className="min-h-screen bg-[#FAEDD3]">
      {/* ═══════════════ HERO ═══════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] py-28 md:py-36 lg:py-44"
      >
        <HeroBackground />

        {/* Floating Camera Icon */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="hero-orb absolute top-16 right-[12%] hidden lg:block"
        >
          <Camera className="w-16 h-16 text-[#FAEDD3]/10" strokeWidth={1} />
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="hero-orb absolute bottom-20 left-[8%] hidden lg:block"
        >
          <Camera className="w-10 h-10 text-[#C12126]/15" strokeWidth={1.2} />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Back Link */}
          <div className="hero-anim mb-8">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-[#FAEDD3]/50 hover:text-[#FAEDD3] transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          {/* Red Label */}
          <div className="hero-anim mb-5">
            <span className="inline-flex items-center gap-2 bg-[#C12126]/15 border border-[#C12126]/30 text-[#C12126] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em]">
              <Camera className="w-3.5 h-3.5" />
              Gallery
            </span>
          </div>

          {/* Heading */}
          <h1 className="hero-anim font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {t('gallery.title')}
          </h1>

          {/* Subtitle */}
          <p className="hero-anim text-lg sm:text-xl text-[#FAEDD3]/60 max-w-2xl mx-auto leading-relaxed">
            {t('gallery.subtitle')}
          </p>

          {/* Stats Strip */}
          <div className="hero-anim mt-12 flex flex-wrap justify-center gap-8 text-[#FAEDD3]/40">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm">{images.length} Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm">{events.length} Events</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STICKY FILTER BAR ═══════════════ */}
      <div
        ref={filterRef}
        className="sticky top-0 z-30 bg-[#FAEDD3]/90 backdrop-blur-xl border-b border-[#003048]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Event Pills */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {
                setActiveEvent(null);
                setSelectedDate(null);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                !activeEvent && !selectedDate
                  ? 'bg-[#003048] text-white border-[#003048] shadow-lg'
                  : 'bg-white/70 text-[#003048]/70 border-[#003048]/15 hover:border-[#003048]/40 hover:bg-white'
              }`}
            >
              All Events
            </button>
            {events.map((evt) => (
              <button
                key={evt.name}
                onClick={() => {
                  setActiveEvent(activeEvent === evt.name ? null : evt.name);
                  setSelectedDate(null);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap ${
                  activeEvent === evt.name
                    ? 'bg-[#003048] text-white border-[#003048] shadow-lg'
                    : 'bg-white/70 text-[#003048]/70 border-[#003048]/15 hover:border-[#003048]/40 hover:bg-white'
                }`}
              >
                {evt.name}
              </button>
            ))}
          </div>

          {/* Calendar Dropdown */}
          <CalendarDropdown
            images={images}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveEvent(null);
            }}
            onClear={() => setSelectedDate(null)}
          />
        </div>

        {/* Active filter badges */}
        {(activeEvent || selectedDate) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-2">
            <span className="text-xs text-[#003048]/40">Filters:</span>
            {activeEvent && (
              <span className="inline-flex items-center gap-1 bg-[#003048]/10 text-[#003048] text-xs px-3 py-1 rounded-full">
                {activeEvent}
                <button onClick={() => setActiveEvent(null)} className="hover:text-[#C12126] transition">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDate && (
              <span className="inline-flex items-center gap-1 bg-[#C12126]/10 text-[#C12126] text-xs px-3 py-1 rounded-full">
                {formatDate(selectedDate, locale)}
                <button onClick={() => setSelectedDate(null)} className="hover:text-[#003048] transition">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setActiveEvent(null);
                setSelectedDate(null);
              }}
              className="text-xs text-[#003048]/40 hover:text-[#C12126] transition ml-2 underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════ GALLERY CONTENT ═══════════════ */}
      <section ref={gridRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {loading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl bg-[#003048]/5 animate-pulse ${
                  (i + 1) % 5 === 0 ? 'aspect-[3/4]' : (i + 1) % 7 === 0 ? 'aspect-[4/3] col-span-2' : 'aspect-square'
                }`}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#003048]/5 flex items-center justify-center">
              <Camera className="w-10 h-10 text-[#003048]/20" />
            </div>
            <h3 className="font-heading text-2xl text-[#003048] mb-2">No photos found</h3>
            <p className="text-[#003048]/50">Try adjusting your filters to discover more memories.</p>
            <button
              onClick={() => {
                setActiveEvent(null);
                setSelectedDate(null);
              }}
              className="mt-6 px-6 py-2.5 rounded-full bg-[#003048] text-white text-sm font-medium hover:bg-[#003048]/90 transition"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          /* Grouped Gallery */
          Object.entries(grouped).map(([eventName, eventImages]) => {
            const eventDate = eventImages[0]?.event_date;
            return (
              <div key={eventName} className="mb-16 last:mb-0">
                {/* Section Header */}
                <motion.div
                  initial={{ opacity: 0, x: -20, filter: 'blur(8px)', scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 1.8 }}
                  className="flex items-end gap-4 mb-6 pb-4 border-b border-[#003048]/10"
                >
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#003048]">
                      {eventName}
                    </h2>
                    {eventDate && (
                      <p className="text-sm text-[#003048]/40 mt-1 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {formatDate(eventDate, locale)}
                      </p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-[#003048]/30 bg-[#003048]/5 px-3 py-1 rounded-full">
                    {eventImages.length} photo{eventImages.length !== 1 ? 's' : ''}
                  </span>
                </motion.div>

                {/* Masonry Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-auto">
                  {eventImages.map((img) => {
                    const currentGlobal = globalIndex;
                    globalIndex++;
                    const { aspect, colSpan } = getCardStyle(currentGlobal);
                    const desc = getLocalizedField(img, 'description', locale);

                    return (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ duration: 0.5, delay: (currentGlobal % 8) * 0.05 }}
                        className={`gallery-card group relative ${colSpan} ${aspect} rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-shadow duration-500`}
                        onClick={() => openLightbox(img)}
                      >
                        {/* Image */}
                        <Image
                          src={img.image_url}
                          alt={desc || img.event_name}
                          fill
                          sizes={colSpan === 'col-span-2' ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                        {/* Zoom Icon */}
                        <div className="absolute top-3 right-3 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-100 scale-75">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
                          {desc && (
                            <p className="text-white text-xs md:text-sm leading-snug line-clamp-2">
                              {desc}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ═══════════════ LIGHTBOX ═══════════════ */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col"
            onClick={closeLightbox}
          >
            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-4 pb-2">
              {/* Counter */}
              <span className="text-white/60 text-sm font-medium tabular-nums">
                {lightboxIndex + 1} / {flatFiltered.length}
              </span>

              {/* Close */}
              <button
                onClick={closeLightbox}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image Area */}
            <div
              className="flex-1 flex items-center justify-center relative px-4 sm:px-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Arrow */}
              {flatFiltered.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Center Image */}
              <motion.div
                key={lightboxImage.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative max-w-5xl max-h-[70vh] w-full h-full flex items-center justify-center"
              >
                <Image
                  src={lightboxImage.image_url}
                  alt={getLocalizedField(lightboxImage, 'description', locale) || lightboxImage.event_name}
                  width={1200}
                  height={800}
                  className="object-contain max-h-[70vh] rounded-lg"
                  priority
                />
              </motion.div>

              {/* Next Arrow */}
              {flatFiltered.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

            {/* Bottom Info */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="relative z-10 px-4 sm:px-8 pb-6 pt-3 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-white mb-1">
                {lightboxImage.event_name}
              </h3>
              {lightboxImage.event_date && (
                <p className="text-white/40 text-xs mb-2 flex items-center justify-center gap-1.5">
                  <CalendarIcon className="w-3 h-3" />
                  {formatDate(lightboxImage.event_date, locale)}
                </p>
              )}
              {getLocalizedField(lightboxImage, 'description', locale) && (
                <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
                  {getLocalizedField(lightboxImage, 'description', locale)}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
