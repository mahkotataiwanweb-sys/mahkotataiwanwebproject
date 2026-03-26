'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import gsap from 'gsap';
import { ArrowLeft } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Detailed Taiwan SVG paths (viewBox 0 0 300 450)                   */
/*  Identical to WhereToBuySection for visual consistency              */
/* ------------------------------------------------------------------ */

const MAIN_ISLAND =
  'M168,28 C172,26 178,27 184,30 C192,34 198,36 206,42 ' +
  'C214,48 222,54 228,62 C234,70 238,80 240,90 ' +
  'C242,100 244,112 245,124 C246,136 246,150 245,164 ' +
  'C244,178 242,192 240,206 C238,218 236,230 233,242 ' +
  'C230,254 226,266 222,278 C218,290 214,300 210,310 ' +
  'C206,320 200,330 194,340 C188,350 182,358 176,366 ' +
  'C170,374 164,380 158,388 C152,396 148,402 144,408 ' +
  'C140,412 136,414 132,412 C128,410 124,406 120,400 ' +
  'C116,394 112,386 108,376 C104,366 102,356 100,344 ' +
  'C98,332 96,320 94,306 C92,292 90,278 88,264 ' +
  'C86,250 84,236 82,222 C80,208 78,194 78,180 ' +
  'C78,166 80,152 82,140 C84,128 86,118 90,108 ' +
  'C94,98 98,90 104,82 C110,74 116,68 122,62 ' +
  'C128,56 134,50 140,44 C146,38 152,34 158,30 ' +
  'C162,28 165,27 168,28 Z';

const BOUNDARIES = [
  'M108,82 C118,78 130,80 142,84 C154,88 166,86 178,82 C190,78 200,80 210,86',
  'M90,108 C100,118 112,122 124,120 C136,118 148,114 156,108',
  'M82,180 C96,176 112,178 128,182 C144,186 160,184 176,180 C192,176 210,180 230,186',
  'M86,250 C100,244 116,246 132,250 C148,254 164,252 180,248 C196,244 212,248 224,256',
  'M94,306 C108,300 124,302 140,308 C156,312 170,310 184,306 C198,302 210,306 218,314',
  'M158,84 C162,110 164,140 166,170 C168,200 168,230 166,260 C164,290 160,320 154,350 C150,370 146,390 142,408',
  'M178,82 C186,90 196,100 206,108 C214,114 220,120 224,130',
  'M232,186 C236,210 238,240 236,270 C234,300 228,320 220,340',
];

const PENGHU_ISLANDS = [
  'M52,248 C56,244 62,244 66,248 C70,252 70,258 66,262 C62,266 56,266 52,262 C48,258 48,252 52,248 Z',
  'M60,232 C63,229 68,229 71,232 C74,235 74,240 71,243 C68,246 63,246 60,243 C57,240 57,235 60,232 Z',
  'M44,258 C46,256 50,256 52,258 C54,260 54,264 52,266 C50,268 46,268 44,266 C42,264 42,260 44,258 Z',
];

const NORTH_ISLANDS = [
  'M196,18 C199,16 203,16 206,18 C209,20 209,24 206,26 C203,28 199,28 196,26 C193,24 193,20 196,18 Z',
  'M214,12 C216,10 219,10 221,12 C223,14 223,17 221,19 C219,21 216,21 214,19 C212,17 212,14 214,12 Z',
];

/* ================================================================== */

export default function WhereToBuyPage() {
  const locale = useLocale();
  const mapRef = useRef<SVGSVGElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* hero text entrance */
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      });

      /* map entrance */
      gsap.from(mapRef.current, {
        opacity: 0,
        scale: 0.92,
        y: 40,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.3,
      });

      /* content below map */
      if (contentRef.current) {
        gsap.from(contentRef.current, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.9,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-cream">
      {/* ===================== Hero Banner ===================== */}
      <section className="relative bg-gradient-to-br from-[#0b2545] via-[#13385e] to-[#1a5276] text-white overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div
          ref={heroRef}
          className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-28 text-center"
        >
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          <p className="text-sm font-semibold tracking-widest uppercase text-white/60 mb-3">
            Find Us
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Where to Buy
          </h1>
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-red-600" />
        </div>
      </section>

      {/* ===================== Map Section ===================== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 flex flex-col items-center">
          <svg
            ref={mapRef}
            viewBox="0 0 300 450"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_20px_60px_rgba(26,82,118,0.35)] hover:scale-[1.01] cursor-default"
            role="img"
            aria-label="Detailed map of Taiwan"
          >
            <defs>
              <linearGradient
                id="taiwanGradPage"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1a5276" />
                <stop offset="100%" stopColor="#2980b9" />
              </linearGradient>
              <linearGradient
                id="taiwanGradPageHover"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1e6091" />
                <stop offset="100%" stopColor="#3498db" />
              </linearGradient>
              <filter id="mapShadowPage" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#1a5276" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Main island */}
            <path
              d={MAIN_ISLAND}
              fill="url(#taiwanGradPage)"
              stroke="#fff"
              strokeWidth="1"
              strokeOpacity="0.3"
              filter="url(#mapShadowPage)"
              className="transition-all duration-500"
            />

            {/* Penghu islands */}
            {PENGHU_ISLANDS.map((d, i) => (
              <path
                key={`penghu-${i}`}
                d={d}
                fill="url(#taiwanGradPage)"
                stroke="#fff"
                strokeWidth="0.6"
                strokeOpacity="0.3"
              />
            ))}

            {/* Northern islets */}
            {NORTH_ISLANDS.map((d, i) => (
              <path
                key={`north-${i}`}
                d={d}
                fill="url(#taiwanGradPage)"
                stroke="#fff"
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
            ))}

            {/* County boundaries */}
            {BOUNDARIES.map((d, i) => (
              <path
                key={`bnd-${i}`}
                d={d}
                fill="none"
                stroke="#fff"
                strokeWidth="0.8"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* ---- Note below map ---- */}
          <div
            ref={contentRef}
            className="mt-12 text-center"
          >
            <p className="text-navy/50 text-sm tracking-wide">
              Interactive features coming soon
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
