'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Product, Category } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function ProductsPage() {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);

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
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category_id === activeCategory);

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return '';
    return getLocalizedField(cat, 'name', locale);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-navy pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-red/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-cream/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-cream/60 hover:text-cream text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Our Collection
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              All Products
            </h1>
            <div className="w-20 h-[3px] bg-red mb-6" />
            <p className="text-cream/60 max-w-lg text-lg">
              Explore our complete range of authentic Indonesian food products, all halal certified.
            </p>
          </div>
        </div>
      </div>

      {/* Products Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === 'all'
                ? 'bg-navy text-white shadow-lg shadow-navy/20'
                : 'bg-white text-navy/70 hover:bg-cream-dark hover:text-navy border border-navy/10'
            }`}
          >
            ✨ All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-navy text-white shadow-lg shadow-navy/20'
                  : 'bg-white text-navy/70 hover:bg-cream-dark hover:text-navy border border-navy/10'
              }`}
            >
              <span className="mr-2">{cat.icon || '📦'}</span>
              {getLocalizedField(cat, 'name', locale)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-cream-dark" />
                <div className="p-5 bg-white space-y-3">
                  <div className="h-3 bg-cream-dark rounded w-20" />
                  <div className="h-5 bg-cream-dark rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-navy/15 mx-auto mb-4" />
            <p className="text-navy/40 text-lg">No products found.</p>
            <p className="text-navy/30 text-sm mt-1">
              {activeCategory !== 'all'
                ? 'Try selecting a different category.'
                : 'Products will appear here soon.'}
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden hover-lift premium-shadow">
                    {/* Image */}
                    <div className="aspect-square bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center relative overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={getLocalizedField(product, 'name', locale)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="text-center">
                          <Package className="w-12 h-12 text-navy/20 mx-auto mb-2" />
                          <p className="text-navy/30 text-xs">Product Image</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/5 transition-colors duration-500" />
                      {product.is_featured && (
                        <div className="absolute top-3 right-3 bg-red text-white text-xs font-bold px-3 py-1 rounded-full">
                          Featured
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-5">
                      <span className="text-xs text-red/80 font-medium uppercase tracking-wider">
                        {getCategoryName(product.category_id)}
                      </span>
                      <h3 className="font-heading text-lg font-semibold text-navy mt-1 group-hover:text-red transition-colors duration-300">
                        {getLocalizedField(product, 'name', locale)}
                      </h3>
                      {product.description_en && (
                        <p className="text-navy/50 text-sm mt-2 line-clamp-2">
                          {getLocalizedField(product, 'description', locale)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
