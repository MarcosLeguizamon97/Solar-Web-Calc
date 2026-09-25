import React, { useState } from 'react';
import { BarChart3, TrendingUp, Activity, PieChart, DollarSign, Zap } from 'lucide-react';
import { EnergyProjections, HourlyForecast } from '../types';

interface SolarChartsProps {
  hourly: HourlyForecast;
  projections: EnergyProjections;
  systemCapacityMw: number;
}

type ChartTab = 'hourly' | 'monthly' | 'losses' | 'financial';

export const SolarCharts: React.FC<SolarChartsProps> = ({
  hourly,
  projections,
  systemCapacityMw,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('monthly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Hourly curve data
  const hourlyCount = Math.min(24, hourly.time?.length || 0);
  const maxGhi = Math.max(100, ...(hourly.ghi || []).slice(0, 24));
  const maxDni = Math.max(100, ...(hourly.dni || []).slice(0, 24));
  const maxRadiation = Math.max(maxGhi, maxDni, 800);

  // Monthly data
  const monthlyData = projections.monthlyGenerationMwh || [];
  const maxMonthlyGen = Math.max(1, ...monthlyData.map((m) => m.generationMwh));

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
              Total Anual: {projections.annualGenerationMwh.toLocaleString()} MWh/año
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
                      <div>Generación: {item.generationMwh.toLocaleString()} MWh</div>
                      <div className="text-slate-400">Radiación: {item.ghiKwhM2} kWh/m²</div>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Rendimiento Específico:</span>
              <div className="text-white font-bold text-sm">
                {projections.specificYieldKwhKwp.toLocaleString()} kWh/kWp
              </div>
            </div>
            <div>
              <span className="text-slate-400">Factor de Capacidad:</span>
              <div className="text-emerald-400 font-bold text-sm">
                {projections.capacityFactorPercent}%
              </div>
            </div>
            <div>
              <span className="text-slate-400">Hogares Abastecidos:</span>
              <div className="text-amber-400 font-bold text-sm">
                ~{projections.homesPowered.toLocaleString()} hogares
              </div>
            </div>
            <div>
              <span className="text-slate-400">CO₂ Evitado Anual:</span>
              <div className="text-teal-400 font-bold text-sm">
                {projections.avoidedCo2TonsYear.toLocaleString()} ton CO₂
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hourly Solar Curve SVG */}
      {activeTab === 'hourly' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <span>Perfil Horario de Radiación y Temperatura (Próximas 24 Horas)</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                GHI (W/m²)
              </span>
              <span className="flex items-center gap-1.5 text-yellow-300 font-semibold">
                <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"></span>
                DNI Haz Directo (W/m²)
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-3 h-1 bg-cyan-400 inline-block"></span>
                Temp (°C)
              </span>
            </div>
          </div>

          <div className="h-64 w-full bg-slate-950/60 rounded-xl border border-slate-800 p-3 relative overflow-hidden flex items-center justify-center">
            {hourlyCount > 0 ? (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240">
                <defs>
                  <linearGradient id="ghiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="dniGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => (
                  <line
                    key={ratio}
                    x1="40"
                    y1={200 - ratio * 160}
                    x2="980"
                    y2={200 - ratio * 160}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* GHI Area and Path */}
                {(() => {
                  const points = (hourly.ghi || []).slice(0, 24).map((val, i) => {
                    const x = 50 + (i / 23) * 910;
                    const y = 200 - (val / maxRadiation) * 160;
                    return { x, y, val };
                  });

                  if (points.length < 2) return null;
                  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
                  const areaD = `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#ghiGradient)" />
                      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                    </>
                  );
                })()}

                {/* DNI Path */}
                {(() => {
                  const points = (hourly.dni || []).slice(0, 24).map((val, i) => {
                    const x = 50 + (i / 23) * 910;
                    const y = 200 - (val / maxRadiation) * 160;
                    return { x, y, val };
                  });

                  if (points.length < 2) return null;
                  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

                  return (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                    />
                  );
                })()}

                {/* Temperature Line */}
                {(() => {
                  const temps = (hourly.temperature || []).slice(0, 24);
                  const minT = Math.min(...temps, 10);
                  const maxT = Math.max(...temps, 35);
                  const deltaT = Math.max(10, maxT - minT);

                  const points = temps.map((t, i) => {
                    const x = 50 + (i / 23) * 910;
                    const y = 190 - ((t - minT) / deltaT) * 100;
                    return { x, y, t };
                  });

                  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

                  return (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                  );
                })()}

                {/* Hour Labels on X-axis */}
                {(hourly.time || []).slice(0, 24).map((tStr, i) => {
                  if (i % 3 !== 0 && i !== 23) return null;
                  const x = 50 + (i / 23) * 910;
                  const timeLabel = tStr.split('T')[1]?.slice(0, 5) || `${i}:00`;
                  return (
                    <text
                      key={i}
                      x={x}
                      y={225}
                      fill="#94a3b8"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {timeLabel}
                    </text>
                  );
                })}
              </svg>
            ) : (
              <div className="text-slate-400 text-xs">Cargando serie horaria...</div>
            )}
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
              Un <strong>Performance Ratio de {projections.performanceRatio}%</strong> es considerado{' '}
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
                ${(projections.capexTotalUsd / 1_000_000).toFixed(2)}M USD
              </div>
            </div>
            <div>
              <span className="text-slate-400">Ingreso Anual Bruto:</span>
              <div className="text-emerald-400 font-extrabold text-base">
                ${(projections.annualRevenueUsd / 1_000).toFixed(0)}k USD/año
              </div>
            </div>
            <div>
              <span className="text-slate-400">Período de Retorno (Payback):</span>
              <div className="text-amber-400 font-extrabold text-base">
                {projections.simplePaybackYears} Años
              </div>
            </div>
            <div>
              <span className="text-slate-400">Costo Nivelado (LCOE):</span>
              <div className="text-teal-400 font-extrabold text-base">
                ${projections.lcoeUsdMwh} USD/MWh
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
