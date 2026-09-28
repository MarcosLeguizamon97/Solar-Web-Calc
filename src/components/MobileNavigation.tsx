import React from 'react';
import { Home, Activity, Zap, MapPin, Layers, Sun, BarChart3 } from 'lucide-react';

export type AppViewMode = 'landing' | 'tech_energy' | 'kpis' | 'calc' | 'map' | 'weather' | 'audit' | 'charts';

interface MobileNavigationProps {
  activeView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  onOpenShareModal?: () => void;
}

/**
 * Fixed Bottom Navigation Bar
 * Serves as the primary, exclusive navigation bar across the entire application,
 * eliminating duplicate top menus and floating bars.
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onSelectView,
}) => {
  const navItems: { id: AppViewMode; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'landing',
      label: 'Inicio',
      shortLabel: 'Inicio',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'charts',
      label: 'Gráficos',
      shortLabel: 'Gráficos',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'tech_energy',
      label: 'Técnico',
      shortLabel: 'Técnico',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: 'kpis',
      label: 'KPIs',
      shortLabel: 'KPIs',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'calc',
      label: 'Calculadora',
      shortLabel: 'Calc',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: 'map',
      label: 'Mapa',
      shortLabel: 'Mapa',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'weather',
      label: 'Clima',
      shortLabel: 'Clima',
      icon: <Sun className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Navegación principal fija inferior"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl pb-safe"
    >
      <div className="max-w-3xl mx-auto grid grid-cols-7 items-center h-16 px-1 sm:px-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id || (item.id === 'tech_energy' && activeView === 'audit');
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none relative group ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 scale-110 shadow-sm shadow-amber-500/30'
                    : 'group-hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[10px] sm:text-xs tracking-tight leading-none truncate max-w-[65px] ${
                  isActive ? 'font-bold text-amber-400' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator dot */}
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
