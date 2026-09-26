import React from 'react';
import { Home, Activity, Zap, MapPin, ShieldCheck, ArrowLeft, Share2 } from 'lucide-react';

export type AppViewMode = 'landing' | 'kpis' | 'calc' | 'map' | 'audit';

interface MobileNavigationProps {
  activeView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  onOpenShareModal?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onSelectView,
  onOpenShareModal,
}) => {
  const navItems: { id: AppViewMode; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'landing',
      label: 'Inicio',
      shortLabel: 'Inicio',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'kpis',
      label: 'Indicadores (SolarStudio)',
      shortLabel: 'KPIs',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'calc',
      label: 'SolarCalc Argentina (PyME)',
      shortLabel: 'Calculadora',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: 'map',
      label: 'Mapa Satelital & Terreno',
      shortLabel: 'Mapa',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'audit',
      label: 'Auditoría & Clima',
      shortLabel: 'Auditoría',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* 1. Desktop & Tablet Top Tab Bar */}
      <nav
        aria-label="Navegación principal de módulos"
        className="w-full flex items-center justify-between gap-3 border-b border-slate-800 pb-3"
      >
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Back to Home Button when viewing an inner section */}
        {activeView !== 'landing' && (
          <button
            onClick={() => onSelectView('landing')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hidden md:flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Volver al Inicio</span>
          </button>
        )}
      </nav>

      {/* 2. Mobile Fixed Bottom Navigation Bar (Thumb-Zone Ergonomics) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 shadow-2xl pb-safe">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition cursor-pointer select-none relative ${
                  isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label={item.label}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-amber-500/15 scale-110' : ''
                  }`}
                >
                  {item.icon}
                </div>
                <span className={`text-[10px] tracking-tight leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.shortLabel}
                </span>

                {/* Active Indicator dot */}
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
