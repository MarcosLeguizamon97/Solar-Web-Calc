import React, { useState } from 'react';
import {
  Bot,
  MapPin,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  Activity,
  Award,
  Zap,
  TrendingUp,
  BarChart3,
  Sliders,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Compass,
  ChevronRight,
  Flame,
  PieChart,
} from 'lucide-react';
import {
  EnergyProjections,
  GeminiAnalysisState,
  HourlyForecast,
  LocationCoords,
  SolarSystemConfig,
} from '../types';
import { MetricHelpTooltip } from './MetricHelpTooltip';
import { MetricExplanationModal } from './MetricExplanationModal';

interface TechnicalEnergyAnalysisProps {
  location: LocationCoords;
  config: SolarSystemConfig;
  onConfigChange: (newConfig: SolarSystemConfig) => void;
  projections: EnergyProjections;
  geminiState: GeminiAnalysisState;
  onGenerateGeminiReport: () => void;
  hourlyWeather: HourlyForecast;
}

type ModelingTab = 'monthly' | 'hourly' | 'sizing';

export const TechnicalEnergyAnalysis: React.FC<TechnicalEnergyAnalysisProps> = ({
  location,
  config,
  onConfigChange,
  projections,
  geminiState,
  onGenerateGeminiReport,
  hourlyWeather,
}) => {
  const [modelingTab, setModelingTab] = useState<ModelingTab>('monthly');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [activeMetricModal, setActiveMetricModal] = useState<{ id: string; value?: string | number } | null>(null);

  const { report, groundingChunks, loading: geminiLoading, error: geminiError, timestamp: geminiTimestamp } = geminiState;

  // Extract Google Maps grounded sources
  const mapSources = (groundingChunks || [])
    .filter((chunk) => chunk.maps?.uri || chunk.web?.uri)
    .map((chunk) => ({
      title: chunk.maps?.title || chunk.web?.title || 'Ubicación verificada en Google Maps',
      uri: chunk.maps?.uri || chunk.web?.uri || '#',
      reviewSnippets: chunk.maps?.placeAnswerSources?.reviewSnippets || [],
    }));

  // Hourly curve data
  const hourlyCount = Math.min(24, hourlyWeather.time?.length || 0);
  const maxGhi = Math.max(100, ...(hourlyWeather.ghi || []).slice(0, 24));
  const maxDni = Math.max(100, ...(hourlyWeather.dni || []).slice(0, 24));
  const maxRadiation = Math.max(maxGhi, maxDni, 800);

  // Monthly data
  const monthlyData = projections.monthlyGenerationMwh || [];
  const maxMonthlyGen = Math.max(1, ...monthlyData.map((m) => m.generationMwh));

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-2 px-1 animate-in fade-in duration-300">
      {/* =========================================================================
          VIEW HEADER & CONTEXT STRIP
         ========================================================================= */}
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Módulo de Ingeniería Especializada</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Análisis Técnico y Energético
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
                Evaluación integral de viabilidad en tres dimensiones: auditoría geoespacial asistida por IA con cartografía real, proyecciones de eficiencia según norma internacional IEC 61724 y simulación numérica del modelado energético.
              </p>
            </div>

            {/* Quick Context Pill */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium px-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[160px] font-bold">{location.name.split(',')[0]}</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <div className="px-2 font-mono font-bold text-amber-400">
                {config.systemCapacityMw} MWp
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECCIÓN 1: AUDITORÍA TÉCNICA DE EMPLAZAMIENTO CON GOOGLE MAPS GROUNDING
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              Auditoría Técnica de Emplazamiento con Google Maps Grounding
            </h2>
            <p className="text-xs text-slate-400">
              Inspección cartográfica en vivo: accesibilidad logística por rutas nacionales, cercanía a líneas de alta tensión (AT/MT) y condicionantes topográficos.
            </p>
          </div>
        </div>

        {/* Card Container for Gemini Grounding Report */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Action and status sub-header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-300">
                Modelo: Gemini 3.8 Flash con Herramienta Google Maps Grounding
              </span>
            </div>

            <button
              onClick={onGenerateGeminiReport}
              disabled={geminiLoading}
              className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${geminiLoading ? 'animate-spin' : ''}`} />
              <span>{geminiLoading ? 'Consultando Google Maps e IA...' : report ? 'Actualizar Auditoría de Terreno' : 'Generar Auditoría de Terreno'}</span>
            </button>
          </div>

          {/* Loading State */}
          {geminiLoading && (
            <div className="bg-slate-950/70 rounded-2xl p-8 border border-slate-800 text-center space-y-4 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Consultando infraestructura real en Google Maps...
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Analizando accesos terrestres, corredores de transporte de energía y orografía en las coordenadas [{location.lat.toFixed(4)}, {location.lng.toFixed(4)}].
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {geminiError && !geminiLoading && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 text-xs text-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">No se pudo completar la consulta de auditoría</div>
                <div className="mt-0.5 text-rose-300">{geminiError}</div>
                <button
                  onClick={onGenerateGeminiReport}
                  className="mt-2 text-amber-400 underline font-bold cursor-pointer"
                >
                  Intentar nuevamente
                </button>
              </div>
            </div>
          )}

          {/* Report Body */}
          {report && !geminiLoading && (
            <div className="space-y-6">
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-4 text-xs sm:text-sm">
                {report.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('###') || paragraph.startsWith('##') || paragraph.startsWith('#')) {
                    const cleanTitle = paragraph.replace(/^[#]+\s*/, '');
                    return (
                      <h3
                        key={idx}
                        className="text-base sm:text-lg font-bold text-amber-400 mt-4 pt-2 border-t border-slate-800/80 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        {cleanTitle}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('*') || paragraph.startsWith('-')) {
                    const items = paragraph.split('\n');
                    return (
                      <ul key={idx} className="space-y-2 my-2 pl-4 list-disc marker:text-amber-400">
                        {items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-slate-300">
                            {item.replace(/^[\*\-]\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-300 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              {/* Verified Google Maps Sources */}
              {mapSources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fuentes y Lugares Verificados en Google Maps Grounding ({mapSources.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {mapSources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition group flex flex-col justify-between text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white group-hover:text-amber-300 truncate">
                            {source.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 truncate">
                          maps.google.com
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {geminiTimestamp && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2">
                  <span>Auditoría generada para: {location.name}</span>
                  <span>{new Date(geminiTimestamp).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Empty / Initial state call to action */}
          {!report && !geminiLoading && !geminiError && (
            <div className="text-center py-8 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6">
              <Bot className="w-10 h-10 text-amber-400/80 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">Auditoría no ejecutada todavía</h4>
                <p className="text-xs text-slate-400">
                  Hacé clic en &quot;Generar Auditoría de Terreno&quot; para consultar en tiempo real las rutas provinciales, proximidad de líneas eléctricas y condiciones del terreno en {location.name}.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SEPARADOR SUTIL DE INGENIERÍA 1 → 2
         ========================================================================= */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800/80"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Transición a Métricas de Calidad
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECCIÓN 2: PROYECCIONES DE EFICIENCIA
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Proyecciones de Eficiencia Fotovoltaica (IEC 61724)
            </h2>
            <p className="text-xs text-slate-400">
              Evaluación estandarizada del rendimiento de conversión: Performance Ratio (PR), factor de capacidad, pérdidas térmicas y degradación.
            </p>
          </div>
        </div>

        {/* Efficiency Cards Block */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Top 4 Efficiency KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. PR */}
            <div className="p-4 bg-gradient-to-br from-emerald-500/15 via-slate-950/80 to-slate-950 border border-emerald-500/30 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/60 transition relative">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Performance Ratio (PR)
                  </span>
                  <MetricHelpTooltip
                    metricId="pr"
                    metricTitle="Performance Ratio (PR)"
                    currentValue={`${projections.performanceRatio}%`}
                    onOpenFullModal={() =>
                      setActiveMetricModal({
                        id: 'pr',
                        value: `${projections.performanceRatio}%`,
                      })
                    }
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {projections.performanceRatio}%
                  </span>
                  <span className="text-xs text-emerald-300/80 font-bold">eficiencia global</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Inyección real en CA vs. radiación teórica en el plano de módulos (POA).
              </div>
            </div>

            {/* 2. Specific Yield */}
            <div className="p-4 bg-gradient-to-br from-amber-500/15 via-slate-950/80 to-slate-950 border border-amber-500/30 rounded-2xl flex flex-col justify-between group hover:border-amber-500/60 transition relative">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Rendimiento Específico
                  </span>
                  <MetricHelpTooltip
                    metricId="specific_yield"
                    metricTitle="Specific Yield (Rendimiento Específico)"
                    currentValue={`${projections.specificYieldKwhKwp} kWh/kWp/año`}
                    onOpenFullModal={() =>
                      setActiveMetricModal({
                        id: 'specific_yield',
                        value: `${projections.specificYieldKwhKwp} kWh/kWp`,
                      })
                    }
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">
                    {projections.specificYieldKwhKwp.toLocaleString()}
                  </span>
                  <span className="text-xs text-amber-300/80 font-bold">kWh/kWp/año</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Producción anual generada por cada kilovatio pico instalado.
              </div>
            </div>

            {/* 3. Capacity Factor */}
            <div className="p-4 bg-gradient-to-br from-cyan-500/15 via-slate-950/80 to-slate-950 border border-cyan-500/30 rounded-2xl flex flex-col justify-between group hover:border-cyan-500/60 transition relative">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Factor de Capacidad
                  </span>
                  <MetricHelpTooltip
                    metricId="capacity_factor"
                    metricTitle="Factor de Capacidad (CF)"
                    currentValue={`${projections.capacityFactorPercent}%`}
                    onOpenFullModal={() =>
                      setActiveMetricModal({
                        id: 'capacity_factor',
                        value: `${projections.capacityFactorPercent}%`,
                      })
                    }
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                    {projections.capacityFactorPercent}%
                  </span>
                  <span className="text-xs text-cyan-300/80 font-bold">anual</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Utilización real de la planta sobre 8.760 horas al año.
              </div>
            </div>

            {/* 4. Thermal & Operating Losses */}
            <div className="p-4 bg-gradient-to-br from-rose-500/15 via-slate-950/80 to-slate-950 border border-rose-500/30 rounded-2xl flex flex-col justify-between group hover:border-rose-500/60 transition relative">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    Pérdida Térmica
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                    T_celda {projections.averageCellTempC}°C
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-rose-400">
                    -{projections.tempLossPercent}%
                  </span>
                  <span className="text-xs text-rose-300/80 font-bold">por calor</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Afectación por temperatura sobre el coeficiente nominal de potencia.
              </div>
            </div>
          </div>

          {/* Interactive Loss Waterfall (Cascada de Pérdidas de Radiación a Red) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-amber-400" />
                Desglose Cascada de Eficiencia (De Radiación Incidente a Inyección Neta)
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                PR Final: {projections.performanceRatio}%
              </span>
            </div>

            <div className="space-y-2">
              {projections.lossWaterfall.map((step, idx) => {
                const isGain = step.lossPercent < 0;
                const isZero = step.lossPercent === 0;

                return (
                  <div
                    key={step.id}
                    className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{step.name}</div>
                        <div className="text-[11px] text-slate-400">{step.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end shrink-0">
                      <span
                        className={`font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg font-mono ${
                          isZero
                            ? 'bg-slate-800 text-slate-300'
                            : isGain
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isZero ? 'Base 100%' : isGain ? `+${Math.abs(step.lossPercent)}%` : `-${step.lossPercent}%`}
                      </span>
                      <span className="text-slate-400 font-mono text-xs w-28 text-right">
                        {step.valueKwhM2OrMwh.toLocaleString()} {step.category === 'irradiance' ? 'kWh/m²' : 'MWh/año'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SEPARADOR SUTIL DE INGENIERÍA 2 → 3
         ========================================================================= */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800/80"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Transición a Simulación de Producción
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECCIÓN 3: MODELADO ENERGÉTICO
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-sm">
            3
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Modelado Energético y Simulación de Producción
            </h2>
            <p className="text-xs text-slate-400">
              Generación estacional mes a mes (12 Meses en MWh), perfil horario solar 24h y dimensionamiento físico de hardware para {config.systemCapacityMw} MWp.
            </p>
          </div>
        </div>

        {/* Modeling Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dimensiones de Simulación Energética:
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setModelingTab('monthly')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modelingTab === 'monthly'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Generación 12 Meses</span>
              </button>

              <button
                onClick={() => setModelingTab('hourly')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modelingTab === 'hourly'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Curva Solar 24h</span>
              </button>

              <button
                onClick={() => setModelingTab('sizing')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modelingTab === 'sizing'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Ratios de Hardware</span>
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Monthly Generation Bar Chart */}
          {modelingTab === 'monthly' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
                <span>Inyección Neta Estimada a Red en Megavatios-Hora (MWh/mes)</span>
                <span className="font-extrabold text-amber-400 text-sm">
                  Total Anual: {projections.annualGenerationMwh.toLocaleString()} MWh/año
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="h-64 w-full relative flex items-end justify-between gap-1.5 sm:gap-2.5 pt-6 pb-6 px-2 bg-slate-950/50 rounded-2xl border border-slate-800/80">
                {monthlyData.map((item, idx) => {
                  const heightPercent = Math.max(8, (item.generationMwh / maxMonthlyGen) * 100);
                  const isHovered = hoveredMonthIndex === idx;

                  return (
                    <div
                      key={item.month}
                      className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setHoveredMonthIndex(idx)}
                      onMouseLeave={() => setHoveredMonthIndex(null)}
                    >
                      {/* Floating tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-16 bg-slate-900 border border-amber-500/50 text-white text-[11px] p-2.5 rounded-xl shadow-2xl z-20 whitespace-nowrap pointer-events-none">
                          <div className="font-bold text-amber-400">{item.month}</div>
                          <div>Generación: <strong className="text-white">{item.generationMwh.toLocaleString()} MWh</strong></div>
                          <div className="text-slate-400">Radiación: {item.ghiKwhM2} kWh/m²</div>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 relative ${
                          isHovered
                            ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 shadow-lg shadow-amber-500/30'
                            : 'bg-gradient-to-t from-amber-600/80 to-amber-400/90 hover:from-amber-500 hover:to-yellow-400'
                        }`}
                      >
                        <div className="text-[10px] text-slate-950 font-black text-center mt-1 hidden sm:block truncate px-0.5">
                          {item.generationMwh >= 1000
                            ? `${(item.generationMwh / 1000).toFixed(1)}k`
                            : item.generationMwh}
                        </div>
                      </div>

                      {/* Month Label */}
                      <span className="text-[11px] text-slate-400 mt-2 font-medium">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Energy summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Producción Anual Neta:</span>
                  <div className="text-white font-extrabold text-base mt-0.5">
                    {projections.annualGenerationMwh.toLocaleString()} MWh
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Ingreso/Ahorro Anual:</span>
                  <div className="text-emerald-400 font-extrabold text-base mt-0.5">
                    ${projections.annualRevenueUsd.toLocaleString()} USD
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Hogares Abastecidos:</span>
                  <div className="text-amber-400 font-extrabold text-base mt-0.5">
                    ~{projections.homesPowered.toLocaleString()} hogares
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">CO₂ Evitado Anual:</span>
                  <div className="text-cyan-400 font-extrabold text-base mt-0.5">
                    {projections.avoidedCo2TonsYear.toLocaleString()} ton
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Hourly Solar Curve SVG */}
          {modelingTab === 'hourly' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
                <span>Curva Solar Horaria Simulada (Irradiancia y Temperatura en 24 Horas)</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    GHI (W/m²)
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-300 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"></span>
                    DNI Directo (W/m²)
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <span className="w-3 h-1 bg-cyan-400 inline-block"></span>
                    Temp (°C)
                  </span>
                </div>
              </div>

              {/* 24h Solar SVG Curve */}
              <div className="h-60 w-full bg-slate-950/60 rounded-2xl border border-slate-800 p-3 relative overflow-hidden flex flex-col justify-between">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[50, 100, 150].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="800"
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* GHI Curve (Amber Area) */}
                  <path
                    d={`M 0 190 ${
                      (hourlyWeather.ghi || []).slice(0, 24).map((val, idx) => {
                        const x = (idx / 23) * 800;
                        const y = 190 - (val / maxRadiation) * 160;
                        return `L ${x} ${y}`;
                      }).join(' ')
                    } L 800 190 Z`}
                    fill="url(#amberGradient)"
                    opacity="0.35"
                  />

                  {/* GHI Line */}
                  <path
                    d={`M 0 190 ${
                      (hourlyWeather.ghi || []).slice(0, 24).map((val, idx) => {
                        const x = (idx / 23) * 800;
                        const y = 190 - (val / maxRadiation) * 160;
                        return `L ${x} ${y}`;
                      }).join(' ')
                    }`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />

                  {/* DNI Line (Yellow) */}
                  <path
                    d={`M 0 190 ${
                      (hourlyWeather.dni || []).slice(0, 24).map((val, idx) => {
                        const x = (idx / 23) * 800;
                        const y = 190 - (val / maxRadiation) * 160;
                        return `L ${x} ${y}`;
                      }).join(' ')
                    }`}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />

                  <defs>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X-axis 24h timeline */}
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span className="text-amber-400 font-bold">12:00 (Cenit)</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Sizing and Hardware Specifications */}
          {modelingTab === 'sizing' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-xs text-slate-400 px-1">
                Dimensionamiento Físico y Eléctrico de Equipamiento Tier-1
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                {/* Modules */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="text-slate-400 font-medium">Paneles Fotovoltaicos:</span>
                  <div className="text-xl font-black text-amber-400">
                    {projections.moduleCount.toLocaleString()} paneles
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Módulos bifaciales de {config.moduleWattageWp || 585} Wp (Eficiencia: {config.panelEfficiencyPercent}%).
                  </p>
                </div>

                {/* Inverters */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="text-slate-400 font-medium">Capacidad de Inversores:</span>
                  <div className="text-xl font-black text-cyan-400">
                    {projections.inverterCount} unidades ({projections.acCapacityKw} kWac)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Relación DC/AC (ILR): {projections.dcAcRatio}x (Eficiencia de conversión: {config.inverterEfficiencyPercent}%).
                  </p>
                </div>

                {/* Lifetime */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="text-slate-400 font-medium">Generación a 25 Años:</span>
                  <div className="text-xl font-black text-emerald-400">
                    {projections.lifetimeGenerationMwh.toLocaleString()} MWh
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Simulación con degradación acumulada de {config.annualDegradationPercent || 0.45}% anual.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Metric explanation modal */}
      <MetricExplanationModal
        metricId={activeMetricModal?.id || null}
        currentValue={activeMetricModal?.value}
        onClose={() => setActiveMetricModal(null)}
      />
    </div>
  );
};
