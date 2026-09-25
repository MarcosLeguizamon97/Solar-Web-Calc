import { EnergyProjections, SolarSystemConfig } from '../types';

/**
 * Calculates optimal fixed tilt angle based on latitude
 */
export function calculateOptimalTilt(latitude: number): number {
  const absLat = Math.abs(latitude);
  if (absLat < 10) return 12; // Minimum tilt for rainwater cleaning
  if (absLat < 25) return Math.round(absLat * 0.88);
  if (absLat < 45) return Math.round(absLat * 0.86);
  return Math.round(absLat * 0.82);
}

/**
 * Calculates sun elevation and azimuth angle for a given coordinate and date
 */
export function calculateSunPosition(lat: number, lng: number, date: Date = new Date()) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );

  // Solar declination (approx Cooper 1969)
  const declination = 23.45 * Math.sin(rad * ((360 / 365) * (dayOfYear - 81)));

  // Time calculations
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const solarTime = (minutes + 4 * lng) % 1440;
  const hourAngle = (solarTime / 4) - 180;

  // Elevation angle
  const sinElevation =
    Math.sin(lat * rad) * Math.sin(declination * rad) +
    Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(hourAngle * rad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation))) / rad;

  // Azimuth angle
  const cosAzimuth =
    (Math.sin(declination * rad) * Math.cos(lat * rad) -
      Math.cos(declination * rad) * Math.sin(lat * rad) * Math.cos(hourAngle * rad)) /
    Math.cos(elevation * rad);
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) / rad;
  if (hourAngle > 0) azimuth = 360 - azimuth;

  return {
    elevation: Math.max(0, Math.round(elevation * 10) / 10),
    azimuth: Math.round(azimuth * 10) / 10,
  };
}

/**
 * Monthly distribution coefficients depending on hemisphere and latitude
 */
function getMonthlyRadiationWeights(latitude: number): number[] {
  const isNorthern = latitude >= 0;
  const absLat = Math.abs(latitude);
  const factor = Math.min(1.6, 1.0 + (absLat / 50) * 0.7);

  // Month indices: 0 = Jan, ..., 11 = Dec
  // Northern: Peak in June/July (months 5,6)
  // Southern: Peak in Dec/Jan (months 11,0)
  const baseCurve = isNorthern
    ? [0.55, 0.7, 0.95, 1.15, 1.35, 1.45, 1.48, 1.35, 1.1, 0.85, 0.6, 0.47]
    : [1.45, 1.35, 1.15, 0.9, 0.7, 0.52, 0.55, 0.7, 0.95, 1.15, 1.35, 1.48];

  const scaled = baseCurve.map((val) => 1 + (val - 1) * (factor - 0.3));
  const avg = scaled.reduce((a, b) => a + b, 0) / 12;
  return scaled.map((v) => v / avg);
}

/**
 * Estimates baseline annual GHI (Global Horizontal Irradiance in kWh/m²/year)
 * based on latitude and current measurements
 */
export function estimateAnnualGhi(lat: number, currentGhiW: number, dailyGhiKwh: number): number {
  const absLat = Math.abs(lat);
  // Latitudinal baseline model
  let baseGhi = 2300 - absLat * 22;
  if (absLat < 15) baseGhi = 2100; // Tropics (higher cloudiness)
  if (absLat >= 18 && absLat <= 32) baseGhi += 250; // Desert belt (Sahara, Atacama, Sonoran, Mojave, Cuyo, Outback)

  if (dailyGhiKwh > 1.0) {
    const extrapolated = dailyGhiKwh * 365;
    baseGhi = baseGhi * 0.4 + extrapolated * 0.6;
  }
  return Math.round(Math.max(900, Math.min(2750, baseGhi)));
}

/**
 * Main engineering calculation engine for solar photovoltaic plants
 */
export function calculateSolarProjections(
  lat: number,
  lng: number,
  config: SolarSystemConfig,
  currentWeather: {
    temperature: number;
    cloudCover: number;
    dni: number;
    ghi: number;
    dailyGhiKwh?: number;
  }
): EnergyProjections {
  const annualGhiKwhM2 = estimateAnnualGhi(
    lat,
    currentWeather.ghi,
    currentWeather.dailyGhiKwh || 5.2
  );

  // System parameters
  const capacityKwp = config.systemCapacityMw * 1000;
  const isTracking =
    config.technology === 'monocrystalline_tracking' ||
    config.technology === 'bifacial_tracking';
  const isBifacial = config.technology === 'bifacial_tracking';

  // Plane of Array (POA) Irradiance factor
  // Fixed tilt with optimal angle gains ~10-15% over horizontal
  // 1-Axis tracking gains ~24-30% over horizontal in sunny areas
  let poaFactor = 1.12;
  if (isTracking) {
    poaFactor = 1.28;
  }
  if (isBifacial) {
    poaFactor *= 1.08; // 8% albedo rear gain
  }

  const effectivePoaKwhM2 = annualGhiKwhM2 * poaFactor;

  // Temperature losses:
  // PV modules are rated at 25°C. At higher ambient temps, cells run hotter.
  // Standard temp coeff: -0.38% / °C
  const avgAmbientTemp = Math.max(12, currentWeather.temperature || 20);
  const avgOperatingCellTemp = avgAmbientTemp + 28; // approx 28°C elevation during solar hours
  const deltaTemp = Math.max(0, avgOperatingCellTemp - 25);
  const tempLossPercent = Math.min(18, Math.max(2, deltaTemp * 0.38));

  // Other standard technical losses
  const soilingLossPercent = 3.5; // Dust/cleaning
  const inverterLossPercent = 100 - (config.inverterEfficiencyPercent || 98.2);
  const cablingAndMismatchPercent = 2.8;
  const shadingAndDegradationPercent = 1.5;

  const totalLossMultiplier =
    (1 - tempLossPercent / 100) *
    (1 - soilingLossPercent / 100) *
    (1 - inverterLossPercent / 100) *
    (1 - cablingAndMismatchPercent / 100) *
    (1 - shadingAndDegradationPercent / 100);

  const performanceRatio = Math.round(totalLossMultiplier * 1000) / 10; // e.g. 81.2%

  // Specific Yield (kWh generated per kWp installed per year)
  const specificYieldKwhKwp = Math.round(effectivePoaKwhM2 * (performanceRatio / 100));

  // Annual Generation in MWh
  const annualGenerationMwh = Math.round((capacityKwp * specificYieldKwhKwp) / 1000);

  // Capacity Factor (%) = Annual Generation / (Capacity * 8760h) * 100
  const capacityFactorPercent =
    Math.round((annualGenerationMwh / (config.systemCapacityMw * 8760)) * 1000) / 10;

  // Environmental impact
  // ~0.42 tonnes CO2 avoided per MWh in average electrical grid
  const avoidedCo2TonsYear = Math.round(annualGenerationMwh * 0.42);
  // Average household consumption ~3.6 MWh/year
  const homesPowered = Math.round(annualGenerationMwh / 3.6);

  // Financial calculations
  const capexTotalUsd = Math.round(capacityKwp * 1000 * config.capexPerWpUsd);
  const grossAnnualRevenueUsd = Math.round(annualGenerationMwh * config.electricityPriceUsdMwh);
  const opexAnnualUsd = Math.round(capexTotalUsd * 0.015); // OPEX ~1.5% of CAPEX
  const netAnnualRevenueUsd = Math.max(1000, grossAnnualRevenueUsd - opexAnnualUsd);

  const simplePaybackYears =
    netAnnualRevenueUsd > 0
      ? Math.round((capexTotalUsd / netAnnualRevenueUsd) * 10) / 10
      : 25;

  // Levelized Cost of Electricity (LCOE) approximation over 25 years with 0.5% degradation
  const lifetimeGenerationMwh = annualGenerationMwh * 21.5; // discounted lifetime yield
  const lifetimeTotalCostUsd = capexTotalUsd + opexAnnualUsd * 25;
  const lcoeUsdMwh = Math.round((lifetimeTotalCostUsd / lifetimeGenerationMwh) * 10) / 10;

  // Monthly generation distribution
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const monthlyWeights = getMonthlyRadiationWeights(lat);
  const monthlyGenerationMwh = monthNames.map((month, idx) => {
    const weight = monthlyWeights[idx];
    const gen = Math.round((annualGenerationMwh / 12) * weight);
    const ghi = Math.round((annualGhiKwhM2 / 12) * weight);
    return { month, generationMwh: gen, ghiKwhM2: ghi };
  });

  // Comprehensive Viability Score (0 - 100)
  // 1. Solar Resource (max 45 pts): 2400 kWh/m² = 45 pts, 1200 kWh/m² = 15 pts
  const resourceScore = Math.min(45, Math.max(10, ((annualGhiKwhM2 - 1000) / 1500) * 35 + 10));
  // 2. Temperature factor (max 20 pts): Cooler is better for efficiency
  const tempScore = Math.min(20, Math.max(5, 20 - (tempLossPercent - 5) * 1.2));
  // 3. Cloud cover penalty / stability (max 20 pts)
  const cloudScore = Math.min(20, Math.max(5, 20 - (currentWeather.cloudCover || 20) * 0.15));
  // 4. Financial return score (max 15 pts): payback < 6 years = 15 pts, > 12 = 4 pts
  const financeScore = Math.min(15, Math.max(2, (12 - simplePaybackYears) * 2 + 5));

  const viabilityScore = Math.min(99, Math.round(resourceScore + tempScore + cloudScore + financeScore));

  let viabilityGrade: EnergyProjections['viabilityGrade'] = 'Favorable';
  if (viabilityScore >= 85) viabilityGrade = 'Excelente';
  else if (viabilityScore >= 75) viabilityGrade = 'Muy Favorable';
  else if (viabilityScore >= 60) viabilityGrade = 'Favorable';
  else if (viabilityScore >= 45) viabilityGrade = 'Moderado';
  else viabilityGrade = 'Desfavorable';

  const lossBreakdown = [
    {
      name: 'Pérdidas Térmicas por Temperatura',
      lossPercent: Math.round(tempLossPercent * 10) / 10,
      description: `Disminución por calentamiento de celda sobre 25°C (${avgOperatingCellTemp.toFixed(0)}°C en operación).`,
    },
    {
      name: 'Ensuciamiento y Polvo (Soiling)',
      lossPercent: soilingLossPercent,
      description: 'Acumulación de polvo, polen y partículas según clima local.',
    },
    {
      name: 'Pérdidas en Inversor y Conversión',
      lossPercent: Math.round(inverterLossPercent * 10) / 10,
      description: `Eficiencia de conversión DC a AC (${config.inverterEfficiencyPercent}%).`,
    },
    {
      name: 'Cableado Eléctrico y Desajuste (Mismatch)',
      lossPercent: cablingAndMismatchPercent,
      description: 'Caída de tensión en cableado de continua/alterna y tolerancia de módulos.',
    },
    {
      name: 'Degradación y Sombras Lejanas',
      lossPercent: shadingAndDegradationPercent,
      description: 'Degradación fotoinducida (LID) y sombras difusas del horizonte.',
    },
  ];

  return {
    annualGhiKwhM2,
    annualGenerationMwh,
    specificYieldKwhKwp,
    performanceRatio,
    capacityFactorPercent,
    avoidedCo2TonsYear,
    homesPowered,
    capexTotalUsd,
    annualRevenueUsd: grossAnnualRevenueUsd,
    simplePaybackYears,
    lcoeUsdMwh,
    viabilityScore,
    viabilityGrade,
    monthlyGenerationMwh,
    lossBreakdown,
  };
}
