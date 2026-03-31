'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroBackground from '@/components/effects/HeroBackground';

gsap.registerPlugin(ScrollTrigger);

const MAIN_ISLAND = `M 185.1,48.2 L 170.7,38.5 L 160.8,38.9 L 154.9,38.5 L 148.8,36.1 L 143.2,31.6 L 140.5,28.0 L 139.6,27.2 L 139.2,26.9 L 138.1,26.3 L 136.4,25.6 L 134.5,25.0 L 133.8,25.1 L 129.5,26.0 L 128.9,26.2 L 125.8,27.9 L 125.4,28.3 L 122.5,31.9 L 121.8,32.8 L 118.9,38.8 L 118.6,39.3 L 118.8,40.0 L 119.1,40.5 L 124.8,44.4 L 124.6,45.0 L 121.8,43.2 L 120.8,42.7 L 119.4,42.4 L 118.8,42.6 L 118.2,42.9 L 117.3,43.6 L 117.0,44.1 L 116.2,44.9 L 113.9,46.6 L 111.1,47.8 L 107.6,49.3 L 102.2,50.6 L 99.4,51.8 L 86.9,61.1 L 86.4,61.5 L 82.1,66.8 L 81.4,67.8 L 78.3,76.4 L 77.7,77.6 L 75.4,83.7 L 74.4,88.5 L 73.0,100.2 L 72.3,100.3 L 71.9,100.7 L 62.2,112.9 L 57.5,119.3 L 57.3,119.8 L 55.5,127.6 L 54.9,130.3 L 54.6,132.4 L 54.2,134.2 L 52.9,136.3 L 50.0,141.0 L 48.7,143.3 L 48.1,144.4 L 47.2,146.6 L 46.1,149.4 L 43.8,158.1 L 43.6,158.8 L 41.8,168.1 L 41.7,170.2 L 37.8,175.9 L 37.3,177.0 L 33.0,188.7 L 29.5,200.5 L 27.5,207.3 L 27.1,208.5 L 24.1,215.9 L 22.3,217.4 L 20.3,221.8 L 20.1,222.4 L 14.7,240.9 L 14.4,242.2 L 14.5,242.9 L 15.8,248.1 L 17.8,254.2 L 18.0,254.8 L 18.6,256.5 L 19.8,259.5 L 22.5,267.1 L 22.6,267.8 L 23.8,275.2 L 23.6,275.7 L 23.2,276.1 L 22.1,276.7 L 20.5,280.5 L 19.8,283.0 L 18.8,287.7 L 17.3,296.1 L 17.3,296.7 L 17.4,297.4 L 17.8,297.9 L 18.3,298.2 L 18.8,298.4 L 20.4,298.4 L 21.0,298.6 L 21.6,298.9 L 21.8,299.4 L 23.1,302.8 L 23.1,303.5 L 22.7,303.9 L 22.0,304.7 L 19.9,305.0 L 18.8,305.6 L 18.5,306.1 L 18.3,307.4 L 18.7,308.6 L 19.0,309.2 L 19.3,309.6 L 20.4,310.1 L 25.4,311.8 L 28.2,310.3 L 32.5,317.8 L 33.8,322.9 L 34.8,325.8 L 39.5,336.2 L 40.4,337.6 L 43.5,341.4 L 46.8,346.3 L 47.0,347.0 L 47.0,347.8 L 46.0,349.9 L 46.4,351.2 L 47.1,352.2 L 48.2,353.4 L 49.4,354.6 L 49.9,354.8 L 50.4,355.1 L 53.3,356.1 L 55.6,358.7 L 56.9,360.6 L 58.1,362.6 L 58.6,363.7 L 58.5,364.2 L 57.7,363.8 L 55.5,362.0 L 55.2,361.4 L 54.6,360.6 L 54.9,361.4 L 55.6,362.5 L 58.3,364.5 L 60.0,365.6 L 60.5,366.0 L 64.2,367.7 L 64.8,368.0 L 65.2,368.1 L 66.0,368.0 L 68.5,367.1 L 69.3,367.9 L 70.1,368.7 L 72.0,370.0 L 75.7,371.8 L 76.4,372.0 L 77.2,371.9 L 79.1,372.4 L 85.0,376.1 L 87.5,377.6 L 87.9,378.0 L 92.5,383.1 L 93.9,384.8 L 95.2,386.7 L 102.0,396.8 L 102.4,397.9 L 105.0,404.1 L 105.3,405.3 L 105.6,411.2 L 109.0,423.3 L 109.2,423.9 L 110.1,424.6 L 110.7,424.8 L 111.3,425.0 L 112.0,424.9 L 123.0,423.0 L 126.9,409.9 L 127.0,409.3 L 126.1,402.6 L 123.0,387.3 L 121.4,382.6 L 121.0,380.7 L 120.5,377.8 L 120.5,377.0 L 120.7,374.9 L 125.2,351.3 L 126.1,347.3 L 129.6,338.9 L 130.8,336.1 L 135.0,329.2 L 137.8,327.2 L 139.0,326.7 L 139.9,326.1 L 140.7,325.2 L 143.4,321.5 L 150.4,304.1 L 156.9,280.9 L 162.4,251.6 L 163.1,242.8 L 163.1,241.2 L 163.0,240.3 L 163.9,232.7 L 163.8,207.2 L 165.9,183.3 L 165.8,173.5 L 165.3,167.6 L 164.4,166.8 L 163.5,165.3 L 163.3,164.8 L 163.1,162.5 L 163.3,161.8 L 166.8,149.5 L 168.1,146.9 L 173.7,136.2 L 174.4,135.4 L 176.2,133.9 L 174.5,131.6 L 174.2,131.1 L 174.1,130.3 L 174.3,121.0 L 174.5,119.5 L 175.7,116.7 L 176.3,115.7 L 177.5,114.6 L 178.9,113.4 L 179.7,112.6 L 179.9,105.9 L 179.3,102.4 L 178.3,99.2 L 177.3,97.7 L 175.6,97.0 L 174.8,96.2 L 174.4,95.7 L 173.9,94.6 L 170.0,82.5 L 169.6,81.2 L 169.6,77.2 L 169.5,71.9 L 169.6,70.5 L 169.7,69.8 L 170.4,68.0 L 174.3,59.9 L 174.6,59.4 L 177.3,55.7 L 180.4,53.2 L 182.6,51.8 L 183.5,51.4 L 184.8,50.3 L 185.3,49.9 L 185.6,49.4 L 185.5,48.6 L 185.1,48.2 z`;

const PENGHU_MAIN = 'M 10,245 Q 8,240 12,237 Q 16,234 20,237 Q 24,240 22,245 Q 20,250 16,252 Q 12,250 10,245 Z';
const PENGHU_SMALL_1 = 'M 6,252 Q 5,249 8,248 Q 11,249 12,252 Q 11,255 8,255 Q 6,254 6,252 Z';
const PENGHU_SMALL_2 = 'M 16,256 Q 15,254 17,253 Q 19,254 20,256 Q 19,258 17,258 Q 15,257 16,256 Z';
const PENGHU_SMALL_3 = 'M 22,242 Q 21,240 23,239 Q 25,240 26,242 Q 25,244 23,244 Q 21,243 22,242 Z';

const NORTH_ISLET_1 = 'M 158,13 Q 156,11 158,10 Q 160,9 162,11 Q 163,13 161,14 Q 159,15 158,13 Z';
const NORTH_ISLET_2 = 'M 168,16 Q 167,14 169,13 Q 171,14 172,16 Q 171,18 169,18 Q 167,17 168,16 Z';

const BOUNDARIES = [
  'M 75,85 Q 100,80 130,78 Q 150,80 165,85',
  'M 42,190 Q 70,182 100,185 Q 130,188 164,195',
  'M 22,270 Q 50,262 80,265 Q 110,268 155,278',
  'M 30,330 Q 55,322 80,325 Q 105,330 140,325',
  'M 130,78 Q 135,100 132,130 Q 128,160 125,190 Q 120,230 115,270 Q 110,310 108,350 Q 106,380 110,410',
];

export default function WhereToBuyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SVGSVGElement>(null);
  const locale = useLocale();

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;

    const ctx = gsap.context(() => {
      // Hero text entrance
      gsap.from('.hero-text', {
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Map entrance with scale and rotation
      gsap.from(mapRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 60,
        duration: 1.5,
        delay: 0.4,
        ease: 'power3.out',
      });

      // Subtle continuous glow pulse on the map
      gsap.to('.map-glow', {
        opacity: 0.6,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-cream">
      {/* Dark Navy Hero */}
      <section className="relative bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-32 pb-20 overflow-hidden">
        <HeroBackground />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Back link */}
          <div className="hero-text mb-8">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <span className="hero-text inline-block text-red/80 text-sm font-semibold tracking-widest uppercase mb-3">
            Find Us
          </span>
          <h1 className="hero-text text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-4">
            Where to Buy
          </h1>
          <p className="hero-text text-cream/60 text-lg max-w-2xl mx-auto">
            Discover Mahkota Taiwan products at retail locations across the island
          </p>
          <div className="hero-text w-20 h-1 bg-red mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
          <div className="relative">
            {/* Background glow */}
            <div className="map-glow absolute inset-0 bg-gradient-to-b from-blue-200/30 to-transparent rounded-full blur-3xl scale-110 opacity-40" />

            <svg
              ref={mapRef}
              viewBox="0 0 200 450"
              className="relative w-full max-w-3xl h-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="taiwanGradientPage" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a5276" />
                  <stop offset="100%" stopColor="#2980b9" />
                </linearGradient>
                <linearGradient id="taiwanShine" x1="0%" y1="0%" x2="50%" y2="50%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <filter id="mapShadowPage" x="-15%" y="-5%" width="130%" height="115%">
                  <feDropShadow dx="3" dy="6" stdDeviation="10" floodColor="#1a5276" floodOpacity="0.3" />
                </filter>
              </defs>

              <g filter="url(#mapShadowPage)">
                {/* Main island */}
                <path d={MAIN_ISLAND} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.5" />
                {/* Shine overlay */}
                <path d={MAIN_ISLAND} fill="url(#taiwanShine)" />

                {/* Penghu islands */}
                <path d={PENGHU_MAIN} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.3" />
                <path d={PENGHU_SMALL_1} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.3" />
                <path d={PENGHU_SMALL_2} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.3" />
                <path d={PENGHU_SMALL_3} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.3" />

                {/* Northern islets */}
                <path d={NORTH_ISLET_1} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.3" />
                <path d={NORTH_ISLET_2} fill="url(#taiwanGradientPage)" stroke="#154360" strokeWidth="0.3" />

                {/* County boundaries */}
                {BOUNDARIES.map((d, i) => (
                  <path
                    key={`boundary-${i}`}
                    d={d}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    strokeOpacity="0.2"
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Coming soon note */}
          <div className="mt-12 text-center">
            <p className="text-navy/40 text-sm italic">
              ✦ Interactive map features coming soon ✦
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
