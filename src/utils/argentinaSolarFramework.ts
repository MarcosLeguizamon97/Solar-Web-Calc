export interface ArgentinaProvinceInfo {
  id: string;
  name: string;
  shortName: string;
  region: 'NOA' | 'Cuyo' | 'Centro' | 'Buenos Aires / AMBA' | 'Patagonia' | 'NEA';
  capital: string;
  utility: string;
  utilityFullName: string;
  regulatoryLaw: string;
  adheredToNationalLaw27424: boolean;
  prosumerProgramName: string;
  taxExemptions: string;
  avgSpecificYieldKwhKwp: number; // kWh/kWp/year
  avgAnnualGhiKwhM2: number; // kWh/m²/year
  optimalTiltDegrees: number;
  industrialTariffUsdKwh: number;
  greenCreditLines: string[];
  keyLocalEpcs: string[];
  topSolarParks: string[];
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

export const ARGENTINA_PROVINCES: Record<string, ArgentinaProvinceInfo> = {
  santa_fe: {
    id: 'santa_fe',
    name: 'Santa Fe',
    shortName: 'Santa Fe',
    region: 'Centro',
    capital: 'Santa Fe de la Vera Cruz',
    utility: 'EPE',
    utilityFullName: 'Empresa Provincial de la Energía de Santa Fe',
    regulatoryLaw: 'Ley Provincial 14.259 (adherida a Ley Nacional 27.424)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Programa Prosumidores 2.0 / Balance Neto EPE',
    taxExemptions: 'Exención del 100% de Ingresos Brutos (IIBB) sobre la energía inyectada a la red',
    avgSpecificYieldKwhKwp: 1540,
    avgAnnualGhiKwhM2: 1820,
    optimalTiltDegrees: 31,
    industrialTariffUsdKwh: 0.095,
    greenCreditLines: [
      'Línea de Créditos Verdes - Banco de Santa Fe (Tasa subsidiada para eficiencia energética PyME)',
      'Línea CFI Santa Fe Sustentable (Consejo Federal de Inversiones)',
      'Crédito Fiscal FODIS / BICE Inversión Productiva Renovable',
    ],
    keyLocalEpcs: ['Renovar Energía', 'Arguay SRL', 'Solartik', 'Enertik', 'TexSolar (Tier-1 Supply)'],
    topSolarParks: ['Parque Solar San Lorenzo', 'Polo Industrial Alvear', 'Parque Solar Las Rosas'],
    bounds: { minLat: -34.4, maxLat: -28.0, minLng: -62.9, maxLng: -59.0 },
  },
  cordoba: {
    id: 'cordoba',
    name: 'Córdoba',
    shortName: 'Córdoba',
    region: 'Centro',
    capital: 'Córdoba Capital',
    utility: 'EPEC',
    utilityFullName: 'Empresa Provincial de Energía de Córdoba',
    regulatoryLaw: 'Ley Provincial 10.604 (Adhesión plena a Ley Nacional 27.424)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Régimen de Usuario-Generador EPEC (Medidor Bidireccional)',
    taxExemptions: 'Exención de Impuesto sobre los Ingresos Brutos y Sellos para generación distribuida renovable',
    avgSpecificYieldKwhKwp: 1680,
    avgAnnualGhiKwhM2: 1980,
    optimalTiltDegrees: 29,
    industrialTariffUsdKwh: 0.098,
    greenCreditLines: [
      'Bancor Línea Sustentable (Financiamiento para adquisición de paneles e inversores)',
      'Línea Verde BICE / Fondepro',
      'Créditos Banco Nación Reglamentación 750',
    ],
    keyLocalEpcs: ['Efergia Solar', 'Aldar', 'Generación Renovable Córdoba', 'Solis Argentina'],
    topSolarParks: ['Parque Solar Cura Brochero', 'Parque Solar Jovita', 'Parque Solar Arroyo Cabral'],
    bounds: { minLat: -35.0, maxLat: -29.5, minLng: -65.8, maxLng: -61.8 },
  },
  buenos_aires: {
    id: 'buenos_aires',
    name: 'Provincia de Buenos Aires',
    shortName: 'Buenos Aires',
    region: 'Buenos Aires / AMBA',
    capital: 'La Plata',
    utility: 'EDEN / EDES / EDEA / EDELAP',
    utilityFullName: 'Distribuidoras Provinciales (EDEN, EDES, EDEA, EDELAP) y Cooperativas Eléctricas',
    regulatoryLaw: 'Ley Provincial 15.325 (Marco Regulatorio de Generación Distribuida PBA)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Régimen de Fomento a la Generación Distribuida PBA (PROINGED)',
    taxExemptions: 'Exención de Impuesto Inmobiliario proporcional y alícuota 0% en IIBB sobre excedentes inyectados',
    avgSpecificYieldKwhKwp: 1460,
    avgAnnualGhiKwhM2: 1720,
    optimalTiltDegrees: 34,
    industrialTariffUsdKwh: 0.102,
    greenCreditLines: [
      'Provincia Microempresas / Banco Provincia Línea Renovable PyME',
      'BICE Transición Energética',
      'Certificado de Crédito Fiscal FODIS Nación',
    ],
    keyLocalEpcs: ['Hissuma Solar', 'Sur Energy', 'TexSolar', 'Weg Argentina', 'Energe Buenos Aires'],
    topSolarParks: ['Parque Solar Zárate', 'Parque Solar O’Higgins', 'Parque Solar Arribeños'],
    bounds: { minLat: -41.1, maxLat: -33.2, minLng: -63.4, maxLng: -56.6 },
  },
  caba_amba: {
    id: 'caba_amba',
    name: 'CABA y Gran Buenos Aires (AMBA)',
    shortName: 'AMBA (CABA/GBA)',
    region: 'Buenos Aires / AMBA',
    capital: 'Ciudad Autónoma de Buenos Aires',
    utility: 'Edenor / Edesur',
    utilityFullName: 'Empresas Distribuidoras del Área Metropolitana (Edenor / Edesur bajo órbita ENRE)',
    regulatoryLaw: 'Ley Nacional 27.424 (Régimen Nacional de Generación Distribuida)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Usuario-Generador ENRE / Certificado de Inyección a Red',
    taxExemptions: 'Beneficios impositivos nacionales de la Ley 27.424 (no computa ganancia gravada por inyección)',
    avgSpecificYieldKwhKwp: 1420,
    avgAnnualGhiKwhM2: 1680,
    optimalTiltDegrees: 32,
    industrialTariffUsdKwh: 0.088,
    greenCreditLines: [
      'Banco Ciudad Línea Verde para Comercios e Industrias',
      'Banco Nación Línea Eficiencia Energética',
      'FODIS Certificado de Crédito Fiscal',
    ],
    keyLocalEpcs: ['Aldar', 'Efergia', 'Sur Energy', 'Solis Argentina', 'Huawei FusionSolar Partner'],
    topSolarParks: ['Parque Solar Techo Metropolitano', 'Parques Industriales Pilar y Tortuguitas'],
    bounds: { minLat: -34.85, maxLat: -34.45, minLng: -58.65, maxLng: -58.3 },
  },
  san_juan: {
    id: 'san_juan',
    name: 'San Juan',
    shortName: 'San Juan',
    region: 'Cuyo',
    capital: 'San Juan',
    utility: 'Energía San Juan / EPSE',
    utilityFullName: 'Energía Provincial Sociedad del Estado (EPSE) y Energía San Juan SA',
    regulatoryLaw: 'Ley Provincial 1.884-A / Ley Nacional 27.424 (Pionera solar en Argentina)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Distribuida San Juan / Régimen Solar Andino',
    taxExemptions: 'Régimen de fomento provincial con desgravación impositiva y estabilidad fiscal',
    avgSpecificYieldKwhKwp: 2150,
    avgAnnualGhiKwhM2: 2450,
    optimalTiltDegrees: 28,
    industrialTariffUsdKwh: 0.092,
    greenCreditLines: [
      'Línea EPSE / Agencia San Juan Desarrollo de Inversiones',
      'Banco San Juan Créditos Verdes',
      'BICE Energías Renovables',
    ],
    keyLocalEpcs: ['EPSE Obras Fotovoltaicas', 'Energe Cuyo', 'Solartik San Juan', 'Argencuyo Solar'],
    topSolarParks: ['Parque Solar Ullum I, II, III y IV (300+ MW)', 'Parque Solar Tocota', 'Parque Solar Iglesia'],
    bounds: { minLat: -32.5, maxLat: -28.4, minLng: -70.5, maxLng: -66.8 },
  },
  mendoza: {
    id: 'mendoza',
    name: 'Mendoza',
    shortName: 'Mendoza',
    region: 'Cuyo',
    capital: 'Mendoza Capital',
    utility: 'EDEMSA / EPRE',
    utilityFullName: 'Empresa Distribuidora de Electricidad de Mendoza Sociedad Anónima (EDEMSA)',
    regulatoryLaw: 'Ley Provincial 9.084 (Adhesión a Ley Nacional 27.424 y marco EPRE Mendoza)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Usuario-Generador EPRE Mendoza (Net Billing)',
    taxExemptions: 'Bonificación en impuesto sobre los ingresos brutos provincial para autogeneradores',
    avgSpecificYieldKwhKwp: 1920,
    avgAnnualGhiKwhM2: 2210,
    optimalTiltDegrees: 30,
    industrialTariffUsdKwh: 0.094,
    greenCreditLines: [
      'Fondo para la Transformación y Crecimiento de Mendoza (FTyC)',
      'Banco del Sol / Banco Macro Línea Sustentable Bodegas y Agro',
      'BICE Eficiencia Hídrica y Solar',
    ],
    keyLocalEpcs: ['Energe SA', 'Solargro Mendoza', 'Agua y Sol Solar', 'EcoEnergía Cuyo'],
    topSolarParks: ['Parque Solar Pasip Palmira', 'Parque Solar Anchoris', 'Parque Solar Santa Rosa'],
    bounds: { minLat: -37.6, maxLat: -31.9, minLng: -70.6, maxLng: -66.5 },
  },
  jujuy: {
    id: 'jujuy',
    name: 'Jujuy',
    shortName: 'Jujuy',
    region: 'NOA',
    capital: 'San Salvador de Jujuy',
    utility: 'EJESA',
    utilityFullName: 'Empresa Jujeña de Energía Sociedad Anónima (EJESA)',
    regulatoryLaw: 'Ley Provincial 6.023 y Ley 27.424 (Puna Solar Hub)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Distribuida Jujuy Verde',
    taxExemptions: 'Exención de impuestos provinciales a la inversión fotovoltaica y parques solares',
    avgSpecificYieldKwhKwp: 2450,
    avgAnnualGhiKwhM2: 2680,
    optimalTiltDegrees: 22,
    industrialTariffUsdKwh: 0.096,
    greenCreditLines: [
      'JEMSE Líneas Especiales de Promoción Solar',
      'Banco Macro / Banco Nación Línea Puna',
      'Crédito Fiscal FODIS',
    ],
    keyLocalEpcs: ['Jujuy Energía Viva', 'Solar NOA', 'Enertik NOA', 'Efergia'],
    topSolarParks: ['Parque Solar Cauchari I, II y III (315 MWp a 4.020 msnm)', 'Parque Solar La Quiaca'],
    bounds: { minLat: -24.6, maxLat: -21.8, minLng: -67.2, maxLng: -64.2 },
  },
  salta: {
    id: 'salta',
    name: 'Salta',
    shortName: 'Salta',
    region: 'NOA',
    capital: 'Salta Capital',
    utility: 'EDESA',
    utilityFullName: 'Empresa Distribuidora de Electricidad de Salta (EDESA)',
    regulatoryLaw: 'Ley Provincial 7.824 (Balance Neto y Fomento Renovable)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Régimen de Balance Neto EDESA',
    taxExemptions: 'Deducciones fiscales provinciales para PyMEs vitivinícolas y agroindustriales',
    avgSpecificYieldKwhKwp: 2280,
    avgAnnualGhiKwhM2: 2520,
    optimalTiltDegrees: 24,
    industrialTariffUsdKwh: 0.095,
    greenCreditLines: [
      'Banco Macro Línea Calchaquí Renovable',
      'CFI Salta Energías Limpias',
      'BICE PyME Agroindustrial',
    ],
    keyLocalEpcs: ['Salta Solar', 'Sol del Valle Cafayate', 'Enertik Norte', 'TexSolar'],
    topSolarParks: ['Parque Solar Cafayate (100 MW)', 'Parque Solar San Carlos', 'Parque Solar Altiplano 200'],
    bounds: { minLat: -26.4, maxLat: -22.0, minLng: -68.6, maxLng: -62.3 },
  },
  catamarca: {
    id: 'catamarca',
    name: 'Catamarca',
    shortName: 'Catamarca',
    region: 'NOA',
    capital: 'San Fernando del Valle de Catamarca',
    utility: 'EC SAPEM',
    utilityFullName: 'Energía de Catamarca Sociedad Anónima con Participación Estatal Mayoritaria',
    regulatoryLaw: 'Ley Provincial de Fomento Solar y Ley Nacional 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Distribuida EC SAPEM',
    taxExemptions: 'Estabilidad fiscal provincial para proyectos de minería sustentable y agroindustria',
    avgSpecificYieldKwhKwp: 2220,
    avgAnnualGhiKwhM2: 2460,
    optimalTiltDegrees: 26,
    industrialTariffUsdKwh: 0.093,
    greenCreditLines: ['CFI Catamarca Minería y Solar', 'Banco Nación Línea Verde', 'FODIS'],
    keyLocalEpcs: ['Solar Catamarca', 'Energe NOA', 'Solartik Norte'],
    topSolarParks: ['Parque Solar Tinogasta I y II', 'Parque Solar Fiambalá', 'Parque Solar Saujil'],
    bounds: { minLat: -30.1, maxLat: -25.2, minLng: -69.1, maxLng: -64.9 },
  },
  la_rioja: {
    id: 'la_rioja',
    name: 'La Rioja',
    shortName: 'La Rioja',
    region: 'NOA',
    capital: 'La Rioja Capital',
    utility: 'EDELAR',
    utilityFullName: 'Empresa Distribuidora de Electricidad de La Rioja (EDELAR)',
    regulatoryLaw: 'Ley Provincial 9.818 y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Programa EDELAR Generación Limpia',
    taxExemptions: 'Incentivos fiscales provinciales para industrias radicadas en parques industriales',
    avgSpecificYieldKwhKwp: 2120,
    avgAnnualGhiKwhM2: 2350,
    optimalTiltDegrees: 27,
    industrialTariffUsdKwh: 0.092,
    greenCreditLines: ['Banco Rioja Línea Verde PyME', 'CFI La Rioja Sustentable', 'BICE'],
    keyLocalEpcs: ['Parque Eólico Arauco Solar Division', 'EDELAR Renovables', 'Solartik'],
    topSolarParks: ['Parque Solar Nonogasta (35 MW)', 'Parque Solar Chepes', 'Parque Solar Chamical'],
    bounds: { minLat: -31.9, maxLat: -27.8, minLng: -69.4, maxLng: -65.2 },
  },
  neuquen: {
    id: 'neuquen',
    name: 'Neuquén',
    shortName: 'Neuquén',
    region: 'Patagonia',
    capital: 'Neuquén Capital',
    utility: 'EPEN',
    utilityFullName: 'Ente Provincial de Energía del Neuquén (EPEN)',
    regulatoryLaw: 'Ley Provincial 3.006 y Ley Nacional 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Usuario-Generador EPEN (Vaca Muerta Renovable)',
    taxExemptions: 'Desgravación impositiva provincial para empresas de servicios y logística petrolera',
    avgSpecificYieldKwhKwp: 1560,
    avgAnnualGhiKwhM2: 1820,
    optimalTiltDegrees: 36,
    industrialTariffUsdKwh: 0.089,
    greenCreditLines: ['Banco Provincia del Neuquén (BPN) Crédito Verde', 'IADEP Neuquén', 'BICE'],
    keyLocalEpcs: ['Patagonia Solar', 'Energe Patagonia', 'Sur Energy Neuquén'],
    topSolarParks: ['Parque Solar El Alamito (Norte Neuquino)', 'Parques Solares Añelo'],
    bounds: { minLat: -41.1, maxLat: -36.0, minLng: -71.9, maxLng: -68.1 },
  },
  rio_negro: {
    id: 'rio_negro',
    name: 'Río Negro',
    shortName: 'Río Negro',
    region: 'Patagonia',
    capital: 'Viedma',
    utility: 'EdERSA / CEB',
    utilityFullName: 'Empresa de Energía Río Negro SA (EdERSA) y Coop. Eléctrica Bariloche',
    regulatoryLaw: 'Ley Provincial 5.234 y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Distribuida Río Negro Limpia',
    taxExemptions: 'Beneficios fiscales para fruticultura, bodegas y plantas de frío del Alto Valle',
    avgSpecificYieldKwhKwp: 1510,
    avgAnnualGhiKwhM2: 1780,
    optimalTiltDegrees: 38,
    industrialTariffUsdKwh: 0.091,
    greenCreditLines: ['Banco Patagonia Línea Frutícola Verde', 'CreAr Río Negro', 'CFI'],
    keyLocalEpcs: ['Valle Solar Cipolletti', 'Bariloche Energías Alternativas', 'EdERSA Solar'],
    topSolarParks: ['Parque Solar Sierra Grande', 'Parque Solar Cipolletti Alto Valle'],
    bounds: { minLat: -42.0, maxLat: -37.5, minLng: -71.8, maxLng: -62.8 },
  },
  chubut: {
    id: 'chubut',
    name: 'Chubut',
    shortName: 'Chubut',
    region: 'Patagonia',
    capital: 'Rawson',
    utility: 'DGSP / Cooperativas Eléctricas',
    utilityFullName: 'Dirección General de Servicios Públicos y Federación de Cooperativas de Chubut',
    regulatoryLaw: 'Ley Provincial XVII N° 95 y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Renovable Distribuida Chubut',
    taxExemptions: 'Incentivos provinciales para autogeneración en polos metalúrgicos y pesqueros',
    avgSpecificYieldKwhKwp: 1320,
    avgAnnualGhiKwhM2: 1540,
    optimalTiltDegrees: 42,
    industrialTariffUsdKwh: 0.094,
    greenCreditLines: ['Banco del Chubut Línea Sustentable', 'CFI Chubut', 'BICE'],
    keyLocalEpcs: ['Comodoro Solar', 'Viento y Sol Patagonia', 'Madryn Renovables'],
    topSolarParks: ['Microred Solar Gastre', 'Parque Solar Telsen'],
    bounds: { minLat: -46.0, maxLat: -42.0, minLng: -72.2, maxLng: -65.1 },
  },
  santa_cruz: {
    id: 'santa_cruz',
    name: 'Santa Cruz',
    shortName: 'Santa Cruz',
    region: 'Patagonia',
    capital: 'Río Gallegos',
    utility: 'SPSE',
    utilityFullName: 'Servicios Públicos Sociedad del Estado (SPSE)',
    regulatoryLaw: 'Ley Nacional 27.424 y normativa provincial SPSE',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Régimen de Autogeneración SPSE',
    taxExemptions: 'Exención de tasas locales de conexión para sistemas solares eólicos híbridos',
    avgSpecificYieldKwhKwp: 1150,
    avgAnnualGhiKwhM2: 1380,
    optimalTiltDegrees: 48,
    industrialTariffUsdKwh: 0.092,
    greenCreditLines: ['Banco Santa Cruz Línea Productiva', 'CFI Santa Cruz', 'FODIS'],
    keyLocalEpcs: ['Patagonia Austral Solar', 'Austral Renovables Gallegos'],
    topSolarParks: ['Sistema Híbrido Tres Cerros', 'Planta Solar Puerto Deseado'],
    bounds: { minLat: -52.4, maxLat: -46.0, minLng: -73.6, maxLng: -65.7 },
  },
  tierra_del_fuego: {
    id: 'tierra_del_fuego',
    name: 'Tierra del Fuego',
    shortName: 'Tierra del Fuego',
    region: 'Patagonia',
    capital: 'Ushuaia',
    utility: 'DPE / Coop. Ushuaia',
    utilityFullName: 'Dirección Provincial de Energía (DPE) y Cooperativa Eléctrica de Río Grande',
    regulatoryLaw: 'Ley Nacional 27.424 y Ley Provincial 19640 (Área Aduanera Especial)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Aislada y Distribuida Fueguina',
    taxExemptions: 'Régimen de Promoción Industrial Fueguino (Exención de IVA, Ganancias y Aranceles de Importación)',
    avgSpecificYieldKwhKwp: 1020,
    avgAnnualGhiKwhM2: 1220,
    optimalTiltDegrees: 52,
    industrialTariffUsdKwh: 0.086,
    greenCreditLines: ['Banco Tierra del Fuego Línea Industria Sostenible', 'CFI', 'BICE'],
    keyLocalEpcs: ['Fin del Mundo Solar', 'Electrónica Fueguina Renovables'],
    topSolarParks: ['Microred Híbrida San Sebastián', 'Sistema Solar Antártico Base Marambio'],
    bounds: { minLat: -55.2, maxLat: -52.6, minLng: -68.7, maxLng: -65.1 },
  },
  entre_rios: {
    id: 'entre_rios',
    name: 'Entre Ríos',
    shortName: 'Entre Ríos',
    region: 'Centro',
    capital: 'Paraná',
    utility: 'ENERSA',
    utilityFullName: 'Energía de Entre Ríos Sociedad Anónima (ENERSA)',
    regulatoryLaw: 'Ley Provincial 10.933 y Adhesión a Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Programa Mi Ciudad Sustentable / ENERSA Solar',
    taxExemptions: 'Alícuota reducida de Ingresos Brutos para proyectos de avicultura y arroz con solar',
    avgSpecificYieldKwhKwp: 1560,
    avgAnnualGhiKwhM2: 1840,
    optimalTiltDegrees: 31,
    industrialTariffUsdKwh: 0.097,
    greenCreditLines: ['Banco Entre Ríos Línea Verde Agro', 'CFI Entre Ríos', 'FODIS'],
    keyLocalEpcs: ['ENERSA Renovables', 'Litoral Solar', 'Renovar Energía Entre Ríos'],
    topSolarParks: ['Parque Solar Concordia', 'Parque Solar Federación'],
    bounds: { minLat: -34.1, maxLat: -30.1, minLng: -60.8, maxLng: -57.8 },
  },
  corrientes: {
    id: 'corrientes',
    name: 'Corrientes',
    shortName: 'Corrientes',
    region: 'NEA',
    capital: 'Corrientes Capital',
    utility: 'DPEC',
    utilityFullName: 'Dirección Provincial de Energía de Corrientes (DPEC)',
    regulatoryLaw: 'Ley Provincial 6.438 y Ley Nacional 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Régimen de Usuarios Generadores DPEC',
    taxExemptions: 'Promoción industrial provincial para aserraderos y plantas arroceras',
    avgSpecificYieldKwhKwp: 1640,
    avgAnnualGhiKwhM2: 1920,
    optimalTiltDegrees: 27,
    industrialTariffUsdKwh: 0.095,
    greenCreditLines: ['Banco de Corrientes Línea Forestal y Solar', 'CFI', 'BICE'],
    keyLocalEpcs: ['Corrientes Renovable', 'Enertik NEA', 'TexSolar Litoral'],
    topSolarParks: ['Parque Solar Bella Vista', 'Parque Solar Goya', 'Parque Solar Gobernador Virasoro'],
    bounds: { minLat: -30.8, maxLat: -27.2, minLng: -59.7, maxLng: -55.6 },
  },
  misiones: {
    id: 'misiones',
    name: 'Misiones',
    shortName: 'Misiones',
    region: 'NEA',
    capital: 'Posadas',
    utility: 'Energía de Misiones',
    utilityFullName: 'Energía de Misiones SA (ex EMSA)',
    regulatoryLaw: 'Ley Provincial XVI N° 124 y Ley Nacional 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Programa Misiones Solar / Balancete Neto',
    taxExemptions: 'Incentivos ecológicos por preservación de biomasa y reducción de huella de carbono',
    avgSpecificYieldKwhKwp: 1610,
    avgAnnualGhiKwhM2: 1890,
    optimalTiltDegrees: 26,
    industrialTariffUsdKwh: 0.096,
    greenCreditLines: ['Fondo de Crédito de Misiones Línea Sustentable', 'Banco Macro Misiones Verde', 'CFI'],
    keyLocalEpcs: ['Misiones Solar', 'Selva Solar Posadas', 'Energe NEA'],
    topSolarParks: ['Parque Solar Silicon Misiones (Posadas)', 'Parque Solar Itaembé Guazú', 'Parque Solar Urugua-í'],
    bounds: { minLat: -28.2, maxLat: -25.5, minLng: -56.1, maxLng: -53.6 },
  },
  chaco: {
    id: 'chaco',
    name: 'Chaco',
    shortName: 'Chaco',
    region: 'NEA',
    capital: 'Resistencia',
    utility: 'SECHEEP',
    utilityFullName: 'Servicio Energético del Chaco Empresa del Estado Provincial (SECHEEP)',
    regulatoryLaw: 'Ley Provincial 2.879-R y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Distribuida SECHEEP',
    taxExemptions: 'Exención de impuestos provinciales a la compra de equipos fotovoltaicos fabricados o ensamblados en el país',
    avgSpecificYieldKwhKwp: 1670,
    avgAnnualGhiKwhM2: 1950,
    optimalTiltDegrees: 26,
    industrialTariffUsdKwh: 0.094,
    greenCreditLines: ['Nuevo Banco del Chaco Línea Tu Empresa Renovable', 'CFI Chaco', 'BICE'],
    keyLocalEpcs: ['Chaco Solar', 'Norte Solar Resistencia', 'Enertik NEA'],
    topSolarParks: ['Parque Solar Presidencia de la Plaza', 'Parque Solar Villa Ángela', 'Parque Solar Juan José Castelli'],
    bounds: { minLat: -28.0, maxLat: -24.1, minLng: -63.4, maxLng: -58.3 },
  },
  formosa: {
    id: 'formosa',
    name: 'Formosa',
    shortName: 'Formosa',
    region: 'NEA',
    capital: 'Formosa Capital',
    utility: 'REFSA',
    utilityFullName: 'Recursos y Energía Formosa SA (REFSA)',
    regulatoryLaw: 'Ley Provincial de Energía Renovable y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'REFSA Solar Prosumidores',
    taxExemptions: 'Deducciones fiscales provinciales para industrias agroalimentarias y desmotadoras',
    avgSpecificYieldKwhKwp: 1690,
    avgAnnualGhiKwhM2: 1980,
    optimalTiltDegrees: 25,
    industrialTariffUsdKwh: 0.093,
    greenCreditLines: ['Banco Formosa Línea Verde', 'CFI Formosa', 'FODIS'],
    keyLocalEpcs: ['Formosa Solar', 'Enertik NEA', 'TexSolar Norte'],
    topSolarParks: ['Parque Solar Ingeniero Juárez', 'Parque Solar Las Lomitas'],
    bounds: { minLat: -26.9, maxLat: -22.5, minLng: -62.4, maxLng: -57.5 },
  },
  santiago_del_estero: {
    id: 'santiago_del_estero',
    name: 'Santiago del Estero',
    shortName: 'Santiago del Estero',
    region: 'NOA',
    capital: 'Santiago del Estero Capital',
    utility: 'EDESE',
    utilityFullName: 'Empresa Distribuidora de Electricidad de Santiago del Estero (EDESE)',
    regulatoryLaw: 'Ley Provincial 7.253 y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Renovable EDESE',
    taxExemptions: 'Promoción industrial provincial con alícuota cero en sellos e ingresos brutos',
    avgSpecificYieldKwhKwp: 1820,
    avgAnnualGhiKwhM2: 2110,
    optimalTiltDegrees: 28,
    industrialTariffUsdKwh: 0.093,
    greenCreditLines: ['Banco Santiago del Estero Línea Productiva', 'CFI', 'BICE'],
    keyLocalEpcs: ['Santiago Solar', 'Sol del Norte EDESE Partner'],
    topSolarParks: ['Parque Solar Ojo de Agua', 'Parque Solar La Banda', 'Parque Solar Frías'],
    bounds: { minLat: -30.0, maxLat: -25.6, minLng: -65.5, maxLng: -61.7 },
  },
  tucuman: {
    id: 'tucuman',
    name: 'Tucumán',
    shortName: 'Tucumán',
    region: 'NOA',
    capital: 'San Miguel de Tucumán',
    utility: 'EDET',
    utilityFullName: 'Empresa de Distribución Eléctrica de Tucumán (EDET)',
    regulatoryLaw: 'Ley Provincial 9.143 y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Régimen de Generación Distribuida EDET',
    taxExemptions: 'Beneficios provinciales para ingenios azucareros, citrícolas y frigoríficos',
    avgSpecificYieldKwhKwp: 1780,
    avgAnnualGhiKwhM2: 2040,
    optimalTiltDegrees: 27,
    industrialTariffUsdKwh: 0.095,
    greenCreditLines: ['CFI Tucumán Citrus & Solar', 'Banco Macro Línea Industrial', 'BICE'],
    keyLocalEpcs: ['Tucumán Solar', 'Energe NOA', 'Solartik Tucumán'],
    topSolarParks: ['Parque Solar Amaicha del Valle', 'Parque Solar Trancas'],
    bounds: { minLat: -28.0, maxLat: -26.0, minLng: -66.2, maxLng: -64.8 },
  },
  san_luis: {
    id: 'san_luis',
    name: 'San Luis',
    shortName: 'San Luis',
    region: 'Cuyo',
    capital: 'San Luis Capital',
    utility: 'EDESAL',
    utilityFullName: 'Empresa Distribuidora de Electricidad de San Luis (EDESAL)',
    regulatoryLaw: 'Ley Provincial IX-0857 y Ley 27.424',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'San Luis Energía Sustentable / EDESAL',
    taxExemptions: 'Régimen de Radicación Industrial y Exención de Tasas de Actividad Comercial',
    avgSpecificYieldKwhKwp: 1880,
    avgAnnualGhiKwhM2: 2180,
    optimalTiltDegrees: 31,
    industrialTariffUsdKwh: 0.093,
    greenCreditLines: ['Caja Social de San Luis', 'Banco Nación San Luis', 'BICE'],
    keyLocalEpcs: ['Puntana Solar', 'Energe Cuyo', 'Solartik'],
    topSolarParks: ['Parque Solar Terrazas del Portezuelo (1.4 MW)', 'Parque Solar La Cumbre (San Luis)'],
    bounds: { minLat: -36.0, maxLat: -31.8, minLng: -67.2, maxLng: -64.8 },
  },
  la_pampa: {
    id: 'la_pampa',
    name: 'La Pampa',
    shortName: 'La Pampa',
    region: 'Centro',
    capital: 'Santa Rosa',
    utility: 'APE / Cooperativas',
    utilityFullName: 'Administración Provincial de Energía (APE) y Federación Pampeana de Cooperativas',
    regulatoryLaw: 'Ley Provincial 3.285 (Régimen de Desarrollo Energético Pampeano)',
    adheredToNationalLaw27424: true,
    prosumerProgramName: 'Generación Distribuida Pampeana APE',
    taxExemptions: 'Alícuota 0% en Ingresos Brutos sobre inyección de energía y reducción de canon municipal',
    avgSpecificYieldKwhKwp: 1610,
    avgAnnualGhiKwhM2: 1880,
    optimalTiltDegrees: 35,
    industrialTariffUsdKwh: 0.096,
    greenCreditLines: ['Banco de La Pampa Línea Compre Pampeano Renovable', 'CFI La Pampa', 'FODIS'],
    keyLocalEpcs: ['Pampeana Solar', 'Cooperativa Santa Rosa Renovables', 'Efergia'],
    topSolarParks: ['Parque Solar Victorica', 'Parque Solar Caleufú', 'Parque Solar General Acha'],
    bounds: { minLat: -39.3, maxLat: -35.0, minLng: -68.3, maxLng: -63.4 },
  },
};

/**
 * Detects the Argentine province given coordinates and optional friendly name
 */
export function detectArgentinaProvince(
  lat: number,
  lng: number,
  locationName: string = ''
): ArgentinaProvinceInfo {
  const normalizedName = locationName.toLowerCase();

  // 1. Direct name matching
  for (const prov of Object.values(ARGENTINA_PROVINCES)) {
    if (
      normalizedName.includes(prov.name.toLowerCase()) ||
      normalizedName.includes(prov.shortName.toLowerCase()) ||
      normalizedName.includes(prov.capital.toLowerCase())
    ) {
      return prov;
    }
  }

  // Common city matches
  if (normalizedName.includes('rosario') || normalizedName.includes('gálvez') || normalizedName.includes('alvear') || normalizedName.includes('rafaela')) {
    return ARGENTINA_PROVINCES.santa_fe;
  }
  if (normalizedName.includes('caba') || normalizedName.includes('buenos aires') && (normalizedName.includes('capital') || normalizedName.includes('palermo') || normalizedName.includes('puerto madero') || normalizedName.includes('vicente lópez') || normalizedName.includes('san isidro') || normalizedName.includes('quilmes') || normalizedName.includes('avellaneda') || normalizedName.includes('morón') || normalizedName.includes('san martín'))) {
    return ARGENTINA_PROVINCES.caba_amba;
  }
  if (normalizedName.includes('córdoba') || normalizedName.includes('cordoba') || normalizedName.includes('carlos paz') || normalizedName.includes('río cuarto') || normalizedName.includes('villa maría')) {
    return ARGENTINA_PROVINCES.cordoba;
  }
  if (normalizedName.includes('mendoza') || normalizedName.includes('godoy cruz') || normalizedName.includes('luján de cuyo') || normalizedName.includes('san rafael') || normalizedName.includes('maipú')) {
    return ARGENTINA_PROVINCES.mendoza;
  }
  if (normalizedName.includes('san juan') || normalizedName.includes('ullum') || normalizedName.includes('caucete') || normalizedName.includes('jáchal')) {
    return ARGENTINA_PROVINCES.san_juan;
  }
  if (normalizedName.includes('jujuy') || normalizedName.includes('cauchari') || normalizedName.includes('humahuaca') || normalizedName.includes('tilcara') || normalizedName.includes('palpalá')) {
    return ARGENTINA_PROVINCES.jujuy;
  }
  if (normalizedName.includes('salta') || normalizedName.includes('cafayate') || normalizedName.includes('orán') || normalizedName.includes('tartagal')) {
    return ARGENTINA_PROVINCES.salta;
  }
  if (normalizedName.includes('neuquén') || normalizedName.includes('neuquen') || normalizedName.includes('añelo') || normalizedName.includes('zapala') || normalizedName.includes('san martín de los andes')) {
    return ARGENTINA_PROVINCES.neuquen;
  }
  if (normalizedName.includes('bariloche') || normalizedName.includes('cipolletti') || normalizedName.includes('general roca') || normalizedName.includes('viedma')) {
    return ARGENTINA_PROVINCES.rio_negro;
  }
  if (normalizedName.includes('ushuaia') || normalizedName.includes('río grande') || normalizedName.includes('tierra del fuego')) {
    return ARGENTINA_PROVINCES.tierra_del_fuego;
  }
  if (normalizedName.includes('mar del plata') || normalizedName.includes('bahía blanca') || normalizedName.includes('la plata') || normalizedName.includes('tandil') || normalizedName.includes('pergamino') || normalizedName.includes('olavarría') || normalizedName.includes('pilar') || normalizedName.includes('campana') || normalizedName.includes('zárate')) {
    return ARGENTINA_PROVINCES.buenos_aires;
  }

  // 2. Bounding box geographic matching
  // Check CABA/AMBA tight box first
  const amba = ARGENTINA_PROVINCES.caba_amba.bounds;
  if (lat >= amba.minLat && lat <= amba.maxLat && lng >= amba.minLng && lng <= amba.maxLng) {
    return ARGENTINA_PROVINCES.caba_amba;
  }

  for (const prov of Object.values(ARGENTINA_PROVINCES)) {
    const b = prov.bounds;
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return prov;
    }
  }

  // Default fallback if somewhere in Argentina
  if (lat >= -56 && lat <= -21 && lng >= -74 && lng <= -53) {
    if (lat < -42) return ARGENTINA_PROVINCES.chubut;
    if (lat < -35) return ARGENTINA_PROVINCES.buenos_aires;
    if (lng < -67) return ARGENTINA_PROVINCES.san_juan;
    if (lat > -28) return ARGENTINA_PROVINCES.salta;
    return ARGENTINA_PROVINCES.santa_fe;
  }

  // Default to Santa Fe (Gran Rosario) baseline
  return ARGENTINA_PROVINCES.santa_fe;
}
