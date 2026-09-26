import React from 'react';
import { X, HelpCircle, Calculator, Info, ExternalLink, CheckCircle2 } from 'lucide-react';

export interface MetricDetail {
  id: string;
  title: string;
  unit?: string;
  currentValue?: string | number;
  shortDesc: string;
  formula: string;
  interpretation: string;
  argentinaBenchmark: string;
  regulatoryOrStandard: string;
}

export const METRIC_EXPLANATIONS: Record<string, MetricDetail> = {
  specific_yield: {
    id: 'specific_yield',
    title: 'Specific Yield (Rendimiento Específico)',
    unit: 'kWh/kWp/año',
    shortDesc: 'Es el indicador rey de productividad solar independiente del tamaño de la planta.',
    formula: 'Specific Yield = Generación Anual Neta (kWh) / Potencia Instalada DC (kWp)',
    interpretation:
      'Indica cuántos kilovatios-hora de energía genera cada kilovatio-pico de panel fotovoltaico a lo largo de un año calendario completo, considerando todas las pérdidas de orientación, térmicas y de conversión.',
    argentinaBenchmark:
      'En Argentina varía entre 1.400 y 1.600 kWh/kWp en la zona centro/litoral (Rosario, Córdoba, Buenos Aires), 1.900 a 2.200 en Cuyo (San Juan, Mendoza), y hasta 2.500 kWh/kWp en la Puna (Jujuy, Cauchari).',
    regulatoryOrStandard: 'Norma IEC 61724-1 para monitorización de plantas fotovoltaicas.',
  },
  pr: {
    id: 'pr',
    title: 'Performance Ratio (PR)',
    unit: '%',
    shortDesc: 'Porcentaje de la energía solar recibida que se entrega efectivamente en CA a la red o consumo.',
    formula: 'PR = (Generación Real CA / (Irradiación en el Plano del Panel × Potencia Nominal DC)) × 100',
    interpretation:
      'Mide la calidad y eficiencia global del sistema descontando pérdidas por temperatura ambiente, suciedad (soiling), cableado DC/CA, desadaptación (mismatch) y rendimiento del inversor.',
    argentinaBenchmark:
      'Un valor de 80% a 84% se considera óptimo y de estándar industrial Tier-1. Valores por debajo del 75% sugieren altas pérdidas por temperatura, sombreado o inclinación subóptima.',
    regulatoryOrStandard: 'Estándar internacional NREL / IEC 61724 Clase A.',
  },
  lcoe: {
    id: 'lcoe',
    title: 'LCOE (Costo Nivelado de la Energía)',
    unit: 'USD/MWh',
    shortDesc: 'Costo total neto de generar un megavatio-hora durante toda la vida útil de 25-30 años.',
    formula: 'LCOE = (CAPEX Inicial + Σ [OPEX_t / (1+r)^t]) / Σ [Generación_t / (1+r)^t]',
    interpretation:
      'Permite comparar directamente el costo de la energía solar propia contra la tarifa que factura la distribuidora eléctrica (EPE, EPEC, Edenor, etc.).',
    argentinaBenchmark:
      'Para proyectos industriales On-Grid en Argentina, el LCOE ronda los USD 35 a 52 / MWh, muy inferior al costo de la tarifa industrial de red (USD 80 a 110 / MWh), garantizando un ahorro masivo.',
    regulatoryOrStandard: 'Metodología NREL / IRENA Renewable Cost Analysis.',
  },
  capacity_factor: {
    id: 'capacity_factor',
    title: 'Factor de Capacidad (CF)',
    unit: '%',
    shortDesc: 'Porcentaje de tiempo equivalente que la planta opera a su potencia máxima nominal.',
    formula: 'CF = Generación Anual (kWh) / (Potencia Nominal CA (kW) × 8.760 horas/año) × 100',
    interpretation:
      'Representa la utilización efectiva de la capacidad de inyección eléctrica anual considerando la noche y las variaciones climáticas diurnas.',
    argentinaBenchmark:
      'En plantas fijas en la región Pampeana se ubica entre 17% y 20%. En plantas con seguidores solares a un eje en el NOA y Cuyo alcanza entre 26% y 31%.',
    regulatoryOrStandard: 'CAMMESA / Secretaría de Energía de la Nación.',
  },
  payback: {
    id: 'payback',
    title: 'Período de Amortización (Payback)',
    unit: 'Años',
    shortDesc: 'Tiempo requerido para recuperar la inversión total a través de los ahorros en la factura eléctrica.',
    formula: 'Payback Simple = Inversión Inicial Neta (CAPEX en USD) / Ahorro Anual Proyectado (USD/año)',
    interpretation:
      'A partir del año de amortización, toda la energía generada durante los siguientes 20 a 25 años constituye ganancia neta directa para la PyME o propietario.',
    argentinaBenchmark:
      'En Argentina el payback típico para industrias y comercios oscila entre 3,5 y 6,5 años, acelerado por la exención impositiva de Ingresos Brutos (IIBB) y sellos provinciales.',
    regulatoryOrStandard: 'Ley Nacional 27.424 y Leyes Provinciales de Adhesión (ej. Ley Santa Fe 14.259).',
  },
  capex: {
    id: 'capex',
    title: 'Inversión Inicial Estimada (CAPEX)',
    unit: 'USD',
    shortDesc: 'Costo total llave en mano de la instalación solar fotovoltaica.',
    formula: 'CAPEX = Potencia Recomendada (kWp) × Costo Unitario de EPC (USD/kWp)',
    interpretation:
      'Incluye módulos fotovoltaicos Tier-1 bifaciales, inversores on-grid certificados, estructura de montaje en techo o suelo, protecciones eléctricas, ingeniería y trámite de prosumidor.',
    argentinaBenchmark:
      'Para proyectos industriales medianos y grandes (30 a 500 kWp), el costo de mercado en Argentina se sitúa entre USD 650 y USD 950 por kWp instalado. La incorporación de baterías (BESS) incrementa este valor entre un 60% y 100%.',
    regulatoryOrStandard: 'Mercado de proveedores EPC y distribuidores Tier-1 en Argentina.',
  },
  annual_savings: {
    id: 'annual_savings',
    title: 'Ahorro Anual en Factura',
    unit: 'USD/año',
    shortDesc: 'Monto económico anual no abonado a la distribuidora eléctrica.',
    formula: 'Ahorro = Generación Anual Autoconsumida (kWh) × Tarifa Eléctrica Evitada (USD/kWh) + Excedentes Inyectados',
    interpretation:
      'Representa el flujo de caja positivo anual que retiene la empresa en lugar de pagar cargos variables y cargos por potencia a la distribuidora.',
    argentinaBenchmark:
      'Una PyME que instala 50 a 100 kWp ahorra típicamente entre USD 7.000 y USD 18.000 anuales según el cuadro tarifario de su provincia (EPE, EPEC, Edenor, EDEMSA).',
    regulatoryOrStandard: 'Cuadros tarifarios aprobados por ENRE y entes reguladores provinciales.',
  },
  ghi: {
    id: 'ghi',
    title: 'GHI (Irradiancia Global Horizontal)',
    unit: 'kWh/m²/año',
    shortDesc: 'Radiación solar total que incide sobre una superficie horizontal en la ubicación geográfica.',
    formula: 'GHI = DNI × cos(θ_zenit) + DHI',
    interpretation:
      'Suma de la radiación directa del disco solar (DNI) y la radiación difusa dispersada por la atmósfera y nubes (DHI). Es el dato geocientífico primario del recurso solar.',
    argentinaBenchmark:
      'Desde 1.100 kWh/m² en Tierra del Fuego hasta más de 2.650 kWh/m² en la Puna jujeña, otorgando a Argentina uno de los recursos solares más privilegiados del planeta.',
    regulatoryOrStandard: 'Bases de datos satelitales NASA SSE, Open-Meteo Solar y ERA5.',
  },
  dc_ac_ratio: {
    id: 'dc_ac_ratio',
    title: 'Relación DC/AC (Inverter Loading Ratio - ILR)',
    unit: 'Ratio',
    shortDesc: 'Sobredimensionamiento de paneles fotovoltaicos respecto a la potencia nominal de los inversores.',
    formula: 'DC/AC Ratio = Potencia Pico de Paneles (kWp DC) / Potencia Nominal del Inversor (kW CA)',
    interpretation:
      'Permite aprovechar mejor el inversor durante las primeras horas de la mañana, la tarde y días nublados, maximizando el factor de utilización con un recorte mínimo (clipping) en el mediodía de verano.',
    argentinaBenchmark:
      'El ratio óptimo de ingeniería en Argentina se sitúa entre 1.20 y 1.35.',
    regulatoryOrStandard: 'Recomendaciones de diseño de SMA, Huawei, Fronius y Solis.',
  },
};

interface MetricExplanationModalProps {
  metricId: string | null;
  onClose: () => void;
  currentValue?: string | number;
}

export const MetricExplanationModal: React.FC<MetricExplanationModalProps> = ({
  metricId,
  onClose,
  currentValue,
}) => {
  if (!metricId) return null;

  const detail = METRIC_EXPLANATIONS[metricId] || {
    id: metricId,
    title: 'Indicador Fotovoltaico',
    shortDesc: 'Parámetro de dimensionamiento y rendimiento técnico-económico.',
    formula: 'Cálculo algorítmico basado en irradiación solar y potencia instalada.',
    interpretation: 'Métrica utilizada para evaluar la viabilidad de la inversión fotovoltaica.',
    argentinaBenchmark: 'Conforme a los estándares de la Ley 27.424 en la República Argentina.',
    regulatoryOrStandard: 'Estándar Solar Internacional IEC / NREL.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Ficha Técnica de Cálculo
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {detail.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Cerrar modal de información"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Current Value Display if supplied */}
          {(currentValue !== undefined || detail.currentValue !== undefined) && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Valor Calculado Actual:</span>
              <span className="font-extrabold text-amber-400 text-base sm:text-lg">
                {currentValue || detail.currentValue} {detail.unit && <span className="text-xs text-amber-300/80">{detail.unit}</span>}
              </span>
            </div>
          )}

          {/* Short description */}
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            {detail.shortDesc}
          </p>

          {/* Formula */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Fórmula de Cálculo:
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] sm:text-xs text-amber-300 overflow-x-auto">
              {detail.formula}
            </div>
          </div>

          {/* Interpretation */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              ¿Cómo se interpreta para tu proyecto?
            </span>
            <p className="text-slate-300 text-xs sm:text-sm">
              {detail.interpretation}
            </p>
          </div>

          {/* Argentina Benchmark */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              🇦🇷 Referencia en Argentina:
            </span>
            <p className="text-slate-200 text-xs leading-relaxed">
              {detail.argentinaBenchmark}
            </p>
          </div>

          {/* Standard */}
          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Referencia técnica: {detail.regulatoryOrStandard}</span>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
