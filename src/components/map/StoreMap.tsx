'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, Phone, Navigation, X, ChevronDown, Locate, Plus, Minus } from 'lucide-react';
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
      background: #2E8BC9 !important;
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
  'Pingtung', 'Yilan', 'Hualien', 'Taitung', 'Penghu', 'Kinmen',
  'Lienchiang',
];

interface StoreMapProps {
  stores: StoreLocation[];
}

/* ─── Ocean Water Animated Effects ─── */
function OceanWaterEffects() {
  /* Ocean-only zones: left ocean (0-38%), right ocean (65-100%), bottom (70-100%) */
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[490]">

      {/* ✨ Ocean sparkles — twinkling light reflections */}
      {[
        { top: '20%', left: '8%', delay: '0s' },
        { top: '45%', left: '25%', delay: '1.5s' },
        { top: '65%', left: '12%', delay: '3s' },
        { top: '35%', left: '80%', delay: '0.8s' },
        { top: '55%', left: '90%', delay: '2.5s' },
        { top: '75%', left: '75%', delay: '4s' },
        { top: '30%', left: '18%', delay: '5s' },
        { top: '50%', left: '88%', delay: '1s' },
      ].map((s, i) => (
        <svg key={`sparkle-${i}`} style={{ position: 'absolute', top: s.top, left: s.left, width: '12px', height: '12px' }} viewBox="0 0 12 12">
          <path d="M6 0 L7 4.5 L12 6 L7 7.5 L6 12 L5 7.5 L0 6 L5 4.5 Z" fill="white">
            <animate attributeName="opacity" values="0;0.7;0" dur="3s" begin={s.delay} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="scale" values="0.5;1;0.5" dur="3s" begin={s.delay} repeatCount="indefinite" additive="sum" />
          </path>
        </svg>
      ))}

      {/* 🫧 Foam patches near shoreline */}
      <div style={{ position: 'absolute', top: '30%', left: '33%', width: '40px', height: '20px', opacity: 0.4 }}>
        <svg viewBox="0 0 40 20" fill="none" width="40" height="20">
          <circle cx="6" cy="14" r="5" fill="white" opacity="0.5"><animate attributeName="r" values="4;6;4" dur="4s" repeatCount="indefinite"/></circle>
          <circle cx="16" cy="12" r="4" fill="white" opacity="0.4"><animate attributeName="r" values="3;5;3" dur="3.5s" repeatCount="indefinite" begin="0.5s"/></circle>
          <circle cx="24" cy="15" r="3.5" fill="white" opacity="0.35"><animate attributeName="r" values="3;4.5;3" dur="4.5s" repeatCount="indefinite" begin="1s"/></circle>
          <circle cx="33" cy="13" r="4.5" fill="white" opacity="0.4"><animate attributeName="r" values="3.5;5.5;3.5" dur="3.8s" repeatCount="indefinite" begin="1.5s"/></circle>
        </svg>
      </div>

      <div style={{ position: 'absolute', top: '45%', left: '65%', width: '40px', height: '20px', opacity: 0.4, transform: 'scaleX(-1)' }}>
        <svg viewBox="0 0 40 20" fill="none" width="40" height="20">
          <circle cx="6" cy="14" r="5" fill="white" opacity="0.5"><animate attributeName="r" values="4;6;4" dur="4.2s" repeatCount="indefinite"/></circle>
          <circle cx="16" cy="12" r="4" fill="white" opacity="0.4"><animate attributeName="r" values="3;5;3" dur="3.7s" repeatCount="indefinite" begin="0.8s"/></circle>
          <circle cx="24" cy="15" r="3.5" fill="white" opacity="0.35"><animate attributeName="r" values="3;4.5;3" dur="4.3s" repeatCount="indefinite" begin="1.2s"/></circle>
          <circle cx="33" cy="13" r="4.5" fill="white" opacity="0.4"><animate attributeName="r" values="3.5;5.5;3.5" dur="4s" repeatCount="indefinite" begin="2s"/></circle>
        </svg>
      </div>

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
      <div className="ocean-creature">
      <div style={{ position: 'absolute', top: '25%', left: '0%', width: '38%', height: '28px', overflow: 'hidden' }}>
        <svg style={{ animation: 'boatSail 45s linear infinite', opacity: 0.7 }} viewBox="0 0 50 20" width="50" height="20" fill="none">
          <path d="M5 14 L10 14 L12 10 L15 6 L15 10 L25 10 L27 14 L30 14 L28 18 L3 18 Z" fill="#1A4F6E" />
          <line x1="15" y1="6" x2="15" y2="3" stroke="#1A4F6E" strokeWidth="1.5" />
          <polygon points="15,3 15,7 19,7" fill="#E85A3A" opacity="0.9" />
        </svg>
      </div>
      </div>

      {/* Jellyfish — right ocean only */}
      <div className="ocean-creature">
      <svg style={{ position: 'absolute', bottom: '35%', right: '8%', width: '24px', height: '34px', opacity: 0.6, animation: 'jellyfishDrift 10s ease-in-out infinite' }} viewBox="0 0 20 30" fill="none">
        <ellipse cx="10" cy="8" rx="8" ry="8" fill="#D988E8" />
        <ellipse cx="10" cy="8" rx="5" ry="5" fill="#E8A8F5" opacity="0.5" />
        <path d="M4 16 Q6 22 5 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M8 16 Q9 24 7 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M12 16 Q11 24 13 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M16 16 Q14 22 15 28" stroke="#C77DDB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      </div>

      {/* Starfish — bottom-left ocean floor */}
      <div className="ocean-creature">
      <svg style={{ position: 'absolute', bottom: '6%', left: '12%', width: '22px', height: '22px', opacity: 0.65, animation: 'bobFloat 7s ease-in-out infinite 2s' }} viewBox="0 0 24 24" fill="#E8714A">
        <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5 2.5-7.5-6-4.5h7.5z" />
      </svg>
      </div>

      {/* Seaweed — bottom ocean areas only */}
      <div className="ocean-creature">
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
      </div>

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

      {/* ═══ LEFT OCEAN — South China Sea (0-33%) ═══ */}
      {/* Fish swimming left ocean */}
      <div className="ocean-creature" style={{ position: 'absolute', top: 0, left: 0, width: '25%', height: '100%', overflow: 'hidden' }}>
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
        {/* Dolphin — swimming right in left ocean (desktop only) */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '35%', left: 0, width: '100%', height: '30px', overflow: 'visible' }}>
          <svg style={{ animation: 'dolphinSwimRight 20s ease-in-out infinite' }} viewBox="0 0 52 30" fill="none" width="52" height="30">
            {/* Body */}
            <path d="M10 18 Q14 6 26 5 Q38 4 44 12 Q46 15 42 17 Q38 19 30 20 Q20 22 10 18Z" fill="#5BAED6" opacity="0.85"/>
            {/* Belly highlight */}
            <path d="M18 18 Q26 22 36 17 Q30 20 22 20Z" fill="#B8E6F8" opacity="0.7"/>
            {/* Eye */}
            <circle cx="38" cy="11" r="1.3" fill="#1A3D4E"/>
            {/* Dorsal fin */}
            <path d="M24 8 L22 1 L28 7Z" fill="#4A9EC0" opacity="0.9"/>
            {/* Tail */}
            <path d="M10 16 Q4 10 6 6" stroke="#5BAED6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            <path d="M10 18 Q4 22 6 26" stroke="#5BAED6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            {/* Mouth line (smile) */}
            <path d="M42 14 Q44 15 43 16" stroke="#3A8AB0" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
        {/* ── Desktop-only: extra fish & jellyfish in left ocean ── */}
        {/* Jellyfish 1 — drifting mid-left */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '45%', left: '35%', animation: 'jellyDriftDown 14s ease-in-out infinite' }}>
          <svg viewBox="0 0 22 32" fill="none" width="26" height="36" style={{ opacity: 0.55 }}>
            <ellipse cx="11" cy="9" rx="9" ry="9" fill="#B388FF" />
            <ellipse cx="11" cy="9" rx="6" ry="6" fill="#CE93D8" opacity="0.45" />
            <path d="M4 18 Q6 26 5 32" stroke="#AB47BC" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M4 18 Q6 26 5 32;M4 18 Q3 26 6 32;M4 18 Q6 26 5 32" dur="3s" repeatCount="indefinite"/></path>
            <path d="M8 18 Q9 28 7 32" stroke="#AB47BC" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M8 18 Q9 28 7 32;M8 18 Q7 28 9 32;M8 18 Q9 28 7 32" dur="3.5s" repeatCount="indefinite"/></path>
            <path d="M14 18 Q13 28 15 32" stroke="#AB47BC" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M14 18 Q13 28 15 32;M14 18 Q15 28 13 32;M14 18 Q13 28 15 32" dur="2.8s" repeatCount="indefinite"/></path>
            <path d="M18 18 Q16 26 17 32" stroke="#AB47BC" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M18 18 Q16 26 17 32;M18 18 Q19 26 16 32;M18 18 Q16 26 17 32" dur="3.2s" repeatCount="indefinite"/></path>
          </svg>
        </div>
        {/* Jellyfish 2 — smaller, higher */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '22%', left: '55%', animation: 'jellyDriftDown 18s ease-in-out infinite 4s' }}>
          <svg viewBox="0 0 18 26" fill="none" width="20" height="28" style={{ opacity: 0.45 }}>
            <ellipse cx="9" cy="7" rx="7" ry="7" fill="#80CBC4" />
            <ellipse cx="9" cy="7" rx="4.5" ry="4.5" fill="#B2DFDB" opacity="0.5" />
            <path d="M3 14 Q5 20 4 26" stroke="#4DB6AC" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M3 14 Q5 20 4 26;M3 14 Q2 20 5 26;M3 14 Q5 20 4 26" dur="3s" repeatCount="indefinite"/></path>
            <path d="M7 14 Q8 22 6 26" stroke="#4DB6AC" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M7 14 Q8 22 6 26;M7 14 Q6 22 8 26;M7 14 Q8 22 6 26" dur="2.6s" repeatCount="indefinite"/></path>
            <path d="M11 14 Q10 22 12 26" stroke="#4DB6AC" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M11 14 Q10 22 12 26;M11 14 Q12 22 10 26;M11 14 Q10 22 12 26" dur="3.4s" repeatCount="indefinite"/></path>
            <path d="M15 14 Q13 20 14 26" stroke="#4DB6AC" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M15 14 Q13 20 14 26;M15 14 Q16 20 13 26;M15 14 Q13 20 14 26" dur="2.9s" repeatCount="indefinite"/></path>
          </svg>
        </div>
        {/* Blue striped fish — swimming right */}
        <svg className="hidden lg:block" style={{ position: 'absolute', top: '30%', left: '-25px', animation: 'fishSwimRight 25s linear infinite 4s' }} viewBox="0 0 26 12" fill="none" width="26" height="12">
          <ellipse cx="11" cy="6" rx="9" ry="4.5" fill="#42A5F5" opacity="0.75"/>
          <line x1="6" y1="3" x2="6" y2="9" stroke="#1E88E5" strokeWidth="0.8" opacity="0.5"/>
          <line x1="10" y1="2" x2="10" y2="10" stroke="#1E88E5" strokeWidth="0.8" opacity="0.5"/>
          <line x1="14" y1="3" x2="14" y2="9" stroke="#1E88E5" strokeWidth="0.8" opacity="0.5"/>
          <polygon points="20,6 26,2 26,10" fill="#42A5F5" opacity="0.75"/>
          <circle cx="5" cy="5" r="1.2" fill="white"/>
          <circle cx="5" cy="5" r="0.6" fill="#333"/>
        </svg>
        {/* Small green fish school — swimming right */}
        <svg className="hidden lg:block" style={{ position: 'absolute', top: '78%', left: '-30px', animation: 'fishSwimRight 22s linear infinite 12s' }} viewBox="0 0 50 20" fill="none" width="50" height="20">
          <ellipse cx="8" cy="6" rx="5" ry="2.5" fill="#66BB6A" opacity="0.7"/><polygon points="13,6 17,3 17,9" fill="#66BB6A" opacity="0.7"/><circle cx="5" cy="5" r="0.8" fill="white"/>
          <ellipse cx="22" cy="12" rx="5" ry="2.5" fill="#66BB6A" opacity="0.65"/><polygon points="27,12 31,9 31,15" fill="#66BB6A" opacity="0.65"/><circle cx="19" cy="11" r="0.8" fill="white"/>
          <ellipse cx="36" cy="8" rx="4.5" ry="2.2" fill="#66BB6A" opacity="0.6"/><polygon points="40.5,8 44,5.5 44,10.5" fill="#66BB6A" opacity="0.6"/><circle cx="33" cy="7" r="0.7" fill="white"/>
        </svg>
        {/* Orca — bobbing in left ocean (desktop only) */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '70%', left: '10%', animation: 'orcaBob 8s ease-in-out infinite' }}>
          <svg viewBox="0 0 60 30" fill="none" width="60" height="30">
            {/* Main body */}
            <ellipse cx="30" cy="15" rx="22" ry="11" fill="#1A1A2E" opacity="0.9"/>
            {/* White belly */}
            <ellipse cx="32" cy="20" rx="15" ry="5" fill="white" opacity="0.85"/>
            {/* White eye patch */}
            <ellipse cx="42" cy="11" rx="4.5" ry="3" fill="white" opacity="0.9"/>
            {/* Eye */}
            <circle cx="43" cy="11" r="1.3" fill="#1A1A2E"/>
            {/* Dorsal fin — tall */}
            <path d="M26 4 L24 -4 L30 4Z" fill="#1A1A2E"/>
            {/* Tail flukes */}
            <path d="M8 12 Q2 6 4 2" stroke="#1A1A2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M8 18 Q2 24 4 28" stroke="#1A1A2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* White belly patch near tail */}
            <ellipse cx="16" cy="18" rx="5" ry="2.5" fill="white" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* ═══ RIGHT OCEAN — Pacific (70-100%) ═══ */}
      <div className="ocean-creature" style={{ position: 'absolute', top: 0, left: '78%', width: '22%', height: '100%', overflow: 'hidden' }}>
        {/* Dolphin 1 — proper dolphin swimming left in right ocean */}
        <div className="sea-creature-dolphin ocean-creature" style={{ position: 'absolute', top: '25%', left: 0, width: '100%', height: '30px', overflow: 'visible' }}>
          <svg style={{ animation: 'dolphinSwimLeft 22s ease-in-out infinite' }} viewBox="0 0 52 30" fill="none">
            {/* Body */}
            <path d="M10 18 Q14 6 26 5 Q38 4 44 12 Q46 15 42 17 Q38 19 30 20 Q20 22 10 18Z" fill="#5BAED6" opacity="0.85"/>
            {/* Belly highlight */}
            <path d="M18 18 Q26 22 36 17 Q30 20 22 20Z" fill="#B8E6F8" opacity="0.7"/>
            {/* Eye */}
            <circle cx="38" cy="11" r="1.3" fill="#1A3D4E"/>
            {/* Dorsal fin */}
            <path d="M24 8 L22 1 L28 7Z" fill="#4A9EC0" opacity="0.9"/>
            {/* Tail */}
            <path d="M10 16 Q4 10 6 6" stroke="#5BAED6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            <path d="M10 18 Q4 22 6 26" stroke="#5BAED6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            {/* Mouth line (smile) */}
            <path d="M42 14 Q44 15 43 16" stroke="#3A8AB0" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
        {/* Dolphin 2 — second dolphin swimming left (desktop only) */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '45%', left: 0, width: '100%', height: '30px', overflow: 'visible' }}>
          <svg style={{ animation: 'dolphinSwimLeft 26s ease-in-out infinite 5s' }} viewBox="0 0 52 30" fill="none" width="52" height="30">
            {/* Body */}
            <path d="M10 18 Q14 6 26 5 Q38 4 44 12 Q46 15 42 17 Q38 19 30 20 Q20 22 10 18Z" fill="#5BAED6" opacity="0.85"/>
            {/* Belly highlight */}
            <path d="M18 18 Q26 22 36 17 Q30 20 22 20Z" fill="#B8E6F8" opacity="0.7"/>
            {/* Eye */}
            <circle cx="38" cy="11" r="1.3" fill="#1A3D4E"/>
            {/* Dorsal fin */}
            <path d="M24 8 L22 1 L28 7Z" fill="#4A9EC0" opacity="0.9"/>
            {/* Tail */}
            <path d="M10 16 Q4 10 6 6" stroke="#5BAED6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            <path d="M10 18 Q4 22 6 26" stroke="#5BAED6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            {/* Mouth line (smile) */}
            <path d="M42 14 Q44 15 43 16" stroke="#3A8AB0" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
        {/* Orca — bobbing in right ocean */}
        <div className="sea-creature-orca ocean-creature" style={{ position: 'absolute', top: '65%', left: '15%', animation: 'orcaBob 9s ease-in-out infinite 2s' }}>
          <svg viewBox="0 0 60 30" fill="none" style={{ transform: 'scaleX(-1)' }}>
            {/* Main body */}
            <ellipse cx="30" cy="15" rx="22" ry="11" fill="#1A1A2E" opacity="0.9"/>
            {/* White belly */}
            <ellipse cx="32" cy="20" rx="15" ry="5" fill="white" opacity="0.85"/>
            {/* White eye patch */}
            <ellipse cx="42" cy="11" rx="4.5" ry="3" fill="white" opacity="0.9"/>
            {/* Eye */}
            <circle cx="43" cy="11" r="1.3" fill="#1A1A2E"/>
            {/* Dorsal fin — tall */}
            <path d="M26 4 L24 -4 L30 4Z" fill="#1A1A2E"/>
            {/* Tail flukes */}
            <path d="M8 12 Q2 6 4 2" stroke="#1A1A2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M8 18 Q2 24 4 28" stroke="#1A1A2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* White belly patch near tail */}
            <ellipse cx="16" cy="18" rx="5" ry="2.5" fill="white" opacity="0.6"/>
          </svg>
        </div>
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
        {/* ── Desktop-only: extra fish & jellyfish in right ocean ── */}
        {/* Jellyfish — drifting in right ocean */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '35%', left: '40%', animation: 'jellyDriftDown 16s ease-in-out infinite 2s' }}>
          <svg viewBox="0 0 22 32" fill="none" width="28" height="38" style={{ opacity: 0.5 }}>
            <ellipse cx="11" cy="9" rx="9" ry="9" fill="#F48FB1" />
            <ellipse cx="11" cy="9" rx="6" ry="6" fill="#F8BBD0" opacity="0.5" />
            <path d="M4 18 Q6 26 5 32" stroke="#EC407A" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M4 18 Q6 26 5 32;M4 18 Q3 26 6 32;M4 18 Q6 26 5 32" dur="3s" repeatCount="indefinite"/></path>
            <path d="M8 18 Q9 28 7 32" stroke="#EC407A" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M8 18 Q9 28 7 32;M8 18 Q7 28 9 32;M8 18 Q9 28 7 32" dur="3.5s" repeatCount="indefinite"/></path>
            <path d="M14 18 Q13 28 15 32" stroke="#EC407A" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M14 18 Q13 28 15 32;M14 18 Q15 28 13 32;M14 18 Q13 28 15 32" dur="2.8s" repeatCount="indefinite"/></path>
            <path d="M18 18 Q16 26 17 32" stroke="#EC407A" strokeWidth="1.2" fill="none" strokeLinecap="round"><animate attributeName="d" values="M18 18 Q16 26 17 32;M18 18 Q19 26 16 32;M18 18 Q16 26 17 32" dur="3.2s" repeatCount="indefinite"/></path>
          </svg>
        </div>
        {/* Small jellyfish — lower right */}
        <div className="hidden lg:block ocean-creature" style={{ position: 'absolute', top: '80%', left: '60%', animation: 'jellyDriftDown 12s ease-in-out infinite 7s' }}>
          <svg viewBox="0 0 16 24" fill="none" width="18" height="26" style={{ opacity: 0.4 }}>
            <ellipse cx="8" cy="6" rx="6" ry="6" fill="#81D4FA" />
            <ellipse cx="8" cy="6" rx="4" ry="4" fill="#B3E5FC" opacity="0.5" />
            <path d="M3 12 Q5 18 4 24" stroke="#29B6F6" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M3 12 Q5 18 4 24;M3 12 Q2 18 5 24;M3 12 Q5 18 4 24" dur="2.5s" repeatCount="indefinite"/></path>
            <path d="M8 12 Q9 20 7 24" stroke="#29B6F6" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M8 12 Q9 20 7 24;M8 12 Q7 20 9 24;M8 12 Q9 20 7 24" dur="3s" repeatCount="indefinite"/></path>
            <path d="M13 12 Q11 18 12 24" stroke="#29B6F6" strokeWidth="1" fill="none" strokeLinecap="round"><animate attributeName="d" values="M13 12 Q11 18 12 24;M13 12 Q14 18 11 24;M13 12 Q11 18 12 24" dur="2.8s" repeatCount="indefinite"/></path>
          </svg>
        </div>
        {/* Purple fish — swimming left */}
        <svg className="hidden lg:block" style={{ position: 'absolute', top: '15%', right: '-20px', animation: 'fishSwimLeft 20s linear infinite 3s' }} viewBox="0 0 24 12" fill="none" width="24" height="12">
          <ellipse cx="10" cy="6" rx="8" ry="4" fill="#7E57C2" opacity="0.7"/>
          <polygon points="18,6 24,2 24,10" fill="#7E57C2" opacity="0.7"/>
          <circle cx="5" cy="5" r="1.2" fill="white"/><circle cx="5" cy="5" r="0.5" fill="#333"/>
          <path d="M10 3 L10 1.5" stroke="#9575CD" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
        </svg>
        {/* Teal fish pair — swimming left */}
        <svg className="hidden lg:block" style={{ position: 'absolute', top: '90%', right: '-30px', animation: 'fishSwimLeft 26s linear infinite 15s' }} viewBox="0 0 44 16" fill="none" width="44" height="16">
          <ellipse cx="10" cy="5" rx="7" ry="3" fill="#26A69A" opacity="0.65"/><polygon points="17,5 22,2 22,8" fill="#26A69A" opacity="0.65"/><circle cx="5" cy="4" r="0.9" fill="white"/>
          <ellipse cx="28" cy="11" rx="6" ry="2.8" fill="#26A69A" opacity="0.6"/><polygon points="34,11 38,8.5 38,13.5" fill="#26A69A" opacity="0.6"/><circle cx="24" cy="10" r="0.8" fill="white"/>
        </svg>
      </div>

      {/* ═══ BOTTOM OCEAN — wave lines (bottom 20%) ═══ */}
      <div className="ocean-creature">
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '25px', animation: 'waveMove 12s linear infinite', opacity: 0.35 }}>
        <svg viewBox="0 0 1200 25" fill="none" width="100%" height="25" preserveAspectRatio="none">
          <path d="M0 12 Q50 0 100 12 Q150 25 200 12 Q250 0 300 12 Q350 25 400 12 Q450 0 500 12 Q550 25 600 12 Q650 0 700 12 Q750 25 800 12 Q850 0 900 12 Q950 25 1000 12 Q1050 0 1100 12 Q1150 25 1200 12" stroke="#FFFFFF" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      </div>

      {/* ═══ CRABS — at shoreline, always visible ═══ */}
      {/* Crab 1 — left shoreline */}
      <div style={{ position: 'absolute', top: '55%', left: '36%', animation: 'crabWalk 8s ease-in-out infinite' }}>
        <svg viewBox="0 0 28 20" fill="none" width="20" height="14">
          {/* Body */}
          <ellipse cx="14" cy="12" rx="8" ry="5" fill="#E85A3A"/>
          <ellipse cx="14" cy="12" rx="6" ry="3.5" fill="#F07050"/>
          {/* Eyes on stalks */}
          <line x1="10" y1="8" x2="8" y2="5" stroke="#E85A3A" strokeWidth="1.5"/>
          <circle cx="8" cy="4.5" r="1.5" fill="#E85A3A"/>
          <circle cx="8" cy="4.5" r="0.8" fill="#111"/>
          <line x1="18" y1="8" x2="20" y2="5" stroke="#E85A3A" strokeWidth="1.5"/>
          <circle cx="20" cy="4.5" r="1.5" fill="#E85A3A"/>
          <circle cx="20" cy="4.5" r="0.8" fill="#111"/>
          {/* Claws */}
          <path d="M6 11 Q2 8 3 6 Q4 5 5 7 Q5 9 6 10" fill="#E85A3A"/>
          <path d="M22 11 Q26 8 25 6 Q24 5 23 7 Q23 9 22 10" fill="#E85A3A"/>
          {/* Legs */}
          <line x1="8" y1="14" x2="4" y2="17" stroke="#C04020" strokeWidth="1"/>
          <line x1="10" y1="15" x2="7" y2="18" stroke="#C04020" strokeWidth="1"/>
          <line x1="18" y1="15" x2="21" y2="18" stroke="#C04020" strokeWidth="1"/>
          <line x1="20" y1="14" x2="24" y2="17" stroke="#C04020" strokeWidth="1"/>
        </svg>
      </div>

      {/* Crab 2 — right shoreline */}
      <div style={{ position: 'absolute', top: '48%', left: '63%', animation: 'crabWalk 10s ease-in-out infinite 3s', transform: 'scaleX(-1)' }}>
        <svg viewBox="0 0 28 20" fill="none" width="18" height="12">
          <ellipse cx="14" cy="12" rx="8" ry="5" fill="#D94E30"/>
          <ellipse cx="14" cy="12" rx="6" ry="3.5" fill="#E86850"/>
          <line x1="10" y1="8" x2="8" y2="5" stroke="#D94E30" strokeWidth="1.5"/>
          <circle cx="8" cy="4.5" r="1.5" fill="#D94E30"/>
          <circle cx="8" cy="4.5" r="0.8" fill="#111"/>
          <line x1="18" y1="8" x2="20" y2="5" stroke="#D94E30" strokeWidth="1.5"/>
          <circle cx="20" cy="4.5" r="1.5" fill="#D94E30"/>
          <circle cx="20" cy="4.5" r="0.8" fill="#111"/>
          <path d="M6 11 Q2 8 3 6 Q4 5 5 7 Q5 9 6 10" fill="#D94E30"/>
          <path d="M22 11 Q26 8 25 6 Q24 5 23 7 Q23 9 22 10" fill="#D94E30"/>
          <line x1="8" y1="14" x2="4" y2="17" stroke="#B03818" strokeWidth="1"/>
          <line x1="10" y1="15" x2="7" y2="18" stroke="#B03818" strokeWidth="1"/>
          <line x1="18" y1="15" x2="21" y2="18" stroke="#B03818" strokeWidth="1"/>
          <line x1="20" y1="14" x2="24" y2="17" stroke="#B03818" strokeWidth="1"/>
        </svg>
      </div>

      {/* Crab 3 — in ocean bottom area */}
      <div style={{ position: 'absolute', top: '82%', left: '18%', animation: 'crabWalk 12s ease-in-out infinite 6s' }}>
        <svg viewBox="0 0 28 20" fill="none" width="16" height="11">
          <ellipse cx="14" cy="12" rx="8" ry="5" fill="#E06040"/>
          <ellipse cx="14" cy="12" rx="6" ry="3.5" fill="#F08060"/>
          <line x1="10" y1="8" x2="8" y2="5" stroke="#E06040" strokeWidth="1.5"/>
          <circle cx="8" cy="4.5" r="1.5" fill="#E06040"/>
          <circle cx="8" cy="4.5" r="0.8" fill="#111"/>
          <line x1="18" y1="8" x2="20" y2="5" stroke="#E06040" strokeWidth="1.5"/>
          <circle cx="20" cy="4.5" r="1.5" fill="#E06040"/>
          <circle cx="20" cy="4.5" r="0.8" fill="#111"/>
          <path d="M6 11 Q2 8 3 6 Q4 5 5 7 Q5 9 6 10" fill="#E06040"/>
          <path d="M22 11 Q26 8 25 6 Q24 5 23 7 Q23 9 22 10" fill="#E06040"/>
          <line x1="8" y1="14" x2="4" y2="17" stroke="#C04828" strokeWidth="1"/>
          <line x1="10" y1="15" x2="7" y2="18" stroke="#C04828" strokeWidth="1"/>
          <line x1="18" y1="15" x2="21" y2="18" stroke="#C04828" strokeWidth="1"/>
          <line x1="20" y1="14" x2="24" y2="17" stroke="#C04828" strokeWidth="1"/>
        </svg>
      </div>

      {/* ═══ TAIWAN LAND ANIMALS — positioned over Taiwan area (42-60%, 28-58%) ═══ */}

      {/* 1. Formosan Macaque (monkey) — sitting on mid Taiwan */}
      <div className="land-creature" style={{ position: 'absolute', top: '55%', left: '52%' }}>
        <svg style={{ width: '22px', height: '24px', opacity: 0.7, animation: 'monkeyBob 4s ease-in-out infinite' }} viewBox="0 0 24 28" fill="none">
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
      </div>

      {/* 2. Cat — near south Taiwan */}
      <div className="land-creature" style={{ position: 'absolute', top: '68%', left: '50%' }}>
        <svg style={{ width: '18px', height: '20px', opacity: 0.65, animation: 'catTail 3s ease-in-out infinite 1s' }} viewBox="0 0 20 24" fill="none">
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
      </div>

      {/* 3. Sika Deer — north Taiwan */}
      <div className="land-creature" style={{ position: 'absolute', top: '22%', left: '49%' }}>
        <svg style={{ width: '24px', height: '26px', opacity: 0.65, animation: 'bobFloat 5s ease-in-out infinite 2s' }} viewBox="0 0 28 32" fill="none">
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
      </div>

      {/* 4. Butterfly — fluttering near Taiwan */}
      <div className="land-creature" style={{ position: 'absolute', top: '35%', left: '57%' }}>
        <svg style={{ width: '20px', height: '16px', opacity: 0.7, animation: 'butterflyFloat 6s ease-in-out infinite' }} viewBox="0 0 24 18" fill="none">
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
      </div>

      {/* 5. Taiwan Blue Magpie — perched near Taiwan */}
      <div className="land-creature" style={{ position: 'absolute', top: '30%', left: '46%' }}>
        <svg style={{ width: '22px', height: '22px', opacity: 0.65, animation: 'bobFloat 4.5s ease-in-out infinite 3s' }} viewBox="0 0 26 28" fill="none">
          <ellipse cx="13" cy="10" rx="5" ry="4.5" fill="#2962A5"/>
          <circle cx="13" cy="5" r="3.5" fill="#1A1A2E"/>
          <circle cx="14.5" cy="4.5" r="0.8" fill="white"/>
          <polygon points="16,5 20,4.5 16,6" fill="#E85A3A"/>
          <path d="M8 14 Q4 22 6 28" stroke="#2962A5" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M10 14 Q8 20 10 26" stroke="#4A8AD4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <line x1="13" y1="14" x2="12" y2="18" stroke="#8B6914" strokeWidth="1"/>
          <line x1="15" y1="14" x2="16" y2="18" stroke="#8B6914" strokeWidth="1"/>
        </svg>
      </div>

      {/* 6. Dog (Shiba Inu) — cute dog near mid Taiwan */}
      <div className="land-creature" style={{ position: 'absolute', top: '44%', left: '44%' }}>
        <svg style={{ width: '20px', height: '22px', opacity: 0.7, animation: 'bobFloat 4s ease-in-out infinite 1.5s' }} viewBox="0 0 24 28" fill="none">
          {/* Body */}
          <ellipse cx="12" cy="18" rx="7" ry="6" fill="#D4A854"/>
          {/* Head */}
          <circle cx="12" cy="9" r="6" fill="#D4A854"/>
          {/* Ears */}
          <polygon points="5,6 7,0 9,6" fill="#8B6914"/>
          <polygon points="15,6 17,0 19,6" fill="#8B6914"/>
          {/* Eyes */}
          <circle cx="9.5" cy="8" r="1.2" fill="#333"/>
          <circle cx="14.5" cy="8" r="1.2" fill="#333"/>
          {/* Eye shine */}
          <circle cx="10" cy="7.5" r="0.4" fill="white"/>
          <circle cx="15" cy="7.5" r="0.4" fill="white"/>
          {/* Nose */}
          <ellipse cx="12" cy="11" rx="1.2" ry="0.8" fill="#333"/>
          {/* Tongue */}
          <ellipse cx="12" cy="13" rx="1" ry="1.5" fill="#FF9999"/>
          {/* Mouth lines */}
          <path d="M10.5 11.5 Q12 12.5 13.5 11.5" stroke="#333" strokeWidth="0.4" fill="none"/>
          {/* Legs */}
          <line x1="8" y1="24" x2="8" y2="27" stroke="#C49A3C" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="24" x2="16" y2="27" stroke="#C49A3C" strokeWidth="2" strokeLinecap="round"/>
          {/* Curled tail */}
          <path d="M19 16 Q24 12 22 17" stroke="#D4A854" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      {/* 7. Alpaca — fluffy white alpaca */}
      <div className="land-creature" style={{ position: 'absolute', top: '48%', left: '56%' }}>
        <svg style={{ width: '22px', height: '26px', opacity: 0.7, animation: 'bobFloat 5.5s ease-in-out infinite 3.5s' }} viewBox="0 0 26 32" fill="none">
          {/* Fluffy body */}
          <ellipse cx="13" cy="22" rx="8" ry="6" fill="#FFF5E6"/>
          <ellipse cx="11" cy="20" rx="4" ry="3" fill="#FFFAF0" opacity="0.7"/>
          <ellipse cx="16" cy="21" rx="3.5" ry="2.5" fill="#FFFAF0" opacity="0.6"/>
          {/* Long fluffy neck */}
          <ellipse cx="13" cy="14" rx="3.5" ry="7" fill="#FFF5E6"/>
          <ellipse cx="11.5" cy="13" rx="2" ry="4" fill="#FFFAF0" opacity="0.5"/>
          {/* Fluffy head */}
          <circle cx="13" cy="6" r="4.5" fill="#FFF5E6"/>
          <circle cx="11" cy="4.5" r="2" fill="#FFFAF0" opacity="0.6"/>
          <circle cx="15" cy="4.5" r="2" fill="#FFFAF0" opacity="0.5"/>
          {/* Ears */}
          <ellipse cx="8.5" cy="4" rx="1.5" ry="2.5" fill="#FFF5E6" transform="rotate(-15 8.5 4)"/>
          <ellipse cx="8.5" cy="4" rx="0.8" ry="1.5" fill="#FFB6C1" transform="rotate(-15 8.5 4)"/>
          <ellipse cx="17.5" cy="4" rx="1.5" ry="2.5" fill="#FFF5E6" transform="rotate(15 17.5 4)"/>
          <ellipse cx="17.5" cy="4" rx="0.8" ry="1.5" fill="#FFB6C1" transform="rotate(15 17.5 4)"/>
          {/* Eyes */}
          <circle cx="11" cy="6.5" r="1" fill="#333"/>
          <circle cx="15" cy="6.5" r="1" fill="#333"/>
          <circle cx="11.3" cy="6.2" r="0.35" fill="white"/>
          <circle cx="15.3" cy="6.2" r="0.35" fill="white"/>
          {/* Smile */}
          <path d="M11.5 8.5 Q13 9.5 14.5 8.5" stroke="#999" strokeWidth="0.5" fill="none"/>
          {/* Legs */}
          <line x1="8" y1="27" x2="8" y2="31" stroke="#E8D5B7" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11" y1="27" x2="11" y2="31" stroke="#E8D5B7" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="15" y1="27" x2="15" y2="31" stroke="#E8D5B7" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="18" y1="27" x2="18" y2="31" stroke="#E8D5B7" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* ═══ CARS — driving across Taiwan land ═══ */}
      <div className="land-creature" style={{ position: 'absolute', top: '25%', left: '40%', width: '22%', height: '45%', overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Car 1 — red/orange driving left to right */}
        <div style={{ position: 'absolute', top: '45%', left: 0, width: '100%', height: '18px' }}>
          <svg style={{ animation: 'carDriveRight 28s linear infinite' }} viewBox="0 0 36 18" fill="none" width="28" height="14">
            {/* Body */}
            <rect x="3" y="7" width="30" height="8" rx="2.5" fill="#E85A3A"/>
            {/* Roof */}
            <path d="M9 7 L12 2 L24 2 L27 7Z" fill="#D04A2A"/>
            {/* Windows */}
            <path d="M13 7 L14.5 3 L18 3 L18 7Z" fill="#B3E5FC" opacity="0.9"/>
            <path d="M20 7 L20 3 L23.5 3 L25 7Z" fill="#B3E5FC" opacity="0.9"/>
            {/* Wheels */}
            <circle cx="11" cy="15" r="2.8" fill="#333"/>
            <circle cx="25" cy="15" r="2.8" fill="#333"/>
            <circle cx="11" cy="15" r="1" fill="#999"/>
            <circle cx="25" cy="15" r="1" fill="#999"/>
          </svg>
        </div>
        {/* Car 2 — blue driving right to left (desktop only) */}
        <div className="hidden lg:block" style={{ position: 'absolute', top: '55%', left: 0, width: '100%', height: '18px' }}>
          <svg style={{ animation: 'carDriveLeft 32s linear infinite 10s' }} viewBox="0 0 36 18" fill="none" width="28" height="14">
            {/* Body */}
            <rect x="3" y="7" width="30" height="8" rx="2.5" fill="#4A90D9"/>
            {/* Roof */}
            <path d="M9 7 L12 2 L24 2 L27 7Z" fill="#3A7BC0"/>
            {/* Windows */}
            <path d="M13 7 L14.5 3 L18 3 L18 7Z" fill="#B3E5FC" opacity="0.9"/>
            <path d="M20 7 L20 3 L23.5 3 L25 7Z" fill="#B3E5FC" opacity="0.9"/>
            {/* Wheels */}
            <circle cx="11" cy="15" r="2.8" fill="#333"/>
            <circle cx="25" cy="15" r="2.8" fill="#333"/>
            <circle cx="11" cy="15" r="1" fill="#999"/>
            <circle cx="25" cy="15" r="1" fill="#999"/>
          </svg>
        </div>
      </div>

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

      {/* ═══ DESKTOP-ONLY EXTRAS ═══ */}
      <div className="hidden lg:block" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Extra bird 1 */}
        <svg style={{ position: 'absolute', top: '7%', left: 0, width: '100%', height: '24px', animation: 'floatBird 15s ease-in-out infinite 2s' }} viewBox="0 0 30 16" fill="none" width="30" height="16">
          <path d="M2 10 Q6 3 10 8 M10 8 Q14 3 18 10" stroke="#2A5060" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
        {/* Extra bird 2 */}
        <svg style={{ position: 'absolute', top: '15%', left: 0, width: '100%', height: '28px', animation: 'floatBird2 20s ease-in-out infinite 6s' }} viewBox="0 0 36 18" fill="none" width="36" height="18">
          <path d="M2 12 Q8 4 14 10 M14 10 Q20 4 26 12" stroke="#1A3D4E" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </svg>
        {/* Extra cloud */}
        <svg style={{ position: 'absolute', top: '6%', left: 0, width: '100%', height: '38px', animation: 'floatCloud 45s linear infinite 12s', opacity: 0.55 }} viewBox="0 0 100 32" fill="none" width="100" height="32">
          <ellipse cx="50" cy="20" rx="40" ry="11" fill="white"/><ellipse cx="35" cy="14" rx="20" ry="10" fill="white"/><ellipse cx="65" cy="16" rx="25" ry="9" fill="white"/>
        </svg>
        {/* Extra fish — left ocean */}
        <div className="ocean-creature" style={{ position: 'absolute', top: 0, left: 0, width: '25%', height: '100%', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', top: '25%', left: '-20px', animation: 'fishSwimRight 26s linear infinite 4s' }} viewBox="0 0 22 10" fill="none" width="22" height="10">
            <ellipse cx="9" cy="5" rx="7" ry="3.5" fill="#FF9800" opacity="0.7"/><polygon points="16,5 22,2 22,8" fill="#FF9800" opacity="0.7"/><circle cx="5" cy="4" r="1" fill="white"/>
          </svg>
          <svg style={{ position: 'absolute', top: '75%', left: '-25px', animation: 'fishSwimRight 33s linear infinite 12s' }} viewBox="0 0 24 12" fill="none" width="24" height="12">
            <ellipse cx="10" cy="6" rx="8" ry="4" fill="#4DB6AC" opacity="0.7"/><polygon points="18,6 24,2 24,10" fill="#4DB6AC" opacity="0.7"/><circle cx="6" cy="5" r="1.2" fill="white"/>
          </svg>
        </div>
        {/* Extra fish — right ocean */}
        <div className="ocean-creature" style={{ position: 'absolute', top: 0, left: '78%', width: '22%', height: '100%', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', top: '40%', right: '-20px', animation: 'fishSwimLeft 24s linear infinite 7s' }} viewBox="0 0 22 10" fill="none" width="22" height="10">
            <ellipse cx="9" cy="5" rx="7" ry="3.5" fill="#AB47BC" opacity="0.7"/><polygon points="16,5 22,2 22,8" fill="#AB47BC" opacity="0.7"/><circle cx="5" cy="4" r="1" fill="white"/>
          </svg>
          <svg style={{ position: 'absolute', top: '85%', right: '-25px', animation: 'fishSwimLeft 30s linear infinite 15s' }} viewBox="0 0 24 12" fill="none" width="24" height="12">
            <ellipse cx="10" cy="6" rx="8" ry="4" fill="#26A69A" opacity="0.7"/><polygon points="18,6 24,2 24,10" fill="#26A69A" opacity="0.7"/><circle cx="6" cy="5" r="1.2" fill="white"/>
          </svg>
        </div>
        {/* Extra butterfly — near Taiwan */}
        <svg style={{ position: 'absolute', top: '48%', left: '46%', width: '18px', height: '14px', opacity: 0.65, animation: 'butterflyFloat 7s ease-in-out infinite 3s' }} viewBox="0 0 24 18" fill="none">
          <ellipse cx="12" cy="9" rx="1" ry="6" fill="#333"/>
          <ellipse cx="7" cy="6" rx="5" ry="4" fill="#FFA726" opacity="0.8" transform="rotate(-15 7 6)">
            <animate attributeName="rx" values="5;3.5;5" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="17" cy="6" rx="5" ry="4" fill="#FFA726" opacity="0.8" transform="rotate(15 17 6)">
            <animate attributeName="rx" values="5;3.5;5" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="8" cy="12" rx="3.5" ry="3" fill="#FFCC80" opacity="0.7" transform="rotate(-10 8 12)">
            <animate attributeName="rx" values="3.5;2.5;3.5" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="16" cy="12" rx="3.5" ry="3" fill="#FFCC80" opacity="0.7" transform="rotate(10 16 12)">
            <animate attributeName="rx" values="3.5;2.5;3.5" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="7" cy="5.5" r="1" fill="#FF8F00" opacity="0.6"/>
          <circle cx="17" cy="5.5" r="1" fill="#FF8F00" opacity="0.6"/>
        </svg>
      </div>

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
        @keyframes dolphinSwimRight {
          0% { transform: translateX(-60px) translateY(0); }
          15% { transform: translateX(15%) translateY(-12px); }
          30% { transform: translateX(30%) translateY(0); }
          45% { transform: translateX(45%) translateY(-8px); }
          60% { transform: translateX(60%) translateY(0); }
          75% { transform: translateX(75%) translateY(-10px); }
          100% { transform: translateX(calc(100% + 60px)) translateY(0); }
        }
        @keyframes dolphinSwimLeft {
          0% { transform: translateX(calc(100% + 60px)) scaleX(-1) translateY(0); }
          15% { transform: translateX(75%) scaleX(-1) translateY(-12px); }
          30% { transform: translateX(60%) scaleX(-1) translateY(0); }
          45% { transform: translateX(45%) scaleX(-1) translateY(-8px); }
          60% { transform: translateX(30%) scaleX(-1) translateY(0); }
          75% { transform: translateX(15%) scaleX(-1) translateY(-10px); }
          100% { transform: translateX(-60px) scaleX(-1) translateY(0); }
        }
        @keyframes orcaBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-2deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes jellyDriftDown {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          15% { transform: translateY(-10px) translateX(5px) rotate(3deg); }
          30% { transform: translateY(4px) translateX(-3px) rotate(-2deg); }
          50% { transform: translateY(-14px) translateX(8px) rotate(4deg); }
          70% { transform: translateY(-2px) translateX(-6px) rotate(-3deg); }
          85% { transform: translateY(-18px) translateX(4px) rotate(2deg); }
        }
        @keyframes crabWalk {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(8px) translateY(-2px); }
          50% { transform: translateX(-5px) translateY(1px); }
          75% { transform: translateX(10px) translateY(-1px); }
        }
        @keyframes carDriveRight {
          0% { transform: translateX(-30px); }
          100% { transform: translateX(calc(100% + 30px)); }
        }
        @keyframes carDriveLeft {
          0% { transform: translateX(calc(100% + 30px)) scaleX(-1); }
          100% { transform: translateX(-30px) scaleX(-1); }
        }

        /* Mobile: smaller dolphins & orcas */
        .sea-creature-dolphin svg { width: 32px; height: 18px; }
        .sea-creature-orca svg { width: 36px; height: 18px; }

        @media (min-width: 1024px) {
          .sea-creature-dolphin svg { width: 52px; height: 30px; }
          .sea-creature-orca svg { width: 60px; height: 30px; }
        }

        /* Hide ocean creatures when zoomed into land */
        .ocean-creature { transition: opacity 0.5s ease; }
        .zoomed-to-land .ocean-creature { opacity: 0 !important; pointer-events: none; }

        /* Show land creatures ONLY when zoomed into land */
        .land-creature { opacity: 0; transition: opacity 0.5s ease; pointer-events: none; }
        .zoomed-to-land .land-creature { opacity: 1; pointer-events: auto; }
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

    // Taiwan main island bounds — used for consistent focus across all device sizes
    const taiwanMainBounds = L.latLngBounds([21.85, 119.3], [25.4, 122.1]);

    const map = L.map(mapContainerRef.current, {
      center: [23.69, 120.96],
      zoom: 8,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: !isMobile,
      touchZoom: true,
      attributionControl: false,
      maxBounds: L.latLngBounds([20.5, 118.0], [26.5, 123.0]),
      maxBoundsViscosity: 0.9,
      minZoom: 7,
    });

    // Fit to Taiwan main island — automatically calculates optimal zoom for any screen size
    map.fitBounds(taiwanMainBounds, {
      paddingTopLeft: L.point(isMobile ? 10 : 20, isMobile ? 50 : 60),
      paddingBottomRight: L.point(isMobile ? 10 : 20, isMobile ? 50 : 60),
      maxZoom: 9,
    });

    // Invalidate size on window resize so Leaflet recalculates correctly
    const handleResize = () => { map.invalidateSize(); };
    window.addEventListener('resize', handleResize);

    L.control.attribution({ position: 'bottomleft', prefix: false }).addAttribution('© OpenStreetMap').addTo(map);

    mapRef.current = map;

    /* ── Hide ocean creatures (dolphins/orcas) when zoomed into land ── */
    const mapContainer = mapContainerRef.current.parentElement;
    const updateOceanCreatures = () => {
      if (!mapContainer) return;
      if (map.getZoom() >= 10) {
        mapContainer.classList.add('zoomed-to-land');
      } else {
        mapContainer.classList.remove('zoomed-to-land');
      }
    };
    map.on('zoomend', updateOceanCreatures);
    updateOceanCreatures(); // initial check

    /* ── Mobile: two-finger gesture handling (like Google Maps) ── */
    if (isMobile && mapContainerRef.current) {
      const container = mapContainerRef.current;
      container.style.position = 'relative';

      let touchCount = 0;

      container.addEventListener('touchstart', (e) => {
        touchCount = e.touches.length;
        if (e.touches.length >= 2) {
          map.dragging.enable();
        }
      }, { passive: true });

      container.addEventListener('touchmove', () => {
        // one-finger scroll passes through to page
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        touchCount = e.touches.length;
        if (e.touches.length < 2) {
          map.dragging.disable();
        }
      }, { passive: true });
    }

    /* Start ambient music only on real user click/tap on the map (not programmatic events) */
    const mapEl = mapContainerRef.current;
    if (mapEl) {
      const handleUserGesture = () => {
        startMusicOnInteraction();
        mapEl.removeEventListener('click', handleUserGesture);
        mapEl.removeEventListener('touchstart', handleUserGesture);
      };
      mapEl.addEventListener('click', handleUserGesture);
      mapEl.addEventListener('touchstart', handleUserGesture, { passive: true });
    }

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
            fillColor: '#3498DB',
            fillOpacity: 0.82,
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

    return () => { 
      window.removeEventListener('resize', handleResize);
      map.remove(); 
      mapRef.current = null; 
    };
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

        });
        marker.addTo(map);
        markersRef.current.push(marker);
      });
      if (cityClusters.length > 0) {
        // Fit to Taiwan main island bounds for consistent focus across all screen sizes
        const taiwanMainBounds = L.latLngBounds([21.85, 119.3], [25.4, 122.1]);
        const isMobileView = window.innerWidth < 640;
        map.fitBounds(taiwanMainBounds, {
          paddingTopLeft: L.point(isMobileView ? 10 : 20, isMobileView ? 50 : 60),
          paddingBottomRight: L.point(isMobileView ? 10 : 20, isMobileView ? 50 : 60),
          maxZoom: 9,
        });
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
      // Stop Leaflet from swallowing click/touch events on the popup
      L.DomEvent.disableClickPropagation(popupRef.current);
      L.DomEvent.disableScrollPropagation(popupRef.current);
      gsap.fromTo(popupRef.current, { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
    }
  }, [selectedStore]);

  const handleClosePopup = () => {
    if (popupRef.current) {
      gsap.to(popupRef.current, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: () => setSelectedStore(null) });
    } else setSelectedStore(null);
  };

  const handleResetView = () => {
    const map = mapRef.current; if (!map) return;
    setSelectedStore(null); setFilterCity('All');
    const taiwanMainBounds = L.latLngBounds([21.85, 119.3], [25.4, 122.1]);
    const isMobileView = window.innerWidth < 640;
    map.flyToBounds(taiwanMainBounds, {
      paddingTopLeft: L.point(isMobileView ? 10 : 20, isMobileView ? 50 : 60),
      paddingBottomRight: L.point(isMobileView ? 10 : 20, isMobileView ? 50 : 60),
      maxZoom: 9,
      duration: 1,
    });
  };

  const handleBackToAll = () => {
    const map = mapRef.current; if (!map) return;
    setSelectedStore(null); setFilterCity('All');
    const taiwanMainBounds = L.latLngBounds([21.85, 119.3], [25.4, 122.1]);
    const isMobileView = window.innerWidth < 640;
    map.flyToBounds(taiwanMainBounds, {
      paddingTopLeft: L.point(isMobileView ? 10 : 20, isMobileView ? 50 : 60),
      paddingBottomRight: L.point(isMobileView ? 10 : 20, isMobileView ? 50 : 60),
      maxZoom: 9,
      duration: 1,
    });
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
    <div className="relative w-full max-w-4xl mx-auto">
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
          <span className="mx-[1px]" style={{ color: 'rgba(0,48,72,0.35)' }}>Interactive Map by</span>{' '}
          <span className="font-bold" style={{ color: '#E8870C' }}>The <img src="/images/branding/the-orange-fox-logo.png" alt="O" style={{ display: 'inline', height: '0.75em', verticalAlign: 'middle', margin: '0 -0.5px' }} />range Fox</span>
        </div>
      </div>

      {/* ─── Map ─── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: '#2E8BC9' }}>
        <DecorativeElements />
        <OceanWaterEffects />
        <div
          ref={mapContainerRef}
          className="illustrated-map w-full h-[600px] sm:h-[750px] lg:h-[450px] overflow-hidden"
          style={{ background: '#2E8BC9' }}
        />
        {/* Custom Zoom Buttons */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy/80 backdrop-blur-md text-cream/90 hover:bg-navy hover:text-white border border-white/10 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy/80 backdrop-blur-md text-cream/90 hover:bg-navy hover:text-white border border-white/10 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ─── Store popup ─── */}
      {selectedStore && (
        <div ref={popupRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md">
          <div className="relative bg-white border border-cream-dark/20 rounded-[1.5rem] p-6 shadow-[0_20px_80px_rgba(0,48,72,0.12)]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red via-red/60 to-transparent rounded-t-[1.5rem]" />
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleClosePopup(); }} onPointerDown={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleClosePopup(); }} className="absolute -top-2 -right-2 w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-white hover:bg-red/10 active:bg-red/20 rounded-full shadow-md border border-cream-dark/20 transition-all duration-200 group cursor-pointer z-30" style={{ touchAction: 'manipulation' }}>
              <X className="w-5 h-5 text-navy/60 group-hover:text-red group-active:text-red transition-colors" />
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
