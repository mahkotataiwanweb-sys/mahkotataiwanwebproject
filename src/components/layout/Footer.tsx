'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Facebook, Instagram, Music2, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { FooterLink, CompanySettings } from '@/types/database';

// Fallback sections when DB is loading or unavailable
const fallbackFooterSections = [
  {
    titleKey: 'products',
    links: [
      { key: 'allProducts', href: '/products' },
      { key: 'recipes', href: '/recipes' },
    ],
  },
  {
    titleKey: 'moments',
    links: [
      { key: 'events', href: '/events' },
      { key: 'lifestyle', href: '/lifestyle' },
      { key: 'gallery', href: '/gallery' },
    ],
  },
  {
    titleKey: 'company',
    links: [
      { key: 'home', href: '/' },
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' },
      { key: 'whereToBuy', href: '/where-to-buy' },
    ],
  },
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

// Section display order and titles
const sectionOrder = ['products', 'moments', 'company'];

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch footer_links and company_settings from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        const [linksRes, settingsRes] = await Promise.all([
          supabase.from('footer_links').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('company_settings').select('*').single(),
        ]);
        if (linksRes.data && linksRes.data.length > 0) {
          setFooterLinks(linksRes.data as FooterLink[]);
        }
        if (settingsRes.data) {
          setSettings(settingsRes.data as CompanySettings);
        }
      } catch {
        // Keep fallbacks
      } finally {
        setDataLoaded(true);
      }
    }
    fetchData();
  }, []);

  // Group footer links by section
  const groupedLinks = useMemo(() => {
    if (footerLinks.length === 0) return null;
    const groups: Record<string, FooterLink[]> = {};
    footerLinks.forEach((link) => {
      if (!groups[link.section]) groups[link.section] = [];
      groups[link.section].push(link);
    });
    return groups;
  }, [footerLinks]);

  // Locale-aware label helper for footer links
  const getLabel = (item: FooterLink) => {
    if (locale === 'zh-TW') return item.label_zh || item.label_en;
    if (locale === 'id') return item.label_id || item.label_en;
    return item.label_en;
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get contact values from settings or fallback
  const phone = settings?.phone || fallbackSettings.phone;
  const email = settings?.email || fallbackSettings.email;
  const warehouseAddress = settings?.warehouse_address || fallbackSettings.warehouse_address;
  const officeAddress = settings?.office_address || fallbackSettings.office_address;
  const tiktokUrl = settings?.tiktok_url || fallbackSettings.tiktok_url;
  const facebookUrl = settings?.facebook_url || fallbackSettings.facebook_url;
  const instagramUrl = settings?.instagram_url || fallbackSettings.instagram_url;

  // Decide whether to use DB links or fallback
  const useDbLinks = groupedLinks && Object.keys(groupedLinks).length > 0;

  return (
    <footer className="bg-navy text-cream/90">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/images/logo.png" alt="Mahkota Taiwan" width={40} height={40} className="brightness-0 invert" />
              <span className="font-heading text-xl font-bold text-white">Mahkota Taiwan</span>
            </div>
            <p className="text-cream/60 text-sm leading-relaxed mb-6">
              {t('description')}
            </p>
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

          {/* Link Sections - Dynamic from DB or Fallback */}
          {useDbLinks
            ? sectionOrder
                .filter((sectionKey) => groupedLinks[sectionKey])
                .map((sectionKey) => {
                  const links = groupedLinks[sectionKey]!;
                  const isOpen = openSections[sectionKey] ?? false;
                  return (
                    <div key={sectionKey}>
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="w-full flex items-center justify-between md:cursor-default md:pointer-events-none mb-4 group"
                      >
                        <h4 className="font-heading text-white font-semibold text-lg">
                          {t(`sections.${sectionKey}`)}
                        </h4>
                        <ChevronDown
                          className={`w-5 h-5 text-cream/40 md:hidden transition-transform duration-300 ease-in-out ${
                            isOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out md:max-h-[500px] md:opacity-100 ${
                          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <ul className="space-y-3 pb-2">
                          {links.map((link) => (
                            <li key={link.id}>
                              <Link
                                href={link.url.startsWith('http') ? link.url : `/${locale}${link.url}`}
                                className="text-cream/60 hover:text-white text-sm transition-colors line-reveal inline-block"
                              >
                                {getLabel(link)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })
            : fallbackFooterSections.map((section) => {
                const isOpen = openSections[section.titleKey] ?? false;
                return (
                  <div key={section.titleKey}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.titleKey)}
                      className="w-full flex items-center justify-between md:cursor-default md:pointer-events-none mb-4 group"
                    >
                      <h4 className="font-heading text-white font-semibold text-lg">
                        {t(`sections.${section.titleKey}`)}
                      </h4>
                      <ChevronDown
                        className={`w-5 h-5 text-cream/40 md:hidden transition-transform duration-300 ease-in-out ${
                          isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out md:max-h-[500px] md:opacity-100 ${
                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="space-y-3 pb-2">
                        {section.links.map((link) => (
                          <li key={link.key}>
                            <Link
                              href={`/${locale}${link.href}`}
                              className="text-cream/60 hover:text-white text-sm transition-colors line-reveal inline-block"
                            >
                              {t(`links.${link.key}`)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Contact Row */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <div className="flex flex-wrap gap-8 justify-center text-sm text-cream/60">
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="flex items-center gap-2 hover:text-white transition-colors duration-300"
            >
              <Phone className="w-4 h-4 text-red shrink-0" />
              <span>{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 hover:text-white transition-colors duration-300"
            >
              <Mail className="w-4 h-4 text-red shrink-0" />
              <span>{email}</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red shrink-0" />
              <span>{warehouseAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red shrink-0" />
              <span>{officeAddress}</span>
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
