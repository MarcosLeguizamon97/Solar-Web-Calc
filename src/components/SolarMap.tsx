import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, MapPin, Eye } from 'lucide-react';
import { LocationCoords } from '../types';

interface SolarMapProps {
  location: LocationCoords;
  onLocationChange: (loc: LocationCoords) => void;
  onTerrainAreaChange?: (hectares: number) => void;
  measuredHectares?: number;
}

type LayerMode = 'satellite' | 'topo';

export const SolarMap: React.FC<SolarMapProps> = ({
  location,
  onLocationChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activeLayer, setActiveLayer] = useState<LayerMode>('satellite');
  const [showSolarHeatmap, setShowSolarHeatmap] = useState<boolean>(true);

  // Custom Solar Marker Icon
  const createSolarIcon = () => {
    return L.divIcon({
      className: 'solar-pin-wrapper',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-400/40 rounded-full animate-ping"></div>
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-1 shadow-lg shadow-amber-500/50 flex items-center justify-center border-2 border-white">
            <svg class="w-5 h-5 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="absolute -bottom-2 w-2 h-2 bg-amber-500 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 38],
    });
  };

  // Base tile layers (Satellite & Topo)
  const getTileUrl = (layer: LayerMode) => {
    switch (layer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
      default:
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    }
  };

  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const solarOverlayRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lng],
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialTiles = L.tileLayer(getTileUrl(activeLayer), {
      attribution: '&copy; Esri, OpenTopoMap, OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = initialTiles;

    // Solar overlay (radiating concentric solar yield zone)
    const overlayGroup = L.layerGroup();
    solarOverlayRef.current = overlayGroup;
    overlayGroup.addTo(map);

    // Initial draggable marker
    const marker = L.marker([location.lat, location.lng], {
      icon: createSolarIcon(),
      draggable: true,
    }).addTo(map);

    // Marker drag end handler -> updates location and triggers recalculations
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const roundedLat = Math.round(pos.lat * 10000) / 10000;
      const roundedLng = Math.round(pos.lng * 10000) / 10000;
      onLocationChange({
        ...location,
        name: `Coordenadas [${roundedLat.toFixed(4)}, ${roundedLng.toFixed(4)}]`,
        lat: roundedLat,
        lng: roundedLng,
      });
    });

    markerRef.current = marker;

    // Direct click/touch handler anywhere on the map: moves marker and recalculates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const roundedLat = Math.round(e.latlng.lat * 10000) / 10000;
      const roundedLng = Math.round(e.latlng.lng * 10000) / 10000;
      marker.setLatLng([roundedLat, roundedLng]);
      onLocationChange({
        ...location,
        name: `Coordenadas [${roundedLat.toFixed(4)}, ${roundedLng.toFixed(4)}]`,
        lat: roundedLat,
        lng: roundedLng,
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base tile when activeLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTiles = L.tileLayer(getTileUrl(activeLayer), {
      attribution: '&copy; Esri, OpenTopoMap',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTiles;
  }, [activeLayer]);

  // Update marker & solar heatmap overlay when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    const currentLatLng = markerRef.current.getLatLng();
    if (
      Math.abs(currentLatLng.lat - location.lat) > 0.0001 ||
      Math.abs(currentLatLng.lng - location.lng) > 0.0001
    ) {
      markerRef.current.setLatLng([location.lat, location.lng]);
      mapInstanceRef.current.panTo([location.lat, location.lng], {
        animate: true,
        duration: 0.8,
      });
    }

    // Render solar zone aura
    if (solarOverlayRef.current) {
      solarOverlayRef.current.clearLayers();
      if (showSolarHeatmap) {
        // Outer radius (e.g. 5km radius buffer)
        const outerCircle = L.circle([location.lat, location.lng], {
          radius: 5000,
          color: '#f59e0b',
          weight: 1,
          opacity: 0.6,
          fillColor: '#f59e0b',
          fillOpacity: 0.08,
          dashArray: '6, 6',
        });
        // Inner radius (e.g. 1.5km site boundary)
        const innerCircle = L.circle([location.lat, location.lng], {
          radius: 1500,
          color: '#fbbf24',
          weight: 2,
          opacity: 0.8,
          fillColor: '#f59e0b',
          fillOpacity: 0.16,
        });

        solarOverlayRef.current.addLayer(outerCircle);
        solarOverlayRef.current.addLayer(innerCircle);
      }
    }
  }, [location.lat, location.lng, showSolarHeatmap]);

  // Geolocation button handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationChange({
          name: 'Mi Ubicación Actual',
          lat: Math.round(latitude * 10000) / 10000,
          lng: Math.round(longitude * 10000) / 10000,
        });
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
      }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl h-[460px] md:h-[540px]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Top Controls: Mobile-First Ergonomic Layout with Generous Spacing */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Layer Selector Island (Only Functional Layers: Satélite and Relieve) */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl">
          <button
            onClick={() => setActiveLayer('satellite')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeLayer === 'satellite'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            Satélite
          </button>
          <button
            onClick={() => setActiveLayer('topo')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeLayer === 'topo'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            Relieve
          </button>

          <div className="h-5 w-[1px] bg-slate-700 mx-0.5 hidden sm:block"></div>

          {/* Solar Aura Toggle */}
          <button
            onClick={() => setShowSolarHeatmap(!showSolarHeatmap)}
            className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showSolarHeatmap
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Aura de radiación solar y radio de influencia técnica"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Aura Solar</span>
          </button>
        </div>

        {/* GPS Quick Action */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl">
          <button
            onClick={handleLocateMe}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-700/80 flex items-center gap-2 transition cursor-pointer shadow-md text-xs font-bold"
            title="Centrar en mi ubicación GPS actual"
            aria-label="Centrar en mi ubicación GPS actual"
          >
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mi GPS</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Info Badge */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 flex flex-wrap items-center gap-2.5 p-3 bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-800/90 shadow-2xl text-xs max-w-full sm:max-w-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold px-2.5 py-1 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <MapPin className="w-3.5 h-3.5" />
          <span>
            {location.lat >= 0 ? `${location.lat.toFixed(4)}°N` : `${Math.abs(location.lat).toFixed(4)}°S`},{' '}
            {location.lng >= 0 ? `${location.lng.toFixed(4)}°E` : `${Math.abs(location.lng).toFixed(4)}°W`}
          </span>
        </div>

        <div className="text-slate-200 truncate flex-1 font-semibold">
          {location.name || 'Emplazamiento Solar Seleccionado'}
        </div>

        <div className="w-full sm:w-auto flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Tocá cualquier punto para recalcular</span>
        </div>
      </div>
    </div>
  );
};
