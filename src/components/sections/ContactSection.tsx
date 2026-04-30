'use client';

import { useEffect, useRef } from 'react';
import { useEditableT } from '@/hooks/useEditableT';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Facebook, Instagram, Music2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const socials = [
  { icon: Music2, href: 'https://www.tiktok.com/@mahkotataiwan', label: 'TikTok' },
  { icon: Facebook, href: 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/mahkotatw', label: 'Instagram' },
];

export default function ContactSection() {
  const t = useEditableT('contact');
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header "Get in Touch" — all lines reveal together, slow & dramatic
      const header = contentRef.current?.querySelector('.text-center.mb-12');
      if (header) {
        gsap.fromTo(header.children,
          { opacity: 0, y: 60 },
          {
            opacity: 1, y: 0,
            duration: 2.2,
            stagger: 0,
            ease: 'power2.out',
            scrollTrigger: { trigger: header, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // Info cards & socials — staggered entrance after header
      const remaining = contentRef.current ? Array.from(contentRef.current.children).slice(1) : [];
      if (remaining.length) {
        gsap.fromTo(remaining,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: contentRef.current, start: 'top 75%', toggleActions: 'play none none reverse' }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="py-20 sm:py-24 bg-white relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <div className="max-w-4xl mx-auto px-6" ref={contentRef}>
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            {t('label')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4 leading-tight">
            {t('title')}
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
          <p className="text-navy/60 leading-relaxed max-w-lg mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Info Cards - horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-cream rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('warehouse')}</h4>
            <p className="text-navy/60 text-sm">No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City</p>
          </div>
          <div className="bg-cream rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('office')}</h4>
            <p className="text-navy/60 text-sm">No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</p>
          </div>
          <div className="bg-cream rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('phone')}</h4>
            <p className="text-navy/60 text-sm">0226099118</p>
          </div>
        </div>

        {/* Social Links - centered */}
        <div className="text-center">
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
    </section>
  );
}
