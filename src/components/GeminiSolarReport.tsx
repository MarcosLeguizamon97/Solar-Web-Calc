import React from 'react';
import { Bot, MapPin, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Shield, Building2, Zap } from 'lucide-react';
import { GeminiAnalysisState, LocationCoords, SolarSystemConfig } from '../types';
import { WhatsAppIcon, formatReportForWhatsApp } from './TechnicalEnergyAnalysis';
import { formatNumber, formatCoord, formatCapacityMw, normalizeReportNumbers } from '../utils/formatters';

interface GeminiSolarReportProps {
  analysisState: GeminiAnalysisState;
  onGenerateReport: () => void;
  location: LocationCoords;
  config: SolarSystemConfig;
}

export const GeminiSolarReport: React.FC<GeminiSolarReportProps> = ({
  analysisState,
  onGenerateReport,
  location,
  config,
}) => {
  const { report, groundingChunks, loading, error, timestamp } = analysisState;

  const isTracker = config.technology === 'monocrystalline_tracking' || config.technology === 'bifacial_tracking';
  const haRatio = isTracker ? 1.6 : 1.4;
  const currentRequiredHectares = formatNumber(Math.round(config.systemCapacityMw * haRatio * 10) / 10, 1);
  const formattedCapacity = formatNumber(config.systemCapacityMw, Number.isInteger(config.systemCapacityMw) ? 0 : 1);
  const formattedHaRatio = formatNumber(haRatio, 1);

  const processedReport = React.useMemo(() => {
    if (!report) return '';
    let text = report;
    text = text.replace(
      /([-*•]?\s*(?:\*\*)?(?:Superficie\s+requerida|Superficie\s+estimada|Superficie\s+de\s+terreno)(?:\*\*)?:?\s*).*?(?=(\n|$))/gi,
      `- **Superficie requerida:** Para una planta de **${formattedCapacity} MWp**, se estiman necesarias aproximadamente **${currentRequiredHectares} hectáreas** (ratio de diseño: ~${formattedHaRatio} ha/MWp para ${isTracker ? 'seguidores a 1 eje' : 'estructura fija'}).`
    );
    text = text.replace(
      /Para\s+una\s+planta\s+de\s+(?:\*\*)?[\d.,]+\s*MWp(?:\*\*)?,?\s*se\s+estiman\s+necesarias?\s+aproximadamente\s+(?:\*\*)?[\d.,]+\s*hect[aá]reas(?:\*\*)?.*?(?=(\n|\.|$))/gi,
      `Para una planta de **${formattedCapacity} MWp**, se estiman necesarias aproximadamente **${currentRequiredHectares} hectáreas** (ratio de diseño: ~${formattedHaRatio} ha/MWp para ${isTracker ? 'seguidores a 1 eje' : 'estructura fija'})`
    );
    text = text.replace(
      /La\s+planta\s+de\s+(?:\*\*)?[\d.,]+\s*MWp(?:\*\*)?\s+requerir[aá]/gi,
      `La planta de **${formattedCapacity} MWp** requerirá`
    );
    return normalizeReportNumbers(text);
  }, [report, config.systemCapacityMw, formattedCapacity, currentRequiredHectares, formattedHaRatio, isTracker]);

  const whatsAppShareUrl = React.useMemo(() => {
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

  // Extract all unique verified Google Maps links from groundingChunks
  const mapSources = (groundingChunks || [])
    .filter((chunk) => chunk.maps?.uri || chunk.web?.uri)
    .map((chunk) => ({
      title: chunk.maps?.title || chunk.web?.title || 'Ubicación verificada en Google Maps',
      uri: chunk.maps?.uri || chunk.web?.uri || '#',
      reviewSnippets: chunk.maps?.placeAnswerSources?.reviewSnippets || [],
    }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              Auditoría Técnica de Emplazamiento con Google Maps Grounding
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Análisis de infraestructura real, accesos viales, subestaciones eléctricas y restricciones orográficas asistido por Gemini 3.8 Flash con datos cartográficos en vivo.
          </p>
        </div>

        <button
          onClick={onGenerateReport}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Consultando Google Maps e IA...' : 'Generar Auditoría de Terreno'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-950/60 rounded-xl p-8 border border-slate-800 text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-200 text-sm">
            Explorando geografía, rutas y red eléctrica en Google Maps...
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Analizando las coordenadas ({formatCoord(location.lat)}, {formatCoord(location.lng)}) para una planta solar de {formatCapacityMw(config.systemCapacityMw)}.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-rose-300">
              No se pudo completar la auditoría con Google Maps Grounding
            </div>
            <p className="text-slate-300">{error}</p>
            <button
              onClick={onGenerateReport}
              className="mt-2 text-rose-300 underline font-medium hover:text-white"
            >
              Reintentar análisis
            </button>
          </div>
        </div>
      )}

      {/* Empty State before first run */}
      {!report && !loading && !error && (
        <div className="bg-slate-950/50 rounded-xl p-8 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-white text-sm">
            Auditoría de Terreno con Google Maps Pendiente
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Haz clic en el botón superior para realizar una evaluación profunda del emplazamiento en ({formatCoord(location.lat)}, {formatCoord(location.lng)}) utilizando Google Maps Grounding para verificar accesos viales para transformadores, relieve, proximidad a subestaciones y áreas protegidas.
          </p>
          <button
            onClick={onGenerateReport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-semibold text-xs rounded-xl inline-flex items-center gap-2 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            Iniciar Auditoría de Terreno Ahora
          </button>
        </div>
      )}

      {/* Report Content */}
      {report && !loading && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Metadata bar with WhatsApp Share Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                Auditoría generada para: <strong>{location.name || 'Emplazamiento'}</strong> ({formatCoord(location.lat)}, {formatCoord(location.lng)})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {timestamp && (
                <span className="text-[11px] text-slate-500">
                  {new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <a
                href={whatsAppShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                title="Compartir por WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-slate-950" />
                <span>Compartir</span>
              </a>
            </div>
          </div>

          {/* Formatted Markdown Body */}
          <div className="prose prose-invert max-w-none text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 bg-slate-950/40 p-4 md:p-6 rounded-xl border border-slate-800/90">
            <ReportMarkdownRenderer content={processedReport} />
          </div>

          {/* Google Maps Grounding Sources Display (MANDATORY REQUIREMENT) */}
          {mapSources.length > 0 && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Fuentes y Vías Verificadas en Google Maps ({mapSources.length})
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                  Google Maps Grounding
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {mapSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-200 flex items-center justify-between group transition"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition" />
                      <span className="truncate font-medium group-hover:text-amber-300">
                        {src.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 group-hover:text-slate-400">
                      Abrir mapa ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Clean parser for markdown headings, bold text, and bullet points
 */
function ReportMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 / 2 (### or ##)
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
          const title = trimmed.replace(/^#+\s*/, '');
          return (
            <h4
              key={idx}
              className="text-sm md:text-base font-bold text-white pt-2 border-b border-slate-800/80 pb-1 flex items-center gap-2 text-amber-300"
            >
              {title}
            </h4>
          );
        }

        // List item (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 text-xs md:text-sm pl-2">
              <span className="text-amber-400 mt-1 shrink-0">•</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          );
        }

        // Numbered list item (1. 2. etc)
        if (/^\d+\.\s/.test(trimmed)) {
          const numberMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
          if (numberMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 text-xs md:text-sm pl-2">
                <span className="text-amber-400 font-bold shrink-0">{numberMatch[1]}</span>
                <div>{renderFormattedText(numberMatch[2])}</div>
              </div>
            );
          }
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold **text** in markdown lines
 */
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
