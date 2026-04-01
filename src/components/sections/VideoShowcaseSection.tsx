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
/*  YouTube helpers                                                     */
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

/* Declare the YT global */
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        config: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
}

/* ------------------------------------------------------------------ */
/*  Load YT IFrame API once                                            */
/* ------------------------------------------------------------------ */
let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(cb: () => void) {
  if (ytApiReady) { cb(); return; }
  ytReadyCallbacks.push(cb);
  if (ytApiLoaded) return;
  ytApiLoaded = true;

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytReadyCallbacks.forEach((fn) => fn());
    ytReadyCallbacks.length = 0;
  };
}

/* ------------------------------------------------------------------ */
/*  Glass Control Button                                                */
/* ------------------------------------------------------------------ */
function GlassButton({
  onClick,
  children,
  label,
  disabled,
  size = 'md',
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-11 sm:h-11',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${sizeClasses[size]} relative group flex items-center justify-center rounded-full
        transition-all duration-300 ease-out
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
      `}
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        }}
      />
      {/* Top highlight arc */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[1px] rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
      <span className="relative z-10 text-white/90">{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                        */
/* ------------------------------------------------------------------ */
function VideoProgressBar({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (fraction: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction);
  };

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      className="w-full h-1.5 rounded-full cursor-pointer group relative"
      style={{
        background: 'rgba(255,255,255,0.12)',
      }}
    >
      {/* Filled portion */}
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
        style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #c12126, #e63946)',
          boxShadow: '0 0 8px rgba(193,33,38,0.4)',
        }}
      />
      {/* Scrubber dot */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          left: `calc(${progress * 100}% - 6px)`,
          background: '#fff',
          boxShadow: '0 0 6px rgba(193,33,38,0.5), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */
export default function VideoShowcaseSection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [videos, setVideos] = useState<VideoShowcase[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

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

  /* ---------- Start progress tracker ---------- */
  const startProgressTracker = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p) return;
      try {
        const dur = p.getDuration();
        const cur = p.getCurrentTime();
        if (dur > 0) setProgress(cur / dur);
      } catch {
        /* player not ready yet */
      }
    }, 250);
  }, []);

  /* ---------- Initialize / switch video ---------- */
  useEffect(() => {
    if (videos.length === 0) return;

    const current = videos[activeIndex];
    if (current.video_type !== 'youtube') return;

    const videoId = extractYouTubeId(current.video_url);
    if (!videoId) return;

    const initPlayer = () => {
      // If player already exists, just load new video
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(videoId);
          setProgress(0);
          setIsPlaying(true);
          setIsMuted(true);
          ytPlayerRef.current.mute();
          return;
        } catch {
          /* destroy & recreate */
          ytPlayerRef.current.destroy();
          ytPlayerRef.current = null;
        }
      }

      // Create the container div for the player
      if (!playerContainerRef.current) return;
      playerContainerRef.current.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-showcase-player';
      playerContainerRef.current.appendChild(playerDiv);

      ytPlayerRef.current = new window.YT.Player('yt-showcase-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            setIsPlaying(true);
            setIsMuted(true);
            startProgressTracker();
          },
          onStateChange: (event: { data: number }) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              // Video naturally ended → auto-advance to next
              setActiveIndex((prev) => {
                const next = (prev + 1) % videos.length;
                return next;
              });
            }
            // Update play state
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);
          },
        },
      } as unknown as Record<string, unknown>);
    };

    loadYouTubeAPI(initPlayer);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [videos, activeIndex, startProgressTracker]);

  /* ---------- Cleanup on unmount ---------- */
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch { /* */ }
      }
    };
  }, []);

  /* ---------- GSAP entrance ---------- */
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
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

  /* ---------- GSAP header reveal ---------- */
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 50, filter: 'blur(14px)', scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 1.6,
          stagger: 0.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ---------- Controls ---------- */
  const handlePlayPause = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    try {
      const state = p.getPlayerState();
      if (state === 1) { p.pauseVideo(); setIsPlaying(false); }
      else { p.playVideo(); setIsPlaying(true); }
    } catch { /* */ }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    try {
      if (p.isMuted()) { p.unMute(); setIsMuted(false); }
      else { p.mute(); setIsMuted(true); }
    } catch { /* */ }
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setProgress(0);
    setIsMuted(true);
  }, [videos.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % videos.length);
    setProgress(0);
    setIsMuted(true);
  }, [videos.length]);

  const handleSeek = useCallback((fraction: number) => {
    const p = ytPlayerRef.current;
    if (!p) return;
    try {
      const dur = p.getDuration();
      p.seekTo(fraction * dur, true);
      setProgress(fraction);
    } catch { /* */ }
  }, []);

  /* ---------- Don't render if no videos ---------- */
  if (videos.length === 0) return null;

  const current = videos[activeIndex];
  const title = getLocalizedField(current, 'title', locale);
  const description = getLocalizedField(current, 'description', locale);

  return (
    <section ref={sectionRef} className="bg-navy py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <span className="inline-block text-red/80 text-sm font-semibold tracking-widest uppercase mb-3">
            Featured
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-3">
            Video Showcase
          </h2>
          <div className="w-16 h-1 bg-red mx-auto mt-4 rounded-full" />
        </div>

        {/* Video Container — cinematic widescreen */}
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {/* Premium outer glow frame */}
          <div
            className="absolute -inset-[1px] rounded-2xl pointer-events-none z-30"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)',
            }}
          />

          {/* YouTube Player — fills container, no YouTube UI */}
          <div
            ref={playerContainerRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />

          {/* Invisible overlay to block YouTube logo clicks + show custom cursor */}
          <div className="absolute inset-0 z-20" onClick={handlePlayPause} style={{ cursor: 'pointer' }} />

          {/* Cinematic vignette edges */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)',
            }}
          />

          {/* Loading state */}
          {!isReady && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-navy/80">
              <div className="w-10 h-10 border-2 border-white/20 border-t-red rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* ── Glass Premium Controls ── */}
        <div className="mt-6">
          {/* Progress bar */}
          <VideoProgressBar progress={progress} onSeek={handleSeek} />

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5">
            {/* Previous */}
            <GlassButton
              onClick={handlePrev}
              label="Previous video"
              disabled={videos.length <= 1}
              size="sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </GlassButton>

            {/* Play / Pause — larger center button */}
            <GlassButton onClick={handlePlayPause} label={isPlaying ? 'Pause' : 'Play'} size="lg">
              {isPlaying ? (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </GlassButton>

            {/* Next */}
            <GlassButton
              onClick={handleNext}
              label="Next video"
              disabled={videos.length <= 1}
              size="sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </GlassButton>

            {/* Divider */}
            <div className="w-[1px] h-8 bg-white/10 mx-1 sm:mx-2" />

            {/* Mute / Unmute */}
            <GlassButton onClick={handleMuteToggle} label={isMuted ? 'Unmute' : 'Mute'} size="sm">
              {isMuted ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728" />
                </svg>
              )}
            </GlassButton>
          </div>
        </div>

        {/* Title + Description below controls */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-8 text-center"
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

        {/* Video indicator dots */}
        {videos.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {videos.map((v, i) => {
              const t = getLocalizedField(v, 'title', locale);
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveIndex(i);
                    setProgress(0);
                    setIsMuted(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 text-sm ${
                    i === activeIndex
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-transparent text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeIndex ? 'bg-red' : 'bg-white/30'
                    }`}
                  />
                  {t || `Video ${i + 1}`}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
