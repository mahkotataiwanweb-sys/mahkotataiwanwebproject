'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { Sparkles, ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

export default function LifestylePage() {
  const locale = useLocale();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLifestyle() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          setArticles(data as Article[]);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchLifestyle();
  }, []);

  // GSAP header animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-navy via-navy/90 to-red-dark pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-red/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-cream/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-cream/60 hover:text-cream text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-red/80 text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Community
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Mahkota Moments
            </h1>
            <div className="w-20 h-[3px] bg-white/50 mb-6" />
            <p className="text-cream/60 max-w-lg text-lg">
              See how our community enjoys Mahkota Taiwan products in their everyday life.
            </p>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className={`rounded-2xl overflow-hidden animate-pulse ${
                  i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square'
                }`}
              >
                <div className="w-full h-full bg-cream-dark min-h-[200px]" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-navy/15 mx-auto mb-4" />
            <p className="text-navy/40 text-lg">No lifestyle articles available yet.</p>
            <p className="text-navy/30 text-sm mt-1">Check back later for community stories!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {articles.map((article, index) => {
              const isLarge = index === 0;
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  className={`group cursor-pointer ${isLarge ? 'col-span-2 row-span-2' : ''}`}
                  onClick={() => setSelectedArticle(article)}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-cream to-cream-dark">
                    <div className={`relative ${isLarge ? 'aspect-square md:aspect-[4/3]' : 'aspect-square'}`}>
                      {article.image_url ? (
                        <Image
                          src={article.image_url}
                          alt={getLocalizedField(article, 'title', locale)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes={isLarge ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy/80 to-red/60">
                          <Sparkles className="w-12 h-12 text-white/30" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                      {/* Text overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <h3
                          className={`font-heading font-bold text-white drop-shadow-lg line-clamp-2 ${
                            isLarge ? 'text-xl md:text-2xl' : 'text-sm md:text-base'
                          }`}
                        >
                          {getLocalizedField(article, 'title', locale)}
                        </h3>
                        {isLarge && (
                          <p className="text-white/70 text-sm mt-2 line-clamp-2 hidden md:block">
                            {getLocalizedField(article, 'excerpt', locale)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative">
              {selectedArticle.image_url ? (
                <div className="aspect-[16/9] relative">
                  <Image
                    src={selectedArticle.image_url}
                    alt={getLocalizedField(selectedArticle, 'title', locale)}
                    fill
                    className="object-cover rounded-t-2xl"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent rounded-t-2xl" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-navy to-red-dark rounded-t-2xl flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-white/30" />
                </div>
              )}

              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <span className="text-xs font-semibold text-red uppercase tracking-wider bg-red/10 px-3 py-1 rounded-full">
                Lifestyle
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy mt-4 mb-4">
                {getLocalizedField(selectedArticle, 'title', locale)}
              </h2>
              <div className="w-16 h-[2px] bg-red mb-6" />
              <div
                className="prose prose-navy max-w-none text-navy/70 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: getLocalizedField(selectedArticle, 'content', locale),
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
