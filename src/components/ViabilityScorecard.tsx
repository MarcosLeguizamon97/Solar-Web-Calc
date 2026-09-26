import React from 'react';
import { Award, Zap, Sliders, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { EnergyProjections, SolarSystemConfig } from '../types';
import { calculateOptimalTilt } from '../utils/solarCalculations';

interface ViabilityScorecardProps {
  projections: EnergyProjections;
  config: SolarSystemConfig;
  onConfigChange: (newConfig: SolarSystemConfig) => void;
  latitude: number;
  measuredHectares?: number;
}

export const ViabilityScorecard: React.FC<ViabilityScorecardProps> = ({
  projections,
  config,
  onConfigChange,
  latitude,
  measuredHectares,
}) => {
  const [showConfig, setShowConfig] = React.useState(false);

  const optimalTilt = calculateOptimalTilt(latitude);

  // Suggested area for this capacity: ~1.6 ha per MWp
  const suggestedHectares = Math.round(config.systemCapacityMw * 1.6 * 10) / 10;

  // Grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'Excelente':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Muy Favorable':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'Favorable':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Moderado':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Top Banner: Viability Index */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 md:p-5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          {/* Circular Score Badge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="text-slate-800"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className={
                  projections.viabilityScore >= 80
                    ? 'text-emerald-400'
                    : projections.viabilityScore >= 65
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
                strokeWidth="7"
                strokeDasharray={213.6}
                strokeDashoffset={213.6 - (213.6 * projections.viabilityScore) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-extrabold text-white">
                {projections.viabilityScore}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-lg text-white">
                Índice de Viabilidad Fotovoltaica
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getGradeColor(
                  projections.viabilityGrade
                )}`}
              >
                {projections.viabilityGrade}
              </span>
              <span className="text-xs text-slate-400">
                {projections.viabilityScore >= 80
                  ? 'Emplazamiento de categoría mundial para inversión solar'
                  : projections.viabilityScore >= 65
                  ? 'Emplazamiento con alto potencial y rentabilidad sólida'
                  : 'Requiere estudio de compensación técnica o seguimiento'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick parameters summary */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Configurar Parámetros Planta</span>
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Configuration Section */}
      {showConfig && (
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-4 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            Parámetros Técnicos y Económicos del Proyecto
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* System Capacity */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center justify-between">
                <span>Tamaño de la planta:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={config.systemCapacityMw}
                    onChange={(e) => {
                      const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                      onConfigChange({ ...config, systemCapacityMw: val });
                    }}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400">MWp</span>
                </div>
              </label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={config.systemCapacityMw}
                onChange={(e) =>
                  onConfigChange({ ...config, systemCapacityMw: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[11px] text-slate-500">
                Terreno sugerido: ~{suggestedHectares} ha
                {measuredHectares ? ` (Delimitado en mapa: ${measuredHectares} ha)` : ''}
              </div>
            </div>

            {/* Technology */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Tecnología de Montaje:</label>
              <select
                value={config.technology}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    technology: e.target.value as SolarSystemConfig['technology'],
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="monocrystalline_tracking">
                  Bifacial + Seguidor a 1 Eje (Tracker +26%)
                </option>
                <option value="monocrystalline_fixed">
                  Monocristalino Fijo (Inclinación Óptima)
                </option>
                <option value="bifacial_tracking">
                  Bifacial Alta Ganancia Albedo (+32%)
                </option>
                <option value="thin_film">
                  Capa Fina CdTe (Baja Sensibilidad a Calor)
                </option>
              </select>
            </div>

            {/* Tilt Angle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium">Inclinación (Tilt):</label>
                <button
                  type="button"
                  onClick={() => onConfigChange({ ...config, tiltAngleDegrees: optimalTilt })}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Óptima ({optimalTilt}°)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={config.tiltAngleDegrees}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      tiltAngleDegrees: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
                <span className="text-slate-400">grados</span>
                <span className="text-[11px] text-slate-500 ml-auto">
                  {latitude >= 0 ? 'Orientación Sur (180°)' : 'Orientación Norte (0°)'}
                </span>
              </div>
            </div>

            {/* Electricity Price */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">
                Precio de Venta de Energía (USD/MWh):
              </label>
              <input
                type="number"
                min="20"
                max="250"
                value={config.electricityPriceUsdMwh}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    electricityPriceUsdMwh: parseFloat(e.target.value) || 50,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
              <div className="text-[11px] text-slate-500">PPA o mercado eléctrico mayorista</div>
            </div>

            {/* CAPEX per Wp */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Costo de Inversión (USD/Wp):</label>
              <input
                type="number"
                step="0.05"
                min="0.4"
                max="2.0"
                value={config.capexPerWpUsd}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    capexPerWpUsd: parseFloat(e.target.value) || 0.75,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
              <div className="text-[11px] text-slate-500">
                EPC Llave en mano (~$0.70 - $0.85/Wp comercial)
              </div>
            </div>

            {/* Inverter Efficiency */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Eficiencia Inversor Central (%):</label>
              <input
                type="number"
                step="0.1"
                min="95"
                max="99.5"
                value={config.inverterEfficiencyPercent}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    inverterEfficiencyPercent: parseFloat(e.target.value) || 98.2,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
              <div className="text-[11px] text-slate-500">Estándar tier-1: 98.5%</div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Technical Sub-Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Recurso Solar Anual</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {projections.annualGhiKwhM2.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">kWh/m²</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {projections.annualGhiKwhM2 >= 2000
              ? 'Excelente radiación global'
              : 'Nivel de recurso adecuado'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Rendimiento Específico</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {projections.specificYieldKwhKwp.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">kWh/kWp</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Energía producida por cada kWp instalado
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Factor de Capacidad</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {projections.capacityFactorPercent}%
          </div>
          <div className="text-[11px] text-slate-400">
            Horas equivalentes de operación a plena carga
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Tiempo de Retorno (ROI)</span>
            <Award className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {projections.simplePaybackYears} Años
          </div>
          <div className="text-[11px] text-slate-400">
            Recuperación de inversión inicial
          </div>
        </div>
      </div>
    </div>
  );
};
