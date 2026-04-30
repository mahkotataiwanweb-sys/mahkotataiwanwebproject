'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, ChefHat, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';
import HeroBackground from '@/components/effects/HeroBackground';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Pinterest-style Masonry Recipe Card — premium scroll reveal        */
/* ------------------------------------------------------------------ */
function RecipeCard({ recipe, locale, index }: { recipe: Article; locale: string; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const title = getLocalizedField(recipe, 'title', locale);
  const excerpt = getLocalizedField(recipe, 'excerpt', locale);
  const tRecipes = useEditableT('recipes');

  // Varied heights for true masonry look
  const heightPattern = [320, 260, 350, 240, 300, 280, 370, 250, 310, 290];
  const cardHeight = heightPattern[index % heightPattern.length];

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 60,
          scale: 0.94,
          rotateX: 8,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 0.9,
          delay: (index % 6) * 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
    return () => ctx.revert();
  }, [index]);

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
      className="break-inside-avoid mb-3 sm:mb-4"
    >
      <Link href={`/${locale}/recipes/${recipe.slug}`} className="block group">
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-navy/5"
          style={{ height: `${cardHeight}px` }}
        >
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red/20 to-navy/10 flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-navy/15" />
            </div>
          )}

          {/* Gradient overlay — intensifies on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            {/* Tags */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.15em] uppercase text-white/80 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <ChefHat className="w-2.5 h-2.5" />
                {tRecipes('recipe')}
              </span>
              {getLocalizedField(recipe, 'description', locale) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.15em] uppercase text-white/80 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <Clock className="w-2.5 h-2.5" />
                  {getLocalizedField(recipe, 'description', locale)}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-heading text-base sm:text-lg lg:text-xl font-bold text-white leading-tight mb-1 group-hover:text-white/90 transition-colors">
              {title}
            </h3>

            {/* Excerpt — shows on hover */}
            <p className="text-white/0 group-hover:text-white/70 text-xs sm:text-sm leading-relaxed transition-all duration-500 line-clamp-2 transform translate-y-2 group-hover:translate-y-0">
              {excerpt}
            </p>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Recipes Page                                                  */
/* ------------------------------------------------------------------ */
export default function RecipesPage() {
  const locale = useLocale();
  const t = useEditableT('recipes');
  const tNav = useEditableT('nav', 'navbar');
  const [recipes, setRecipes] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('type', 'recipe')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

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
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 1, stagger: 0.1, ease: 'power4.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const headingText = t('title');
  const subtitleText = t('subtitle');

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Header */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] overflow-hidden">
        <HeroBackground />

        <div ref={headerRef} className="relative z-10 max-w-7xl mx-auto px-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tNav('home')}
          </Link>

          <p className="text-red-light text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            {t('label')}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            {headingText}
          </h1>
          <div className="w-16 h-[2px] bg-red mb-5" />
          <p className="text-white/50 text-lg max-w-xl">
            {subtitleText}
          </p>
        </div>
      </section>

      {/* Masonry Grid — 2 columns on mobile, 3 on desktop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {loading ? (
          <div className="columns-2 lg:columns-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-navy/5 animate-pulse"
                style={{ height: `${260 + (i % 3) * 40}px` }}
              />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-navy/15 mx-auto mb-4" />
            <p className="text-navy/40 text-lg">
              {t('noRecipes')}
            </p>
          </div>
        ) : (
          <div className="columns-2 lg:columns-3 gap-3 sm:gap-4">
            {recipes.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} locale={locale} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
