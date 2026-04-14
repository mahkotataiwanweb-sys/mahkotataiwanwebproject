'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Play, Youtube, Music, Square, Film } from 'lucide-react';
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
  icon: Icon,
}: {
  category: VideoCategory;
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
        isActive
          ? 'bg-red text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* Extract TikTok Video ID */
function extractTikTokId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/(\w+)/,
    /vt\.tiktok\.com\/(\w+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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

/* TikTok Player Component */
function TikTokPlayer({ videoId }: { videoId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full flex justify-center rounded-2xl overflow-hidden shadow-2xl"
    >
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}`}
        width="100%"
        height="600"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full"
      />
    </motion.div>
  );
}

/* Video Card - Embedded Player for Shorts/TikTok/Reels */
function VideoCard({
  video,
  category,
  onClick,
}: {
  video: VideoShowcase;
  category: VideoCategory;
  onClick: (video: VideoShowcase) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full rounded-xl shadow-lg bg-gray-900 transition-shadow ${
        category === 'reels'
          ? 'overflow-hidden'
          : 'aspect-[9/16] overflow-hidden cursor-pointer hover:shadow-xl'
      }`}
      style={category === 'reels' ? { height: '575px' } : {}}
      onClick={() => category !== 'reels' && onClick(video)}
    >
      {category === 'shorts' && extractYouTubeId(video.video_url) && (
        <iframe
          width="100%"
          height="350"
          src={`https://www.youtube.com/embed/${extractYouTubeId(video.video_url)}`}
          title={video.title_en}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      )}
      {category === 'tiktok' && extractTikTokId(video.video_url) && (
        <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden" style={{ clipPath: 'inset(0)' }}>
          <iframe
            src={`https://www.tiktok.com/embed/v2/${extractTikTokId(video.video_url)}`}
            width="320"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
              width: '320px',
              height: '580px',
              border: 'none',
              marginTop: '-20px'
            }}
          />
        </div>
      )}
      {category === 'reels' && video.video_url && (
        <div
          className="w-full h-full bg-black relative flex flex-col items-center justify-start p-2"
          style={{
            backgroundColor: '#000'
          }}
        >
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={video.video_url}
            data-instgrm-version="14"
            style={{
              maxWidth: '100%',
              width: '320px',
              margin: '8px auto',
              padding: '0'
            }}
          />
          <script async src="//www.instagram.com/embed.js" />
        </div>
      )}
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
  const [selectedVideo, setSelectedVideo] = useState<VideoShowcase | null>(null);

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
      <section className="py-6 sm:py-12" style={{ backgroundColor: '#004a6e' }}>
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
      className="py-6 sm:py-12 relative overflow-hidden"
      style={{ backgroundColor: '#004a6e' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            Visual Content
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
            Watch Our Stories
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-6" />
          <p className="text-gray-100 max-w-2xl mx-auto text-base sm:text-lg">
            Discover Mahkota Taiwan through our video content across YouTube,
            Shorts, TikTok, and Reels.
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
            icon={Youtube}
            isActive={activeCategory === 'youtube'}
            onClick={() => handleCategoryChange('youtube')}
          />
          <CategoryTab
            category="shorts"
            label="Shorts"
            icon={Square}
            isActive={activeCategory === 'shorts'}
            onClick={() => handleCategoryChange('shorts')}
          />
          <CategoryTab
            category="tiktok"
            label="TikTok"
            icon={Music}
            isActive={activeCategory === 'tiktok'}
            onClick={() => handleCategoryChange('tiktok')}
          />
          <CategoryTab
            category="reels"
            label="Reels"
            icon={Film}
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
                <div className="max-w-2xl mx-auto">
                  <AnimatePresence mode="wait">
                    {extractYouTubeId(activeVideo.video_url) && (
                      <YouTubePlayer
                        key={activeVideo.id}
                        videoId={extractYouTubeId(activeVideo.video_url)!}
                      />
                    )}
                  </AnimatePresence>
                </div>

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
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center">
              {activeCategory === 'shorts'
                ? 'Shorts'
                : activeCategory === 'tiktok'
                ? 'TikTok Videos'
                : 'Reels'}
            </h3>

            {/* Videos Grid */}
            <div
              ref={scrollContainerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categoryVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  category={activeCategory}
                  onClick={setSelectedVideo}
                />
              ))}
            </div>

            {/* Video Info */}
            {categoryVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mt-12"
              >
                <p className="text-sm text-gray-300">
                  Showing {categoryVideos.length} video{categoryVideos.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xs aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-red text-white rounded-full hover:bg-red/80 transition-colors"
              >
                <Play className="w-5 h-5 rotate-90" />
              </button>

              <div className={`relative w-full h-full bg-black ${activeCategory === 'reels' ? 'overflow-auto' : 'overflow-hidden'}`}>
                {activeCategory === 'shorts' && extractYouTubeId(selectedVideo.video_url) && (
                  <iframe
                    width="100%"
                    height="600"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideo.video_url)}`}
                    title={selectedVideo.title_en}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                )}
                {activeCategory === 'tiktok' && extractTikTokId(selectedVideo.video_url) && (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', overflow: 'hidden', clipPath: 'inset(0)' }}>
                    <iframe
                      src={`https://www.tiktok.com/embed/v2/${extractTikTokId(selectedVideo.video_url)}`}
                      width="320"
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      style={{
                        width: '320px',
                        height: '580px',
                        border: 'none',
                        marginTop: '-20px'
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
