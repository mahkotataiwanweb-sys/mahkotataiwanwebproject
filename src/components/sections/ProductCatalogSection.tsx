'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, X } from 'lucide-react';
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
/*  Product Popup — Ultra Premium (unified with Products page)         */
/* ------------------------------------------------------------------ */
function ProductPopup({
  product,
  locale,
  categories,
  onClose,
}: {
  product: ShowcaseProduct;
  locale: string;
  categories: CategoryData[];
  onClose: () => void;
}) {
  const name = getProductName(product, locale);
  const getDesc = () => {
    if (locale === 'zh-TW' && product.description_zh) return product.description_zh;
    if (locale === 'id' && product.description_id) return product.description_id;
    return product.description_en || '';
  };

  const categoryMatch = categories.find((c) => c.slug === product.category);
  const categoryLabel = categoryMatch ? getCategoryName(categoryMatch, locale) : product.category;
  const imageUrl = product.detail_image_url || product.image_url;
  const hasDetailImage = !!product.detail_image_url;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleEsc); };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClose}
    >
      {/* Deep cinematic backdrop */}
      <motion.div
        className="absolute inset-0 bg-navy/75 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Card */}
      <motion.div
        className="relative bg-cream rounded-[2.5rem] overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto overscroll-contain"
        initial={{ scale: 0.85, y: 80, opacity: 0, filter: 'blur(16px)' }}
        animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ scale: 0.9, y: 50, opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 1.0, ease: [0.22, 0.68, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 50px 120px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,48,72,0.12) transparent',
        }}
      >
        {/* Close — frosted glass */}
        <motion.button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/12 backdrop-blur-xl hover:bg-white/25 flex items-center justify-center transition-all duration-500 shadow-lg group border border-white/10"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: 'backOut' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-500" />
        </motion.button>

        {/* Image area */}
        <div className={`relative aspect-square overflow-hidden ${hasDetailImage ? 'bg-[#0a1628]' : 'bg-gradient-to-br from-cream-dark/50 to-cream'}`}>
          {imageUrl ? (
            <>
              <motion.div
                className="relative w-full h-full"
                initial={{ scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 0.68, 0, 1] }}
              >
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className={hasDetailImage ? 'object-contain p-6' : 'object-contain p-4'}
                  sizes="(max-width: 512px) 100vw, 512px"
                  unoptimized
                />
              </motion.div>
              {/* Subtle vignette */}
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.12)] pointer-events-none" />
              {/* Bottom fade to cream */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cream via-cream/80 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl opacity-20">🍽️</span>
            </div>
          )}

          {/* Category pill — frosted glass */}
          <motion.span
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-white/90 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg"
          >
            {categoryLabel}
          </motion.span>
        </div>

        {/* Content */}
        <div className="relative -mt-10 px-8 sm:px-10 pb-10">
          <motion.h3
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 0.68, 0, 1] }}
            className="font-heading text-2xl sm:text-3xl font-bold text-navy mb-4 leading-tight"
          >
            {name}
          </motion.h3>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 0.68, 0, 1] }}
            className="w-14 h-[2px] bg-gradient-to-r from-red to-red/20 mb-5 origin-left rounded-full"
          />

          <motion.p
            initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
            className="text-navy/55 text-sm sm:text-base leading-[1.85] whitespace-pre-line"
          >
            {getDesc() || 'Premium quality Indonesian product, crafted with authentic recipes and the finest ingredients.'}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Infinite Carousel Slider                                           */
/* ------------------------------------------------------------------ */
function InfiniteSlider({
  products,
  locale,
  onProductClick,
}: {
  products: ShowcaseProduct[];
  locale: string;
  onProductClick: (p: ShowcaseProduct) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const baseDirectionRef = useRef(1);
  const isDraggingRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragDistRef = useRef(0);
  const rafRef = useRef<number>(0);
  const singleSetWidthRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCenterIdxRef = useRef(-1);
  const centerDwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatReadyRef = useRef(false);

  const DEFAULT_SPEED = 0.8;
  const FRICTION = 0.92;
  const RETURN_RATE = 0.02;
  const ITEM_WIDTH_MOBILE = 160;
  const ITEM_WIDTH_DESKTOP = 260;
  const [itemWidth, setItemWidth] = useState(ITEM_WIDTH_DESKTOP);

  useEffect(() => {
    const update = () => setItemWidth(window.innerWidth < 640 ? ITEM_WIDTH_MOBILE : ITEM_WIDTH_DESKTOP);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const items = [...products, ...products, ...products];

  const measureSetWidth = useCallback(() => {
    singleSetWidthRef.current = products.length * itemWidth;
  }, [products.length, itemWidth]);

  const applyItemTransforms = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const children = track.children;

    let closestIdx = -1;
    let closestDist = Infinity;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const imgContainer = child.querySelector('.product-img-wrap') as HTMLElement;
      const nameEl = child.querySelector('.product-name') as HTMLElement;
      if (!imgContainer || !nameEl) continue;

      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const dist = Math.abs(childCenter - centerX);
      const maxDist = containerRect.width * 0.5;
      const proximity = Math.max(0, 1 - dist / maxDist);

      const scale = 0.4 + proximity * proximity * 1.1;
      const opacity = 0.25 + proximity * 0.75;

      imgContainer.style.transform = `scale(${scale})`;
      imgContainer.style.opacity = `${opacity}`;
      imgContainer.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease';

      nameEl.style.opacity = `${0.2 + proximity * 0.8}`;
      nameEl.style.transform = `scale(${0.85 + proximity * 0.25})`;
      nameEl.style.color = `rgba(0,48,72,${0.3 + proximity * 0.7})`;
      nameEl.style.transition = 'all 0.35s ease';

      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i % products.length;
      }

      const isCentered = dist < itemWidth * 0.35;
      if (isCentered) {
        imgContainer.style.filter = 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))';
        if (floatReadyRef.current && closestIdx === prevCenterIdxRef.current) {
          imgContainer.classList.add('product-float-active');
        }
      } else {
        imgContainer.classList.remove('product-float-active');
        imgContainer.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))';
      }
    }

    if (closestIdx !== prevCenterIdxRef.current) {
      prevCenterIdxRef.current = closestIdx;
      floatReadyRef.current = false;
      if (centerDwellTimerRef.current) clearTimeout(centerDwellTimerRef.current);
      centerDwellTimerRef.current = setTimeout(() => { floatReadyRef.current = true; }, 500);
    }
  }, [products.length, itemWidth]);

  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const setWidth = singleSetWidthRef.current;
    const targetSpeed = DEFAULT_SPEED * baseDirectionRef.current;

    if (!isDraggingRef.current && !isPausedRef.current) {
      velocityRef.current += (targetSpeed - velocityRef.current) * RETURN_RATE;
      const excess = velocityRef.current - targetSpeed;
      if (Math.abs(excess) > 0.01) {
        velocityRef.current = targetSpeed + excess * FRICTION;
      }
    }

    if (isPausedRef.current && !isDraggingRef.current) {
      velocityRef.current *= 0.95;
      if (Math.abs(velocityRef.current) < 0.01) velocityRef.current = 0;
    }

    if (!isDraggingRef.current) {
      offsetRef.current += velocityRef.current;
    }

    if (setWidth > 0) {
      while (offsetRef.current < -setWidth) offsetRef.current += setWidth;
      while (offsetRef.current > 0) offsetRef.current -= setWidth;
    }

    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    applyItemTransforms();
    rafRef.current = requestAnimationFrame(animate);
  }, [applyItemTransforms]);

  useEffect(() => {
    measureSetWidth();
    velocityRef.current = DEFAULT_SPEED * baseDirectionRef.current;
    rafRef.current = requestAnimationFrame(animate);
    const handleResize = () => measureSetWidth();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      if (centerDwellTimerRef.current) clearTimeout(centerDwellTimerRef.current);
    };
  }, [animate, measureSetWidth]);

  useEffect(() => { setTimeout(measureSetWidth, 100); }, [products, measureSetWidth]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    isPausedRef.current = true;
    lastPointerXRef.current = e.clientX;
    dragStartXRef.current = e.clientX;
    dragDistRef.current = 0;
    lastMoveTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - lastPointerXRef.current;
    const dt = now - lastMoveTimeRef.current;
    if (dt > 0) dragVelocityRef.current = (dx / dt) * 16;
    dragDistRef.current += Math.abs(dx);
    offsetRef.current += dx;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = now;

    const track = trackRef.current;
    const setWidth = singleSetWidthRef.current;
    if (track && setWidth > 0) {
      while (offsetRef.current < -setWidth) offsetRef.current += setWidth;
      while (offsetRef.current > 0) offsetRef.current -= setWidth;
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (Math.abs(dragVelocityRef.current) > 0.5) {
      velocityRef.current = dragVelocityRef.current;
      baseDirectionRef.current = dragVelocityRef.current > 0 ? 1 : -1;
    }
    isPausedRef.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (dragDistRef.current > 5) return;
    isPausedRef.current = !isPausedRef.current;
  }, []);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-navy/40">
        <p className="text-lg">No products in this category yet</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden py-8 sm:py-12"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-px w-[2px] h-full bg-navy/8 pointer-events-none z-0" />

      <div
        className="absolute top-0 left-0 w-20 sm:w-36 h-full z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--color-cream-deeper), transparent)' }}
      />
      <div
        className="absolute top-0 right-0 w-20 sm:w-36 h-full z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--color-cream-deeper), transparent)' }}
      />

      <div
        ref={trackRef}
        className="flex select-none touch-none will-change-transform"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        {items.map((product, i) => (
          <div
            key={`${product.id}-${i}`}
            className="flex-shrink-0 flex flex-col items-center justify-end"
            style={{ width: `${itemWidth}px`, padding: '0 12px' }}
            onClick={(e) => {
              if (dragDistRef.current > 5) return;
              e.stopPropagation();
              onProductClick(product);
            }}
          >
            <div
              className="product-img-wrap relative cursor-pointer"
              style={{
                width: itemWidth < 200 ? '132px' : '220px',
                height: itemWidth < 200 ? '132px' : '220px',
                transformOrigin: 'center bottom',
              }}
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={getProductName(product, locale)}
                  fill
                  className="object-contain pointer-events-none"
                  sizes="220px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-navy/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-5xl">🍽️</span>
                </div>
              )}
            </div>

            <p
              className="product-name mt-4 text-center font-heading font-semibold text-sm sm:text-base sm:whitespace-nowrap"
              style={{
                maxWidth: itemWidth < 200 ? '120px' : '200px',
                lineHeight: '1.3',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
              }}
            >
              {getProductName(product, locale)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Section                                                       */
/* ------------------------------------------------------------------ */
export default function ProductCatalogSection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShowcaseProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShowcaseProduct | null>(null);
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
        setSelectedCategory(data[0].slug);
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
        { opacity: 0, y: 50, filter: 'blur(14px)', scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
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
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const selectedCat = categories.find((c) => c.slug === selectedCategory);
  const selectedLabel = selectedCat ? getCategoryName(selectedCat, locale) : '';

  return (
    <>
      <section
        id="products-catalog"
        ref={sectionRef}
        className="relative overflow-hidden py-16 sm:py-24"
        style={{ backgroundColor: 'var(--color-cream-deeper)' }}
      >
        <WavyTextureBackground />

        <div ref={contentRef} className="relative z-10">
          {/* Section Heading */}
          <div ref={headerRef} className="text-center mb-6 sm:mb-8 px-4">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-2 drop-shadow-sm">
              {locale === 'id' ? 'Produk Kami' : locale === 'zh-TW' ? '我們的產品' : 'Our Products'}
            </h2>
            <p className="text-navy/60 text-base sm:text-lg md:text-xl font-body tracking-wide">
              {locale === 'id' ? 'Cita Rasa Indonesia, di Taiwan.' : locale === 'zh-TW' ? '印尼風味，在台灣。' : 'Indonesian Taste, in Taiwan.'}
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
                  {selectedCat && <CategoryIcon slug={selectedCat.slug} size={16} />}
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
              <InfiniteSlider
                products={products}
                locale={locale}
                onProductClick={setSelectedProduct}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Product Popup */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductPopup
            product={selectedProduct}
            locale={locale}
            categories={categories}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
