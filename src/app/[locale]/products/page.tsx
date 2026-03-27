'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ArrowLeft, X, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Product, Category } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Product Detail Modal                                               */
/* ------------------------------------------------------------------ */
function ProductModal({
  product,
  locale,
  categoryName,
  onClose,
}: {
  product: Product;
  locale: string;
  categoryName: string;
  onClose: () => void;
}) {
  const name = getLocalizedField(product, 'name', locale);
  const description = getLocalizedField(product, 'description', locale);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-md" />

      <motion.div
        className="relative bg-cream rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl"
        initial={{ scale: 0.8, y: 60, opacity: 0, rotateX: 15 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-all duration-300 shadow-lg group"
        >
          <X className="w-4 h-4 text-navy group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Image */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-cream-dark/50 to-cream flex items-center justify-center">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-navy/20">
              <Package className="w-20 h-20" />
              <span className="text-sm">No image</span>
            </div>
          )}

          {product.is_featured && (
            <div className="absolute top-4 left-4 bg-red text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
              ★ Featured
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 sm:p-8">
          <span className="inline-block text-red text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            {categoryName}
          </span>
          <h3 className="font-heading text-2xl sm:text-3xl font-bold text-navy mb-4 leading-tight">
            {name}
          </h3>
          <div className="w-12 h-0.5 bg-red/30 mb-4 rounded-full" />
          <p className="text-navy/60 text-sm sm:text-base leading-relaxed">
            {description || 'Premium quality Indonesian product, crafted with authentic recipes and the finest ingredients.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Card (Horizontal Showcase)                                */
/* ------------------------------------------------------------------ */
function CategoryShowcase({
  category,
  products,
  locale,
  index,
  onProductClick,
}: {
  category: Category;
  products: Product[];
  locale: string;
  index: number;
  onProductClick: (p: Product) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const catName = getLocalizedField(category, 'name', locale);
  const isEven = index % 2 === 0;

  /* GSAP reveal */
  useEffect(() => {
    if (!rowRef.current) return;
    const ctx = gsap.context(() => {
      const elements = rowRef.current!.querySelectorAll('.reveal-item');
      gsap.fromTo(
        elements,
        { opacity: 0, y: 50, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: rowRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, rowRef);
    return () => ctx.revert();
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div ref={rowRef} className="mb-20 sm:mb-28 last:mb-0">
      {/* Category Header */}
      <div className={`flex items-end gap-4 mb-8 sm:mb-10 reveal-item ${isEven ? '' : 'sm:flex-row-reverse sm:text-right'}`}>
        <div className="flex-1">
          <div className={`flex items-center gap-3 mb-2 ${!isEven ? 'sm:justify-end' : ''}`}>
            {category.icon && (
              <span className="text-2xl">{category.icon}</span>
            )}
            <span className="text-red text-xs font-bold tracking-[0.25em] uppercase">
              Category {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-navy leading-tight">
            {catName}
          </h2>
          <div className={`w-16 h-[3px] bg-red mt-3 rounded-full ${!isEven ? 'sm:ml-auto' : ''}`} />
        </div>
        <div className="hidden sm:block">
          <span className="text-navy/20 font-heading text-7xl md:text-8xl font-bold leading-none">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Product Row */}
      <div className="relative reveal-item">
        {/* Fade edges */}
        <div className="absolute top-0 left-0 w-8 sm:w-16 h-full bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 sm:w-16 h-full bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollContainerRef}
          className="flex gap-5 sm:gap-7 overflow-x-auto pb-4 px-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

          {products.map((product, pi) => {
            const name = getLocalizedField(product, 'name', locale);
            return (
              <motion.div
                key={product.id}
                className="flex-shrink-0 w-[260px] sm:w-[300px] snap-center group cursor-pointer"
                onClick={() => onProductClick(product)}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Card */}
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500">
                  {/* Image */}
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-cream to-cream-dark overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="300px"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-navy/15">
                        <Package className="w-16 h-16 mb-2" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* View Details CTA */}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-navy text-xs font-semibold px-4 py-2 rounded-full">
                        View Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>

                    {product.is_featured && (
                      <div className="absolute top-3 left-3 bg-red text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                        ★ Featured
                      </div>
                    )}

                    {/* Number Badge */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-navy/10 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white/70 text-xs font-bold">{String(pi + 1).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="font-heading text-base sm:text-lg font-bold text-navy group-hover:text-red transition-colors duration-300 line-clamp-2 leading-snug">
                      {name}
                    </h3>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-6 h-[2px] bg-red/40 rounded-full group-hover:w-10 transition-all duration-500" />
                      <span className="text-navy/40 text-xs font-medium tracking-wider uppercase">
                        {catName}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* End spacer for scroll padding */}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Products Page Content                                         */
/* ------------------------------------------------------------------ */
function ProductsContent() {
  const locale = useLocale();
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        ]);

        if (catRes.data) {
          setCategories(catRes.data as Category[]);
          if (categoryParam) {
            const matched = (catRes.data as Category[]).find((c) => c.slug === categoryParam);
            if (matched) setActiveFilter(matched.id);
          }
        }
        if (prodRes.data) setProducts(prodRes.data as Product[]);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [categoryParam]);

  // Header GSAP
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

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return '';
      return getLocalizedField(cat, 'name', locale);
    },
    [categories, locale]
  );

  const filteredCategories =
    activeFilter === 'all'
      ? categories
      : categories.filter((c) => c.id === activeFilter);

  const getProductsForCategory = useCallback(
    (catId: string) => products.filter((p) => p.category_id === catId),
    [products]
  );

  const totalProducts = products.length;

  return (
    <div className="min-h-screen bg-cream">
      {/* ============ HERO ============ */}
      <div className="relative bg-navy overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
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
          {/* Diagonal accent line */}
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
                {t('title')}
              </span>
            </div>

            <h1 className="hero-reveal font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 leading-[0.95]">
              {t('viewAll')}
            </h1>

            <div className="hero-reveal">
              <div className="w-20 h-[3px] bg-red mb-6 rounded-full" />
              <p className="text-cream/50 max-w-lg text-lg sm:text-xl leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* Stats Row */}
            <div className="hero-reveal flex gap-10 mt-10 pt-8 border-t border-white/10">
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-white">{totalProducts}</span>
                <p className="text-cream/40 text-sm mt-1">Products</p>
              </div>
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-white">{categories.length}</span>
                <p className="text-cream/40 text-sm mt-1">Categories</p>
              </div>
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-red">100%</span>
                <p className="text-cream/40 text-sm mt-1">Authentic</p>
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

      {/* ============ CATEGORY NAV (Sticky) ============ */}
      <div ref={navRef} className="sticky top-0 z-30 bg-cream/95 backdrop-blur-xl border-b border-navy/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div
            className="flex gap-1 overflow-x-auto py-4 -mx-2 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

            <button
              onClick={() => setActiveFilter('all')}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-400 ${
                activeFilter === 'all'
                  ? 'bg-navy text-white shadow-lg shadow-navy/20 scale-105'
                  : 'text-navy/50 hover:text-navy hover:bg-navy/5'
              }`}
            >
              All Products
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-400 ${
                  activeFilter === cat.id
                    ? 'bg-navy text-white shadow-lg shadow-navy/20 scale-105'
                    : 'text-navy/50 hover:text-navy hover:bg-navy/5'
                }`}
              >
                {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                {getLocalizedField(cat, 'name', locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ PRODUCT CATEGORIES SHOWCASE ============ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        {loading ? (
          /* Skeleton */
          <div className="space-y-20">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-navy/5 rounded w-24 mb-3" />
                <div className="h-10 bg-navy/5 rounded w-64 mb-8" />
                <div className="flex gap-6 overflow-hidden">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex-shrink-0 w-[280px]">
                      <div className="aspect-[4/5] bg-navy/5 rounded-2xl" />
                      <div className="mt-4 h-5 bg-navy/5 rounded w-40" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-20 h-20 text-navy/10 mx-auto mb-6" />
            <p className="text-navy/40 text-xl font-heading">{t('noProducts')}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {filteredCategories.map((cat, i) => (
                <CategoryShowcase
                  key={cat.id}
                  category={cat}
                  products={getProductsForCategory(cat.id)}
                  locale={locale}
                  index={i}
                  onProductClick={setSelectedProduct}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ============ PRODUCT MODAL ============ */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            locale={locale}
            categoryName={getCategoryName(selectedProduct.category_id)}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Export                                                         */
/* ------------------------------------------------------------------ */
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ProductsContent />
    </Suspense>
  );
}
