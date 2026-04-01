'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Phone, Navigation, X, Search, ChevronDown, Locate } from 'lucide-react';
import gsap from 'gsap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StoreLocation } from '@/types/database';

/* ─── Custom pin SVG ─── */
const createPinIcon = (isActive = false) => {
  const color = isActive ? '#C12126' : '#003048';
  const innerBg = isActive ? '#FAEDD3' : '#FAEDD3';
  const innerDot = isActive ? '#C12126' : '#003048';
  const glow = isActive
    ? 'drop-shadow(0 0 12px rgba(193,33,38,0.6)) drop-shadow(0 3px 8px rgba(0,0,0,0.3))'
    : 'drop-shadow(0 2px 6px rgba(0,48,72,0.35))';
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="filter:${glow};transition:all 0.4s cubic-bezier(0.22,1,0.36,1);transform:${isActive ? 'scale(1.3) translateY(-4px)' : 'scale(1)'}">
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

/* ─── All 22 Taiwan cities/counties ─── */
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

  const filteredStores = stores.filter((s) => {
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

    // CartoDB Voyager — bright, colorful, fun & premium
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attribution
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

  /* ─── Update markers when filters change ─── */
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

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

    // Fit bounds
    if (filteredStores.length > 0 && !selectedStore) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 12 });
    }
  }, [filteredStores, selectedStore]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  /* ─── Update pin style on selection ─── */
  useEffect(() => {
    markersRef.current.forEach((marker, idx) => {
      const store = filteredStores[idx];
      if (store) {
        marker.setIcon(createPinIcon(selectedStore?.id === store.id));
      }
    });
  }, [selectedStore, filteredStores]);

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

      {/* ─── Counter badge ─── */}
      <div className="absolute bottom-20 left-4 z-[1000]">
        <div className="px-4 py-2.5 bg-white/95 backdrop-blur-xl border border-cream-dark/20 rounded-full text-navy/80 text-xs font-semibold shadow-lg shadow-navy/5">
          <span className="text-red font-bold">{filteredStores.length}</span>{' '}
          {filteredStores.length === 1 ? 'store' : 'stores'} found
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
