'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, ArrowLeft, X, Clock, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Recipe Detail Modal                                                */
/* ------------------------------------------------------------------ */
function RecipeModal({
  recipe,
  locale,
  onClose,
}: {
  recipe: Article;
  locale: string;
  onClose: () => void;
}) {
  const title = getLocalizedField(recipe, 'title', locale);
  const content = getLocalizedField(recipe, 'content', locale);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-navy/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-cream rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.8, y: 60, opacity: 0, rotateX: 15 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-all duration-300 shadow-lg group"
        >
          <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Hero Image */}
        <div className="relative">
          {recipe.image_url ? (
            <div className="relative aspect-[16/9]">
              <Image
                src={recipe.image_url}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />

              {/* Title overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 uppercase tracking-[0.2em] bg-red/80 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3"
                >
                  <ChefHat className="w-3 h-3" />
                  Recipe
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg"
                >
                  {title}
                </motion.h2>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-red via-red/80 to-navy flex items-center justify-center">
              <ChefHat className="w-20 h-20 text-white/20" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 lg:p-10">
          {/* Decorative divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-20 h-[3px] bg-gradient-to-r from-red to-red/30 mb-8 rounded-full origin-left"
          />

          {/* Meta info row */}
          <div className="flex items-center gap-6 mb-8 text-navy/40">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Easy</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Family Size</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Homemade</span>
            </div>
          </div>

          {/* Recipe content */}
          <div
            className="prose prose-navy max-w-none text-navy/70 leading-relaxed prose-headings:font-heading prose-headings:text-navy prose-h2:text-xl prose-h3:text-lg prose-strong:text-navy/80 prose-ul:list-disc prose-ol:list-decimal"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recipe Card                                                        */
/* ------------------------------------------------------------------ */
function RecipeCard({
  recipe,
  locale,
  index,
  onClick,
}: {
  recipe: Article;
  locale: string;
  index: number;
  onClick: () => void;
}) {
  const title = getLocalizedField(recipe, 'title', locale);
  const excerpt = getLocalizedField(recipe, 'excerpt', locale);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      className="group cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,45,90,0.06)] hover:shadow-[0_12px_40px_rgba(0,45,90,0.12)] transition-shadow duration-500 h-full flex flex-col">
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-cream to-cream-dark">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-navy/10" />
            </div>
          )}
          {/* Hover overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-navy/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Category badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-[0.15em] bg-red/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <ChefHat className="w-3 h-3" />
              Recipe
            </span>
          </div>

          {/* Bottom red line on hover */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-10" />
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-heading text-xl font-bold text-navy mb-2 group-hover:text-red transition-colors duration-300 line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-navy/45 text-sm leading-relaxed line-clamp-3 flex-1">
            {excerpt}
          </p>
          <div className="mt-5 flex items-center gap-2 text-red text-sm font-bold uppercase tracking-[0.15em] group-hover:gap-3 transition-all duration-300">
            <div className="w-6 h-px bg-red group-hover:w-10 transition-all duration-300" />
            <span>View Recipe</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
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

  // GSAP hero animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      const items = headerRef.current!.querySelectorAll('.hero-reveal');
      gsap.fromTo(
        items,
        { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          stagger: 0.15,
          ease: 'power4.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* ============ HERO ============ */}
      <div className="relative bg-navy overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-red/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cream/5 blur-[100px]" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(250,237,211,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250,237,211,0.3) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />

          {/* Vertical accent line */}
          <div className="absolute top-0 right-[20%] w-px h-full bg-gradient-to-b from-transparent via-red/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10 pt-32 sm:pt-36 pb-24 sm:pb-32">
          <Link
            href={`/${locale}`}
            className="hero-reveal inline-flex items-center gap-2 text-cream/40 hover:text-cream text-sm mb-10 transition-colors duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div ref={headerRef} className="max-w-3xl">
            <div className="hero-reveal flex items-center gap-3 mb-5">
              <div className="w-10 h-[2px] bg-red rounded-full" />
              <span className="text-red text-sm tracking-[0.3em] uppercase font-semibold">
                Delicious Ideas
              </span>
            </div>

            <h1 className="hero-reveal font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 leading-[0.95]">
              Recipes
            </h1>

            <div className="hero-reveal">
              <div className="w-20 h-[3px] bg-red mb-6 rounded-full" />
              <p className="text-cream/50 max-w-lg text-lg sm:text-xl leading-relaxed">
                Get inspired and cook delicious meals with our products. Easy recipes for everyone!
              </p>
            </div>

            {/* Stats Row */}
            <div className="hero-reveal flex gap-10 mt-10 pt-8 border-t border-white/10">
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-white">
                  {loading ? '—' : recipes.length}
                </span>
                <p className="text-cream/40 text-sm mt-1">Recipes</p>
              </div>
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-red">100%</span>
                <p className="text-cream/40 text-sm mt-1">Homemade</p>
              </div>
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-white">Easy</span>
                <p className="text-cream/40 text-sm mt-1">To Follow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z"
              fill="var(--color-cream)"
            />
          </svg>
        </div>
      </div>

      {/* ============ RECIPES GRID ============ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        {loading ? (
          /* Premium Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse">
                <div className="aspect-[4/3] bg-navy/5 rounded-2xl" />
                <div className="mt-5 space-y-3 px-1">
                  <div className="h-5 bg-navy/5 rounded-lg w-3/4" />
                  <div className="h-3 bg-navy/5 rounded-lg w-full" />
                  <div className="h-3 bg-navy/5 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          /* Premium Empty State */
          <div className="text-center py-24 sm:py-32">
            <div className="relative inline-block mb-8">
              {/* Decorative ring */}
              <div className="absolute -inset-6 rounded-full border-2 border-dashed border-navy/10 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy/5 to-red/5 flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-navy/15" />
              </div>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-navy/30 mb-3">
              No Recipes Yet
            </h3>
            <p className="text-navy/30 text-base max-w-md mx-auto leading-relaxed">
              We&apos;re cooking up something special! Check back later for delicious recipe ideas using our products.
            </p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <div className="w-16 h-px bg-navy/10" />
              <Sparkles className="w-5 h-5 text-red/30" />
              <div className="w-16 h-px bg-navy/10" />
            </div>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 sm:mb-14"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-[2px] bg-red rounded-full" />
                <span className="text-red text-xs font-bold tracking-[0.3em] uppercase">
                  Collection
                </span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3 leading-[1.05]">
                All Recipes
              </h2>
              <p className="text-navy/40 text-base max-w-lg leading-relaxed">
                Tap a recipe to discover step-by-step cooking instructions.
              </p>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  locale={locale}
                  index={index}
                  onClick={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>

            {/* Bottom decorative element */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 mt-16 sm:mt-20"
            >
              <div className="w-16 h-px bg-navy/10" />
              <ChefHat className="w-5 h-5 text-red/30" />
              <div className="w-16 h-px bg-navy/10" />
            </motion.div>
          </>
        )}
      </div>

      {/* ============ RECIPE MODAL ============ */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            locale={locale}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
