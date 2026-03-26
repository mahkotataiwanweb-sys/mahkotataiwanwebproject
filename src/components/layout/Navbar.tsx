'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { NavMenuItem } from '@/types/database';

// Fallback hardcoded nav items (displayed while DB loads or on error)
interface FallbackNavLink {
  key: string;
  href: string;
}

interface FallbackNavItemSimple {
  type: 'link';
  key: string;
  href: string;
}

interface FallbackNavItemDropdown {
  type: 'dropdown';
  key: string;
  children: FallbackNavLink[];
}

type FallbackNavItem = FallbackNavItemSimple | FallbackNavItemDropdown;

const fallbackNavItems: FallbackNavItem[] = [
  { type: 'link', key: 'home', href: '/' },
  {
    type: 'dropdown',
    key: 'products',
    children: [
      { key: 'allProducts', href: '/products' },
      { key: 'recipes', href: '/recipes' },
    ],
  },
  {
    type: 'dropdown',
    key: 'moments',
    children: [
      { key: 'events', href: '/events' },
      { key: 'lifestyle', href: '/lifestyle' },
    ],
  },
  { type: 'link', key: 'about', href: '/about' },
  { type: 'link', key: 'contact', href: '/contact' },
];

// Pages that have dark navy hero headers
const darkHeaderPages = ['/products', '/lifestyle', '/events', '/about'];

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  // Dynamic menu items from database
  const [dbMenuItems, setDbMenuItems] = useState<NavMenuItem[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

  // Check if current page has a dark header background
  const isDarkHeaderPage = darkHeaderPages.some(
    (p) => pathname === `/${locale}${p}` || pathname.startsWith(`/${locale}${p}/`)
  );

  // Use light (white) text when on dark header pages and NOT scrolled yet
  const useLightText = isDarkHeaderPage && !isScrolled;

  // Fetch navbar_menus from Supabase
  useEffect(() => {
    async function fetchMenus() {
      try {
        const { data, error } = await supabase
          .from('navbar_menus')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        if (!error && data && data.length > 0) {
          setDbMenuItems(data as NavMenuItem[]);
        }
      } catch {
        // Keep fallback
      } finally {
        setMenuLoaded(true);
      }
    }
    fetchMenus();
  }, []);

  // Build tree structure from flat DB items
  const menuTree = useMemo(() => {
    if (dbMenuItems.length === 0) return null;

    const topLevel = dbMenuItems.filter((item) => item.parent_id === null);
    const childrenMap = new Map<string, NavMenuItem[]>();

    dbMenuItems.forEach((item) => {
      if (item.parent_id) {
        const existing = childrenMap.get(item.parent_id) || [];
        existing.push(item);
        childrenMap.set(item.parent_id, existing);
      }
    });

    return topLevel.map((parent) => ({
      ...parent,
      children: childrenMap.get(parent.id) || [],
    }));
  }, [dbMenuItems]);

  // Locale-aware label helper
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
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const buildHref = (href: string) => {
    if (href === '/') return `/${locale}`;
    // If URL already starts with /, prepend locale
    if (href.startsWith('/')) return `/${locale}${href}`;
    // If it's an absolute URL, return as-is
    if (href.startsWith('http')) return href;
    return `/${locale}/${href}`;
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return isHomePage;
    const fullPath = href.startsWith('/') ? `/${locale}${href}` : `/${locale}/${href}`;
    return pathname.startsWith(fullPath);
  };

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  // Dynamic color classes based on page and scroll state
  const linkColor = (active: boolean) => {
    if (active) {
      if (useLightText) return 'text-white font-bold border-b-2 border-white pb-0.5';
      return 'text-navy font-bold border-b-2 border-red pb-0.5';
    }
    if (useLightText) return 'text-white/90 hover:text-white';
    return 'text-navy/80 hover:text-navy';
  };

  const logoTextColor = useLightText ? 'text-white' : 'text-navy';
  const hamburgerColor = useLightText ? 'text-white' : 'text-navy';

  // Decide whether to use DB menus or fallback
  const useDbMenus = menuTree && menuTree.length > 0;

  // ===== RENDER FUNCTIONS FOR DB MENUS =====
  const renderDbDesktopNav = () => {
    if (!menuTree) return null;
    return menuTree.map((item) => {
      const hasChildren = item.children.length > 0;
      const isHome = item.url === '/';
      const isActive = isLinkActive(item.url);
      const isChildActive = hasChildren && item.children.some((c) => isLinkActive(c.url));

      if (!hasChildren) {
        // Home special behavior on homepage
        if (isHome && isHomePage) {
          return (
            <button
              key={item.id}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm font-medium tracking-wide uppercase line-reveal transition-colors text-navy font-bold border-b-2 border-red pb-0.5"
            >
              {getLabel(item)}
            </button>
          );
        }

        return (
          <Link
            key={item.id}
            href={buildHref(item.url)}
            className={cn(
              'text-sm font-medium tracking-wide uppercase line-reveal transition-colors duration-300',
              linkColor(isActive)
            )}
          >
            {getLabel(item)}
          </Link>
        );
      }

      // Dropdown
      return (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.id)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={cn(
              'flex items-center gap-1 text-sm font-medium tracking-wide uppercase transition-colors duration-300',
              linkColor(isChildActive || isActive)
            )}
          >
            {getLabel(item)}
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                openDropdown === item.id && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {openDropdown === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[180px] bg-white rounded-xl shadow-lg border border-navy/5 overflow-hidden"
              >
                <div className="py-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={buildHref(child.url)}
                      className={cn(
                        'block px-5 py-2.5 text-sm font-medium transition-colors',
                        isLinkActive(child.url)
                          ? 'text-red bg-red/5'
                          : 'text-navy/70 hover:text-navy hover:bg-cream/50'
                      )}
                    >
                      {getLabel(child)}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  const renderDbMobileNav = () => {
    if (!menuTree) return null;
    return menuTree.map((item, i) => {
      const hasChildren = item.children.length > 0;
      const isActive = isLinkActive(item.url);
      const isChildActive = hasChildren && item.children.some((c) => isLinkActive(c.url));

      if (!hasChildren) {
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <Link
              href={buildHref(item.url)}
              onClick={() => {
                setIsMobileOpen(false);
                if (item.url === '/' && isHomePage) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={cn(
                'text-3xl font-heading font-bold transition-colors',
                isActive ? 'text-red' : 'text-navy hover:text-red'
              )}
            >
              {getLabel(item)}
            </Link>
          </motion.div>
        );
      }

      // Mobile dropdown
      return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <button
            onClick={() =>
              setMobileExpanded(mobileExpanded === item.id ? null : item.id)
            }
            className={cn(
              'flex items-center gap-2 text-3xl font-heading font-bold transition-colors',
              isChildActive || isActive ? 'text-red' : 'text-navy hover:text-red'
            )}
          >
            {getLabel(item)}
            <ChevronDown
              className={cn(
                'w-6 h-6 transition-transform duration-200',
                mobileExpanded === item.id && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {mobileExpanded === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden flex flex-col items-center gap-3 mt-3"
              >
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={buildHref(child.url)}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'text-xl font-medium transition-colors',
                      isLinkActive(child.url) ? 'text-red' : 'text-navy/60 hover:text-red'
                    )}
                  >
                    {getLabel(child)}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    });
  };

  // ===== RENDER FUNCTIONS FOR FALLBACK MENUS =====
  const isDropdownActiveFallback = (item: FallbackNavItemDropdown) =>
    item.children.some((c) => isLinkActive(c.href));

  const renderFallbackDesktopNav = () => {
    return fallbackNavItems.map((item) => {
      if (item.type === 'link') {
        // Home special behavior on homepage
        if (item.key === 'home' && isHomePage) {
          return (
            <button
              key={item.key}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm font-medium tracking-wide uppercase line-reveal transition-colors text-navy font-bold border-b-2 border-red pb-0.5"
            >
              {t(item.key)}
            </button>
          );
        }

        return (
          <Link
            key={item.key}
            href={buildHref(item.href)}
            className={cn(
              'text-sm font-medium tracking-wide uppercase line-reveal transition-colors duration-300',
              linkColor(isLinkActive(item.href))
            )}
          >
            {t(item.key)}
          </Link>
        );
      }

      // Dropdown
      return (
        <div
          key={item.key}
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.key)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={cn(
              'flex items-center gap-1 text-sm font-medium tracking-wide uppercase transition-colors duration-300',
              linkColor(isDropdownActiveFallback(item))
            )}
          >
            {t(item.key)}
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                openDropdown === item.key && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {openDropdown === item.key && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[180px] bg-white rounded-xl shadow-lg border border-navy/5 overflow-hidden"
              >
                <div className="py-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.key}
                      href={buildHref(child.href)}
                      className={cn(
                        'block px-5 py-2.5 text-sm font-medium transition-colors',
                        isLinkActive(child.href)
                          ? 'text-red bg-red/5'
                          : 'text-navy/70 hover:text-navy hover:bg-cream/50'
                      )}
                    >
                      {t(child.key)}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  const renderFallbackMobileNav = () => {
    return fallbackNavItems.map((item, i) => {
      if (item.type === 'link') {
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <Link
              href={buildHref(item.href)}
              onClick={() => {
                setIsMobileOpen(false);
                if (item.key === 'home' && isHomePage) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={cn(
                'text-3xl font-heading font-bold transition-colors',
                isLinkActive(item.href) ? 'text-red' : 'text-navy hover:text-red'
              )}
            >
              {t(item.key)}
            </Link>
          </motion.div>
        );
      }

      // Mobile dropdown
      return (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <button
            onClick={() =>
              setMobileExpanded(mobileExpanded === item.key ? null : item.key)
            }
            className={cn(
              'flex items-center gap-2 text-3xl font-heading font-bold transition-colors',
              isDropdownActiveFallback(item) ? 'text-red' : 'text-navy hover:text-red'
            )}
          >
            {t(item.key)}
            <ChevronDown
              className={cn(
                'w-6 h-6 transition-transform duration-200',
                mobileExpanded === item.key && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {mobileExpanded === item.key && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden flex flex-col items-center gap-3 mt-3"
              >
                {item.children.map((child) => (
                  <Link
                    key={child.key}
                    href={buildHref(child.href)}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'text-xl font-medium transition-colors',
                      isLinkActive(child.href) ? 'text-red' : 'text-navy/60 hover:text-red'
                    )}
                  >
                    {t(child.key)}
                  </Link>
                ))}
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
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} className="relative z-10">
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Mahkota Taiwan"
                width={48}
                height={48}
                priority
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300',
                  useLightText && 'brightness-0 invert'
                )}
              />
              <span className={cn(
                'font-heading text-lg font-bold hidden sm:block transition-colors duration-300',
                logoTextColor
              )}>
                Mahkota Taiwan
              </span>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {useDbMenus ? renderDbDesktopNav() : renderFallbackDesktopNav()}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              className="md:hidden relative z-10 p-2"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen
                ? <X className="w-6 h-6 text-navy" />
                : <Menu className={cn('w-6 h-6 transition-colors duration-300', hamburgerColor)} />
              }
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-cream flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col items-center gap-6">
              {useDbMenus ? renderDbMobileNav() : renderFallbackMobileNav()}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
