'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, Phone, Navigation, X, ChevronDown, Locate } from 'lucide-react';
import gsap from 'gsap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StoreLocation } from '@/types/database';

/* ─── Inject global CSS for pin animations + decorative elements ─── */
const STYLE_ID = 'store-map-pin-styles';
function injectPinStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Smooth premium bounce for store pins */
    @keyframes pinBounce {
      0%, 100% { transform: translateY(0); }
      40% { transform: translateY(-8px); }
      60% { transform: translateY(-3px); }
    }
    /* Smooth premium bounce for city pins */
    @keyframes pinBounceCity {
      0%, 100% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-10px) scale(1.05); }
      60% { transform: translateY(-4px) scale(1.02); }
    }
    /* Pulsing ring for city pins */
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
    /* Stagger animation delays */
    .store-pin:nth-child(2n) > div { animation-delay: 0.3s; }
    .store-pin:nth-child(3n) > div { animation-delay: 0.6s; }
    .store-pin:nth-child(4n) > div { animation-delay: 0.9s; }
    .store-pin:nth-child(5n) > div { animation-delay: 1.2s; }
    .city-pin:nth-child(2n) > div { animation-delay: 0.4s; }
    .city-pin:nth-child(3n) > div { animation-delay: 0.8s; }
    .city-pin:nth-child(4n) > div { animation-delay: 1.2s; }
    .city-pin:nth-child(5n) > div { animation-delay: 1.6s; }
    /* Hover pause */
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

    /* Hide Leaflet default attribution styling */
    .illustrated-map .leaflet-control-attribution {
      background: transparent !important;
      color: rgba(0,48,72,0.3) !important;
      font-size: 9px !important;
    }
    .illustrated-map .leaflet-control-attribution a {
      color: rgba(0,48,72,0.4) !important;
    }
    /* Soften zoom controls */
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
  `;
  document.head.appendChild(style);
}

/* ─── City pin: teardrop SVG (smaller size) ─── */
const createCityPinIcon = () => {
  return L.divIcon({
    className: 'city-pin',
    html: `
      <div style="position:relative;cursor:pointer;width:30px;height:40px;">
        <!-- Pulse ring 1 -->
        <div style="
          position:absolute;
          left:50%;top:100%;
          width:18px;height:18px;
          border-radius:50%;
          border:2px solid rgba(193,33,38,0.4);
          animation: cityPulseRing 2.5s ease-out infinite;
          pointer-events:none;
        "></div>
        <!-- Pulse ring 2 -->
        <div style="
          position:absolute;
          left:50%;top:100%;
          width:14px;height:14px;
          border-radius:50%;
          border:1.5px solid rgba(193,33,38,0.25);
          animation: cityPulseRing2 3s ease-out infinite 0.5s;
          pointer-events:none;
        "></div>
        <!-- Teardrop pin SVG -->
        <svg width="30" height="40" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -42],
  });
};

/* ─── Store pin SVG (navy blue, unchanged size) ─── */
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

/* ─── All Taiwan cities/counties ─── */
const CITIES = [
  'All',
  'Taipei',
  'New Taipei',
  'Taoyuan',
  'Keelung',
  'Hsinchu',
  'Hsinchu County',
  'Miaoli',
  'Taichung',
  'Changhua',
  'Nantou',
  'Yunlin',
  'Chiayi',
  'Chiayi County',
  'Tainan',
  'Kaohsiung',
  'Pingtung',
  'Yilan',
  'Hualien',
  'Taitung',
];

interface StoreMapProps {
  stores: StoreLocation[];
}

/* ─── Decorative SVG components ─── */
function DecorativeElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[500]">
      {/* ── Birds ── */}
      <svg
        style={{ position: 'absolute', top: '8%', left: 0, width: '100%', height: '40px', animation: 'floatBird 12s ease-in-out infinite' }}
        viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="40" height="20"
      >
        <path d="M2 12 Q8 4 14 10 M14 10 Q20 4 26 12" stroke="#4A6B7A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
      <svg
        style={{ position: 'absolute', top: '14%', left: 0, width: '100%', height: '30px', animation: 'floatBird 16s ease-in-out infinite 3s' }}
        viewBox="0 0 30 16" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="30" height="16"
      >
        <path d="M2 10 Q6 3 10 8 M10 8 Q14 3 18 10" stroke="#6B8E9E" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
      <svg
        style={{ position: 'absolute', top: '22%', left: 0, width: '100%', height: '26px', animation: 'floatBird2 14s ease-in-out infinite 5s' }}
        viewBox="0 0 26 14" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="26" height="14"
      >
        <path d="M2 8 Q5 2 8 6 M8 6 Q11 2 14 8" stroke="#7BA3B3" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </svg>

      {/* ── Clouds ── */}
      <svg
        style={{ position: 'absolute', top: '6%', left: 0, width: '100%', height: '50px', animation: 'floatCloud 25s linear infinite', opacity: 0.5 }}
        viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="120" height="40"
      >
        <ellipse cx="60" cy="25" rx="50" ry="14" fill="white"/>
        <ellipse cx="40" cy="18" rx="25" ry="14" fill="white"/>
        <ellipse cx="80" cy="20" rx="30" ry="12" fill="white"/>
      </svg>
      <svg
        style={{ position: 'absolute', top: '30%', right: 0, width: '100%', height: '40px', animation: 'floatCloud 30s linear infinite 8s', opacity: 0.35 }}
        viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="100" height="30"
      >
        <ellipse cx="50" cy="18" rx="40" ry="11" fill="white"/>
        <ellipse cx="30" cy="13" rx="22" ry="10" fill="white"/>
        <ellipse cx="70" cy="15" rx="25" ry="9" fill="white"/>
      </svg>

      {/* ── Waves (bottom) ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '30px', animation: 'waveMove 8s linear infinite', opacity: 0.2 }}>
        <svg viewBox="0 0 1200 30" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="30" preserveAspectRatio="none">
          <path d="M0 15 Q50 0 100 15 Q150 30 200 15 Q250 0 300 15 Q350 30 400 15 Q450 0 500 15 Q550 30 600 15 Q650 0 700 15 Q750 30 800 15 Q850 0 900 15 Q950 30 1000 15 Q1050 0 1100 15 Q1150 30 1200 15" stroke="#4A6B7A" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: '8px', left: 0, width: '200%', height: '25px', animation: 'waveMove 10s linear infinite 1s', opacity: 0.15 }}>
        <svg viewBox="0 0 1200 25" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="25" preserveAspectRatio="none">
          <path d="M0 12 Q50 0 100 12 Q150 25 200 12 Q250 0 300 12 Q350 25 400 12 Q450 0 500 12 Q550 25 600 12 Q650 0 700 12 Q750 25 800 12 Q850 0 900 12 Q950 25 1000 12 Q1050 0 1100 12 Q1150 25 1200 12" stroke="#4A6B7A" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      {/* ── Small fish ── */}
      <svg
        style={{ position: 'absolute', bottom: '15%', left: 0, width: '100%', height: '20px', animation: 'fishSwim 18s ease-in-out infinite 2s' }}
        viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="28" height="14"
      >
        <ellipse cx="12" cy="7" rx="10" ry="5" fill="#5B9BAD" opacity="0.5"/>
        <polygon points="22,7 28,2 28,12" fill="#5B9BAD" opacity="0.5"/>
        <circle cx="7" cy="6" r="1.2" fill="white" opacity="0.8"/>
      </svg>
      <svg
        style={{ position: 'absolute', bottom: '25%', left: 0, width: '100%', height: '16px', animation: 'fishSwim 22s ease-in-out infinite 7s' }}
        viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg"
        width="24" height="12"
      >
        <ellipse cx="10" cy="6" rx="8" ry="4" fill="#6BAFBF" opacity="0.4"/>
        <polygon points="18,6 24,2 24,10" fill="#6BAFBF" opacity="0.4"/>
        <circle cx="6" cy="5" r="1" fill="white" opacity="0.7"/>
      </svg>

      {/* ── Tiny wave squiggles scattered ── */}
      {[
        { top: '45%', left: '5%', delay: '0s' },
        { top: '65%', right: '8%', delay: '2s' },
        { top: '75%', left: '12%', delay: '4s' },
        { top: '55%', right: '15%', delay: '1s' },
      ].map((pos, i) => (
        <svg
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: '30px',
            height: '10px',
            animation: `bobFloat 3s ease-in-out infinite ${pos.delay}`,
            opacity: 0.25,
          }}
          viewBox="0 0 30 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 5 Q8 1 14 5 Q20 9 26 5" stroke="#4A6B7A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      ))}
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  /* Inject CSS once */
  useEffect(() => { injectPinStyles(); }, []);

  /* ─── Compute city clusters ─── */
  const cityClusters = useMemo(() => {
    const cityMap: Record<string, { stores: StoreLocation[]; totalLat: number; totalLng: number }> = {};
    stores.forEach((s) => {
      if (!cityMap[s.city]) {
        cityMap[s.city] = { stores: [], totalLat: 0, totalLng: 0 };
      }
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

  /* ─── Filtered stores (city selected) ─── */
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchCity = filterCity === 'All' || s.city === filterCity;
      return matchCity;
    });
  }, [stores, filterCity]);

  /* ─── Display count ─── */
  const displayCount = filterCity === 'All' ? stores.length : filteredStores.length;
  const cityCountNum = filterCity === 'All' ? cityClusters.length : null;

  /* ─── Initialize map ─── */
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

    /* No tile layer — the ocean background is CSS, and Taiwan land is GeoJSON */

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© OpenStreetMap contributors')
      .addTo(map);

    mapRef.current = map;

    /* Load Taiwan GeoJSON for illustrated land */
    fetch('/taiwan.geo.json')
      .then((res) => res.json())
      .then((geojsonData) => {
        const geoLayer = L.geoJSON(geojsonData, {
          style: () => ({
            fillColor: '#F5CBA7',
            fillOpacity: 1,
            color: '#FFFFFF',
            weight: 2.5,
            opacity: 0.9,
          }),
          interactive: false,
        });
        geoLayer.addTo(map);
        geoJsonLayerRef.current = geoLayer;
      })
      .catch(() => {
        /* Fallback: use a light tile layer if GeoJSON fails */
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          { maxZoom: 19 }
        ).addTo(map);
      });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── Update markers ─── */
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (filterCity === 'All') {
      // ── CITY MODE: one teardrop pin per city ──
      cityClusters.forEach((cluster) => {
        const marker = L.marker([cluster.lat, cluster.lng], {
          icon: createCityPinIcon(),
        });

        marker.on('click', () => {
          setSelectedStore(null);
          setFilterCity(cluster.city);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Fit to all clusters
      if (cityClusters.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 10 });
      }
    } else {
      // ── INDIVIDUAL STORE MODE ──
      filteredStores.forEach((store) => {
        const marker = L.marker([store.lat, store.lng], {
          icon: createStorePinIcon(selectedStore?.id === store.id),
        });

        marker.on('click', () => {
          setSelectedStore(store);
          map.flyTo([store.lat, store.lng], 14, { duration: 1.2 });
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Fit bounds to show all stores in selected city
      if (filteredStores.length > 0 && !selectedStore) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 14 });
      }
    }
  }, [filteredStores, cityClusters, filterCity, selectedStore]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  /* ─── Update pin style on selection ─── */
  useEffect(() => {
    if (filterCity !== 'All') {
      markersRef.current.forEach((marker, idx) => {
        const store = filteredStores[idx];
        if (store) {
          marker.setIcon(createStorePinIcon(selectedStore?.id === store.id));
        }
      });
    }
  }, [selectedStore, filteredStores, filterCity]);

  /* ─── Popup entrance animation ─── */
  useEffect(() => {
    if (selectedStore && popupRef.current) {
      gsap.fromTo(
        popupRef.current,
        { opacity: 0, y: 30, scale: 0.92, filter: 'blur(8px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [selectedStore]);

  const handleClosePopup = () => {
    if (popupRef.current) {
      gsap.to(popupRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        filter: 'blur(6px)',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => setSelectedStore(null),
      });
    } else {
      setSelectedStore(null);
    }
  };

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedStore(null);
    setFilterCity('All');
    map.flyTo([23.7, 120.96], 8, { duration: 1 });
  };

  const handleBackToAll = () => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedStore(null);
    setFilterCity('All');
    map.flyTo([23.7, 120.96], 8, { duration: 1 });
  };

  const storeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      supermarket: 'Supermarket',
      minimarket: 'Minimarket',
      toko: 'Toko Indonesia',
      retail: 'Retail Store',
      online: 'Online Shop',
    };
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
      {/* ─── Top bar: Dropdown (left) + Reset (right) ─── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3">
        {/* City dropdown — left side, wider */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2.5 px-5 py-3 min-w-[220px] sm:min-w-[260px] bg-white/95 backdrop-blur-xl border border-cream-dark/30 rounded-2xl text-navy text-sm hover:border-navy/20 transition-all shadow-lg shadow-navy/5"
          >
            <MapPin className="w-4 h-4 text-red shrink-0" />
            <span className="flex-1 text-left font-medium truncate">{filterCity}</span>
            <ChevronDown
              className={`w-4 h-4 text-navy/40 transition-transform shrink-0 ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isFilterOpen && (
            <div className="absolute top-full mt-2 left-0 w-full min-w-[220px] sm:min-w-[260px] max-h-80 overflow-y-auto bg-white/98 backdrop-blur-xl border border-cream-dark/30 rounded-2xl py-2 shadow-2xl z-[1001]">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setFilterCity(city);
                    setIsFilterOpen(false);
                    setSelectedStore(null);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterCity === city
                      ? 'bg-red/10 text-red font-medium'
                      : 'text-navy/70 hover:bg-cream-light hover:text-navy'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Back to All Cities button (when viewing a specific city) */}
        {filterCity !== 'All' && (
          <button
            onClick={handleBackToAll}
            className="flex items-center gap-2 px-4 py-3 bg-navy/90 backdrop-blur-xl rounded-2xl text-white text-xs font-semibold hover:bg-navy transition-all shadow-lg whitespace-nowrap"
          >
            ← All Cities
          </button>
        )}

        {/* Reset view button */}
        <button
          onClick={handleResetView}
          className="flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-xl border border-cream-dark/30 rounded-2xl text-navy text-sm hover:border-navy/20 transition-all shadow-lg shadow-navy/5"
          title="Reset view"
        >
          <Locate className="w-4 h-4 text-navy/60" />
        </button>
      </div>

      {/* ─── Counter badge ─── */}
      <div className="absolute bottom-20 left-4 z-[1000]">
        <div className="px-4 py-2.5 bg-white/95 backdrop-blur-xl border border-cream-dark/20 rounded-full text-navy/80 text-xs font-semibold shadow-lg shadow-navy/5">
          {filterCity === 'All' ? (
            <>
              <span className="text-red font-bold">{displayCount}</span> stores across{' '}
              <span className="text-red font-bold">{cityCountNum}</span> cities
            </>
          ) : (
            <>
              <span className="text-red font-bold">{displayCount}</span>{' '}
              {displayCount === 1 ? 'store' : 'stores'} in{' '}
              <span className="font-bold">{filterCity}</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Map container with ocean background ─── */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Decorative animated elements */}
        <DecorativeElements />

        <div
          ref={mapContainerRef}
          className="illustrated-map w-full h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden"
          style={{ background: '#A8D8EA' }}
        />
      </div>

      {/* ─── Store detail popup ─── */}
      {selectedStore && (
        <div
          ref={popupRef}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="relative bg-white border border-cream-dark/20 rounded-[1.5rem] p-6 shadow-[0_20px_80px_rgba(0,48,72,0.12)] overflow-hidden">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red via-red/60 to-transparent" />

            {/* Close */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 p-2 bg-cream-light hover:bg-cream-dark/30 rounded-full transition-all group"
            >
              <X className="w-4 h-4 text-navy/40 group-hover:text-navy" />
            </button>

            {/* Store type badge */}
            <span
              className={`inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full border ${storeTypeColor(selectedStore.store_type)} mb-3`}
            >
              {storeTypeLabel(selectedStore.store_type)}
            </span>

            {/* Name */}
            <h3 className="text-xl font-heading font-bold text-navy mb-3 pr-8 leading-tight">
              {selectedStore.name}
            </h3>

            {/* Divider */}
            <div className="w-12 h-0.5 bg-gradient-to-r from-red to-red/0 rounded-full mb-4" />

            {/* Address */}
            <div className="flex items-start gap-3 mb-3">
              <Navigation className="w-4 h-4 text-red mt-0.5 shrink-0" />
              <div>
                <p className="text-navy/70 text-sm leading-relaxed">
                  {selectedStore.address}
                </p>
                <p className="text-navy/40 text-xs mt-1">
                  {selectedStore.city}
                  {selectedStore.district ? `, ${selectedStore.district}` : ''}
                </p>
              </div>
            </div>

            {/* Contact */}
            {selectedStore.contact && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-red shrink-0" />
                <a
                  href={`tel:${selectedStore.contact}`}
                  className="text-navy/70 text-sm hover:text-red transition-colors"
                >
                  {selectedStore.contact}
                </a>
              </div>
            )}

            {/* Get Directions button */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.lat},${selectedStore.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-red hover:bg-red-dark rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-red/20 active:scale-[0.98]"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
