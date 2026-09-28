import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SolarMap } from './components/SolarMap';
import { WeatherPanel } from './components/WeatherPanel';
import { ViabilityScorecard } from './components/ViabilityScorecard';
import { SolarCalcArgentina } from './components/SolarCalcArgentina';
import { ProfessionalSolarMetrics } from './components/ProfessionalSolarMetrics';
import { ShareModal } from './components/ShareModal';
import { LandingDashboard } from './components/LandingDashboard';
import { MobileNavigation, AppViewMode } from './components/MobileNavigation';
import { TechnicalEnergyAnalysis } from './components/TechnicalEnergyAnalysis';
import {
  CurrentWeather,
  DailyForecast,
  EnergyProjections,
  GeminiAnalysisState,
  HourlyForecast,
  LocationCoords,
  SolarSystemConfig,
} from './types';
import {
  fetchSolarWeatherData,
  reverseGeocode,
  SOLAR_PRESETS,
} from './services/weatherService';
import {
  calculateOptimalTilt,
  calculateSolarProjections,
} from './utils/solarCalculations';
import { Share2, Sparkles, MapPin, Zap, ExternalLink, Activity } from 'lucide-react';

export default function App() {
  // Read initial query params if present (from shared link)
  const getInitialParams = () => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    const name = urlParams.get('name');
    const mw = urlParams.get('mw');
    const tech = urlParams.get('tech');
    const tilt = urlParams.get('tilt');
    const view = urlParams.get('view') as AppViewMode | null;

    return {
      location:
        lat && lng
          ? {
              lat: parseFloat(lat),
              lng: parseFloat(lng),
              name: name || 'Ubicación Compartida',
            }
          : null,
      capacityMw: mw ? parseFloat(mw) : 0.5,
      technology: (tech as SolarSystemConfig['technology']) || 'monocrystalline_tracking',
      tilt: tilt ? parseInt(tilt) : undefined,
      view: view && ['landing', 'tech_energy', 'kpis', 'calc', 'map', 'weather', 'audit'].includes(view) ? (view === 'audit' ? 'tech_energy' : view) : 'landing',
    };
  };

  const initialParams = getInitialParams();

  // Active View Tab: 'landing' | 'tech_energy' | 'kpis' | 'calc' | 'map' | 'weather'
  const [activeView, setActiveView] = useState<AppViewMode>(initialParams?.view || 'landing');

  // Location State (defaults to Gran Rosario - Villa Gobernador Gálvez)
  const [location, setLocation] = useState<LocationCoords>(
    initialParams?.location || SOLAR_PRESETS[0]
  );

  // System Configuration State (Default: 0.5 MWp / 500 kWp)
  const [config, setConfig] = useState<SolarSystemConfig>({
    systemCapacityMw: initialParams?.capacityMw ?? 0.5,
    technology: initialParams?.technology || 'monocrystalline_tracking',
    panelEfficiencyPercent: 22.0,
    tiltAngleDegrees: initialParams?.tilt ?? calculateOptimalTilt(location.lat),
    azimuthDegrees: location.lat >= 0 ? 180 : 0,
    inverterEfficiencyPercent: 98.5,
    dcAcRatio: 1.25,
    groundHectares: 0.8,
    electricityPriceUsdMwh: 65,
    capexPerWpUsd: 0.78,
    moduleWattageWp: 585,
    discountRatePercent: 7.5,
    annualDegradationPercent: 0.45,
  });

  // Dynamically calculated required surface (~1.6 ha / MWp for tracker, ~1.4 ha / MWp for fixed)
  const isTrackerTech = config.technology === 'monocrystalline_tracking' || config.technology === 'bifacial_tracking';
  const haRatio = isTrackerTech ? 1.6 : 1.4;
  const calculatedRequiredHectares = Math.round(config.systemCapacityMw * haRatio * 10) / 10;
  const effectiveHectares = calculatedRequiredHectares;

  // Weather and Solar Radiation Data
  const [weatherData, setWeatherData] = useState<{
    current: CurrentWeather;
    hourly: HourlyForecast;
    daily: DailyForecast;
  }>({
    current: {
      temperature: 24,
      humidity: 32,
      cloudCover: 10,
      windSpeed: 14,
      dni: 780,
      ghi: 890,
      dhi: 110,
      uvIndex: 8.5,
      weatherCode: 0,
      sunElevation: 48,
      sunAzimuth: 142,
    },
    hourly: { time: [], ghi: [], dni: [], dhi: [], temperature: [], cloudCover: [] },
    daily: { date: [], ghiSumKwhM2: [], peakSunHours: [], maxTemp: [], minTemp: [], sunshineHours: [] },
  });

  const [loadingWeather, setLoadingWeather] = useState(false);

  // Projections State
  const [projections, setProjections] = useState<EnergyProjections>(() =>
    calculateSolarProjections(location.lat, location.lng, config, {
      temperature: 24,
      cloudCover: 10,
      dni: 780,
      ghi: 890,
      dailyGhiKwh: 6.2,
    })
  );

  // Gemini Maps Grounding State
  const [geminiState, setGeminiState] = useState<GeminiAnalysisState>({
    report: null,
    groundingChunks: [],
    loading: false,
    error: null,
  });

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Update URL search parameters seamlessly so browser address is always shareable
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', location.lat.toFixed(4));
      url.searchParams.set('lng', location.lng.toFixed(4));
      url.searchParams.set('name', location.name);
      url.searchParams.set('mw', config.systemCapacityMw.toString());
      url.searchParams.set('tech', config.technology);
      url.searchParams.set('tilt', config.tiltAngleDegrees.toString());
      url.searchParams.set('view', activeView);
      window.history.replaceState({}, '', url.toString());
    }
  }, [location, config, activeView]);

  // Fetch real-time weather and calculate projections when location changes
  const loadWeatherData = useCallback(async (lat: number, lng: number) => {
    setLoadingWeather(true);
    try {
      const data = await fetchSolarWeatherData(lat, lng);
      setWeatherData(data);

      const calculated = calculateSolarProjections(lat, lng, config, {
        temperature: data.current.temperature,
        cloudCover: data.current.cloudCover,
        dni: data.current.dni,
        ghi: data.current.ghi,
        dailyGhiKwh: data.daily.peakSunHours?.[0] || 5.5,
      });
      setProjections(calculated);
    } catch (err) {
      console.warn('Weather fetch error, keeping baseline:', err);
    } finally {
      setLoadingWeather(false);
    }
  }, [config]);

  // Recalculate projections when config changes
  useEffect(() => {
    const calculated = calculateSolarProjections(location.lat, location.lng, config, {
      temperature: weatherData.current.temperature,
      cloudCover: weatherData.current.cloudCover,
      dni: weatherData.current.dni,
      ghi: weatherData.current.ghi,
      dailyGhiKwh: weatherData.daily.peakSunHours?.[0] || 5.5,
    });
    setProjections(calculated);
  }, [config, location.lat, location.lng, weatherData]);

  // When location changes: load weather & reverse geocode name if needed
  useEffect(() => {
    loadWeatherData(location.lat, location.lng);

    // If name is default coords, resolve friendly name
    if (location.name.startsWith('Coordenadas') || location.name.startsWith('Ubicación')) {
      reverseGeocode(location.lat, location.lng).then((res) => {
        if (res.name) {
          setLocation((prev) => ({ ...prev, name: res.name }));
        }
      });
    }
  }, [location.lat, location.lng]);

  // Track last requested coordinates to avoid redundant API requests
  const lastRequestedLocationRef = useRef<string>('');

  // Call Server-Side Gemini API with Google Maps Grounding
  const handleGenerateGeminiReport = async (force = false) => {
    const locKey = `${location.lat.toFixed(3)}_${location.lng.toFixed(3)}_${config.systemCapacityMw}`;
    if (!force && lastRequestedLocationRef.current === locKey && geminiState.report) {
      return;
    }
    lastRequestedLocationRef.current = locKey;

    setGeminiState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/gemini/solar-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          locationName: location.name,
          systemCapacityMw: config.systemCapacityMw,
          requiredHectares: calculatedRequiredHectares,
          terrainHectares: effectiveHectares,
          tiltDegrees: config.tiltAngleDegrees,
          technology: config.technology,
          annualGhiKwhM2: projections.annualGhiKwhM2,
          averageTempC: weatherData.current.temperature,
          force: force,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setGeminiState({
        report: data.report,
        groundingChunks: data.groundingChunks || [],
        loading: false,
        error: null,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setGeminiState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al conectar con Gemini y Google Maps Grounding',
      }));
    }
  };

  // Trigger Gemini analysis automatically on first load or when switching locations/capacity
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerateGeminiReport();
    }, 1000);
    return () => clearTimeout(timer);
  }, [location.lat, location.lng, config.systemCapacityMw]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <Header
        currentLocation={location}
        onSelectLocation={(loc) => {
          setLocation(loc);
          setConfig((prev) => ({
            ...prev,
            tiltAngleDegrees: calculateOptimalTilt(loc.lat),
            azimuthDegrees: loc.lat >= 0 ? 180 : 0,
          }));
        }}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onHomeClick={() => {
          setActiveView('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Layout with Mobile-First Tabbed Navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 space-y-6">
        {/* View 1: Landing Dashboard (Clean & Minimalist Entry Point) */}
        {activeView === 'landing' && (
          <LandingDashboard
            location={location}
            projections={projections}
            config={config}
            onConfigChange={setConfig}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenLocationSearch={() => {
              const searchInput = document.querySelector('header input[type="text"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {/* View 2: Professional Solar Industry KPIs (SolarStudio AI Reference) */}
        {activeView === 'kpis' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MobileNavigation
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
            <ProfessionalSolarMetrics
              projections={projections}
              config={config}
              onConfigChange={setConfig}
              location={location}
            />
          </div>
        )}

        {/* View 3: SolarCalc Argentina Engine (PyME & Industrial Pre-Studies) */}
        {activeView === 'calc' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MobileNavigation
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
            <SolarCalcArgentina
              currentLocation={location}
              onLocationChange={(loc) => {
                setLocation(loc);
                setConfig((prev) => ({
                  ...prev,
                  tiltAngleDegrees: calculateOptimalTilt(loc.lat),
                  azimuthDegrees: loc.lat >= 0 ? 180 : 0,
                }));
              }}
            />
          </div>
        )}

        {/* View 4: Geospatial Satellite Map */}
        {activeView === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MobileNavigation
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Mapa Geoespacial Interactivo de Emplazamiento Solar</span>
                </div>
                <div className="text-xs text-slate-400 hidden sm:block">
                  Ubicación activa: <strong className="text-slate-200">{location.name}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Interactive Map with Enhanced Spacing & Controls */}
                <div className="lg:col-span-8">
                  <SolarMap
                    location={location}
                    onLocationChange={(newLoc) => {
                      setLocation(newLoc);
                      setConfig((prev) => ({
                        ...prev,
                        tiltAngleDegrees: calculateOptimalTilt(newLoc.lat),
                        azimuthDegrees: newLoc.lat >= 0 ? 180 : 0,
                      }));
                    }}
                  />
                </div>

                {/* Quick Location & Site Specs summary */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Emplazamiento Seleccionado
                      </div>
                      <h2 className="text-base font-extrabold text-white mt-0.5 truncate">
                        {location.name}
                      </h2>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Lat: {location.lat.toFixed(4)}°</span>
                        <span>•</span>
                        <span>Lng: {location.lng.toFixed(4)}°</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Tamaño de la planta:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.1"
                            max="100"
                            step="0.1"
                            value={config.systemCapacityMw}
                            onChange={(e) => {
                              const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                              setConfig((prev) => ({ ...prev, systemCapacityMw: val }));
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-500"
                            aria-label="Tamaño de la planta en MWp"
                          />
                          <span className="font-bold text-amber-400 text-xs">MWp</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Generación Estimada:</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          {projections.annualGenerationMwh.toLocaleString()} MWh/año
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Inclinación Óptima (Tilt):</span>
                        <span className="font-bold text-cyan-400 text-sm">
                          {config.tiltAngleDegrees}° {location.lat >= 0 ? '(Sur)' : '(Norte)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Superficie Terreno Estimada:</span>
                        <span className="font-bold text-slate-200 text-sm">
                          {calculatedRequiredHectares.toFixed(1)} ha
                          <span className="text-[10px] text-slate-500 font-normal ml-1.5">(~{haRatio} ha/MWp)</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="w-full min-h-[44px] py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir Proyecto</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Scorecard & Technical Parameters */}
            <section>
              <ViabilityScorecard
                projections={projections}
                config={config}
                onConfigChange={setConfig}
                latitude={location.lat}
                measuredHectares={effectiveHectares}
              />
            </section>
          </div>
        )}

        {/* View 5: Análisis Técnico y Energético (Auditoría Maps Grounding, Proyecciones de Eficiencia y Modelado Energético) */}
        {(activeView === 'tech_energy' || activeView === 'audit') && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MobileNavigation
              activeView={activeView === 'audit' ? 'tech_energy' : activeView}
              onSelectView={setActiveView}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
            <TechnicalEnergyAnalysis
              location={location}
              config={config}
              onConfigChange={setConfig}
              projections={projections}
              geminiState={geminiState}
              onGenerateGeminiReport={() => handleGenerateGeminiReport(true)}
              hourlyWeather={weatherData.hourly}
            />
          </div>
        )}

        {/* View 6: Clima y Radiación Meteorológica en Vivo */}
        {activeView === 'weather' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MobileNavigation
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
            <WeatherPanel
              weather={weatherData.current}
              hourly={weatherData.hourly}
              daily={weatherData.daily}
              loading={loadingWeather}
            />
          </div>
        )}
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        location={location}
        config={config}
        projections={projections}
      />

      {/* Mobile Bottom Navigation Bar (Always available on smartphone screens) */}
      <MobileNavigation
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 px-4 sm:px-6 text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">HelioSite Pro</span>
            <span>•</span>
            <span>Plataforma Geoespacial de Evaluación Fotovoltaica</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Datos climáticos: Open-Meteo Solar & Satellite</span>
            <span>•</span>
            <span>IA: Gemini 2.5 Flash con Google Maps Grounding</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
