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
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [videos, setVideos] = useState<VideoShowcase[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
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
      setIsMuted(true);
    }, 15000);
  }, [videos.length]);

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoRotate]);

  /* ---------- Handle mute toggle for uploaded videos ---------- */
  useEffect(() => {
    if (videoElRef.current) {
      videoElRef.current.muted = isMuted;
    }
  }, [isMuted]);

  /* ---------- GSAP entrance ---------- */
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // ✨ Cinematic circular clip-path reveal — expands from center
      gsap.fromTo(
        sectionRef.current,
        { clipPath: 'circle(0% at 50% 50%)' },
        {
          clipPath: 'circle(150% at 50% 50%)',
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top 15%',
            scrub: 1.5,
          },
        }
      );

      // ✨ Inner content rises with deblur after reveal starts
      const innerContent = sectionRef.current?.querySelector('.max-w-7xl');
      if (innerContent) {
        gsap.fromTo(
          innerContent,
          { opacity: 0, y: 60, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              end: 'top 20%',
              scrub: 1,
            },
          }
        );
      }

      // ✨ Video player has subtle depth parallax
      const videoPlayer = sectionRef.current?.querySelector('[style*="aspect-ratio"]');
      if (videoPlayer) {
        gsap.fromTo(
          videoPlayer,
          { y: 40, scale: 0.96, borderRadius: '32px' },
          {
            y: 0,
            scale: 1,
            borderRadius: '16px',
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 50%',
              end: 'top 10%',
              scrub: 1,
            },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ---------- Don't render if no videos ---------- */
  if (videos.length === 0) return null;

  const current = videos[activeIndex];
  const title = getLocalizedField(current, 'title', locale);
  const description = getLocalizedField(current, 'description', locale);

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
    startAutoRotate();
  };

  const goToVideo = (index: number) => {
    setActiveIndex(index);
    setIsMuted(true);
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
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '16/9' }}
        >
          {/* Subtle gradient overlay on top/bottom for cinematic feel */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-navy/30 via-transparent to-navy/20" />

          <AnimatePresence mode="wait">
            <motion.div
              key={`video-${activeIndex}-${isMuted ? 'muted' : 'unmuted'}`}
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
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=1&showinfo=0&rel=0&modestbranding=1&playlist=${videoId}`}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={title}
                    />
                  );
                })()
              ) : (
                <video
                  ref={videoElRef}
                  src={current.video_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  controls
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Mute/Unmute floating button — always visible, above the iframe */}
          <button
            onClick={handleMuteToggle}
            className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-medium"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span>Click to unmute</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728" />
                </svg>
                <span>Sound on</span>
              </>
            )}
          </button>
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
