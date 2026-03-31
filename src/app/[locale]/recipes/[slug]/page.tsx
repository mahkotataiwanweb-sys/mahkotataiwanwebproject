'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import gsap from 'gsap';
import { ArrowLeft, Clock, Users, ChefHat, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Content Parser — parse markdown-like content into sections          */
/* ------------------------------------------------------------------ */
function parseRecipeContent(content: string) {
  const sections: { heading: string; items: string[] }[] = [];
  let currentHeading = '';
  let currentItems: string[] = [];

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      if (currentHeading || currentItems.length > 0) {
        sections.push({ heading: currentHeading, items: [...currentItems] });
      }
      currentHeading = trimmed.replace('## ', '');
      currentItems = [];
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentItems.push(trimmed.replace(/^[-*]\s+/, ''));
    } else if (/^\d+\.\s/.test(trimmed)) {
      currentItems.push(trimmed.replace(/^\d+\.\s+/, ''));
    } else if (trimmed.length > 0 && !trimmed.startsWith('#')) {
      currentItems.push(trimmed);
    }
  }
  if (currentHeading || currentItems.length > 0) {
    sections.push({ heading: currentHeading, items: [...currentItems] });
  }

  return sections;
}

/* ------------------------------------------------------------------ */
/*  Recipe Detail Page                                                 */
/* ------------------------------------------------------------------ */
export default function RecipeDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const [recipe, setRecipe] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('type', 'recipe')
          .eq('is_active', true)
          .single();

        if (!error && data) setRecipe(data as Article);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchRecipe();
  }, [slug]);

  // GSAP animations
  useEffect(() => {
    if (!recipe || !contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current!.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
      );
    });
    return () => ctx.revert();
  }, [recipe]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="pt-32 pb-16 bg-navy">
          <div className="max-w-4xl mx-auto px-6">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
            <div className="h-12 w-96 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="aspect-[16/9] bg-navy/5 rounded-3xl animate-pulse mb-8" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-navy/5 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-navy/5 rounded animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-navy/15 mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-navy mb-2">
            {locale === 'id' ? 'Resep tidak ditemukan' : locale === 'zh-TW' ? '找不到食譜' : 'Recipe not found'}
          </h2>
          <Link href={`/${locale}/recipes`} className="text-red hover:text-red-dark font-medium text-sm">
            {locale === 'id' ? 'Kembali ke resep' : locale === 'zh-TW' ? '返回食譜' : 'Back to recipes'}
          </Link>
        </div>
      </main>
    );
  }

  const title = getLocalizedField(recipe, 'title', locale);
  const excerpt = getLocalizedField(recipe, 'excerpt', locale);
  const content = getLocalizedField(recipe, 'content', locale);
  const sections = content ? parseRecipeContent(content) : [];

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section ref={heroRef} className="relative bg-navy overflow-hidden">
        <div className="pt-28 sm:pt-36 pb-8 sm:pb-12 relative z-10 max-w-4xl mx-auto px-6">
          <Link
            href={`/${locale}/recipes`}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === 'id' ? 'Semua Resep' : locale === 'zh-TW' ? '所有食譜' : 'All Recipes'}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-red-light bg-red/10 px-3 py-1.5 rounded-full">
                <ChefHat className="w-3 h-3" />
                {locale === 'id' ? 'Resep' : locale === 'zh-TW' ? '食譜' : 'Recipe'}
              </span>
              {getLocalizedField(recipe, 'description', locale) && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 bg-white/5 px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {getLocalizedField(recipe, 'description', locale)}
                </span>
              )}
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {title}
            </h1>
            <div className="w-16 h-[2px] bg-red mb-4" />
            <p className="text-white/45 text-base sm:text-lg max-w-2xl leading-relaxed">
              {excerpt}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Hero Image */}
      {recipe.image_url && (
        <section className="max-w-4xl mx-auto px-6 -mt-2">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.15)]"
          >
            <Image
              src={recipe.image_url}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
            <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.1)] pointer-events-none rounded-2xl sm:rounded-3xl" />
          </motion.div>
        </section>
      )}

      {/* Recipe Content */}
      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div ref={contentRef} className="space-y-10">
          {sections.map((section, sIdx) => {
            const isIngredients =
              section.heading.toLowerCase().includes('ingredient') ||
              section.heading.toLowerCase().includes('bahan') ||
              section.heading.toLowerCase().includes('材料') ||
              section.heading.toLowerCase().includes('食材');

            const isSteps =
              section.heading.toLowerCase().includes('instruction') ||
              section.heading.toLowerCase().includes('step') ||
              section.heading.toLowerCase().includes('langkah') ||
              section.heading.toLowerCase().includes('cara') ||
              section.heading.toLowerCase().includes('做法') ||
              section.heading.toLowerCase().includes('步驟');

            const isTips =
              section.heading.toLowerCase().includes('tip') ||
              section.heading.toLowerCase().includes('note') ||
              section.heading.toLowerCase().includes('catatan');

            return (
              <motion.div
                key={sIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: sIdx * 0.05 }}
              >
                {section.heading && (
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isIngredients ? 'bg-green-100 text-green-600' :
                      isSteps ? 'bg-red/10 text-red' :
                      isTips ? 'bg-amber-100 text-amber-600' :
                      'bg-navy/5 text-navy'
                    }`}>
                      {isIngredients && <Sparkles className="w-4 h-4" />}
                      {isSteps && <ChefHat className="w-4 h-4" />}
                      {isTips && <Sparkles className="w-4 h-4" />}
                      {!isIngredients && !isSteps && !isTips && <ChefHat className="w-4 h-4" />}
                    </div>
                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">
                      {section.heading}
                    </h2>
                  </div>
                )}

                {isIngredients ? (
                  <div className="bg-cream-dark/50 rounded-2xl p-6 sm:p-8">
                    <ul className="space-y-2.5">
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-3 text-navy/70 text-sm sm:text-base leading-relaxed">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-red/40 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : isSteps ? (
                  <div className="space-y-4">
                    {section.items.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex gap-4 sm:gap-5">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                          {stepIdx + 1}
                        </div>
                        <p className="text-navy/70 text-sm sm:text-base leading-relaxed pt-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : isTips ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 sm:p-8">
                    <ul className="space-y-2.5">
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="text-amber-900/70 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400/60 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.items.map((item, iIdx) => (
                      <p key={iIdx} className="text-navy/60 text-sm sm:text-base leading-relaxed">
                        {item}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Back to recipes */}
        <div className="mt-16 pt-8 border-t border-navy/5">
          <Link
            href={`/${locale}/recipes`}
            className="inline-flex items-center gap-2 text-red hover:text-red-dark font-semibold text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {locale === 'id' ? 'Kembali ke Semua Resep' : locale === 'zh-TW' ? '返回所有食譜' : 'Back to All Recipes'}
          </Link>
        </div>
      </section>
    </main>
  );
}
