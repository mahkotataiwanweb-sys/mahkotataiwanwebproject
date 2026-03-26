'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function RecipesSection() {
  const locale = useLocale();
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
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 50, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            stagger: 0.12,
            ease: 'power4.out',
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

  // GSAP scroll-triggered card animations
  useEffect(() => {
    if (loading || recipes.length === 0) return;

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading, recipes.length]);

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-cream relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-navy/[0.02] -skew-x-12 translate-x-1/4" />
      <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-red/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14">
          <div>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Delicious Ideas
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">
              Recipes
            </h2>
            <div className="w-16 h-[2px] bg-red mb-4" />
            <p className="text-navy/60 max-w-lg">
              Get inspired with delicious recipes using Mahkota Taiwan products.
            </p>
          </div>
          <Link
            href={`/${locale}/recipes`}
            className="mt-6 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-red hover:text-red-dark tracking-wide uppercase transition-colors group"
          >
            View All Recipes
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-cream-dark" />
                <div className="pt-5 space-y-3">
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
            <p className="text-navy/40 text-lg">Recipes coming soon!</p>
            <p className="text-navy/30 text-sm mt-1">Check back later for delicious recipe ideas.</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                ref={el => { cardRefs.current[index] = el; }}
                className="group"
              >
                <Link href={`/${locale}/articles/${recipe.slug}`}>
                  <div className="bg-white rounded-2xl overflow-hidden hover-lift premium-shadow transition-shadow duration-500 hover:shadow-2xl">
                    {/* Image */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-cream to-cream-dark">
                      {recipe.image_url ? (
                        <Image
                          src={recipe.image_url}
                          alt={getLocalizedField(recipe, 'title', locale)}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-navy/15" />
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-red uppercase tracking-wider bg-red/10 px-3 py-1 rounded-full">
                          Recipe
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-navy mb-2 group-hover:text-red transition-colors duration-300 line-clamp-2">
                        {getLocalizedField(recipe, 'title', locale)}
                      </h3>
                      <p className="text-navy/50 text-sm leading-relaxed line-clamp-2">
                        {getLocalizedField(recipe, 'excerpt', locale)}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
