'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, Phone, Navigation, X, ChevronDown, Locate } from 'lucide-react';
import gsap from 'gsap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StoreLocation } from '@/types/database';

/* ─── Inject global CSS ─── */
const STYLE_ID = 'store-map-pin-styles';
function injectPinStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* ── Clean map: vivid blue ocean + full-opacity tiles ── */
    .illustrated-map.leaflet-container {
      background: #1565C0 !important;
    }
    /* Force ocean pane above tiles — absolute safeguard */
    .leaflet-oceanPane-pane {
      z-index: 350 !important;
      pointer-events: none !important;
    }

    /* Smooth premium bounce for store pins */
    @keyframes pinBounce {
      0%, 100% { transform: translateY(0); }
      40% { transform: translateY(-8px); }
      60% { transform: translateY(-3px); }
    }
    @keyframes pinBounceCity {
      0%, 100% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-10px) scale(1.05); }
      60% { transform: translateY(-4px) scale(1.02); }
    }
    @keyframes cityPulseRing {
      0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.5; }
      100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0; }
    }
    @keyframes cityPulseRing2 {
      0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.35; }
      100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
    }
    .store-pin > div {
      animation: pinBounce 2.8s cubic-bezier(0.36, 0, 0.66, 1) infinite;
    }
    .city-pin > div {
      animation: pinBounceCity 3s cubic-bezier(0.36, 0, 0.66, 1) infinite;
    }
    .store-pin:nth-child(2n) > div { animation-delay: 0.3s; }
    .store-pin:nth-child(3n) > div { animation-delay: 0.6s; }
    .store-pin:nth-child(4n) > div { animation-delay: 0.9s; }
    .store-pin:nth-child(5n) > div { animation-delay: 1.2s; }
    .city-pin:nth-child(2n) > div { animation-delay: 0.4s; }
    .city-pin:nth-child(3n) > div { animation-delay: 0.8s; }
    .city-pin:nth-child(4n) > div { animation-delay: 1.2s; }
    .city-pin:nth-child(5n) > div { animation-delay: 1.6s; }
    .city-pin:hover > div { animation-play-state: paused; transform: translateY(-8px) scale(1.08); }
    .store-pin:hover > div { animation-play-state: paused; transform: translateY(-4px); }

    /* ── Decorative animations ── */
    @keyframes floatBird {
      0% { transform: translateX(-60px) translateY(0px); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(calc(100% + 60px)) translateY(-30px); opacity: 0; }
    }
    @keyframes floatBird2 {
      0% { transform: translateX(calc(100% + 60px)) translateY(0px) scaleX(-1); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(-60px) translateY(-20px) scaleX(-1); opacity: 0; }
    }
    @keyframes floatCloud {
      0% { transform: translateX(-100px); }
      100% { transform: translateX(calc(100% + 100px)); }
    }
    @keyframes waveMove {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes fishSwim {
      0% { transform: translateX(-40px) scaleX(1); opacity: 0; }
      10% { opacity: 0.6; }
      45% { transform: translateX(calc(50%)) scaleX(1); opacity: 0.6; }
      50% { transform: translateX(calc(50%)) scaleX(-1); opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { transform: translateX(-40px) scaleX(-1); opacity: 0; }
    }
    @keyframes bobFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    @keyframes shimmerSlide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }

    /* ── Leaflet UI overrides ── */
    .illustrated-map .leaflet-control-attribution {
      display: none !important;
    }
    .illustrated-map .leaflet-control-attribution a {
      display: none !important;
    }
    .illustrated-map .leaflet-control-zoom a {
      background: rgba(255,255,255,0.9) !important;
      color: #003048 !important;
      border-color: rgba(0,48,72,0.1) !important;
      border-radius: 12px !important;
    }
    .illustrated-map .leaflet-control-zoom {
      border: none !important;
      border-radius: 14px !important;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,48,72,0.1) !important;
    }

    /* ── Premium dropdown styles ── */
    @keyframes auroraShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes accentPulse {
      0%, 100% { opacity: 0.5; transform: scaleX(0.7); }
      50% { opacity: 1; transform: scaleX(1); }
    }
    @keyframes dotBreathe {
      0%, 100% { box-shadow: 0 0 0 0 rgba(193,33,38,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(193,33,38,0); }
    }
    @keyframes badgeShimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .premium-dropdown-trigger {
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .premium-dropdown-trigger:hover {
      transform: translateY(-2px);
    }
    .premium-dropdown-trigger::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(110deg, transparent 33%, rgba(255,255,255,0.35) 50%, transparent 67%);
      transform: translateX(-100%);
      transition: none;
      pointer-events: none;
    }
    .premium-dropdown-trigger:hover::after {
      animation: shimmerSlide 0.8s ease-out forwards;
    }

    /* Custom scrollbar for dropdown */
    .premium-dropdown-list::-webkit-scrollbar {
      width: 5px;
    }
    .premium-dropdown-list::-webkit-scrollbar-track {
      background: rgba(0,48,72,0.03);
      border-radius: 10px;
      margin: 8px 0;
    }
    .premium-dropdown-list::-webkit-scrollbar-thumb {
      background: rgba(193,33,38,0.2);
      border-radius: 10px;
    }
    .premium-dropdown-list::-webkit-scrollbar-thumb:hover {
      background: rgba(193,33,38,0.35);
    }

    /* Dropdown item hover glow */
    .dropdown-item-hover {
      position: relative;
      overflow: hidden;
    }
    .dropdown-item-hover::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0,48,72,0.03) 0%, rgba(193,33,38,0.02) 50%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      border-radius: inherit;
    }
    .dropdown-item-hover:hover::before {
      opacity: 1;
    }

    /* Premium button hover lift */
    .premium-btn {
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .premium-btn:hover {
      transform: translateY(-2px);
    }
    .premium-btn:active {
      transform: translateY(0) scale(0.97);
    }
  `;
  document.head.appendChild(style);
}

/* ─── City pin: teardrop SVG (smaller) ─── */
const createCityPinIcon = () => {
  return L.divIcon({
    className: 'city-pin',
    html: `
      <div style="position:relative;cursor:pointer;width:20px;height:26px;">
        <div style="
          position:absolute;left:50%;top:100%;width:12px;height:12px;border-radius:50%;
          border:1.5px solid rgba(193,33,38,0.3);
          animation: cityPulseRing 2.5s ease-out infinite;pointer-events:none;
        "></div>
        <div style="
          position:absolute;left:50%;top:100%;width:8px;height:8px;border-radius:50%;
          border:1px solid rgba(193,33,38,0.18);
          animation: cityPulseRing2 3s ease-out infinite 0.5s;pointer-events:none;
        "></div>
        <svg width="20" height="26" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="cityPinShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#C12126" flood-opacity="0.35"/>
            </filter>
          </defs>
          <path d="M20 2 C11 2 4 9 4 18 C4 30 20 50 20 50 C20 50 36 30 36 18 C36 9 29 2 20 2 Z"
            fill="#C12126" stroke="#8B0000" stroke-width="0.8" filter="url(#cityPinShadow)"/>
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.95"/>
          <circle cx="20" cy="18" r="3.5" fill="#C12126"/>
        </svg>
      </div>
    `,
    iconSize: [20, 26],
    iconAnchor: [10, 26],
    popupAnchor: [0, -28],
  });
};

/* ─── Store pin SVG (navy blue, unchanged) ─── */
const createStorePinIcon = (isActive = false) => {
  const color = isActive ? '#C12126' : '#003048';
  const innerDot = isActive ? '#C12126' : '#003048';
  const glow = isActive
    ? 'drop-shadow(0 0 12px rgba(193,33,38,0.6)) drop-shadow(0 3px 8px rgba(0,0,0,0.3))'
    : 'drop-shadow(0 2px 6px rgba(0,48,72,0.35))';
  return L.divIcon({
    className: 'store-pin',
    html: `<div style="filter:${glow};transition:filter 0.4s cubic-bezier(0.22,1,0.36,1);">
      <svg width="22" height="30" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" opacity="${isActive ? '1' : '0.9'}"/>
        <circle cx="16" cy="16" r="7" fill="#FAEDD3" opacity="0.95"/>
        <circle cx="16" cy="16" r="3.5" fill="${innerDot}"/>
      </svg>
    </div>`,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -32],
  });
};

/* ─── Cities ─── */
const CITIES = [
  'All', 'Taipei', 'New Taipei', 'Taoyuan', 'Keelung', 'Hsinchu',
  'Hsinchu County', 'Miaoli', 'Taichung', 'Changhua', 'Nantou',
  'Yunlin', 'Chiayi', 'Chiayi County', 'Tainan', 'Kaohsiung',
  'Pingtung', 'Yilan', 'Hualien', 'Taitung',
];

interface StoreMapProps {
  stores: StoreLocation[];
}

/* ─── Ocean Water Animated Effects ─── */
function OceanWaterEffects() {
  /* Ocean-only zones: left ocean (0-38%), right ocean (65-100%), bottom (70-100%) */
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[490]">

      {/* Water ripples — ONLY in ocean zones */}
      {[
        { top: '30%', left: '10%', delay: '0s', size: 24 },
        { top: '50%', left: '20%', delay: '2.5s', size: 20 },
        { top: '75%', left: '15%', delay: '1s', size: 22 },
        { top: '40%', left: '75%', delay: '3.5s', size: 18 },
        { top: '60%', left: '85%', delay: '5s', size: 20 },
        { top: '80%', left: '70%', delay: '1.5s', size: 16 },
      ].map((pos, i) => (
        <svg key={`ripple-${i}`} style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.size * 3, height: pos.size * 3 }} viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
            <animate attributeName="r" from="6" to="26" dur="5s" begin={pos.delay} repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="5s" begin={pos.delay} repeatCount="indefinite" />
          </circle>
        </svg>
      ))}

      {/* Bubbles — only in ocean zones */}
      {[
        { left: '8%', delay: 0 }, { left: '22%', delay: 3 }, { left: '32%', delay: 7 },
        { left: '72%', delay: 2 }, { left: '85%', delay: 5 }, { left: '92%', delay: 9 },
      ].map((b, i) => (
        <div key={`bub-${i}`} style={{
          position: 'absolute', bottom: '-8px', left: b.left,
          width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: '50%',
          background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)',
          animation: `bubbleRise ${8 + i * 2}s ease-in infinite ${b.delay}s`,
        }} />
      ))}

      {/* Boat — sails in LEFT ocean area only */}
      <div style={{ position: 'absolute', top: '25%', left: '0%', width: '38%', height: '28px', overflow: 'hidden' }}>
        <svg style={{ animation: 'boatSail 45s linear infinite', opacity: 0.7 }} viewBox="0 0 50 20" width="50" height="20" fill="none">
          <path d="M5 14 L10 14 L12 10 L15 6 L15 10 L25 10 L27 14 L30 14 L28 18 L3 18 Z" fill="#1A4F6E" />
          <line x1="15" y1="6" x2="15" y2="3" stroke="#1A4F6E" strokeWidth="1.5" />
          <polygon points="15,3 15,7 19,7" fill="#E85A3A" opacity="0.9" />
        </svg>
      </div>

      {/* Jellyfish — right ocean only */}
      <svg style={{ position: 'absolute', bottom: '35%', right: '8%', width: '24px', height: '34px', opacity: 0.6, animation: 'jellyfishDrift 10s ease-in-out infinite' }} viewBox="0 0 20 30" fill="none">
        <ellipse cx="10" cy="8" rx="8" ry="8" fill="#D988E8" />
        <ellipse cx="10" cy="8" rx="5" ry="5" fill="#E8A8F5" opacity="0.5" />
        <path d="M4 16 Q6 22 5 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M8 16 Q9 24 7 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M12 16 Q11 24 13 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M16 16 Q14 22 15 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>

      {/* Starfish — bottom-left ocean floor */}
      <svg style={{ position: 'absolute', bottom: '6%', left: '12%', width: '22px', height: '22px', opacity: 0.65, animation: 'bobFloat 7s ease-in-out infinite 2s' }} viewBox="0 0 24 24" fill="#E8714A">
        <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5 2.5-7.5-6-4.5h7.5z" />
      </svg>

      {/* Seaweed — bottom ocean areas only */}
      {[
        { left: '6%', h: 45, delay: '0s' },
        { left: '28%', h: 38, delay: '1.5s' },
        { left: '78%', h: 42, delay: '0.8s' },
        { left: '90%', h: 35, delay: '2.2s' },
      ].map((s, i) => (
        <svg key={`sw-${i}`} style={{ position: 'absolute', bottom: 0, left: s.left, width: '14px', height: `${s.h}px`, opacity: 0.5, animation: `seaweedSway 5s ease-in-out infinite ${s.delay}`, transformOrigin: 'bottom center' }} viewBox="0 0 14 40" fill="none">
          <path d="M7 40 Q3 30 7 22 Q11 14 7 6 Q5 2 7 0" stroke="#1B8C4E" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      ))}

      <style>{`
        @keyframes bubbleRise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.35; }
          90% { opacity: 0.15; }
          100% { transform: translateY(-650px); opacity: 0; }
        }
        @keyframes jellyfishDrift {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-12px) translateX(4px); }
          50% { transform: translateY(-5px) translateX(-3px); }
          75% { transform: translateY(-18px) translateX(6px); }
        }
        @keyframes seaweedSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(4deg); }
          75% { transform: rotate(-4deg); }
        }
        @keyframes boatSail {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(calc(100% + 60px)); }
        }
      `}</style>
    </div>
  );
}

/* ─── Decorative SVG components ─── */
function DecorativeElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[500]">

      {/* ═══ SKY — birds & clouds (can go anywhere overhead) ═══ */}
      <svg style={{ position: 'absolute', top: '5%', left: 0, width: '100%', height: '30px', animation: 'floatBird 18s ease-in-out infinite' }} viewBox="0 0 40 20" fill="none" width="40" height="20">
        <path d="M2 12 Q8 4 14 10 M14 10 Q20 4 26 12" stroke="#1A3D4E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
      <svg style={{ position: 'absolute', top: '10%', left: 0, width: '100%', height: '24px', animation: 'floatBird 22s ease-in-out infinite 4s' }} viewBox="0 0 30 16" fill="none" width="30" height="16">
        <path d="M2 10 Q6 3 10 8 M10 8 Q14 3 18 10" stroke="#2A5060" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>

      <svg style={{ position: 'absolute', top: '3%', left: 0, width: '100%', height: '45px', animation: 'floatCloud 35s linear infinite', opacity: 0.65 }} viewBox="0 0 120 40" fill="none" width="120" height="40">
        <ellipse cx="60" cy="25" rx="50" ry="14" fill="white"/><ellipse cx="40" cy="18" rx="25" ry="14" fill="white"/><ellipse cx="80" cy="20" rx="30" ry="12" fill="white"/>
      </svg>

      {/* ═══ LEFT OCEAN — South China Sea (0-38%) ═══ */}
      {/* Fish swimming left ocean */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '38%', height: '100%', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', top: '40%', left: '-30px', animation: 'fishSwimRight 30s linear infinite 2s' }} viewBox="0 0 28 14" fill="none" width="28" height="14">
          <ellipse cx="12" cy="7" rx="10" ry="5" fill="#FF6B35" opacity="0.8"/><polygon points="22,7 28,2 28,12" fill="#FF6B35" opacity="0.8"/><circle cx="7" cy="6" r="1.5" fill="white"/>
        </svg>
        <svg style={{ position: 'absolute', top: '60%', left: '-20px', animation: 'fishSwimRight 35s linear infinite 8s' }} viewBox="0 0 24 12" fill="none" width="24" height="12">
          <ellipse cx="10" cy="6" rx="8" ry="4" fill="#00BCD4" opacity="0.75"/><polygon points="18,6 24,2 24,10" fill="#00BCD4" opacity="0.75"/><circle cx="6" cy="5" r="1.2" fill="white"/>
        </svg>
        {/* Turtle — slow swim in left ocean */}
        <svg style={{ position: 'absolute', top: '50%', left: '-40px', animation: 'fishSwimRight 50s linear infinite 5s' }} viewBox="0 0 36 18" fill="none" width="36" height="18">
          <ellipse cx="18" cy="10" rx="10" ry="6" fill="#2E8B57" opacity="0.75"/>
          <ellipse cx="18" cy="10" rx="7" ry="4" fill="#3CB371" opacity="0.65"/>
          <circle cx="8" cy="8" r="3.5" fill="#2E8B57" opacity="0.75"/>
          <circle cx="6" cy="7" r="1" fill="white"/>
          <ellipse cx="12" cy="5" rx="3.5" ry="1.8" fill="#2E8B57" opacity="0.65" transform="rotate(-20 12 5)"/>
          <ellipse cx="12" cy="15" rx="3.5" ry="1.8" fill="#2E8B57" opacity="0.65" transform="rotate(20 12 15)"/>
          <ellipse cx="26" cy="8" rx="3.5" ry="1.8" fill="#2E8B57" opacity="0.65" transform="rotate(-10 26 8)"/>
          <ellipse cx="26" cy="12" rx="3.5" ry="1.8" fill="#2E8B57" opacity="0.65" transform="rotate(10 26 12)"/>
        </svg>
      </div>

      {/* ═══ RIGHT OCEAN — Pacific (65-100%) ═══ */}
      <div style={{ position: 'absolute', top: 0, left: '65%', width: '35%', height: '100%', overflow: 'hidden' }}>
        {/* Dolphin in right ocean */}
        <svg style={{ position: 'absolute', top: '30%', right: '-30px', animation: 'fishSwimLeft 40s linear infinite 3s' }} viewBox="0 0 40 22" fill="none" width="40" height="22">
          <ellipse cx="20" cy="11" rx="8" ry="4.5" fill="#1565C0" opacity="0.65"/>
          <path d="M28 11 L34 8 L33 14 Z" fill="#1565C0" opacity="0.6"/>
          <circle cx="14" cy="10" r="1.2" fill="white" opacity="0.8"/>
          <path d="M10 11 Q6 5 2 11" stroke="#1565C0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
        </svg>
        {/* Yellow fish school */}
        <svg style={{ position: 'absolute', top: '55%', right: '-25px', animation: 'fishSwimLeft 28s linear infinite 6s' }} viewBox="0 0 40 16" fill="none" width="40" height="16">
          <ellipse cx="8" cy="5" rx="4" ry="2.2" fill="#FFB300" opacity="0.75"/>
          <ellipse cx="16" cy="9" rx="4" ry="2.2" fill="#FFB300" opacity="0.7"/>
          <ellipse cx="12" cy="13" rx="3.5" ry="2" fill="#FFB300" opacity="0.65"/>
          <polygon points="12,5 16,3 16,7" fill="#FFB300" opacity="0.75"/>
          <polygon points="20,9 24,7 24,11" fill="#FFB300" opacity="0.7"/>
        </svg>
        {/* Coral fish */}
        <svg style={{ position: 'absolute', top: '75%', right: '-20px', animation: 'fishSwimLeft 32s linear infinite 10s' }} viewBox="0 0 22 10" fill="none" width="22" height="10">
          <ellipse cx="9" cy="5" rx="7" ry="3.5" fill="#E84855" opacity="0.7"/><polygon points="16,5 22,2 22,8" fill="#E84855" opacity="0.7"/><circle cx="5" cy="4" r="1" fill="white"/>
        </svg>
      </div>

      {/* ═══ BOTTOM OCEAN — wave lines (bottom 20%) ═══ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '25px', animation: 'waveMove 12s linear infinite', opacity: 0.35 }}>
        <svg viewBox="0 0 1200 25" fill="none" width="100%" height="25" preserveAspectRatio="none">
          <path d="M0 12 Q50 0 100 12 Q150 25 200 12 Q250 0 300 12 Q350 25 400 12 Q450 0 500 12 Q550 25 600 12 Q650 0 700 12 Q750 25 800 12 Q850 0 900 12 Q950 25 1000 12 Q1050 0 1100 12 Q1150 25 1200 12" stroke="#FFFFFF" strokeWidth="2" fill="none"/>
        </svg>
      </div>

      {/* ═══ TAIWAN LAND ANIMALS — positioned over Taiwan area (42-60%, 28-58%) ═══ */}

      {/* 1. Formosan Macaque (monkey) — sitting on mid Taiwan */}
      <svg style={{ position: 'absolute', top: '38%', left: '48%', width: '22px', height: '24px', opacity: 0.7, animation: 'monkeyBob 4s ease-in-out infinite' }} viewBox="0 0 24 28" fill="none">
        <circle cx="12" cy="8" r="7" fill="#8B6914"/>
        <circle cx="12" cy="8" r="5.5" fill="#A67C2E"/>
        <circle cx="9.5" cy="7" r="1.2" fill="#333"/>
        <circle cx="14.5" cy="7" r="1.2" fill="#333"/>
        <ellipse cx="12" cy="10" rx="2.5" ry="1.5" fill="#D4A854"/>
        <circle cx="5" cy="5" r="3" fill="#8B6914"/><circle cx="5" cy="5" r="1.8" fill="#D4A854"/>
        <circle cx="19" cy="5" r="3" fill="#8B6914"/><circle cx="19" cy="5" r="1.8" fill="#D4A854"/>
        <ellipse cx="12" cy="18" rx="5" ry="6" fill="#8B6914"/>
        <path d="M8 24 Q12 20 16 24" stroke="#8B6914" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>

      {/* 2. Cat — near south Taiwan */}
      <svg style={{ position: 'absolute', top: '50%', left: '52%', width: '18px', height: '20px', opacity: 0.65, animation: 'catTail 3s ease-in-out infinite 1s' }} viewBox="0 0 20 24" fill="none">
        <polygon points="4,8 6,1 8,8" fill="#FF8C42"/>
        <polygon points="12,8 14,1 16,8" fill="#FF8C42"/>
        <ellipse cx="10" cy="11" rx="7" ry="6" fill="#FF8C42"/>
        <circle cx="7.5" cy="9.5" r="1.2" fill="#333"/>
        <circle cx="12.5" cy="9.5" r="1.2" fill="#333"/>
        <ellipse cx="10" cy="12" rx="1" ry="0.6" fill="#FF6B6B"/>
        <path d="M7 12.5 Q10 14 13 12.5" stroke="#A05020" strokeWidth="0.5" fill="none"/>
        <ellipse cx="10" cy="19" rx="5.5" ry="5" fill="#FF8C42"/>
        <path d="M16 16 Q20 12 18 18" stroke="#FF8C42" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>

      {/* 3. Sika Deer — north Taiwan */}
      <svg style={{ position: 'absolute', top: '30%', left: '50%', width: '24px', height: '26px', opacity: 0.65, animation: 'bobFloat 5s ease-in-out infinite 2s' }} viewBox="0 0 28 32" fill="none">
        <ellipse cx="14" cy="20" rx="8" ry="6" fill="#C4883A"/>
        <circle cx="14" cy="8" r="5" fill="#C4883A"/>
        <circle cx="11.5" cy="7" r="1" fill="#333"/>
        <circle cx="16.5" cy="7" r="1" fill="#333"/>
        <ellipse cx="14" cy="10" rx="1.5" ry="1" fill="#333"/>
        <line x1="10" y1="1" x2="8" y2="-3" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="1" x2="20" y2="-3" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="-3" x2="6" y2="-5" stroke="#8B6914" strokeWidth="1" strokeLinecap="round"/>
        <line x1="20" y1="-3" x2="22" y2="-5" stroke="#8B6914" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="11" cy="18" r="1" fill="white" opacity="0.6"/>
        <circle cx="17" cy="19" r="0.8" fill="white" opacity="0.5"/>
        <circle cx="14" cy="16" r="0.7" fill="white" opacity="0.5"/>
        <line x1="9" y1="26" x2="8" y2="32" stroke="#8B6914" strokeWidth="1.5"/>
        <line x1="12" y1="26" x2="11" y2="32" stroke="#8B6914" strokeWidth="1.5"/>
        <line x1="16" y1="26" x2="17" y2="32" stroke="#8B6914" strokeWidth="1.5"/>
        <line x1="19" y1="26" x2="20" y2="32" stroke="#8B6914" strokeWidth="1.5"/>
      </svg>

      {/* 4. Butterfly — fluttering near Taiwan */}
      <svg style={{ position: 'absolute', top: '42%', left: '55%', width: '20px', height: '16px', opacity: 0.7, animation: 'butterflyFloat 6s ease-in-out infinite' }} viewBox="0 0 24 18" fill="none">
        <ellipse cx="12" cy="9" rx="1" ry="6" fill="#333"/>
        <ellipse cx="7" cy="6" rx="5" ry="4" fill="#FF6B9D" opacity="0.8" transform="rotate(-15 7 6)">
          <animate attributeName="rx" values="5;3.5;5" dur="0.8s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="17" cy="6" rx="5" ry="4" fill="#FF6B9D" opacity="0.8" transform="rotate(15 17 6)">
          <animate attributeName="rx" values="5;3.5;5" dur="0.8s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="8" cy="12" rx="3.5" ry="3" fill="#FFB6D9" opacity="0.7" transform="rotate(-10 8 12)">
          <animate attributeName="rx" values="3.5;2.5;3.5" dur="0.8s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="16" cy="12" rx="3.5" ry="3" fill="#FFB6D9" opacity="0.7" transform="rotate(10 16 12)">
          <animate attributeName="rx" values="3.5;2.5;3.5" dur="0.8s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="7" cy="5.5" r="1" fill="#FF3D7F" opacity="0.6"/>
        <circle cx="17" cy="5.5" r="1" fill="#FF3D7F" opacity="0.6"/>
      </svg>

      {/* 5. Taiwan Blue Magpie — perched near Taiwan */}
      <svg style={{ position: 'absolute', top: '34%', left: '44%', width: '22px', height: '22px', opacity: 0.65, animation: 'bobFloat 4.5s ease-in-out infinite 3s' }} viewBox="0 0 26 28" fill="none">
        <ellipse cx="13" cy="10" rx="5" ry="4.5" fill="#2962A5"/>
        <circle cx="13" cy="5" r="3.5" fill="#1A1A2E"/>
        <circle cx="14.5" cy="4.5" r="0.8" fill="white"/>
        <polygon points="16,5 20,4.5 16,6" fill="#E85A3A"/>
        <path d="M8 14 Q4 22 6 28" stroke="#2962A5" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M10 14 Q8 20 10 26" stroke="#4A8AD4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="13" y1="14" x2="12" y2="18" stroke="#8B6914" strokeWidth="1"/>
        <line x1="15" y1="14" x2="16" y2="18" stroke="#8B6914" strokeWidth="1"/>
      </svg>

      {/* ═══ AIRPLANE — occasional slow rise from bottom to top ═══ */}
      {[
        { left: '18%', duration: '50s', delay: '0s' },
        { left: '48%', duration: '58s', delay: '18s' },
        { left: '78%', duration: '54s', delay: '35s' },
      ].map((plane, i) => (
        <div
          key={`plane-${i}`}
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: plane.left,
            animation: `planeRise ${plane.duration} linear infinite ${plane.delay}`,
            opacity: 0,
            zIndex: 10,
          }}
        >
          <svg className="w-[20px] h-[20px] sm:w-[28px] sm:h-[28px] lg:w-[32px] lg:h-[32px]" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))' }}>
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      ))}

      {/* ═══ KEYFRAMES ═══ */}
      <style>{`
        @keyframes floatBird {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(calc(100% + 60px)); }
        }
        @keyframes floatBird2 {
          0% { transform: translateX(calc(100% + 40px)); }
          100% { transform: translateX(-40px); }
        }
        @keyframes floatCloud {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(calc(100% + 150px)); }
        }
        @keyframes waveMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fishSwimRight {
          0% { transform: translateX(-40px); }
          100% { transform: translateX(calc(100% + 40px)); }
        }
        @keyframes fishSwimLeft {
          0% { transform: translateX(calc(100% + 40px)) scaleX(-1); }
          100% { transform: translateX(-40px) scaleX(-1); }
        }
        @keyframes bobFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes monkeyBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-3px) rotate(-2deg); }
          70% { transform: translateY(-1px) rotate(2deg); }
        }
        @keyframes catTail {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes butterflyFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(6px, -8px); }
          50% { transform: translate(-4px, -12px); }
          75% { transform: translate(8px, -5px); }
        }
        @keyframes planeRise {
          0%   { transform: translateY(0) rotate(-8deg); opacity: 0; }
          3%   { opacity: 0.85; }
          42%  { opacity: 0.85; }
          46%  { transform: translateY(-1100px) translateX(-30px) rotate(-8deg); opacity: 0; }
          47%  { transform: translateY(0) rotate(-8deg); opacity: 0; }
          100% { transform: translateY(0) rotate(-8deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Premium Dropdown — Clean & Smart ─── */
function PremiumDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      /* Smooth panel entrance */
      if (panelRef.current) {
        gsap.fromTo(panelRef.current,
          { opacity: 0, y: 6, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
        );
      }
      /* Subtle item stagger */
      itemRefs.current.forEach((el, i) => {
        if (el) {
          gsap.fromTo(el,
            { opacity: 0, x: -6 },
            { opacity: 1, x: 0, duration: 0.3, delay: 0.04 + i * 0.018, ease: 'power2.out' }
          );
        }
      });
      /* Auto-scroll to active item */
      setTimeout(() => {
        const activeIdx = options.indexOf(value);
        const activeEl = itemRefs.current[activeIdx];
        if (activeEl && listRef.current && activeIdx > 4) {
          activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 180);
    });
  };

  const closeDropdown = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0, y: 4, scale: 0.98,
        duration: 0.22, ease: 'power2.in',
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setTimeout(() => closeDropdown(), 60);
  };

  const displayValue = value === 'All' ? 'All Cities' : value;

  return (
    <div ref={dropdownRef} className="relative" style={{ zIndex: 1002 }}>
      {/* ── Trigger ── */}
      <button
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 min-w-[140px] sm:min-w-[240px] md:min-w-[280px] rounded-2xl text-[12px] sm:text-[13px] font-medium border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
        style={{
          background: isOpen
            ? 'rgba(255,255,255,0.72)'
            : 'rgba(255,255,255,0.55)',
          borderColor: isOpen ? 'rgba(0,48,72,0.12)' : 'rgba(0,48,72,0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isOpen
            ? '0 16px 48px rgba(0,25,45,0.12), inset 0 1px 0 rgba(255,255,255,0.5)'
            : '0 4px 16px rgba(0,25,45,0.06), inset 0 1px 0 rgba(255,255,255,0.4)',
          color: '#003048',
        }}
      >
        {value === 'All' ? (
          <span className="text-base leading-none shrink-0">🇹🇼</span>
        ) : (
          <svg width="12" height="16" viewBox="0 0 20 26" className="shrink-0">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 16 10 16s10-8.5 10-16C20 4.48 15.52 0 10 0z" fill="#C12126"/>
            <circle cx="10" cy="10" r="4" fill="white"/>
            <circle cx="10" cy="10" r="2" fill="#C12126"/>
          </svg>
        )}
        <span className="flex-1 text-left truncate tracking-tight font-medium">{displayValue}</span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-all duration-400"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.35,
            color: '#003048',
          }}
        />
      </button>

      {/* ── Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full mt-2 left-0 w-full min-w-[140px] sm:min-w-[240px] md:min-w-[280px] rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.68)',
            border: '1px solid rgba(0,48,72,0.08)',
            boxShadow: '0 24px 64px rgba(0,25,45,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            transformOrigin: 'top center',
          }}
        >
          {/* Thin top accent */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(193,33,38,0.2), transparent)' }} />

          <div ref={listRef} className="premium-dropdown-list overflow-y-auto max-h-[320px] py-1.5 px-1.5">
            {options.map((city, i) => {
              const isActive = value === city;
              const label = city === 'All' ? 'All Cities' : city;
              const isAll = city === 'All';
              return (
                <button
                  key={city}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  onClick={() => handleSelect(city)}
                  className="relative w-full text-left px-4 py-2.5 rounded-xl text-[13px] flex items-center gap-3 transition-all duration-300 my-px"
                  style={{
                    background: isActive ? 'rgba(193,33,38,0.08)' : 'transparent',
                    color: isActive ? '#C12126' : 'rgba(0,48,72,0.45)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(0,48,72,0.04)';
                      e.currentTarget.style.color = 'rgba(0,48,72,0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(0,48,72,0.45)';
                    }
                  }}
                >
                  {/* Icon: Taiwan flag for All, pin for cities */}
                  {isAll ? (
                    <span className="text-sm leading-none shrink-0">🇹🇼</span>
                  ) : (
                    <svg width="10" height="13" viewBox="0 0 20 26" className="shrink-0" style={{ opacity: isActive ? 1 : 0.35 }}>
                      <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 16 10 16s10-8.5 10-16C20 4.48 15.52 0 10 0z" fill={isActive ? '#C12126' : '#003048'}/>
                      <circle cx="10" cy="10" r="4" fill="white"/>
                      <circle cx="10" cy="10" r="2" fill={isActive ? '#C12126' : '#003048'}/>
                    </svg>
                  )}
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-[6px] top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-red" />
                  )}
                  <span
                    className="flex-1 truncate"
                    style={{ fontWeight: isActive ? 600 : 400, letterSpacing: '-0.01em' }}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] opacity-40 text-red">{'\u2713'}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Thin bottom line */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,48,72,0.04), transparent)' }} />
        </div>
      )}
    </div>
  );
}


export default function StoreMap({ stores }: StoreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [filterCity, setFilterCity] = useState('All');
  const popupRef = useRef<HTMLDivElement>(null);

  /* ─── Ambient Music ─── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicStartedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/map-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  /* Start music on first map interaction (click/touch) — auto-play policy requires user gesture */
  const startMusicOnInteraction = useCallback(() => {
    if (musicStartedRef.current || !audioRef.current) return;
    musicStartedRef.current = true;
    audioRef.current.play().then(() => {
      setMusicPlaying(true);
    }).catch(() => {
      /* Autoplay blocked — user can toggle manually */
      musicStartedRef.current = false;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  }, [musicPlaying]);

  useEffect(() => { injectPinStyles(); }, []);

  /* ─── City clusters ─── */
  const cityClusters = useMemo(() => {
    const cityMap: Record<string, { stores: StoreLocation[]; totalLat: number; totalLng: number }> = {};
    stores.forEach((s) => {
      if (!cityMap[s.city]) cityMap[s.city] = { stores: [], totalLat: 0, totalLng: 0 };
      cityMap[s.city].stores.push(s);
      cityMap[s.city].totalLat += s.lat;
      cityMap[s.city].totalLng += s.lng;
    });
    return Object.entries(cityMap).map(([city, data]) => ({
      city,
      count: data.stores.length,
      lat: data.totalLat / data.stores.length,
      lng: data.totalLng / data.stores.length,
      stores: data.stores,
    }));
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter((s) => filterCity === 'All' || s.city === filterCity);
  }, [stores, filterCity]);

  const displayCount = filterCity === 'All' ? stores.length : filteredStores.length;
  const cityCountNum = filterCity === 'All' ? cityClusters.length : null;

  /* ─── Init map ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const map = L.map(mapContainerRef.current, {
      center: [23.7, 120.96],
      zoom: 8,
      zoomControl: false,
      scrollWheelZoom: !isMobile,
      dragging: !isMobile,
      touchZoom: true,
      attributionControl: false,
      maxBounds: L.latLngBounds([21.5, 119.0], [26.0, 122.5]),
      maxBoundsViscosity: 0.9,
      minZoom: 7,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addAttribution('© OpenStreetMap').addTo(map);

    mapRef.current = map;

    /* ── Mobile: two-finger gesture handling (like Google Maps) ── */
    if (isMobile && mapContainerRef.current) {
      const container = mapContainerRef.current;
      container.style.position = 'relative';

      /* --- Shared overlay factory --- */
      const makeOverlay = (html: string) => {
        const el = document.createElement('div');
        el.innerHTML = html;
        el.style.cssText = `
          position:absolute;inset:0;z-index:9999;display:none;
          align-items:center;justify-content:center;
          background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);
          pointer-events:none;border-radius:inherit;
          transition:opacity 0.3s ease;
        `;
        container.appendChild(el);
        return el;
      };

      const showOverlay = (el: HTMLElement, ms: number) => {
        el.style.display = 'flex';
        el.style.opacity = '1';
        setTimeout(() => {
          el.style.opacity = '0';
          setTimeout(() => { el.style.display = 'none'; }, 300);
        }, ms);
      };

      /* --- Overlay 1: "Use two fingers to move the map" --- */
      const dragOverlay = makeOverlay(`
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <!-- Hand with exactly 2 fingers raised -->
            <rect x="20" y="8" width="8" height="28" rx="4" fill="white"/>
            <rect x="32" y="6" width="8" height="30" rx="4" fill="white"/>
            <rect x="16" y="32" width="28" height="20" rx="8" fill="white"/>
            <!-- Horizontal arrows showing drag -->
            <path d="M4 30l6-4v8z" fill="rgba(255,255,255,0.8)"/>
            <path d="M60 30l-6-4v8z" fill="rgba(255,255,255,0.8)"/>
            <line x1="10" y1="30" x2="54" y2="30" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-dasharray="3 3"/>
          </svg>
          <span style="color:white;font-size:13px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.5);">Use two fingers to move the map</span>
        </div>
      `);

      let hideTimeout: ReturnType<typeof setTimeout>;
      let touchCount = 0;

      container.addEventListener('touchstart', (e) => {
        touchCount = e.touches.length;
        if (e.touches.length >= 2) {
          dragOverlay.style.display = 'none';
          map.dragging.enable();
        }
      }, { passive: true });

      /* Only show "two fingers" overlay ONCE when user first swipes with one finger */
      let dragOverlayShown = false;
      container.addEventListener('touchmove', (e) => {
        if (!dragOverlayShown && touchCount === 1 && e.touches.length === 1) {
          dragOverlayShown = true;
          dragOverlay.style.display = 'flex';
          dragOverlay.style.opacity = '1';
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            dragOverlay.style.opacity = '0';
            setTimeout(() => { dragOverlay.style.display = 'none'; }, 300);
          }, 1800);
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        touchCount = e.touches.length;
        if (e.touches.length < 2) {
          map.dragging.disable();
        }
      }, { passive: true });

      /* --- Overlay 2: "Pinch to zoom" — shown once on first city click --- */
      const pinchOverlay = makeOverlay(`
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
          <div style="position:relative;width:56px;height:56px;">
            <!-- Two dots that animate pinch in/out -->
            <div class="pinch-dot pinch-dot-top" style="position:absolute;width:14px;height:14px;background:white;border-radius:50%;left:50%;top:8px;transform:translateX(-50%);"></div>
            <div class="pinch-dot pinch-dot-bottom" style="position:absolute;width:14px;height:14px;background:white;border-radius:50%;left:50%;bottom:8px;transform:translateX(-50%);"></div>
            <!-- Arrows between dots -->
            <svg style="position:absolute;inset:0;" viewBox="0 0 56 56" fill="none">
              <path d="M28 18 L28 12 M25 14 L28 10 L31 14" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M28 38 L28 44 M25 42 L28 46 L31 42" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span style="color:white;font-size:13px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.5);">Pinch to zoom in & out</span>
        </div>
      `);

      /* Pinch animation keyframes */
      const pinchStyle = document.createElement('style');
      pinchStyle.textContent = `
        @keyframes pinchIn {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes pinchOut {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
        .pinch-dot-top { animation: pinchIn 1.5s ease-in-out infinite; }
        .pinch-dot-bottom { animation: pinchOut 1.5s ease-in-out infinite; }
      `;
      document.head.appendChild(pinchStyle);

      /* Expose pinch overlay for city-click to trigger (only once) */
      (container as any).__pinchOverlay = pinchOverlay;
      (container as any).__pinchShown = false;
    }

    /* Start ambient music on first map interaction */
    map.on('click', () => startMusicOnInteraction());
    map.on('dragstart', () => startMusicOnInteraction());
    map.on('zoomstart', () => startMusicOnInteraction());

    /* ── Custom pane: labels on top of everything ── */
    map.createPane('labelsPane');
    const labelsPane = map.getPane('labelsPane');
    if (labelsPane) {
      labelsPane.style.zIndex = '450';
      labelsPane.style.pointerEvents = 'none';
    }

    /* ── Layer 1: Voyager base tiles at FULL opacity — all land details visible ── */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(map);

    /* ── Layer 2: Ocean GeoJSON overlay — blue ONLY over water ──
       Generated from 10m Natural Earth with 0.02° inland buffer = precise coastlines */
    const oceanPane = map.createPane('oceanPane');
    oceanPane.style.zIndex = '350';
    oceanPane.style.pointerEvents = 'none';

    fetch('/ocean.geo.json')
      .then((res) => res.json())
      .then((oceanData) => {
        L.geoJSON(oceanData, {
          pane: 'oceanPane',
          style: () => ({
            fillColor: '#1565C0',
            fillOpacity: 0.85,
            color: 'transparent',
            weight: 0,
          }),
          interactive: false,
        }).addTo(map);
      })
      .catch((err) => { console.warn('Ocean GeoJSON failed:', err); });

    /* ── Layer 3: Taiwan GeoJSON overlay — peach/salmon illustrated style ── */
    fetch('/taiwan.geo.json')
      .then((res) => res.json())
      .then((geojsonData) => {
        const geoLayer = L.geoJSON(geojsonData, {
          style: () => ({
            fillColor: '#F5CBA7',
            fillOpacity: 0.75,
            color: '#FFFFFF',
            weight: 2.5,
            opacity: 0.9,
          }),
          interactive: false,
        });
        geoLayer.addTo(map);
        geoJsonLayerRef.current = geoLayer;

        /* ── Layer 4: Labels on top — city names, roads, districts clearly visible ── */
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          pane: 'labelsPane',
        }).addTo(map);
      })
      .catch(() => {
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);
      });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ─── Update markers ─── */
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (filterCity === 'All') {
      cityClusters.forEach((cluster) => {
        const marker = L.marker([cluster.lat, cluster.lng], { icon: createCityPinIcon() });
        marker.on('click', () => {
          setSelectedStore(null);
          setFilterCity(cluster.city);
          /* Show pinch-to-zoom hint once on mobile */
          const container = mapContainerRef.current;
          if (container && (container as any).__pinchOverlay && !(container as any).__pinchShown) {
            (container as any).__pinchShown = true;
            const overlay = (container as any).__pinchOverlay as HTMLElement;
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
            setTimeout(() => {
              overlay.style.opacity = '0';
              setTimeout(() => { overlay.style.display = 'none'; }, 300);
            }, 1800);
          }
        });
        marker.addTo(map);
        markersRef.current.push(marker);
      });
      if (cityClusters.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 10 });
      }
    } else {
      filteredStores.forEach((store) => {
        const marker = L.marker([store.lat, store.lng], { icon: createStorePinIcon(selectedStore?.id === store.id) });
        marker.on('click', () => { setSelectedStore(store); map.flyTo([store.lat, store.lng], 14, { duration: 1.2 }); });
        marker.addTo(map);
        markersRef.current.push(marker);
      });
      if (filteredStores.length > 0 && !selectedStore) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 14 });
      }
    }
  }, [filteredStores, cityClusters, filterCity, selectedStore]);

  useEffect(() => { updateMarkers(); }, [updateMarkers]);

  useEffect(() => {
    if (filterCity !== 'All') {
      markersRef.current.forEach((marker, idx) => {
        const store = filteredStores[idx];
        if (store) marker.setIcon(createStorePinIcon(selectedStore?.id === store.id));
      });
    }
  }, [selectedStore, filteredStores, filterCity]);

  /* ─── Popup animations ─── */
  useEffect(() => {
    if (selectedStore && popupRef.current) {
      gsap.fromTo(popupRef.current, { opacity: 0, y: 30, scale: 0.92, filter: 'blur(8px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' });
    }
  }, [selectedStore]);

  const handleClosePopup = () => {
    if (popupRef.current) {
      gsap.to(popupRef.current, { opacity: 0, y: 20, scale: 0.95, filter: 'blur(6px)', duration: 0.3, ease: 'power2.in', onComplete: () => setSelectedStore(null) });
    } else setSelectedStore(null);
  };

  const handleResetView = () => {
    const map = mapRef.current; if (!map) return;
    setSelectedStore(null); setFilterCity('All');
    map.flyTo([23.7, 120.96], 8, { duration: 1 });
  };

  const handleBackToAll = () => {
    const map = mapRef.current; if (!map) return;
    setSelectedStore(null); setFilterCity('All');
    map.flyTo([23.7, 120.96], 8, { duration: 1 });
  };

  const storeTypeLabel = (type: string) => {
    const labels: Record<string, string> = { supermarket: 'Supermarket', minimarket: 'Minimarket', toko: 'Toko Indonesia', retail: 'Retail Store', online: 'Online Shop' };
    return labels[type] || type;
  };

  const storeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      supermarket: 'bg-blue-50 text-blue-700 border-blue-200',
      minimarket: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      toko: 'bg-red-50 text-red-700 border-red-200',
      retail: 'bg-amber-50 text-amber-700 border-amber-200',
      online: 'bg-violet-50 text-violet-700 border-violet-200',
    };
    return colors[type] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <div className="relative w-full">
      {/* ─── Top bar ─── */}
      <div className="absolute top-4 left-3 right-3 sm:left-4 sm:right-4 z-[1000] flex items-center gap-2 sm:gap-3">
        {/* Premium dropdown */}
        <PremiumDropdown
          value={filterCity}
          options={CITIES}
          onChange={(city) => { setFilterCity(city); setSelectedStore(null); }}
        />

        <div className="flex-1" />

        {/* Back to All */}
        {filterCity !== 'All' && (
          <button
            onClick={handleBackToAll}
            className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-[12px] font-medium whitespace-nowrap transition-all duration-400 ease-out hover:-translate-y-0.5"
            style={{
              background: 'rgba(0,48,72,0.88)',
              color: 'rgba(250,237,211,0.85)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(0,25,45,0.12)',
            }}
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-0.5 text-sm opacity-60">←</span>
            <span>All Cities</span>
          </button>
        )}

        {/* Music toggle */}
        <button
          onClick={toggleMusic}
          className="group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-400 ease-out hover:-translate-y-0.5"
          title={musicPlaying ? 'Mute music' : 'Play ambient music'}
          style={{
            background: musicPlaying ? 'rgba(193,33,38,0.12)' : 'rgba(255,255,255,0.92)',
            boxShadow: '0 2px 8px rgba(0,48,72,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {musicPlaying ? (
            <svg className="w-3.5 h-3.5 text-red" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-navy/40 group-hover:text-red transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={handleResetView}
          className="group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-400 ease-out hover:-translate-y-0.5"
          title="Reset view"
          style={{
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 2px 8px rgba(0,48,72,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Locate className="w-3.5 h-3.5 text-navy/40 group-hover:text-red transition-colors duration-300" />
        </button>
      </div>

      {/* Counter Badge */}
      <div className="absolute bottom-12 left-4 z-[1000]">
        <div
          className="relative px-4 py-2.5 rounded-full text-[11px] font-medium overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.92)',
            color: 'rgba(0,48,72,0.6)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 10px rgba(0,48,72,0.06)',
          }}
        >
          <span className="relative z-10">
            {filterCity === 'All' ? (
              <>
                <span className="text-red font-bold text-[13px]">{displayCount}</span>
                <span className="mx-1">stores across</span>
                <span className="text-red font-bold text-[13px]">{cityCountNum}</span>
                <span className="ml-1">cities</span>
              </>
            ) : (
              <>
                <span className="text-red font-bold text-[13px]">{displayCount}</span>
                <span className="mx-1">{displayCount === 1 ? 'store' : 'stores'} in</span>
                <span className="font-bold text-navy">{filterCity}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Custom Branding — replaces default map attribution */}
      <div className="absolute bottom-2 left-3 sm:left-4 z-[1000]">
        <div className="flex items-center gap-[3px] sm:gap-1 text-[8px] sm:text-[9px] font-medium">
          <img
            src="/images/branding/mahkota-taiwan-logo.png"
            alt="Mahkota Taiwan"
            className="h-[14px] sm:h-[16px] w-auto object-contain"
            style={{ opacity: 0.8 }}
          />
          <span className="font-semibold" style={{ color: 'rgba(0,48,72,0.55)' }}>Mahkota Taiwan</span>
          <span className="mx-[1px]" style={{ color: 'rgba(0,48,72,0.35)' }}>Interactive Map by</span>
          <img
            src="/images/branding/the-orange-fox-logo.png"
            alt="The Orange Fox"
            className="h-[9px] sm:h-[11px] w-auto object-contain -mr-[1px]"
          />
          <span className="font-bold" style={{ color: '#E8870C' }}>The Orange Fox</span>
        </div>
      </div>

      {/* ─── Map ─── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: '#1565C0' }}>
        <DecorativeElements />
        <OceanWaterEffects />
        <div
          ref={mapContainerRef}
          className="illustrated-map w-full h-[600px] sm:h-[750px] lg:h-[900px] overflow-hidden"
          style={{ background: '#1565C0' }}
        />
      </div>

      {/* ─── Store popup ─── */}
      {selectedStore && (
        <div ref={popupRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md">
          <div className="relative bg-white border border-cream-dark/20 rounded-[1.5rem] p-6 shadow-[0_20px_80px_rgba(0,48,72,0.12)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red via-red/60 to-transparent" />
            <button onClick={handleClosePopup} className="absolute top-3 right-3 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center bg-cream-light hover:bg-red/10 active:bg-red/20 rounded-full transition-all duration-200 group cursor-pointer z-20" style={{ touchAction: 'manipulation' }}>
              <X className="w-5 h-5 text-navy/50 group-hover:text-red group-active:text-red transition-colors" />
            </button>
            <span className={`inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full border ${storeTypeColor(selectedStore.store_type)} mb-3`}>
              {storeTypeLabel(selectedStore.store_type)}
            </span>
            <h3 className="text-xl font-heading font-bold text-navy mb-3 pr-8 leading-tight">{selectedStore.name}</h3>
            <div className="w-12 h-0.5 bg-gradient-to-r from-red to-red/0 rounded-full mb-4" />
            <div className="flex items-start gap-3 mb-3">
              <Navigation className="w-4 h-4 text-red mt-0.5 shrink-0" />
              <div>
                <p className="text-navy/70 text-sm leading-relaxed">{selectedStore.address}</p>
                <p className="text-navy/40 text-xs mt-1">{selectedStore.city}{selectedStore.district ? `, ${selectedStore.district}` : ''}</p>
              </div>
            </div>
            {selectedStore.contact && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-red shrink-0" />
                <a href={`tel:${selectedStore.contact}`} className="text-navy/70 text-sm hover:text-red transition-colors">{selectedStore.contact}</a>
              </div>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.lat},${selectedStore.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-red hover:bg-red-dark rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-red/20 active:scale-[0.98]"
            >
              <Navigation className="w-4 h-4" /> Get Directions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
