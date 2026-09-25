import React from 'react';
import { Sun, Cloud, Wind, Thermometer, Compass, Flame, Clock, Sparkles } from 'lucide-react';
import { CurrentWeather, DailyForecast, HourlyForecast } from '../types';

interface WeatherPanelProps {
  weather: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  loading?: boolean;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ weather, hourly, daily, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Estimated operating cell temperature: Tcell ≈ Tamb + 28°C * (GHI / 1000)
  const cellTemp = Math.round(weather.temperature + 28 * (Math.min(1000, weather.ghi) / 1000));

  // Today's estimated HSP (Peak Sun Hours)
  const todayHsp = daily.peakSunHours?.[0] || Math.round((weather.ghi * 6.5) / 1000 * 10) / 10 || 5.4;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            Condiciones Meteorológicas y Recurso Solar en Tiempo Real
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Medición instantánea vía satélite meteorológico de alta resolución
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">
            En Tiempo Real
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {/* GHI */}
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-3.5 relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>GHI Instantáneo</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-amber-400 tracking-tight">
              {weather.ghi}
            </span>
            <span className="text-xs text-amber-400/80 font-semibold">W/m²</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Irradiación Global Horizontal
          </div>
        </div>

        {/* DNI */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl p-3.5 relative overflow-hidden group hover:border-yellow-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>DNI (Haz Directo)</span>
            <Flame className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-yellow-300 tracking-tight">
              {weather.dni}
            </span>
            <span className="text-xs text-yellow-400/80 font-semibold">W/m²</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Clave para seguidores solares
          </div>
        </div>

        {/* Horas Sol Pico (HSP) */}
        <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-3.5 relative overflow-hidden group hover:border-orange-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>HSP Estimadas Hoy</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-orange-400 tracking-tight">
              {todayHsp}
            </span>
            <span className="text-xs text-orange-400/80 font-semibold">h/día</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Equivalente a 1,000 W/m²
          </div>
        </div>

        {/* Temperature & Cell Temp */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-xl p-3.5 relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Temperatura Celda</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-cyan-300 tracking-tight">
              {cellTemp}°C
            </span>
            <span className="text-xs text-slate-400">
              (Ambiente: {weather.temperature}°C)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {cellTemp > 50 ? '⚠️ Pérdidas térmicas elevadas' : '✓ Rango térmico favorable'}
          </div>
        </div>
      </div>

      {/* Secondary Atmosphere and Solar Positioning Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Cloud className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <div className="text-slate-400">Nubosidad</div>
            <div className="font-bold text-white text-sm">
              {weather.cloudCover}%
              <span className="text-[11px] font-normal text-slate-400 ml-1">
                {weather.cloudCover < 20 ? '(Despejado)' : weather.cloudCover < 60 ? '(Parcial)' : '(Nublado)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="text-slate-400">Viento a 10m</div>
            <div className="font-bold text-white text-sm">
              {weather.windSpeed} km/h
              <span className="text-[11px] font-normal text-slate-400 ml-1">
                (Enfría paneles)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-slate-400">Elevación Solar</div>
            <div className="font-bold text-white text-sm">
              {weather.sunElevation}°
              <span className="text-[11px] font-normal text-slate-400 ml-1">
                (Cénit: {(90 - weather.sunElevation).toFixed(0)}°)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-slate-400">Índice UV</div>
            <div className="font-bold text-white text-sm">
              UV {weather.uvIndex}
              <span className="text-[11px] font-normal text-slate-400 ml-1">
                (Difusa: {weather.dhi} W/m²)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Solar Forecast Strip */}
      {daily.date && daily.date.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Pronóstico de Irradiación Solar para los Próximos 7 Días</span>
            <span className="text-[11px] text-slate-500 font-normal">HSP = Horas Sol Pico (kWh/m²)</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {daily.date.slice(0, 7).map((dStr, idx) => {
              const dateObj = new Date(dStr + 'T12:00:00');
              const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
              const hspVal = daily.peakSunHours[idx] || 0;
              const maxT = daily.maxTemp[idx] || 0;
              const sunH = daily.sunshineHours[idx] || 0;

              // Color based on radiation
              const isHigh = hspVal >= 6.0;
              const isGood = hspVal >= 4.5 && hspVal < 6.0;

              return (
                <div
                  key={dStr}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                    idx === 0
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
                    {idx === 0 ? 'Hoy' : dayName}
                  </span>

                  <Sun
                    className={`w-5 h-5 my-1.5 ${
                      isHigh
                        ? 'text-amber-400'
                        : isGood
                        ? 'text-yellow-400'
                        : 'text-slate-400'
                    }`}
                  />

                  <div className="font-extrabold text-sm text-white">
                    {hspVal.toFixed(1)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">h</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-center">
                    <span>{maxT}°C</span>
                    <span>•</span>
                    <span>{sunH}h sol</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
