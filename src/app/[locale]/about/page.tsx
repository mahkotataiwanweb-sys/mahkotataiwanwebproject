'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, Award, Store, Package, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Award, key: 'since', value: 2021, prefix: '', suffix: '' },
  { icon: Store, key: 'stores', value: 300, prefix: '', suffix: '+' },
  { icon: Package, key: 'products', value: 26, prefix: '', suffix: '' },
  { icon: Users, key: 'customers', value: 1000, prefix: '', suffix: '+' },
];

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale();
  const headerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

  // GSAP text + counter animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: textRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      counterRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = stats[i].value;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          onUpdate: () => {
            if (el) el.textContent = Math.round(obj.val).toString();
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-navy via-navy/90 to-red-dark pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-red/10 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-cream/60 hover:text-cream text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-red/80 text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <div className="w-20 h-[3px] bg-white/50 mb-6" />
            <p className="text-cream/60 max-w-lg text-lg">
              {t('mission')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Description */}
        <div ref={textRef} className="text-center">
          <p className="text-navy/70 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto mb-8">
            {t('description')}
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-0">
            {['highlight1', 'highlight2', 'highlight3'].map((key) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red shrink-0" />
                <p className="text-navy/60 text-sm">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div ref={statsRef} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-red/20 transition-colors duration-500">
                  <Icon className="w-6 h-6 text-red" />
                </div>
                <div className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-1">
                  {stat.prefix}
                  <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
                  {stat.suffix}
                </div>
                <p className="text-navy/50 text-sm font-medium">{t(`stats.${stat.key}`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
