import { CurrentWeather, DailyForecast, HourlyForecast, LocationCoords } from '../types';
import { calculateSunPosition } from '../utils/solarCalculations';

export const SOLAR_PRESETS: LocationCoords[] = [
  {
    name: 'Villa Gobernador Gálvez (Parque Industrial)',
    country: 'Argentina (Santa Fe)',
    region: 'Gran Rosario - Cordón Industrial Sur (EPE Prosumidores)',
    lat: -33.0298,
    lng: -60.6385,
  },
  {
    name: 'Rosario (Parque Industrial / Ovidio Lagos)',
    country: 'Argentina (Santa Fe)',
    region: 'Gran Rosario - Corredor PyME y logístico On-Grid',
    lat: -32.9964,
    lng: -60.6974,
  },
  {
    name: 'Alvear (Parque Industrial Metropolitano)',
    country: 'Argentina (Santa Fe)',
    region: 'Gran Rosario - Polo industrial autopartista y metalúrgico',
    lat: -33.0784,
    lng: -60.6212,
  },
  {
    name: 'San Lorenzo / Puerto Gral. San Martín',
    country: 'Argentina (Santa Fe)',
    region: 'Gran Rosario - Complejo agroexportador y portuario',
    lat: -32.7485,
    lng: -60.7329,
  },
  {
    name: 'Desierto de Atacama (Antofagasta)',
    country: 'Chile',
    region: 'Mayor radiación del planeta (>2,800 kWh/m²)',
    lat: -23.8634,
    lng: -69.1328,
  },
  {
    name: 'San Juan (Valle de Ullum / Cuyo)',
    country: 'Argentina',
    region: 'Hub solar andino de alta heliofanía',
    lat: -31.4285,
    lng: -68.7421,
  },
  {
    name: 'Desierto de Sonora (Puerto Peñasco)',
    country: 'México',
    region: 'Gran cinturón solar norteamericano',
    lat: 31.3172,
    lng: -113.5375,
  },
  {
    name: 'Tabernas / Almería (Andalucía)',
    country: 'España',
    region: 'Punto de mayor radiación de Europa continental',
    lat: 37.0503,
    lng: -2.3912,
  },
  {
    name: 'Desierto de Mojave (California/Nevada)',
    country: 'Estados Unidos',
    region: 'Epicentro fotovoltaico de escala comercial',
    lat: 35.011,
    lng: -115.4734,
  },
  {
    name: 'La Guajira (Uribia)',
    country: 'Colombia',
    region: 'Zona de alto recurso solar y eólico del Caribe',
    lat: 11.7139,
    lng: -72.2647,
  },
  {
    name: 'Noor Ouarzazate (Valle del Draa)',
    country: 'Marruecos',
    region: 'Mayor complejo termosolar y fotovoltaico de África',
    lat: 30.9989,
    lng: -6.8617,
  },
  {
    name: 'Arequipa (La Joya)',
    country: 'Perú',
    region: 'Altiplano sur con radiación superior a 2,500 kWh/m²',
    lat: -16.5925,
    lng: -71.8546,
  },
];

/**
 * Fetches real-time weather and solar radiation metrics from Open-Meteo
 */
export async function fetchSolarWeatherData(lat: number, lng: number): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,direct_normal_irradiance,direct_radiation,diffuse_radiation,shortwave_radiation_instant,uv_index,weather_code&hourly=temperature_2m,cloud_cover,direct_normal_irradiance,direct_radiation,diffuse_radiation,shortwave_radiation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,shortwave_radiation_sum,sunshine_duration,precipitation_sum&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error en servicio meteorológico: ${res.statusText}`);
  }

  const data = await res.json();
  const c = data.current || {};
  const h = data.hourly || {};
  const d = data.daily || {};

  const sun = calculateSunPosition(lat, lng, new Date());

  const current: CurrentWeather = {
    temperature: Math.round((c.temperature_2m ?? 20) * 10) / 10,
    humidity: Math.round(c.relative_humidity_2m ?? 40),
    cloudCover: Math.round(c.cloud_cover ?? 10),
    windSpeed: Math.round((c.wind_speed_10m ?? 12) * 10) / 10,
    dni: Math.round(c.direct_normal_irradiance ?? 0),
    ghi: Math.round(c.shortwave_radiation_instant ?? (c.direct_radiation || 0) + (c.diffuse_radiation || 0)),
    dhi: Math.round(c.diffuse_radiation ?? 0),
    uvIndex: Math.round((c.uv_index ?? 0) * 10) / 10,
    weatherCode: c.weather_code ?? 0,
    sunElevation: sun.elevation,
    sunAzimuth: sun.azimuth,
  };

  // Next 24 hours
  const nowHour = new Date().getHours();
  const sliceStart = Math.max(0, nowHour - 2);
  const sliceEnd = sliceStart + 24;

  const hourly: HourlyForecast = {
    time: (h.time || []).slice(sliceStart, sliceEnd),
    ghi: (h.shortwave_radiation || []).slice(sliceStart, sliceEnd).map((v: number) => Math.round(v || 0)),
    dni: (h.direct_normal_irradiance || []).slice(sliceStart, sliceEnd).map((v: number) => Math.round(v || 0)),
    dhi: (h.diffuse_radiation || []).slice(sliceStart, sliceEnd).map((v: number) => Math.round(v || 0)),
    temperature: (h.temperature_2m || []).slice(sliceStart, sliceEnd).map((v: number) => Math.round(v || 0)),
    cloudCover: (h.cloud_cover || []).slice(sliceStart, sliceEnd).map((v: number) => Math.round(v || 0)),
  };

  // Daily conversion: shortwave_radiation_sum is in MJ/m² -> divide by 3.6 to get kWh/m²
  const ghiSums = (d.shortwave_radiation_sum || []).map((val: number) =>
    Math.round((val / 3.6) * 10) / 10
  );

  const daily: DailyForecast = {
    date: d.time || [],
    ghiSumKwhM2: ghiSums,
    peakSunHours: ghiSums, // Equivalent 1 kW/m² hours
    maxTemp: (d.temperature_2m_max || []).map((v: number) => Math.round(v || 0)),
    minTemp: (d.temperature_2m_min || []).map((v: number) => Math.round(v || 0)),
    sunshineHours: (d.sunshine_duration || []).map((v: number) =>
      Math.round((v / 3600) * 10) / 10
    ),
  };

  return { current, hourly, daily };
}

/**
 * Reverse geocodes a coordinate to get human-readable location name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; country: string; region: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=es`
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.suburb || 'Ubicación seleccionada';
    const region = addr.state || addr.region || addr.province || '';
    const country = addr.country || '';

    return {
      name: `${city}${region ? `, ${region}` : ''}`,
      country,
      region,
    };
  } catch {
    return {
      name: `Coordenadas ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      country: '',
      region: '',
    };
  }
}

/**
 * Search place by query string
 */
export async function searchPlaces(query: string): Promise<LocationCoords[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=es`
    );
    if (!res.ok) return [];
    const items = await res.json();
    return items.map((it: any) => ({
      name: it.display_name.split(',')[0],
      region: it.display_name.split(',').slice(1, 3).join(',').trim(),
      country: it.display_name.split(',').slice(-1)[0].trim(),
      lat: parseFloat(it.lat),
      lng: parseFloat(it.lon),
    }));
  } catch {
    return [];
  }
}
