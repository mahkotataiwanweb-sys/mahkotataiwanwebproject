'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Detailed Taiwan SVG paths (viewBox 0 0 300 450)                   */
/* ------------------------------------------------------------------ */

// Main island — realistic "sweet potato" coastline
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

// Internal county / region boundaries
const BOUNDARIES = [
  // Northern region (Taipei basin) — horizontal split
  'M108,82 C118,78 130,80 142,84 C154,88 166,86 178,82 C190,78 200,80 210,86',
  // Northwest / Taoyuan-Hsinchu divide
  'M90,108 C100,118 112,122 124,120 C136,118 148,114 156,108',
  // Central horizontal — Taichung / Nantou divide
  'M82,180 C96,176 112,178 128,182 C144,186 160,184 176,180 C192,176 210,180 230,186',
  // Central-south divide (Chiayi / Yunlin)
  'M86,250 C100,244 116,246 132,250 C148,254 164,252 180,248 C196,244 212,248 224,256',
  // Southern divide — Tainan / Kaohsiung / Pingtung
  'M94,306 C108,300 124,302 140,308 C156,312 170,310 184,306 C198,302 210,306 218,314',
  // East–west spine (Central Mountain Range)
  'M158,84 C162,110 164,140 166,170 C168,200 168,230 166,260 C164,290 160,320 154,350 C150,370 146,390 142,408',
  // Yilan / northeast pocket
  'M178,82 C186,90 196,100 206,108 C214,114 220,120 224,130',
  // Hualien / Taitung east coast divide
  'M232,186 C236,210 238,240 236,270 C234,300 228,320 220,340',
];

// Penghu islands (west side)
const PENGHU_ISLANDS = [
  'M52,248 C56,244 62,244 66,248 C70,252 70,258 66,262 C62,266 56,266 52,262 C48,258 48,252 52,248 Z',
  'M60,232 C63,229 68,229 71,232 C74,235 74,240 71,243 C68,246 63,246 60,243 C57,240 57,235 60,232 Z',
  'M44,258 C46,256 50,256 52,258 C54,260 54,264 52,266 C50,268 46,268 44,266 C42,264 42,260 44,258 Z',
];

// Small northern islands (e.g. approximate Keelung Islet / Pengjia)
const NORTH_ISLANDS = [
  'M196,18 C199,16 203,16 206,18 C209,20 209,24 206,26 C203,28 199,28 196,26 C193,24 193,20 196,18 Z',
  'M214,12 C216,10 219,10 221,12 C223,14 223,17 221,19 C219,21 216,21 214,19 C212,17 212,14 214,12 Z',
];

/* ------------------------------------------------------------------ */
/*  Pin locations (percentages of the SVG viewBox)                     */
/* ------------------------------------------------------------------ */

const PIN_LOCATIONS = [
  { id: 'taipei',    label: 'Taipei',    cx: '62%', cy: '15%' },
  { id: 'taichung',  label: 'Taichung',  cx: '42%', cy: '40%' },
  { id: 'tainan',    label: 'Tainan',    cx: '38%', cy: '62%' },
  { id: 'kaohsiung', label: 'Kaohsiung', cx: '42%', cy: '72%' },
];

/* ================================================================== */

export default function WhereToBuySection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<SVGSVGElement>(null);
  const pinRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* --- map fade-in on scroll --- */
      gsap.from(mapRef.current, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      /* --- pins pop-up sequentially --- */
      pinRefs.current.forEach((pin, i) => {
        if (!pin) return;
        gsap.fromTo(
          pin,
          { scale: 0, opacity: 0, transformOrigin: '50% 100%' },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(2)',
            delay: 0.8 + i * 0.35,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          },
        );
      });

      /* --- continuous floating animation --- */
      pinRefs.current.forEach((pin, i) => {
        if (!pin) return;
        gsap.to(pin, {
          y: -4,
          duration: 1.4 + i * 0.15,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.8 + i * 0.35,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-cream py-24 sm:py-32 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ---------- header ---------- */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold tracking-widest uppercase text-navy/60">
            Find Us
          </span>
          <Link
            href={`/${locale}/where-to-buy`}
            className="block mt-2 group"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-navy group-hover:text-red-700 transition-colors duration-300">
              Where to Buy
            </h2>
          </Link>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-red-700" />
        </div>

        {/* ---------- map ---------- */}
        <Link
          href={`/${locale}/where-to-buy`}
          className="group relative block mx-auto max-w-md"
        >
          {/* hover overlay */}
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-navy/0 group-hover:bg-navy/30 transition-all duration-500 pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 text-white text-lg font-semibold tracking-wide drop-shadow-lg">
              View All Locations →
            </span>
          </div>

          <svg
            ref={mapRef}
            viewBox="0 0 300 450"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto drop-shadow-xl transition-transform duration-500 group-hover:scale-[1.02]"
            role="img"
            aria-label="Map of Taiwan showing store locations"
          >
            <defs>
              <linearGradient
                id="taiwanGradHome"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1a5276" />
                <stop offset="100%" stopColor="#2980b9" />
              </linearGradient>
              <filter id="mapShadowHome" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1a5276" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Main island */}
            <path
              d={MAIN_ISLAND}
              fill="url(#taiwanGradHome)"
              stroke="#fff"
              strokeWidth="1"
              strokeOpacity="0.3"
              filter="url(#mapShadowHome)"
            />

            {/* Penghu islands */}
            {PENGHU_ISLANDS.map((d, i) => (
              <path
                key={`penghu-${i}`}
                d={d}
                fill="url(#taiwanGradHome)"
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
                fill="url(#taiwanGradHome)"
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

            {/* ---- Location pins ---- */}
            {PIN_LOCATIONS.map((pin, i) => (
              <g
                key={pin.id}
                ref={(el) => { pinRefs.current[i] = el; }}
                style={{ opacity: 0 }}
              >
                {/* pulsing ring */}
                <circle
                  cx={pin.cx}
                  cy={pin.cy}
                  r="12"
                  fill="none"
                  stroke="#C12126"
                  strokeWidth="2"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values="10;18;10"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* pin body (marker shape) */}
                <g transform={`translate(${pin.cx === '62%' ? 186 : pin.cx === '42%' ? 126 : 114}, ${
                  pin.cy === '15%' ? 67.5 : pin.cy === '40%' ? 180 : pin.cy === '62%' ? 279 : 324
                })`}>
                  <path
                    d="M0,-14 C-4,-14 -8,-12 -10,-8 C-12,-4 -12,0 -10,4 C-8,8 -4,14 0,20 C4,14 8,8 10,4 C12,0 12,-4 10,-8 C8,-12 4,-14 0,-14 Z"
                    fill="#C12126"
                    stroke="#fff"
                    strokeWidth="1.2"
                  />
                  <circle cx="0" cy="-4" r="4.5" fill="#fff" />
                </g>

                {/* label */}
                <text
                  x={pin.cx === '62%' ? 186 : pin.cx === '42%' ? 126 : 114}
                  y={
                    pin.cy === '15%'
                      ? 67.5 + 30
                      : pin.cy === '40%'
                        ? 180 + 30
                        : pin.cy === '62%'
                          ? 279 + 30
                          : 324 + 30
                  }
                  textAnchor="middle"
                  className="text-[9px] font-semibold"
                  fill="#1a5276"
                  fontFamily="sans-serif"
                >
                  {pin.label}
                </text>
              </g>
            ))}
          </svg>
        </Link>
      </div>
    </section>
  );
}
