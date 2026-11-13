import React, { useState, useEffect, useMemo } from 'react';
import {
  FileDown,
  FileText,
  Briefcase,
  Sliders,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
  TrendingUp,
  ShieldCheck,
  Loader2,
  Users,
} from 'lucide-react';
import { EnergyProjections, LocationCoords, SolarSystemConfig } from '../types';
import {
  ExecutiveReportMetadata,
  ParticipationVehicle,
  SolarCalcOverrideSummary,
  exportExecutiveDocx,
  exportExecutivePdf,
} from '../utils/executiveReportGenerator';
import { DistributedGenModality, classifyArgentinaSolarProject } from '../utils/argentinaSolarFramework';
import { formatCapacityMw, formatNumber, formatPercent } from '../utils/formatters';

interface ExecutiveExportPanelProps {
  location: LocationCoords;
  config: SolarSystemConfig;
  projections: EnergyProjections;
  solarCalcOverride?: SolarCalcOverrideSummary;
  aiAuditReport?: string | null;
  defaultModality?: DistributedGenModality;
  defaultContractedPowerKw?: number;
  compact?: boolean;
}

export const ExecutiveExportPanel: React.FC<ExecutiveExportPanelProps> = ({
  location,
  config,
  projections,
  solarCalcOverride,
  aiAuditReport,
  defaultModality = 'individual',
  defaultContractedPowerKw,
  compact = false,
}) => {
  const [showCorporateConfig, setShowCorporateConfig] = useState(false);
  const [projectNameEdited, setProjectNameEdited] = useState(false);

  const [metadata, setMetadata] = useState<ExecutiveReportMetadata>({
    projectName: `Parque Solar Fotovoltaico — ${location.name}`,
    evaluatorName: 'Dirección de Ingeniería Solar',
    investorEntity: 'Consorcio / Socios Inversores',
    participationVehicle: 'fideicomiso',
    equityFractionPercent: 25,
    futureExpansionMw: Math.max(1, Math.round(config.systemCapacityMw * 2 * 10) / 10),
    modality: defaultModality,
    contractedPowerKw: defaultContractedPowerKw,
    notes: '',
  });

  // Sync project name & defaults reactively when location or capacity changes (unless user typed custom name)
  useEffect(() => {
    setMetadata((prev) => ({
      ...prev,
      projectName: projectNameEdited
        ? prev.projectName
        : `Parque Solar Fotovoltaico — ${location.name}`,
      futureExpansionMw: Math.max(
        config.systemCapacityMw,
        Math.round(config.systemCapacityMw * 2 * 10) / 10
      ),
      modality: defaultModality,
      contractedPowerKw: defaultContractedPowerKw ?? prev.contractedPowerKw,
    }));
  }, [location.name, config.systemCapacityMw, defaultModality, defaultContractedPowerKw, projectNameEdited]);

  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'docx' | null;
    loading: boolean;
    successMessage: string | null;
    errorMessage: string | null;
  }>({
    type: null,
    loading: false,
    successMessage: null,
    errorMessage: null,
  });

  // Live preview numbers for the fractional participation model
  const preview = useMemo(() => {
    const dcKwp = solarCalcOverride ? solarCalcOverride.recommendedKwp : projections.dcCapacityKwp;
    const acKw = solarCalcOverride ? solarCalcOverride.acCoupleKw : projections.acCapacityKw;
    const capex = solarCalcOverride ? solarCalcOverride.capexUsd : projections.capexTotalUsd;
    const annualBenefit = solarCalcOverride
      ? solarCalcOverride.annualSavingsUsd
      : projections.annualRevenueUsd;
    const annualMwh = solarCalcOverride
      ? solarCalcOverride.annualGenKwh / 1000
      : projections.annualGenerationMwh;

    const fraction = Math.min(100, Math.max(1, metadata.equityFractionPercent)) / 100;
    const regClass = classifyArgentinaSolarProject(
      acKw,
      dcKwp,
      metadata.modality,
      metadata.contractedPowerKw
    );

    return {
      dcKwp,
      acKw,
      partnerCapexUsd: Math.round(capex * fraction),
      partnerKwp: Math.round(dcKwp * fraction * 10) / 10,
      partnerMwhYear: Math.round(annualMwh * fraction * 10) / 10,
      partnerBenefitYearUsd: Math.round(annualBenefit * fraction),
      regClass,
    };
  }, [projections, solarCalcOverride, metadata]);

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExportStatus({
      type: format,
      loading: true,
      successMessage: null,
      errorMessage: null,
    });

    try {
      const payload = {
        location,
        config,
        projections,
        metadata,
        solarCalcOverride,
        aiAuditReport,
      };

      if (format === 'pdf') {
        await exportExecutivePdf(payload);
        setExportStatus({
          type: null,
          loading: false,
          successMessage:
            'Informe PDF corporativo generado y descargado (portada, análisis técnico, marco Ley 27.424 / Res. SE 287/2025 y modelo societario).',
          errorMessage: null,
        });
      } else {
        await exportExecutiveDocx(payload);
        setExportStatus({
          type: null,
          loading: false,
          successMessage:
            'Documento editable (.docx) descargado. Puedes abrirlo directamente en Google Docs (Subir / Abrir con Documentos de Google) o Microsoft Word.',
          errorMessage: null,
        });
      }

      setTimeout(() => {
        setExportStatus((prev) => ({ ...prev, successMessage: null }));
      }, 6000);
    } catch (err: any) {
      setExportStatus({
        type: null,
        loading: false,
        successMessage: null,
        errorMessage: `No se pudo generar el archivo ${format.toUpperCase()}: ${err?.message || 'Error inesperado'}`,
      });
    }
  };

  return (
    <section
      className={`bg-gradient-to-br from-slate-900 via-slate-900 to-[#0c1d33] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden ${
        compact ? 'p-4 sm:p-5 space-y-4' : 'p-5 sm:p-6 space-y-5'
      }`}
    >
      {/* Top Corporate Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Briefcase className="w-3 h-3" />
              Carpeta para Inversores y Socios
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold">
              {preview.regClass.categoryCode} • {formatCapacityMw(config.systemCapacityMw)}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Generar Informe Ejecutivo / Exportar Reporte del Proyecto
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Exporta la memoria de cálculo completa con portada corporativa, datos técnicos, curva de generación, encuadre legal vigente (Ley 27.424 / Res. SE 287/2025 y 400/2025) y esquema de participación fraccionada / fideicomiso.
          </p>
        </div>

        {/* Toggle Corporate Cover & Equity Structuring Customizer */}
        <button
          type="button"
          onClick={() => setShowCorporateConfig(!showCorporateConfig)}
          className="self-start lg:self-center px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Personalizar Portada y Participación Societaria</span>
          {showCorporateConfig ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Live Fractional Participation Snapshot Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Vehículo Estructurado
          </span>
          <span className="text-xs font-extrabold text-white mt-0.5 block truncate">
            {metadata.participationVehicle === 'fideicomiso'
              ? 'Fideicomiso de Inversión'
              : metadata.participationVehicle === 'spv'
              ? 'Sociedad SPV / S.A.S.'
              : metadata.participationVehicle === 'comunitario'
              ? 'Consorcio Comunitario'
              : 'Autoconsumo Directo'}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">
            Fracción: {formatPercent(metadata.equityFractionPercent)}
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Aporte Cuotaparte
          </span>
          <span className="text-sm font-black text-amber-400 mt-0.5 block">
            USD {formatNumber(preview.partnerCapexUsd)}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatNumber(preview.partnerKwp, 1)} kWp atribuibles
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Energía Atribuible
          </span>
          <span className="text-sm font-black text-cyan-400 mt-0.5 block">
            {formatNumber(preview.partnerMwhYear, 1)} MWh/año
          </span>
          <span className="text-[10px] text-slate-400">
            Escalable a {formatCapacityMw(metadata.futureExpansionMw)}
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Flujo Bruto Socio
          </span>
          <span className="text-sm font-black text-emerald-400 mt-0.5 block">
            USD {formatNumber(preview.partnerBenefitYearUsd)}/año
          </span>
          <span className="text-[10px] text-slate-400">
            Proporcional al {formatPercent(metadata.equityFractionPercent)}
          </span>
        </div>
      </div>

      {/* Collapsible Corporate & Equity Model Configuration Form */}
      {showCorporateConfig && (
        <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Datos de Portada y Estructuración del Caso Societario
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Se refleja automáticamente en el PDF y Google Docs / Word
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nombre del Proyecto</label>
              <input
                type="text"
                value={metadata.projectName}
                onChange={(e) => {
                  setProjectNameEdited(true);
                  setMetadata({ ...metadata, projectName: e.target.value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Inversor / Socio Destinatario
              </label>
              <input
                type="text"
                value={metadata.investorEntity}
                onChange={(e) => setMetadata({ ...metadata, investorEntity: e.target.value })}
                placeholder="Ej. Grupo Industrial / Fideicomiso Norte"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Evaluador / Consultor Responsable
              </label>
              <input
                type="text"
                value={metadata.evaluatorName}
                onChange={(e) => setMetadata({ ...metadata, evaluatorName: e.target.value })}
                placeholder="Ej. Ing. Responsable / Estudio EPC"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Vehículo de Participación / Inversión
              </label>
              <select
                value={metadata.participationVehicle}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    participationVehicle: e.target.value as ParticipationVehicle,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="fideicomiso">
                  Fideicomiso de Administración y Cuotapartes
                </option>
                <option value="spv">
                  Sociedad Vehículo de Propósito Especial (SPV / S.A.)
                </option>
                <option value="comunitario">
                  Consorcio Comunitario (Ley 27.424 / Res. SE 287/2025)
                </option>
                <option value="autoconsumo">
                  Inversión Directa en Autoconsumo Corporativo
                </option>
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-slate-400 font-semibold mb-1">
                <span>Fracción de Participación Inicial (%)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatPercent(metadata.equityFractionPercent)}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={metadata.equityFractionPercent}
                  onChange={(e) =>
                    setMetadata({ ...metadata, equityFractionPercent: Number(e.target.value) })
                  }
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={metadata.equityFractionPercent}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      equityFractionPercent: Math.min(100, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono font-bold text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Horizonte de Escalamiento Futuro (MWp)
              </label>
              <input
                type="number"
                step={0.5}
                min={config.systemCapacityMw}
                max={100}
                value={metadata.futureExpansionMw}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    futureExpansionMw: Math.max(
                      config.systemCapacityMw,
                      parseFloat(e.target.value) || config.systemCapacityMw
                    ),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-400 font-semibold mb-1">
              Notas Ejecutivas o Cláusulas Societarias Adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              value={metadata.notes || ''}
              onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
              placeholder="Ej. Derecho de suscripción preferente para Etapa II, condiciones de retiro de dividendos energéticos o PPA corporativo..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Two Differentiated Export Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Option 1: Professional Multi-Page Corporate PDF */}
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          disabled={exportStatus.loading}
          className="group min-h-[68px] p-4 rounded-2xl bg-gradient-to-r from-[#0F2744] via-[#15355c] to-[#1b4372] hover:from-[#15355c] hover:to-[#225188] border border-sky-400/35 hover:border-sky-300/70 text-left flex items-center justify-between gap-3 shadow-lg shadow-slate-950/50 transition cursor-pointer active:scale-99 disabled:opacity-60 disabled:cursor-wait"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 text-sky-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {exportStatus.loading && exportStatus.type === 'pdf' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Exportar a PDF Profesional</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-bold">
                  Listo para Carpeta
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Diseño corporativo multipágina con portada, tablas técnicas, curva mensual, marco legal y firmas.
              </p>
            </div>
          </div>
        </button>

        {/* Option 2: Editable Google Docs / Word (.docx) */}
        <button
          type="button"
          onClick={() => handleExport('docx')}
          disabled={exportStatus.loading}
          className="group min-h-[68px] p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#073b2c] to-[#084c38] hover:from-[#073b2c] hover:to-[#0a5e46] border border-emerald-400/40 hover:border-emerald-300/80 text-left flex items-center justify-between gap-3 shadow-lg shadow-slate-950/50 transition cursor-pointer active:scale-99 disabled:opacity-60 disabled:cursor-wait"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {exportStatus.loading && exportStatus.type === 'docx' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Exportar a Google Docs / Word</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 border border-white/20 text-slate-100 font-bold">
                  .DOCX Editable
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-0.5 leading-snug">
                Memoria editable compatible con Google Docs y Word para sumar anexos legales o societarios.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Feedback Banner */}
      {exportStatus.successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportStatus.successMessage}</span>
        </div>
      )}

      {exportStatus.errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs">
          {exportStatus.errorMessage}
        </div>
      )}
    </section>
  );
};
