'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Award, Store, Package, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Award, key: 'since', value: 2021, prefix: '', suffix: '' },
  { icon: Store, key: 'stores', value: 300, prefix: '', suffix: '+' },
  { icon: Package, key: 'products', value: 26, prefix: '', suffix: '' },
  { icon: Users, key: 'customers', value: 1000, prefix: '', suffix: '+' },
];

export default function AboutSection() {
  const t = useTranslations('about');
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image reveal
      if (imageRef.current) {
        gsap.fromTo(imageRef.current, 
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1.2,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: imageRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // Text stagger
      if (textRef.current) {
        gsap.fromTo(textRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: textRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // Counter animation
      counterRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = stats[i].value;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          onUpdate: () => {
            if (el) el.textContent = Math.round(obj.val).toString();
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-navy/[0.02] -skew-x-12 translate-x-1/4" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <div ref={imageRef} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-navy/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-red/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-red" />
                </div>
                <p className="text-navy/40 text-sm font-medium">Company Image</p>
              </div>
            </div>
            {/* Decorative frame */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-red/20 rounded-2xl -z-10" />
          </div>

          {/* Text Side */}
          <div ref={textRef}>
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-6 leading-tight">
              {t('title')}
            </h2>
            <div className="w-16 h-[2px] bg-red mb-6" />
            <p className="text-navy/70 leading-relaxed mb-6 text-base sm:text-lg">
              {t('description')}
            </p>
            <div className="space-y-3 mb-8">
              {['highlight1', 'highlight2', 'highlight3'].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red shrink-0" />
                  <p className="text-navy/60 text-sm">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div ref={statsRef} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-red/20 transition-colors duration-500">
                  <Icon className="w-6 h-6 text-red" />
                </div>
                <div className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-1">
                  {stat.prefix}
                  <span ref={el => { counterRefs.current[i] = el; }}>0</span>
                  {stat.suffix}
                </div>
                <p className="text-navy/50 text-sm font-medium">{t(`stats.${stat.key}`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
