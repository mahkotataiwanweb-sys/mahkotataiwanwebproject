'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, X } from 'lucide-react';
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

function formatBadgeDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: monthNames[d.getMonth()].slice(0, 3).toUpperCase(),
    year: d.getFullYear(),
  };
}

/* ───────────── page ───────────── */

export default function EventsPage() {
  const locale = useLocale();

  /* state */
  const [events, setEvents] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedEvent, setSelectedEvent] = useState<Article | null>(null);

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
    const list = [...events];
    list.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [events, sortOrder]);

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
  }, [sortedEvents.length, sortOrder, loading]);

  /* lock scroll when modal open */
  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedEvent]);

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

      {/* ═══════ CONTENT ═══════ */}
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
                <article
                  key={event.id}
                  data-card={isEven ? 'even' : 'odd'}
                  className="group cursor-pointer overflow-hidden rounded-2xl shadow-[0_4px_30px_rgba(0,48,72,0.08)] hover:shadow-[0_8px_40px_rgba(0,48,72,0.14)] transition-shadow duration-500"
                  onClick={() => setSelectedEvent(event)}
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
                </article>
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
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        {bd.month}
                      </span>
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
