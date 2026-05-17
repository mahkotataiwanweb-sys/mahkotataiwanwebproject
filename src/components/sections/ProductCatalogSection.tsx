'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
/*  Product Grid — 4 per row × max 2 rows per page, with pagination     */
/* ------------------------------------------------------------------ */
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

function ProductGrid({
  products,
  locale,
}: {
  products: ShowcaseProduct[];
  locale: string;
}) {
  const PER_PAGE = 8; // 4 cols × 2 rows
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE));

  useEffect(() => { setPage(0); }, [products]);

  const visible = products.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-navy/40">
        <Package className="w-12 h-12 mb-3 text-navy/20" />
        <p className="text-lg">No products in this category yet</p>
      </div>
    );
  }

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={`page-${page}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8"
        >
          {visible.map((product, idx) => (
            <button
              key={product.id}
              type="button"
              className="flex flex-col items-center group bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-red/40 rounded-2xl transition-transform duration-150 active:scale-90 active:translate-y-1"
            >
              <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] lg:w-[160px] lg:h-[160px]">
                {product.image_url ? (
                  <motion.div
                    className="relative w-full h-full"
                    animate={{ y: [0, -12, 0] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: (idx % 4) * 0.5,
                    }}
                    style={{
                      filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.16))',
                    }}
                  >
                    <Image
                      src={product.image_url}
                      alt={getProductName(product, locale)}
                      fill
                      className="object-contain pointer-events-none transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 120px, (max-width: 1024px) 140px, 160px"
                      loading={idx < 4 ? 'eager' : 'lazy'}
                      priority={idx < 4}
                      quality={65}
                    />
                  </motion.div>
                ) : (
                  <div className="w-full h-full rounded-full bg-navy/10 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center font-heading font-semibold text-sm text-navy group-hover:text-red transition-colors duration-300">
                {getProductName(product, locale)}
              </p>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            type="button"
            onClick={goPrev}
            disabled={page === 0}
            aria-label="Previous page"
            className="w-11 h-11 rounded-full bg-white shadow-lg border border-navy/10 flex items-center justify-center text-navy hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === page ? 'bg-red w-7' : 'bg-navy/20 hover:bg-navy/40 w-2.5'
                }`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={page === totalPages - 1}
            aria-label="Next page"
            className="w-11 h-11 rounded-full bg-white shadow-lg border border-navy/10 flex items-center justify-center text-navy hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
  const categoryStripRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShowcaseProduct[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        setCategories(data as CategoryData[]);
        // Don't auto-select — wait for the user to tap a category card first.
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
    setProducts(allProducts.filter((p) => p.category === selectedCategory));
  }, [selectedCategory, allProducts]);

  /* When the user picks a category, set it and smooth-scroll so the products
     that fade in are immediately in view. */
  const backTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCategoryClick = useCallback((slug: string) => {
    if (backTimeoutRef.current) {
      clearTimeout(backTimeoutRef.current);
      backTimeoutRef.current = null;
    }
    setSelectedCategory(slug);

    // The page uses Lenis smooth scroll which hijacks window.scrollTo,
    // so we go through the exposed lenis instance when available and
    // fall back to native scrollIntoView otherwise. Run twice — once
    // on the next paint, once after the grid has actually rendered —
    // so even a same-category re-click and a fresh-grid mount both land.
    const doScroll = () => {
      const el = productGridRef.current;
      if (!el) return;
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: { offset?: number; duration?: number; immediate?: boolean }) => void } }).__lenis;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(el, { offset: -96, duration: 0.9 });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 260);
  }, []);

  /* Pre-warming the raw Supabase URL did nothing — <Image> reads through
     /_next/image, not the original. Removed; first-page priority hints +
     blur placeholders give a snappier feel without wasting bandwidth on
     ~50 hidden images. */

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

      // Category cards reveal is handled by framer-motion whileInView per-card.

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

  const viewAllLabel = t('viewAllCollection');
  const backToShowcaseLabel = t('backToShowcase');

  /* Scroll back to the category cards and clear selection so the back button
     hides itself. Called from the "Kembali ke Showcase" button below. */
  const handleBackToShowcase = useCallback(() => {
    const el = categoryStripRef.current;
    if (el) {
      // Desktop visitors need more headroom so the cards aren't crammed under
      // the navbar; mobile keeps the snug 96 px offset.
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const offset = isDesktop ? 180 : 96;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    // Wait for scroll to complete before clearing so the user sees the cards
    // before the product grid fades out. Save the timeout id so handleCategoryClick
    // can cancel it if the user picks a new category before the timer fires.
    if (backTimeoutRef.current) clearTimeout(backTimeoutRef.current);
    backTimeoutRef.current = setTimeout(() => {
      setSelectedCategory('');
      backTimeoutRef.current = null;
    }, 600);
  }, []);

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
          <div ref={headerRef} className="text-center mb-14 sm:mb-20 px-4">
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

          {/* Category Cards — refined editorial-style cards, 3 per row × 2 rows */}
          <div ref={categoryStripRef} className="mb-10 sm:mb-14 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-8 max-w-4xl mx-auto">
              {categories.slice(0, 6).map((cat, idx) => {
                const catName = getCategoryName(cat, locale);
                const active = selectedCategory === cat.slug;
                return (
                  <motion.button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                    initial={{ opacity: 0, y: 70, scale: 0.7 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -8 }}
                    transition={{
                      type: 'spring',
                      stiffness: 220,
                      damping: 16,
                      mass: 0.9,
                      delay: idx * 0.09,
                    }}
                    className={`category-pill group relative aspect-square w-full max-w-[240px] mx-auto rounded-[22px] overflow-hidden bg-white transition-shadow duration-500 ${
                      active
                        ? 'shadow-[0_30px_60px_-20px_rgba(193,33,38,0.45),0_0_0_2px_#C12126]'
                        : 'shadow-[0_18px_36px_-18px_rgba(0,48,72,0.35),0_0_0_1px_rgba(0,48,72,0.08)] hover:shadow-[0_28px_55px_-18px_rgba(0,48,72,0.5),0_0_0_1px_rgba(0,48,72,0.18)]'
                    }`}
                  >
                    {/* Image / icon */}
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={catName}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                        priority={idx < 3}
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        quality={70}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-cream via-white to-cream flex items-center justify-center">
                        <CategoryIcon slug={cat.slug} size={84} />
                      </div>
                    )}

                    {/* Subtle inner glass edge — refined frame inside the card */}
                    <span
                      className="pointer-events-none absolute inset-[6px] rounded-[16px] ring-1 ring-white/35"
                      aria-hidden
                    />

                    {/* Brand logo chip — top-left */}
                    <span
                      className="pointer-events-none absolute top-3 left-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm"
                      aria-hidden
                    >
                      <Image
                        src="/images/logo.png"
                        alt=""
                        width={28}
                        height={28}
                        className="w-5 h-5 object-contain"
                      />
                    </span>

                    {/* Bottom label panel — clean navy gradient, no yellow */}
                    <div className="absolute inset-x-0 bottom-0 px-4 pt-14 pb-4 bg-gradient-to-t from-[#001a2c]/95 via-[#003048]/70 to-transparent">
                      <span className="block text-white font-heading font-semibold text-xs sm:text-sm md:text-base tracking-[0.04em] text-center leading-tight">
                        {catName}
                      </span>
                      {/* Thin red underline that grows on hover/active */}
                      <span
                        className={`block h-[2px] mx-auto mt-2 rounded-full bg-red transition-all duration-500 ${
                          active ? 'w-12' : 'w-6 group-hover:w-12'
                        }`}
                        aria-hidden
                      />
                    </div>

                    {/* Active corner ribbon — minimalist red dot */}
                    {active && (
                      <span
                        className="pointer-events-none absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red text-white shadow-md"
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Product Grid — only appears once a category is chosen */}
          <div ref={productGridRef}>
            <AnimatePresence mode="wait">
              {selectedCategory && (
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <ProductGrid
                    products={products}
                    locale={locale}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Back to showcase + View all collection — paired buttons, small,
              back is pulled slightly left of centre, view-all slightly right. */}
          <div className="flex flex-row items-center justify-center gap-3 mt-4 sm:mt-8 px-4">
            <AnimatePresence>
              {selectedCategory && (
                <motion.button
                  key="back-to-showcase"
                  type="button"
                  onClick={handleBackToShowcase}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="-translate-x-1 sm:-translate-x-2 inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-navy text-yellow-400 font-heading font-bold text-xs sm:text-sm shadow-md hover:bg-[#001E2E] hover:shadow-lg transition-all duration-300 active:scale-95"
                >
                  <span aria-hidden>←</span>
                  {backToShowcaseLabel}
                </motion.button>
              )}
            </AnimatePresence>
            <Link
              href={`/${locale}/products`}
              className="translate-x-1 sm:translate-x-2 inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-yellow-400 text-navy font-heading font-bold text-xs sm:text-sm shadow-md hover:bg-yellow-300 hover:shadow-lg transition-all duration-300 active:scale-95"
            >
              {viewAllLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
