'use client';

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Package, ArrowLeft, X, ChevronLeft, ChevronRight,
  Shield, Award, Sparkles, Search, ArrowRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { getLocalizedField } from '@/lib/utils';
import type { Product, Category } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  ShowcaseProduct interface                                          */
/* ------------------------------------------------------------------ */
interface ShowcaseProduct {
  id: string;
  category: string;
  name: string;
  name_zh: string;
  name_id: string;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  image_url: string | null;
  detail_image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Smart Search Component                                             */
/* ------------------------------------------------------------------ */
function SmartSearch({
  products,
  categories,
  locale,
  onSelectCategory,
}: {
  products: Product[];
  categories: Category[];
  locale: string;
  onSelectCategory: (categoryId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter((p) => {
        const name = getLocalizedField(p, 'name', locale).toLowerCase();
        const nameEn = (p.name_en || '').toLowerCase();
        const nameId = (p.name_id || '').toLowerCase();
        const nameZh = (p.name_zh || '').toLowerCase();
        return name.includes(q) || nameEn.includes(q) || nameId.includes(q) || nameZh.includes(q);
      })
      .slice(0, 8);
  }, [query, products, locale]);

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      return cat ? getLocalizedField(cat, 'name', locale) : '';
    },
    [categories, locale]
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Search Input */}
      <div className={`relative transition-all duration-500 ${
        focused ? 'scale-[1.02]' : ''
      }`}>
        <div className={`absolute -inset-1 rounded-2xl blur-xl transition-all duration-500 ${
          focused ? 'bg-red/15 opacity-100' : 'opacity-0'
        }`} />
        <div className={`relative flex items-center rounded-2xl transition-all duration-500 overflow-hidden ${
          focused
            ? 'bg-white shadow-2xl shadow-navy/15 ring-2 ring-red/20'
            : 'bg-white/80 shadow-lg shadow-navy/5 ring-1 ring-navy/10 hover:ring-navy/20 hover:shadow-xl'
        }`}>
          <Search className={`ml-5 w-5 h-5 shrink-0 transition-colors duration-300 ${
            focused ? 'text-red' : 'text-navy/30'
          }`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search products across all categories..."
            className="flex-1 px-4 py-4 bg-transparent text-navy placeholder:text-navy/30 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="mr-4 p-1.5 rounded-full hover:bg-navy/5 transition-colors"
            >
              <X className="w-4 h-4 text-navy/40" />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {focused && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-full left-0 right-0 mt-3 rounded-2xl bg-white/98 backdrop-blur-xl shadow-2xl border border-navy/8 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
          >
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-10 h-10 text-navy/15 mx-auto mb-3" />
                <p className="text-navy/40 text-sm">No products found</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((product, i) => {
                  const name = getLocalizedField(product, 'name', locale);
                  const catName = getCategoryName(product.category_id);
                  return (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        onSelectCategory(product.category_id);
                        setQuery('');
                        setFocused(false);
                      }}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-cream/60 transition-all duration-200 group text-left"
                    >
                      {/* Product thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-cream/80 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={name}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <Package className="w-5 h-5 text-navy/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-navy font-semibold text-sm truncate group-hover:text-red transition-colors">
                          {name}
                        </p>
                        <p className="text-navy/40 text-xs mt-0.5">{catName}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-navy/20 group-hover:text-red group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Modal                                                      */
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-all duration-300 shadow-lg group"
        >
          <X className="w-4 h-4 text-navy group-hover:rotate-90 transition-transform duration-300" />
        </button>
        <div className="relative w-full aspect-square bg-gradient-to-br from-cream-dark/50 to-cream flex items-center justify-center overflow-hidden">
          {(product.detail_image_url || product.image_url) ? (
            <Image
              src={product.detail_image_url || product.image_url || ''}
              alt={name}
              fill
              className={product.detail_image_url ? "object-contain p-6" : "object-contain p-4"}
              sizes="(max-width: 512px) 100vw, 512px"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-navy/20">
              <Package className="w-20 h-20" />
            </div>
          )}
        </div>
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
/*  Category Card — Full-bleed cinematic style                         */
/* ------------------------------------------------------------------ */
function CategoryCard({
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const imgX = (mousePos.x - 0.5) * -15;
  const imgY = (mousePos.y - 0.5) * -15;

  // Masonry-style heights: alternating tall and short
  const isLarge = index % 3 === 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 22,
        delay: index * 0.08,
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      className="cursor-pointer group relative rounded-3xl overflow-hidden"
    >
      <div className={`relative overflow-hidden bg-navy ${isLarge ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={name}
            fill
            className="object-cover transition-all duration-[800ms] ease-out will-change-transform"
            style={{
              transform: isHovered
                ? `scale(1.15) translate(${imgX}px, ${imgY}px)`
                : 'scale(1.05) translate(0px, 0px)',
              filter: isHovered ? 'brightness(0.65) saturate(1.2)' : 'brightness(0.5) saturate(1)',
            }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-red/20" />
        )}

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/5" />

        {/* Cursor spotlight */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle 300px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.08), transparent)`,
          }}
        />

        {/* Top badge */}
        <div className="absolute top-5 right-5 z-10">
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold tracking-wider border border-white/10 group-hover:bg-white/20 transition-all duration-500">
            {productCount} items
          </div>
        </div>

        {/* Category icon */}
        <div className="absolute top-5 left-5 z-10 opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 text-white drop-shadow-lg">
          <CategoryIcon slug={category.slug} size={32} />
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
          <div className="transform transition-all duration-500 group-hover:-translate-y-2">
            <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-[1.05] mb-2 drop-shadow-lg">
              {name}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed line-clamp-2 max-w-xs group-hover:text-white/65 transition-colors duration-500">
              {description || 'Discover our premium selection'}
            </p>
          </div>

          {/* Explore reveal */}
          <div className="mt-4 overflow-hidden h-0 group-hover:h-10 transition-all duration-500 ease-out">
            <div className="flex items-center gap-2 text-white/80 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="w-8 h-px bg-red" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Explore</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Bottom line accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-20" />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Product Card (for category view)                          */
/* ------------------------------------------------------------------ */
function FloatingProductCard({
  product,
  locale,
  index,
  onClick,
  showcaseImageUrl,
}: {
  product: Product;
  locale: string;
  index: number;
  onClick: () => void;
  showcaseImageUrl?: string | null;
}) {
  const name = getLocalizedField(product, 'name', locale);
  const imageUrl = showcaseImageUrl || product.image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
        delay: index * 0.06,
      }}
      whileHover={{ y: -12, scale: 1.03 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Floating card — no border, just shadow */}
      <div className="relative">
        {/* Hover glow */}
        <div className="absolute -inset-3 rounded-3xl bg-red/0 group-hover:bg-red/8 blur-2xl transition-all duration-700" />

        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cream via-white to-cream/50 shadow-lg shadow-navy/5 group-hover:shadow-2xl group-hover:shadow-navy/12 transition-all duration-500">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-contain p-4 transition-all duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-navy/10">
                <Package className="w-16 h-16" />
              </div>
            )}

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 group-hover:via-white/20 group-hover:to-transparent transition-all duration-700 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Name floating below */}
      <div className="mt-4 px-1 text-center">
        <p className="text-sm font-semibold text-navy/70 group-hover:text-navy transition-colors duration-300 line-clamp-2 leading-snug">
          {name}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Detail Section (when product is selected)                  */
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
      className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10 lg:gap-16 items-center mt-16 pt-16 border-t border-navy/5"
    >
      {/* Left: Image with premium framing */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-br from-red/5 via-transparent to-navy/5 rounded-[2rem] blur-3xl" />
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-cream via-white to-cream shadow-2xl shadow-navy/8">
          <div className={`relative aspect-square ${product.detail_image_url ? 'bg-navy/90' : 'bg-cream'}`}>
            {(product.detail_image_url || product.image_url) ? (
              <Image
                src={product.detail_image_url || product.image_url || ''}
                alt={name}
                fill
                className={product.detail_image_url ? "object-contain p-6" : "object-contain p-4"}
                sizes="(max-width: 1024px) 100vw, 360px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-navy/15">
                <Package className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Product Info */}
      <div className="py-2 lg:py-6">
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-block text-red text-xs font-bold tracking-[0.25em] uppercase mb-4"
        >
          {categoryName}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-5 leading-[1.1]"
        >
          {name}
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-20 h-[3px] bg-gradient-to-r from-red to-red/30 mb-6 rounded-full origin-left"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-navy/55 text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
        >
          {description || 'Premium quality Indonesian product, crafted with authentic recipes and the finest ingredients. Experience the rich flavors and traditions passed down through generations.'}
        </motion.p>
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
/*  Category Product View                                              */
/* ------------------------------------------------------------------ */
function CategoryProductView({
  products,
  locale,
  categoryName,
  onBack,
  getShowcaseImage,
}: {
  products: Product[];
  locale: string;
  categoryName: string;
  onBack: () => void;
  getShowcaseImage: (product: Product) => string | null;
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (products.length === 0) return null;

  return (
    <div>
      {/* Back + Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-navy/40 hover:text-navy text-sm mb-6 transition-colors duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Collections
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-red rounded-full" />
          <span className="text-red text-xs font-bold tracking-[0.25em] uppercase">Category</span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
          {categoryName}
        </h2>
        <p className="text-navy/40 text-sm mt-2">
          {products.length} product{products.length !== 1 ? 's' : ''} — Tap any product for details
        </p>
      </motion.div>

      {/* Floating Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        {products.map((product, i) => (
          <FloatingProductCard
            key={product.id}
            product={product}
            locale={locale}
            index={i}
            onClick={() => setSelectedProduct(product)}
            showcaseImageUrl={getShowcaseImage(product)}
          />
        ))}
      </div>

      {/* Selected Product Detail */}
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
/*  Main Products Page                                                 */
/* ------------------------------------------------------------------ */
function ProductsContent() {
  const locale = useLocale();
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showcaseProducts, setShowcaseProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes, showcaseRes] = await Promise.all([
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('products').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('showcase_products').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        ]);
        if (catRes.data) {
          setCategories(catRes.data as Category[]);
          if (categoryParam) {
            const matched = (catRes.data as Category[]).find((c) => c.slug === categoryParam);
            if (matched) setActiveFilter(matched.id);
          }
        }
        if (prodRes.data) setProducts(prodRes.data as Product[]);
        if (showcaseRes.data) setShowcaseProducts(showcaseRes.data as ShowcaseProduct[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [categoryParam]);

  // Hero animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      const items = headerRef.current!.querySelectorAll('.hero-reveal');
      gsap.fromTo(items, { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' }, {
        opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 1, stagger: 0.12, ease: 'power4.out',
      });
    });
    return () => ctx.revert();
  }, [loading]);

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      return cat ? getLocalizedField(cat, 'name', locale) : '';
    },
    [categories, locale]
  );

  const getShowcaseImage = useCallback((product: Product) => {
    const nameEn = product.name_en;
    const nameId = product.name_id;
    const nameZh = product.name_zh;
    const match = showcaseProducts.find(sp =>
      (nameEn && sp.name?.toLowerCase().trim() === nameEn.toLowerCase().trim()) ||
      (nameId && sp.name_id?.toLowerCase().trim() === nameId.toLowerCase().trim()) ||
      (nameZh && sp.name_zh?.toLowerCase().trim() === nameZh.toLowerCase().trim())
    );
    return match?.image_url || product.image_url;
  }, [showcaseProducts]);

  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => { counts[p.category_id] = (counts[p.category_id] || 0) + 1; });
    return counts;
  }, [products]);

  const displayedProducts = activeFilter
    ? products.filter((p) => p.category_id === activeFilter)
    : [];

  const handleSelectCategory = useCallback((categoryId: string) => {
    setActiveFilter(categoryId);
    // Scroll to content
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* ============ HERO ============ */}
      <div className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-red/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cream/5 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(rgba(250,237,211,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250,237,211,0.3) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10 pt-32 sm:pt-36 pb-20 sm:pb-28">
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

            <h1 className="hero-reveal font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[0.95]">
              Explore Our<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cream via-white to-cream/70">
                Collections
              </span>
            </h1>

            <div className="hero-reveal">
              <div className="w-20 h-[3px] bg-red mb-6 rounded-full" />
              <p className="text-cream/50 max-w-lg text-lg leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* Stats */}
            <div className="hero-reveal flex gap-10 mt-10 pt-8 border-t border-white/10">
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-white">{products.length}</span>
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

            {/* Smart Search — integrated into hero */}
            <div className="hero-reveal mt-10">
              <SmartSearch
                products={products}
                categories={categories}
                locale={locale}
                onSelectCategory={handleSelectCategory}
              />
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z" fill="var(--color-cream)" />
          </svg>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20 scroll-mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-navy/5 rounded-3xl" />
                <div className="mt-4 h-5 bg-navy/5 rounded-lg w-3/4" />
              </div>
            ))}
          </div>
        ) : !activeFilter ? (
          /* ======== CATEGORY SHOWCASE ======== */
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 sm:mb-16"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-[2px] bg-red rounded-full" />
                <span className="text-red text-xs font-bold tracking-[0.3em] uppercase">Collections</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3 leading-[1.05]">
                Our Collections
              </h2>
              <p className="text-navy/40 text-base max-w-lg leading-relaxed">
                Tap a category to explore its products
              </p>
            </motion.div>

            {/* Masonry-style Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {categories.map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  locale={locale}
                  productCount={productCountByCategory[cat.id] || 0}
                  index={i}
                  onClick={() => handleSelectCategory(cat.id)}
                />
              ))}
            </div>

            {/* Bottom accent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4 mt-20"
            >
              <div className="w-16 h-px bg-navy/10" />
              <Award className="w-5 h-5 text-red/30" />
              <div className="w-16 h-px bg-navy/10" />
            </motion.div>
          </>
        ) : (
          /* ======== CATEGORY PRODUCTS VIEW ======== */
          <CategoryProductView
            products={displayedProducts}
            locale={locale}
            categoryName={getCategoryName(activeFilter)}
            onBack={() => setActiveFilter(null)}
            getShowcaseImage={getShowcaseImage}
          />
        )}
      </div>
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

