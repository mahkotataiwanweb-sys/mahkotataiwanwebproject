'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Pin locations on the Taiwan map (percentage-based positions)
const pinLocations = [
  { id: 1, x: 52, y: 18, label: 'Taipei' },
  { id: 2, x: 42, y: 38, label: 'Taichung' },
  { id: 3, x: 48, y: 58, label: 'Tainan' },
  { id: 4, x: 55, y: 72, label: 'Kaohsiung' },
];

export default function WhereToBuySection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // GSAP map + pin animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Map fade in
      if (mapContainerRef.current) {
        gsap.fromTo(
          mapContainerRef.current,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: mapContainerRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Pins pop up one by one with stagger
      pinRefs.current.forEach((pin, i) => {
        if (!pin) return;
        gsap.fromTo(
          pin,
          { opacity: 0, scale: 0, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            delay: 0.4 + i * 0.35,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: mapContainerRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );

        // Continuous gentle floating animation after pin appears
        gsap.to(pin, {
          y: -4,
          duration: 1.2 + i * 0.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.4 + i * 0.35 + 0.6,
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

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
            <Link
              href={`/${locale}/where-to-buy`}
              className="hover:text-red transition-colors duration-300 hover:underline underline-offset-4 decoration-red/50"
            >
              Where to Buy
            </Link>
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
          <p className="text-navy/60 max-w-lg mx-auto">
            Find Mahkota Taiwan products at these trusted retail partners across Taiwan.
          </p>
        </div>

        {/* Taiwan Map */}
        <div className="flex justify-center">
          <Link
            href={`/${locale}/where-to-buy`}
            className="group relative inline-block cursor-pointer"
          >
            <div
              ref={mapContainerRef}
              className="relative w-[280px] h-[400px] sm:w-[320px] sm:h-[460px] lg:w-[380px] lg:h-[540px] transition-transform duration-500 group-hover:scale-[1.03]"
            >
              {/* Taiwan SVG Map */}
              <svg
                viewBox="0 0 200 340"
                className="w-full h-full drop-shadow-lg"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Glow filter */}
                <defs>
                  <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#004A6E" />
                    <stop offset="50%" stopColor="#003048" />
                    <stop offset="100%" stopColor="#001E2E" />
                  </linearGradient>
                  <linearGradient id="mapStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5BA4C9" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#003048" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Taiwan main island shape */}
                <path
                  d="M 105 12 
                     C 112 10, 120 14, 125 20
                     C 132 28, 138 38, 140 48
                     C 143 55, 144 62, 145 70
                     C 147 82, 148 95, 146 108
                     C 145 118, 142 128, 139 138
                     C 136 148, 132 158, 128 168
                     C 124 178, 120 188, 116 198
                     C 112 208, 108 218, 104 228
                     C 100 238, 96 248, 93 258
                     C 90 268, 88 275, 85 282
                     C 82 290, 78 298, 73 305
                     C 68 312, 62 318, 56 322
                     C 50 326, 44 328, 40 326
                     C 36 324, 35 318, 36 312
                     C 38 305, 42 298, 44 290
                     C 46 282, 48 274, 50 266
                     C 52 256, 53 246, 54 236
                     C 55 226, 55 216, 54 206
                     C 53 196, 51 186, 50 176
                     C 49 166, 48 156, 48 146
                     C 48 136, 49 126, 52 116
                     C 54 108, 58 100, 62 92
                     C 66 84, 70 76, 75 68
                     C 80 60, 85 52, 90 44
                     C 94 36, 98 28, 100 20
                     C 102 16, 103 13, 105 12 Z"
                  fill="url(#mapGradient)"
                  stroke="url(#mapStroke)"
                  strokeWidth="1.5"
                  filter="url(#mapGlow)"
                  className="transition-all duration-500 group-hover:brightness-110"
                />

                {/* Inner detail lines for depth effect */}
                <path
                  d="M 108 30 C 120 40, 135 65, 142 90 C 146 108, 145 130, 138 155"
                  fill="none"
                  stroke="#5BA4C9"
                  strokeWidth="0.5"
                  strokeOpacity="0.2"
                />
                <path
                  d="M 52 140 C 52 170, 54 210, 60 250 C 65 270, 70 295, 55 318"
                  fill="none"
                  stroke="#5BA4C9"
                  strokeWidth="0.5"
                  strokeOpacity="0.15"
                />
              </svg>

              {/* Animated Pin Markers */}
              {pinLocations.map((pin, index) => (
                <div
                  key={pin.id}
                  ref={(el) => { pinRefs.current[index] = el; }}
                  className="absolute"
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  {/* Pin */}
                  <div className="relative flex flex-col items-center">
                    {/* Pulse ring */}
                    <div className="absolute top-[18px] sm:top-[22px] left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4">
                      <span className="absolute inset-0 rounded-full bg-red/30 animate-ping" />
                      <span className="absolute inset-0 rounded-full bg-red/20" />
                    </div>
                    {/* Pin icon */}
                    <svg
                      width="24"
                      height="32"
                      viewBox="0 0 24 32"
                      className="w-5 h-7 sm:w-6 sm:h-8 drop-shadow-md"
                    >
                      <path
                        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                        fill="#C12126"
                      />
                      <circle cx="12" cy="12" r="5" fill="white" fillOpacity="0.9" />
                    </svg>
                  </div>
                </div>
              ))}

              {/* Hover overlay text */}
              <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="bg-navy/80 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2 rounded-full shadow-lg">
                  View All Locations →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
