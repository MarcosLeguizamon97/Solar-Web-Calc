import React, { useState, useEffect } from 'react';
import {
  Zap,
  Building2,
  Factory,
  CheckCircle2,
  DollarSign,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  RotateCcw,
  ExternalLink,
  MapPin,
  Flame,
  AlertTriangle,
  Award,
  ChevronDown,
  Layers,
  Info,
  TrendingUp,
} from 'lucide-react';
import { LocationCoords } from '../types';
import {
  ARGENTINA_PROVINCES,
  ArgentinaProvinceInfo,
  detectArgentinaProvince,
} from '../utils/argentinaSolarFramework';
import { MetricExplanationModal } from './MetricExplanationModal';

interface SolarCalcArgentinaProps {
  currentLocation: LocationCoords;
  onLocationChange: (loc: LocationCoords) => void;
}

export const SolarCalcArgentina: React.FC<SolarCalcArgentinaProps> = ({
  currentLocation,
  onLocationChange,
}) => {
  // Detected or selected province
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('santa_fe');
  const activeProvince: ArgentinaProvinceInfo =
    ARGENTINA_PROVINCES[selectedProvinceId] || ARGENTINA_PROVINCES.santa_fe;

  // Auto-detect province when currentLocation changes
  useEffect(() => {
    const detected = detectArgentinaProvince(
      currentLocation.lat,
      currentLocation.lng,
      currentLocation.name + ' ' + (currentLocation.region || '')
    );
    if (detected && detected.id !== selectedProvinceId) {
      setSelectedProvinceId(detected.id);
    }
  }, [currentLocation.lat, currentLocation.lng, currentLocation.name]);

  // Input parameters
  const [roofAreaM2, setRoofAreaM2] = useState<number>(400);
  const [monthlyConsumptionKwh, setMonthlyConsumptionKwh] = useState<number>(12000);
  const [roofType, setRoofType] = useState<string>('Chapa trapezoidal/zinc');
  const [includeBess, setIncludeBess] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>(
    'Villa Gobernador Gálvez (Gran Rosario)'
  );

  // Sync location name when currentLocation changes
  useEffect(() => {
    if (currentLocation.name) {
      setLocationName(currentLocation.name);
    }
  }, [currentLocation.name]);

  // Custom prompt query
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [studyResult, setStudyResult] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<{ title: string; uri: string }[]>([]);
  const [lastCalculatedData, setLastCalculatedData] = useState<any>(null);
  const [activeMetricModal, setActiveMetricModal] = useState<{ id: string; value?: string | number } | null>(null);

  // Quick preset test cases in Argentina
  const testCases = [
    {
      label: 'Galpón 400 m² VGG (Santa Fe - EPE)',
      badge: 'Caso de Prueba Oficial',
      provinceId: 'santa_fe',
      location: {
        name: 'Villa Gobernador Gálvez (Gran Rosario)',
        country: 'Argentina',
        region: 'Santa Fe • Cordón Industrial Sur (EPE)',
        lat: -33.0298,
        lng: -60.6385,
      },
      roofArea: 400,
      monthlyKwh: 12000,
      roofType: 'Chapa trapezoidal/zinc',
      prompt:
        'Tengo un galpón en Villa Gobernador Gálvez con 400 m2 de techo de chapa libre. Consumo unos 12.000 kWh mensuales con la EPE. ¿Qué me conviene hacer y cuánto me cuesta?',
    },
    {
      label: 'Nave Industrial 1.200 m² (Córdoba - EPEC)',
      badge: 'Polo Metalmecánico',
      provinceId: 'cordoba',
      location: {
        name: 'Córdoba Capital (Parque Ind. Ferreyra)',
        country: 'Argentina',
        region: 'Córdoba • Ley 10.604 (EPEC)',
        lat: -31.4201,
        lng: -64.1888,
      },
      roofArea: 1200,
      monthlyKwh: 35000,
      roofType: 'Chapa de zinc con estructura reticulada',
      prompt:
        'Tengo una nave industrial en Córdoba de 1.200 m2 con consumo de 35.000 kWh/mes con EPEC. ¿Cómo aplica la Ley 10.604 y cuál es la amortización?',
    },
    {
      label: 'Centro Logístico 2.500 m² (Pilar - Edenor/EDEN)',
      badge: 'AMBA / Buenos Aires',
      provinceId: 'buenos_aires',
      location: {
        name: 'Parque Industrial Pilar',
        country: 'Argentina',
        region: 'Buenos Aires • Corredor Norte',
        lat: -34.4589,
        lng: -58.9142,
      },
      roofArea: 2500,
      monthlyKwh: 65000,
      roofType: 'Chapa engrafada autoportante',
      prompt:
        'Opero un centro logístico en el Parque Industrial Pilar con 2.500 m2 de techo y 65.000 kWh mensuales. ¿Cuál es el dimensionamiento óptimo?',
    },
    {
      label: 'Bodega 800 m² (Luján de Cuyo - EDEMSA)',
      badge: 'Cuyo Vitivinícola',
      provinceId: 'mendoza',
      location: {
        name: 'Luján de Cuyo / Anchoris',
        country: 'Argentina',
        region: 'Mendoza • EDEMSA / EPRE',
        lat: -33.3275,
        lng: -68.9142,
      },
      roofArea: 800,
      monthlyKwh: 22000,
      roofType: 'Chapa aislada con poliuretano',
      prompt:
        'Tengo una bodega en Luján de Cuyo con 800 m2 y 22.000 kWh/mes en vendimia. ¿Qué ahorro puedo obtener con la radiación de Mendoza?',
    },
  ];

  // Quick Test Case handler
  const loadTestCase = (testCase: (typeof testCases)[0]) => {
    setSelectedProvinceId(testCase.provinceId);
    setRoofAreaM2(testCase.roofArea);
    setMonthlyConsumptionKwh(testCase.monthlyKwh);
    setRoofType(testCase.roofType);
    setLocationName(testCase.location.name);
    setIncludeBess(false);
    setCustomMessage(testCase.prompt);
    onLocationChange(testCase.location);
  };

  // Run calculation against /api/gemini/solar-calc-argentina
  const executeStudy = async (overridePrompt?: string) => {
    setIsLoading(true);
    try {
      const payload = {
        message: overridePrompt || customMessage || undefined,
        roofAreaM2,
        monthlyConsumptionKwh,
        locationName,
        provinceName: activeProvince.name,
        utilityName: activeProvince.utility,
        roofType,
        includeBess,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      };

      const res = await fetch('/api/gemini/solar-calc-argentina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setStudyResult(data.report);

      const links: { title: string; uri: string }[] = [];
      (data.groundingChunks || []).forEach((c: any) => {
        if (c.maps?.uri) {
          links.push({ title: c.maps.title || 'Ubicación en Google Maps', uri: c.maps.uri });
        }
      });
      setGroundingLinks(links);

      // Pre-calculated stats for visual badges
      const annualKwh = monthlyConsumptionKwh * 12;
      const genKwhKwp = activeProvince.avgSpecificYieldKwhKwp || 1540;
      const recKwp = Math.min(
        Math.floor(roofAreaM2 / 6),
        Math.round((annualKwh * 0.55) / genKwhKwp)
      );
      const annualGen = recKwp * genKwhKwp;
      const capexRate = recKwp >= 50 ? 800 : 900;
      const totalCapex = Math.round(recKwp * capexRate * (includeBess ? 1.75 : 1));
      const savingsUsd = Math.round(annualGen * activeProvince.industrialTariffUsdKwh);
      const payback = (totalCapex / savingsUsd).toFixed(1);

      setLastCalculatedData({
        recKwp,
        areaOccupied: recKwp * 6,
        areaPercent: Math.round(((recKwp * 6) / roofAreaM2) * 100),
        annualGen,
        coverage: Math.min(85, Math.round((annualGen / annualKwh) * 100)),
        capex: totalCapex,
        savings: savingsUsd,
        payback,
        panelsCount: Math.round(recKwp * 1.7),
      });
    } catch (err: any) {
      console.error('Error generating pre-feasibility study:', err);
      setStudyResult(`Error al procesar el pre-estudio: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial calculation when mounted
  useEffect(() => {
    executeStudy();
  }, []);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl backdrop-blur-md space-y-6">
      {/* Top Header Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Consultor On-Grid Industrial Argentina
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Ley Nacional 27.424 & Marcos Provinciales (23 Provincias + CABA)
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Pre-Estudio de Viabilidad Técnico-Económica</span>
            <span className="text-amber-400 font-mono text-base md:text-lg">
              [{activeProvince.shortName}]
            </span>
          </h2>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Diagnóstico instantáneo para dueños de PyMEs, industrias y establecimientos en cualquier
            punto de Argentina. Calcula potencia óptima en kWp, m² necesarios de cubierta, CAPEX en USD,
            ahorro proyectado y trámite de prosumidor con medidor bidireccional.
          </p>
        </div>

        {/* Province Selector Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={selectedProvinceId}
              onChange={(e) => {
                const provId = e.target.value;
                setSelectedProvinceId(provId);
                const prov = ARGENTINA_PROVINCES[provId];
                if (prov) {
                  onLocationChange({
                    name: `${prov.capital} (${prov.shortName})`,
                    country: 'Argentina',
                    region: `${prov.region} • ${prov.utility}`,
                    lat: (prov.bounds.minLat + prov.bounds.maxLat) / 2,
                    lng: (prov.bounds.minLng + prov.bounds.maxLng) / 2,
                  });
                }
              }}
              aria-label="Seleccionar Provincia de Argentina"
              className="w-full bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none transition shadow-sm"
            >
              {Object.values(ARGENTINA_PROVINCES).map((prov) => (
                <option key={prov.id} value={prov.id} className="bg-slate-900 text-slate-200">
                  {prov.name} ({prov.region}) — {prov.utility}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Provincial Context Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Distribuidora Eléctrica
          </span>
          <span className="font-extrabold text-amber-400">{activeProvince.utility}</span>
          <span className="text-[10px] text-slate-400 block truncate" title={activeProvince.utilityFullName}>
            {activeProvince.utilityFullName}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Marco Legal Provincial
          </span>
          <span className="font-bold text-slate-200 truncate block" title={activeProvince.regulatoryLaw}>
            {activeProvince.regulatoryLaw}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">Medidor Bidireccional</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Generación de Referencia
          </span>
          <span className="font-extrabold text-cyan-400">
            {activeProvince.avgSpecificYieldKwhKwp} kWh/kWp
          </span>
          <span className="text-[10px] text-slate-400 block">
            GHI: {activeProvince.avgAnnualGhiKwhM2} kWh/m²
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Beneficio Impositivo
          </span>
          <span className="font-bold text-emerald-300 truncate block" title={activeProvince.taxExemptions}>
            Exención Ingresos Brutos (IIBB)
          </span>
          <span className="text-[10px] text-slate-400 block">Inyección de excedentes</span>
        </div>
      </div>

      {/* Primary Key Metric Cards (Top Section with Info Tooltip Triggers) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span className="flex items-center gap-1.5 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Métricas Principales de Dimensionamiento y Retorno
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Tocá el icono ⓘ para ver la fórmula y normativa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Potencia Sugerida */}
          <div className="p-4 bg-gradient-to-br from-amber-500/15 via-slate-950/80 to-slate-950 border border-amber-500/30 rounded-2xl flex flex-col justify-between group hover:border-amber-500/60 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Potencia Sugerida
              </span>
              <button
                onClick={() =>
                  setActiveMetricModal({
                    id: 'specific_yield',
                    value: `${lastCalculatedData?.recKwp || 50} kWp`,
                  })
                }
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition flex items-center justify-center cursor-pointer"
                title="Ver fórmula de dimensionamiento"
                aria-label="Ver fórmula de dimensionamiento"
              >
                <Info className="w-4 h-4 text-amber-400" />
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {lastCalculatedData?.recKwp || 50}
              </span>
              <span className="text-xs text-amber-300/80 font-bold">kWp DC</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Ocupa {lastCalculatedData?.areaOccupied || 300} m² ({lastCalculatedData?.areaPercent || 75}% del techo)
            </div>
          </div>

          {/* Card 2: CAPEX Estimado */}
          <div className="p-4 bg-gradient-to-br from-yellow-500/15 via-slate-950/80 to-slate-950 border border-yellow-500/30 rounded-2xl flex flex-col justify-between group hover:border-yellow-500/60 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                Inversión Llave en Mano
              </span>
              <button
                onClick={() =>
                  setActiveMetricModal({
                    id: 'capex',
                    value: `USD ${(lastCalculatedData?.capex || 42000).toLocaleString()}`,
                  })
                }
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 p-2 rounded-xl text-slate-400 hover:text-yellow-400 hover:bg-slate-800/80 transition flex items-center justify-center cursor-pointer"
                title="Ver desglose de CAPEX"
                aria-label="Ver desglose de CAPEX"
              >
                <Info className="w-4 h-4 text-yellow-400" />
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-yellow-300">
                ${(lastCalculatedData?.capex || 42000).toLocaleString()}
              </span>
              <span className="text-xs text-yellow-400/80 font-bold">USD</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {includeBess ? 'Incluye baterías de respaldo BESS' : 'Sistema On-Grid puro sin baterías'}
            </div>
          </div>

          {/* Card 3: Ahorro Anual */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/15 via-slate-950/80 to-slate-950 border border-emerald-500/30 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/60 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Ahorro Anual Estimado
              </span>
              <button
                onClick={() =>
                  setActiveMetricModal({
                    id: 'annual_savings',
                    value: `USD ${(lastCalculatedData?.savings || 7200).toLocaleString()} / año`,
                  })
                }
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition flex items-center justify-center cursor-pointer"
                title="Ver cálculo de ahorro en factura"
                aria-label="Ver cálculo de ahorro en factura"
              >
                <Info className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                ${(lastCalculatedData?.savings || 7200).toLocaleString()}
              </span>
              <span className="text-xs text-emerald-300/80 font-bold">USD/año</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Cubre aprox. {lastCalculatedData?.coverage || 65}% de tu factura de {activeProvince.utility}
            </div>
          </div>

          {/* Card 4: Payback */}
          <div className="p-4 bg-gradient-to-br from-cyan-500/15 via-slate-950/80 to-slate-950 border border-cyan-500/30 rounded-2xl flex flex-col justify-between group hover:border-cyan-500/60 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Amortización (Payback)
              </span>
              <button
                onClick={() =>
                  setActiveMetricModal({
                    id: 'payback',
                    value: `${lastCalculatedData?.payback || 4.5} años`,
                  })
                }
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition flex items-center justify-center cursor-pointer"
                title="Ver fórmula de amortización"
                aria-label="Ver fórmula de amortización"
              >
                <Info className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                {lastCalculatedData?.payback || 4.5}
              </span>
              <span className="text-xs text-cyan-300/80 font-bold">años</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Vida útil garantizada: 25 a 30 años (Tier-1)
            </div>
          </div>
        </div>
      </div>

      {/* Test Case Fast Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cargar Casos de Prueba Típicos en Argentina (1 Clic):
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {testCases.map((tc, idx) => (
            <button
              key={idx}
              onClick={() => loadTestCase(tc)}
              className="p-2.5 text-left rounded-xl bg-slate-950/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tight">
                  {tc.badge}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 line-clamp-1 group-hover:text-white">
                {tc.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {tc.roofArea} m² cubierta • {tc.monthlyKwh.toLocaleString()} kWh/mes
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
        {/* Left: Input sliders & Fields */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Roof Area Slider & Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Superficie de Cubierta Libre (m²)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={50}
                    max={20000}
                    step={10}
                    value={roofAreaM2}
                    onChange={(e) => setRoofAreaM2(Math.max(10, Number(e.target.value)))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-right font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-bold">m²</span>
                </div>
              </div>
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={roofAreaM2}
                onChange={(e) => setRoofAreaM2(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>50 m² (Taller)</span>
                <span>1.000 m² (Galpón medio)</span>
                <span>5.000+ m² (Logístico)</span>
              </div>
            </div>

            {/* Monthly Consumption Slider & Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Consumo Mensual Eléctrico (kWh)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={500}
                    max={200000}
                    step={500}
                    value={monthlyConsumptionKwh}
                    onChange={(e) => setMonthlyConsumptionKwh(Math.max(100, Number(e.target.value)))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-right font-mono font-bold text-yellow-300 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-bold">kWh</span>
                </div>
              </div>
              <input
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={monthlyConsumptionKwh}
                onChange={(e) => setMonthlyConsumptionKwh(Number(e.target.value))}
                className="w-full accent-yellow-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1.000 kWh/mes</span>
                <span>15.000 kWh/mes</span>
                <span>50.000+ kWh/mes</span>
              </div>
            </div>
          </div>

          {/* Roof Type and Battery Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Tipo de Cubierta del Techo
              </label>
              <select
                value={roofType}
                onChange={(e) => setRoofType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Chapa trapezoidal/zinc">Chapa trapezoidal/zinc (Óptima para fijación rápida)</option>
                <option value="Chapa sinusoidal (acanalada)">Chapa sinusoidal acanalada</option>
                <option value="Losa plana de hormigón">Losa plana de hormigón (Con estructuras con lastre)</option>
                <option value="Cubierta con panel sándwich">Cubierta con panel sándwich térmico</option>
                <option value="Estructura sobre suelo en predio fabril">Estructura sobre suelo en predio fabril</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-200 block">¿Evaluar Baterías BESS?</span>
                <span className="text-[10px] text-slate-400 block">
                  Respaldo ante cortes de red (+60-100% CAPEX)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeBess(!includeBess)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeBess ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeBess ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Action & Live KPIs summary */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Sintetizador de Viabilidad
            </span>
            <div className="text-xs text-slate-300">
              Ubicación activa: <strong className="text-white">{locationName}</strong>
            </div>
            <div className="text-xs text-slate-400">
              Distribuidora: <strong className="text-amber-300">{activeProvince.utility}</strong> •{' '}
              {activeProvince.name}
            </div>
          </div>

          {lastCalculatedData && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Potencia Sugerida</span>
                <span className="text-base font-black text-amber-400">
                  {lastCalculatedData.recKwp} kWp
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Amortización (Payback)</span>
                <span className="text-base font-black text-emerald-400">
                  {lastCalculatedData.payback} años
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Ahorro Anual</span>
                <span className="text-sm font-black text-slate-200">
                  USD {lastCalculatedData.savings.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cobertura Demanda</span>
                <span className="text-sm font-black text-cyan-400">
                  {lastCalculatedData.coverage}%
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => executeStudy()}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Calculando Estudio Técnico...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recalcular Pre-Estudio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Section: Structured Study Output */}
      {studyResult && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Informe de Ingeniería Fotovoltaica Generado</span>
            </div>
            <div className="text-xs text-slate-400">
              Marco: <strong className="text-amber-400">{activeProvince.shortName}</strong> ({activeProvince.utility})
            </div>
          </div>

          {/* Formatted Markdown Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-4">
            {studyResult.split('### ').map((section, idx) => {
              if (!section.trim()) return null;
              const lines = section.split('\n');
              const title = lines[0].trim();
              const content = lines.slice(1).join('\n');

              // Color accents based on section
              let badgeColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
              let Icon = CheckCircle2;
              if (title.toLowerCase().includes('diagnóstico') || title.toLowerCase().includes('diagnostico')) {
                badgeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                Icon = ShieldCheck;
              } else if (title.toLowerCase().includes('dimensionamiento')) {
                badgeColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
                Icon = Factory;
              } else if (title.toLowerCase().includes('financiero')) {
                badgeColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
                Icon = DollarSign;
              } else if (title.toLowerCase().includes('pasos') || title.toLowerCase().includes('trámite')) {
                badgeColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
                Icon = Clock;
              }

              return (
                <div key={idx} className="border-b border-slate-800/80 pb-4 last:border-none last:pb-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md border ${badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                      {title}
                    </h3>
                  </div>

                  <div className="text-slate-300 text-xs sm:text-sm whitespace-pre-line pl-7 space-y-1">
                    {content.split('\n').map((line, lIdx) => {
                      if (line.startsWith('- **') || line.startsWith('1. **') || line.startsWith('2. **') || line.startsWith('3. **')) {
                        return (
                          <div key={lIdx} className="py-0.5">
                            <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                          </div>
                        );
                      }
                      if (line.trim().startsWith('*(') && line.trim().endsWith(')*')) {
                        return (
                          <div key={lIdx} className="text-xs text-amber-300/80 italic py-1">
                            {line.replace(/\*/g, '')}
                          </div>
                        );
                      }
                      return (
                        <p key={lIdx} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grounding & Verified Links */}
          {groundingLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Fuentes Geográficas y Normativas Verificadas:
              </span>
              {groundingLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[11px] font-medium transition"
                >
                  <span>{link.title}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}

          {/* Qualified Regional EPCs & Green Credits in Argentina */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                EPCs Instaladores & Suministro Tier-1 Homologados
              </span>
              <p className="text-[11px] text-slate-400">
                Empresas con experiencia en interconexión ante {activeProvince.utility}:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeProvince.keyLocalEpcs.map((epc, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-medium"
                  >
                    {epc}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Líneas de Financiamiento Verde Activas en {activeProvince.shortName}
              </span>
              <p className="text-[11px] text-slate-400">
                Créditos con tasa bonificada para transición energética industrial:
              </p>
              <ul className="text-[10px] text-slate-300 list-disc list-inside space-y-0.5 pt-1">
                {activeProvince.greenCreditLines.map((credit, i) => (
                  <li key={i}>{credit}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Chat / Follow-up Query for the Consultant */}
          <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-amber-400" />
              ¿Tenés dudas específicas sobre tu instalación en {activeProvince.shortName}? Consultá al motor inteligente:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Ej: ¿Qué potencia de inversor necesito para ${activeProvince.utility}? ¿Cuánto demora la instalación?`}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customMessage.trim()) {
                    executeStudy(customMessage);
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => {
                  if (customMessage.trim()) {
                    executeStudy(customMessage);
                  }
                }}
                disabled={isLoading || !customMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Consultar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Explanation Modal */}
      <MetricExplanationModal
        metricId={activeMetricModal?.id || null}
        currentValue={activeMetricModal?.value}
        onClose={() => setActiveMetricModal(null)}
      />
    </div>
  );
};
