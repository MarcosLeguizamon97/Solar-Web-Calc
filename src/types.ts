export interface LocationCoords {
  lat: number;
  lng: number;
  name: string;
  country?: string;
  region?: string;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  dni: number; // Direct Normal Irradiance (W/m²)
  ghi: number; // Global Horizontal Irradiance (W/m²)
  dhi: number; // Diffuse Horizontal Irradiance (W/m²)
  uvIndex: number;
  weatherCode: number;
  sunElevation: number; // in degrees
  sunAzimuth: number; // in degrees
}

export interface HourlyForecast {
  time: string[];
  ghi: number[];
  dni: number[];
  dhi: number[];
  temperature: number[];
  cloudCover: number[];
}

export interface DailyForecast {
  date: string[];
  ghiSumKwhM2: number[]; // Daily irradiation in kWh/m²
  peakSunHours: number[]; // Equivalent Horas Sol Pico
  maxTemp: number[];
  minTemp: number[];
  sunshineHours: number[];
}

export interface SolarSystemConfig {
  systemCapacityMw: number; // e.g. 5 MWp
  technology: 'monocrystalline_tracking' | 'monocrystalline_fixed' | 'bifacial_tracking' | 'thin_film';
  panelEfficiencyPercent: number; // e.g. 22.0%
  tiltAngleDegrees: number; // e.g. 25°
  azimuthDegrees: number; // 180° for North Hemisphere (faces South), 0° for South Hemisphere (faces North)
  inverterEfficiencyPercent: number; // e.g. 98.5%
  dcAcRatio: number; // e.g. 1.25
  groundHectares: number; // e.g. 10 ha
  electricityPriceUsdMwh: number; // e.g. $65 USD/MWh
  capexPerWpUsd: number; // e.g. $0.78 USD/Wp
  moduleWattageWp: number; // e.g. 585 Wp Tier-1
  discountRatePercent: number; // e.g. 7.5% WACC
  annualDegradationPercent: number; // e.g. 0.45%
}

export interface CashFlowYear {
  year: number;
  generationMwh: number;
  grossRevenueUsd: number;
  opexUsd: number;
  netCashFlowUsd: number;
  cumulativeCashFlowUsd: number;
}

export interface LossStep {
  id: string;
  name: string;
  category: 'irradiance' | 'environmental' | 'thermal' | 'electrical' | 'conversion';
  lossPercent: number;
  valueKwhM2OrMwh: number;
  description: string;
}

export interface EnergyProjections {
  // Solar Resource Metrics (Industry Standard)
  annualGhiKwhM2: number;
  annualDniKwhM2: number;
  annualPoaKwhM2: number; // Plane of Array / Global Tilted Irradiance
  peakSunHoursDaily: number;
  albedoFactor: number;
  bifacialGainPercent: number;
  averageCellTempC: number;
  tempLossPercent: number;

  // Electrical & Sizing Ratios
  dcCapacityKwp: number;
  acCapacityKw: number;
  dcAcRatio: number; // Inverter Loading Ratio (ILR)
  moduleCount: number;
  inverterCount: number;
  groundCoverRatioPercent: number;

  // Performance Metrics (IEC 61724 Standard)
  annualGenerationMwh: number;
  specificYieldKwhKwp: number; // kWh/kWp/año
  performanceRatio: number; // e.g. 81.5%
  capacityFactorPercent: number; // e.g. 24.2%
  lifetimeGenerationMwh: number; // 25 years with degradation
  avoidedCo2TonsYear: number;
  homesPowered: number;

  // Financial & Bankability Metrics
  capexTotalUsd: number;
  annualRevenueUsd: number;
  opexAnnualUsd: number;
  simplePaybackYears: number;
  discountedPaybackYears: number;
  lcoeUsdMwh: number;
  irrPercent: number; // Tasa Interna de Retorno (IRR)
  npvUsd: number; // Valor Actual Neto (NPV)
  twentyFiveYearCashFlow: CashFlowYear[];

  // Viability Scoring & Losses
  viabilityScore: number; // 0 - 100
  viabilityGrade: 'Excelente' | 'Muy Favorable' | 'Favorable' | 'Moderado' | 'Desfavorable';
  monthlyGenerationMwh: { month: string; generationMwh: number; ghiKwhM2: number; poaKwhM2: number }[];
  lossBreakdown: {
    name: string;
    lossPercent: number;
    description: string;
  }[];
  lossWaterfall: LossStep[];
}

export interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        reviewText: string;
        authorAttribution?: {
          displayName: string;
          uri?: string;
        };
      }[];
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GeminiAnalysisState {
  report: string | null;
  groundingChunks: GroundingChunk[];
  loading: boolean;
  error: string | null;
  timestamp?: string;
}
