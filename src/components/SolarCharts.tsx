import React, { useState } from 'react';
import { BarChart3, TrendingUp, Activity, PieChart, DollarSign, Zap, Sun, Flame, Cloud, Thermometer, Wind } from 'lucide-react';
import { EnergyProjections, HourlyForecast } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';

interface SolarChartsProps {
  hourly: HourlyForecast;
  projections: EnergyProjections;
  systemCapacityMw: number;
}

type ChartTab = 'hourly' | 'monthly' | 'losses' | 'financial';

const metricConfig = {
  ghi: { label: 'GHI (Irradiance Global Horizontal)', unit: 'W/m²', color: '#f59e0b', gradientId: 'ghiGrad' },
  dni: { label: 'DNI (Haz Directo Normal)', unit: 'W/m²', color: '#facc15', gradientId: 'dniGrad' },
  dhi: { label: 'DHI (Radiación Difusa)', unit: 'W/m²', color: '#38bdf8', gradientId: 'dhiGrad' },
  temperature: { label: 'Temperatura Ambiente', unit: '°C', color: '#fb7185', gradientId: 'tempGrad' },
  cloudCover: { label: 'Nubosidad del Cielo', unit: '%', color: '#818cf8', gradientId: 'cloudGrad' },
};

export const SolarCharts: React.FC<SolarChartsProps> = ({
  hourly,
  projections,
  systemCapacityMw,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('monthly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeHourlyMetric, setActiveHourlyMetric] = useState<keyof typeof metricConfig>('ghi');

  // Hourly curve data
  const hourlyCount = Math.min(24, hourly.time?.length || 0);
  const currentMetricValues = (hourly[activeHourlyMetric] || []).slice(0, 24);
  const rawMin = currentMetricValues.length > 0 ? Math.min(...currentMetricValues) : 0;
  const rawMax = currentMetricValues.length > 0 ? Math.max(...currentMetricValues) : 100;
  const padding = (rawMax - rawMin) * 0.15 || 5;
  const minVal = activeHourlyMetric === 'temperature' ? Math.floor(rawMin - padding) : Math.max(0, Math.floor(rawMin - padding));
  const maxVal = Math.ceil(rawMax + padding);

  // Monthly data
  const monthlyData = projections.monthlyGenerationMwh || [];
  const maxMonthlyGen = Math.max(1, ...monthlyData.map((m) => m.generationMwh));
  const currentCfg = metricConfig[activeHourlyMetric];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Header and Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Proyecciones de Eficiencia y Modelado Energético
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulación basada en el recurso solar local y las características de la planta ({systemCapacityMw} MWp)
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'monthly'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Generación Anual (12 Meses)
          </button>

          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'hourly'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Curva Solar 24h
          </button>

          <button
            onClick={() => setActiveTab('losses')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'losses'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Pérdidas (PR {projections.performanceRatio}%)
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'financial'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Retorno ROI / CAPEX
          </button>
        </div>
      </div>

      {/* Tab 1: Monthly Generation Bar Chart */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Producción Mensual Estimada en MWh (Inyección Neta a Red)</span>
            <span className="font-semibold text-amber-400">
              Total Anual: {formatNumber(projections.annualGenerationMwh)} MWh/año
            </span>
          </div>

          <div className="h-64 w-full relative flex items-end justify-between gap-1.5 sm:gap-2.5 pt-6 pb-6 px-2 bg-slate-950/50 rounded-xl border border-slate-800/80">
            {monthlyData.map((item, idx) => {
              const heightPercent = Math.max(8, (item.generationMwh / maxMonthlyGen) * 100);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.month}
                  className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-16 bg-slate-900 border border-amber-500/50 text-white text-[11px] p-2 rounded-lg shadow-2xl z-20 whitespace-nowrap pointer-events-none">
                      <div className="font-bold text-amber-400">{item.month}</div>
                      <div>Generación: {formatNumber(item.generationMwh)} MWh</div>
                      <div className="text-slate-400">Radiación: {formatNumber(item.ghiKwhM2)} kWh/m²</div>
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 relative ${
                      isHovered
                        ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 shadow-lg shadow-amber-500/30'
                        : 'bg-gradient-to-t from-amber-600/80 to-amber-400/90 hover:from-amber-500 hover:to-yellow-400'
                    }`}
                  >
                    <div className="text-[10px] text-slate-950 font-bold text-center mt-1 hidden sm:block truncate px-0.5">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Rendimiento Específico:</span>
              <div className="text-white font-bold text-sm">
                {formatNumber(projections.specificYieldKwhKwp)} kWh/kWp
              </div>
            </div>
            <div>
              <span className="text-slate-400">Factor de Capacidad:</span>
              <div className="text-emerald-400 font-bold text-sm">
                {formatPercent(projections.capacityFactorPercent)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Hogares Abastecidos:</span>
              <div className="text-amber-400 font-bold text-sm">
                ~{formatNumber(projections.homesPowered)} hogares
              </div>
            </div>
            <div>
              <span className="text-slate-400">CO₂ Evitado Anual:</span>
              <div className="text-teal-400 font-bold text-sm">
                {formatNumber(projections.avoidedCo2TonsYear)} ton CO₂
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hourly Solar Curve (Individual Metric Charts with Dotted Grid & Auto-Scaling) */}
      {activeTab === 'hourly' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h4 className="font-bold text-white text-sm">Simulación de Curva Horaria 24h (Gráficos Independientes)</h4>
              <p className="text-xs text-slate-400">Seleccioná una métrica para consultar su gráfico individual detallado con escala automática y cuadrícula de puntos</p>
            </div>
          </div>

          {/* Metric Selector Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((key) => {
              const cfg = metricConfig[key];
              const isActive = activeHourlyMetric === key;
              const values = (hourly[key as keyof HourlyForecast] as number[]) || [];
              const peakVal = values.length > 0 ? Math.max(...values) : 0;

              return (
                <button
                  key={key}
                  onClick={() => setActiveHourlyMetric(key)}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide truncate">{cfg.label.split(' ')[0]}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    ></div>
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black" style={{ color: isActive ? cfg.color : '#e2e8f0' }}>
                      {formatNumber(peakVal, peakVal < 10 ? 1 : 0)} <span className="text-[10px] font-normal text-slate-400">{cfg.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Máximo diario</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expanded Individual Chart Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1 font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentCfg.color }}></span>
                {currentCfg.label} ({currentCfg.unit})
              </span>
            </div>

            <div className="h-[380px] sm:h-[450px] w-full bg-slate-950/90 rounded-3xl border border-slate-800/90 p-4 sm:p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between">
              {hourlyCount > 0 ? (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300">
                  <defs>
                    <linearGradient id={currentCfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={currentCfg.color} stopOpacity="0.5" />
                      <stop offset="100%" stopColor={currentCfg.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Dotted Grid Background */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                    const y = 30 + ratio * 220;
                    const valAtRatio = Math.round(maxVal - ratio * (maxVal - minVal));
                    return (
                      <g key={idx}>
                        <line
                          x1="60"
                          y1={y}
                          x2="960"
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                        <text
                          x="50"
                          y={y + 4}
                          fill="#64748b"
                          fontSize="10"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {valAtRatio}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical grid lines */}
                  {Array.from({ length: 9 }).map((_, i) => {
                    const x = 60 + (i / 8) * 900;
                    return (
                      <line
                        key={i}
                        x1={x}
                        y1="30"
                        x2={x}
                        y2="250"
                        stroke="#1e293b"
                        strokeDasharray="2 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Curve Path & Area */}
                  {(() => {
                    const rawValues = (hourly[activeHourlyMetric] as number[]).slice(0, 24);
                    const range = maxVal - minVal || 1;
                    const points = rawValues.map((val, i) => {
                      const x = 60 + (i / 23) * 900;
                      const y = 250 - ((val - minVal) / range) * 220;
                      return { x, y, val };
                    });

                    if (points.length < 2) return null;
                    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L ${points[points.length - 1].x} 250 L ${points[0].x} 250 Z`;

                    return (
                      <>
                        <path d={areaD} fill={`url(#${currentCfg.gradientId})`} />
                        <path d={pathD} fill="none" stroke={currentCfg.color} strokeWidth="3.5" strokeLinecap="round" />
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="4.5"
                              fill="#0f172a"
                              stroke={currentCfg.color}
                              strokeWidth="2.5"
                            />
                          </g>
                        ))}
                      </>
                    );
                  })()}

                  {/* X-Axis Time Labels (00:00 to 23:59) */}
                  {(hourly.time || []).slice(0, 24).map((tStr, i) => {
                    if (i % 3 !== 0 && i !== 23) return null;
                    const x = 60 + (i / 23) * 900;
                    let timeLabel = tStr.split('T')[1]?.slice(0, 5) || `${i < 10 ? '0' + i : i}:00`;
                    if (i === 0) timeLabel = '00:00';
                    if (i === 23) timeLabel = '23:59';
                    return (
                      <text
                        key={i}
                        x={x}
                        y={275}
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {timeLabel}
                      </text>
                    );
                  })}
                </svg>
              ) : (
                <div className="text-slate-400 text-xs text-center py-16">Cargando serie horaria...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Losses Breakdown (Performance Ratio) */}
      {activeTab === 'losses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Desglose de Pérdidas Fotovoltaicas y Rendimiento de Sistema</span>
            <span className="font-bold text-emerald-400 text-sm">
              Performance Ratio (PR): {projections.performanceRatio}%
            </span>
          </div>

          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            {projections.lossBreakdown.map((loss) => (
              <div key={loss.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{loss.name}</span>
                  <span className="font-bold text-amber-400">-{loss.lossPercent}%</span>
                </div>
                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, loss.lossPercent * 5)}%` }}
                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                  ></div>
                </div>
                <div className="text-[11px] text-slate-400">{loss.description}</div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Un <strong>Performance Ratio de {formatPercent(projections.performanceRatio)}</strong> es considerado{' '}
              {projections.performanceRatio >= 81 ? 'óptimo para plantas solares de escala comercial' : 'estándar para este emplazamiento climático'}.
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Financial ROI & CAPEX Crossover */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Inversión Estimada (CAPEX):</span>
              <div className="text-white font-extrabold text-base">
                ${formatNumber(projections.capexTotalUsd / 1_000_000, 2)}M USD
              </div>
            </div>
            <div>
              <span className="text-slate-400">Ingreso Anual Bruto:</span>
              <div className="text-emerald-400 font-extrabold text-base">
                ${formatNumber(Math.round(projections.annualRevenueUsd / 1000))}k USD/año
              </div>
            </div>
            <div>
              <span className="text-slate-400">Período de Retorno (Payback):</span>
              <div className="text-amber-400 font-extrabold text-base">
                {formatNumber(projections.simplePaybackYears, 1)} Años
              </div>
            </div>
            <div>
              <span className="text-slate-400">Costo Nivelado (LCOE):</span>
              <div className="text-teal-400 font-extrabold text-base">
                ${formatNumber(projections.lcoeUsdMwh, 1)} USD/MWh
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Análisis Económico de Rentabilidad a 25 Años
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Con un precio de venta de energía pactado (PPA o mercado mayorista) y costos estándar de operación y mantenimiento (OPEX anual del 1.5%), la planta alcanza el punto de equilibrio en el año <strong>{Math.ceil(projections.simplePaybackYears)}</strong>, generando flujos de caja netos positivos durante más de 18 años de vida útil residual garantizada por los fabricantes de módulos fotovoltaicos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
