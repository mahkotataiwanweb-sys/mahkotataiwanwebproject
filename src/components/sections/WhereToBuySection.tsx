'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { StorePartner } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

export default function WhereToBuySection() {
  const [partners, setPartners] = useState<StorePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const { data, error } = await supabase
          .from('store_partners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          setPartners(data as StorePartner[]);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  // GSAP header animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // GSAP marquee animation for logos
  useEffect(() => {
    if (!marqueeRef.current || partners.length === 0) return;
    const el = marqueeRef.current;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        xPercent: -50,
        ease: 'none',
        duration: 20,
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, [partners]);

  // Don't render if no partners
  if (!loading && partners.length === 0) {
    return null;
  }

  const PartnerLogo = ({ partner }: { partner: StorePartner }) => {
    const content = (
      <div className="flex-shrink-0 mx-6 sm:mx-10 group">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white flex items-center justify-center p-4 premium-shadow hover-lift border border-navy/5">
          {partner.logo_url ? (
            <Image
              src={partner.logo_url}
              alt={partner.name}
              width={120}
              height={120}
              className="object-contain max-h-20 w-auto opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            />
          ) : (
            <div className="text-center">
              <ShoppingBag className="w-8 h-8 text-navy/20 mx-auto mb-1" />
              <p className="text-navy/40 text-xs font-medium">{partner.name}</p>
            </div>
          )}
        </div>
      </div>
    );

    if (partner.website_url) {
      return (
        <a
          href={partner.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }

    return content;
  };

  // Double the partners for seamless looping
  const displayPartners = [...partners, ...partners];

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-cream relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14">
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            Find Us
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3">
            Where to Buy
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
          <p className="text-navy/60 max-w-lg mx-auto">
            Find Mahkota Taiwan products at these trusted retail partners across Taiwan.
          </p>
        </div>
      </div>

      {/* Scrolling Logo Carousel (full-width) */}
      {loading ? (
        <div className="flex items-center justify-center gap-8 px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="flex-shrink-0 w-36 h-36 rounded-2xl bg-cream-dark animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cream to-transparent z-10" />

          <div ref={marqueeRef} className="flex whitespace-nowrap py-4">
            {displayPartners.map((partner, index) => (
              <PartnerLogo key={`${partner.id}-${index}`} partner={partner} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
