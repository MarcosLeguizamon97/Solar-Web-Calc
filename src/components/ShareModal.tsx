import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Printer, MessageCircle, Twitter, Linkedin, Mail, X } from 'lucide-react';
import { EnergyProjections, LocationCoords, SolarSystemConfig } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationCoords;
  config: SolarSystemConfig;
  projections: EnergyProjections;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  location,
  config,
  projections,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build public shareable URL with URL query params
  // If in AI Studio, prefer the shared pre-deploy/public URL:
  const publicBaseUrl =
    typeof window !== 'undefined'
      ? window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'https://ais-pre-pgposytujugcf3bj7kjeyv-399059617848.us-east1.run.app'
        : window.location.origin
      : 'https://ais-pre-pgposytujugcf3bj7kjeyv-399059617848.us-east1.run.app';

  const params = new URLSearchParams({
    lat: location.lat.toFixed(4),
    lng: location.lng.toFixed(4),
    name: location.name,
    mw: config.systemCapacityMw.toString(),
    tech: config.technology,
    tilt: config.tiltAngleDegrees.toString(),
  });

  const fullShareUrl = `${publicBaseUrl}?${params.toString()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `☀️ Análisis de Viabilidad Planta Solar en ${location.name} (${config.systemCapacityMw} MWp): ${projections.annualGenerationMwh.toLocaleString()} MWh/año proyectados. Revisa el informe interactivo:`;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      shareText + ' ' + fullShareUrl
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(fullShareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      fullShareUrl
    )}`,
    email: `mailto:?subject=${encodeURIComponent(
      `Estudio de Viabilidad Solar: ${location.name}`
    )}&body=${encodeURIComponent(`${shareText}\n\n${fullShareUrl}`)}`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Compartir Estudio Solar Público</h3>
            <p className="text-xs text-slate-400">
              Cualquier persona con este enlace podrá ver el mapa, datos climáticos y proyecciones exactas.
            </p>
          </div>
        </div>

        {/* Selected Project Summary Card */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white truncate max-w-xs">{location.name}</span>
            <span className="text-amber-400 font-bold">{config.systemCapacityMw} MWp</span>
          </div>
          <div className="text-slate-400 flex items-center justify-between text-[11px]">
            <span>Coordenadas: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            <span className="text-emerald-400 font-medium">{projections.viabilityGrade} ({projections.viabilityScore}/100)</span>
          </div>
        </div>

        {/* Link Copy Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Enlace Público Directo:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={fullShareUrl}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <div className="text-[11px] text-emerald-400 font-medium">
              ✓ Enlace público copiado. Puedes pegarlo en WhatsApp, correo o presentaciones.
            </div>
          )}
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400">Compartir rápidamente vía:</span>
          <div className="grid grid-cols-4 gap-2">
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-emerald-300 hover:text-white flex flex-col items-center gap-1 text-[11px] font-medium transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-blue-300 hover:text-white flex flex-col items-center gap-1 text-[11px] font-medium transition"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>

            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 rounded-xl text-sky-300 hover:text-white flex flex-col items-center gap-1 text-[11px] font-medium transition"
            >
              <Twitter className="w-4 h-4" />
              <span>X</span>
            </a>

            <a
              href={shareLinks.email}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white flex flex-col items-center gap-1 text-[11px] font-medium transition"
            >
              <Mail className="w-4 h-4" />
              <span>Correo</span>
            </a>
          </div>
        </div>

        {/* Print / PDF Option */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
          <button
            onClick={() => {
              window.print();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Imprimir / Guardar como PDF</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
