'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChefHat, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import HeroSlider from '@/components/sections/HeroSlider';
import MarqueeSection from '@/components/sections/MarqueeSection';
import WhereToBuySection from '@/components/sections/WhereToBuySection';

gsap.registerPlugin(ScrollTrigger);

const discoverCards = [
  {
    key: 'recipes',
    href: '/recipes',
    icon: ChefHat,
    title: 'Recipes',
    description: 'Get inspired and cook delicious meals with our products. Easy recipes for everyone!',
    gradient: 'from-red-dark to-red',
  },
  {
    key: 'activity',
    href: '/lifestyle',
    icon: Sparkles,
    title: 'Activity',
    description: 'See how our community enjoys Mahkota Taiwan products in their everyday life.',
    gradient: 'from-navy to-navy/80',
  },
  {
    key: 'event',
    href: '/events',
    icon: Calendar,
    title: 'Event',
    description: 'Stay updated with our latest events, promotions, and community gatherings.',
    gradient: 'from-red to-navy',
  },
];

export default function HomePage() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 50, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            stagger: 0.12,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Card animations with scale-in
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 60, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <HeroSlider />
      <MarqueeSection />

      {/* Discover Section */}
      <section ref={sectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-14">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              Discover
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">
              Explore Mahkota Taiwan
            </h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/60 max-w-lg mx-auto">
              Dive into our world of Indonesian flavors — from recipes and lifestyle stories to exciting community events.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {discoverCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  ref={el => { cardRefs.current[index] = el; }}
                >
                  <Link href={`/${locale}${card.href}`} className="group block h-full">
                    <div className="bg-white rounded-2xl overflow-hidden hover-lift premium-shadow h-full flex flex-col transition-shadow duration-500 hover:shadow-2xl">
                      {/* Icon Area */}
                      <div className={`bg-gradient-to-br ${card.gradient} p-8 flex items-center justify-center`}>
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-heading text-xl font-bold text-navy mb-2 group-hover:text-red transition-colors duration-300">
                          {card.title}
                        </h3>
                        <p className="text-navy/50 text-sm leading-relaxed flex-1">
                          {card.description}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-red text-sm font-semibold uppercase tracking-wide group-hover:gap-3 transition-all duration-300">
                          Explore <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <WhereToBuySection />
    </>
  );
}
