import React, { useState, useEffect, useRef } from 'react';
import { Sun, Search, Share2, Globe, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { LocationCoords } from '../types';
import { searchPlaces, SOLAR_PRESETS } from '../services/weatherService';

interface HeaderProps {
  currentLocation: LocationCoords;
  onSelectLocation: (loc: LocationCoords) => void;
  onOpenShareModal: () => void;
  activeMode?: 'rosario' | 'map';
  onModeChange?: (mode: 'rosario' | 'map') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  onOpenShareModal,
  activeMode = 'rosario',
  onModeChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationCoords[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchPlaces(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 350);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setShowPresetsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand and Tagline */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  SolarStudio <span className="text-amber-400">Argentina</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40 uppercase">
                  Nacional On-Grid
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Ingeniería solar e indicadores de la industria • Ley 27.424 & Provincias
              </p>
            </div>
          </div>

          {/* Mobile Share Button */}
          <button
            onClick={onOpenShareModal}
            className="md:hidden p-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </button>
        </div>

        {/* Search Bar & Presets Dropdown */}
        <div ref={dropdownRef} className="relative w-full md:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar ciudad, parque industrial o pueblo de Argentina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Quick Presets Toggle Button */}
          <button
            onClick={() => setShowPresetsMenu(!showPresetsMenu)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 shrink-0 transition"
            title="Ver hubs y parques solares de Argentina"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-medium">Hubs Argentina</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-3 border-b border-slate-800">
                Localidades encontradas en Argentina
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectLocation(item);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-amber-500/10 hover:text-amber-300 flex items-center gap-2 border-b border-slate-800/60 last:border-none transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">
                      ({item.lat.toFixed(2)}, {item.lng.toFixed(2)})
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Solar Hubs Presets Dropdown */}
          {showPresetsMenu && (
            <div className="absolute top-full right-0 mt-1 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-slate-950 border-b border-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Hubs Solares y Regiones de Argentina
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {SOLAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectLocation(preset);
                      setShowPresetsMenu(false);
                    }}
                    className="w-full text-left p-2.5 text-xs hover:bg-amber-500/10 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white group-hover:text-amber-300">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                        {preset.country}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {preset.region}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share Button (Desktop) & Live Indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 border-r border-slate-800 pr-3">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[160px] font-medium text-slate-200">
              {currentLocation.name}
            </span>
          </div>

          <button
            onClick={onOpenShareModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir Análisis Público</span>
          </button>
        </div>
      </div>
    </header>
  );
};
