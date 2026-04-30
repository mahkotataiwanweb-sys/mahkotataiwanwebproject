'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useEditableT } from '@/hooks/useEditableT';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { NavMenuItem } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Fallback nav structure                                             */
/* ------------------------------------------------------------------ */
interface FallbackNavLink { key: string; href: string; }
interface FallbackNavItemSimple { type: 'link'; key: string; href: string; }
interface FallbackNavItemDropdown { type: 'dropdown'; key: string; href: string; children: FallbackNavLink[]; }
type FallbackNavItem = FallbackNavItemSimple | FallbackNavItemDropdown;

const fallbackNavItems: FallbackNavItem[] = [
  { type: 'link', key: 'home', href: '/' },
  {
    type: 'dropdown',
    key: 'products',
    href: '/products',
    children: [
      { key: 'recipes', href: '/recipes' },
    ],
  },
  { type: 'link', key: 'events', href: '/events' },
  { type: 'link', key: 'activity', href: '/activity' },
  { type: 'link', key: 'about', href: '/about' },
  { type: 'link', key: 'contact', href: '/contact' },
  { type: 'link', key: 'whereToBuy', href: '/where-to-buy' },
];

// Pages with dark backgrounds where navbar needs light text
const darkHeaderPages = ['/products', '/activity', '/events', '/about', '/where-to-buy', '/contact', '/recipes'];

/* ------------------------------------------------------------------ */
/*  Main Navbar                                                        */
/* ------------------------------------------------------------------ */
export default function Navbar() {
  const t = useEditableT('nav', 'navbar');
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const [dbMenuItems, setDbMenuItems] = useState<NavMenuItem[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [heroBrightness, setHeroBrightness] = useState<string>('dark');

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isDarkHeaderPage = darkHeaderPages.some(
    (p) => pathname === `/${locale}${p}` || pathname.startsWith(`/${locale}${p}/`)
  );
  const useLightText = !isScrolled && (isHomePage || isDarkHeaderPage);

  // Observe hero brightness
  useEffect(() => {
    if (!isHomePage) return;
    const readBrightness = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--hero-brightness').trim();
      if (value === 'light' || value === 'dark') setHeroBrightness(value);
    };
    readBrightness();
    const observer = new MutationObserver(readBrightness);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => { observer.disconnect(); };
  }, [isHomePage]);

  // Fetch menus
  useEffect(() => {
    async function fetchData() {
      try {
        const menusRes = await supabase.from('navbar_menus').select('*').eq('is_active', true).order('sort_order');
        if (menusRes.data && menusRes.data.length > 0) setDbMenuItems(menusRes.data as NavMenuItem[]);
      } catch {
        // keep fallback
      } finally {
        setMenuLoaded(true);
      }
    }
    fetchData();
  }, []);

  // Build DB menu tree (filter out dead URLs that no longer exist on the live site)
  const menuTree = useMemo(() => {
    if (dbMenuItems.length === 0) return null;
    const filtered = dbMenuItems.filter((item) => {
      const url = (item.url || '').toLowerCase();
      // Pages that have been removed from the live site
      if (/\/(gallery|news|lifestyle)(\/|$)/.test(url)) return false;
      return true;
    });
    const topLevel = filtered.filter((item) => item.parent_id === null);
    const childrenMap = new Map<string, NavMenuItem[]>();
    filtered.forEach((item) => {
      if (item.parent_id) {
        const existing = childrenMap.get(item.parent_id) || [];
        existing.push(item);
        childrenMap.set(item.parent_id, existing);
      }
    });
    return topLevel.map((parent) => ({ ...parent, children: childrenMap.get(parent.id) || [] }));
  }, [dbMenuItems]);

  const getLabel = (item: NavMenuItem) => {
    if (locale === 'zh-TW') return item.label_zh || item.label_en;
    if (locale === 'id') return item.label_id || item.label_en;
    return item.label_en;
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      setIsHidden(currentScrollY > lastScrollY && currentScrollY > 300);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (isMobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const buildHref = (href: string) => {
    if (href === '/') return `/${locale}`;
    if (href.startsWith('/')) return `/${locale}${href}`;
    if (href.startsWith('http')) return href;
    return `/${locale}/${href}`;
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return isHomePage;
    const hrefPath = href.split('?')[0];
    const fullPath = hrefPath.startsWith('/') ? `/${locale}${hrefPath}` : `/${locale}/${hrefPath}`;
    return pathname.startsWith(fullPath);
  };

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  const linkColor = (active: boolean) => {
    if (active) {
      return useLightText
        ? 'text-white font-bold border-b-2 border-white pb-0.5'
        : 'text-navy font-bold border-b-2 border-red pb-0.5';
    }
    return useLightText ? 'text-white/90 hover:text-white' : 'text-navy/80 hover:text-navy';
  };

  const hamburgerColor = useLightText ? 'text-white' : 'text-navy';
  const useDbMenus = menuTree && menuTree.length > 0;
  const tNav = useEditableT('nav', 'navbar');

  /* ---- Products dropdown labels ---- */
  const ourCollectionLabel = tNav('ourCollection');
  const recipesLabel = tNav('recipes');

  /* ===== RENDER PRODUCTS DROPDOWN (shared) ===== */
  const renderProductsDropdownContent = (onLinkClick: () => void) => (
    <div className="py-2">
      <Link
        href={buildHref('/products')}
        onClick={onLinkClick}
        className={cn(
          'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200',
          isLinkActive('/products') && !isLinkActive('/recipes')
            ? 'text-red bg-red/5'
            : 'text-navy/70 hover:text-navy hover:bg-cream/50'
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red/60" />
        {ourCollectionLabel}
      </Link>
      <Link
        href={buildHref('/recipes')}
        onClick={onLinkClick}
        className={cn(
          'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200',
          isLinkActive('/recipes')
            ? 'text-red bg-red/5'
            : 'text-navy/70 hover:text-navy hover:bg-cream/50'
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red/60" />
        {recipesLabel}
      </Link>
    </div>
  );

  /* ===== DB DESKTOP NAV ===== */
  const renderDbDesktopNav = () => {
    if (!menuTree) return null;
    return menuTree.map((item) => {
      const hasChildren = item.children.length > 0;
      const isHome = item.url === '/';
      const isActive = isLinkActive(item.url);
      const isChildActive = hasChildren && item.children.some((c) => isLinkActive(c.url));
      const isProducts = item.url === '/products';

      if (!hasChildren && !isProducts) {
        if (isHome && isHomePage) {
          return (
            <button key={item.id} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={cn('text-base font-medium tracking-wide uppercase line-reveal transition-colors',
                useLightText ? 'text-white font-bold border-b-2 border-white pb-0.5' : 'text-navy font-bold border-b-2 border-red pb-0.5'
              )}>
              {getLabel(item)}
            </button>
          );
        }
        return (
          <Link key={item.id} href={buildHref(item.url)}
            className={cn('text-base font-medium tracking-wide uppercase line-reveal transition-colors duration-300', linkColor(isActive))}>
            {getLabel(item)}
          </Link>
        );
      }

      // Products dropdown or standard dropdown
      return (
        <div key={item.id} className="relative"
          onMouseEnter={() => handleMouseEnter(item.id)}
          onMouseLeave={handleMouseLeave}>
          <button
            onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
            className={cn('flex items-center gap-1 text-base font-medium tracking-wide uppercase transition-colors duration-300',
              linkColor(isChildActive || isActive))}>
            {getLabel(item)}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', openDropdown === item.id && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {openDropdown === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-xl shadow-lg border border-navy/5 overflow-hidden min-w-[220px]"
              >
                {isProducts ? (
                  renderProductsDropdownContent(() => setOpenDropdown(null))
                ) : (
                  <div className="py-2">
                    {item.children.map((child) => (
                      <Link key={child.id} href={buildHref(child.url)}
                        onClick={() => setOpenDropdown(null)}
                        className={cn('flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200',
                          isLinkActive(child.url) ? 'text-red bg-red/5' : 'text-navy/70 hover:text-navy hover:bg-cream/50')}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red/60" />
                        {getLabel(child)}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  /* ===== DB MOBILE NAV ===== */
  const renderDbMobileNav = () => {
    if (!menuTree) return null;
    return menuTree.map((item, i) => {
      const hasChildren = item.children.length > 0;
      const isActive = isLinkActive(item.url);
      const isChildActive = hasChildren && item.children.some((c) => isLinkActive(c.url));
      const isProducts = item.url === '/products';

      if (!hasChildren && !isProducts) {
        return (
          <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}>
            <Link href={buildHref(item.url)} onClick={() => { setIsMobileOpen(false); if (item.url === '/' && isHomePage) window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn('text-3xl font-heading font-bold transition-colors', isActive ? 'text-red' : 'text-navy hover:text-red')}>
              {getLabel(item)}
            </Link>
          </motion.div>
        );
      }

      return (
        <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }} className="flex flex-col items-center">
          <button onClick={() => setMobileExpanded(mobileExpanded === item.id ? null : item.id)}
            className={cn('flex items-center gap-2 text-3xl font-heading font-bold transition-colors',
              isChildActive || isActive ? 'text-red' : 'text-navy hover:text-red')}>
            {getLabel(item)}
            <ChevronDown className={cn('w-6 h-6 transition-transform duration-200', mobileExpanded === item.id && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {mobileExpanded === item.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                className="overflow-hidden flex flex-col items-center gap-3 mt-3">

                {isProducts ? (
                  <>
                    <Link href={buildHref('/products')} onClick={() => setIsMobileOpen(false)}
                      className={cn('text-xl font-medium transition-colors',
                        isLinkActive('/products') && !isLinkActive('/recipes') ? 'text-red' : 'text-navy/60 hover:text-red')}>
                      {ourCollectionLabel}
                    </Link>
                    <Link href={buildHref('/recipes')} onClick={() => setIsMobileOpen(false)}
                      className={cn('text-xl font-medium transition-colors',
                        isLinkActive('/recipes') ? 'text-red' : 'text-navy/60 hover:text-red')}>
                      {recipesLabel}
                    </Link>
                  </>
                ) : (
                  item.children.map((child) => (
                    <Link key={child.id} href={buildHref(child.url)}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn('text-xl font-medium transition-colors',
                        isLinkActive(child.url) ? 'text-red' : 'text-navy/60 hover:text-red')}>
                      {getLabel(child)}
                    </Link>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    });
  };

  /* ===== FALLBACK DESKTOP NAV ===== */
  const isDropdownActiveFallback = (item: FallbackNavItemDropdown) =>
    item.children.some((c) => isLinkActive(c.href));

  const renderFallbackDesktopNav = () => {
    return fallbackNavItems.map((item) => {
      if (item.type === 'link') {
        if (item.key === 'home' && isHomePage) {
          return (
            <button key={item.key} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={cn('text-base font-medium tracking-wide uppercase line-reveal transition-colors',
                useLightText ? 'text-white font-bold border-b-2 border-white pb-0.5' : 'text-navy font-bold border-b-2 border-red pb-0.5')}>
              {t(item.key)}
            </button>
          );
        }
        return (
          <Link key={item.key} href={buildHref(item.href)}
            className={cn('text-base font-medium tracking-wide uppercase line-reveal transition-colors duration-300', linkColor(isLinkActive(item.href)))}>
            {t(item.key)}
          </Link>
        );
      }

      const isProducts = item.key === 'products';

      return (
        <div key={item.key} className="relative"
          onMouseEnter={() => handleMouseEnter(item.key)}
          onMouseLeave={handleMouseLeave}>
          <button onClick={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
            className={cn('flex items-center gap-1 text-base font-medium tracking-wide uppercase transition-colors duration-300',
              linkColor(isDropdownActiveFallback(item)))}>
            {t(item.key)}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', openDropdown === item.key && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {openDropdown === item.key && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-xl shadow-lg border border-navy/5 overflow-hidden min-w-[220px]">

                {isProducts ? (
                  renderProductsDropdownContent(() => setOpenDropdown(null))
                ) : (
                  <div className="py-2">
                    {item.children.map((child) => (
                      <Link key={child.key} href={buildHref(child.href)}
                        onClick={() => setOpenDropdown(null)}
                        className={cn('flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200',
                          isLinkActive(child.href) ? 'text-red bg-red/5' : 'text-navy/70 hover:text-navy hover:bg-cream/50')}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red/60" />
                        {t(child.key)}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  /* ===== FALLBACK MOBILE NAV ===== */
  const renderFallbackMobileNav = () => {
    return fallbackNavItems.map((item, i) => {
      if (item.type === 'link') {
        return (
          <motion.div key={item.key} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}>
            <Link href={buildHref(item.href)}
              onClick={() => { setIsMobileOpen(false); if (item.key === 'home' && isHomePage) window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn('text-3xl font-heading font-bold transition-colors', isLinkActive(item.href) ? 'text-red' : 'text-navy hover:text-red')}>
              {t(item.key)}
            </Link>
          </motion.div>
        );
      }

      const isProducts = item.key === 'products';

      return (
        <motion.div key={item.key} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }} className="flex flex-col items-center">
          <button onClick={() => setMobileExpanded(mobileExpanded === item.key ? null : item.key)}
            className={cn('flex items-center gap-2 text-3xl font-heading font-bold transition-colors',
              isDropdownActiveFallback(item) ? 'text-red' : 'text-navy hover:text-red')}>
            {t(item.key)}
            <ChevronDown className={cn('w-6 h-6 transition-transform duration-200', mobileExpanded === item.key && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {mobileExpanded === item.key && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                className="overflow-hidden flex flex-col items-center gap-3 mt-3">

                {isProducts ? (
                  <>
                    <Link href={buildHref('/products')} onClick={() => setIsMobileOpen(false)}
                      className={cn('text-xl font-medium transition-colors',
                        isLinkActive('/products') && !isLinkActive('/recipes') ? 'text-red' : 'text-navy/60 hover:text-red')}>
                      {ourCollectionLabel}
                    </Link>
                    <Link href={buildHref('/recipes')} onClick={() => setIsMobileOpen(false)}
                      className={cn('text-xl font-medium transition-colors',
                        isLinkActive('/recipes') ? 'text-red' : 'text-navy/60 hover:text-red')}>
                      {recipesLabel}
                    </Link>
                  </>
                ) : (
                  item.children.map((child) => (
                    <Link key={child.key} href={buildHref(child.href)}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn('text-xl font-medium transition-colors',
                        isLinkActive(child.href) ? 'text-red' : 'text-navy/60 hover:text-red')}>
                      {t(child.key)}
                    </Link>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    });
  };

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled ? 'glass-effect py-3 shadow-sm' : 'bg-transparent py-5'
        )}
        animate={{ y: isHidden ? -100 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-visible">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.08 }} className="relative z-10">
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <motion.div
                animate={{ y: [0, -3, 0], rotate: [0, 2, 0, -2, 0], scale: [1, 1.03, 1] }}
                transition={{
                  y: { duration: 3, ease: 'easeInOut', repeat: Infinity },
                  rotate: { duration: 5, ease: 'easeInOut', repeat: Infinity },
                  scale: { duration: 4, ease: 'easeInOut', repeat: Infinity },
                }}
                className="relative"
                style={{ marginTop: isScrolled ? '-8px' : '-16px' }}
              >
                <motion.div className="absolute inset-0 rounded-full"
                  animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                  style={{
                    background: useLightText
                      ? 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(26,82,118,0.25) 0%, transparent 70%)',
                  }}
                />
                <Image src={useLightText && !isHomePage ? "/images/logo-light.png" : "/images/logo.png"} alt="Mahkota Taiwan" width={80} height={80} priority
                  className={cn('relative w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 drop-shadow-lg',
                    false && 'brightness-0 invert')} />
              </motion.div>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {useDbMenus ? renderDbDesktopNav() : renderFallbackDesktopNav()}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher light={useLightText && !isHomePage} />
            <button className="md:hidden relative z-10 p-2" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
              {isMobileOpen ? <X className="w-6 h-6 text-navy" /> : <Menu className={cn('w-6 h-6 transition-colors duration-300', hamburgerColor)} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div className="fixed inset-0 z-40 bg-cream flex flex-col items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <nav className="flex flex-col items-center gap-6">
              {useDbMenus ? renderDbMobileNav() : renderFallbackMobileNav()}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
