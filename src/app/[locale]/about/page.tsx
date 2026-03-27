'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Store, Package, Users, Shield, Heart, Sparkles, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

/* ─── Physics-based marquee constants ─── */
const PARTNER_MARQUEE_SPEED = 1.2;
const PARTNER_FRICTION = 0.95;
const PARTNER_RETURN_RATE = 0.05;

interface StorePartner {
  id: number;
  name: string;
  logo_url: string;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const stats = [
  { icon: Award, key: 'since', value: 2021, prefix: '', suffix: '', displayType: 'number' as const },
  { icon: Store, key: 'stores', value: 300, prefix: '', suffix: '+', displayType: 'number' as const },
  { icon: Package, key: 'products', value: 26, prefix: '', suffix: '', displayType: 'number' as const },
  { icon: Users, key: 'customers', value: 1, prefix: '', suffix: 'M+', displayType: 'million' as const },
];

const values = [
  {
    icon: Shield,
    title: 'Quality First',
    description: 'Every product is carefully selected and tested to meet the highest standards of quality before reaching our shelves.',
  },
  {
    icon: Heart,
    title: 'Cultural Bridge',
    description: 'We bridge the gap between Indonesian heritage and Taiwanese daily life, bringing authentic flavors to every home.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building a strong community of over 1 million customers who trust us to deliver the tastes of home.',
  },
];

const milestones = [
  { year: '2021', title: 'Founded', description: 'Mahkota Taiwan was established with a vision to bring authentic Indonesian products to Taiwan.' },
  { year: '2022', title: '100+ Stores', description: 'Expanded our network to over 100 retail partner stores across northern Taiwan.' },
  { year: '2023', title: '300+ Stores', description: 'Reached 300+ partner stores island-wide, becoming the leading Indonesian product distributor.' },
  { year: '2024', title: 'Expanded Product Lines', description: 'Introduced new product categories including beverages, snacks, and household essentials.' },
  { year: '2025', title: '1 Million+ Customers', description: 'Proudly serving over 1 million customers, a testament to our quality and community trust.' },
];

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale();
  const headerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  /* ─── Physics marquee refs ─── */
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(-PARTNER_MARQUEE_SPEED);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const rafRef = useRef<number>(0);
  const singleSetWidthRef = useRef(0);

  const [partners, setPartners] = useState<StorePartner[]>([]);

  // Fetch partner logos from Supabase
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from('store_partners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        if (!error && data) {
          setPartners(data);
        }
      } catch (e) {
        // silently fail — placeholder will show
      }
    };
    fetchPartners();
  }, []);

  /* ─── Physics-based marquee animation loop ─── */
  const startMarqueeLoop = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    // Measure one set width (1/3 of track since we triple the items)
    const totalWidth = track.scrollWidth;
    const oneSetWidth = totalWidth / 3;
    singleSetWidthRef.current = oneSetWidth;

    const loop = () => {
      if (!isDraggingRef.current) {
        // Blend velocity back toward default speed
        velocityRef.current += (-PARTNER_MARQUEE_SPEED - velocityRef.current) * PARTNER_RETURN_RATE;
        // Apply friction to any momentum beyond default
        const excess = velocityRef.current - (-PARTNER_MARQUEE_SPEED);
        velocityRef.current = -PARTNER_MARQUEE_SPEED + excess * PARTNER_FRICTION;
      }

      // Update offset
      offsetRef.current += velocityRef.current;

      // Wrap offset within one set width for seamless loop
      const setW = singleSetWidthRef.current;
      if (setW > 0) {
        if (offsetRef.current < -setW) {
          offsetRef.current += setW;
        } else if (offsetRef.current > 0) {
          offsetRef.current -= setW;
        }
      }

      // Apply transform
      if (track) {
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Start marquee when partners load
  useEffect(() => {
    if (partners.length === 0) return;
    // Small delay to let DOM render the tripled items
    const timer = setTimeout(() => {
      startMarqueeLoop();
    }, 100);
    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [partners, startMarqueeLoop]);

  /* ─── Marquee pointer handlers ─── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = Date.now();
    dragVelocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const now = Date.now();
    const dx = e.clientX - lastPointerXRef.current;
    const dt = now - lastMoveTimeRef.current;

    if (dt > 0) {
      dragVelocityRef.current = dx / Math.max(dt, 1) * 16; // normalise to ~frame time
    }

    offsetRef.current += dx;
    lastPointerXRef.current = e.clientX;
    lastMoveTimeRef.current = now;

    // Apply transform immediately for responsiveness
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    velocityRef.current = dragVelocityRef.current || -PARTNER_MARQUEE_SPEED;
  }, []);

  const onPointerCancel = useCallback(() => {
    isDraggingRef.current = false;
    velocityRef.current = -PARTNER_MARQUEE_SPEED;
  }, []);

  // GSAP header animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP text + counter + values + partners + story animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { opacity: 0, y: 40, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
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

      // Stats scale-in
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, scale: 0.8, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      counterRefs.current.forEach((el, i) => {
        if (!el) return;
        const stat = stats[i];
        const target = stat.value;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: stat.displayType === 'million' ? 1.5 : 2,
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

      // Values section
      if (valuesRef.current) {
        gsap.fromTo(
          valuesRef.current.querySelectorAll('.value-card'),
          { opacity: 0, y: 60, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: valuesRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Partners section fade-in
      if (partnersRef.current) {
        gsap.fromTo(
          partnersRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: partnersRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Story chapters scroll animation — refined, subtle
      if (storyRef.current) {
        gsap.fromTo(
          storyRef.current.querySelectorAll('.story-chapter'),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: storyRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  /* ─── Tripled partners list for seamless loop ─── */
  const tripledPartners = partners.length > 0
    ? [...partners, ...partners, ...partners]
    : [];

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-navy via-navy/90 to-red-dark pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-red/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red/5 blur-3xl" />
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
      <div className="max-w-5xl mx-auto px-6 py-16">
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
              <motion.div
                key={stat.key}
                className="text-center group"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-red/20 transition-colors duration-500">
                  <Icon className="w-6 h-6 text-red" />
                </div>
                <div className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-1">
                  {stat.prefix}
                  <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
                  {stat.suffix}
                </div>
                <p className="text-navy/50 text-sm font-medium">{t(`stats.${stat.key}`)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Our Values Section */}
      <div ref={valuesRef} className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">What We Stand For</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy mb-4">Our Values</h2>
            <div className="w-16 h-[3px] bg-red/40 mx-auto" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((val, i) => {
            const Icon = val.icon;
            return (
              <motion.div
                key={val.title}
                className="value-card relative bg-navy rounded-3xl p-8 text-center group cursor-default overflow-hidden"
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-red/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-red/30 transition-colors duration-500">
                    <Icon className="w-7 h-7 text-red" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">{val.title}</h3>
                  <div className="w-8 h-[2px] bg-red/50 mx-auto mb-4" />
                  <p className="text-cream/60 text-sm leading-relaxed">{val.description}</p>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Our Partners Section — Physics-Based Interactive Marquee
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white/50 py-20">
        <div ref={partnersRef} className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Collaboration</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy mb-4">Trusted Partners</h2>
            <div className="w-16 h-[3px] bg-red/40 mx-auto mb-4" />
            <p className="text-navy/60 text-base max-w-lg mx-auto">Working with Taiwan&apos;s leading retailers to bring you the best Indonesian products</p>
          </div>

          {partners.length > 0 ? (
            <div
              className="relative overflow-hidden"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              {/* Gradient fade overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/50 to-transparent z-10 pointer-events-none" />

              {/* Physics-driven track */}
              <div
                ref={trackRef}
                className="flex whitespace-nowrap select-none touch-none cursor-grab active:cursor-grabbing gap-6"
                style={{ willChange: 'transform' }}
              >
                {tripledPartners.map((partner, i) => (
                  partner.website_url && partner.website_url !== '#' ? (
                    <a
                      key={`${partner.id}-${i}`}
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center min-w-[180px] h-24 cursor-pointer group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-12 max-w-[120px] object-contain pointer-events-none group-hover:scale-110 transition-transform duration-300"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-navy/60 font-semibold text-sm pointer-events-none">{partner.name}</span>
                      )}
                    </a>
                  ) : (
                    <div
                      key={`${partner.id}-${i}`}
                      className="flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-center justify-center min-w-[180px] h-24"
                    >
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-12 max-w-[120px] object-contain pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-navy/60 font-semibold text-sm pointer-events-none">{partner.name}</span>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center h-24"
                >
                  <div className="flex items-center gap-2 text-navy/30">
                    <Store className="w-5 h-5" />
                    <span className="text-sm font-medium">Partner Store</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Our Story Section — Clean Editorial Timeline
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-cream relative">
        <div ref={storyRef} className="max-w-5xl mx-auto px-6">
          {/* Simple header */}
          <div className="text-center mb-16 md:mb-20">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Our Story</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy">The Journey So Far</h2>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[20px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-navy/10" />

            <div className="space-y-12 md:space-y-16">
              {milestones.map((milestone, i) => (
                <div
                  key={milestone.year}
                  className="story-chapter relative"
                >
                  {/* Dot marker */}
                  <div className="absolute left-[20px] md:left-1/2 -translate-x-1/2 top-1 w-2.5 h-2.5 rounded-full bg-red border-2 border-cream z-10" />

                  <div className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-0`}>
                    {/* Year side */}
                    <div className={`md:w-1/2 pl-12 md:pl-0 ${i % 2 === 0 ? 'md:text-right md:pr-14' : 'md:order-2 md:pl-14'}`}>
                      <span className="inline-block text-xs font-bold text-red tracking-widest uppercase bg-red/5 px-3 py-1 rounded-full">
                        {milestone.year}
                      </span>
                    </div>

                    {/* Content side */}
                    <div className={`md:w-1/2 pl-12 md:pl-0 ${i % 2 === 0 ? 'md:pl-14' : 'md:order-1 md:text-right md:pr-14'}`}>
                      <div className="bg-white rounded-2xl border border-navy/[0.06] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <h3 className="font-heading text-lg font-bold text-navy mb-2">{milestone.title}</h3>
                        <p className="text-navy/55 text-sm leading-relaxed">{milestone.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-navy via-navy/95 to-red-dark py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-red/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-white/5 blur-3xl" />
        </div>
        <motion.div
          className="max-w-3xl mx-auto px-6 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Sparkles className="w-8 h-8 text-red/60 mx-auto mb-4" />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Want to Learn More?
          </h2>
          <p className="text-cream/60 mb-8 max-w-md mx-auto">
            Discover our products or get in touch with our team today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red/90 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Browse Products
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
