'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Facebook, Instagram, Music2, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NavMenuItem, FooterLink, CompanySettings, Category } from '@/types/database';

// Fallback nav items matching navbar structure
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
  href: string;
  children: FallbackNavLink[];
}
type FallbackNavItem = FallbackNavItemSimple | FallbackNavItemDropdown;

const fallbackNavItems: FallbackNavItem[] = [
  { type: 'link', key: 'home', href: '/' },
  {
    type: 'dropdown',
    key: 'products',
    href: '/products',
    children: [
      { key: 'allProducts', href: '/products' },
    ],
  },
  { type: 'link', key: 'recipes', href: '/recipes' },
  {
    type: 'dropdown',
    key: 'moments',
    href: '/moments',
    children: [
      { key: 'events', href: '/events' },
      { key: 'lifestyle', href: '/lifestyle' },
      { key: 'gallery', href: '/gallery' },
    ],
  },
  { type: 'link', key: 'about', href: '/about' },
  { type: 'link', key: 'contact', href: '/contact' },
  { type: 'link', key: 'whereToBuy', href: '/where-to-buy' },
];

// Fallback contact info
const fallbackSettings = {
  phone: '+886-2-26099118',
  email: 'mahkotataiwan@gmail.com',
  warehouse_address: 'No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City',
  office_address: 'No. 83, Liyuan 2nd Street, Linkou District, New Taipei City',
  tiktok_url: 'https://www.tiktok.com/@mahkotataiwan',
  facebook_url: 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr',
  instagram_url: 'https://www.instagram.com/mahkotatw',
};

// Google Maps links
const OFFICE_MAPS_URL = 'https://www.google.com/maps/search/No.+83,+Liyuan+2nd+Street,+Linkou+District,+New+Taipei+City';
const WAREHOUSE_MAPS_URL = 'https://www.google.com/maps/search/No.+53,+Lane+216,+Nanshi+4th+Street,+Linkou+District,+New+Taipei+City';

export default function Footer() {
  const t = useTranslations('footer');
  const navT = useTranslations('nav');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [dbMenuItems, setDbMenuItems] = useState<NavMenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch company_settings, navbar_menus, and categories from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, menusRes, catsRes] = await Promise.all([
          supabase.from('company_settings').select('*').single(),
          supabase.from('navbar_menus').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        ]);
        if (settingsRes.data) {
          setSettings(settingsRes.data as CompanySettings);
        }
        if (menusRes.data && menusRes.data.length > 0) {
          setDbMenuItems(menusRes.data as NavMenuItem[]);
        }
        if (catsRes.data) {
          setCategories(catsRes.data as Category[]);
        }
      } catch {
        // Keep fallbacks
      } finally {
        setDataLoaded(true);
      }
    }
    fetchData();
  }, []);

  // Build tree structure from flat DB items (same as navbar)
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

  // Locale-aware label helper for nav items
  const getNavLabel = (item: NavMenuItem) => {
    if (locale === 'zh-TW') return item.label_zh || item.label_en;
    if (locale === 'id') return item.label_id || item.label_en;
    return item.label_en;
  };

  // Category label helper
  const getCategoryLabel = (cat: Category) => {
    if (locale === 'zh-TW') return cat.name_zh || cat.name_en;
    if (locale === 'id') return cat.name_id || cat.name_en;
    return cat.name_en;
  };

  const buildHref = (href: string) => {
    if (href === '/') return `/${locale}`;
    if (href.startsWith('/')) return `/${locale}${href}`;
    if (href.startsWith('http')) return href;
    return `/${locale}/${href}`;
  };

  // Get contact values from settings or fallback
  const phone = settings?.phone || fallbackSettings.phone;
  const email = settings?.email || fallbackSettings.email;
  const warehouseAddress = settings?.warehouse_address || fallbackSettings.warehouse_address;
  const officeAddress = settings?.office_address || fallbackSettings.office_address;
  const tiktokUrl = settings?.tiktok_url || fallbackSettings.tiktok_url;
  const facebookUrl = settings?.facebook_url || fallbackSettings.facebook_url;
  const instagramUrl = settings?.instagram_url || fallbackSettings.instagram_url;

  const useDbMenus = menuTree && menuTree.length > 0;

  // Render DB-based menu for footer (matching navbar structure)
  const renderDbFooterMenu = () => {
    if (!menuTree) return null;
    return (
      <ul className="space-y-2">
        {menuTree.map((item) => {
          const hasChildren = item.children.length > 0;
          const isProductsDropdown = item.url === '/products';
          return (
            <li key={item.id}>
              <Link
                href={buildHref(item.url)}
                className="text-cream/60 hover:text-white text-sm transition-colors duration-300 line-reveal inline-block"
              >
                {getNavLabel(item)}
              </Link>
              {hasChildren && (
                <ul className="ml-4 mt-1.5 space-y-1.5 border-l border-cream/10 pl-3">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={buildHref(child.url)}
                        className="text-cream/40 hover:text-white text-xs transition-colors duration-300 inline-block"
                      >
                        {getNavLabel(child)}
                      </Link>
                    </li>
                  ))}
                  {/* Category items for Products dropdown */}
                  {isProductsDropdown && categories.length > 0 && categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={buildHref(`/products?category=${cat.slug}`)}
                        className="text-cream/40 hover:text-white text-xs transition-colors duration-300 inline-block"
                      >
                        {getCategoryLabel(cat)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Render fallback menu for footer (matching navbar structure)
  const renderFallbackFooterMenu = () => {
    return (
      <ul className="space-y-2">
        {fallbackNavItems.map((item) => {
          const hasChildren = item.type === 'dropdown';
          return (
            <li key={item.key}>
              <Link
                href={buildHref(item.href)}
                className="text-cream/60 hover:text-white text-sm transition-colors duration-300 line-reveal inline-block"
              >
                {navT(item.key)}
              </Link>
              {hasChildren && (
                <ul className="ml-4 mt-1.5 space-y-1.5 border-l border-cream/10 pl-3">
                  {(item as FallbackNavItemDropdown).children.map((child) => (
                    <li key={child.key}>
                      <Link
                        href={buildHref(child.href)}
                        className="text-cream/40 hover:text-white text-xs transition-colors duration-300 inline-block"
                      >
                        {navT(child.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Mobile menu for footer with expand/collapse
  const renderMobileMenu = () => {
    const items = useDbMenus ? menuTree! : null;
    
    if (items) {
      return (
        <ul className="space-y-2">
          {items.map((item) => {
            const hasChildren = item.children.length > 0;
            const isExpanded = mobileExpanded === item.id;
            const isProductsDropdown = item.url === '/products';
            return (
              <li key={item.id}>
                <div className="flex items-center gap-1">
                  <Link
                    href={buildHref(item.url)}
                    className="text-cream/60 hover:text-white text-sm transition-colors duration-300"
                  >
                    {getNavLabel(item)}
                  </Link>
                  {hasChildren && (
                    <button
                      onClick={() => setMobileExpanded(isExpanded ? null : item.id)}
                      className="p-1"
                    >
                      <ChevronDown className={`w-3 h-3 text-cream/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {hasChildren && (
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="ml-4 mt-1.5 space-y-1.5 border-l border-cream/10 pl-3">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={buildHref(child.url)}
                            className="text-cream/40 hover:text-white text-xs transition-colors duration-300"
                          >
                            {getNavLabel(child)}
                          </Link>
                        </li>
                      ))}
                      {isProductsDropdown && categories.length > 0 && categories.map((cat) => (
                        <li key={cat.id}>
                          <Link
                            href={buildHref(`/products?category=${cat.slug}`)}
                            className="text-cream/40 hover:text-white text-xs transition-colors duration-300"
                          >
                            {getCategoryLabel(cat)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    // Fallback mobile
    return (
      <ul className="space-y-2">
        {fallbackNavItems.map((item) => {
          const hasChildren = item.type === 'dropdown';
          const isExpanded = mobileExpanded === item.key;
          return (
            <li key={item.key}>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(item.href)}
                  className="text-cream/60 hover:text-white text-sm transition-colors duration-300"
                >
                  {navT(item.key)}
                </Link>
                {hasChildren && (
                  <button
                    onClick={() => setMobileExpanded(isExpanded ? null : item.key)}
                    className="p-1"
                  >
                    <ChevronDown className={`w-3 h-3 text-cream/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {hasChildren && (
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="ml-4 mt-1.5 space-y-1.5 border-l border-cream/10 pl-3">
                    {(item as FallbackNavItemDropdown).children.map((child) => (
                      <li key={child.key}>
                        <Link
                          href={buildHref(child.href)}
                          className="text-cream/40 hover:text-white text-xs transition-colors duration-300"
                        >
                          {navT(child.key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <footer className="bg-navy text-cream/90">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Side - Brand, Address & Contact */}
          <div className="lg:col-span-7">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-4">
              <Image src="/images/logo.png" alt="Mahkota Taiwan" width={40} height={40} className="brightness-0 invert" />
              <span className="font-heading text-xl font-bold text-white">Mahkota Taiwan</span>
            </div>
            <p className="text-cream/60 text-sm leading-relaxed mb-6 max-w-md">
              {t('description')}
            </p>

            {/* Address & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Office Address (first) */}
              <a
                href={OFFICE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-cream/60 hover:text-white transition-colors duration-300 group"
              >
                <MapPin className="w-4 h-4 text-red shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs text-cream/40 font-semibold uppercase tracking-wider mb-0.5">Office</p>
                  <p className="text-sm leading-snug">{officeAddress}</p>
                </div>
              </a>

              {/* Warehouse Address (second) */}
              <a
                href={WAREHOUSE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-cream/60 hover:text-white transition-colors duration-300 group"
              >
                <MapPin className="w-4 h-4 text-red shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs text-cream/40 font-semibold uppercase tracking-wider mb-0.5">Warehouse</p>
                  <p className="text-sm leading-snug">{warehouseAddress}</p>
                </div>
              </a>

              {/* Phone */}
              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="flex items-center gap-3 text-cream/60 hover:text-white transition-colors duration-300"
              >
                <Phone className="w-4 h-4 text-red shrink-0" />
                <span className="text-sm">{phone}</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 text-cream/60 hover:text-white transition-colors duration-300"
              >
                <Mail className="w-4 h-4 text-red shrink-0" />
                <span className="text-sm">{email}</span>
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3">
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-red hover:border-red transition-all duration-300">
                  <Music2 className="w-4 h-4" />
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-red hover:border-red transition-all duration-300">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-red hover:border-red transition-all duration-300">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Right Side - Navigation Menu (navbar style) */}
          <div className="lg:col-span-5">
            <h4 className="font-heading text-white font-semibold text-lg mb-4">
              {t('quickLinks')}
            </h4>
            {/* Desktop: show full menu, always expanded */}
            <div className="hidden md:block">
              {useDbMenus ? renderDbFooterMenu() : renderFallbackFooterMenu()}
            </div>
            {/* Mobile: collapsible children */}
            <div className="md:hidden">
              {renderMobileMenu()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-cream/40 text-xs">
            © {new Date().getFullYear()} Mahkota Taiwan. {t('copyright')}
          </p>
          <p className="text-cream/30 text-xs">
            Crafted with ❤️ for Indonesian community in Taiwan
          </p>
        </div>
      </div>
    </footer>
  );
}
