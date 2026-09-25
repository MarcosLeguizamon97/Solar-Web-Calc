import { EnergyProjections, LossStep, SolarSystemConfig, CashFlowYear } from '../types';

/**
 * Calculates optimal fixed tilt angle based on latitude
 */
export function calculateOptimalTilt(latitude: number): number {
  const absLat = Math.abs(latitude);
  if (absLat < 10) return 12; // Minimum tilt for self-cleaning by rainwater
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

  const declination = 23.45 * Math.sin(rad * ((360 / 365) * (dayOfYear - 81)));

  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const solarTime = (minutes + 4 * lng) % 1440;
  const hourAngle = solarTime / 4 - 180;

  const sinElevation =
    Math.sin(lat * rad) * Math.sin(declination * rad) +
    Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(hourAngle * rad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation))) / rad;

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

  const baseCurve = isNorthern
    ? [0.55, 0.7, 0.95, 1.15, 1.35, 1.45, 1.48, 1.35, 1.1, 0.85, 0.6, 0.47]
    : [1.45, 1.35, 1.15, 0.9, 0.7, 0.52, 0.55, 0.7, 0.95, 1.15, 1.35, 1.48];

  const scaled = baseCurve.map((val) => 1 + (val - 1) * (factor - 0.3));
  const avg = scaled.reduce((a, b) => a + b, 0) / 12;
  return scaled.map((v) => v / avg);
}

/**
 * Estimates baseline annual GHI (Global Horizontal Irradiance in kWh/m²/year)
 */
export function estimateAnnualGhi(lat: number, currentGhiW: number, dailyGhiKwh: number): number {
  const absLat = Math.abs(lat);
  let baseGhi = 2300 - absLat * 22;
  if (absLat < 15) baseGhi = 2100;
  if (absLat >= 18 && absLat <= 32) baseGhi += 250; // Desert & Mediterranean belts

  if (dailyGhiKwh > 1.0) {
    const extrapolated = dailyGhiKwh * 365;
    baseGhi = baseGhi * 0.4 + extrapolated * 0.6;
  }
  return Math.round(Math.max(900, Math.min(2750, baseGhi)));
}

/**
 * Internal Rate of Return (IRR) calculation via Newton-Raphson
 */
function calculateIRR(cashFlows: number[], initialGuess = 0.12): number {
  let rate = initialGuess;
  const maxIterations = 100;
  const precision = 1e-5;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      if (t > 0) {
        dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < precision) return Math.round(rate * 1000) / 10;
    if (Math.abs(dNpv) < 1e-9) break;

    const newRate = rate - npv / dNpv;
    if (isNaN(newRate) || !isFinite(newRate)) break;
    rate = newRate;
  }
  return Math.round(Math.max(0, Math.min(50, rate * 100)) * 10) / 10;
}

/**
 * Net Present Value (NPV / VAN)
 */
function calculateNPV(rate: number, cashFlows: number[]): number {
  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + rate, t);
  }
  return Math.round(npv);
}

/**
 * Main solar engineering calculation engine with industry-standard indicators
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

  // Direct Normal Irradiance estimation
  const dniMultiplier = Math.abs(lat) >= 18 && Math.abs(lat) <= 35 ? 1.35 : 1.15;
  const annualDniKwhM2 = Math.round(annualGhiKwhM2 * dniMultiplier);

  // System parameters
  const capacityKwp = config.systemCapacityMw * 1000;
  const isTracking =
    config.technology === 'monocrystalline_tracking' ||
    config.technology === 'bifacial_tracking';
  const isBifacial =
    config.technology === 'bifacial_tracking' ||
    config.technology === 'monocrystalline_tracking';

  // Plane of Array (POA / GTI) Irradiance Factor
  let poaFactor = 1.14; // Fixed tilt gain over horizontal
  if (isTracking) {
    poaFactor = 1.28; // Single-axis tracker gain
  }

  const bifacialGainPercent = isBifacial ? (isTracking ? 9.5 : 7.0) : 0;
  const albedoFactor = 0.22; // Typical soil/gravel reflection
  const annualPoaKwhM2 = Math.round(annualGhiKwhM2 * poaFactor * (1 + bifacialGainPercent / 100));

  const peakSunHoursDaily = Math.round((annualPoaKwhM2 / 365) * 10) / 10;

  // Temperature losses (Standard IEC/PVsyst model)
  const avgAmbientTemp = Math.max(12, currentWeather.temperature || 21);
  const averageCellTempC = Math.round(avgAmbientTemp + 28);
  const deltaTemp = Math.max(0, averageCellTempC - 25);
  const tempCoeffPercent = config.technology === 'thin_film' ? 0.28 : 0.35;
  const tempLossPercent = Math.min(18, Math.max(2, deltaTemp * tempCoeffPercent));

  // Loss breakdown items
  const soilingLossPercent = 3.0; // Dust, pollen, rain cleaning cycle
  const inverterEfficiency = config.inverterEfficiencyPercent || 98.5;
  const inverterLossPercent = 100 - inverterEfficiency;
  const dcCablingLossPercent = 1.2;
  const mismatchLidLossPercent = 2.0; // Module mismatch & light-induced degradation
  const acTransformerLossPercent = 0.8;
  const shadingLossPercent = 1.2;

  // Performance Ratio (PR)
  const totalLossMultiplier =
    (1 - tempLossPercent / 100) *
    (1 - soilingLossPercent / 100) *
    (1 - inverterLossPercent / 100) *
    (1 - dcCablingLossPercent / 100) *
    (1 - mismatchLidLossPercent / 100) *
    (1 - acTransformerLossPercent / 100) *
    (1 - shadingLossPercent / 100);

  const performanceRatio = Math.round(totalLossMultiplier * 1000) / 10; // e.g. 81.6%

  // Specific Yield (kWh/kWp/año)
  const specificYieldKwhKwp = Math.round(annualPoaKwhM2 * (performanceRatio / 100));

  // Annual Generation (MWh/año)
  const annualGenerationMwh = Math.round((capacityKwp * specificYieldKwhKwp) / 1000);

  // Capacity Factor (%)
  const capacityFactorPercent =
    Math.round((annualGenerationMwh / (config.systemCapacityMw * 8760)) * 1000) / 10;

  // Sizing Ratios
  const moduleWattage = config.moduleWattageWp || 585;
  const moduleCount = Math.round((capacityKwp * 1000) / moduleWattage);
  const dcAcRatio = config.dcAcRatio || 1.25;
  const acCapacityKw = Math.round(capacityKwp / dcAcRatio);
  const inverterUnitKw = acCapacityKw >= 2000 ? 500 : 100;
  const inverterCount = Math.max(1, Math.round(acCapacityKw / inverterUnitKw));
  const groundCoverRatioPercent = isTracking ? 33 : 42;

  // Environmental impact
  const avoidedCo2TonsYear = Math.round(annualGenerationMwh * 0.42);
  const homesPowered = Math.round(annualGenerationMwh / 3.6);

  // Financial calculations
  const capexTotalUsd = Math.round(capacityKwp * 1000 * config.capexPerWpUsd);
  const grossAnnualRevenueUsd = Math.round(annualGenerationMwh * config.electricityPriceUsdMwh);
  const opexAnnualUsd = Math.round(capacityKwp * 12); // ~12 USD/kWp/year O&M
  const netAnnualRevenueUsd = Math.max(1000, grossAnnualRevenueUsd - opexAnnualUsd);

  // 25-Year Cash Flow Projection with 0.45% annual degradation and inverter replacement at year 13
  const degradationRate = (config.annualDegradationPercent || 0.45) / 100;
  const discountRate = (config.discountRatePercent || 7.5) / 100;
  const twentyFiveYearCashFlow: CashFlowYear[] = [];
  const cashFlowsForIrr: number[] = [-capexTotalUsd];

  let cumulativeCash = -capexTotalUsd;
  let discountedCumulativeCash = -capexTotalUsd;
  let simplePaybackYears = 25;
  let discountedPaybackYears = 25;
  let totalLifetimeGenMwh = 0;

  for (let year = 1; year <= 25; year++) {
    const degradationMultiplier = Math.pow(1 - degradationRate, year - 1);
    const genYearMwh = Math.round(annualGenerationMwh * degradationMultiplier);
    totalLifetimeGenMwh += genYearMwh;

    const revYearUsd = Math.round(genYearMwh * config.electricityPriceUsdMwh);
    let opexYearUsd = Math.round(opexAnnualUsd * Math.pow(1.02, year - 1)); // 2% inflation

    // Inverter repowering / replacement at Year 13 (~8% of initial CAPEX)
    if (year === 13) {
      opexYearUsd += Math.round(capexTotalUsd * 0.08);
    }

    const netCashYear = revYearUsd - opexYearUsd;
    cumulativeCash += netCashYear;

    const discountedNetCash = netCashYear / Math.pow(1 + discountRate, year);
    discountedCumulativeCash += discountedNetCash;

    if (cumulativeCash >= 0 && simplePaybackYears === 25) {
      const prevCash = cumulativeCash - netCashYear;
      simplePaybackYears = Math.round((year - 1 + Math.abs(prevCash) / netCashYear) * 10) / 10;
    }

    if (discountedCumulativeCash >= 0 && discountedPaybackYears === 25) {
      discountedPaybackYears = Math.round(year * 10) / 10;
    }

    twentyFiveYearCashFlow.push({
      year,
      generationMwh: genYearMwh,
      grossRevenueUsd: revYearUsd,
      opexUsd: opexYearUsd,
      netCashFlowUsd: netCashYear,
      cumulativeCashFlowUsd: cumulativeCash,
    });

    cashFlowsForIrr.push(netCashYear);
  }

  // IRR & NPV
  const irrPercent = calculateIRR(cashFlowsForIrr);
  const npvUsd = calculateNPV(discountRate, cashFlowsForIrr);

  // Levelized Cost of Electricity (LCOE)
  let lifetimeCostDiscounted = capexTotalUsd;
  let lifetimeGenDiscounted = 0;
  for (let y = 1; y <= 25; y++) {
    const gen = annualGenerationMwh * Math.pow(1 - degradationRate, y - 1);
    const opex = opexAnnualUsd * Math.pow(1.02, y - 1);
    lifetimeCostDiscounted += opex / Math.pow(1 + discountRate, y);
    lifetimeGenDiscounted += gen / Math.pow(1 + discountRate, y);
  }
  const lcoeUsdMwh = Math.round((lifetimeCostDiscounted / lifetimeGenDiscounted) * 10) / 10;

  // Monthly generation distribution
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthlyWeights = getMonthlyRadiationWeights(lat);
  const monthlyGenerationMwh = monthNames.map((month, idx) => {
    const weight = monthlyWeights[idx];
    const gen = Math.round((annualGenerationMwh / 12) * weight);
    const ghi = Math.round((annualGhiKwhM2 / 12) * weight);
    const poa = Math.round((annualPoaKwhM2 / 12) * weight);
    return { month, generationMwh: gen, ghiKwhM2: ghi, poaKwhM2: poa };
  });

  // Loss Waterfall (Cascada de Pérdidas de Energía - Estándar PVsyst / NREL SAM)
  const lossWaterfall: LossStep[] = [
    {
      id: 'ghi',
      name: 'Irradiación Global Horizontal (GHI)',
      category: 'irradiance',
      lossPercent: 0,
      valueKwhM2OrMwh: annualGhiKwhM2,
      description: 'Radiación solar incidente sobre superficie horizontal.',
    },
    {
      id: 'poa_gain',
      name: 'Ganancia por Inclinación y Seguimiento (Tilt/POA)',
      category: 'irradiance',
      lossPercent: -Math.round((poaFactor - 1) * 100),
      valueKwhM2OrMwh: Math.round(annualGhiKwhM2 * poaFactor),
      description: isTracking
        ? 'Ganancia por seguidor a un eje astronómico (+28%).'
        : `Ganancia geométrica por inclinación fija de ${config.tiltAngleDegrees}°.`,
    },
    {
      id: 'bifacial_gain',
      name: 'Ganancia Albedo Bifacial (Cara Posterior)',
      category: 'irradiance',
      lossPercent: -bifacialGainPercent,
      valueKwhM2OrMwh: annualPoaKwhM2,
      description: `Captación trasera por reflexión del suelo (Albedo: ${albedoFactor}).`,
    },
    {
      id: 'shading',
      name: 'Pérdidas por Sombras Lejanas y Horizonte',
      category: 'environmental',
      lossPercent: shadingLossPercent,
      valueKwhM2OrMwh: Math.round(annualPoaKwhM2 * (1 - shadingLossPercent / 100)),
      description: 'Obstrucción del relieve y ángulo de elevación solar bajo.',
    },
    {
      id: 'soiling',
      name: 'Ensuciamiento y Polvo (Soiling)',
      category: 'environmental',
      lossPercent: soilingLossPercent,
      valueKwhM2OrMwh: Math.round(annualPoaKwhM2 * (1 - (shadingLossPercent + soilingLossPercent) / 100)),
      description: 'Acumulación de partículas de polvo, polen y hollín.',
    },
    {
      id: 'temp',
      name: 'Pérdida Térmica de Celda (Tcell > 25°C)',
      category: 'thermal',
      lossPercent: Math.round(tempLossPercent * 10) / 10,
      valueKwhM2OrMwh: Math.round(annualPoaKwhM2 * (1 - (shadingLossPercent + soilingLossPercent + tempLossPercent) / 100)),
      description: `Temperatura media de celda en operación: ${averageCellTempC}°C (-${tempCoeffPercent}%/°C).`,
    },
    {
      id: 'mismatch',
      name: 'Desajuste de Módulos y LID (Mismatch)',
      category: 'electrical',
      lossPercent: mismatchLidLossPercent,
      valueKwhM2OrMwh: Math.round(capacityKwp * (annualPoaKwhM2 / 1000) * 0.88),
      description: 'Tolerancia de potencia de fábrica y degradación por luz.',
    },
    {
      id: 'dc_wiring',
      name: 'Pérdidas Óhmicas en Cableado DC',
      category: 'electrical',
      lossPercent: dcCablingLossPercent,
      valueKwhM2OrMwh: Math.round(capacityKwp * (annualPoaKwhM2 / 1000) * 0.86),
      description: 'Caída de tensión en strings de continua (1500V / 1000V).',
    },
    {
      id: 'inverter',
      name: 'Eficiencia de Conversión Inversor DC/AC',
      category: 'conversion',
      lossPercent: Math.round(inverterLossPercent * 10) / 10,
      valueKwhM2OrMwh: annualGenerationMwh,
      description: `Eficiencia ponderada del inversor central/string (${inverterEfficiency}%).`,
    },
  ];

  // Loss breakdown table
  const lossBreakdown = [
    {
      name: 'Pérdidas Térmicas por Temperatura',
      lossPercent: Math.round(tempLossPercent * 10) / 10,
      description: `Disminución por calentamiento de celda a ${averageCellTempC}°C en horas solares.`,
    },
    {
      name: 'Ensuciamiento y Polvo (Soiling)',
      lossPercent: soilingLossPercent,
      description: 'Capa superficial de partículas según clima y ciclos de lavado.',
    },
    {
      name: 'Inversor y Rendimiento DC/AC',
      lossPercent: Math.round(inverterLossPercent * 10) / 10,
      description: `Eficiencia de conversión de semiconductores de potencia (${inverterEfficiency}%).`,
    },
    {
      name: 'Cableado y Desajuste (Mismatch + DC/AC)',
      lossPercent: Math.round((dcCablingLossPercent + mismatchLidLossPercent + acTransformerLossPercent) * 10) / 10,
      description: 'Caída óhmica de tensión y tolerancia individual de celdas.',
    },
    {
      name: 'Sombras Lejanas y Horizonte',
      lossPercent: shadingLossPercent,
      description: 'Sombreado difuso por orografía periférica.',
    },
  ];

  // Overall Viability Score
  const resourceScore = Math.min(45, Math.max(10, ((annualGhiKwhM2 - 1000) / 1500) * 35 + 10));
  const tempScore = Math.min(20, Math.max(5, 20 - (tempLossPercent - 5) * 1.2));
  const cloudScore = Math.min(20, Math.max(5, 20 - (currentWeather.cloudCover || 20) * 0.15));
  const financeScore = Math.min(15, Math.max(2, (12 - simplePaybackYears) * 2 + 5));
  const viabilityScore = Math.min(99, Math.round(resourceScore + tempScore + cloudScore + financeScore));

  let viabilityGrade: EnergyProjections['viabilityGrade'] = 'Favorable';
  if (viabilityScore >= 85) viabilityGrade = 'Excelente';
  else if (viabilityScore >= 75) viabilityGrade = 'Muy Favorable';
  else if (viabilityScore >= 60) viabilityGrade = 'Favorable';
  else if (viabilityScore >= 45) viabilityGrade = 'Moderado';
  else viabilityGrade = 'Desfavorable';

  return {
    annualGhiKwhM2,
    annualDniKwhM2,
    annualPoaKwhM2,
    peakSunHoursDaily,
    albedoFactor,
    bifacialGainPercent,
    averageCellTempC,
    tempLossPercent: Math.round(tempLossPercent * 10) / 10,

    dcCapacityKwp: capacityKwp,
    acCapacityKw,
    dcAcRatio,
    moduleCount,
    inverterCount,
    groundCoverRatioPercent,

    annualGenerationMwh,
    specificYieldKwhKwp,
    performanceRatio,
    capacityFactorPercent,
    lifetimeGenerationMwh: Math.round(totalLifetimeGenMwh),
    avoidedCo2TonsYear,
    homesPowered,

    capexTotalUsd,
    annualRevenueUsd: grossAnnualRevenueUsd,
    opexAnnualUsd,
    simplePaybackYears,
    discountedPaybackYears,
    lcoeUsdMwh,
    irrPercent,
    npvUsd,
    twentyFiveYearCashFlow,

    viabilityScore,
    viabilityGrade,
    monthlyGenerationMwh,
    lossBreakdown,
    lossWaterfall,
  };
}
