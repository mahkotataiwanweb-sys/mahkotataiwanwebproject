'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
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
/*  Sine easing (module-level for stability)                            */
/* ------------------------------------------------------------------ */
const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);

/* ------------------------------------------------------------------ */
/*  Infinite Carousel Slider                                           */
/* ------------------------------------------------------------------ */
function InfiniteSlider({
  products,
  locale,
}: {
  products: ShowcaseProduct[];
  locale: string;

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
  const isVisibleRef = useRef(true);
  const needsSnapRef = useRef(true); /* snap lerp on first frame & after wraps */

  /* ---- Lerp state for each slot ---- */
  const lerpStateRef = useRef<{
    scale: number[]; opacity: number[]; yLift: number[];
    shadowOpacity: number[]; nameOpacity: number[]; nameScale: number[];
  }>({ scale: [], opacity: [], yLift: [], shadowOpacity: [], nameOpacity: [], nameScale: [] });

  const DEFAULT_SPEED = 0.65;
  const FRICTION = 0.94;
  const RETURN_RATE = 0.015;
  const LERP_FACTOR = 0.12; /* faster response — was 0.08 */
  const ITEM_WIDTH_MOBILE = 160;
  const ITEM_WIDTH_DESKTOP = 260;
  const [itemWidth, setItemWidth] = useState(ITEM_WIDTH_DESKTOP);

  useEffect(() => {
    const update = () => setItemWidth(window.innerWidth < 640 ? ITEM_WIDTH_MOBILE : ITEM_WIDTH_DESKTOP);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { isVisibleRef.current = e.isIntersecting; }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = [...products, ...products, ...products];

  /* Initialize lerp arrays when item count changes */
  useEffect(() => {
    const count = items.length;
    const s = lerpStateRef.current;
    if (s.scale.length !== count) {
      s.scale = Array(count).fill(0.65);
      s.opacity = Array(count).fill(0.35);
      s.yLift = Array(count).fill(0);
      s.shadowOpacity = Array(count).fill(0.08);
      s.nameOpacity = Array(count).fill(0.25);
      s.nameScale = Array(count).fill(0.88);
      needsSnapRef.current = true;
    }
  }, [items.length]);

  const measureSetWidth = useCallback(() => {
    singleSetWidthRef.current = products.length * itemWidth;
  }, [products.length, itemWidth]);

  /* ---- Unified transform with optional snap (instant jump) mode ---- */
  const applyItemTransforms = useCallback((snap: boolean = false) => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const children = track.children;
    const s = lerpStateRef.current;
    const lf = snap ? 1.0 : LERP_FACTOR; /* snap = jump instantly to target */

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const imgContainer = child.querySelector('.product-img-wrap') as HTMLElement;
      const nameEl = child.querySelector('.product-name') as HTMLElement;
      if (!imgContainer || !nameEl) continue;

      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const dist = Math.abs(childCenter - centerX);
      const maxDist = containerRect.width * 0.55;
      const proximity = Math.max(0, 1 - dist / maxDist);
      const ep = easeOutSine(proximity);

      /* Target values */
      const tScale = 0.65 + ep * 0.55;
      const tOpacity = 0.35 + ep * 0.65;
      const tYLift = -Math.pow(ep, 1.5) * 28; /* smoother curve than ep*ep */
      const tShadow = 0.08 + ep * 0.42;
      const tNameOp = 0.25 + ep * 0.75;
      const tNameSc = 0.88 + ep * 0.14;

      /* Lerp (or snap) to targets */
      s.scale[i] += (tScale - s.scale[i]) * lf;
      s.opacity[i] += (tOpacity - s.opacity[i]) * lf;
      s.yLift[i] += (tYLift - s.yLift[i]) * lf;
      s.shadowOpacity[i] += (tShadow - s.shadowOpacity[i]) * lf;
      s.nameOpacity[i] += (tNameOp - s.nameOpacity[i]) * lf;
      s.nameScale[i] += (tNameSc - s.nameScale[i]) * lf;

      /* Apply transforms */
      imgContainer.style.transform = `translateY(${s.yLift[i]}px) scale(${s.scale[i]})`;
      imgContainer.style.opacity = `${s.opacity[i]}`;
      imgContainer.style.filter = `drop-shadow(0 ${12 + s.shadowOpacity[i] * 30}px ${20 + s.shadowOpacity[i] * 40}px rgba(0,0,0,${s.shadowOpacity[i]}))`;

      nameEl.style.opacity = `${s.nameOpacity[i]}`;
      nameEl.style.transform = `scale(${s.nameScale[i]})`;
      nameEl.style.color = `rgba(0,48,72,${0.3 + ep * 0.7})`;
    }
  }, [products.length, itemWidth]);

  /* ---- Center offset on mount & product/width change ---- */
  useEffect(() => {
    if (!containerRef.current || products.length === 0) return;
    measureSetWidth();
    const containerWidth = containerRef.current.clientWidth;
    const setWidth = singleSetWidthRef.current;
    if (setWidth <= 0) return;
    /* Place first item of middle copy at container center */
    offsetRef.current = -setWidth + (containerWidth - itemWidth) / 2;
    /* Normalize into wrap range [-setWidth, 0) */
    while (offsetRef.current < -setWidth) offsetRef.current += setWidth;
    while (offsetRef.current > 0) offsetRef.current -= setWidth;
    needsSnapRef.current = true;
  }, [products.length, itemWidth, measureSetWidth]);

  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!isVisibleRef.current) { rafRef.current = requestAnimationFrame(animate); return; }

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
      velocityRef.current *= 0.96;
      if (Math.abs(velocityRef.current) < 0.01) velocityRef.current = 0;
    }

    if (!isDraggingRef.current) {
      offsetRef.current += velocityRef.current;
    }

    /* Wrap detection — snap lerp states instantly to prevent visual pop */
    let wrapped = false;
    if (setWidth > 0) {
      while (offsetRef.current < -setWidth) { offsetRef.current += setWidth; wrapped = true; }
      while (offsetRef.current > 0) { offsetRef.current -= setWidth; wrapped = true; }
    }

    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;

    /* Snap on first frame, after wrap, or after resize — eliminates glitch */
    const shouldSnap = needsSnapRef.current || wrapped;
    if (needsSnapRef.current) needsSnapRef.current = false;
    applyItemTransforms(shouldSnap);

    rafRef.current = requestAnimationFrame(animate);
  }, [applyItemTransforms]);

  useEffect(() => {
    measureSetWidth();
    velocityRef.current = DEFAULT_SPEED * baseDirectionRef.current;
    rafRef.current = requestAnimationFrame(animate);
    const handleResize = () => { measureSetWidth(); needsSnapRef.current = true; };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
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
    if (dt > 0) dragVelocityRef.current = dragVelocityRef.current * 0.6 + (dx / dt) * 16 * 0.4;
    dragDistRef.current += Math.abs(dx);
    offsetRef.current += dx;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = now;

    const track = trackRef.current;
    const setWidth = singleSetWidthRef.current;
    if (track && setWidth > 0) {
      let dragWrapped = false;
      while (offsetRef.current < -setWidth) { offsetRef.current += setWidth; dragWrapped = true; }
      while (offsetRef.current > 0) { offsetRef.current -= setWidth; dragWrapped = true; }
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      if (dragWrapped) needsSnapRef.current = true;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (Math.abs(dragVelocityRef.current) > 0.5) {
      velocityRef.current = dragVelocityRef.current * 0.7;
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
      className="relative overflow-x-clip overflow-y-visible py-12 sm:py-20"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-px w-[2px] h-full bg-navy/8 pointer-events-none z-0" />

      <div
        className="absolute top-0 left-0 w-24 sm:w-44 h-full z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--color-cream-deeper), transparent)' }}
      />
      <div
        className="absolute top-0 right-0 w-24 sm:w-44 h-full z-10 pointer-events-none"
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

          >
            <div
              className="product-img-wrap relative cursor-pointer will-change-transform"
              style={{
                width: itemWidth < 200 ? '132px' : '220px',
                height: itemWidth < 200 ? '132px' : '220px',
                transformOrigin: 'center center',
              }}
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={getProductName(product, locale)}
                  fill
                  className="object-contain pointer-events-none"
                  sizes="220px"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-navy/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-5xl">🍽️</span>
                </div>
              )}
            </div>

            <p
              className="product-name mt-4 text-center font-heading font-semibold text-sm sm:text-base sm:whitespace-nowrap will-change-transform"
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
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

    </>
  );
}
