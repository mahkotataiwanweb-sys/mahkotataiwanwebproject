'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Facebook, Instagram, Music2, Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-navy text-cream/90">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
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

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-lg">{t('quickLinks')}</h4>
            <ul className="space-y-3">
              {['home', 'about', 'products', 'contact'].map((link) => (
                <li key={link}>
                  <a href={`#${link === 'home' ? 'hero' : link}`}
                    className="text-cream/60 hover:text-white text-sm transition-colors line-reveal inline-block">
                    {t(`links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-lg">{t('contactUs')}</h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-cream/60">
                <Phone className="w-4 h-4 mt-0.5 text-red shrink-0" />
                <span>0226099118</span>
              </li>
              <li className="flex gap-3 text-sm text-cream/60">
                <MapPin className="w-4 h-4 mt-0.5 text-red shrink-0" />
                <span>No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City</span>
              </li>
              <li className="flex gap-3 text-sm text-cream/60">
                <MapPin className="w-4 h-4 mt-0.5 text-red shrink-0" />
                <span>No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</span>
              </li>
            </ul>
          </div>

          {/* Certifications */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-lg">{t('certifications')}</h4>
            <div className="flex gap-4">
              {['HALAL', 'ISO', 'SGS'].map((cert) => (
                <div key={cert}
                  className="w-16 h-16 rounded-lg bg-cream/10 flex items-center justify-center text-xs font-bold text-cream/80 border border-cream/10">
                  {cert}
                </div>
              ))}
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
