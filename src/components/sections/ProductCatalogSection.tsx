'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
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
  sort_order: number;
  is_active: boolean;
}

interface CategoryOption {
  value: string;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { value: 'abon-sapi', label: 'Abon Sapi' },
  { value: 'bakso-pentol', label: 'Bakso & Pentol' },
  { value: 'cita-rasa-indonesia', label: 'Cita Rasa Indonesia' },
  { value: 'nasi-rempah-instan', label: 'Nasi Rempah Instan' },
  { value: 'snack', label: 'Snack' },
];

/* ------------------------------------------------------------------ */
/*  Static Wavy Texture Background                                     */
/* ------------------------------------------------------------------ */
function WavyTextureBackground() {
  const rowHeight = 30;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="wavy-static"
            x="0"
            y="0"
            width="180"
            height={rowHeight}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M0,${rowHeight / 2} Q30,${rowHeight / 2 - 8} 45,${rowHeight / 2} T90,${rowHeight / 2} Q120,${rowHeight / 2 + 8} 135,${rowHeight / 2} T180,${rowHeight / 2}`}
              fill="none"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1.5"
            />
          </pattern>
          <pattern
            id="wavy-static-2"
            x="40"
            y="7"
            width="220"
            height={rowHeight + 5}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M0,${(rowHeight + 5) / 2} Q40,${(rowHeight + 5) / 2 - 6} 55,${(rowHeight + 5) / 2} T110,${(rowHeight + 5) / 2} Q150,${(rowHeight + 5) / 2 + 6} 165,${(rowHeight + 5) / 2} T220,${(rowHeight + 5) / 2}`}
              fill="none"
              stroke="rgba(0,0,0,0.07)"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wavy-static)" />
        <rect width="100%" height="100%" fill="url(#wavy-static-2)" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Popup                                                      */
/* ------------------------------------------------------------------ */
function ProductPopup({
  product,
  locale,
  onClose,
}: {
  product: ShowcaseProduct;
  locale: string;
  onClose: () => void;
}) {
  const getName = () => {
    if (locale === 'zh-TW' && product.name_zh) return product.name_zh;
    if (locale === 'id' && product.name_id) return product.name_id;
    return product.name;
  };

  const getDesc = () => {
    if (locale === 'zh-TW' && product.description_zh) return product.description_zh;
    if (locale === 'id' && product.description_id) return product.description_id;
    return product.description_en || '';
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        className="relative bg-cream rounded-3xl overflow-hidden max-w-md w-full shadow-2xl"
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-navy" />
        </button>

        <div className="relative w-full h-56 bg-gradient-to-br from-red/10 to-red/5 flex items-center justify-center">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={getName()}
              fill
              className="object-contain p-6"
              sizes="(max-width: 448px) 100vw, 448px"
              unoptimized
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-red/10 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
        </div>

        <div className="p-6 pt-5">
          <span className="inline-block text-red/70 text-xs font-semibold tracking-wider uppercase mb-2">
            {CATEGORIES.find((c) => c.value === product.category)?.label || product.category}
          </span>
          <h3 className="font-heading text-2xl font-bold text-navy mb-3">{getName()}</h3>
          <p className="text-navy/60 text-sm leading-relaxed">{getDesc()}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Infinite Carousel Slider — Fixed & Improved                        */
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
  const baseDirectionRef = useRef(1); // 1 = right (default), -1 = left
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
  const wobbleReadyRef = useRef(false);

  // --- Tuning ---
  const DEFAULT_SPEED = 0.8; // slower, more elegant
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

  // Triple the items for seamless loop
  const items = [...products, ...products, ...products];

  const getName = (p: ShowcaseProduct) => {
    if (locale === 'zh-TW' && p.name_zh) return p.name_zh;
    if (locale === 'id' && p.name_id) return p.name_id;
    return p.name;
  };

  const measureSetWidth = useCallback(() => {
    singleSetWidthRef.current = products.length * itemWidth;
  }, [products.length, itemWidth]);

  // Apply scale + wobble based on exact center distance
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

      // Normalized 0 → 1 (1 = at center)
      const proximity = Math.max(0, 1 - dist / maxDist);

      // Scale: far = 0.4, center = 1.5 (dramatic jump)
      const scale = 0.4 + proximity * proximity * 1.1; // quadratic for dramatic center pop
      const opacity = 0.25 + proximity * 0.75;

      imgContainer.style.transform = `scale(${scale})`;
      imgContainer.style.opacity = `${opacity}`;
      imgContainer.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease';

      // Name styling
      nameEl.style.opacity = `${0.2 + proximity * 0.8}`;
      nameEl.style.transform = `scale(${0.85 + proximity * 0.25})`;
      nameEl.style.color = `rgba(250,237,211,${0.3 + proximity * 0.7})`;
      nameEl.style.transition = 'all 0.35s ease';

      // Track closest for wobble
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i % products.length;
      }

      // Center threshold: within half an item width
      const isCentered = dist < itemWidth * 0.35;

      if (isCentered) {
        imgContainer.style.filter = 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))';
        // Only apply wobble if dwell time passed
        if (wobbleReadyRef.current && closestIdx === prevCenterIdxRef.current) {
          imgContainer.classList.add('product-wobble-active');
        }
      } else {
        imgContainer.classList.remove('product-wobble-active');
        imgContainer.style.filter = 'none';
      }
    }

    // Detect center change → start dwell timer
    if (closestIdx !== prevCenterIdxRef.current) {
      prevCenterIdxRef.current = closestIdx;
      wobbleReadyRef.current = false;

      // Clear previous timer
      if (centerDwellTimerRef.current) {
        clearTimeout(centerDwellTimerRef.current);
      }

      // Start new 0.5s dwell timer — wobble only after 500ms at center
      centerDwellTimerRef.current = setTimeout(() => {
        wobbleReadyRef.current = true;
      }, 500);
    }
  }, [products.length, itemWidth]);

  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const setWidth = singleSetWidthRef.current;
    const targetSpeed = DEFAULT_SPEED * baseDirectionRef.current;

    if (!isDraggingRef.current && !isPausedRef.current) {
      // Gradually return to base speed
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

    // Seamless wrapping
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
    // Start with initial velocity
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

  useEffect(() => {
    setTimeout(measureSetWidth, 100);
  }, [products, measureSetWidth]);

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

    // Transfer drag velocity and change base direction based on swipe
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
      <div className="flex items-center justify-center h-64 text-cream/50">
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
      {/* Center line indicator (subtle) */}
      <div className="absolute top-0 left-1/2 -translate-x-px w-[2px] h-full bg-cream/10 pointer-events-none z-0" />

      {/* Fade edges */}
      <div
        className="absolute top-0 left-0 w-20 sm:w-36 h-full z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--color-red), transparent)' }}
      />
      <div
        className="absolute top-0 right-0 w-20 sm:w-36 h-full z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--color-red), transparent)' }}
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
            {/* Product Image Container — bigger base size */}
            <div
              className="product-img-wrap relative cursor-pointer"
              style={{
                width: itemWidth < 200 ? '120px' : '200px',
                height: itemWidth < 200 ? '120px' : '200px',
                transformOrigin: 'center bottom',
              }}
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={getName(product)}
                  fill
                  className="object-contain drop-shadow-lg pointer-events-none"
                  sizes="200px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-cream/15 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-5xl">🍽️</span>
                </div>
              )}
            </div>

            {/* Product Name */}
            <p className="product-name mt-4 text-center font-heading font-semibold text-sm sm:text-base whitespace-nowrap">
              {getName(product)}
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
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShowcaseProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShowcaseProduct | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Fetch all showcase products on mount */
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('showcase_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setAllProducts(data);
      }
    }
    fetchProducts();
  }, []);

  /* Filter by selected category */
  useEffect(() => {
    const filtered = allProducts.filter((p) => p.category === selectedCategory);
    setProducts(filtered);
  }, [selectedCategory, allProducts]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* GSAP entrance */
  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const selectedLabel = CATEGORIES.find((c) => c.value === selectedCategory)?.label || '';

  return (
    <>
      <section
        ref={sectionRef}
        className="relative bg-red overflow-hidden py-16 sm:py-24"
      >
        {/* Static wavy texture background */}
        <WavyTextureBackground />

        {/* Content */}
        <div ref={contentRef} className="relative z-10">
          {/* Section Heading */}
          <div className="text-center mb-6 sm:mb-8 px-4">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-cream mb-2 drop-shadow-lg">
              Our Products
            </h2>
            <p className="text-cream/70 text-base sm:text-lg md:text-xl font-body tracking-wide">
              Indonesian Taste, in Taiwan.
            </p>
          </div>

          {/* Category Dropdown — compact */}
          <div className="flex justify-center mb-6 sm:mb-10 px-4">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-cream text-navy font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 min-w-[200px] justify-between"
              >
                <span className="font-heading text-sm">{selectedLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
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
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          selectedCategory === cat.value
                            ? 'bg-red/10 text-red'
                            : 'text-navy hover:bg-navy/5'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
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
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
