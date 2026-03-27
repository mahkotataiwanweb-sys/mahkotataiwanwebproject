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
/*  Animated Wavy Background                                           */
/* ------------------------------------------------------------------ */
function WavyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Multiple layers of animated SVG waves */}
      {[0, 1, 2, 3, 4].map((layer) => (
        <svg
          key={layer}
          className="wavy-layer absolute w-[200%] h-full left-0 top-0"
          style={{
            animationDelay: `${layer * -3}s`,
            opacity: 0.08 + layer * 0.025,
          }}
          viewBox="0 0 2400 600"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`wave-${layer}`}
              x="0"
              y="0"
              width="200"
              height={28 + layer * 4}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M0,${14 + layer * 2} Q50,${0 + layer} 100,${14 + layer * 2} Q150,${28 + layer * 4} 200,${14 + layer * 2}`}
                fill="none"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={1.2 + layer * 0.15}
              />
            </pattern>
          </defs>
          <rect width="2400" height="600" fill={`url(#wave-${layer})`} />
        </svg>
      ))}
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        className="relative bg-cream rounded-3xl overflow-hidden max-w-md w-full shadow-2xl"
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-navy" />
        </button>

        {/* Product image area */}
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

        {/* Content */}
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
  const velocityRef = useRef(-0.8); // px per frame (slow left)
  const isDraggingRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const rafRef = useRef<number>(0);
  const singleSetWidthRef = useRef(0);
  const itemWidthRef = useRef(260);
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(-1);

  const DEFAULT_SPEED = 0.8;
  const FRICTION = 0.96;
  const RETURN_RATE = 0.03;

  // Triple the items for seamless loop
  const items = [...products, ...products, ...products];

  const getName = (p: ShowcaseProduct) => {
    if (locale === 'zh-TW' && p.name_zh) return p.name_zh;
    if (locale === 'id' && p.name_id) return p.name_id;
    return p.name;
  };

  const measureSetWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    singleSetWidthRef.current = track.scrollWidth / 3;
  }, []);

  const findCenterItem = useCallback(() => {
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
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const dist = Math.abs(childCenter - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i % products.length;
      }
    }

    setCenterIndex(closestIdx);
  }, [products.length]);

  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const setWidth = singleSetWidthRef.current;

    if (!isDraggingRef.current && !isPausedRef.current) {
      velocityRef.current += (-DEFAULT_SPEED - velocityRef.current) * RETURN_RATE;
      const excess = velocityRef.current - -DEFAULT_SPEED;
      if (Math.abs(excess) > 0.01) {
        velocityRef.current = -DEFAULT_SPEED + excess * FRICTION;
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

    findCenterItem();
    rafRef.current = requestAnimationFrame(animate);
  }, [findCenterItem]);

  useEffect(() => {
    measureSetWidth();
    rafRef.current = requestAnimationFrame(animate);
    const handleResize = () => measureSetWidth();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [animate, measureSetWidth]);

  // Re-measure when products change
  useEffect(() => {
    setTimeout(measureSetWidth, 100);
  }, [products, measureSetWidth]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    isPausedRef.current = true;
    lastPointerXRef.current = e.clientX;
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
    // Transfer drag velocity — direction follows swipe direction
    velocityRef.current = dragVelocityRef.current || -DEFAULT_SPEED;
    // Resume after releasing
    isPausedRef.current = false;
  }, []);

  const handleClick = useCallback(() => {
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
      className="relative overflow-hidden py-8"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      {/* Fade edges */}
      <div className="absolute top-0 left-0 w-20 sm:w-32 h-full bg-gradient-to-r from-red to-transparent z-10 pointer-events-none" style={{ '--tw-gradient-from': 'var(--color-red)' } as React.CSSProperties} />
      <div className="absolute top-0 right-0 w-20 sm:w-32 h-full bg-gradient-to-l from-red to-transparent z-10 pointer-events-none" style={{ '--tw-gradient-from': 'var(--color-red)' } as React.CSSProperties} />

      <div
        ref={trackRef}
        className="flex select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        {items.map((product, i) => {
          const isCenter = i % products.length === centerIndex;
          return (
            <div
              key={`${product.id}-${i}`}
              className="flex-shrink-0 px-4 sm:px-6 flex flex-col items-center transition-all duration-500 ease-out"
              style={{ width: `${itemWidthRef.current}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
            >
              {/* Product Image Container */}
              <div
                className={`relative w-40 h-40 sm:w-48 sm:h-48 transition-all duration-500 ease-out cursor-pointer ${
                  isCenter
                    ? 'scale-125 sm:scale-[1.35] drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                    : 'scale-90 opacity-70'
                }`}
                style={
                  isCenter
                    ? { animation: 'productFloat 3s ease-in-out infinite' }
                    : undefined
                }
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={getName(product)}
                    fill
                    className="object-contain drop-shadow-lg"
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
              <p
                className={`mt-4 text-center font-heading font-semibold transition-all duration-500 ${
                  isCenter
                    ? 'text-cream text-base sm:text-lg scale-110'
                    : 'text-cream/50 text-sm'
                }`}
              >
                {getName(product)}
              </p>
            </div>
          );
        })}
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

  /* GSAP parallax entrance */
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax: section content slides up dramatically as you scroll into it
      gsap.fromTo(
        contentRef.current,
        { y: 120, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 90%',
            end: 'top 30%',
            scrub: 1,
          },
        }
      );

      // Background parallax speed difference
      gsap.fromTo(
        sectionRef.current,
        { backgroundPositionY: '-50px' },
        {
          backgroundPositionY: '50px',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
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
        {/* Animated wavy background texture */}
        <WavyBackground />

        {/* Content with parallax */}
        <div ref={contentRef} className="relative z-10">
          {/* Category Dropdown */}
          <div className="flex justify-center mb-8 sm:mb-12 px-4">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-cream text-navy font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 min-w-[260px] justify-between"
              >
                <span className="font-heading">{selectedLabel}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-cream rounded-2xl shadow-2xl overflow-hidden z-20"
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-6 py-3.5 text-sm sm:text-base font-semibold transition-all duration-200 ${
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
