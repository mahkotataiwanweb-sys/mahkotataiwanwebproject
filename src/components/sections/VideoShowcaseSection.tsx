'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { VideoShowcase } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  YouTube URL parser                                                  */
/* ------------------------------------------------------------------ */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  VideoShowcaseSection                                                */
/* ------------------------------------------------------------------ */
export default function VideoShowcaseSection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<VideoShowcase[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---------- Fetch videos ---------- */
  useEffect(() => {
    async function fetchVideos() {
      const { data } = await supabase
        .from('video_showcases')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data && data.length > 0) {
        setVideos(data as VideoShowcase[]);
      }
    }
    fetchVideos();
  }, []);

  /* ---------- Auto-rotate ---------- */
  const startAutoRotate = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (videos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % videos.length);
      setShowControls(false);
    }, 15000);
  }, [videos.length]);

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoRotate]);

  /* ---------- GSAP entrance ---------- */
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ---------- Don't render if no videos ---------- */
  if (videos.length === 0) return null;

  const current = videos[activeIndex];
  const title = getLocalizedField(current, 'title', locale);
  const description = getLocalizedField(current, 'description', locale);

  const handleVideoClick = () => {
    setShowControls((prev) => !prev);
    // Reset auto-rotate on interaction
    startAutoRotate();
  };

  const goToVideo = (index: number) => {
    setActiveIndex(index);
    setShowControls(false);
    startAutoRotate();
  };

  return (
    <section ref={sectionRef} className="bg-navy py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-red/80 text-sm font-semibold tracking-widest uppercase mb-3">
            Featured
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-3">
            Video Showcase
          </h2>
          <div className="w-16 h-1 bg-red mx-auto mt-4 rounded-full" />
        </div>

        {/* Large Video Player Container */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
          style={{ aspectRatio: '16/9' }}
          onClick={handleVideoClick}
        >
          {/* Subtle gradient overlay on top/bottom for cinematic feel */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-navy/30 via-transparent to-navy/20" />

          <AnimatePresence mode="wait">
            <motion.div
              key={`video-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {current.video_type === 'youtube' ? (
                (() => {
                  const videoId = extractYouTubeId(current.video_url);
                  if (!videoId) return null;
                  const controlsParam = showControls ? 1 : 0;
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${showControls ? 0 : 1}&loop=1&controls=${controlsParam}&showinfo=0&rel=0&modestbranding=1&playlist=${videoId}`}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={title}
                    />
                  );
                })()
              ) : (
                <video
                  src={current.video_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted={!showControls}
                  loop
                  playsInline
                  controls={showControls}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Play button overlay when controls are hidden */}
          {!showControls && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Title + Description below video */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-6 text-center"
          >
            {title && (
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-cream/60 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation dots */}
        {videos.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => goToVideo(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === activeIndex ? 'w-8 bg-red' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to video ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
