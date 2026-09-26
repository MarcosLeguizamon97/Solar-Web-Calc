import React, { useState, useRef, useEffect } from 'react';
import { Info, Calculator, ExternalLink, X, BookOpen } from 'lucide-react';
import { METRIC_EXPLANATIONS, MetricDetail } from './MetricExplanationModal';

interface MetricHelpTooltipProps {
  metricId: string;
  metricTitle?: string;
  currentValue?: string | number;
  onOpenFullModal?: () => void;
  align?: 'left' | 'right' | 'center';
}

export const MetricHelpTooltip: React.FC<MetricHelpTooltipProps> = ({
  metricId,
  metricTitle,
  currentValue,
  onOpenFullModal,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const info: MetricDetail | undefined = METRIC_EXPLANATIONS[metricId];

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!info) return null;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Small circular help button with generous >=44px hit target */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="min-h-[44px] min-w-[44px] -m-2 p-2 flex items-center justify-center text-slate-400 hover:text-amber-400 focus:outline-none transition group cursor-pointer"
        aria-label={`Ver fórmula y explicación de ${metricTitle || info.title}`}
        title={`Ver fórmula y cálculo de ${metricTitle || info.title}`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition-all border ${
            isOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 scale-110'
              : 'bg-slate-900/90 text-slate-400 group-hover:text-amber-300 border-slate-700/80 group-hover:border-amber-500/50'
          }`}
        >
          i
        </span>
      </button>

      {/* Floating Tooltip / Popover */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute bottom-full mb-2 z-50 w-72 sm:w-80 p-3.5 bg-slate-900/98 backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl shadow-black/80 text-left animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right'
              ? 'right-0 origin-bottom-right'
              : align === 'left'
              ? 'left-0 origin-bottom-left'
              : 'left-1/2 -translate-x-1/2 origin-bottom'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-amber-400" />
                Fórmula de Cálculo
              </span>
              <h4 className="text-xs font-bold text-white leading-tight">
                {metricTitle || info.title}
              </h4>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition md:hidden cursor-pointer"
              aria-label="Cerrar tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Value Pill (if available) */}
          {currentValue && (
            <div className="mt-2 flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]">
              <span className="text-slate-400 font-medium">Valor actual:</span>
              <span className="font-extrabold text-amber-400 font-mono">{currentValue}</span>
            </div>
          )}

          {/* Formula Box */}
          <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-amber-500/25 font-mono text-[11px] text-amber-300 font-medium leading-relaxed break-words">
            {info.formula}
          </div>

          {/* Short interpretation */}
          <p className="mt-2 text-[11px] text-slate-300 leading-snug line-clamp-3">
            {info.shortDesc}
          </p>

          {/* Benchmark or Regulatory Footnote */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[190px]">{info.regulatoryOrStandard}</span>
            {onOpenFullModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullModal();
                }}
                className="text-amber-400 font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer ml-2"
              >
                <span>Detalle</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Caret pointing down */}
          <div
            className={`absolute top-full w-2.5 h-2.5 bg-slate-900 border-r border-b border-amber-500/40 transform rotate-45 -mt-1.5 ${
              align === 'right' ? 'right-4' : align === 'left' ? 'left-4' : 'left-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};
