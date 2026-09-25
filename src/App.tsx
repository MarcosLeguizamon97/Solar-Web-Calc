import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SolarMap } from './components/SolarMap';
import { WeatherPanel } from './components/WeatherPanel';
import { ViabilityScorecard } from './components/ViabilityScorecard';
import { SolarCharts } from './components/SolarCharts';
import { GeminiSolarReport } from './components/GeminiSolarReport';
import { SolarCalcArgentina } from './components/SolarCalcArgentina';
import { ProfessionalSolarMetrics } from './components/ProfessionalSolarMetrics';
import { ShareModal } from './components/ShareModal';
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

    if (lat && lng) {
      return {
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          name: name || 'Ubicación Compartida',
        },
        capacityMw: mw ? parseFloat(mw) : 5,
        technology: (tech as SolarSystemConfig['technology']) || 'monocrystalline_tracking',
        tilt: tilt ? parseInt(tilt) : undefined,
      };
    }
    return null;
  };

  const initialParams = getInitialParams();

  // Active View Tab: 'kpis' (Indicadores Profesionales SolarStudio) | 'calc' (SolarCalc Argentina) | 'map' (Mapa & Clima) | 'all' (Vista Integral)
  const [activeView, setActiveView] = useState<'kpis' | 'calc' | 'map' | 'all'>('kpis');

  // Location State (defaults to Gran Rosario - Villa Gobernador Gálvez)
  const [location, setLocation] = useState<LocationCoords>(
    initialParams?.location || SOLAR_PRESETS[0]
  );

  // Measured land area in hectares from map polygon tool
  const [measuredHectares, setMeasuredHectares] = useState<number>(10);

  // System Configuration State
  const [config, setConfig] = useState<SolarSystemConfig>({
    systemCapacityMw: initialParams?.capacityMw || 5,
    technology: initialParams?.technology || 'monocrystalline_tracking',
    panelEfficiencyPercent: 22.0,
    tiltAngleDegrees: initialParams?.tilt ?? calculateOptimalTilt(location.lat),
    azimuthDegrees: location.lat >= 0 ? 180 : 0,
    inverterEfficiencyPercent: 98.5,
    dcAcRatio: 1.25,
    groundHectares: 10,
    electricityPriceUsdMwh: 65,
    capexPerWpUsd: 0.78,
    moduleWattageWp: 585,
    discountRatePercent: 7.5,
    annualDegradationPercent: 0.45,
  });

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
      window.history.replaceState({}, '', url.toString());
    }
  }, [location, config]);

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
          tiltDegrees: config.tiltAngleDegrees,
          technology: config.technology,
          terrainHectares: measuredHectares || 10,
          annualGhiKwhM2: projections.annualGhiKwhM2,
          averageTempC: weatherData.current.temperature,
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

  // Trigger Gemini analysis automatically on first load or when switching locations
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerateGeminiReport();
    }, 1200);
    return () => clearTimeout(timer);
  }, [location.lat, location.lng]);

  // Polygon area change handler
  const handleTerrainAreaChange = (ha: number) => {
    setMeasuredHectares(ha);
    // If hectares is significantly larger, suggest capacity: 1 MWp ~ 1.6 ha
    const suggestedMw = Math.max(0.5, Math.round((ha / 1.6) * 10) / 10);
    if (Math.abs(suggestedMw - config.systemCapacityMw) > 2) {
      setConfig((prev) => ({ ...prev, systemCapacityMw: suggestedMw }));
    }
  };

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
      />

      {/* Public Share Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-b border-amber-500/25 px-4 py-2 text-xs text-amber-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              <strong>Enlace Público Activo:</strong> Este análisis interactivo se actualiza automáticamente con cada cambio en el mapa.
            </span>
          </div>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 underline font-bold text-amber-300 hover:text-white transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copiar / Compartir Enlace Público</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* View Switcher Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveView('kpis')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeView === 'kpis'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Indicadores Profesionales (SolarStudio)</span>
            </button>

            <button
              onClick={() => setActiveView('calc')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeView === 'calc'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>SolarCalc Argentina (Pre-Estudios PyME)</span>
            </button>

            <button
              onClick={() => setActiveView('map')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeView === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Mapa Satelital & Clima</span>
            </button>

            <button
              onClick={() => setActiveView('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeView === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vista Integral (Todo)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Ubicación activa:</span>
            <strong className="text-amber-400 truncate max-w-xs">{location.name}</strong>
          </div>
        </div>

        {/* Section: Professional Solar Industry Indicators (Inspired by SolarStudio AI) */}
        {(activeView === 'kpis' || activeView === 'all') && (
          <section className="animate-in fade-in duration-300">
            <ProfessionalSolarMetrics
              projections={projections}
              config={config}
              onConfigChange={setConfig}
              location={location}
            />
          </section>
        )}

        {/* Section: SolarCalc Argentina Engine */}
        {(activeView === 'calc' || activeView === 'all') && (
          <section className="animate-in fade-in duration-300">
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
          </section>
        )}

        {/* Section: Interactive Satellite Map & Real-Time Weather */}
        {(activeView === 'map' || activeView === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Section: Interactive Map & Live Meteorological Panel */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Mapa Geoespacial y Delimitación de Parcela Solar</span>
                </div>
                <div className="text-xs text-slate-400 hidden sm:block">
                  Ubicación: <strong className="text-slate-200">{location.name}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Interactive Map */}
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
                    onTerrainAreaChange={handleTerrainAreaChange}
                    measuredHectares={measuredHectares}
                  />
                </div>

                {/* Quick Location & Live Status summary on side */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
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
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Capacidad Proyectada:</span>
                        <span className="font-bold text-amber-400 text-sm">{config.systemCapacityMw} MWp</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Generación Estimada:</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          {projections.annualGenerationMwh.toLocaleString()} MWh/año
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Inclinación Óptima (Tilt):</span>
                        <span className="font-bold text-cyan-400 text-sm">
                          {config.tiltAngleDegrees}° {location.lat >= 0 ? '(Sur)' : '(Norte)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400">Superficie Terreno:</span>
                        <span className="font-bold text-slate-200 text-sm">
                          {measuredHectares.toFixed(1)} ha
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir con Inversionistas / Clientes</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Real-time Weather & Solar Panel */}
            <section>
              <WeatherPanel
                weather={weatherData.current}
                hourly={weatherData.hourly}
                daily={weatherData.daily}
                loading={loadingWeather}
              />
            </section>

            {/* Section 3: Viability Scorecard & Parameter Configurator */}
            <section>
              <ViabilityScorecard
                projections={projections}
                config={config}
                onConfigChange={setConfig}
                latitude={location.lat}
                measuredHectares={measuredHectares}
              />
            </section>

            {/* Section 4: Solar Charts (12 Months, 24h Hourly Curve, Losses, Financials) */}
            <section>
              <SolarCharts
                hourly={weatherData.hourly}
                projections={projections}
                systemCapacityMw={config.systemCapacityMw}
              />
            </section>

            {/* Section 5: Gemini Senior Engineer Feasibility Audit with Google Maps Grounding */}
            <section>
              <GeminiSolarReport
                analysisState={geminiState}
                onGenerateReport={handleGenerateGeminiReport}
                location={location}
                config={config}
              />
            </section>
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 px-4 sm:px-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">HelioSite Pro</span>
            <span>•</span>
            <span>Plataforma Geoespacial de Evaluación Fotovoltaica</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Datos climáticos: Open-Meteo Solar & Satellite</span>
            <span>•</span>
            <span>IA: Gemini 3.8 Flash con Google Maps Grounding</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
