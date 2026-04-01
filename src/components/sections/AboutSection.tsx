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
  const statsRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax-like effect on decorative background
      if (decorRef.current) {
        gsap.fromTo(decorRef.current,
          { xPercent: 10, skewX: -12 },
          {
            xPercent: -5,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            }
          }
        );
      }

      // All text lines reveal together — slow & dramatic
      if (textRef.current) {
        gsap.fromTo(textRef.current.children,
          { opacity: 0, y: 60, filter: 'blur(6px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 2.2,
            stagger: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: textRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // Scale-in for stat cards
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, scale: 0.8, y: 30 },
          {
            opacity: 1, scale: 1, y: 0,
            duration: 0.7,
            delay: i * 0.1,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      });

      // Counter animation with smooth ease
      counterRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = stats[i].value;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          onUpdate: () => {
            if (el) el.textContent = Math.round(obj.val).toString();
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-20 sm:py-24 bg-cream relative overflow-hidden">
      {/* Decorative with parallax */}
      <div ref={decorRef} className="absolute top-0 right-0 w-1/3 h-full bg-navy/[0.02] -skew-x-12 translate-x-1/4" />
      
      <div className="max-w-4xl mx-auto px-6">
        {/* Text Content - Centered */}
        <div ref={textRef} className="text-center">
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            {t('label')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-6 leading-tight">
            {t('title')}
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-6" />
          <p className="text-navy/70 leading-relaxed mb-4 text-base sm:text-lg max-w-2xl mx-auto">
            {t('description')}
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-0">
            {['highlight1', 'highlight2', 'highlight3'].map((key) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red shrink-0" />
                <p className="text-navy/60 text-base sm:text-lg">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div ref={statsRef} className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                ref={el => { cardRefs.current[i] = el; }}
                className="text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-red/20 group-hover:scale-110 transition-all duration-500">
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
