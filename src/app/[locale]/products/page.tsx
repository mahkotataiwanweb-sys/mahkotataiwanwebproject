'use client';

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Package, ArrowLeft, X,
  Shield, Award, Search, ArrowRight, Sparkles, ChevronDown
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import CategoryIcon from '@/components/ui/CategoryIcon';
import HeroBackground from '@/components/effects/HeroBackground';
import SandTexture from '@/components/effects/SandTexture';
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
/*  Highlight helper                                                   */
/* ------------------------------------------------------------------ */
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const pattern = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-red/15 text-red font-bold rounded-sm px-0.5">{part}</mark>
      : part
  );
}

/* ------------------------------------------------------------------ */
/*  Normalize text for search (remove diacritics, lowercase)           */
/* ------------------------------------------------------------------ */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Smart Search Component — portal-based dropdown, no clip            */
/* ------------------------------------------------------------------ */
function SmartSearch({
  products,
  categories,
  locale,
  onSelectProduct,
}: {
  products: Product[];
  categories: Category[];
  locale: string;
  onSelectProduct: (product: Product, categoryId: string) => void;
}) {
  const t = useTranslations('products');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [portalReady, setPortalReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPortalReady(true); }, []);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!focused) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [focused, query, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, { en: string; id: string; zh: string }> = {};
    categories.forEach(c => {
      map[c.id] = {
        en: normalizeText(c.name_en || ''),
        id: normalizeText(c.name_id || ''),
        zh: normalizeText(c.name_zh || ''),
      };
    });
    return map;
  }, [categories]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalizedQuery = normalizeText(query);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const scored = products.map((p) => {
      const productFields = [
        normalizeText(getLocalizedField(p, 'name', locale)),
        normalizeText(p.name_en || ''),
        normalizeText(p.name_id || ''),
        normalizeText(p.name_zh || ''),
        normalizeText(p.description_en || ''),
        normalizeText(p.description_id || ''),
        normalizeText(p.description_zh || ''),
        normalizeText(p.slug || ''),
      ];

      const catNames = categoryNameMap[p.category_id];
      if (catNames) {
        productFields.push(catNames.en, catNames.id, catNames.zh);
      }

      let score = 0;
      let allTokensMatched = true;

      for (const token of tokens) {
        let tokenBestScore = 0;

        for (const text of productFields) {
          if (!text) continue;
          if (text === token) { tokenBestScore = Math.max(tokenBestScore, 100); continue; }
          if (text.startsWith(token)) { tokenBestScore = Math.max(tokenBestScore, 70); continue; }
          const words = text.split(/[\s\-_]+/);
          if (words.some(w => w === token)) { tokenBestScore = Math.max(tokenBestScore, 80); continue; }
          if (words.some(w => w.startsWith(token))) { tokenBestScore = Math.max(tokenBestScore, 55); continue; }
          if (text.includes(token)) { tokenBestScore = Math.max(tokenBestScore, 30); continue; }
          if (token.length >= 1 && /[\u4e00-\u9fff]/.test(token) && text.includes(token)) {
            tokenBestScore = Math.max(tokenBestScore, 40);
          }
        }

        if (tokenBestScore === 0) { allTokensMatched = false; break; }
        score += tokenBestScore;
      }

      if (allTokensMatched && tokens.length > 1) {
        score *= (1 + tokens.length * 0.1);
      }

      return { product: p, score, matched: allTokensMatched };
    });

    return scored
      .filter(s => s.matched && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(s => s.product);
  }, [query, products, locale, categoryNameMap]);

  const grouped = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    results.forEach((p) => {
      const catId = p.category_id;
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(p);
    });
    return groups;
  }, [results]);

  const flatList = results;

  useEffect(() => { setActiveIndex(-1); }, [query]);

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      return cat ? getLocalizedField(cat, 'name', locale) : '';
    },
    [categories, locale]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flatList[activeIndex]) {
      e.preventDefault();
      const p = flatList[activeIndex];
      onSelectProduct(p, p.category_id);
      setQuery('');
      setFocused(false);
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  }, [activeIndex, flatList, onSelectProduct]);

  const placeholderText = t('searchAllCategories');

  const searchHint = t('searchHint');

  const showDropdown = focused && query.trim().length > 0;

  let globalResultIndex = -1;

  const dropdownContent = showDropdown && portalReady ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999]"
      style={{
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="rounded-2xl bg-white/[0.99] backdrop-blur-2xl shadow-2xl shadow-navy/20 border border-navy/8 overflow-hidden max-h-[min(440px,60vh)] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,48,72,0.12) transparent' }}
      >
        {results.length === 0 ? (
          <div className="p-10 text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy/5 flex items-center justify-center">
                <Package className="w-8 h-8 text-navy/15" />
              </div>
            </motion.div>
            <p className="text-navy/50 text-sm font-medium mb-1">
              {t('noProductsFound')}
            </p>
            <p className="text-navy/30 text-xs">
              {t('tryDifferentKeywords')}
            </p>
          </div>
        ) : (
          <div className="py-2">
            <div className="px-5 py-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-navy/30 uppercase tracking-[0.15em]">
                {results.length} {t('results')}
              </span>
              <div className="hidden sm:flex items-center gap-1">
                <kbd className="text-[9px] text-navy/25 bg-navy/5 px-1 py-0.5 rounded font-mono">↵</kbd>
                <span className="text-[9px] text-navy/20">{t('select')}</span>
              </div>
            </div>

            {Object.entries(grouped).map(([catId, prods]) => {
              const catName = getCategoryName(catId);
              const cat = categories.find((c) => c.id === catId);
              return (
                <div key={catId}>
                  <div className="px-5 py-2 text-[10px] font-bold text-navy/30 uppercase tracking-[0.2em] bg-gradient-to-r from-cream/60 to-transparent flex items-center gap-2 sticky top-0 backdrop-blur-sm z-10">
                    {cat && <CategoryIcon slug={cat.slug} size={12} className="opacity-40" />}
                    {catName}
                    <span className="text-navy/20">({prods.length})</span>
                  </div>
                  {prods.map((product) => {
                    globalResultIndex++;
                    const thisIndex = globalResultIndex;
                    const name = getLocalizedField(product, 'name', locale);
                    const desc = getLocalizedField(product, 'description', locale);
                    const isActive = thisIndex === activeIndex;

                    return (
                      <motion.button
                        key={product.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: thisIndex * 0.02 }}
                        onClick={() => {
                          onSelectProduct(product, catId);
                          setQuery('');
                          setFocused(false);
                        }}
                        onMouseEnter={() => setActiveIndex(thisIndex)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 transition-all duration-200 group text-left ${
                          isActive ? 'bg-red/5' : 'hover:bg-cream/60'
                        }`}
                      >
                        <div className={`w-13 h-13 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center transition-all duration-300 ${
                          isActive ? 'bg-red/10 shadow-md shadow-red/10' : 'bg-cream/80'
                        }`}>
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={name}
                              width={52}
                              height={52}
                              className="w-full h-full object-contain p-1"
                              unoptimized
                            />
                          ) : (
                            <Package className="w-5 h-5 text-navy/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate transition-colors duration-200 ${
                            isActive ? 'text-red' : 'text-navy group-hover:text-red'
                          }`}>
                            {highlightText(name, query)}
                          </p>
                          {desc && (
                            <p className="text-navy/35 text-xs mt-0.5 truncate">
                              {highlightText(desc.slice(0, 60), query)}{desc.length > 60 ? '...' : ''}
                            </p>
                          )}
                          <p className="text-navy/25 text-[10px] mt-0.5">{catName}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                          isActive ? 'text-red translate-x-1' : 'text-navy/15 group-hover:text-red group-hover:translate-x-1'
                        }`} />
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}

            <div className="px-5 py-3 border-t border-navy/5 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-red/30" />
              <span className="text-[10px] text-navy/25">{searchHint}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className={`relative transition-all duration-500 ${focused ? 'scale-[1.02]' : ''}`}>
        <div className={`absolute -inset-1.5 rounded-2xl transition-all duration-700 ${
          focused ? 'opacity-100' : 'opacity-0'
        }`}>
</div>

        <div className={`relative flex items-center rounded-2xl transition-all duration-500 overflow-hidden ${
          focused
            ? 'bg-white shadow-2xl shadow-navy/15 ring-2 ring-red/20'
            : 'bg-white/80 shadow-lg shadow-navy/5 hover:shadow-xl'
        }`}>
          <div className={`ml-5 transition-all duration-500 ${focused ? 'scale-110' : ''}`}>
            <Search className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
              focused ? 'text-red' : 'text-navy/30'
            }`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="flex-1 px-4 py-4.5 bg-transparent text-navy placeholder:text-navy/30 text-base focus:outline-none"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                transition={{ duration: 0.2 }}
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="mr-4 p-1.5 rounded-full hover:bg-red/10 transition-colors"
              >
                <X className="w-4 h-4 text-navy/40 hover:text-red transition-colors" />
              </motion.button>
            )}
          </AnimatePresence>
          {focused && !query && (
            <div className="hidden sm:flex items-center mr-4 gap-1">
              <kbd className="text-[10px] text-navy/25 bg-navy/5 px-1.5 py-0.5 rounded font-mono">↑↓</kbd>
              <span className="text-[10px] text-navy/20">{t('navigate')}</span>
            </div>
          )}
        </div>
      </div>

      {dropdownContent}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Product Modal — Ultra Premium                                      */
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
  const t = useTranslations('products');
  const name = getLocalizedField(product, 'name', locale);
  const description = getLocalizedField(product, 'description', locale);
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
        initial={{ scale: 0.85, y: 80, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 50, opacity: 0 }}
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
            <div className="flex flex-col items-center justify-center h-full gap-3 text-navy/20">
              <Package className="w-20 h-20" />
            </div>
          )}

          {/* Category pill — frosted glass */}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-white/90 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg"
          >
            {categoryName}
          </motion.span>
        </div>

        {/* Content */}
        <div className="relative -mt-10 px-8 sm:px-10 pb-10">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
            className="text-navy/55 text-sm sm:text-base leading-[1.85] whitespace-pre-line"
          >
            {description || t('defaultProductDescription')}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Dropdown Selector                                         */
/* ------------------------------------------------------------------ */
function CategoryDropdown({
  categories,
  activeCategory,
  locale,
  productCounts,
  onSelect,
}: {
  categories: Category[];
  activeCategory: string;
  locale: string;
  productCounts: Record<string, number>;
  onSelect: (categoryId: string) => void;
}) {
  const t = useTranslations('products');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCat = categories.find(c => c.id === activeCategory);
  const activeName = activeCat ? getLocalizedField(activeCat, 'name', locale) : '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryLabel = t('categories');
  const itemsLabel = t('select');

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Compact trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-sm border border-navy/10 shadow-md shadow-navy/5 hover:shadow-lg hover:bg-white hover:border-navy/15 transition-all duration-300"
      >
        {activeCat && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red/10 to-red/5 flex items-center justify-center text-red">
            <CategoryIcon slug={activeCat.slug} size={16} />
          </div>
        )}
        <div className="text-left">
          <span className="text-[9px] text-navy/30 font-semibold uppercase tracking-[0.15em] block leading-none mb-0.5">{categoryLabel}</span>
          <span className="text-sm font-bold text-navy block leading-tight">{activeName}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-navy/25 ml-1 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Compact dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-white/[0.99] backdrop-blur-2xl rounded-xl shadow-xl shadow-navy/12 border border-navy/8 overflow-hidden z-50 max-h-[360px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,48,72,0.12) transparent' }}
          >
            <div className="p-1.5">
              {categories.map((cat, i) => {
                const name = getLocalizedField(cat, 'name', locale);
                const isActive = cat.id === activeCategory;
                const count = productCounts[cat.id] || 0;

                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    onClick={() => {
                      onSelect(cat.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-left ${
                      isActive
                        ? 'bg-red/8 ring-1 ring-red/12'
                        : 'hover:bg-cream/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'bg-red/15 text-red'
                        : 'bg-navy/5 text-navy/35 group-hover:bg-red/10 group-hover:text-red'
                    }`}>
                      <CategoryIcon slug={cat.slug} size={16} />
                    </div>
                    <span className={`text-sm font-semibold truncate flex-1 transition-colors duration-200 ${
                      isActive ? 'text-red' : 'text-navy/70 group-hover:text-navy'
                    }`}>
                      {name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-red/12 text-red'
                        : 'bg-navy/5 text-navy/25 group-hover:bg-red/8 group-hover:text-red/50'
                    }`}>
                      {count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Product Card — continuous float animation                 */
/* ------------------------------------------------------------------ */
function FloatingProductCard({
  product,
  locale,
  index,
  onClick,
  isHighlighted,
  showcaseImageUrl,
}: {
  product: Product;
  locale: string;
  index: number;
  onClick: () => void;
  isHighlighted?: boolean;
  showcaseImageUrl?: string | null;
}) {
  const name = getLocalizedField(product, 'name', locale);
  const imageUrl = showcaseImageUrl || product.image_url;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isHighlighted]);

  const floatDuration = 3.5 + (index % 4) * 0.6;
  const floatDelay = (index % 6) * 0.25;

  return (
    <div
      className="product-card-float-wrapper"
      style={{
        animation: `cardFloat ${floatDuration}s ease-in-out infinite`,
        animationDelay: `${floatDelay}s`,
      }}
    >
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
          delay: index * 0.06,
        }}
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        className="cursor-pointer group"
      >
        <div
          className="relative"
          style={{
            filter: isHighlighted
              ? 'drop-shadow(0 12px 30px rgba(193,33,38,0.25)) drop-shadow(0 4px 10px rgba(193,33,38,0.15))'
              : 'drop-shadow(0 8px 24px rgba(0,48,72,0.12)) drop-shadow(0 20px 40px rgba(0,48,72,0.08))',
            transition: 'filter 0.5s ease',
          }}
          onMouseEnter={(e) => {
            if (!isHighlighted) {
              e.currentTarget.style.filter = 'drop-shadow(0 16px 40px rgba(0,48,72,0.22)) drop-shadow(0 30px 60px rgba(0,48,72,0.15))';
            }
          }}
          onMouseLeave={(e) => {
            if (!isHighlighted) {
              e.currentTarget.style.filter = 'drop-shadow(0 8px 24px rgba(0,48,72,0.12)) drop-shadow(0 20px 40px rgba(0,48,72,0.08))';
            }
          }}
        >
          <div className="relative w-full h-0 pb-[100%]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-contain p-2 transition-all duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-navy/10">
                <Package className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 px-1 text-center">
          <p className={`text-sm font-semibold transition-colors duration-300 line-clamp-2 leading-snug ${
            isHighlighted ? 'text-red' : 'text-navy/70 group-hover:text-navy'
          }`}>
            {name}
          </p>
        </div>
      </motion.div>
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
  const productParam = searchParams.get('product');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showcaseProducts, setShowcaseProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
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
          const cats = catRes.data as Category[];
          setCategories(cats);

          if (categoryParam) {
            const matched = cats.find((c) => c.slug === categoryParam);
            if (matched) {
              setActiveFilter(matched.id);
              if (productParam && prodRes.data) {
                const matchedProduct = (prodRes.data as Product[]).find(
                  (p) => p.slug === productParam || p.id === productParam
                );
                if (matchedProduct) {
                  setHighlightedProductId(matchedProduct.id);
                  setTimeout(() => {
                    setSelectedProductForModal(matchedProduct);
                  }, 800);
                }
              }
            } else if (cats.length > 0) {
              // Default to first category
              setActiveFilter(cats[0].id);
            }
          } else if (cats.length > 0) {
            // Default to first category
            setActiveFilter(cats[0].id);
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
  }, [categoryParam, productParam]);

  /* Preload ALL product images upfront so everything is instant */
  useEffect(() => {
    if (products.length === 0) return;
    products.forEach((p) => {
      if (p.image_url) {
        const img = new window.Image();
        img.src = p.image_url;
      }
      if (p.detail_image_url) {
        const img = new window.Image();
        img.src = p.detail_image_url;
      }
    });
  }, [products]);

  useEffect(() => {
    if (showcaseProducts.length === 0) return;
    showcaseProducts.forEach((p) => {
      if (p.image_url) {
        const img = new window.Image();
        img.src = p.image_url;
      }
      if (p.detail_image_url) {
        const img = new window.Image();
        img.src = p.detail_image_url;
      }
    });
  }, [showcaseProducts]);

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
    setHighlightedProductId(null);
  }, []);

  const handleSearchSelectProduct = useCallback((product: Product, categoryId: string) => {
    setActiveFilter(categoryId);
    setHighlightedProductId(product.id);
    setTimeout(() => {
      setSelectedProductForModal(product);
    }, 600);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProductForModal(product);
    setHighlightedProductId(product.id);
  }, []);

  const tapLabel = locale === 'id' ? 'Ketuk produk untuk detail' : locale === 'zh-TW' ? '點擊產品查看詳情' : 'Tap any product for details';
  const productLabel = locale === 'id' ? 'produk' : locale === 'zh-TW' ? '產品' : 'products';

  return (
    <div className="min-h-screen bg-cream">
      {/* ============ HERO ============ */}
      <div className="relative bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] overflow-hidden">
        <HeroBackground />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10 pt-32 sm:pt-36 pb-20 sm:pb-28">
          <Link
            href={`/${locale}`}
            className="hero-reveal inline-flex items-center gap-2 text-cream/40 hover:text-cream text-sm mb-10 transition-colors duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {locale === 'id' ? 'Kembali ke Beranda' : locale === 'zh-TW' ? '返回首頁' : 'Back to Home'}
          </Link>

          <div ref={headerRef} className="max-w-3xl">
            <div className="hero-reveal flex items-center gap-3 mb-5">
              <div className="w-10 h-[2px] bg-red rounded-full" />
              <span className="text-red text-sm tracking-[0.3em] uppercase font-semibold">
                {t('title')}
              </span>
            </div>

            <h1 className="hero-reveal font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[0.95]">
              {locale === 'id' ? 'Jelajahi' : locale === 'zh-TW' ? '探索我們的' : 'Explore Our'}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cream via-white to-cream/70">
                {locale === 'id' ? 'Koleksi Kami' : locale === 'zh-TW' ? '產品系列' : 'Collections'}
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
                <p className="text-cream/40 text-sm mt-1">{t('title')}</p>
              </div>
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-white">{categories.length}</span>
                <p className="text-cream/40 text-sm mt-1">{t('categories')}</p>
              </div>
              <div>
                <span className="font-heading text-3xl sm:text-4xl font-bold text-red">100%</span>
                <p className="text-cream/40 text-sm mt-1">{t('halal')}</p>
              </div>
            </div>

            {/* Smart Search */}
            <div className="hero-reveal mt-10">
              <SmartSearch
                products={products}
                categories={categories}
                locale={locale}
                onSelectProduct={handleSearchSelectProduct}
              />
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute -bottom-[3px] left-0 right-0 z-20">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-[60px] sm:h-[80px]">
            <path d="M0 80V30C240 10 480 0 720 10C960 20 1200 40 1440 30V80H0Z" fill="var(--color-cream)" />
          </svg>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="relative overflow-hidden">
        {/* Wavy SVG texture — visible background pattern behind products */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wavy-products" x="0" y="0" width="180" height="30" patternUnits="userSpaceOnUse">
                <path d="M0,15 Q30,7 45,15 T90,15 Q120,23 135,15 T180,15" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
              </pattern>
              <pattern id="wavy-products-2" x="40" y="7" width="220" height="35" patternUnits="userSpaceOnUse">
                <path d="M0,17.5 Q40,11.5 55,17.5 T110,17.5 Q150,23.5 165,17.5 T220,17.5" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wavy-products)" />
            <rect width="100%" height="100%" fill="url(#wavy-products-2)" />
          </svg>
        </div>
        {/* Subtle grain overlay */}
        <div className="absolute inset-0 z-[1] pointer-events-none opacity-30"><SandTexture /></div>
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20 scroll-mt-8 min-h-[60vh]">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-navy/5 rounded-2xl aspect-square mb-3" />
                <div className="bg-navy/5 rounded-lg h-4 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Category Dropdown + Info Bar — positioned higher */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 sm:mb-14 -mt-2 sm:-mt-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Dropdown */}
                <CategoryDropdown
                  categories={categories}
                  activeCategory={activeFilter || ''}
                  locale={locale}
                  productCounts={productCountByCategory}
                  onSelect={handleSelectCategory}
                />

                {/* Product count + hint */}
                <div className="text-right">
                  <p className="text-navy/50 text-sm">
                    <span className="font-bold text-navy">{displayedProducts.length}</span> {productLabel}
                  </p>
                  <p className="text-navy/30 text-xs mt-0.5">{tapLabel}</p>
                </div>
              </div>
            </motion.div>

            {/* Product Grid with AnimatePresence for smooth transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {displayedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                    {displayedProducts.map((product, i) => (
                      <FloatingProductCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        index={i}
                        onClick={() => handleProductClick(product)}
                        isHighlighted={highlightedProductId === product.id}
                        showcaseImageUrl={getShowcaseImage(product)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 text-navy/10 mx-auto mb-4" />
                    <p className="text-navy/40 text-sm">
                      {t('noProductsInCategory')}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

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
        )}
      </div>

      </div>{/* end SandTexture wrapper */}

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProductForModal && (
          <ProductModal
            product={selectedProductForModal}
            locale={locale}
            categoryName={getCategoryName(selectedProductForModal.category_id)}
            onClose={() => setSelectedProductForModal(null)}
          />
        )}
      </AnimatePresence>
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
