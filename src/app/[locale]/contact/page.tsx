'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, MapPin, Phone, Mail, Facebook, Instagram, Music2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const socials = [
  { icon: Music2, href: 'https://www.tiktok.com/@mahkotataiwan', label: 'TikTok' },
  { icon: Facebook, href: 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/mahkotatw', label: 'Instagram' },
];

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const headerRef = useRef<HTMLDivElement>(null);
  const infoCardsRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  // GSAP header animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP staggered info cards animation
  useEffect(() => {
    if (!infoCardsRef.current) return;
    const cards = infoCardsRef.current.children;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: infoCardsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP social section animation
  useEffect(() => {
    if (!socialRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        socialRef.current!.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: socialRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-red-dark via-red to-navy pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-navy/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-white/70 text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <div className="w-20 h-[3px] bg-white/50 mb-6" />
            <p className="text-white/60 max-w-lg text-lg">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Info Cards - 4 cards grid */}
        <div ref={infoCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Warehouse Address */}
          <div className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('warehouse')}</h4>
            <p className="text-navy/60 text-sm">No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City</p>
          </div>

          {/* Office Address */}
          <div className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('office')}</h4>
            <p className="text-navy/60 text-sm">No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</p>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('phone')}</h4>
            <a
              href="tel:+886226099118"
              className="text-navy/60 text-sm hover:text-red transition-colors duration-300"
            >
              +886-2-26099118
            </a>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('info.email')}</h4>
            <a
              href="mailto:mahkotataiwan@gmail.com"
              className="text-navy/60 text-sm hover:text-red transition-colors duration-300 break-all"
            >
              mahkotataiwan@gmail.com
            </a>
          </div>
        </div>

        {/* Social Links */}
        <div ref={socialRef} className="text-center">
          <p className="text-navy font-semibold text-sm mb-4">{t('followUs')}</p>
          <div className="flex justify-center gap-4">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-12 h-12 rounded-full border-2 border-navy/15 flex items-center justify-center text-navy/60 hover:bg-red hover:text-white hover:border-red transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
