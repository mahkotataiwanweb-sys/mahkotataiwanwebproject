'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function MomentsSection() {
  const locale = useLocale();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLifestyle() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'lifestyle')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(6);

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
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
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

  // Don't render section if no lifestyle articles
  if (!loading && articles.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-white relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
      <div className="absolute top-20 left-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14">
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            Community
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">
            Mahkota Moments
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
          <p className="text-navy/60 max-w-lg mx-auto">
            See how our community enjoys Mahkota Taiwan products in their everyday life.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
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
        )}

        {/* Masonry-style Grid */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {articles.map((article, index) => {
              // First item is large
              const isLarge = index === 0;
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`group cursor-pointer ${
                    isLarge ? 'col-span-2 row-span-2' : ''
                  }`}
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
    </section>
  );
}
