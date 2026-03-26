'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from '@/lib/utils';

interface NavLink {
  key: string;
  href: string;
}

interface NavItemSimple {
  type: 'link';
  key: string;
  href: string;
}

interface NavItemDropdown {
  type: 'dropdown';
  key: string;
  children: NavLink[];
}

type NavItem = NavItemSimple | NavItemDropdown;

const navItems: NavItem[] = [
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

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

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
    return `/${locale}${href}`;
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return isHomePage;
    return pathname.startsWith(`/${locale}${href}`);
  };

  const isDropdownActive = (item: NavItemDropdown) =>
    item.children.some((c) => isLinkActive(c.href));

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
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
              <Image src="/images/logo.png" alt="Mahkota Taiwan" width={44} height={44} priority />
              <span className="font-heading text-lg font-bold text-navy hidden sm:block">
                Mahkota Taiwan
              </span>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              if (item.type === 'link') {
                // Home special behavior on homepage
                if (item.key === 'home' && isHomePage) {
                  return (
                    <button
                      key={item.key}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-sm font-medium tracking-wide uppercase line-reveal transition-colors text-red"
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
                      'text-sm font-medium tracking-wide uppercase line-reveal transition-colors',
                      isLinkActive(item.href) ? 'text-red' : 'text-navy/80 hover:text-navy'
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
                      'flex items-center gap-1 text-sm font-medium tracking-wide uppercase transition-colors',
                      isDropdownActive(item) ? 'text-red' : 'text-navy/80 hover:text-navy'
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
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              className="md:hidden relative z-10 p-2"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-6 h-6 text-navy" /> : <Menu className="w-6 h-6 text-navy" />}
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
              {navItems.map((item, i) => {
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
                        isDropdownActive(item) ? 'text-red' : 'text-navy hover:text-red'
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
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
