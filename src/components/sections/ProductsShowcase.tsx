'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // GSAP header animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
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

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category_id === activeCategory);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
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
      className="py-24 sm:py-32 bg-white relative overflow-hidden"
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Our Collection
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">
              Our Products
            </h2>
            <div className="w-16 h-[2px] bg-red mb-4" />
            <p className="text-navy/60 max-w-lg">
              Discover authentic Indonesian flavors, crafted with premium ingredients and halal certified.
            </p>
          </div>
          <Link
            href={`/${locale}/products`}
            className="mt-6 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-red hover:text-red-dark tracking-wide uppercase transition-colors group"
          >
            View All Products
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
            ✨ All
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

        {/* Products Horizontal Carousel */}
        <div className="relative group/carousel">
          {/* Scroll buttons */}
          {filteredProducts.length > 3 && (
            <>
              <button
                onClick={scrollLeft}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-navy/10 flex items-center justify-center text-navy hover:bg-cream transition-colors opacity-0 group-hover/carousel:opacity-100 duration-300"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-navy/10 flex items-center justify-center text-navy hover:bg-cream transition-colors opacity-0 group-hover/carousel:opacity-100 duration-300"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex-shrink-0 w-72 bg-cream rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-cream-dark" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-cream-dark rounded w-20" />
                    <div className="h-5 bg-cream-dark rounded w-40" />
                  </div>
                </div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="w-full text-center py-16">
                <Package className="w-12 h-12 text-navy/20 mx-auto mb-3" />
                <p className="text-navy/40">No products found in this category.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="flex-shrink-0 w-72 group"
                  >
                    <div className="bg-cream rounded-2xl overflow-hidden hover-lift premium-shadow">
                      {/* Image */}
                      <div className="aspect-square bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center relative overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={getLocalizedField(product, 'name', locale)}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="288px"
                          />
                        ) : (
                          <div className="text-center">
                            <Package className="w-12 h-12 text-navy/20 mx-auto mb-2" />
                            <p className="text-navy/30 text-xs">Product Image</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/5 transition-colors duration-500" />
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
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
