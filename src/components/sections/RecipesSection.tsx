'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function RecipesSection() {
  const locale = useLocale();
  const t = useTranslations('recipes');
  const [recipes, setRecipes] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'recipe')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(6);

        if (!error && data) setRecipes(data as Article[]);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  // Header animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(headerRef.current.children,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            duration: 1, stagger: 0.12, ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Card animations
  useEffect(() => {
    if (loading || recipes.length === 0) return;
    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.8, delay: i * 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading, recipes.length]);

  const headingLabel = t('label');
  const headingTitle = t('title');
  const headingSub = t('subtitle');
  const viewAllLabel = t('viewAll');

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-navy/[0.02] -skew-x-12 translate-x-1/4" />
<div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14">
          <div>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">{headingLabel}</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">{headingTitle}</h2>
            <div className="w-16 h-[2px] bg-red mb-4" />
            <p className="text-navy/60 max-w-lg">{headingSub}</p>
          </div>
          <Link
            href={`/${locale}/recipes`}
            className="mt-6 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-red hover:text-red-dark tracking-wide uppercase transition-colors group"
          >
            {viewAllLabel}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-cream-dark" />
                <div className="pt-5 space-y-3">
                  <div className="h-3 bg-cream-dark rounded w-20" />
                  <div className="h-5 bg-cream-dark rounded w-52" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="w-14 h-14 text-navy/10 mx-auto mb-4" />
            <p className="text-navy/40">No recipes yet</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recipes.map((recipe, i) => {
              const title = getLocalizedField(recipe, 'title', locale);
              const excerpt = getLocalizedField(recipe, 'excerpt', locale);
              return (
                <div
                  key={recipe.id}
                  ref={(el) => { cardRefs.current[i] = el; }}
                >
                  <Link href={`/${locale}/recipes/${recipe.slug}`} className="block group">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-navy/5">
                      {recipe.image_url ? (
                        <Image
                          src={recipe.image_url}
                          alt={title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red/10 to-navy/5 flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-navy/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Time badge */}
                      {getLocalizedField(recipe, 'description', locale) && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-white/90 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                          <Clock className="w-2.5 h-2.5" />
                          {getLocalizedField(recipe, 'description', locale)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-red/60 text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5">
                        <ChefHat className="w-3 h-3" />
                        {t('recipe')}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-navy group-hover:text-red transition-colors duration-300 mb-1.5">
                        {title}
                      </h3>
                      <p className="text-navy/50 text-sm line-clamp-2 leading-relaxed">{excerpt}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
