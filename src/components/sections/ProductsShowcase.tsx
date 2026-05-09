'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Product, Category } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function ProductsShowcase() {
  const locale = useLocale();
  const t = useEditableT('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 3;

  // Fetch data from Supabase
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

        if (catRes.data) setCategories(catRes.data as Category[]);
        if (prodRes.data) setProducts(prodRes.data as Product[]);
      } catch {
        // Silent fail, empty state shown
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category_id === activeCategory);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Reset page when category changes
  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  const goNext = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const goPrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return '';
    return getLocalizedField(cat, 'name', locale);
  };

  return (
    <section
      id="products"
      ref={sectionRef}
      className="py-24 sm:py-32 relative overflow-hidden"
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">
              {t('title')}
            </h2>
            <p className="text-navy/60 max-w-lg">
              {t('showcaseSubtitle')}
            </p>
          </div>
          <Link
            href={`/${locale}/products`}
            className="mt-6 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-red hover:text-red-dark tracking-wide uppercase transition-colors group"
          >
            {t('viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === 'all'
                ? 'bg-navy text-white shadow-lg shadow-navy/20'
                : 'bg-cream text-navy/70 hover:bg-cream-dark hover:text-navy'
            }`}
          >
            ✨ {t('all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-navy text-white shadow-lg shadow-navy/20'
                  : 'bg-cream text-navy/70 hover:bg-cream-dark hover:text-navy'
              }`}
            >
              <span className="mr-2">{cat.icon || '📦'}</span>
              {getLocalizedField(cat, 'name', locale)}
            </button>
          ))}
        </div>

        {/* Products Grid - 3 per page */}
        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-cream rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-cream-dark" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-cream-dark rounded w-20" />
                    <div className="h-5 bg-cream-dark rounded w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="w-full text-center py-16">
              <Package className="w-12 h-12 text-navy/20 mx-auto mb-3" />
              <p className="text-navy/40">{t('noProductsInCategory')}</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`page-${page}-${activeCategory}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {currentProducts.map((product, idx) => (
                    <div key={product.id} className="group">
                      <div className="bg-cream rounded-2xl overflow-hidden hover-lift premium-shadow">
                        {/* Image with floating animation */}
                        <div className="aspect-square bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center relative overflow-hidden">
                          {product.image_url ? (
                            <motion.div
                              className="relative w-full h-full"
                              animate={{
                                y: [0, -12, 0],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: idx * 0.4,
                              }}
                            >
                              <Image
                                src={product.image_url}
                                alt={getLocalizedField(product, 'name', locale)}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            </motion.div>
                          ) : (
                            <div className="text-center">
                              <Package className="w-12 h-12 text-navy/20 mx-auto mb-2" />
                              <p className="text-navy/30 text-xs">{t('productImage')}</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/5 transition-colors duration-500 pointer-events-none" />
                        </div>
                        {/* Info */}
                        <div className="p-5">
                          <span className="text-xs text-red/80 font-medium uppercase tracking-wider">
                            {getCategoryName(product.category_id)}
                          </span>
                          <h3 className="font-heading text-lg font-semibold text-navy mt-1 group-hover:text-red transition-colors duration-300">
                            {getLocalizedField(product, 'name', locale)}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <button
                    onClick={goPrev}
                    disabled={page === 0}
                    className="w-11 h-11 rounded-full bg-white shadow-lg border border-navy/10 flex items-center justify-center text-navy hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          i === page
                            ? 'bg-red w-7'
                            : 'bg-navy/20 hover:bg-navy/40'
                        }`}
                        aria-label={`Page ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={goNext}
                    disabled={page === totalPages - 1}
                    className="w-11 h-11 rounded-full bg-white shadow-lg border border-navy/10 flex items-center justify-center text-navy hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
