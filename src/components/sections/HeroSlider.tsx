'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { HeroSlide } from '@/types/database';

const AUTOPLAY_INTERVAL = 6000;

// Fallback static slides when no data is loaded
const fallbackSlides: HeroSlide[] = [
  {
    id: 'fallback-1',
    title_en: 'Authentic Indonesian Taste',
    title_id: 'Cita Rasa Indonesia Asli',
    title_zh: '正宗印尼風味',
    subtitle_en: 'Bringing the flavors of home to Taiwan',
    subtitle_id: 'Menghadirkan rasa kampung halaman di Taiwan',
    subtitle_zh: '將家鄉的味道帶到台灣',
    image_url: null,
    link_url: null,
    sort_order: 0,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-2',
    title_en: 'Premium Quality Products',
    title_id: 'Produk Kualitas Premium',
    title_zh: '優質產品',
    subtitle_en: 'Halal certified, made with the finest ingredients',
    subtitle_id: 'Bersertifikat Halal, dibuat dengan bahan terbaik',
    subtitle_zh: '清真認證，採用最優質的食材',
    image_url: null,
    link_url: null,
    sort_order: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-3',
    title_en: 'Available in 300+ Stores',
    title_id: 'Tersedia di 300+ Toko',
    title_zh: '超過300家門市販售',
    subtitle_en: 'Find Mahkota Taiwan products near you',
    subtitle_id: 'Temukan produk Mahkota Taiwan di dekat Anda',
    subtitle_zh: '在您附近找到皇冠台灣產品',
    image_url: null,
    link_url: null,
    sort_order: 2,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

// Color backgrounds for slides without images
const slideBgColors = [
  'from-navy via-navy-light to-navy',
  'from-red via-red-dark to-navy',
  'from-navy-dark via-navy to-red-dark',
];

export default function HeroSlider() {
  const locale = useLocale();
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch slides from Supabase
  useEffect(() => {
    async function fetchSlides() {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setSlides(data as HeroSlide[]);
        }
      } catch {
        // Keep fallback slides
      }
    }
    fetchSlides();
  }, []);

  // Autoplay
  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, slides.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const currentSlide = slides[currentIndex];
  const title = getLocalizedField(currentSlide, 'title', locale);
  const subtitle = getLocalizedField(currentSlide, 'subtitle', locale);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <section
      id="hero"
      className="relative w-full h-screen min-h-[600px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          className="absolute inset-0"
        >
          {currentSlide.image_url ? (
            <Image
              src={currentSlide.image_url}
              alt={title}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="100vw"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${slideBgColors[currentIndex % slideBgColors.length]}`}
            >
              {/* Decorative elements for non-image slides */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-red/10 blur-3xl" />
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Slide content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Mahkota Taiwan"
                  width={70}
                  height={70}
                  className="mx-auto mb-6 drop-shadow-lg brightness-0 invert"
                  priority
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg"
              >
                {title}
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="w-20 h-[3px] bg-red mx-auto mb-6"
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow"
              >
                {subtitle}
              </motion.p>

              {currentSlide.link_url && (
                <motion.a
                  href={currentSlide.link_url}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="inline-block mt-8 px-8 py-4 bg-red text-white rounded-full text-sm font-semibold tracking-wide uppercase hover:bg-red-dark transition-colors duration-300 premium-shadow"
                >
                  <span>Learn More</span>
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-3 bg-red'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
