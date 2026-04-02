'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);
import { getLocalizedField } from '@/lib/utils';
import type { HeroSlide } from '@/types/database';

const AUTOPLAY_INTERVAL = 7200;

// Fallback static slides when no data is loaded
const fallbackSlides: HeroSlide[] = [
  {
    id: 'fallback-1',
    title_en: 'The Crown of Indonesian Taste in Taiwan',
    title_id: 'Mahkota Cita Rasa Indonesia di Taiwan',
    title_zh: '台灣印尼美食之冠',
    subtitle_en: '300+ stores across Taiwan trust us to deliver authentic Indonesian flavors — from our kitchen to your table.',
    subtitle_id: '300+ toko di seluruh Taiwan mempercayai kami menghadirkan cita rasa Indonesia otentik — dari dapur kami ke meja Anda.',
    subtitle_zh: '全台300+門市信賴我們，將正宗印尼風味從我們的廚房送到您的餐桌。',
    image_url: null,
    media_type: 'image',
    link_url: null,
    sort_order: 0,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-2',
    title_en: 'Become Our Partner, Grow Together',
    title_id: 'Jadilah Mitra Kami, Tumbuh Bersama',
    title_zh: '成為我們的合作夥伴，共同成長',
    subtitle_en: "Join Taiwan's #1 Indonesian food distribution network — premium products, reliable supply, proven market demand.",
    subtitle_id: 'Bergabunglah dengan jaringan distribusi makanan Indonesia #1 di Taiwan — produk premium, pasokan andal, pasar terjamin.',
    subtitle_zh: '加入台灣第一的印尼食品配銷網路 — 優質產品、穩定供應、市場需求強勁。',
    image_url: null,
    media_type: 'image',
    link_url: null,
    sort_order: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-3',
    title_en: 'Halal Certified, Premium Quality',
    title_id: 'Bersertifikat Halal, Kualitas Premium',
    title_zh: '清真認證，頂級品質',
    subtitle_en: 'Every product is carefully sourced and tested — because your trust is our crown. Discover 26+ product lines crafted with excellence.',
    subtitle_id: 'Setiap produk dipilih dan diuji dengan cermat — karena kepercayaan Anda adalah mahkota kami. Temukan 26+ lini produk unggulan.',
    subtitle_zh: '每件產品精心挑選與檢驗 — 因為您的信任就是我們的皇冠。探索26+條卓越產品線。',
    image_url: null,
    media_type: 'image',
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

/**
 * Analyze image brightness by sampling the top 40% of the image.
 * Returns 'dark' or 'light'.
 */
function analyzeImageBrightness(src: string): Promise<'dark' | 'light'> {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const sampleWidth = Math.min(img.naturalWidth, 200);
          const scale = sampleWidth / img.naturalWidth;
          const sampleHeight = Math.round(img.naturalHeight * scale * 0.4); // top 40%
          canvas.width = sampleWidth;
          canvas.height = sampleHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('dark');
            return;
          }

          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            Math.round(img.naturalHeight * 0.4),
            0,
            0,
            sampleWidth,
            sampleHeight
          );

          const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
          const data = imageData.data;
          let totalBrightness = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }

          const avgBrightness = totalBrightness / pixelCount;
          resolve(avgBrightness < 128 ? 'dark' : 'light');
        } catch {
          resolve('dark');
        }
      };
      img.onerror = () => resolve('dark');
      img.src = src;
    } catch {
      resolve('dark');
    }
  });
}

export default function HeroSlider() {
  const locale = useLocale();
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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

  // Brightness detection - runs whenever currentIndex changes
  useEffect(() => {
    const slide = slides[currentIndex];
    if (!slide) return;

    const mediaType = slide.media_type;

    // Video slides: always dark (dark overlay)
    if (mediaType === 'video') {
      document.documentElement.style.setProperty('--hero-brightness', 'dark');
      return;
    }

    // No media URL (gradient backgrounds): always dark
    if (!slide.image_url) {
      document.documentElement.style.setProperty('--hero-brightness', 'dark');
      return;
    }

    // Image or GIF: analyze brightness
    if (mediaType === 'image' || mediaType === 'gif' || !mediaType) {
      analyzeImageBrightness(slide.image_url).then((brightness) => {
        document.documentElement.style.setProperty('--hero-brightness', brightness);
      });
      return;
    }

    // Fallback for any other type
    document.documentElement.style.setProperty('--hero-brightness', 'dark');
  }, [currentIndex, slides]);

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

  /* ✨ Subtle scroll parallax — text layers move at different speeds for depth */
  useEffect(() => {
    const heroEl = document.getElementById('hero');
    if (!heroEl) return;

    const ctx = gsap.context(() => {
      // Inner text content parallaxes at a slower rate — creates depth
      const textContent = heroEl.querySelector('.hero-text-content');
      if (textContent) {
        gsap.to(textContent, {
          y: '-18%',
          opacity: 0.2,
          ease: 'none',
          scrollTrigger: {
            trigger: heroEl,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // Navigation dots and arrows fade out as you scroll past
      const navElements = heroEl.querySelectorAll('[aria-label]');
      navElements.forEach((el) => {
        gsap.to(el, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: heroEl,
            start: 'top top',
            end: '40% top',
            scrub: true,
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const currentSlide = slides[currentIndex];
  const title = getLocalizedField(currentSlide, 'title', locale);
  const subtitle = getLocalizedField(currentSlide, 'subtitle', locale);
  const mediaType = currentSlide.media_type;

  // Premium crossfade with subtle zoom — no x-translation, no glitches
  const slideVariants = {
    enter: () => ({
      opacity: 0,
      scale: 1.06,
      zIndex: 2,
    }),
    center: {
      opacity: 1,
      scale: 1,
      zIndex: 2,
    },
    exit: () => ({
      opacity: 0,
      scale: 0.97,
      zIndex: 1,
    }),
  };

  // Text entrance variants - staggered and premium
  const textContainerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2, delayChildren: 0.4 },
    },
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
    },
  };

  /** Renders the appropriate media element based on media_type */
  const renderSlideMedia = () => {
    if (!currentSlide.image_url) {
      // No media - gradient background
      return (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${slideBgColors[currentIndex % slideBgColors.length]}`}
        >
          {/* Decorative elements for non-image slides */}
          <div className="absolute inset-0 pointer-events-none">

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
      );
    }

    if (mediaType === 'video') {
      return (
        <motion.div
          ref={imageRef}
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'linear' }}
        >
          <video
            src={currentSlide.image_url}
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full absolute inset-0"
          />
        </motion.div>
      );
    }

    if (mediaType === 'gif') {
      return (
        <motion.div
          ref={imageRef}
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'linear' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSlide.image_url}
            alt={title}
            className="object-cover w-full h-full absolute inset-0"
          />
        </motion.div>
      );
    }

    // Default: image (media_type === 'image' or undefined)
    return (
      <motion.div
        ref={imageRef}
        className="absolute inset-0"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'linear' }}
      >
        <Image
          src={currentSlide.image_url}
          alt={title}
          fill
          className="object-cover"
          priority={currentIndex === 0}
          sizes="100vw"
        />
      </motion.div>
    );
  };

  return (
    <section
      id="hero"
      className="relative w-full h-[55vh] md:h-[75vh] min-h-[400px] max-h-[900px] overflow-hidden"
      style={{ transformOrigin: 'center center' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {renderSlideMedia()}

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Slide content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="max-w-4xl mx-auto px-6 pb-16 sm:pb-8 text-center hero-text-content"
              variants={textContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={textItemVariants}>
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
                variants={textItemVariants}
                className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg"
              >
                {title}
              </motion.h1>

              <motion.div
                variants={lineVariants}
                className="w-20 h-[3px] bg-red mx-auto mb-6 origin-center"
              />

              <motion.p
                variants={textItemVariants}
                className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow"
              >
                {subtitle}
              </motion.p>

              {currentSlide.link_url && (
                <motion.a
                  href={currentSlide.link_url}
                  variants={textItemVariants}
                  className="inline-block mt-8 px-8 py-4 bg-red text-white rounded-full text-sm font-semibold tracking-wide uppercase hover:bg-red-dark transition-colors duration-300 premium-shadow"
                >
                  <span>Learn More</span>
                </motion.a>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows — hidden on mobile, visible on sm+ */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
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
