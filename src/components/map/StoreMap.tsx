'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, Phone, Navigation, X, Search, ChevronDown, Locate } from 'lucide-react';
import gsap from 'gsap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StoreLocation } from '@/types/database';

/* ─── Inject global CSS for pin animations ─── */
const STYLE_ID = 'store-map-pin-styles';
function injectPinStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Smooth premium bounce for all pins */
    @keyframes pinBounce {
      0%, 100% { transform: translateY(0); }
      40% { transform: translateY(-8px); }
      60% { transform: translateY(-3px); }
    }
    @keyframes pinBounceCity {
      0%, 100% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-6px) scale(1.05); }
      60% { transform: translateY(-2px) scale(1.02); }
    }
    @keyframes pulseRing {
      0% { transform: scale(1); opacity: 0.4; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .custom-pin > div {
      animation: pinBounce 2.8s cubic-bezier(0.36, 0, 0.66, 1) infinite;
    }
    .city-cluster-pin > div {
      animation: pinBounceCity 3s cubic-bezier(0.36, 0, 0.66, 1) infinite;
    }
    /* Stagger animation delays per pin */
    .custom-pin:nth-child(2n) > div { animation-delay: 0.3s; }
    .custom-pin:nth-child(3n) > div { animation-delay: 0.6s; }
    .custom-pin:nth-child(4n) > div { animation-delay: 0.9s; }
    .custom-pin:nth-child(5n) > div { animation-delay: 1.2s; }
    .city-cluster-pin:nth-child(2n) > div { animation-delay: 0.4s; }
    .city-cluster-pin:nth-child(3n) > div { animation-delay: 0.8s; }
    .city-cluster-pin:nth-child(4n) > div { animation-delay: 1.2s; }
    .city-cluster-pin:nth-child(5n) > div { animation-delay: 1.6s; }
    /* Hover pause */
    .city-cluster-pin:hover > div { animation-play-state: paused; transform: translateY(-6px) scale(1.1); }
    .custom-pin:hover > div { animation-play-state: paused; transform: translateY(-4px); }
  `;
  document.head.appendChild(style);
}

/* ─── Custom store pin SVG (navy blue, keeps existing size) ─── */
const createPinIcon = (isActive = false) => {
  const color = isActive ? '#C12126' : '#003048';
  const innerBg = '#FAEDD3';
  const innerDot = isActive ? '#C12126' : '#003048';
  const glow = isActive
    ? 'drop-shadow(0 0 12px rgba(193,33,38,0.6)) drop-shadow(0 3px 8px rgba(0,0,0,0.3))'
    : 'drop-shadow(0 2px 6px rgba(0,48,72,0.35))';
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="filter:${glow};transition:filter 0.4s cubic-bezier(0.22,1,0.36,1);">
      <svg width="34" height="46" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" opacity="${isActive ? '1' : '0.9'}"/>
        <circle cx="16" cy="16" r="7" fill="${innerBg}" opacity="0.95"/>
        <circle cx="16" cy="16" r="3.5" fill="${innerDot}"/>
      </svg>
    </div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -48],
  });
};

/* ─── City cluster dot icon (small, elegant, red — no city name label) ─── */
const createCityClusterIcon = (storeCount: number) => {
  return L.divIcon({
    className: 'city-cluster-pin',
    html: `
      <div style="
        position:relative;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;
      ">
        <!-- Pulse ring -->
        <div style="
          position:absolute;
          width:32px;height:32px;
          border-radius:50%;
          background:rgba(193,33,38,0.15);
          animation: pulseRing 2.5s ease-out infinite;
        "></div>
        <!-- Main dot -->
        <div style="
          position:relative;
          width:32px;height:32px;
          background:linear-gradient(135deg,#C12126,#a01b1f);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          border:2.5px solid rgba(250,237,211,0.9);
          box-shadow:0 2px 10px rgba(193,33,38,0.35), 0 0 0 1px rgba(193,33,38,0.15);
        ">
          <span style="color:#FAEDD3;font-weight:700;font-size:12px;line-height:1;letter-spacing:-0.02em;">${storeCount}</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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

export default function StoreMap({ stores }: StoreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [filterCity, setFilterCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  /* Inject CSS once */
  useEffect(() => { injectPinStyles(); }, []);

  /* ─── Compute city clusters (centroid + count) ─── */
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

  /* ─── Filtered stores (only used when a city is selected) ─── */
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchCity =
        filterCity === 'All' ||
        s.city === filterCity ||
        (filterCity === 'Other' && !CITIES.includes(s.city));
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchSearch;
    });
  }, [stores, filterCity, searchQuery]);

  /* ─── Filtered city clusters for search in All mode ─── */
  const filteredClusters = useMemo(() => {
    if (!searchQuery) return cityClusters;
    return cityClusters.filter(
      (c) =>
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.stores.some(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [cityClusters, searchQuery]);

  /* ─── Display count ─── */
  const displayCount = filterCity === 'All' ? stores.length : filteredStores.length;
  const cityCountNum = filterCity === 'All' ? filteredClusters.length : null;

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

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addAttribution(
        '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/">OSM</a>'
      )
      .addTo(map);

    mapRef.current = map;

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
      // ── CITY CLUSTER MODE: one small dot per city ──
      filteredClusters.forEach((cluster) => {
        const marker = L.marker([cluster.lat, cluster.lng], {
          icon: createCityClusterIcon(cluster.count),
        });

        marker.on('click', () => {
          setSelectedStore(null);
          setFilterCity(cluster.city);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Fit to all clusters
      if (filteredClusters.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 10 });
      }
    } else {
      // ── INDIVIDUAL STORE MODE ──
      filteredStores.forEach((store) => {
        const marker = L.marker([store.lat, store.lng], {
          icon: createPinIcon(selectedStore?.id === store.id),
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
  }, [filteredStores, filteredClusters, filterCity, selectedStore]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  /* ─── Update pin style on selection ─── */
  useEffect(() => {
    if (filterCity !== 'All') {
      markersRef.current.forEach((marker, idx) => {
        const store = filteredStores[idx];
        if (store) {
          marker.setIcon(createPinIcon(selectedStore?.id === store.id));
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
    setSearchQuery('');
    map.flyTo([23.7, 120.96], 8, { duration: 1 });
  };

  /* ─── Back to All Cities button ─── */
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
      {/* ─── Search & Filter Bar ─── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            placeholder="Search stores, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-xl border border-cream-dark/30 rounded-2xl text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:border-red/40 focus:ring-2 focus:ring-red/10 transition-all shadow-lg shadow-navy/5"
          />
        </div>

        {/* City filter */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-5 py-3 bg-white/95 backdrop-blur-xl border border-cream-dark/30 rounded-2xl text-navy text-sm hover:border-navy/20 transition-all whitespace-nowrap shadow-lg shadow-navy/5"
          >
            <MapPin className="w-4 h-4 text-red" />
            {filterCity}
            <ChevronDown
              className={`w-4 h-4 text-navy/40 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isFilterOpen && (
            <div className="absolute top-full mt-2 right-0 w-52 max-h-80 overflow-y-auto bg-white/98 backdrop-blur-xl border border-cream-dark/30 rounded-2xl py-2 shadow-2xl z-[1001]">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setFilterCity(city);
                    setIsFilterOpen(false);
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

        {/* Reset view button */}
        <button
          onClick={handleResetView}
          className="flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-xl border border-cream-dark/30 rounded-2xl text-navy text-sm hover:border-navy/20 transition-all shadow-lg shadow-navy/5"
          title="Reset view"
        >
          <Locate className="w-4 h-4 text-navy/60" />
        </button>
      </div>

      {/* ─── Back to All Cities button (shown when viewing a specific city) ─── */}
      {filterCity !== 'All' && (
        <div className="absolute top-20 sm:top-4 sm:left-auto sm:right-[calc(4rem+12rem+4rem+3.5rem+1.5rem)] left-4 z-[1000]">
          <button
            onClick={handleBackToAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy/90 backdrop-blur-xl rounded-2xl text-white text-xs font-semibold hover:bg-navy transition-all shadow-lg"
          >
            ← All Cities
          </button>
        </div>
      )}

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

      {/* ─── Map container ─── */}
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden"
        style={{ background: '#F5F3EF' }}
      />

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
