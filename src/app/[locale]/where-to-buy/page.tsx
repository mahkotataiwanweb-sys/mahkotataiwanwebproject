'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ShoppingBag, ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { StorePartner } from '@/types/database';

export default function WhereToBuyPage() {
  const locale = useLocale();
  const [partners, setPartners] = useState<StorePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);

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
              Find Us
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Where to Buy
            </h1>
            <div className="w-20 h-[3px] bg-white/50 mb-6" />
            <p className="text-cream/60 max-w-lg text-lg">
              Find Mahkota Taiwan products at these trusted retail partners across Taiwan.
            </p>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-cream-dark" />
              </div>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-navy/15 mx-auto mb-4" />
            <p className="text-navy/40 text-lg">No store partners available yet.</p>
            <p className="text-navy/30 text-sm mt-1">Check back later for retail locations!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.5 }}
              >
                {partner.website_url ? (
                  <a
                    href={partner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden hover-lift premium-shadow p-6 flex flex-col items-center text-center h-full">
                      <div className="w-24 h-24 rounded-xl bg-cream flex items-center justify-center mb-4">
                        {partner.logo_url ? (
                          <Image
                            src={partner.logo_url}
                            alt={partner.name}
                            width={80}
                            height={80}
                            className="object-contain max-h-16 w-auto opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                          />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-navy/20" />
                        )}
                      </div>
                      <h3 className="font-heading text-sm font-bold text-navy group-hover:text-red transition-colors duration-300 mb-2">
                        {partner.name}
                      </h3>
                      <div className="flex items-center gap-1 text-red text-xs font-semibold mt-auto">
                        Visit <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="bg-white rounded-2xl overflow-hidden premium-shadow p-6 flex flex-col items-center text-center h-full">
                    <div className="w-24 h-24 rounded-xl bg-cream flex items-center justify-center mb-4">
                      {partner.logo_url ? (
                        <Image
                          src={partner.logo_url}
                          alt={partner.name}
                          width={80}
                          height={80}
                          className="object-contain max-h-16 w-auto opacity-70"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-navy/20" />
                      )}
                    </div>
                    <h3 className="font-heading text-sm font-bold text-navy mb-2">
                      {partner.name}
                    </h3>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
