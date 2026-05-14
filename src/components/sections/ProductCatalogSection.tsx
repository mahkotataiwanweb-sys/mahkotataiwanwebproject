'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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

interface CategoryData {
  id: string;
  slug: string;
  name_en: string;
  name_id: string;
  name_zh: string;
  icon: string | null;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Static Wavy Texture Background                                     */
/* ------------------------------------------------------------------ */
function WavyTextureBackground() {
  const rowHeight = 30;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wavy-static" x="0" y="0" width="180" height={rowHeight} patternUnits="userSpaceOnUse">
            <path d={`M0,${rowHeight/2} Q30,${rowHeight/2-8} 45,${rowHeight/2} T90,${rowHeight/2} Q120,${rowHeight/2+8} 135,${rowHeight/2} T180,${rowHeight/2}`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          </pattern>
          <pattern id="wavy-static-2" x="40" y="7" width="220" height={rowHeight+5} patternUnits="userSpaceOnUse">
            <path d={`M0,${(rowHeight+5)/2} Q40,${(rowHeight+5)/2-6} 55,${(rowHeight+5)/2} T110,${(rowHeight+5)/2} Q150,${(rowHeight+5)/2+6} 165,${(rowHeight+5)/2} T220,${(rowHeight+5)/2}`} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wavy-static)" />
        <rect width="100%" height="100%" fill="url(#wavy-static-2)" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Get localized name                                         */
/* ------------------------------------------------------------------ */
function getCategoryName(cat: CategoryData, locale: string): string {
  if (locale === 'zh-TW' && cat.name_zh) return cat.name_zh;
  if (locale === 'id' && cat.name_id) return cat.name_id;
  return cat.name_en;
}

function getProductName(p: ShowcaseProduct, locale: string): string {
  if (locale === 'zh-TW' && p.name_zh) return p.name_zh;
  if (locale === 'id' && p.name_id) return p.name_id;
  return p.name;
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Paginated Product Grid (3 per page)                                */
/* ------------------------------------------------------------------ */
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

function PaginatedProductGrid({
  products,
  locale,
}: {
  products: ShowcaseProduct[];
  locale: string;
}) {
  const ITEMS_PER_PAGE = 3;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentProducts = products.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  useEffect(() => { setPage(0); }, [products]);

  const goNext = () => { if (page < totalPages - 1) setPage(page + 1); };
  const goPrev = () => { if (page > 0) setPage(page - 1); };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-navy/40">
        <Package className="w-12 h-12 mb-3 text-navy/20" />
        <p className="text-lg">No products in this category yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`page-${page}`}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12"
        >
          {currentProducts.map((product, idx) => (
            <div key={product.id} className="flex flex-col items-center group">
              {/* Floating product image */}
              <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px]">
                {product.image_url ? (
                  <motion.div
                    className="relative w-full h-full"
                    animate={{ y: [0, -18, 0] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: idx * 0.5,
                    }}
                    style={{
                      filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.18))',
                    }}
                  >
                    <Image
                      src={product.image_url}
                      alt={getProductName(product, locale)}
                      fill
                      className="object-contain pointer-events-none transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 220px, 280px"
                    />
                  </motion.div>
                ) : (
                  <div className="w-full h-full rounded-full bg-navy/10 flex items-center justify-center">
                    <span className="text-5xl">🍽️</span>
                  </div>
                )}
              </div>
              {/* Product name */}
              <p className="mt-5 text-center font-heading font-semibold text-base sm:text-lg text-navy group-hover:text-red transition-colors duration-300">
                {getProductName(product, locale)}
              </p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
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
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === page
                    ? 'bg-red w-7'
                    : 'bg-navy/20 hover:bg-navy/40 w-2.5'
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Section                                                       */
/* ------------------------------------------------------------------ */
export default function ProductCatalogSection() {
  const locale = useLocale();
  const t = useEditableT('products');
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShowcaseProduct[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        setCategories(data as CategoryData[]);
        // Default landing on "All" so visitors see the entire catalog at once.
        setSelectedCategory('all');
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('showcase_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data) setAllProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    if (selectedCategory === 'all') {
      setProducts(allProducts);
    } else {
      setProducts(allProducts.filter((p) => p.category === selectedCategory));
    }
  }, [selectedCategory, allProducts]);

  /* Preload product images after initial page load for instant category switching */
  useEffect(() => {
    if (allProducts.length === 0) return;
    const timer = setTimeout(() => {
      allProducts.forEach((p) => {
        if (p.image_url) {
          const img = new window.Image();
          img.src = p.image_url;
        }
        if (p.detail_image_url) {
          const img = new window.Image();
          img.src = p.detail_image_url;
        }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [allProducts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* GSAP header reveal animation */
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 50, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.6,
          stagger: 0.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Red line draws from center — matches WhereToBuy style
      const redLine = headerRef.current!.querySelector('.red-line-reveal');
      if (redLine) {
        gsap.fromTo(redLine,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 2.5,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            delay: 0.8,
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const selectedCat = categories.find((c) => c.slug === selectedCategory);
  const allLabel =
    locale === 'zh-TW' ? '全部產品' : locale === 'id' ? 'Semua Produk' : 'All Products';
  const selectedLabel =
    selectedCategory === 'all' ? allLabel : selectedCat ? getCategoryName(selectedCat, locale) : '';

  return (
    <>
      <section
        id="products-catalog"
        ref={sectionRef}
        className="relative overflow-hidden py-16 sm:py-24"
        style={{ backgroundColor: 'transparent' }}
      >
        {/* WavyTextureBackground removed */}

        <div ref={contentRef} className="relative z-10">
          {/* Section Heading — eyebrow → title → red divider → tagline (matches Discover) */}
          <div ref={headerRef} className="text-center mb-6 sm:mb-8 px-4">
            <p className="text-red text-sm sm:text-base tracking-[0.35em] uppercase font-bold mb-3">
              Showcase
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-3 drop-shadow-sm">
              {t('title')}
            </h2>
            <div className="red-line-reveal w-16 h-[2px] bg-red mx-auto mb-4 rounded-full origin-center" />
            <p className="text-navy/60 text-base sm:text-lg md:text-xl font-body tracking-wide">
              {t('tagline')}
            </p>
          </div>

          {/* Category Dropdown */}
          <div className="flex justify-center mb-6 sm:mb-10 px-4">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-cream text-navy font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 min-w-[200px] justify-between"
              >
                <span className="font-heading text-sm flex items-center gap-2">
                  {selectedCategory === 'all'
                    ? <span aria-hidden className="text-base leading-none">★</span>
                    : selectedCat && <CategoryIcon slug={selectedCat.slug} size={16} />}
                  {selectedLabel}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-1.5 left-0 right-0 bg-cream rounded-xl shadow-2xl overflow-hidden z-20"
                  >
                    <button
                      key="all"
                      onClick={() => { setSelectedCategory('all'); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        selectedCategory === 'all' ? 'bg-red/10 text-red' : 'text-navy hover:bg-navy/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="text-base leading-none">★</span>
                        {allLabel}
                      </span>
                    </button>
                    {categories.map((cat) => {
                      const catName = getCategoryName(cat, locale);
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => { setSelectedCategory(cat.slug); setDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            selectedCategory === cat.slug ? 'bg-red/10 text-red' : 'text-navy hover:bg-navy/5'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <CategoryIcon slug={cat.slug} size={15} />
                            {catName}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Product Slider */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <PaginatedProductGrid
                products={products}
                locale={locale}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

    </>
  );
}
