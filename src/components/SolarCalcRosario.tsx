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
} from 'lucide-react';
import { LocationCoords } from '../types';

interface SolarCalcRosarioProps {
  currentLocation: LocationCoords;
  onLocationChange: (loc: LocationCoords) => void;
}

export const SolarCalcRosario: React.FC<SolarCalcRosarioProps> = ({
  currentLocation,
  onLocationChange,
}) => {
  // Input parameters
  const [roofAreaM2, setRoofAreaM2] = useState<number>(400);
  const [monthlyConsumptionKwh, setMonthlyConsumptionKwh] = useState<number>(12000);
  const [roofType, setRoofType] = useState<string>('Chapa trapezoidal/zinc');
  const [includeBess, setIncludeBess] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>(
    'Villa Gobernador Gálvez (Gran Rosario)'
  );

  // Custom prompt query
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [studyResult, setStudyResult] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<{ title: string; uri: string }[]>([]);
  const [lastCalculatedData, setLastCalculatedData] = useState<any>(null);

  // Quick preset locations in Gran Rosario
  const rosarioLocations = [
    {
      name: 'Villa Gobernador Gálvez',
      label: 'V. G. Gálvez (Sur)',
      lat: -33.0298,
      lng: -60.6385,
    },
    {
      name: 'Parque Industrial Alvear',
      label: 'P. Ind. Alvear',
      lat: -33.0784,
      lng: -60.6212,
    },
    {
      name: 'Rosario (Parque Ind. Ovidio Lagos)',
      label: 'Rosario (O. Lagos)',
      lat: -32.9964,
      lng: -60.6974,
    },
    {
      name: 'Pérez (Polo Metalmecánico)',
      label: 'Pérez',
      lat: -32.9972,
      lng: -60.7712,
    },
    {
      name: 'San Lorenzo / Pto. San Martín',
      label: 'San Lorenzo (Norte)',
      lat: -32.7485,
      lng: -60.7329,
    },
  ];

  // Quick Test Case handler
  const loadTestCase = () => {
    setRoofAreaM2(400);
    setMonthlyConsumptionKwh(12000);
    setRoofType('Chapa trapezoidal/zinc');
    setLocationName('Villa Gobernador Gálvez');
    setIncludeBess(false);
    setCustomMessage(
      'Tengo un galpón en Villa Gobernador Gálvez con 400 m2 de techo de chapa libre. Consumo unos 12.000 kWh mensuales con la EPE. ¿Qué me conviene hacer y cuánto me cuesta?'
    );
    onLocationChange({
      name: 'Villa Gobernador Gálvez (Gran Rosario)',
      country: 'Argentina (Santa Fe)',
      region: 'Cordón Industrial Sur - Prosumidores EPE',
      lat: -33.0298,
      lng: -60.6385,
    });
  };

  // Run calculation against /api/gemini/solar-calc-rosario
  const executeStudy = async (overridePrompt?: string) => {
    setIsLoading(true);
    try {
      const payload = {
        message: overridePrompt || customMessage || undefined,
        roofAreaM2,
        monthlyConsumptionKwh,
        locationName,
        roofType,
        includeBess,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      };

      const res = await fetch('/api/gemini/solar-calc-rosario', {
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
      const recKwp = Math.min(Math.floor(roofAreaM2 / 6), Math.round((annualKwh * 0.55) / 1500));
      const requiredM2 = recKwp * 6;
      const annualGen = recKwp * 1500;
      const baseCapex = recKwp * (recKwp >= 50 ? 800 : 900);
      const finalCapex = includeBess ? Math.round(baseCapex * 1.75) : baseCapex;
      const annualSavingsUsd = Math.round(annualGen * 0.095);
      const payback = (finalCapex / annualSavingsUsd).toFixed(1);

      setLastCalculatedData({
        recKwp,
        requiredM2,
        annualGen,
        finalCapex,
        annualSavingsUsd,
        payback,
        coverage: Math.round((annualGen / annualKwh) * 100),
      });
    } catch (err: any) {
      console.error('Error running SolarCalc Rosario study:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount with initial test case
  useEffect(() => {
    executeStudy(
      'Tengo un galpón en Villa Gobernador Gálvez con 400 m2 de techo de chapa libre. Consumo unos 12.000 kWh mensuales con la EPE. ¿Qué me conviene hacer y cuánto me cuesta?'
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Banner for SolarCalc Rosario */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Motor de Asesoría Energética PyME
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Ley Provincial 14.259 • Prosumidores EPE
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              SolarCalc <span className="text-amber-400">Rosario</span>: Viabilidad Fotovoltaica Industrial On-Grid
            </h2>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consultor técnico-económico especializado para dueños de PyMEs y gerentes de planta del <strong>Gran Rosario y sur de Santa Fe</strong>. Dimensionamiento, ahorro en la factura de la EPE, retorno de inversión (ROI) y pasos normativos llave en mano.
            </p>
          </div>

          {/* Quick Action Button for Testing */}
          <button
            onClick={loadTestCase}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition shrink-0 group"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-current group-hover:scale-110 transition" />
            <span>Cargar Caso de Prueba (Galpón 400 m² VGG)</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Grid: Form + Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Factory className="w-4 h-4 text-amber-400" />
              Parámetros de tu Planta Industrial
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Santa Fe On-Grid</span>
          </div>

          {/* Location Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Zona en Gran Rosario:</span>
              <span className="text-amber-400 font-bold text-[11px]">{locationName}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {rosarioLocations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    setLocationName(loc.name);
                    onLocationChange({
                      name: `${loc.name} (Gran Rosario)`,
                      country: 'Argentina (Santa Fe)',
                      region: 'Polo Industrial On-Grid',
                      lat: loc.lat,
                      lng: loc.lng,
                    });
                  }}
                  className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-medium transition border ${
                    locationName.includes(loc.name)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roof Area m² */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                Superficie de cubierta libre (Techo):
              </label>
              <span className="font-extrabold text-amber-400">{roofAreaM2} m²</span>
            </div>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={roofAreaM2}
              onChange={(e) => setRoofAreaM2(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>100 m² (Taller)</span>
              <span>400 m² (Galpón Pyme)</span>
              <span>3.000 m² (Nave Logística)</span>
            </div>
          </div>

          {/* Monthly Consumption kWh */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                Consumo eléctrico mensual EPE:
              </label>
              <span className="font-extrabold text-emerald-400">
                {monthlyConsumptionKwh.toLocaleString()} kWh/mes
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="50000"
              step="1000"
              value={monthlyConsumptionKwh}
              onChange={(e) => setMonthlyConsumptionKwh(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>2.000 kWh/mes</span>
              <span>12.000 kWh/mes (Caso típico)</span>
              <span>50.000 kWh/mes</span>
            </div>
          </div>

          {/* Roof Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tipo de Cubierta:</label>
            <select
              value={roofType}
              onChange={(e) => setRoofType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="Chapa trapezoidal/zinc">Chapa de zinc / trapezoidal (Óptima para fijación rápida)</option>
              <option value="Chapa sinusoidal">Chapa sinusoidal acanalada</option>
              <option value="Losa de hormigón">Losa plana de hormigón (Estructura con lastre y ángulo)</option>
              <option value="Terreno / Suelo periférico">Suelo libre en predio fabril</option>
            </select>
          </div>

          {/* BESS Battery Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">¿Incluir baterías de respaldo (BESS)?</div>
              <div className="text-[11px] text-slate-400">
                Sube el CAPEX un 60% - 100% pero brinda autonomía ante cortes de la EPE
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeBess}
              onChange={(e) => setIncludeBess(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Custom prompt text area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Consulta personalizada o datos adicionales:</span>
              <span className="text-[10px] text-slate-500">Opcional</span>
            </label>
            <textarea
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ej: Tengo un galpón en Villa Gobernador Gálvez con 400 m2 de techo de chapa libre. Consumo unos 12.000 kWh mensuales con la EPE. ¿Qué me conviene hacer y cuánto me cuesta?"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={() => executeStudy()}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Calculando Pre-Estudio Técnico-Económico...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Generar Pre-Estudio para Santa Fe</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Pre-Estudio Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Metrics Bar if calculated */}
          {lastCalculatedData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Potencia Sugerida</div>
                <div className="text-xl font-extrabold text-amber-400 mt-0.5">
                  {lastCalculatedData.recKwp} kWp
                </div>
                <div className="text-[10px] text-slate-400">{lastCalculatedData.requiredM2} m² de techo</div>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/30 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Inversión (CAPEX)</div>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  USD {(lastCalculatedData.finalCapex / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] text-emerald-400">On-Grid Llave en Mano</div>
              </div>

              <div className="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Ahorro Anual EPE</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  USD {lastCalculatedData.annualSavingsUsd.toLocaleString()}
                </div>
                <div className="text-[10px] text-cyan-400">Cobertura: {lastCalculatedData.coverage}% consumo</div>
              </div>

              <div className="bg-slate-900/90 border border-yellow-500/30 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Amortización (Payback)</div>
                <div className="text-xl font-extrabold text-yellow-400 mt-0.5">
                  {lastCalculatedData.payback} Años
                </div>
                <div className="text-[10px] text-slate-400">Vida útil: 25 a 30 años</div>
              </div>
            </div>
          )}

          {/* Full Structured Study Document */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Pre-Estudio de Viabilidad Técnico-Económica (Gran Rosario)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dictamen emitido bajo la Ley Provincial 14.259 de Santa Fe y normas técnicas EPE
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                ✓ Prosumidor Factible
              </span>
            </div>

            {/* Study Body Content */}
            {isLoading ? (
              <div className="py-12 text-center space-y-3 animate-pulse">
                <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-300 font-semibold">
                  Analizando curvas de carga, radiación del Gran Rosario y tarifas EPE...
                </p>
              </div>
            ) : studyResult ? (
              <div className="prose prose-invert max-w-none text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 bg-slate-950/50 p-4 md:p-5 rounded-xl border border-slate-800">
                <StructuredRosarioReport content={studyResult} />
              </div>
            ) : null}

            {/* Local Ecosystem & Next Steps Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Ecosistema Solar de Santa Fe y Contactos Clave
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* EPCs */}
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold text-[11px]">Instaladores EPC Locales:</span>
                  <div className="font-medium text-slate-200">
                    Renovar Energía • Arguay SRL • Solartik • Enertik
                  </div>
                </div>

                {/* Distribuidores */}
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold text-[11px]">Insumos Tier-1 Regionales:</span>
                  <div className="font-medium text-slate-200">
                    TexSolar • Enertik (Inversores y Módulos Bifaciales)
                  </div>
                </div>

                {/* Financiamiento */}
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold text-[11px]">Financiamiento:</span>
                  <div className="font-medium text-emerald-400">
                    Créditos Verdes Banco de Santa Fe • Modelos PPA
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Grounding Links */}
            {groundingLinks.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Referencias verificadas:
                </span>
                {groundingLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 hover:text-amber-300 hover:border-amber-500/40 transition text-[11px]"
                  >
                    <span>{link.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Specialized renderer for the exact 4-part structure of SolarCalc Rosario
 */
function StructuredRosarioReport({ content }: { content: string }) {
  const sections = content.split(/(?=###\s*\d+\.\s*)/g);

  if (sections.length <= 1) {
    return <div className="whitespace-pre-line">{content}</div>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        // Extract title and body
        const match = trimmed.match(/###\s*(\d+\.\s*[^\n]+)\n?([\s\S]*)/);
        const title = match ? match[1] : `Sección ${idx + 1}`;
        const body = match ? match[2].trim() : trimmed;

        // Choose icon and color based on section number
        let badgeIcon = <CheckCircle2 className="w-4 h-4 text-amber-400" />;
        let borderColor = 'border-slate-800';

        if (title.includes('Diagnóstico')) {
          badgeIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
          borderColor = 'border-emerald-500/20';
        } else if (title.includes('Dimensionamiento')) {
          badgeIcon = <Zap className="w-4 h-4 text-amber-400" />;
          borderColor = 'border-amber-500/20';
        } else if (title.includes('Financiero')) {
          badgeIcon = <DollarSign className="w-4 h-4 text-yellow-400" />;
          borderColor = 'border-yellow-500/20';
        } else if (title.includes('Siguientes Pasos')) {
          badgeIcon = <ShieldCheck className="w-4 h-4 text-cyan-400" />;
          borderColor = 'border-cyan-500/20';
        }

        return (
          <div
            key={idx}
            className={`p-3.5 md:p-4 rounded-xl bg-slate-950/60 border ${borderColor} space-y-2`}
          >
            <h4 className="font-extrabold text-sm md:text-base text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
              {badgeIcon}
              <span>{title}</span>
            </h4>
            <div className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-1">
              {body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
