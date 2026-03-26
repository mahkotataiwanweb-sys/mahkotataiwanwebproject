'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ChefHat, ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

export default function RecipesPage() {
  const locale = useLocale();
  const [recipes, setRecipes] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Article | null>(null);
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

        if (!error && data) {
          setRecipes(data as Article[]);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
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
      <div className="relative bg-gradient-to-br from-red-dark via-red to-navy pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-navy/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-white/70 text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Delicious Ideas
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Recipes
            </h1>
            <div className="w-20 h-[3px] bg-white/50 mb-6" />
            <p className="text-white/60 max-w-lg text-lg">
              Get inspired and cook delicious meals with our products. Easy recipes for everyone!
            </p>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-cream-dark" />
                <div className="p-6 bg-white space-y-3">
                  <div className="h-3 bg-cream-dark rounded w-20" />
                  <div className="h-5 bg-cream-dark rounded w-52" />
                  <div className="h-3 bg-cream-dark rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-navy/15 mx-auto mb-4" />
            <p className="text-navy/40 text-lg">No recipes available yet.</p>
            <p className="text-navy/30 text-sm mt-1">Check back later for delicious recipe ideas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="group cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="bg-white rounded-2xl overflow-hidden hover-lift premium-shadow h-full">
                  {/* Image */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-cream to-cream-dark">
                    {recipe.image_url ? (
                      <Image
                        src={recipe.image_url}
                        alt={getLocalizedField(recipe, 'title', locale)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ChefHat className="w-16 h-16 text-navy/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <span className="text-xs font-semibold text-red uppercase tracking-wider bg-red/10 px-3 py-1 rounded-full">
                      Recipe
                    </span>
                    <h3 className="font-heading text-xl font-bold text-navy mt-3 mb-2 group-hover:text-red transition-colors duration-300 line-clamp-2">
                      {getLocalizedField(recipe, 'title', locale)}
                    </h3>
                    <p className="text-navy/50 text-sm leading-relaxed line-clamp-3">
                      {getLocalizedField(recipe, 'excerpt', locale)}
                    </p>
                    <div className="mt-4 text-red text-sm font-semibold uppercase tracking-wide group-hover:underline">
                      Read More →
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRecipe(null)}
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
              {selectedRecipe.image_url ? (
                <div className="aspect-[16/9] relative">
                  <Image
                    src={selectedRecipe.image_url}
                    alt={getLocalizedField(selectedRecipe, 'title', locale)}
                    fill
                    className="object-cover rounded-t-2xl"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent rounded-t-2xl" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-red to-navy rounded-t-2xl flex items-center justify-center">
                  <ChefHat className="w-20 h-20 text-white/30" />
                </div>
              )}

              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <span className="text-xs font-semibold text-red uppercase tracking-wider bg-red/10 px-3 py-1 rounded-full">
                Recipe
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy mt-4 mb-4">
                {getLocalizedField(selectedRecipe, 'title', locale)}
              </h2>
              <div className="w-16 h-[2px] bg-red mb-6" />
              <div
                className="prose prose-navy max-w-none text-navy/70 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: getLocalizedField(selectedRecipe, 'content', locale),
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
