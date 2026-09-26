import React from 'react';
import {
  Activity,
  Zap,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sun,
  TrendingUp,
  DollarSign,
  Compass,
  FileText,
  Search,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { LocationCoords, EnergyProjections, SolarSystemConfig } from '../types';

interface LandingDashboardProps {
  location: LocationCoords;
  projections: EnergyProjections;
  config: SolarSystemConfig;
  onNavigate: (view: 'kpis' | 'calc' | 'map' | 'audit') => void;
  onOpenLocationSearch: () => void;
  onOpenShareModal: () => void;
}

export const LandingDashboard: React.FC<LandingDashboardProps> = ({
  location,
  projections,
  config,
  onNavigate,
  onOpenLocationSearch,
  onOpenShareModal,
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2 sm:py-6 px-1 animate-in fade-in duration-300">
      {/* 1. Contextual Hero Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>Plataforma Solar Nacional • Ley 27.424 & Provincias</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto text-balance">
          Ingeniería y Viabilidad Fotovoltaica para Toda la Argentina
        </h1>

        <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto text-balance">
          Proyectá el rendimiento técnico, la inversión (CAPEX), el período de amortización y el marco legal para cualquier instalación solar industrial o comercial en segundos.
        </p>

        {/* Current Active Location Pill */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onOpenLocationSearch}
            className="min-h-[44px] px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-medium transition cursor-pointer shadow-lg hover:border-amber-500/40"
          >
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400">Emplazamiento:</span>
            <strong className="text-white truncate max-w-[200px] sm:max-w-xs">{location.name}</strong>
            <span className="text-[11px] text-amber-400 underline ml-1 font-bold">Cambiar</span>
          </button>
        </div>
      </section>

      {/* 2. Primary 4-Button Dashboard Menu (Touch-First & High Visibility) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
            Módulos Principales de la Herramienta
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Seleccioná un módulo para comenzar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Card 1: Indicadores Profesionales (SolarStudio KPIs) */}
          <button
            onClick={() => onNavigate('kpis')}
            className="group min-h-[120px] p-5 sm:p-6 bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                1. Indicadores Profesionales (SolarStudio)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Specific Yield ({projections.specificYieldKwhKwp} kWh/kWp), Performance Ratio ({projections.performanceRatio}%), LCOE y flujo de fondos a 25 años.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Explorar Tablero Técnico
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-slate-500 text-[11px]">Estándar IEC / NREL</span>
            </div>
          </button>

          {/* Card 2: SolarCalc Argentina (Pre-Estudios PyME) */}
          <button
            onClick={() => onNavigate('calc')}
            className="group min-h-[120px] p-5 sm:p-6 bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 fill-amber-400/20" />
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                2. Pre-Estudio PyME (SolarCalc Argentina)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dimensionamiento según techo (m²), consumo (kWh) y marco normativo provincial (EPE, EPEC, Edenor, EDEMSA, etc.).
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Calcular Viabilidad & Ahorro
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-slate-500 text-[11px]">24 Jurisdicciones</span>
            </div>
          </button>

          {/* Card 3: Mapa Satelital & Parcela */}
          <button
            onClick={() => onNavigate('map')}
            className="group min-h-[120px] p-5 sm:p-6 bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                3. Mapa Geoespacial & Terreno
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspección satelital HD, herramienta para trazar parcelas en hectáreas, orientación solar y cálculo de inclinación óptima.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                Abrir Mapa & Delimitación
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-slate-500 text-[11px]">Esri / Carto / Topo</span>
            </div>
          </button>

          {/* Card 4: Auditoría de Terreno & Clima en Vivo */}
          <button
            onClick={() => onNavigate('audit')}
            className="group min-h-[120px] p-5 sm:p-6 bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                4. Auditoría Técnica & Clima en Vivo
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluación de accesos viales y líneas eléctricas con Google Maps Grounding junto con radiación solar meteorológica en tiempo real.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                Ver Auditoría de Emplazamiento
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-slate-500 text-[11px]">Google Maps + Open-Meteo</span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Essential Snapshot of Current Site (Clean Summary Strip) */}
      <section className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Resumen del Emplazamiento Activo: {location.name}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Recurso Solar (GHI)</div>
            <div className="text-lg sm:text-xl font-black text-amber-400 mt-1">
              {projections.annualGhiKwhM2.toLocaleString()}
              <span className="text-xs text-amber-300/80 font-normal ml-1">kWh/m²</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Generación Proyectada</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
              {projections.annualGenerationMwh.toLocaleString()}
              <span className="text-xs text-emerald-300/80 font-normal ml-1">MWh/año</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Inclinación Óptima</div>
            <div className="text-lg sm:text-xl font-black text-cyan-400 mt-1">
              {config.tiltAngleDegrees}°
              <span className="text-xs text-cyan-300/80 font-normal ml-1">Norte</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Ahorro / Ingreso Estimado</div>
            <div className="text-lg sm:text-xl font-black text-amber-400 mt-1">
              ${projections.annualRevenueUsd.toLocaleString()}
              <span className="text-xs text-amber-300/80 font-normal ml-1">USD/año</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
