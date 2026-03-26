'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Music2, Phone, MapPin } from 'lucide-react';

const footerSections = [
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
    ],
  },
  {
    titleKey: 'company',
    links: [
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' },
      { key: 'whereToBuy', href: '/where-to-buy' },
    ],
  },
];

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

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
              <a href="https://www.tiktok.com/@mahkotataiwan" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-red hover:border-red transition-all duration-300">
                <Music2 className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-red hover:border-red transition-all duration-300">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/mahkotatw" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-red hover:border-red transition-all duration-300">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.titleKey}>
              <h4 className="font-heading text-white font-semibold mb-4 text-lg">
                {t(`sections.${section.titleKey}`)}
              </h4>
              <ul className="space-y-3">
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
          ))}
        </div>

        {/* Contact Row */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <div className="flex flex-wrap gap-8 justify-center text-sm text-cream/60">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-red shrink-0" />
              <span>0226099118</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red shrink-0" />
              <span>No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red shrink-0" />
              <span>No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</span>
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
