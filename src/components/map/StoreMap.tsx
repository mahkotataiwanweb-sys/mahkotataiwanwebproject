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
    /* ── Force Leaflet ocean background everywhere ── */
    .illustrated-map.leaflet-container {
      background: #A8D8EA !important;
    }
    .illustrated-map .leaflet-tile-pane {
      background: #A8D8EA !important;
    }
    .illustrated-map .leaflet-pane {
      background: transparent !important;
    }
    .illustrated-map .leaflet-tile {
      background: transparent !important;
    }
    .illustrated-map .leaflet-overlay-pane {
      background: transparent !important;
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
      background: transparent !important;
      color: rgba(0,48,72,0.3) !important;
      font-size: 9px !important;
    }
    .illustrated-map .leaflet-control-attribution a {
      color: rgba(0,48,72,0.4) !important;
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
    .premium-dropdown-trigger {
      position: relative;
      overflow: hidden;
    }
    .premium-dropdown-trigger::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(110deg, transparent 33%, rgba(255,255,255,0.4) 50%, transparent 67%);
      transform: translateX(-100%);
      transition: none;
      pointer-events: none;
    }
    .premium-dropdown-trigger:hover::after {
      animation: shimmerSlide 0.8s ease-out forwards;
    }

    /* Custom scrollbar for dropdown */
    .premium-dropdown-list::-webkit-scrollbar {
      width: 4px;
    }
    .premium-dropdown-list::-webkit-scrollbar-track {
      background: transparent;
    }
    .premium-dropdown-list::-webkit-scrollbar-thumb {
      background: rgba(193,33,38,0.15);
      border-radius: 4px;
    }
    .premium-dropdown-list::-webkit-scrollbar-thumb:hover {
      background: rgba(193,33,38,0.3);
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
      <svg width="34" height="46" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" opacity="${isActive ? '1' : '0.9'}"/>
        <circle cx="16" cy="16" r="7" fill="#FAEDD3" opacity="0.95"/>
        <circle cx="16" cy="16" r="3.5" fill="${innerDot}"/>
      </svg>
    </div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -48],
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

/* ─── Decorative SVG components ─── */
function DecorativeElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[500]">
      {/* Birds */}
      <svg style={{ position: 'absolute', top: '8%', left: 0, width: '100%', height: '40px', animation: 'floatBird 12s ease-in-out infinite' }} viewBox="0 0 40 20" fill="none" width="40" height="20">
        <path d="M2 12 Q8 4 14 10 M14 10 Q20 4 26 12" stroke="#4A6B7A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
      <svg style={{ position: 'absolute', top: '14%', left: 0, width: '100%', height: '30px', animation: 'floatBird 16s ease-in-out infinite 3s' }} viewBox="0 0 30 16" fill="none" width="30" height="16">
        <path d="M2 10 Q6 3 10 8 M10 8 Q14 3 18 10" stroke="#6B8E9E" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
      <svg style={{ position: 'absolute', top: '22%', left: 0, width: '100%', height: '26px', animation: 'floatBird2 14s ease-in-out infinite 5s' }} viewBox="0 0 26 14" fill="none" width="26" height="14">
        <path d="M2 8 Q5 2 8 6 M8 6 Q11 2 14 8" stroke="#7BA3B3" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Clouds */}
      <svg style={{ position: 'absolute', top: '6%', left: 0, width: '100%', height: '50px', animation: 'floatCloud 25s linear infinite', opacity: 0.5 }} viewBox="0 0 120 40" fill="none" width="120" height="40">
        <ellipse cx="60" cy="25" rx="50" ry="14" fill="white"/><ellipse cx="40" cy="18" rx="25" ry="14" fill="white"/><ellipse cx="80" cy="20" rx="30" ry="12" fill="white"/>
      </svg>
      <svg style={{ position: 'absolute', top: '30%', right: 0, width: '100%', height: '40px', animation: 'floatCloud 30s linear infinite 8s', opacity: 0.35 }} viewBox="0 0 100 30" fill="none" width="100" height="30">
        <ellipse cx="50" cy="18" rx="40" ry="11" fill="white"/><ellipse cx="30" cy="13" rx="22" ry="10" fill="white"/><ellipse cx="70" cy="15" rx="25" ry="9" fill="white"/>
      </svg>

      {/* Waves */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '30px', animation: 'waveMove 8s linear infinite', opacity: 0.2 }}>
        <svg viewBox="0 0 1200 30" fill="none" width="100%" height="30" preserveAspectRatio="none">
          <path d="M0 15 Q50 0 100 15 Q150 30 200 15 Q250 0 300 15 Q350 30 400 15 Q450 0 500 15 Q550 30 600 15 Q650 0 700 15 Q750 30 800 15 Q850 0 900 15 Q950 30 1000 15 Q1050 0 1100 15 Q1150 30 1200 15" stroke="#4A6B7A" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: '8px', left: 0, width: '200%', height: '25px', animation: 'waveMove 10s linear infinite 1s', opacity: 0.15 }}>
        <svg viewBox="0 0 1200 25" fill="none" width="100%" height="25" preserveAspectRatio="none">
          <path d="M0 12 Q50 0 100 12 Q150 25 200 12 Q250 0 300 12 Q350 25 400 12 Q450 0 500 12 Q550 25 600 12 Q650 0 700 12 Q750 25 800 12 Q850 0 900 12 Q950 25 1000 12 Q1050 0 1100 12 Q1150 25 1200 12" stroke="#4A6B7A" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      {/* Fish */}
      <svg style={{ position: 'absolute', bottom: '15%', left: 0, width: '100%', height: '20px', animation: 'fishSwim 18s ease-in-out infinite 2s' }} viewBox="0 0 28 14" fill="none" width="28" height="14">
        <ellipse cx="12" cy="7" rx="10" ry="5" fill="#5B9BAD" opacity="0.5"/><polygon points="22,7 28,2 28,12" fill="#5B9BAD" opacity="0.5"/><circle cx="7" cy="6" r="1.2" fill="white" opacity="0.8"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: '25%', left: 0, width: '100%', height: '16px', animation: 'fishSwim 22s ease-in-out infinite 7s' }} viewBox="0 0 24 12" fill="none" width="24" height="12">
        <ellipse cx="10" cy="6" rx="8" ry="4" fill="#6BAFBF" opacity="0.4"/><polygon points="18,6 24,2 24,10" fill="#6BAFBF" opacity="0.4"/><circle cx="6" cy="5" r="1" fill="white" opacity="0.7"/>
      </svg>

      {/* Wave squiggles */}
      {[
        { top: '45%', left: '5%', delay: '0s' },
        { top: '65%', right: '8%', delay: '2s' },
        { top: '75%', left: '12%', delay: '4s' },
        { top: '55%', right: '15%', delay: '1s' },
      ].map((pos, i) => (
        <svg key={i} style={{ position: 'absolute', ...pos, width: '30px', height: '10px', animation: `bobFloat 3s ease-in-out infinite ${pos.delay}`, opacity: 0.25 }} viewBox="0 0 30 10" fill="none">
          <path d="M2 5 Q8 1 14 5 Q20 9 26 5" stroke="#4A6B7A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Premium Dropdown Component ─── */
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
      if (listRef.current) {
        /* Entrance: slide up + scale + fade + blur */
        gsap.fromTo(
          listRef.current,
          { opacity: 0, y: 12, scaleY: 0.85, scaleX: 0.97, filter: 'blur(6px)' },
          {
            opacity: 1, y: 0, scaleY: 1, scaleX: 1, filter: 'blur(0px)',
            duration: 0.45, ease: 'power3.out',
          }
        );
        /* Stagger items */
        itemRefs.current.forEach((el, i) => {
          if (el) {
            gsap.fromTo(
              el,
              { opacity: 0, x: -10, filter: 'blur(4px)' },
              {
                opacity: 1, x: 0, filter: 'blur(0px)',
                duration: 0.35, delay: 0.05 + i * 0.025,
                ease: 'power2.out',
              }
            );
          }
        });
      }
    });
  };

  const closeDropdown = () => {
    if (listRef.current) {
      gsap.to(listRef.current, {
        opacity: 0, y: 8, scaleY: 0.9, filter: 'blur(4px)',
        duration: 0.25, ease: 'power2.in',
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (city: string) => {
    onChange(city);
    closeDropdown();
  };

  const activeIdx = options.indexOf(value);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className="premium-dropdown-trigger flex items-center gap-3 pl-4 pr-5 py-3.5 min-w-[220px] sm:min-w-[270px] rounded-2xl text-sm transition-all duration-300 border-2 shadow-[0_8px_32px_rgba(0,48,72,0.08)] hover:shadow-[0_12px_40px_rgba(0,48,72,0.12)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,237,211,0.3) 100%)',
          borderColor: isOpen ? 'rgba(193,33,38,0.3)' : 'rgba(0,48,72,0.08)',
        }}
      >
        {/* Red dot indicator */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red/40 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red" />
        </span>

        <span className="flex-1 text-left font-semibold text-navy truncate tracking-tight">
          {value === 'All' ? '🏝️  All Cities' : `📍 ${value}`}
        </span>

        <div
          className="ml-1 p-1 rounded-lg transition-all duration-300"
          style={{
            background: isOpen ? 'rgba(193,33,38,0.08)' : 'transparent',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown className="w-4 h-4 text-navy/50" />
        </div>
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full mt-3 left-0 w-full min-w-[220px] sm:min-w-[270px] max-h-[340px] rounded-2xl py-2 z-[1001] border-2 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,245,235,0.95) 100%)',
            borderColor: 'rgba(193,33,38,0.1)',
            boxShadow: '0 20px 60px rgba(0,48,72,0.12), 0 8px 24px rgba(193,33,38,0.06)',
            transformOrigin: 'top center',
          }}
        >
          {/* Decorative top shimmer bar */}
          <div className="h-[2px] mx-4 mb-1 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, transparent, rgba(193,33,38,0.2), rgba(0,48,72,0.15), transparent)' }} />

          <div className="premium-dropdown-list overflow-y-auto max-h-[320px] px-1.5">
            {options.map((city, i) => {
              const isActive = value === city;
              return (
                <button
                  key={city}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  onClick={() => handleSelect(city)}
                  className="relative group w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 my-0.5"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(193,33,38,0.08) 0%, rgba(193,33,38,0.03) 100%)'
                      : 'transparent',
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-red" />
                  )}

                  {/* City icon */}
                  <span className="text-xs shrink-0">
                    {city === 'All' ? '🏝️' : isActive ? '📍' : '○'}
                  </span>

                  <span
                    className={`flex-1 truncate transition-colors duration-200 ${
                      isActive
                        ? 'text-red font-bold'
                        : 'text-navy/65 font-medium group-hover:text-navy'
                    }`}
                  >
                    {city}
                  </span>

                  {/* Hover shimmer */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: isActive ? 'transparent' : 'linear-gradient(135deg, rgba(250,237,211,0.4) 0%, transparent 60%)' }}
                  />
                </button>
              );
            })}
          </div>

          {/* Decorative bottom bar */}
          <div className="h-[2px] mx-4 mt-1 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,48,72,0.06), transparent)' }} />
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

    const map = L.map(mapContainerRef.current, {
      center: [23.7, 120.96],
      zoom: 8,
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
      maxBounds: L.latLngBounds([21.5, 119.0], [26.0, 122.5]),
      maxBoundsViscosity: 0.9,
      minZoom: 7,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addAttribution('© OpenStreetMap').addTo(map);

    mapRef.current = map;

    /* Layer 1: Base tile — no labels, just land shapes for surrounding areas */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(map);

    /* Layer 2: Taiwan GeoJSON overlay — peach/salmon illustrated style */
    fetch('/taiwan.geo.json')
      .then((res) => res.json())
      .then((geojsonData) => {
        const geoLayer = L.geoJSON(geojsonData, {
          style: () => ({
            fillColor: '#F5CBA7',
            fillOpacity: 0.7,
            color: '#FFFFFF',
            weight: 2,
            opacity: 0.85,
          }),
          interactive: false,
        });
        geoLayer.addTo(map);
        geoJsonLayerRef.current = geoLayer;

        /* Layer 3: Labels-only tile on top — city names, roads, places visible */
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          pane: 'overlayPane',
        }).addTo(map);
      })
      .catch(() => {
        /* GeoJSON failed — fallback to full tile layer with labels */
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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
        marker.on('click', () => { setSelectedStore(null); setFilterCity(cluster.city); });
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
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3">
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
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-bold tracking-wide transition-all duration-300 whitespace-nowrap border-2 shadow-[0_8px_32px_rgba(0,48,72,0.1)]"
            style={{
              background: 'linear-gradient(135deg, #003048 0%, #004a6e 100%)',
              borderColor: 'rgba(250,237,211,0.15)',
              color: '#FAEDD3',
            }}
          >
            <span className="text-base">←</span> All Cities
          </button>
        )}

        {/* Reset */}
        <button
          onClick={handleResetView}
          className="flex items-center gap-2 p-3.5 rounded-2xl text-sm transition-all duration-300 border-2 shadow-[0_8px_32px_rgba(0,48,72,0.08)] hover:shadow-[0_12px_40px_rgba(0,48,72,0.12)]"
          title="Reset view"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,237,211,0.3) 100%)',
            borderColor: 'rgba(0,48,72,0.08)',
          }}
        >
          <Locate className="w-4 h-4 text-navy/60" />
        </button>
      </div>

      {/* ─── Counter badge ─── */}
      <div className="absolute bottom-20 left-4 z-[1000]">
        <div
          className="px-5 py-3 rounded-full text-xs font-semibold border-2 shadow-[0_8px_32px_rgba(0,48,72,0.08)]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,237,211,0.3) 100%)',
            borderColor: 'rgba(0,48,72,0.06)',
            color: '#003048cc',
          }}
        >
          {filterCity === 'All' ? (
            <>
              <span className="text-red font-bold text-sm">{displayCount}</span> stores across{' '}
              <span className="text-red font-bold text-sm">{cityCountNum}</span> cities
            </>
          ) : (
            <>
              <span className="text-red font-bold text-sm">{displayCount}</span>{' '}
              {displayCount === 1 ? 'store' : 'stores'} in{' '}
              <span className="font-bold">{filterCity}</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Map ─── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: '#A8D8EA' }}>
        <DecorativeElements />
        <div
          ref={mapContainerRef}
          className="illustrated-map w-full h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden"
          style={{ background: '#A8D8EA' }}
        />
      </div>

      {/* ─── Store popup ─── */}
      {selectedStore && (
        <div ref={popupRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md">
          <div className="relative bg-white border border-cream-dark/20 rounded-[1.5rem] p-6 shadow-[0_20px_80px_rgba(0,48,72,0.12)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red via-red/60 to-transparent" />
            <button onClick={handleClosePopup} className="absolute top-4 right-4 p-2 bg-cream-light hover:bg-cream-dark/30 rounded-full transition-all group">
              <X className="w-4 h-4 text-navy/40 group-hover:text-navy" />
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
