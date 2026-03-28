'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronDown,
  Facebook,
  Instagram,
  Music2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NavMenuItem, CompanySettings } from '@/types/database';

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
      { key: 'recipes', href: '/recipes' },
    ],
  },
  {
    type: 'dropdown',
    key: 'journal',
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

export default function Footer() {
  const t = useTranslations('footer');
  const navT = useTranslations('nav');
  const locale = useLocale();

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [dbMenuItems, setDbMenuItems] = useState<NavMenuItem[]>([]);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, menusRes] = await Promise.all([
          supabase.from('company_settings').select('*').single(),
          supabase.from('navbar_menus').select('*').eq('is_active', true).order('sort_order'),
        ]);
        if (settingsRes.data) {
          setSettings(settingsRes.data as CompanySettings);
        }
        if (menusRes.data && menusRes.data.length > 0) {
          setDbMenuItems(menusRes.data as NavMenuItem[]);
        }
      } catch {
        // Keep fallback
      }
    }
    fetchData();
  }, []);

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

  const getLabel = (item: NavMenuItem) => {
    if (locale === 'zh-TW') return item.label_zh || item.label_en;
    if (locale === 'id') return item.label_id || item.label_en;
    return item.label_en;
  };

  const buildHref = (href: string) => {
    if (href === '/') return `/${locale}`;
    if (href.startsWith('/')) return `/${locale}${href}`;
    if (href.startsWith('http')) return href;
    return `/${locale}/${href}`;
  };

  const useDbMenus = menuTree && menuTree.length > 0;

  const officeAddress = settings?.office_address || 'No. 83, Liyuan 2nd Street, Linkou District, New Taipei City';
  const warehouseAddress = settings?.warehouse_address || 'No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City';
  const phone = settings?.phone || '+886-2-26099118';
  const email = settings?.email || 'mahkotataiwan@gmail.com';
  const facebookUrl = settings?.facebook_url || 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr';
  const instagramUrl = settings?.instagram_url || 'https://www.instagram.com/mahkotatw';
  const tiktokUrl = settings?.tiktok_url || 'https://www.tiktok.com/@mahkotataiwan';

  const toggleMenu = (key: string) => {
    setExpandedMenu(expandedMenu === key ? null : key);
  };

  const renderNavItems = () => {
    if (useDbMenus && menuTree) {
      return menuTree.map((item) => {
        const hasChildren = item.children.length > 0;
        const menuKey = item.id;
        const isExpanded = expandedMenu === menuKey;

        if (!hasChildren) {
          return (
            <div key={item.id} className="text-center">
              <Link
                href={buildHref(item.url)}
                className="text-cream/70 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {getLabel(item)}
              </Link>
            </div>
          );
        }

        return (
          <div key={item.id} className="text-center">
            <div className="inline-flex items-center gap-1 justify-center">
              <button
                onClick={() => toggleMenu(menuKey)}
                className="text-cream/70 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {getLabel(item)}
              </button>
              <button
                onClick={() => toggleMenu(menuKey)}
                className="p-0.5 text-cream/40 hover:text-cream/70 transition-colors"
                aria-label="Toggle submenu"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100 mt-1.5' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={buildHref(child.url)}
                    className="block text-cream/50 hover:text-white text-xs transition-colors duration-200"
                  >
                    {getLabel(child)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      });
    }

    // Fallback nav items
    return fallbackNavItems.map((item) => {
      if (item.type === 'link') {
        return (
          <div key={item.key} className="text-center">
            <Link
              href={buildHref(item.href)}
              className="text-cream/70 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {navT(item.key)}
            </Link>
          </div>
        );
      }

      const menuKey = item.key;
      const isExpanded = expandedMenu === menuKey;

      return (
        <div key={item.key} className="text-center">
          <div className="inline-flex items-center gap-1 justify-center">
            <button
              onClick={() => toggleMenu(menuKey)}
              className="text-cream/70 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {navT(item.key)}
            </button>
            <button
              onClick={() => toggleMenu(menuKey)}
              className="p-0.5 text-cream/40 hover:text-cream/70 transition-colors"
              aria-label="Toggle submenu"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100 mt-1.5' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.key}
                  href={buildHref(child.href)}
                  className="block text-cream/50 hover:text-white text-xs transition-colors duration-200"
                >
                  {navT(child.key)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <footer className="bg-navy text-cream/90">
      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Logo + Brand - Centered */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/logo.png"
              alt="Mahkota Taiwan"
              width={48}
              height={48}
              className="w-12 h-12 brightness-0 invert"
            />
            <h3 className="text-xl font-heading font-bold text-white">
              Mahkota Taiwan
            </h3>
          </div>

          {/* Description - Centered */}
          <p className="text-cream/60 text-sm leading-relaxed max-w-md text-center">
            {t('description')}
          </p>
        </div>

        {/* Nav links grid - Centered */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-2 max-w-3xl mx-auto mb-8">
          {renderNavItems()}
        </div>

        {/* Contact info - Centered compact row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
          {/* Office */}
          <a
            href="https://www.google.com/maps/search/No.+83,+Liyuan+2nd+Street,+Linkou+District,+New+Taipei+City"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 group max-w-xs text-center md:text-left"
          >
            <MapPin className="w-3.5 h-3.5 text-red mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-cream/80 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">
                {t('office')}
              </span>
              <span className="text-cream/55 text-xs leading-snug group-hover:text-cream/80 transition-colors">
                {officeAddress}
              </span>
            </div>
          </a>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-cream/15" />

          {/* Warehouse */}
          <a
            href="https://www.google.com/maps/search/No.+53,+Lane+216,+Nanshi+4th+Street,+Linkou+District,+New+Taipei+City"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 group max-w-xs text-center md:text-left"
          >
            <MapPin className="w-3.5 h-3.5 text-red mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-cream/80 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">
                {t('warehouse')}
              </span>
              <span className="text-cream/55 text-xs leading-snug group-hover:text-cream/80 transition-colors">
                {warehouseAddress}
              </span>
            </div>
          </a>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-cream/15" />

          {/* Phone + Email stacked */}
          <div className="flex flex-col gap-1.5 items-center md:items-start">
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 text-cream/60 hover:text-white text-xs transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 text-cream/60 hover:text-white text-xs transition-colors"
            >
              <Mail className="w-3 h-3" />
              <span>{email}</span>
            </a>
          </div>
        </div>

        {/* Social Icons - Centered */}
        <div className="flex justify-center gap-3 mb-6">
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center text-cream/70 hover:bg-red hover:text-white transition-all duration-200"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center text-cream/70 hover:bg-red hover:text-white transition-all duration-200"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href={tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center text-cream/70 hover:bg-red hover:text-white transition-all duration-200"
            aria-label="TikTok"
          >
            <Music2 className="w-4 h-4" />
          </a>
          <a
            href="https://line.me/ti/p/@mahkotataiwan"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center text-cream/70 hover:bg-red hover:text-white transition-all duration-200"
            aria-label="LINE"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.631-.63.631h-2.386c-.345 0-.627-.282-.627-.631V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.627-.631.627-.346 0-.626-.283-.626-.627V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.627-.631.627-.345 0-.627-.283-.627-.627V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.627H4.917c-.345 0-.63-.282-.63-.627V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .349-.281.631-.629.631M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col items-center gap-1.5">
          <p className="text-cream/40 text-xs text-center">
            &copy; {new Date().getFullYear()} Mahkota Taiwan. {t('allRightsReserved')}
          </p>
          <p className="text-cream/30 text-xs text-center">
            {t('tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
}
