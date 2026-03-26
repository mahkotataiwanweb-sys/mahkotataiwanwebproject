'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Facebook, Instagram, Music2, Send } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const t = useTranslations('contact');
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (leftRef.current) {
        gsap.fromTo(leftRef.current.children,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: leftRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }
      if (rightRef.current) {
        gsap.fromTo(rightRef.current,
          { opacity: 0, x: 60 },
          { opacity: 1, x: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: rightRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to API
    alert('Thank you for your message!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
      <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Info */}
          <div ref={leftRef}>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4 leading-tight">
              {t('title')}
            </h2>
            <div className="w-16 h-[2px] bg-red mb-6" />
            <p className="text-navy/60 mb-10 leading-relaxed">
              {t('subtitle')}
            </p>

            {/* Info Cards */}
            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red" />
                </div>
                <div>
                  <h4 className="font-semibold text-navy text-sm mb-1">{t('warehouse')}</h4>
                  <p className="text-navy/60 text-sm">No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red" />
                </div>
                <div>
                  <h4 className="font-semibold text-navy text-sm mb-1">{t('office')}</h4>
                  <p className="text-navy/60 text-sm">No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-red" />
                </div>
                <div>
                  <h4 className="font-semibold text-navy text-sm mb-1">{t('phone')}</h4>
                  <p className="text-navy/60 text-sm">0226099118</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-navy font-semibold text-sm mb-3">{t('followUs')}</p>
              <div className="flex gap-3">
                <a href="https://www.tiktok.com/@mahkotataiwan" target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border-2 border-navy/15 flex items-center justify-center text-navy/60 hover:bg-red hover:text-white hover:border-red transition-all duration-300">
                  <Music2 className="w-4 h-4" />
                </a>
                <a href="https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border-2 border-navy/15 flex items-center justify-center text-navy/60 hover:bg-red hover:text-white hover:border-red transition-all duration-300">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://www.instagram.com/mahkotatw" target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border-2 border-navy/15 flex items-center justify-center text-navy/60 hover:bg-red hover:text-white hover:border-red transition-all duration-300">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div ref={rightRef}>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 sm:p-10 premium-shadow">
              <h3 className="font-heading text-2xl font-bold text-navy mb-6">{t('formTitle')}</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-2">{t('name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/10 bg-cream/50 text-navy placeholder-navy/30 focus:border-red focus:outline-none transition-colors duration-300"
                    placeholder={t('namePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-2">{t('email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/10 bg-cream/50 text-navy placeholder-navy/30 focus:border-red focus:outline-none transition-colors duration-300"
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-2">{t('message')}</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/10 bg-cream/50 text-navy placeholder-navy/30 focus:border-red focus:outline-none transition-colors duration-300 resize-none"
                    placeholder={t('messagePlaceholder')}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-red text-white rounded-xl font-semibold text-sm tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-red-dark transition-colors duration-300 premium-shadow"
                >
                  <Send className="w-4 h-4" />
                  {t('send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
