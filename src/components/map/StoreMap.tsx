'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Phone, Navigation, X, Search, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StoreLocation } from '@/types/database';

/* ─── Custom pin SVG ─── */
const createPinIcon = (isActive = false) => {
  const color = isActive ? '#C12126' : '#FAEDD3';
  const glow = isActive
    ? 'drop-shadow(0 0 10px rgba(193,33,38,0.7)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
    : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))';
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="filter:${glow};transition:all 0.4s cubic-bezier(0.22,1,0.36,1);transform:${isActive ? 'scale(1.25)' : 'scale(1)'}">
      <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" opacity="${isActive ? '1' : '0.85'}"/>
        <circle cx="16" cy="16" r="6.5" fill="${isActive ? '#FAEDD3' : '#003048'}" opacity="0.9"/>
        <circle cx="16" cy="16" r="3" fill="${isActive ? '#C12126' : '#FAEDD3'}"/>
      </svg>
    </div>`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -48],
  });
};

/* ─── City filter data ─── */
const CITIES = ['All', 'Taipei', 'New Taipei', 'Taoyuan', 'Hsinchu', 'Taichung', 'Tainan', 'Kaohsiung'];

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
    });

    // CartoDB Dark Matter — matches navy theme perfectly
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
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
      supermarket: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      minimarket: 'bg-green-500/20 text-green-300 border-green-500/30',
      toko: 'bg-red/20 text-red-300 border-red/30',
      retail: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      online: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    return colors[type] || 'bg-navy/30 text-cream/60 border-cream/20';
  };

  return (
    <div className="relative w-full">
      {/* ─── Search & Filter Bar ─── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
          <input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-navy/90 backdrop-blur-xl border border-cream/10 rounded-2xl text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-red/50 focus:ring-1 focus:ring-red/20 transition-all"
          />
        </div>

        {/* City filter */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-5 py-3 bg-navy/90 backdrop-blur-xl border border-cream/10 rounded-2xl text-cream text-sm hover:border-cream/20 transition-all whitespace-nowrap"
          >
            <MapPin className="w-4 h-4 text-red" />
            {filterCity}
            <ChevronDown
              className={`w-4 h-4 text-cream/40 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isFilterOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-navy/95 backdrop-blur-xl border border-cream/10 rounded-2xl py-2 shadow-2xl overflow-hidden">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setFilterCity(city);
                    setIsFilterOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterCity === city
                      ? 'bg-red/20 text-red-light'
                      : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Counter badge ─── */}
      <div className="absolute bottom-20 left-4 z-[1000]">
        <div className="px-4 py-2 bg-navy/90 backdrop-blur-xl border border-cream/10 rounded-full text-cream/80 text-xs font-medium">
          {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'} found
        </div>
      </div>

      {/* ─── Map container ─── */}
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-[2rem] overflow-hidden border border-cream/10"
        style={{ background: '#001E2E' }}
      />

      {/* ─── Store detail popup ─── */}
      {selectedStore && (
        <div
          ref={popupRef}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="relative bg-gradient-to-br from-navy via-navy to-navy-dark border border-cream/10 rounded-[1.5rem] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {/* Close */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 p-2 bg-cream/5 hover:bg-cream/10 rounded-full transition-all group"
            >
              <X className="w-4 h-4 text-cream/40 group-hover:text-cream" />
            </button>

            {/* Store type badge */}
            <span
              className={`inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full border ${storeTypeColor(selectedStore.store_type)} mb-3`}
            >
              {storeTypeLabel(selectedStore.store_type)}
            </span>

            {/* Name */}
            <h3 className="text-xl font-heading font-bold text-cream mb-3 pr-8 leading-tight">
              {selectedStore.name}
            </h3>

            {/* Divider */}
            <div className="w-12 h-0.5 bg-gradient-to-r from-red to-red/0 rounded-full mb-4" />

            {/* Address */}
            <div className="flex items-start gap-3 mb-3">
              <Navigation className="w-4 h-4 text-red mt-0.5 shrink-0" />
              <div>
                <p className="text-cream/70 text-sm leading-relaxed">
                  {selectedStore.address}
                </p>
                <p className="text-cream/40 text-xs mt-1">
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
                  className="text-cream/70 text-sm hover:text-cream transition-colors"
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
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-red hover:bg-red-dark rounded-xl text-cream text-sm font-semibold transition-all hover:scale-[0.98]"
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
