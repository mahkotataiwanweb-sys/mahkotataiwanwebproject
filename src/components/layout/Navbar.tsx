'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from '@/lib/utils';

interface NavItem {
  key: string;
  type: 'page' | 'anchor';
  href: string;
}

const navItems: NavItem[] = [
  { key: 'home', type: 'page', href: '/' },
  { key: 'products', type: 'page', href: '/products' },
  { key: 'recipes', type: 'page', href: '/recipes' },
  { key: 'events', type: 'page', href: '/events' },
  { key: 'contact', type: 'anchor', href: '#contact' },
];

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleNavClick = (item: NavItem) => {
    setIsMobileOpen(false);

    if (item.type === 'anchor') {
      if (isHomePage) {
        // Same page: scroll to section
        const el = document.querySelector(item.href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Navigate to home then scroll
        window.location.href = `/${locale}/${item.href}`;
      }
      return;
    }

    if (item.key === 'home') {
      if (isHomePage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // else Link handles navigation
    }
  };

  const getHref = (item: NavItem) => {
    if (item.type === 'anchor') {
      return isHomePage ? item.href : `/${locale}/${item.href}`;
    }
    if (item.key === 'home') return `/${locale}`;
    return `/${locale}${item.href}`;
  };

  const isActive = (item: NavItem) => {
    if (item.key === 'home') return isHomePage;
    return pathname.includes(item.href);
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
              if (item.type === 'anchor') {
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      'text-sm font-medium tracking-wide uppercase line-reveal transition-colors',
                      isActive(item) ? 'text-red' : 'text-navy/80 hover:text-navy'
                    )}
                  >
                    {t(item.key)}
                  </button>
                );
              }

              if (item.key === 'home' && isHomePage) {
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      'text-sm font-medium tracking-wide uppercase line-reveal transition-colors',
                      'text-red'
                    )}
                  >
                    {t(item.key)}
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={getHref(item)}
                  className={cn(
                    'text-sm font-medium tracking-wide uppercase line-reveal transition-colors',
                    isActive(item) ? 'text-red' : 'text-navy/80 hover:text-navy'
                  )}
                >
                  {t(item.key)}
                </Link>
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
            <nav className="flex flex-col items-center gap-8">
              {navItems.map((item, i) => {
                if (item.type === 'anchor') {
                  return (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        'text-3xl font-heading font-bold transition-colors',
                        isActive(item) ? 'text-red' : 'text-navy hover:text-red'
                      )}
                    >
                      {t(item.key)}
                    </motion.button>
                  );
                }

                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={getHref(item)}
                      onClick={() => {
                        setIsMobileOpen(false);
                        if (item.key === 'home' && isHomePage) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={cn(
                        'text-3xl font-heading font-bold transition-colors',
                        isActive(item) ? 'text-red' : 'text-navy hover:text-red'
                      )}
                    >
                      {t(item.key)}
                    </Link>
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
