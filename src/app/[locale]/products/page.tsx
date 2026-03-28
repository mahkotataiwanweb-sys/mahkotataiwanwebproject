'use client';

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ArrowLeft, X, ChevronLeft, ChevronRight, Shield, Award, Sparkles } from 'lucide-react';
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
/*  Category Showcase Card (for "All Products" landing)                */
/* ------------------------------------------------------------------ */
function CategoryShowcaseCard({
  category,
  locale,
  productCount,
  index,
  onClick,
}: {
  category: Category;
  locale: string;
  productCount: number;
  index: number;
  onClick: () => void;
}) {
  const name = getLocalizedField(category, 'name', locale);
  const description = getLocalizedField(category, 'description', locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 24,
        delay: index * 0.08,
      }}
      whileHover={{ scale: 1.03, y: -8 }}
      onClick={onClick}
      className="cursor-pointer group relative"
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-br from-red/20 via-transparent to-red/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-red/5 transition-all duration-500">
        {/* Category Image / Gradient Background */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-navy via-navy/90 to-navy/80 overflow-hidden">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={name}
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-red/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />

          {/* Icon */}
          <div className="absolute top-5 left-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500">
              {category.icon || '📦'}
            </div>
          </div>

          {/* Product count badge */}
          <div className="absolute top-5 right-5">
            <div className="px-3 py-1.5 rounded-full bg-red/90 backdrop-blur-sm text-white text-xs font-bold shadow-lg">
              {productCount} {productCount === 1 ? 'Product' : 'Products'}
            </div>
          </div>

          {/* Name overlay */}
          <div className="absolute bottom-5 left-5 right-5">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-lg">
              {name}
            </h3>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 bg-cream/95 backdrop-blur-sm">
          <p className="text-navy/50 text-sm leading-relaxed line-clamp-2 mb-4">
            {description || 'Discover our premium selection of authentic products in this category.'}
          </p>
          <div className="flex items-center gap-2 text-red group-hover:gap-3 transition-all duration-300">
            <span className="text-sm font-semibold tracking-wide">Explore Collection</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bezel Product Card (for horizontal slider)                         */
/* ------------------------------------------------------------------ */
function BezelCard({
  product,
  locale,
  isSelected,
  onClick,
}: {
  product: Product;
  locale: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const name = getLocalizedField(product, 'name', locale);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={`shrink-0 cursor-pointer group w-[160px] sm:w-[200px] lg:w-[220px] snap-center ${
        isSelected ? 'z-10' : 'z-0'
      }`}
    >
      {/* Bezel Frame */}
      <div
        className={`relative rounded-2xl p-[6px] sm:p-2 transition-all duration-500 ${
          isSelected
            ? 'bg-gradient-to-br from-red via-red/80 to-red/60 shadow-xl shadow-red/25 scale-105'
            : 'bg-gradient-to-br from-navy/30 via-navy/15 to-navy/5 hover:from-navy/40 hover:via-navy/20 hover:to-navy/10 shadow-md hover:shadow-lg'
        }`}
      >
        {/* Inner bezel shadow */}
        <div className="relative rounded-xl overflow-hidden bg-cream shadow-inner">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-cream-dark/30 to-cream overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={name}
                fill
                className={`object-cover transition-all duration-700 ${
                  isSelected ? 'scale-105' : 'group-hover:scale-110'
                }`}
                sizes="220px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-navy/15">
                <Package className="w-10 h-10" />
              </div>
            )}

            {/* Subtle inner edge highlight */}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-none" />

            {/* Selection indicator glow */}
            {isSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 ring-2 ring-inset ring-red/20 bg-red/5"
              />
            )}
          </div>
        </div>
      </div>

      {/* Product Name below bezel */}
      <div className="mt-3 px-1 text-center">
        <p
          className={`text-xs sm:text-sm font-medium leading-tight line-clamp-2 transition-colors duration-300 ${
            isSelected ? 'text-red font-semibold' : 'text-navy/70 group-hover:text-navy'
          }`}
        >
          {name}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Detail Section (below slider)                              */
/* ------------------------------------------------------------------ */
function ProductDetailSection({
  product,
  locale,
  categoryName,
}: {
  product: Product;
  locale: string;
  categoryName: string;
}) {
  const name = getLocalizedField(product, 'name', locale);
  const description = getLocalizedField(product, 'description', locale);

  return (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
    >
      {/* Left: Product Image in premium frame */}
      <div className="relative">
        {/* Decorative glow behind frame */}
        <div className="absolute -inset-4 bg-gradient-to-br from-red/5 via-transparent to-navy/5 rounded-3xl blur-2xl" />

        <div className="relative rounded-3xl p-3 sm:p-4 bg-gradient-to-br from-navy/10 via-navy/5 to-transparent shadow-2xl">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream shadow-inner">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-navy/15">
                <Package className="w-24 h-24 mb-3" />
                <span className="text-sm">No image</span>
              </div>
            )}
            {/* Inner frame highlight */}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/30" />
          </div>
        </div>
      </div>

      {/* Right: Product Info */}
      <div className="py-2 lg:py-8">
        {/* Category label */}
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-block text-red text-xs font-bold tracking-[0.25em] uppercase mb-4"
        >
          {categoryName}
        </motion.span>

        {/* Product name */}
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-5 leading-[1.1]"
        >
          {name}
        </motion.h2>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-20 h-[3px] bg-gradient-to-r from-red to-red/30 mb-6 rounded-full origin-left"
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-navy/55 text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
        >
          {description || 'Premium quality Indonesian product, crafted with authentic recipes and the finest ingredients. Experience the rich flavors and traditions passed down through generations.'}
        </motion.p>

        {/* Premium badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-navy/5 border border-navy/10"
        >
          <div className="w-9 h-9 rounded-xl bg-red/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-red" />
          </div>
          <div>
            <p className="text-navy text-sm font-semibold">Premium Quality</p>
            <p className="text-navy/40 text-xs">Authentic & Certified</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category View: Bezel Slider + Detail                               */
/* ------------------------------------------------------------------ */
function CategoryProductView({
  products,
  locale,
  categoryName,
}: {
  products: Product[];
  locale: string;
  categoryName: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-select first product when products change
  useEffect(() => {
    setSelectedIndex(0);
  }, [products]);

  const selectedProduct = products[selectedIndex] || null;

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = 240;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (products.length === 0) return null;

  return (
    <div>
      {/* Category Header */}
      <motion.div
        key={`header-${categoryName}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-red rounded-full" />
          <span className="text-red text-xs font-bold tracking-[0.25em] uppercase">
            Category
          </span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy">
          {categoryName}
        </h2>
        <p className="text-navy/40 text-sm mt-2">
          {products.length} product{products.length !== 1 ? 's' : ''} — Select a product to view details
        </p>
      </motion.div>

      {/* Bezel Card Slider */}
      <div className="relative mb-12 sm:mb-16">
        {/* Scroll Buttons */}
        {products.length > 3 && (
          <>
            <button
              onClick={() => scrollSlider('left')}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl flex items-center justify-center transition-all duration-300 group border border-navy/5"
            >
              <ChevronLeft className="w-5 h-5 text-navy/60 group-hover:text-navy transition-colors" />
            </button>
            <button
              onClick={() => scrollSlider('right')}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl flex items-center justify-center transition-all duration-300 group border border-navy/5"
            >
              <ChevronRight className="w-5 h-5 text-navy/60 group-hover:text-navy transition-colors" />
            </button>
          </>
        )}

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" />

        {/* Slider */}
        <div
          ref={sliderRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto py-4 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
          {products.map((product, i) => (
            <BezelCard
              key={product.id}
              product={product}
              locale={locale}
              isSelected={i === selectedIndex}
              onClick={() => setSelectedIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* Product Detail Section */}
      <AnimatePresence mode="wait">
        {selectedProduct && (
          <ProductDetailSection
            key={selectedProduct.id}
            product={selectedProduct}
            locale={locale}
            categoryName={categoryName}
          />
        )}
      </AnimatePresence>
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

  /* Count products per category */
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    return counts;
  }, [products]);

  /* Build the displayed product list for a specific category */
  const displayedProducts =
    activeFilter === 'all'
      ? products
      : products.filter((p) => p.category_id === activeFilter);

  const totalProducts = products.length;

  return (
    <div className="min-h-screen bg-cream">
      {/* ============ HERO ============ */}
      <div className="relative bg-navy overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-red/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cream/5 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(250,237,211,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250,237,211,0.3) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
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
      <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-xl border-b border-navy/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4">
          {/* Row 1: All Products — centered, prominent */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-8 py-3 rounded-2xl text-base font-bold transition-all duration-400 tracking-wide ${
                activeFilter === 'all'
                  ? 'bg-navy text-white shadow-xl shadow-navy/25 scale-105'
                  : 'bg-white/60 backdrop-blur-sm text-navy/60 hover:text-navy hover:bg-white/80 border border-navy/10 hover:border-navy/20 hover:shadow-md'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                All Products
              </span>
            </button>
          </div>

          {/* Row 2: Category buttons — glassmorphism style */}
          <div
            className="flex gap-2 sm:gap-3 overflow-x-auto justify-center -mx-2 px-2 pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-400 ${
                  activeFilter === cat.id
                    ? 'bg-gradient-to-r from-red to-red/85 text-white shadow-lg shadow-red/20 scale-105 ring-2 ring-red/20'
                    : 'bg-white/40 backdrop-blur-md text-navy/60 hover:text-navy hover:bg-white/70 border border-white/50 hover:border-navy/15 ring-1 ring-navy/5 hover:ring-navy/10 hover:shadow-md'
                }`}
              >
                {cat.icon && <span className="text-lg leading-none">{cat.icon}</span>}
                <span>{getLocalizedField(cat, 'name', locale)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ CONTENT AREA ============ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20">
        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-navy/5 rounded-3xl" />
                <div className="mt-4 h-5 bg-navy/5 rounded-lg w-3/4" />
                <div className="mt-2 h-4 bg-navy/5 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : activeFilter === 'all' ? (
          /* ======== ALL PRODUCTS: CATEGORY SHOWCASE LANDING ======== */
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-[2px] bg-red/30 rounded-full" />
                <span className="text-red text-xs font-bold tracking-[0.3em] uppercase">
                  Explore
                </span>
                <div className="w-12 h-[2px] bg-red/30 rounded-full" />
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4">
                Our Collections
              </h2>
              <p className="text-navy/45 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Browse our curated categories of premium products, each crafted with authentic quality and tradition.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {categories.map((cat, i) => (
                <CategoryShowcaseCard
                  key={cat.id}
                  category={cat}
                  locale={locale}
                  productCount={productCountByCategory[cat.id] || 0}
                  index={i}
                  onClick={() => setActiveFilter(cat.id)}
                />
              ))}
            </div>

            {/* Bottom decorative element */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4 mt-16 sm:mt-20"
            >
              <div className="w-16 h-px bg-navy/10" />
              <Award className="w-5 h-5 text-red/30" />
              <div className="w-16 h-px bg-navy/10" />
            </motion.div>
          </>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-20 h-20 text-navy/10 mx-auto mb-6" />
            <p className="text-navy/40 text-xl font-heading">{t('noProducts')}</p>
          </div>
        ) : (
          /* ======== CATEGORY VIEW: BEZEL SLIDER + DETAIL ======== */
          <CategoryProductView
            products={displayedProducts}
            locale={locale}
            categoryName={getCategoryName(activeFilter)}
          />
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
