import { CurrentWeather, DailyForecast, HourlyForecast, LocationCoords } from '../types';
import { calculateSunPosition } from '../utils/solarCalculations';

export const SOLAR_PRESETS: LocationCoords[] = [
  // 1. Centro / Santa Fe & Gran Rosario (Polo Industrial On-Grid)
  {
    name: 'Villa Gobernador Gálvez (Parque Industrial)',
    country: 'Argentina',
    region: 'Santa Fe • Gran Rosario (EPE Prosumidores)',
    lat: -33.0298,
    lng: -60.6385,
  },
  {
    name: 'Rosario (Parque Industrial Ovidio Lagos)',
    country: 'Argentina',
    region: 'Santa Fe • Corredor PyME y logístico',
    lat: -32.9964,
    lng: -60.6974,
  },
  {
    name: 'Alvear (Parque Industrial Metropolitano)',
    country: 'Argentina',
    region: 'Santa Fe • Polo metalmecánico y autopartista',
    lat: -33.0784,
    lng: -60.6212,
  },
  {
    name: 'San Lorenzo / Puerto Gral. San Martín',
    country: 'Argentina',
    region: 'Santa Fe • Complejo agroexportador y portuario',
    lat: -32.7485,
    lng: -60.7329,
  },
  {
    name: 'Rafaela (Polo Agroindustrial del Centro)',
    country: 'Argentina',
    region: 'Santa Fe • Cuenca lechera e industrial',
    lat: -31.2503,
    lng: -61.4867,
  },

  // 2. NOA / Puna (Radiación Solar Extrema Mundial > 2.400 kWh/m²)
  {
    name: 'Cauchari / Susques (Puna Jujeña)',
    country: 'Argentina',
    region: 'Jujuy • Parque Solar Cauchari (4.020 msnm, 315 MW)',
    lat: -24.0953,
    lng: -66.8122,
  },
  {
    name: 'Cafayate (Valles Calchaquíes)',
    country: 'Argentina',
    region: 'Salta • Parque Solar Cafayate (100 MW, EDESA)',
    lat: -26.0733,
    lng: -65.9761,
  },
  {
    name: 'Tinogasta / Fiambalá (Valle de Abaucán)',
    country: 'Argentina',
    region: 'Catamarca • Polo solar andino (EC SAPEM)',
    lat: -28.0632,
    lng: -67.5649,
  },
  {
    name: 'Nonogasta / Chilecito (Valle del Famatina)',
    country: 'Argentina',
    region: 'La Rioja • Parque Solar Nonogasta (35 MW, EDELAR)',
    lat: -29.2974,
    lng: -67.5028,
  },

  // 3. Cuyo (Hub Solar Andino de Alta Heliofanía > 2.000 kWh/m²)
  {
    name: 'Valle de Ullum / Iglesia (EPSE)',
    country: 'Argentina',
    region: 'San Juan • Capital solar de Cuyo (300+ MW instalados)',
    lat: -31.4285,
    lng: -68.7421,
  },
  {
    name: 'Luján de Cuyo / Anchoris',
    country: 'Argentina',
    region: 'Mendoza • Parque Solar Anchoris (EDEMSA / EPRE)',
    lat: -33.3275,
    lng: -68.9142,
  },
  {
    name: 'San Luis (Parque Terrazas del Portezuelo)',
    country: 'Argentina',
    region: 'San Luis • Generación pública sustentable (EDESAL)',
    lat: -33.3228,
    lng: -66.3051,
  },

  // 4. Centro / Córdoba & Litoral
  {
    name: 'Córdoba Capital (Parques Industriales Ferreyra)',
    country: 'Argentina',
    region: 'Córdoba • Ley 10.604 Generación Distribuida (EPEC)',
    lat: -31.4201,
    lng: -64.1888,
  },
  {
    name: 'Río Cuarto / Villa María',
    country: 'Argentina',
    region: 'Córdoba • Núcleo agroindustrial y biocombustibles',
    lat: -33.1232,
    lng: -64.3493,
  },
  {
    name: 'Paraná / Concordia',
    country: 'Argentina',
    region: 'Entre Ríos • Red sustentable ENERSA',
    lat: -31.7333,
    lng: -60.5333,
  },
  {
    name: 'Santa Rosa (Parque Industrial)',
    country: 'Argentina',
    region: 'La Pampa • Régimen APE y Cooperativas',
    lat: -36.6167,
    lng: -64.2833,
  },

  // 5. Buenos Aires & AMBA (Mayor Densidad de Consumo Eléctrico)
  {
    name: 'Parque Industrial Pilar / Escobar',
    country: 'Argentina',
    region: 'Buenos Aires Norte • Mayor parque industrial del país (EDEN)',
    lat: -34.4589,
    lng: -58.9142,
  },
  {
    name: 'CABA / Área Metropolitana (AMBA)',
    country: 'Argentina',
    region: 'Buenos Aires • Techos urbanos y comercios (Edenor / Edesur)',
    lat: -34.6037,
    lng: -58.3816,
  },
  {
    name: 'Campana / Zárate (Corredor Petroquímico)',
    country: 'Argentina',
    region: 'Buenos Aires • Industria pesada y puertos (EDEN)',
    lat: -34.1687,
    lng: -58.9591,
  },
  {
    name: 'Bahía Blanca (Polo Petroquímico y Puerto)',
    country: 'Argentina',
    region: 'Buenos Aires Sur • Alto potencial eólico-solar (EDES)',
    lat: -38.7183,
    lng: -62.2663,
  },
  {
    name: 'Mar del Plata (Parque Industrial Gral. Savio)',
    country: 'Argentina',
    region: 'Buenos Aires Costa Atlántica • EDEA',
    lat: -38.0055,
    lng: -57.5565,
  },
  {
    name: 'La Plata (Gran La Plata)',
    country: 'Argentina',
    region: 'Buenos Aires • Polo tecnológico y universitario (EDELAP)',
    lat: -34.9214,
    lng: -57.9545,
  },

  // 6. Patagonia (Transición Energética e Inclinaciones Óptimas Pronunciadas)
  {
    name: 'Añelo / Vaca Muerta',
    country: 'Argentina',
    region: 'Neuquén • Corredor energético e industrial (EPEN)',
    lat: -38.3512,
    lng: -68.7845,
  },
  {
    name: 'Cipolletti / General Roca (Alto Valle)',
    country: 'Argentina',
    region: 'Río Negro • Fruticultura y agroindustria (EdERSA)',
    lat: -38.9339,
    lng: -67.9903,
  },
  {
    name: 'Comodoro Rivadavia (Golfo San Jorge)',
    country: 'Argentina',
    region: 'Chubut • Hub industrial patagónico',
    lat: -45.8647,
    lng: -67.4966,
  },
  {
    name: 'Río Gallegos (Península Austral)',
    country: 'Argentina',
    region: 'Santa Cruz • SPSE (Inclinación óptima ~48°)',
    lat: -51.6226,
    lng: -69.2181,
  },
  {
    name: 'Ushuaia / Río Grande',
    country: 'Argentina',
    region: 'Tierra del Fuego • Ley 19.640 (Inclinación óptima ~54°)',
    lat: -54.8019,
    lng: -68.303,
  },

  // 7. NEA / Subtropical
  {
    name: 'Corrientes Capital / Goya',
    country: 'Argentina',
    region: 'Corrientes • Generación Distribuida DPEC',
    lat: -27.4692,
    lng: -58.8306,
  },
  {
    name: 'Resistencia / Sáenz Peña',
    country: 'Argentina',
    region: 'Chaco • SECHEEP Generación Solar',
    lat: -27.4514,
    lng: -58.9866,
  },
  {
    name: 'Posadas (Silicon Misiones)',
    country: 'Argentina',
    region: 'Misiones • Energía de Misiones Renovable',
    lat: -27.3671,
    lng: -55.8961,
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
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=11&accept-language=es`
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.suburb || 'Ubicación seleccionada';
    const state = addr.state || addr.region || addr.province || '';
    const country = addr.country || 'Argentina';

    return {
      name: `${city}${state ? `, ${state}` : ''}`,
      country,
      region: state,
    };
  } catch {
    return {
      name: `Coordenadas ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      country: 'Argentina',
      region: '',
    };
  }
}

/**
 * Search places across Argentina (with fallback to global)
 */
export async function searchPlaces(query: string): Promise<LocationCoords[]> {
  if (!query || query.trim().length < 2) return [];

  // 1. Try Argentina prioritized search
  try {
    const resAr = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=6&accept-language=es`
    );
    if (resAr.ok) {
      const itemsAr = await resAr.json();
      if (itemsAr && itemsAr.length > 0) {
        return itemsAr.map((it: any) => ({
          name: it.display_name.split(',')[0],
          region: it.display_name.split(',').slice(1, 3).join(',').trim(),
          country: 'Argentina',
          lat: parseFloat(it.lat),
          lng: parseFloat(it.lon),
        }));
      }
    }
  } catch (e) {
    console.warn('Argentina targeted search error:', e);
  }

  // 2. Global fallback if specific search returned empty
  try {
    const resGlobal = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=es`
    );
    if (!resGlobal.ok) return [];
    const items = await resGlobal.json();
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
