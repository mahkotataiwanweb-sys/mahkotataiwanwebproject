'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function EventsSection() {
  const locale = useLocale();
  const t = useTranslations('events');
  const [events, setEvents] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'event')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(10);

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

  // GSAP header animation - premium
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // GSAP card enter animations
  useEffect(() => {
    if (loading || events.length === 0) return;

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, x: 40, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.7,
            delay: i * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: scrollContainerRef.current || sectionRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading, events.length]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -360, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 360, behavior: 'smooth' });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : locale === 'id' ? 'id-ID' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-navy relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cream/10 to-transparent" />

<div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14">
          <div>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              {t('title')}
            </h2>
            <div className="w-16 h-[2px] bg-red mb-4" />
            <p className="text-cream/50 max-w-lg">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href={`/${locale}/events`}
            className="mt-6 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-red hover:text-red-light tracking-wide uppercase transition-colors group"
          >
            {t('viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Events Carousel */}
        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex-shrink-0 w-80 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-navy-light" />
                <div className="p-5 bg-navy-light/50 space-y-3">
                  <div className="h-3 bg-cream/10 rounded w-24" />
                  <div className="h-5 bg-cream/10 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-cream/15 mx-auto mb-4" />
            <p className="text-cream/40 text-lg">{t('comingSoon')}</p>
            <p className="text-cream/25 text-sm mt-1">{t('stayTuned')}</p>
          </div>
        ) : (
          <div className="relative group/carousel">
            {events.length > 3 && (
              <>
                <button
                  onClick={scrollLeft}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors opacity-0 group-hover/carousel:opacity-100 duration-300"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollRight}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors opacity-0 group-hover/carousel:opacity-100 duration-300"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {events.map((event, index) => (
                <div
                  key={event.id}
                  ref={el => { cardRefs.current[index] = el; }}
                  className="flex-shrink-0 w-80 group"
                >
                  <Link href={`/${locale}/articles/${event.slug}`}>
                    <div className="rounded-2xl overflow-hidden bg-navy-light/50 border border-cream/10 hover:border-red/30 transition-all duration-500 hover:shadow-lg hover:shadow-red/5">
                      {/* Image */}
                      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-navy-light to-navy-dark">
                        {event.image_url ? (
                          <Image
                            src={event.image_url}
                            alt={getLocalizedField(event, 'title', locale)}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            sizes="320px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-cream/15" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                        {/* Date badge */}
                        <div className="absolute bottom-4 left-4 bg-red px-3 py-1.5 rounded-lg">
                          <span className="text-white text-xs font-semibold">
                            {formatDate(event.published_at)}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-heading text-lg font-bold text-white mb-2 group-hover:text-red transition-colors duration-300 line-clamp-2">
                          {getLocalizedField(event, 'title', locale)}
                        </h3>
                        <p className="text-cream/40 text-sm leading-relaxed line-clamp-2">
                          {getLocalizedField(event, 'excerpt', locale)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
