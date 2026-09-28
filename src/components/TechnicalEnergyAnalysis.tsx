import React, { useState, useMemo } from 'react';
import {
  Bot,
  MapPin,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
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
import { formatNumber, formatPercent, formatCurrency, formatCoord, normalizeReportNumbers } from '../utils/formatters';

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

  // Dynamic surface calculation based on active plant capacity state
  const isTracker = config.technology === 'monocrystalline_tracking' || config.technology === 'bifacial_tracking';
  const haRatio = isTracker ? 1.6 : 1.4;
  const currentRequiredHectares = formatNumber(Math.round(config.systemCapacityMw * haRatio * 10) / 10, 1);

  // Synchronize and dynamically replace any static capacity/hectares in the report text
  const processedReport = useMemo(() => {
    if (!report) return '';
    return getReactiveReportContent(report, config.systemCapacityMw, isTracker);
  }, [report, config.systemCapacityMw, isTracker]);

  // Generate clean, formatted WhatsApp share link directly using https://wa.me/?text=...
  const whatsAppShareUrl = useMemo(() => {
    if (!processedReport) return '';
    const text = formatReportForWhatsApp(
      processedReport,
      location,
      config,
      currentRequiredHectares,
      isTracker
    );
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [processedReport, location, config, currentRequiredHectares, isTracker]);

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
              <div className="px-2 font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <span>{formatNumber(config.systemCapacityMw, 1)} MWp</span>
                <span className="text-slate-600 font-normal">|</span>
                <span className="text-emerald-400 font-medium">~{currentRequiredHectares} ha</span>
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

          {/* Dynamic Plant Capacity & Surface Area Live Reactive Box */}
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <span>Dimensionamiento Reactivo de Superficie</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      En Tiempo Real
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] sm:text-xs mt-0.5">
                    Modifica el tamaño de la planta para recalcular matemáticamente la superficie de terreno y actualizar el informe técnico.
                  </div>
                </div>
              </div>

              {/* Dynamic Calculated Surface Result Pill */}
              <div className="flex items-center gap-2 shrink-0 bg-slate-900 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
                <span className="text-slate-400 text-xs">Superficie Calculada:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">{currentRequiredHectares} ha</span>
              </div>
            </div>

            {/* Interactive Capacity Controls: Slider + Number Input + Presets */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Range Slider and Direct Input */}
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="tech-plant-capacity-input" className="text-slate-300 font-medium">
                    Tamaño de la planta (MWp):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="tech-plant-capacity-input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="50"
                      value={config.systemCapacityMw}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          const newHa = Math.round(val * haRatio * 10) / 10;
                          onConfigChange({
                            ...config,
                            systemCapacityMw: val,
                            groundHectares: newHa,
                          });
                        }
                      }}
                      className="w-20 px-2.5 py-1 bg-slate-900 border border-amber-500/40 rounded-lg text-amber-400 font-mono font-bold text-right text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <span className="text-amber-400 font-bold text-xs">MWp</span>
                    <span className="text-slate-500 text-[11px] font-mono">({formatNumber(Math.round(config.systemCapacityMw * 1000))} kWp)</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.systemCapacityMw}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const newHa = Math.round(val * haRatio * 10) / 10;
                    onConfigChange({
                      ...config,
                      systemCapacityMw: val,
                      groundHectares: newHa,
                    });
                  }}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="md:col-span-5 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
                <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Presets:</span>
                {[0.5, 1, 2, 5, 10].map((presetMw) => {
                  const isSelected = Math.abs(config.systemCapacityMw - presetMw) < 0.05;
                  return (
                    <button
                      key={presetMw}
                      onClick={() => {
                        const newHa = Math.round(presetMw * haRatio * 10) / 10;
                        onConfigChange({
                          ...config,
                          systemCapacityMw: presetMw,
                          groundHectares: newHa,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {formatNumber(presetMw, Number.isInteger(presetMw) ? 0 : 1)} MWp
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Formula & Calculation Explanation */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Cálculo matemático:</span>
                <span>
                  Para una planta de <strong className="text-amber-300 font-bold font-mono">{formatNumber(config.systemCapacityMw, 1)} MWp</strong> se estiman necesarias aproximadamente <strong className="text-emerald-300 font-bold font-mono">{currentRequiredHectares} hectáreas</strong>.
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                Ratio: ~{formatNumber(haRatio, 1)} ha/MWp ({isTracker ? 'seguidores a 1 eje' : 'estructura fija'})
              </span>
            </div>
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
                  Analizando accesos terrestres, corredores de transporte de energía y orografía para una planta de {formatNumber(config.systemCapacityMw, 1)} MWp ({currentRequiredHectares} ha) en las coordenadas [{formatCoord(location.lat)}, {formatCoord(location.lng)}].
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

          {/* Report Body with Dynamic Reactive Synchronizer & Native WhatsApp Share */}
          {report && !geminiLoading && (
            <div className="space-y-5">
              {/* WhatsApp Share Button Strip (Immediately above the report) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl shadow-lg shadow-emerald-950/20">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Informe Técnico Formateado ({config.systemCapacityMw} MWp • {currentRequiredHectares} ha)</span>
                </div>

                <a
                  href={whatsAppShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-[#25D366]/20 flex items-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
                  title="Compartir informe técnico limpio y formateado directamente por WhatsApp"
                  aria-label="Compartir por WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                  <span>Compartir por WhatsApp</span>
                </a>
              </div>

              {/* Report Body */}
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed text-xs sm:text-sm bg-slate-950/50 p-4 sm:p-6 rounded-2xl border border-slate-800/80">
                <ReportRenderer
                  content={processedReport}
                  systemCapacityMw={config.systemCapacityMw}
                  requiredHectares={currentRequiredHectares}
                />
              </div>

              {/* WhatsApp Share Button Strip (Immediately below the report) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">Auditoría:</span>
                  <span className="text-slate-300 truncate max-w-xs">{location.name}</span>
                  {geminiTimestamp && (
                    <span className="text-slate-500 hidden sm:inline">• {new Date(geminiTimestamp).toLocaleTimeString()}</span>
                  )}
                </div>

                <a
                  href={whatsAppShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 hover:border-[#25D366] text-[#25D366] hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                  title="Compartir informe técnico limpio y formateado directamente por WhatsApp"
                  aria-label="Compartir por WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>Compartir por WhatsApp</span>
                </a>
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
                    {formatPercent(projections.performanceRatio)}
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
                    currentValue={`${formatNumber(projections.specificYieldKwhKwp)} kWh/kWp/año`}
                    onOpenFullModal={() =>
                      setActiveMetricModal({
                        id: 'specific_yield',
                        value: `${formatNumber(projections.specificYieldKwhKwp)} kWh/kWp`,
                      })
                    }
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">
                    {formatNumber(projections.specificYieldKwhKwp)}
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
                    currentValue={formatPercent(projections.capacityFactorPercent)}
                    onOpenFullModal={() =>
                      setActiveMetricModal({
                        id: 'capacity_factor',
                        value: formatPercent(projections.capacityFactorPercent),
                      })
                    }
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                    {formatPercent(projections.capacityFactorPercent)}
                  </span>
                  <span className="text-xs text-cyan-300/80 font-bold">anual</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Utilización real de la planta sobre 8760 horas al año.
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
                    T_celda {formatNumber(projections.averageCellTempC, 1)}°C
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-rose-400">
                    -{formatPercent(projections.tempLossPercent)}
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
                PR Final: {formatPercent(projections.performanceRatio)}
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
                        {isZero ? 'Base 100%' : isGain ? `+${formatPercent(Math.abs(step.lossPercent))}` : `-${formatPercent(step.lossPercent)}`}
                      </span>
                      <span className="text-slate-400 font-mono text-xs w-28 text-right">
                        {formatNumber(step.valueKwhM2OrMwh)} {step.category === 'irradiance' ? 'kWh/m²' : 'MWh/año'}
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
                  Total Anual: {formatNumber(projections.annualGenerationMwh)} MWh/año
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
                          <div>Generación: <strong className="text-white">{formatNumber(item.generationMwh)} MWh</strong></div>
                          <div className="text-slate-400">Radiación: {formatNumber(item.ghiKwhM2)} kWh/m²</div>
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
                            ? `${formatNumber(item.generationMwh / 1000, 1)}k`
                            : formatNumber(item.generationMwh)}
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
                    {formatNumber(projections.annualGenerationMwh)} MWh
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Ingreso/Ahorro Anual:</span>
                  <div className="text-emerald-400 font-extrabold text-base mt-0.5">
                    ${formatNumber(projections.annualRevenueUsd)} USD
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Hogares Abastecidos:</span>
                  <div className="text-amber-400 font-extrabold text-base mt-0.5">
                    ~{formatNumber(projections.homesPowered)} hogares
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">CO₂ Evitado Anual:</span>
                  <div className="text-cyan-400 font-extrabold text-base mt-0.5">
                    {formatNumber(projections.avoidedCo2TonsYear)} ton
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
                    {formatNumber(projections.moduleCount)} paneles
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Módulos bifaciales de {formatNumber(config.moduleWattageWp || 585)} Wp (Eficiencia: {formatPercent(config.panelEfficiencyPercent)}).
                  </p>
                </div>

                {/* Inverters */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="text-slate-400 font-medium">Capacidad de Inversores:</span>
                  <div className="text-xl font-black text-cyan-400">
                    {formatNumber(projections.inverterCount)} unidades ({formatNumber(projections.acCapacityKw)} kWac)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Relación DC/AC (ILR): {formatNumber(projections.dcAcRatio, 2)}x (Eficiencia de conversión: {formatPercent(config.inverterEfficiencyPercent)}).
                  </p>
                </div>

                {/* Lifetime */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="text-slate-400 font-medium">Generación a 25 Años:</span>
                  <div className="text-xl font-black text-emerald-400">
                    {formatNumber(projections.lifetimeGenerationMwh)} MWh
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Simulación con degradación acumulada de {formatPercent(config.annualDegradationPercent || 0.45, 2)} anual.
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

/**
 * Transforms raw report text to ensure plant capacity in MWp and land surface in hectares
 * are 100% dynamic, mathematically exact, and reactively bound to current application state.
 */
function getReactiveReportContent(
  rawText: string,
  capacityMw: number,
  isTracker: boolean
): string {
  const haRatio = isTracker ? 1.6 : 1.4;
  const hectares = formatNumber(Math.round(capacityMw * haRatio * 10) / 10, 1);
  const formattedCapacity = formatNumber(capacityMw, Number.isInteger(capacityMw) ? 0 : 1);
  const formattedHaRatio = formatNumber(haRatio, 1);
  const techLabel = isTracker ? 'seguidores a 1 eje' : 'estructura fija';

  let text = rawText;

  // 1. Target any line/bullet mentioning "Superficie requerida", "Superficie estimada", or "Superficie de terreno"
  text = text.replace(
    /([-*•]?\s*(?:\*\*)?(?:Superficie\s+requerida|Superficie\s+estimada|Superficie\s+de\s+terreno)(?:\*\*)?:?\s*).*?(?=(\n|$))/gi,
    `- **Superficie requerida:** Para una planta de **${formattedCapacity} MWp**, se estiman necesarias aproximadamente **${hectares} hectáreas** (ratio de diseño: ~${formattedHaRatio} ha/MWp para ${techLabel}).`
  );

  // 2. Target standalone sentences like "Para una planta de ... MWp se estiman ..."
  text = text.replace(
    /Para\s+una\s+planta\s+de\s+(?:\*\*)?[\d.,]+\s*MWp(?:\*\*)?,?\s*se\s+estiman\s+necesarias?\s+aproximadamente\s+(?:\*\*)?[\d.,]+\s*hect[aá]reas(?:\*\*)?.*?(?=(\n|\.|$))/gi,
    `Para una planta de **${formattedCapacity} MWp**, se estiman necesarias aproximadamente **${hectares} hectáreas** (ratio de diseño: ~${formattedHaRatio} ha/MWp para ${techLabel})`
  );

  // 3. Keep substation capacity aligned: "La planta de ... MWp requerirá"
  text = text.replace(
    /La\s+planta\s+de\s+(?:\*\*)?[\d.,]+\s*MWp(?:\*\*)?\s+requerir[aá]/gi,
    `La planta de **${formattedCapacity} MWp** requerirá`
  );

  // 4. In "líneas de media/alta tensión para ... MWp"
  text = text.replace(
    /l[ií]neas\s+de\s+(?:media|alta)\s+tensi[oó]n\s+para\s+(?:\*\*)?[\d.,]+\s*MWp(?:\*\*)?/gi,
    `líneas de media/alta tensión para **${formattedCapacity} MWp**`
  );

  // 5. In "cálculo de superficie requerida de ... hectáreas para los ... MWp"
  text = text.replace(
    /c[aá]lculo\s+de\s+superficie\s+requerida\s+de\s+(?:\*\*)?[\d.,]+\s*hect[aá]reas(?:\*\*)?\s+para\s+los\s+(?:\*\*)?[\d.,]+\s*MWp/gi,
    `cálculo de superficie requerida de **${hectares} hectáreas** para los **${formattedCapacity} MWp**`
  );

  // Apply strict Argentine number formatting rules to all text
  text = normalizeReportNumbers(text);

  return text;
}

/**
 * Parses bold markdown **text** into strong elements
 */
function renderFormattedBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * High-fidelity line-by-line Markdown renderer with dedicated highlights for dynamic surface calculation
 */
function ReportRenderer({
  content,
  systemCapacityMw,
  requiredHectares,
}: {
  content: string;
  systemCapacityMw: number;
  requiredHectares: string;
}) {
  const lines = content.split('\n');

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 / 2 / 1 (### or ## or #)
        if (trimmed.startsWith('#')) {
          const cleanTitle = trimmed.replace(/^#+\s*/, '');
          return (
            <h3
              key={idx}
              className="text-base sm:text-lg font-bold text-amber-400 mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2 first:mt-0 first:pt-0 first:border-0"
            >
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{renderFormattedBoldText(cleanTitle)}</span>
            </h3>
          );
        }

        // List item (- or * or •)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const itemText = trimmed.replace(/^[-*•]\s*/, '');
          const isSurfaceItem =
            itemText.toLowerCase().includes('superficie requerida') ||
            itemText.toLowerCase().includes('superficie estimada');

          if (isSurfaceItem) {
            return (
              <div
                key={idx}
                className="my-2.5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-500/40 text-slate-200 flex items-start gap-3 shadow-lg shadow-emerald-950/20"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  {renderFormattedBoldText(itemText)}
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm pl-2">
              <span className="text-amber-400 mt-0.5 shrink-0 font-bold">•</span>
              <div className="text-slate-300 leading-relaxed">
                {renderFormattedBoldText(itemText)}
              </div>
            </div>
          );
        }

        // Numbered list item (1. 2. etc)
        if (/^\d+\.\s/.test(trimmed)) {
          const numberMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
          if (numberMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm pl-2">
                <span className="text-amber-400 font-mono font-bold shrink-0">{numberMatch[1]}</span>
                <div className="text-slate-300 leading-relaxed">
                  {renderFormattedBoldText(numberMatch[2])}
                </div>
              </div>
            );
          }
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {renderFormattedBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Official SVG icon for WhatsApp
 */
export function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.488-8.416" />
    </svg>
  );
}

/**
 * Formats the technical report cleanly for direct sharing via WhatsApp (https://wa.me/?text=...)
 * Preserves bold tags (*text*), line breaks, key specifications, and structured bullet points.
 */
export function formatReportForWhatsApp(
  reportText: string,
  location: LocationCoords,
  config: SolarSystemConfig,
  requiredHectares: string,
  isTracker: boolean
): string {
  const haRatio = isTracker ? 1.6 : 1.4;
  const techLabel = isTracker ? 'Seguidores a 1 eje' : 'Estructura fija';
  const cleanCoords = `${location.lat >= 0 ? `${formatCoord(location.lat)}°N` : `${formatCoord(Math.abs(location.lat))}°S`}, ${location.lng >= 0 ? `${formatCoord(location.lng)}°E` : `${formatCoord(Math.abs(location.lng))}°W`}`;
  const formattedCapacity = formatNumber(config.systemCapacityMw, Number.isInteger(config.systemCapacityMw) ? 0 : 1);
  const formattedKwp = formatNumber(Math.round(config.systemCapacityMw * 1000));
  const formattedHaRatio = formatNumber(haRatio, 1);

  // Header with key project specifications formatted for WhatsApp (strict Argentine format)
  const header = [
    `☀️ *HELIOSITE SOLAR - AUDITORÍA TÉCNICA DE EMPLAZAMIENTO*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 *Emplazamiento:* ${location.name}`,
    `🌐 *Coordenadas:* ${cleanCoords}`,
    `⚡ *Tamaño de Planta:* *${formattedCapacity} MWp* (${formattedKwp} kWp)`,
    `📐 *Superficie Estimada:* *${requiredHectares} hectáreas* (~${formattedHaRatio} ha/MWp)`,
    `⚙️ *Tecnología:* ${techLabel}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
  ].join('\n');

  // Convert Markdown body to WhatsApp-friendly text
  let body = reportText;

  // Convert markdown headings ### or ## to WhatsApp bold section titles
  body = body.replace(/^###\s*(.*?)$/gm, '\n📌 *$1*');
  body = body.replace(/^##\s*(.*?)$/gm, '\n📋 *$1*');
  body = body.replace(/^#\s*(.*?)$/gm, '\n☀️ *$1*');

  // Convert markdown bold **text** to WhatsApp native bold *text*
  body = body.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // Standardize bullet points
  body = body.replace(/^[-*•]\s+/gm, '• ');

  // Clean extra consecutive empty lines
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // Normalize numbers in the body
  body = normalizeReportNumbers(body);

  const footer = [
    `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 *Heliosite Solar Studio*`,
    `🔗 https://heliosite-solar.web.app`,
  ].join('\n');

  return `${header}${body}${footer}`;
}

