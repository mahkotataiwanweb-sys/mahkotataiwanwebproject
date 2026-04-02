'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
];

export default function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  const switchLocale = (code: string) => {
    router.replace(pathname, { locale: code as any });
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${light ? "text-white/90 hover:text-white hover:bg-white/10" : "text-navy/80 hover:text-navy hover:bg-navy/5"}`}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-navy/10 overflow-hidden"
          >
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLocale(l.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  locale === l.code
                    ? 'bg-navy text-white'
                    : 'text-navy hover:bg-cream'
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="font-medium">{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
