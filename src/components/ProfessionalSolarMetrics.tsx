import React, { useState } from 'react';
import {
  Activity,
  Award,
  Zap,
  DollarSign,
  TrendingUp,
  BarChart3,
  Sliders,
  Layers,
  ShieldCheck,
  Flame,
  Sun,
  PieChart,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { EnergyProjections, SolarSystemConfig, LocationCoords } from '../types';
import { MetricExplanationModal } from './MetricExplanationModal';
import { MetricHelpTooltip } from './MetricHelpTooltip';

interface ProfessionalSolarMetricsProps {
  projections: EnergyProjections;
  config: SolarSystemConfig;
  onConfigChange: (newConfig: SolarSystemConfig) => void;
  location: LocationCoords;
}

type TabMode = 'kpis' | 'losses' | 'cashflow' | 'sizing' | 'benchmark';

export const ProfessionalSolarMetrics: React.FC<ProfessionalSolarMetricsProps> = ({
  projections,
  config,
  onConfigChange,
  location,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('kpis');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('san_juan');
  const [activeMetricModal, setActiveMetricModal] = useState<{ id: string; value?: string | number } | null>(null);

  // Benchmark sites database across Argentine regions
  const benchmarkSites: Record<string, { name: string; country: string; ghi: number; specificYield: number; pr: number; lcoe: number }> = {
    cauchari: {
      name: 'Cauchari / Susques (Jujuy, 4.020 msnm)',
      country: 'Argentina (NOA)',
      ghi: 2680,
      specificYield: 2450,
      pr: 84.5,
      lcoe: 26.5,
    },
    san_juan: {
      name: 'San Juan (Valle de Ullum / Cuyo)',
      country: 'Argentina (Cuyo)',
      ghi: 2450,
      specificYield: 2150,
      pr: 82.5,
      lcoe: 33.5,
    },
    cordoba: {
      name: 'Córdoba (Parques Industriales Ferreyra)',
      country: 'Argentina (Centro)',
      ghi: 1980,
      specificYield: 1680,
      pr: 81.5,
      lcoe: 43.2,
    },
    rosario: {
      name: 'Gran Rosario (Santa Fe / Cordón PyME)',
      country: 'Argentina (Santa Fe)',
      ghi: 1820,
      specificYield: 1540,
      pr: 81.2,
      lcoe: 46.8,
    },
    amba_pilar: {
      name: 'Parque Industrial Pilar (Buenos Aires)',
      country: 'Argentina (AMBA)',
      ghi: 1720,
      specificYield: 1460,
      pr: 80.8,
      lcoe: 49.5,
    },
    anelo_vaca_muerta: {
      name: 'Añelo / Vaca Muerta (Neuquén)',
      country: 'Argentina (Patagonia Norte)',
      ghi: 1820,
      specificYield: 1560,
      pr: 82.0,
      lcoe: 45.0,
    },
    rio_gallegos: {
      name: 'Río Gallegos (Santa Cruz)',
      country: 'Argentina (Patagonia Austral)',
      ghi: 1380,
      specificYield: 1150,
      pr: 82.8,
      lcoe: 58.0,
    },
  };

  const currentBenchmark = benchmarkSites[selectedBenchmark] || benchmarkSites.san_juan;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header with Professional Tag and Scenario Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Estándar de la Industria Solar (NREL / PVsyst / IEC 61724)
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Métricas utilizadas por Ingenieros, EPCs y Desarrolladores
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Tablero de Indicadores Clave de Desempeño (KPIs)
          </h3>
          <p className="text-xs text-slate-400">
            Proyección del emplazamiento en <strong className="text-slate-200">{location.name}</strong> para una planta de <strong className="text-amber-400">{config.systemCapacityMw} MWp</strong> ({projections.dcCapacityKwp.toLocaleString()} kWp DC).
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'kpis'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>KPIs Principales</span>
          </button>

          <button
            onClick={() => setActiveTab('losses')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'losses'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Cascada de Pérdidas</span>
          </button>

          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cashflow'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Flujo 25 Años</span>
          </button>

          <button
            onClick={() => setActiveTab('sizing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sizing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ratios Técnicos</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'benchmark'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Comparador Multi-Sitio</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Key Solar Industry Performance Indicators (The Big 8) */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Specific Yield */}
            <div className="bg-gradient-to-br from-amber-500/15 via-slate-950/80 to-slate-950 border border-amber-500/30 rounded-2xl p-4 relative overflow-visible group hover:border-amber-500/60 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Specific Yield (Rendimiento)
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
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                    {projections.specificYieldKwhKwp.toLocaleString()}
                  </span>
                  <span className="text-xs text-amber-300/80 font-bold">kWh/kWp</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 leading-tight">
                Indicador rey de productividad del emplazamiento independiente de la potencia.
              </div>
            </div>

            {/* 2. Performance Ratio (PR) */}
            <div className="bg-gradient-to-br from-emerald-500/15 via-slate-950/80 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 relative overflow-visible group hover:border-emerald-500/60 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
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
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                    {projections.performanceRatio}%
                  </span>
                  <span className="text-xs text-emerald-300/80 font-bold">de eficiencia real</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 leading-tight">
                Energía neta inyectada vs. energía teórica en el plano de módulos (POA).
              </div>
            </div>

            {/* 3. Capacity Factor (CF) */}
            <div className="bg-gradient-to-br from-cyan-500/15 via-slate-950/80 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 relative overflow-visible group hover:border-cyan-500/60 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Factor de Capacidad (CF)
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
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                    {projections.capacityFactorPercent}%
                  </span>
                  <span className="text-xs text-cyan-300/80 font-bold">anual</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 leading-tight">
                Horas equivalentes de operación a plena carga nominal (8.760 horas/año).
              </div>
            </div>

            {/* 4. Levelized Cost of Energy (LCOE) */}
            <div className="bg-gradient-to-br from-yellow-500/15 via-slate-950/80 to-slate-950 border border-yellow-500/30 rounded-xl p-4 relative overflow-visible group hover:border-yellow-500/60 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                    Costo Nivelado (LCOE)
                  </span>
                  <MetricHelpTooltip
                    metricId="lcoe"
                    metricTitle="Costo Nivelado de la Energía (LCOE)"
                    currentValue={`$${projections.lcoeUsdMwh} USD/MWh`}
                    onOpenFullModal={() =>
                      setActiveMetricModal({
                        id: 'lcoe',
                        value: `$${projections.lcoeUsdMwh} USD/MWh`,
                      })
                    }
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-tight">
                    ${projections.lcoeUsdMwh}
                  </span>
                  <span className="text-xs text-yellow-400/80 font-bold">USD/MWh</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 leading-tight">
                Costo total por cada megavatio-hora producido a lo largo de 25 años.
              </div>
            </div>
          </div>

          {/* Secondary Industry Metrics Grid (Financial & Radiation) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Plane of Array Irradiance */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1 relative overflow-visible">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Irradiación en Plano (POA)</span>
                <MetricHelpTooltip
                  metricId="ghi"
                  metricTitle="Irradiación en Plano de Módulos (POA)"
                  currentValue={`${projections.annualPoaKwhM2} kWh/m²`}
                  onOpenFullModal={() =>
                    setActiveMetricModal({
                      id: 'ghi',
                      value: `${projections.annualPoaKwhM2} kWh/m²`,
                    })
                  }
                />
              </div>
              <div className="text-lg font-black text-white">
                {projections.annualPoaKwhM2.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh/m²</span>
              </div>
              <div className="text-[10px] text-slate-500">
                GHI: {projections.annualGhiKwhM2.toLocaleString()} | DNI: {projections.annualDniKwhM2.toLocaleString()}
              </div>
            </div>

            {/* DC / AC Ratio (Inverter Loading Ratio) */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1 relative overflow-visible">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                <span>DC / AC Ratio (ILR)</span>
                <MetricHelpTooltip
                  metricId="dc_ac_ratio"
                  metricTitle="Relación DC / AC (Inverter Loading Ratio)"
                  currentValue={`${projections.dcAcRatio}x`}
                  onOpenFullModal={() =>
                    setActiveMetricModal({
                      id: 'dc_ac_ratio',
                      value: `${projections.dcAcRatio}x`,
                    })
                  }
                />
              </div>
              <div className="text-lg font-black text-white">
                {projections.dcAcRatio}x
              </div>
              <div className="text-[10px] text-slate-500">
                DC: {projections.dcCapacityKwp} kWp / AC: {projections.acCapacityKw} kWac
              </div>
            </div>

            {/* IRR / TIR */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1 relative overflow-visible">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                <span>TIR del Proyecto (IRR)</span>
                <MetricHelpTooltip
                  metricId="irr"
                  metricTitle="TIR del Proyecto (Tasa Interna de Retorno)"
                  currentValue={`${projections.irrPercent}%`}
                  onOpenFullModal={() =>
                    setActiveMetricModal({
                      id: 'irr',
                      value: `${projections.irrPercent}%`,
                    })
                  }
                />
              </div>
              <div className="text-lg font-black text-emerald-400">
                {projections.irrPercent}%
              </div>
              <div className="text-[10px] text-slate-500">
                VAN: +${(projections.npvUsd / 1000).toFixed(0)}k USD (WACC {config.discountRatePercent || 7.5}%)
              </div>
            </div>

            {/* Simple & Discounted Payback */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1 relative overflow-visible">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Retorno de Inversión</span>
                <MetricHelpTooltip
                  metricId="payback"
                  metricTitle="Período de Amortización (Payback)"
                  currentValue={`${projections.simplePaybackYears} años`}
                  onOpenFullModal={() =>
                    setActiveMetricModal({
                      id: 'payback',
                      value: `${projections.simplePaybackYears} años`,
                    })
                  }
                />
              </div>
              <div className="text-lg font-black text-white">
                {projections.simplePaybackYears}{' '}
                <span className="text-xs font-normal text-slate-400">años (simple)</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Descontado: {projections.discountedPaybackYears} años
              </div>
            </div>
          </div>

          {/* Executive Solar Summary Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Diagnóstico de Bancabilidad y Viabilidad de Ingeniería</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Con un <strong>Rendimiento Específico de {projections.specificYieldKwhKwp.toLocaleString()} kWh/kWp/año</strong> y un <strong>Performance Ratio del {projections.performanceRatio}%</strong>, el emplazamiento califica como <strong>{projections.viabilityGrade}</strong> para financiamiento estructurado de proyectos (Project Finance). La planta generará en su primer año <strong>{projections.annualGenerationMwh.toLocaleString()} MWh</strong> y un acumulado de <strong>{projections.lifetimeGenerationMwh.toLocaleString()} MWh</strong> a lo largo de 25 años considerando una tasa de degradación de {config.annualDegradationPercent || 0.45}%/año.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Energy Loss Waterfall (Cascada de Pérdidas Estándar PVsyst) */}
      {activeTab === 'losses' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <span>
              Diagrama en Cascada de Pérdidas Fotovoltaicas (De Radiación Incidente a Inyección a Red)
            </span>
            <span className="font-bold text-emerald-400">
              PR Final (IEC 61724): {projections.performanceRatio}%
            </span>
          </div>

          <div className="space-y-2.5">
            {projections.lossWaterfall.map((step, idx) => {
              const isGain = step.lossPercent < 0;
              const isZero = step.lossPercent === 0;

              return (
                <div
                  key={step.id}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
                      className={`font-black text-sm px-2.5 py-0.5 rounded-lg font-mono ${
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

          <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              La principal causa de pérdida en este emplazamiento es la{' '}
              <strong>Pérdida Térmica por Temperatura (-{projections.tempLossPercent}%)</strong>, derivada de una temperatura de celda estimada en operación de {projections.averageCellTempC}°C.
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: 25-Year Cash Flow Projection */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Proyección de Flujo de Caja a 25 Años (Con Degradación y Repowering de Inversores)</span>
            <span className="font-bold text-amber-400">
              Inversión Inicial: ${(projections.capexTotalUsd / 1000).toFixed(0)}k USD
            </span>
          </div>

          {/* Cashflow Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[11px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Año</th>
                  <th className="py-2.5 px-3">Generación (MWh)</th>
                  <th className="py-2.5 px-3">Ingreso Bruto ($)</th>
                  <th className="py-2.5 px-3">OPEX ($)</th>
                  <th className="py-2.5 px-3">Flujo Neto ($)</th>
                  <th className="py-2.5 px-3">Flujo Acumulado ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {projections.twentyFiveYearCashFlow.map((row) => (
                  <tr
                    key={row.year}
                    className={`hover:bg-slate-900/60 transition ${
                      row.year === 13 ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-sans font-bold text-white">
                      Año {row.year} {row.year === 13 && <span className="text-[9px] text-amber-400 font-sans">(Repotenciación Inversores)</span>}
                    </td>
                    <td className="py-2 px-3">{row.generationMwh.toLocaleString()}</td>
                    <td className="py-2 px-3 text-emerald-400">${row.grossRevenueUsd.toLocaleString()}</td>
                    <td className="py-2 px-3 text-rose-300">-${row.opexUsd.toLocaleString()}</td>
                    <td className="py-2 px-3 font-bold text-white">${row.netCashFlowUsd.toLocaleString()}</td>
                    <td
                      className={`py-2 px-3 font-bold ${
                        row.cumulativeCashFlowUsd >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      ${row.cumulativeCashFlowUsd.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Punto de Equilibrio (Payback):</span>
              <div className="font-extrabold text-amber-400 text-sm">
                Año {projections.simplePaybackYears}
              </div>
            </div>
            <div>
              <span className="text-slate-400">TIR del Proyecto (25 Años):</span>
              <div className="font-extrabold text-emerald-400 text-sm">
                {projections.irrPercent}%
              </div>
            </div>
            <div>
              <span className="text-slate-400">Flujo Neto Acumulado Final:</span>
              <div className="font-extrabold text-white text-sm">
                ${(projections.twentyFiveYearCashFlow[24]?.cumulativeCashFlowUsd / 1000).toFixed(0)}k USD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Technical & Sizing Ratios */}
      {activeTab === 'sizing' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 px-1">
            Dimensionamiento de Hardware, Ratios de Inversor y Ocupación del Terreno
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Module count */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">Módulos Fotovoltaicos Tier-1:</span>
              <div className="text-xl font-black text-amber-400">
                {projections.moduleCount.toLocaleString()} paneles
              </div>
              <p className="text-[11px] text-slate-500">
                Basado en paneles bifaciales de {config.moduleWattageWp || 585} Wp (Eficiencia: {config.panelEfficiencyPercent}%).
              </p>
            </div>

            {/* Inverters */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">Potencia y Unidades de Inversor:</span>
              <div className="text-xl font-black text-cyan-400">
                {projections.inverterCount} unidades ({projections.acCapacityKw} kWac)
              </div>
              <p className="text-[11px] text-slate-500">
                Inverter Loading Ratio (ILR): {projections.dcAcRatio}x (Eficiencia de conversión: {config.inverterEfficiencyPercent}%).
              </p>
            </div>

            {/* Ground Cover Ratio */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">Factor de Ocupación (GCR):</span>
              <div className="text-xl font-black text-emerald-400">
                {projections.groundCoverRatioPercent}% GCR
              </div>
              <p className="text-[11px] text-slate-500">
                Espaciamiento (Pitch) calibrado para evitar pérdidas por sombreado mutuo inter-fila en solsticio de invierno.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Multi-Site Benchmark Comparator */}
      {activeTab === 'benchmark' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <span>Comparación de Desempeño vs. Emplazamientos de Referencia</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Comparar contra:</span>
              <select
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
              >
                {Object.entries(benchmarkSites).map(([key, site]) => (
                  <option key={key} value={key}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Indicador de Ingeniería</th>
                  <th className="py-2.5 px-4 text-amber-400">Tu Emplazamiento ({location.name.split(',')[0]})</th>
                  <th className="py-2.5 px-4 text-cyan-400">{currentBenchmark.name}</th>
                  <th className="py-2.5 px-4 text-slate-400">Diferencia Relativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 font-sans text-white font-medium">GHI Anual (Horizontal)</td>
                  <td className="py-2.5 px-4 text-amber-300 font-bold">{projections.annualGhiKwhM2} kWh/m²</td>
                  <td className="py-2.5 px-4 text-cyan-300">{currentBenchmark.ghi} kWh/m²</td>
                  <td className="py-2.5 px-4">
                    {projections.annualGhiKwhM2 >= currentBenchmark.ghi ? (
                      <span className="text-emerald-400">+{((projections.annualGhiKwhM2 / currentBenchmark.ghi - 1) * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-rose-400">-{( (1 - projections.annualGhiKwhM2 / currentBenchmark.ghi) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans text-white font-medium">Specific Yield (Rendimiento)</td>
                  <td className="py-2.5 px-4 text-amber-300 font-bold">{projections.specificYieldKwhKwp} kWh/kWp</td>
                  <td className="py-2.5 px-4 text-cyan-300">{currentBenchmark.specificYield} kWh/kWp</td>
                  <td className="py-2.5 px-4">
                    {projections.specificYieldKwhKwp >= currentBenchmark.specificYield ? (
                      <span className="text-emerald-400">+{((projections.specificYieldKwhKwp / currentBenchmark.specificYield - 1) * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-rose-400">-{( (1 - projections.specificYieldKwhKwp / currentBenchmark.specificYield) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans text-white font-medium">Performance Ratio (PR)</td>
                  <td className="py-2.5 px-4 text-amber-300 font-bold">{projections.performanceRatio}%</td>
                  <td className="py-2.5 px-4 text-cyan-300">{currentBenchmark.pr}%</td>
                  <td className="py-2.5 px-4">
                    {(projections.performanceRatio - currentBenchmark.pr).toFixed(1)} pts
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-sans text-white font-medium">LCOE Estimado</td>
                  <td className="py-2.5 px-4 text-amber-300 font-bold">${projections.lcoeUsdMwh} USD/MWh</td>
                  <td className="py-2.5 px-4 text-cyan-300">${currentBenchmark.lcoe} USD/MWh</td>
                  <td className="py-2.5 px-4">
                    {projections.lcoeUsdMwh <= currentBenchmark.lcoe ? (
                      <span className="text-emerald-400">-{( (1 - projections.lcoeUsdMwh / currentBenchmark.lcoe) * 100).toFixed(1)}% (Más competitivo)</span>
                    ) : (
                      <span className="text-amber-400">+{((projections.lcoeUsdMwh / currentBenchmark.lcoe - 1) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metric Explanation Modal / Dialog */}
      <MetricExplanationModal
        metricId={activeMetricModal?.id || null}
        currentValue={activeMetricModal?.value}
        onClose={() => setActiveMetricModal(null)}
      />
    </div>
  );
};

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
