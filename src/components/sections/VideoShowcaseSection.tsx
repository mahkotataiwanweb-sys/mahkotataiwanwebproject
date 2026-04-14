'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { VideoShowcase } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

type VideoCategory = 'youtube' | 'shorts' | 'tiktok' | 'reels';

/* Extract YouTube Video ID */
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

/* Category Tab Button */
function CategoryTab({
  category,
  label,
  isActive,
  onClick,
}: {
  category: VideoCategory;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
        isActive
          ? 'bg-red text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

/* YouTube Player Component */
function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl"
    >
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1`}
        title="YouTube Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </motion.div>
  );
}

/* Video Card for Shorts/TikTok/Reels */
function VideoCard({
  video,
  category,
  onClick,
}: {
  video: VideoShowcase;
  category: VideoCategory;
  onClick: () => void;
}) {
  const getEmbedUrl = () => {
    if (category === 'shorts') {
      const videoId = extractYouTubeId(video.video_url);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    } else if (category === 'tiktok') {
      // TikTok embed
      return video.video_url;
    } else if (category === 'reels') {
      // Instagram Reels embed
      return video.video_url;
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 w-48 h-96 rounded-xl overflow-hidden shadow-lg bg-gray-900 cursor-pointer group"
      onClick={onClick}
    >
      {video.thumbnail_url ? (
        <img
          src={video.thumbnail_url}
          alt={video.title_en}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <Play className="w-12 h-12 text-white/60" />
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Play className="w-8 h-8 text-white fill-white" />
        </div>
      </div>
    </motion.div>
  );
}

/* Main Component */
export default function VideoShowcaseSection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [videos, setVideos] = useState<VideoShowcase[]>([]);
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('youtube');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /* Fetch videos */
  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('video_showcases')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setVideos((data || []) as VideoShowcase[]);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideos();
  }, []);

  /* Get videos for active category */
  const categoryVideos = videos.filter((v) => v.video_category === activeCategory);
  const activeVideo = categoryVideos[activeVideoIndex] || null;

  /* Navigate to next video in category */
  const goToNextVideo = useCallback(() => {
    if (categoryVideos.length > 1) {
      setActiveVideoIndex((prev) => (prev + 1) % categoryVideos.length);
    }
  }, [categoryVideos.length]);

  /* Navigate to previous video in category */
  const goToPrevVideo = useCallback(() => {
    if (categoryVideos.length > 1) {
      setActiveVideoIndex((prev) => (prev - 1 + categoryVideos.length) % categoryVideos.length);
    }
  }, [categoryVideos.length]);

  /* Handle category change */
  const handleCategoryChange = (category: VideoCategory) => {
    setActiveCategory(category);
    setActiveVideoIndex(0);
  };

  /* Scroll container for grid */
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  /* Animation setup */
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const ctx = gsap.context(() => {
      gsap.to(sectionEl, {
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top center',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 sm:py-32 bg-blue-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="h-10 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-gray-100 rounded w-96 mx-auto animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-blue-50 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            Visual Content
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-navy tracking-tight mb-4">
            Watch Our Stories
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-6" />
          <p className="text-navy/60 max-w-2xl mx-auto text-base sm:text-lg">
            Discover Mahkota Taiwan through our video content across YouTube,
            Shorts, TikTok, and Instagram Reels.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="flex justify-center gap-3 mb-14 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <CategoryTab
            category="youtube"
            label="YouTube"
            isActive={activeCategory === 'youtube'}
            onClick={() => handleCategoryChange('youtube')}
          />
          <CategoryTab
            category="shorts"
            label="Shorts"
            isActive={activeCategory === 'shorts'}
            onClick={() => handleCategoryChange('shorts')}
          />
          <CategoryTab
            category="tiktok"
            label="TikTok"
            isActive={activeCategory === 'tiktok'}
            onClick={() => handleCategoryChange('tiktok')}
          />
          <CategoryTab
            category="reels"
            label="Instagram Reels"
            isActive={activeCategory === 'reels'}
            onClick={() => handleCategoryChange('reels')}
          />
        </motion.div>

        {/* Video Display Area */}
        {categoryVideos.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-400 text-lg">No videos available for this category yet.</p>
          </motion.div>
        ) : activeCategory === 'youtube' ? (
          // YouTube: Single large video
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {activeVideo && (
              <>
                {/* Video Title */}
                <motion.h3
                  key={`title-${activeVideoIndex}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl sm:text-3xl font-bold text-navy mb-6 text-center"
                >
                  {getLocalizedField(activeVideo, 'title', locale)}
                </motion.h3>

                {/* Video Player */}
                <AnimatePresence mode="wait">
                  {extractYouTubeId(activeVideo.video_url) && (
                    <YouTubePlayer
                      key={activeVideo.id}
                      videoId={extractYouTubeId(activeVideo.video_url)!}
                    />
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10">
                  <button
                    onClick={goToPrevVideo}
                    disabled={categoryVideos.length <= 1}
                    className="p-3 rounded-full bg-red/10 hover:bg-red/20 disabled:opacity-30 disabled:cursor-not-allowed text-red transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="flex gap-2">
                    {categoryVideos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveVideoIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === activeVideoIndex
                            ? 'w-8 bg-red'
                            : 'w-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={goToNextVideo}
                    disabled={categoryVideos.length <= 1}
                    className="p-3 rounded-full bg-red/10 hover:bg-red/20 disabled:opacity-30 disabled:cursor-not-allowed text-red transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          // Shorts/TikTok/Reels: Grid with horizontal scroll
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-navy mb-8 text-center">
              {activeCategory === 'shorts'
                ? 'Shorts'
                : activeCategory === 'tiktok'
                ? 'TikTok Videos'
                : 'Instagram Reels'}
            </h3>

            {/* Horizontal Scroll Container */}
            <div className="relative">
              {/* Scroll Buttons */}
              {categoryVideos.length > 2 && (
                <>
                  <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 z-20 p-3 rounded-full bg-red/10 hover:bg-red/20 text-red transition-colors hidden sm:flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-6 z-20 p-3 rounded-full bg-red/10 hover:bg-red/20 text-red transition-colors hidden sm:flex items-center justify-center"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Videos Grid */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-2 -mx-2"
              >
                {categoryVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    category={activeCategory}
                    onClick={() => {
                      // Play video (could open modal or navigate)
                      window.open(video.video_url, '_blank');
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Video Info */}
            {categoryVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mt-12"
              >
                <p className="text-sm text-gray-500">
                  Showing {categoryVideos.length} video{categoryVideos.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
