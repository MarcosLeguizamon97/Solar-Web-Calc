import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { EnergyProjections, LocationCoords, SolarSystemConfig } from '../types';
import {
  ARGENTINA_REGULATORY_DISCLAIMER,
  ArgentinaProvinceInfo,
  DistributedGenModality,
  classifyArgentinaSolarProject,
  detectArgentinaProvince,
} from './argentinaSolarFramework';
import {
  formatCapacityMw,
  formatCoord,
  formatCurrency,
  formatHectares,
  formatNumber,
  formatPercent,
} from './formatters';

export type ParticipationVehicle = 'fideicomiso' | 'spv' | 'comunitario' | 'autoconsumo';

export interface ExecutiveReportMetadata {
  projectName: string;
  evaluatorName: string;
  investorEntity: string;
  participationVehicle: ParticipationVehicle;
  equityFractionPercent: number; // e.g., 25 = 25% fractional stake
  futureExpansionMw: number; // e.g., 2.0 MWp scalability horizon
  modality: DistributedGenModality;
  contractedPowerKw?: number;
  notes?: string;
}

export interface SolarCalcOverrideSummary {
  province: ArgentinaProvinceInfo;
  roofAreaM2: number;
  monthlyConsumptionKwh: number;
  recommendedKwp: number;
  acCoupleKw: number;
  annualGenKwh: number;
  capexUsd: number;
  annualSavingsUsd: number;
  paybackYears: string;
  coveragePercent: number;
  includeBess: boolean;
  roofType: string;
}

export interface ExecutiveReportInput {
  location: LocationCoords;
  config: SolarSystemConfig;
  projections: EnergyProjections;
  metadata: ExecutiveReportMetadata;
  solarCalcOverride?: SolarCalcOverrideSummary;
  aiAuditReport?: string | null;
}

const VEHICLE_LABELS: Record<ParticipationVehicle, { title: string; legalStructure: string; summary: string }> = {
  fideicomiso: {
    title: 'Fideicomiso de Administración e Inversión Solar',
    legalStructure: 'Fideicomiso Privado / Financiero de Generación Renovable (Ley 24.441 / CCCN)',
    summary:
      'Los socios aportan capital contra Certificados de Participación o Cuotapartes fiduciarias. El fiduciario administra el flujo de ingresos (ahorro/inyección/PPA), distribuye excedentes proporcionales a la tenencia y habilita rondas sucesivas de ampliación de potencia sin disolver el vehículo.',
  },
  spv: {
    title: 'Sociedad Vehículo de Propósito Especial (SPV / S.A.S. / S.A.)',
    legalStructure: 'Vehículo Societario de Propósito Único para Parque Solar y Contratos MATER / PPA',
    summary:
      'Participación mediante paquete accionario ordinario o preferido en una sociedad titular exclusiva de los activos de generación, permisos de interconexión (PAC/CAMMESA) y contratos de venta de energía a largo plazo, facilitando financiamiento Project Finance y entrada de nuevos socios.',
  },
  comunitario: {
    title: 'Consorcio de Generación Distribuida Comunitaria',
    legalStructure: 'Esquema Usuario-Generador Comunitario / Comunitario Virtual (Ley 27.424 y Res. SE 287/2025)',
    summary:
      'Dos o más usuarios titulares de suministros eléctricos dentro de la misma distribuidora co-invierten en una planta común y reciben acreditación proporcional de energía inyectada en sus respectivas facturas bajo el régimen de Facturación Neta (Net Billing).',
  },
  autoconsumo: {
    title: 'Inversión Directa en Activo Fijo para Autoconsumo Productivo',
    legalStructure: 'Balance Propio Corporativo / Industrial On-Grid con Inyección de Excedentes',
    summary:
      'La empresa incorpora la planta solar como activo productivo propio dentro de su predio fabril o comercial, reduciendo costos operativos eléctricos desde el mes 1, monetizando excedentes en red y manteniendo la opción de escalamiento modular por etapas.',
  },
};

const TECHNOLOGY_LABELS: Record<SolarSystemConfig['technology'], string> = {
  monocrystalline_tracking: 'Monocristalino Bifacial + Seguidor a 1 Eje (Tracker)',
  monocrystalline_fixed: 'Monocristalino en Estructura Fija (Inclinación Óptima)',
  bifacial_tracking: 'Bifacial Alta Ganancia Albedo + Seguidor a 1 Eje',
  thin_film: 'Capa Fina CdTe (Baja Pérdida Térmica)',
};

const MODALITY_LABELS: Record<DistributedGenModality, string> = {
  individual: 'Individual (1 punto de suministro)',
  comunitario: 'Comunitario (múltiples suministros asociados)',
  comunitario_virtual: 'Comunitario Virtual (telemetría inteligente en tiempo real)',
};

function slugifyFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'informe-solar-heliosite';
}

function getCurrentArgentineDate(): string {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function pdfSafeText(text: string): string {
  return (text || '')
    .replace(/₂/g, '2')
    .replace(/²/g, '2')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[•●▪]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .trim();
}

function resolveReportMetrics(input: ExecutiveReportInput) {
  const { location, config, projections, metadata, solarCalcOverride } = input;
  const detectedProvince =
    solarCalcOverride?.province ||
    detectArgentinaProvince(location.lat, location.lng, `${location.name} ${location.region || ''}`);

  const isTracker =
    config.technology === 'monocrystalline_tracking' || config.technology === 'bifacial_tracking';
  const haRatio = isTracker ? 1.6 : 1.4;

  const dcCapacityKwp = solarCalcOverride ? solarCalcOverride.recommendedKwp : projections.dcCapacityKwp;
  const capacityMw = Math.round((dcCapacityKwp / 1000) * 1000) / 1000;
  const acCapacityKw = solarCalcOverride ? solarCalcOverride.acCoupleKw : projections.acCapacityKw;
  const annualGenerationMwh = solarCalcOverride
    ? Math.round((solarCalcOverride.annualGenKwh / 1000) * 10) / 10
    : projections.annualGenerationMwh;
  const annualGenerationKwh = solarCalcOverride
    ? solarCalcOverride.annualGenKwh
    : Math.round(projections.annualGenerationMwh * 1000);
  const capexTotalUsd = solarCalcOverride ? solarCalcOverride.capexUsd : projections.capexTotalUsd;
  const annualBenefitUsd = solarCalcOverride
    ? solarCalcOverride.annualSavingsUsd
    : projections.annualRevenueUsd;
  const paybackDisplay = solarCalcOverride
    ? `${solarCalcOverride.paybackYears} años`
    : `${formatNumber(projections.simplePaybackYears, 1)} años`;
  const areaDisplay = solarCalcOverride
    ? `${formatNumber(solarCalcOverride.recommendedKwp * 6)} m² (${formatNumber((solarCalcOverride.recommendedKwp * 6) / 10000, 2)} ha)`
    : `${formatHectares(Math.round(config.systemCapacityMw * haRatio * 10) / 10)} (~${formatNumber(haRatio, 1)} ha/MWp)`;

  const regulatory = classifyArgentinaSolarProject(
    acCapacityKw,
    dcCapacityKwp,
    metadata.modality,
    metadata.contractedPowerKw
  );

  // Fractional Equity / Investment Vehicle Calculations
  const fraction = Math.min(100, Math.max(1, metadata.equityFractionPercent)) / 100;
  const partnerCapexUsd = Math.round(capexTotalUsd * fraction);
  const partnerDcKwp = Math.round(dcCapacityKwp * fraction * 10) / 10;
  const partnerAcKw = Math.round(acCapacityKw * fraction * 10) / 10;
  const partnerAnnualKwh = Math.round(annualGenerationKwh * fraction);
  const partnerAnnualMwh = Math.round(annualGenerationMwh * fraction * 10) / 10;
  const partnerAnnualBenefitUsd = Math.round(annualBenefitUsd * fraction);
  const partnerNetYear1Usd = Math.round((annualBenefitUsd - projections.opexAnnualUsd) * fraction);
  const total25YrNetCash = projections.twentyFiveYearCashFlow.reduce((acc, r) => acc + r.netCashFlowUsd, 0);
  const partner25YrEstimatedReturnUsd = solarCalcOverride
    ? Math.round(annualBenefitUsd * 22 * fraction)
    : Math.round(total25YrNetCash * fraction);

  // Expansion Scenario Calculations
  const expansionMw = Math.max(capacityMw, metadata.futureExpansionMw || capacityMw * 2);
  const expansionScaleFactor = capacityMw > 0 ? expansionMw / capacityMw : 1;
  const expansionCapexUsd = Math.round(capexTotalUsd * expansionScaleFactor * 0.94); // 6% scale economy
  const expansionAnnualMwh = Math.round(annualGenerationMwh * expansionScaleFactor * 10) / 10;
  const expansionAnnualBenefitUsd = Math.round(annualBenefitUsd * expansionScaleFactor);
  const expansionRegulatory = classifyArgentinaSolarProject(
    (expansionMw * 1000) / (config.dcAcRatio || 1.25),
    expansionMw * 1000,
    metadata.modality
  );

  return {
    detectedProvince,
    isTracker,
    haRatio,
    dcCapacityKwp,
    capacityMw,
    acCapacityKw,
    annualGenerationMwh,
    annualGenerationKwh,
    capexTotalUsd,
    annualBenefitUsd,
    paybackDisplay,
    areaDisplay,
    regulatory,
    fraction,
    partnerCapexUsd,
    partnerDcKwp,
    partnerAcKw,
    partnerAnnualKwh,
    partnerAnnualMwh,
    partnerAnnualBenefitUsd,
    partnerNetYear1Usd,
    partner25YrEstimatedReturnUsd,
    expansionMw,
    expansionCapexUsd,
    expansionAnnualMwh,
    expansionAnnualBenefitUsd,
    expansionRegulatory,
    vehicleInfo: VEHICLE_LABELS[metadata.participationVehicle],
    dateStr: getCurrentArgentineDate(),
  };
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Generates and downloads a multi-page Corporate Executive PDF Report using jsPDF + jspdf-autotable.
 * Color palette: Corporate Navy (#0F2744), Dark Slate (#1E293B), Energy Green (#059669).
 */
export async function exportExecutivePdf(input: ExecutiveReportInput): Promise<void> {
  const { location, config, projections, metadata, solarCalcOverride, aiAuditReport } = input;
  const m = resolveReportMetrics(input);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const NAVY: [number, number, number] = [15, 39, 68];
  const DARK_GRAY: [number, number, number] = [30, 41, 59];
  const MUTED_GRAY: [number, number, number] = [100, 116, 139];
  const LIGHT_BG: [number, number, number] = [248, 250, 252];
  const BORDER_GRAY: [number, number, number] = [203, 213, 225];
  const ENERGY_GREEN: [number, number, number] = [5, 150, 105];
  const GREEN_TINT: [number, number, number] = [236, 253, 245];

  const drawSectionHeading = (num: string, title: string, yPos: number): number => {
    doc.setFillColor(...NAVY);
    doc.rect(margin, yPos, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(pdfSafeText(`${num}. ${title}`), margin + 6, yPos + 5.2);
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 9, pageWidth - margin, yPos + 9);
    return yPos + 13;
  };

  // =========================================================================
  // PAGE 1: CORPORATE COVER & EXECUTIVE SUMMARY
  // =========================================================================
  // Top corporate navy header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 64, 'F');
  doc.setFillColor(...ENERGY_GREEN);
  doc.rect(0, 64, pageWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208); // soft emerald
  doc.text('MEMORIA EJECUTIVA DE VIABILIDAD SOLAR Y ESTRUCTURACION SOCIETARIA', margin, 17);

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(
    pdfSafeText(metadata.projectName || `Parque Solar Fotovoltaico - ${location.name}`),
    contentWidth
  );
  doc.text(titleLines, margin, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(
    pdfSafeText(
      `${location.name} (${formatCoord(location.lat)}°, ${formatCoord(location.lng)}°)  |  Emision: ${m.dateStr}`
    ),
    margin,
    53
  );

  // Project Stakeholders & Classification Card
  let y = 74;
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED_GRAY);
  doc.text('INVERSOR / CONSORCIO DESTINATARIO', margin + 5, y + 7);
  doc.text('EVALUADOR / CONSULTOR RESPONSABLE', margin + contentWidth * 0.52, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK_GRAY);
  doc.text(pdfSafeText(metadata.investorEntity || 'Inversores / Socios Estrategicos'), margin + 5, y + 13);
  doc.text(pdfSafeText(metadata.evaluatorName || 'Ingenieria Heliosite Solar'), margin + contentWidth * 0.52, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED_GRAY);
  doc.text('VEHICULO DE PARTICIPACION PROPUESTO', margin + 5, y + 22);
  doc.text('ENCUADRE REGULATORIO ARGENTINA (2025/2026)', margin + contentWidth * 0.52, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(pdfSafeText(m.vehicleInfo.title), margin + 5, y + 28);
  doc.setTextColor(...ENERGY_GREEN);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfSafeText(`${m.regulatory.categoryCode} - ${m.regulatory.powerRangeLabel}`), margin + contentWidth * 0.52, y + 28);

  // Viability Score Banner
  y += 41;
  doc.setFillColor(...GREEN_TINT);
  doc.setDrawColor(...ENERGY_GREEN);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(
    pdfSafeText(
      `INDICE DE VIABILIDAD TECNICA Y FINANCIERA: ${projections.viabilityScore} / 100 (${projections.viabilityGrade.toUpperCase()})`
    ),
    margin + 5,
    y + 7
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK_GRAY);
  doc.text(
    pdfSafeText(
      `Estandar IEC 61724 | Performance Ratio: ${formatPercent(projections.performanceRatio)} | Rendimiento Especifico: ${formatNumber(projections.specificYieldKwhKwp)} kWh/kWp/ano`
    ),
    margin + 5,
    y + 12.5
  );

  // 6-Card Executive KPI Grid
  y += 23;
  const kpiCards = [
    {
      label: 'POTENCIA INSTALADA',
      value: `${formatNumber(m.dcCapacityKwp)} kWp DC`,
      sub: `${formatCapacityMw(m.capacityMw)} | Acople: ${formatNumber(m.acCapacityKw, 1)} kW AC`,
    },
    {
      label: 'GENERACION ANUAL ESTIMADA',
      value: `${formatNumber(m.annualGenerationKwh)} kWh`,
      sub: `${formatNumber(m.annualGenerationMwh, 1)} MWh/ano | CF ${formatPercent(projections.capacityFactorPercent)}`,
    },
    {
      label: 'INVERSION INICIAL (CAPEX)',
      value: `USD ${formatNumber(m.capexTotalUsd)}`,
      sub: `Ref: ${formatCurrency(m.capexTotalUsd / Math.max(1, m.dcCapacityKwp), 0)} USD/kWp llave en mano`,
    },
    {
      label: 'INGRESO / AHORRO ANUAL',
      value: `USD ${formatNumber(m.annualBenefitUsd)}`,
      sub: solarCalcOverride
        ? `Cubre ${solarCalcOverride.coveragePercent}% demanda (${m.detectedProvince.utility})`
        : `LCOE: $${formatNumber(projections.lcoeUsdMwh, 1)} USD/MWh`,
    },
    {
      label: 'RETORNO Y RENTABILIDAD',
      value: m.paybackDisplay,
      sub: `TIR Proyecto: ${formatPercent(projections.irrPercent)} | Vida util 25-30 anos`,
    },
    {
      label: 'SUPERFICIE Y PARTICIPACION',
      value: pdfSafeText(m.areaDisplay.split('(')[0].trim()),
      sub: `Cuotaparte evaluada: ${formatPercent(metadata.equityFractionPercent)} (USD ${formatNumber(m.partnerCapexUsd)})`,
    },
  ];

  const cardW = (contentWidth - 8) / 3;
  const cardH = 22;
  kpiCards.forEach((card, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cx = margin + col * (cardW + 4);
    const cy = y + row * (cardH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_GRAY);
    doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFillColor(...NAVY);
    doc.rect(cx, cy, cardW, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED_GRAY);
    doc.text(card.label, cx + 3.5, cy + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(pdfSafeText(card.value), cx + 3.5, cy + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...ENERGY_GREEN);
    doc.text(pdfSafeText(card.sub), cx + 3.5, cy + 18.5);
  });

  // Executive Summary Paragraph
  y += 56;
  y = drawSectionHeading('1', 'Resumen Ejecutivo de la Oportunidad Solar', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK_GRAY);
  const execSummaryText = pdfSafeText(
    `El presente memorando tecnico-economico evalua la factibilidad de implantacion y estructuracion societaria del proyecto "${metadata.projectName || location.name}", ubicado en ${location.name} (${m.detectedProvince.name}, distribuidora ${m.detectedProvince.utility}). Con una irradiacion global horizontal (GHI) anual de ${formatNumber(projections.annualGhiKwhM2)} kWh/m2 y una capacidad proyectada de ${formatNumber(m.dcCapacityKwp)} kWp DC (${formatNumber(m.acCapacityKw, 1)} kW AC), la central generara aproximadamente ${formatNumber(m.annualGenerationKwh)} kWh/ano (${formatNumber(m.annualGenerationMwh, 1)} MWh/ano) con un Performance Ratio del ${formatPercent(projections.performanceRatio)} y un recupero simple estimado en ${m.paybackDisplay}.\n\nDesde el punto de vista normativo, el activo se encuadra como ${m.regulatory.categoryName} bajo ${m.regulatory.applicableFramework}. Para viabilizar la incorporacion de inversores o socios bajo el modelo "${m.vehicleInfo.title}", se modela una participacion inicial de ${formatPercent(metadata.equityFractionPercent)} equivalente a un aporte de capital estimado de USD ${formatNumber(m.partnerCapexUsd)}, con opcion de escalamiento modular hasta ${formatCapacityMw(m.expansionMw)}.`
  );
  const summaryLines = doc.splitTextToSize(execSummaryText, contentWidth);
  doc.text(summaryLines, margin, y);

  // =========================================================================
  // PAGE 2: TECHNICAL PARAMETERS, ENERGY PRODUCTION & 12-MONTH CURVE
  // =========================================================================
  doc.addPage();
  y = 22;
  y = drawSectionHeading('2', 'Parametros Tecnicos de Entrada y Dimensionamiento', y);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { textColor: DARK_GRAY, fontSize: 8.2, cellPadding: 2.3 },
    alternateRowStyles: { fillColor: LIGHT_BG },
    head: [['Parametro de Diseno / Emplazamiento', 'Valor Configurado / Calculado', 'Referencia de Ingenieria']],
    body: [
      ['Ubicacion Geografica', pdfSafeText(location.name), pdfSafeText(`Lat ${formatCoord(location.lat)}° / Lng ${formatCoord(location.lng)}°`)],
      ['Jurisdiccion y Distribuidora', pdfSafeText(`${m.detectedProvince.name} (${m.detectedProvince.utility})`), pdfSafeText(m.detectedProvince.regulatoryLaw)],
      ['Potencia Pico Instalada (DC)', `${formatNumber(m.dcCapacityKwp)} kWp (${formatCapacityMw(m.capacityMw)})`, `${formatNumber(Math.round(m.dcCapacityKwp * 1000 / (config.moduleWattageWp || 585)))} modulos Tier-1 (${config.moduleWattageWp || 585} Wp)`],
      ['Potencia de Acople Inversor (AC)', `${formatNumber(m.acCapacityKw, 1)} kW AC`, `Relacion DC/AC (ILR): ${formatNumber(projections.dcAcRatio, 2)}x | Eficiencia inv. ${formatPercent(config.inverterEfficiencyPercent)}`],
      ['Superficie Requerida Estimada', pdfSafeText(m.areaDisplay), pdfSafeText(solarCalcOverride ? `Cubierta: ${solarCalcOverride.roofType}` : `Factor de ocupacion (GCR): ${formatPercent(projections.groundCoverRatioPercent)}`)],
      ['Tecnologia Fotovoltaica', pdfSafeText(TECHNOLOGY_LABELS[config.technology]), `Inclinacion: ${config.tiltAngleDegrees}° | Azimut: ${config.azimuthDegrees}°`],
      ['Recurso Solar (GHI / POA)', `${formatNumber(projections.annualGhiKwhM2)} / ${formatNumber(projections.annualPoaKwhM2)} kWh/m2/ano`, `HSP promedio diario: ${formatNumber(projections.peakSunHoursDaily, 2)} h/dia`],
      ['Degradacion y Tasa WACC', `${formatPercent(config.annualDegradationPercent || 0.45, 2)} anual`, `WACC / Descuento financiero: ${formatPercent(config.discountRatePercent || 7.5)}`],
    ],
  });

  y = ((doc as any).lastAutoTable?.finalY || y + 60) + 9;
  y = drawSectionHeading('3', 'Analisis de Viabilidad, Produccion Energetica y Curva Mensual', y);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: ENERGY_GREEN, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { textColor: DARK_GRAY, fontSize: 8.2, cellPadding: 2.3 },
    alternateRowStyles: { fillColor: LIGHT_BG },
    head: [['Indicador de Desempeno (IEC 61724)', 'Resultado Proyectado', 'Interpretacion Financiera y Ambiental']],
    body: [
      ['Produccion Anual Ano 1', `${formatNumber(m.annualGenerationKwh)} kWh (${formatNumber(m.annualGenerationMwh, 1)} MWh)`, `Equivalente a ~${formatNumber(projections.homesPowered)} hogares abastecidos`],
      ['Rendimiento Especifico (Specific Yield)', `${formatNumber(projections.specificYieldKwhKwp)} kWh/kWp/ano`, `Productividad unitaria neta por kWp instalado`],
      ['Performance Ratio (PR) y Factor de Planta', `PR ${formatPercent(projections.performanceRatio)}  |  CF ${formatPercent(projections.capacityFactorPercent)}`, `Temp. media celda: ${formatNumber(projections.averageCellTempC, 1)}°C (perdida termica -${formatPercent(projections.tempLossPercent)})`],
      ['Generacion Acumulada (25 Anos)', `${formatNumber(projections.lifetimeGenerationMwh)} MWh`, `CO2 evitado: ${formatNumber(projections.avoidedCo2TonsYear)} toneladas/ano`],
      ['LCOE (Costo Nivelado de Energia)', `$${formatNumber(projections.lcoeUsdMwh, 1)} USD/MWh`, `Tarifa electrica de referencia: $${formatNumber(config.electricityPriceUsdMwh)} USD/MWh`],
    ],
  });

  // Draw crisp Vector Monthly Bar Chart directly on PDF
  y = ((doc as any).lastAutoTable?.finalY || y + 45) + 8;
  const monthly = projections.monthlyGenerationMwh || [];
  if (monthly.length > 0 && y + 52 < pageHeight - 16) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text('Perfil de Generacion Mensual Proyectada (MWh/mes)', margin, y);

    const chartX = margin;
    const chartY = y + 4;
    const chartW = contentWidth;
    const chartH = 38;

    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_GRAY);
    doc.roundedRect(chartX, chartY, chartW, chartH, 1.5, 1.5, 'FD');

    const maxMwh = Math.max(1, ...monthly.map((item) => item.generationMwh));
    const slotW = (chartW - 10) / monthly.length;
    const barW = Math.min(9, slotW * 0.62);

    monthly.forEach((item, i) => {
      const barH = Math.max(2, (item.generationMwh / maxMwh) * (chartH - 15));
      const bx = chartX + 5 + i * slotW + (slotW - barW) / 2;
      const by = chartY + chartH - 7 - barH;

      doc.setFillColor(...(i % 2 === 0 ? NAVY : ENERGY_GREEN));
      doc.rect(bx, by, barW, barH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...DARK_GRAY);
      doc.text(formatNumber(Math.round(item.generationMwh)), bx + barW / 2, by - 1.2, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED_GRAY);
      doc.text(item.month.slice(0, 3), bx + barW / 2, chartY + chartH - 2.2, { align: 'center' });
    });

    y = chartY + chartH + 6;
  }

  // =========================================================================
  // PAGE 3: ARGENTINE REGULATORY FRAMEWORK & FRACTIONAL EQUITY / TRUST MODEL
  // =========================================================================
  doc.addPage();
  y = 22;
  y = drawSectionHeading('4', 'Marco Normativo Aplicable en la Republica Argentina (2025/2026)', y);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { textColor: DARK_GRAY, fontSize: 8.1, cellPadding: 2.3 },
    alternateRowStyles: { fillColor: LIGHT_BG },
    head: [['Dimension Regulatoria / Normativa', 'Encuadre Aplicable al Proyecto']],
    body: [
      ['Categoria de Usuario / Generador', pdfSafeText(`${m.regulatory.categoryName} (${m.regulatory.powerRangeLabel}) - ${m.regulatory.segmentLabel}`)],
      ['Normativa Nacional Vigente', pdfSafeText(`${m.regulatory.applicableFramework}. Ley 27.424 (Generacion Distribuida hasta 12 MW por Res. SE 287/2025), Ley 27.191 prorrogada por Ley 28.282 hasta 2045 y Normalizacion del MEM / MATER (Res. SE 400/2025).`)],
      ['Modalidad y Facturacion Neta', pdfSafeText(`${MODALITY_LABELS[metadata.modality]}. ${m.regulatory.compensationScheme}`)],
      ['Marco Jurisdiccional Provincial', pdfSafeText(`${m.detectedProvince.name}: ${m.detectedProvince.regulatoryLaw} ante ${m.detectedProvince.utilityFullName}. ${m.detectedProvince.taxExemptions}`)],
      ['Exigencias Tecnicas y Telemetria', pdfSafeText(`${m.regulatory.technicalStandards.join('; ')}. ${m.regulatory.telemetryRequirementText}`)],
    ],
  });

  if (m.regulatory.exceedsContractedPowerWarning) {
    y = ((doc as any).lastAutoTable?.finalY || y + 40) + 4;
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(146, 64, 14);
    const warnLines = doc.splitTextToSize(pdfSafeText(m.regulatory.exceedsContractedPowerWarning), contentWidth - 6);
    doc.text(warnLines, margin + 3, y + 4.8);
    y += 16;
  } else {
    y = ((doc as any).lastAutoTable?.finalY || y + 40) + 9;
  }

  y = drawSectionHeading('5', 'Modelo de Participacion e Inversion (Caso Societario / Fraccionado)', y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(pdfSafeText(`Vehiculo Estructurado: ${m.vehicleInfo.title}`), margin, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK_GRAY);
  const vehLines = doc.splitTextToSize(pdfSafeText(`${m.vehicleInfo.legalStructure}. ${m.vehicleInfo.summary}`), contentWidth);
  doc.text(vehLines, margin, y);
  y += vehLines.length * 4 + 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: ENERGY_GREEN, textColor: 255, fontSize: 8.3, fontStyle: 'bold' },
    bodyStyles: { textColor: DARK_GRAY, fontSize: 8.2, cellPadding: 2.3 },
    alternateRowStyles: { fillColor: LIGHT_BG },
    head: [
      [
        'Concepto Economico / Societario',
        'Parque Base (100%)',
        `Cuotaparte Socio (${formatPercent(metadata.equityFractionPercent)})`,
        `Escalamiento (${formatCapacityMw(m.expansionMw)})`,
      ],
    ],
    body: [
      ['Potencia Pico Atribuible (DC)', `${formatNumber(m.dcCapacityKwp)} kWp`, `${formatNumber(m.partnerDcKwp, 1)} kWp`, `${formatNumber(Math.round(m.expansionMw * 1000))} kWp`],
      ['Potencia Acople Atribuible (AC)', `${formatNumber(m.acCapacityKw, 1)} kW`, `${formatNumber(m.partnerAcKw, 1)} kW`, `${formatNumber(Math.round((m.expansionMw * 1000) / (config.dcAcRatio || 1.25)))} kW`],
      ['Aporte de Capital Estimado (CAPEX)', `USD ${formatNumber(m.capexTotalUsd)}`, `USD ${formatNumber(m.partnerCapexUsd)}`, `USD ${formatNumber(m.expansionCapexUsd)}`],
      ['Produccion Anual Atribuible', `${formatNumber(m.annualGenerationMwh, 1)} MWh`, `${formatNumber(m.partnerAnnualKwh)} kWh`, `${formatNumber(m.expansionAnnualMwh, 1)} MWh`],
      ['Ingreso / Ahorro Anual Bruto', `USD ${formatNumber(m.annualBenefitUsd)}`, `USD ${formatNumber(m.partnerAnnualBenefitUsd)}`, `USD ${formatNumber(m.expansionAnnualBenefitUsd)}`],
      ['Encuadre Normativo Etapa', m.regulatory.categoryCode, `${m.regulatory.categoryCode} (Fraccionado)`, m.expansionRegulatory.categoryCode],
    ],
  });

  y = ((doc as any).lastAutoTable?.finalY || y + 48) + 6;
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('RESUMEN DE RETORNO PARA EL SOCIO / CUOTAPARTISTA', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...DARK_GRAY);
  const partnerSummary = pdfSafeText(
    `Con una participacion del ${formatPercent(metadata.equityFractionPercent)} (inversion de USD ${formatNumber(m.partnerCapexUsd)}), el socio percibe un beneficio anual bruto de USD ${formatNumber(m.partnerAnnualBenefitUsd)} y un retorno neto acumulado proyectado a 25 anos de USD ${formatNumber(m.partner25YrEstimatedReturnUsd)}, manteniendo derecho de suscripcion preferente para escalar a ${formatCapacityMw(m.expansionMw)}.`
  );
  doc.text(doc.splitTextToSize(partnerSummary, contentWidth - 8), margin + 4, y + 11);

  // =========================================================================
  // PAGE 4: 25-YEAR CASHFLOW, LEGAL DISCLAIMER & SIGNATURES
  // =========================================================================
  doc.addPage();
  y = 22;
  y = drawSectionHeading('6', 'Proyeccion Financiera (Hitos 25 Anos), Cierre y Firmas', y);

  const keyYears = [1, 2, 3, 5, 8, 10, 13, 15, 20, 25];
  const cashflowRows = projections.twentyFiveYearCashFlow
    .filter((row) => keyYears.includes(row.year))
    .map((row) => [
      row.year === 13 ? `Ano ${row.year} (Inv. Repot.)` : `Ano ${row.year}`,
      `${formatNumber(row.generationMwh)} MWh`,
      `USD ${formatNumber(row.grossRevenueUsd)}`,
      `-USD ${formatNumber(row.opexUsd)}`,
      `USD ${formatNumber(row.netCashFlowUsd)}`,
      `USD ${formatNumber(row.cumulativeCashFlowUsd)}`,
    ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { textColor: DARK_GRAY, fontSize: 7.8, cellPadding: 2 },
    alternateRowStyles: { fillColor: LIGHT_BG },
    head: [['Periodo', 'Generacion', 'Ingreso Bruto', 'OPEX', 'Flujo Neto', 'Flujo Acumulado']],
    body: cashflowRows,
  });

  y = ((doc as any).lastAutoTable?.finalY || y + 55) + 8;

  if (metadata.notes?.trim() || aiAuditReport) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text('Notas Adicionales / Sintesis de Emplazamiento', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...DARK_GRAY);
    const noteSource =
      metadata.notes?.trim() ||
      pdfSafeText((aiAuditReport || '').replace(/#+/g, '').replace(/\*\*/g, '')).slice(0, 520) + '...';
    const noteLines = doc.splitTextToSize(pdfSafeText(noteSource), contentWidth);
    doc.text(noteLines.slice(0, 6), margin, y);
    y += Math.min(6, noteLines.length) * 4 + 6;
  }

  // Legal Disclaimer Box
  if (y + 42 > pageHeight - 25) {
    doc.addPage();
    y = 22;
  }

  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...NAVY);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('NOTAS LEGALES, VALIDEZ REGULATORIA Y ALCANCE DE INGENIERIA', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...DARK_GRAY);
  const disclaimerText = pdfSafeText(
    `${ARGENTINA_REGULATORY_DISCLAIMER}\n\nLas cifras energeticas, de inversion (CAPEX/OPEX) y retornos financieros expuestas en el presente informe constituyen estimaciones tecnicas preliminares de pre-factibilidad basadas en series satelitales e irradiancia historica. La ejecucion definitiva del proyecto y su estructuracion societaria quedan sujetas al estudio de factibilidad definitivo, ensayo geotecnico, aprobacion del Punto de Acceso y Conexion (PAC) ante la distribuidora o CAMMESA y cuadros tarifarios locales vigentes al momento de cierre financiero.`
  );
  doc.text(doc.splitTextToSize(disclaimerText, contentWidth - 8), margin + 4, y + 11.5);

  // Formal Signature Block
  y += 46;
  const sigW = (contentWidth - 16) / 2;
  doc.setDrawColor(...MUTED_GRAY);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 14, margin + sigW, y + 14);
  doc.line(margin + sigW + 16, y + 14, pageWidth - margin, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text(pdfSafeText(metadata.evaluatorName || 'Evaluador / Consultor Tecnico'), margin, y + 19);
  doc.text(pdfSafeText(metadata.investorEntity || 'Inversor / Socio Participante'), margin + sigW + 16, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED_GRAY);
  doc.text('Firma, Aclaracion y Matricula Profesional', margin, y + 23.5);
  doc.text(`Conformidad de Presentacion - Fecha: ${m.dateStr}`, margin + sigW + 16, y + 23.5);

  // Running Headers & Footers across all pages (2+)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (p > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED_GRAY);
      doc.text(pdfSafeText(`HELIOSITE SOLAR  |  ${metadata.projectName || location.name}`), margin, 11);
      doc.text(`Fecha: ${m.dateStr}`, pageWidth - margin, 11, { align: 'right' });
      doc.setDrawColor(...BORDER_GRAY);
      doc.setLineWidth(0.25);
      doc.line(margin, 13.5, pageWidth - margin, 13.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED_GRAY);
    doc.text(
      pdfSafeText('Documento Ejecutivo Confidencial - Uso Corporativo e Inversores'),
      margin,
      pageHeight - 8
    );
    doc.text(`Pagina ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const fileName = `${slugifyFileName(metadata.projectName || location.name)}-informe-ejecutivo.pdf`;
  doc.save(fileName);
}

/**
 * Generates and downloads an editable corporate .docx report compatible with Google Docs and Microsoft Word.
 */
export async function exportExecutiveDocx(input: ExecutiveReportInput): Promise<void> {
  const { location, config, projections, metadata, solarCalcOverride, aiAuditReport } = input;
  const m = resolveReportMetrics(input);

  const NAVY_HEX = '0F2744';
  const GREEN_HEX = '059669';
  const DARK_HEX = '1E293B';
  const MUTED_HEX = '64748B';
  const LIGHT_BG_HEX = 'F8FAFC';
  const GREEN_BG_HEX = 'ECFDF5';
  const BORDER_HEX = 'CBD5E1';

  const makeHeading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 120 },
      border: {
        bottom: { color: GREEN_HEX, space: 4, style: BorderStyle.SINGLE, size: 10 },
      },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 26,
          color: NAVY_HEX,
          font: 'Calibri',
        }),
      ],
    });

  const makeBodyParagraph = (text: string, boldPrefix?: string) =>
    new Paragraph({
      spacing: { after: 120, line: 276 },
      children: [
        ...(boldPrefix
          ? [
              new TextRun({
                text: boldPrefix,
                bold: true,
                size: 21,
                color: NAVY_HEX,
                font: 'Calibri',
              }),
            ]
          : []),
        new TextRun({
          text,
          size: 21,
          color: DARK_HEX,
          font: 'Calibri',
        }),
      ],
    });

  const buildCorporateTable = (
    headers: string[],
    rows: string[][],
    headerBgHex = NAVY_HEX
  ): Table => {
    const colWidthPct = Math.floor(100 / headers.length);

    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(
        (h) =>
          new TableCell({
            width: { size: colWidthPct, type: WidthType.PERCENTAGE },
            shading: { fill: headerBgHex, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: headerBgHex },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN_HEX },
              left: { style: BorderStyle.SINGLE, size: 2, color: headerBgHex },
              right: { style: BorderStyle.SINGLE, size: 2, color: headerBgHex },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: h,
                    bold: true,
                    size: 19,
                    color: 'FFFFFF',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          })
      ),
    });

    const dataRows = rows.map(
      (r, rIdx) =>
        new TableRow({
          children: r.map(
            (cellText, cIdx) =>
              new TableCell({
                width: { size: colWidthPct, type: WidthType.PERCENTAGE },
                shading: {
                  fill: rIdx % 2 === 1 ? LIGHT_BG_HEX : 'FFFFFF',
                  type: ShadingType.CLEAR,
                },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_HEX },
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER_HEX },
                  left: { style: BorderStyle.SINGLE, size: 2, color: BORDER_HEX },
                  right: { style: BorderStyle.SINGLE, size: 2, color: BORDER_HEX },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: cIdx === 0,
                        size: 19,
                        color: cIdx === 0 ? NAVY_HEX : DARK_HEX,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });
  };

  const keyYears = [1, 2, 3, 5, 8, 10, 13, 15, 20, 25];
  const cashflowRows = projections.twentyFiveYearCashFlow
    .filter((row) => keyYears.includes(row.year))
    .map((row) => [
      row.year === 13 ? `Año ${row.year} (Repotenciación)` : `Año ${row.year}`,
      `${formatNumber(row.generationMwh)} MWh`,
      `USD ${formatNumber(row.grossRevenueUsd)}`,
      `-USD ${formatNumber(row.opexUsd)}`,
      `USD ${formatNumber(row.netCashFlowUsd)}`,
      `USD ${formatNumber(row.cumulativeCashFlowUsd)}`,
    ]);

  const doc = new Document({
    creator: metadata.evaluatorName || 'Heliosite Solar',
    title: metadata.projectName || `Informe Ejecutivo Solar - ${location.name}`,
    description: 'Memoria de Viabilidad Fotovoltaica y Estructuración Societaria (Argentina 2025/2026)',
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `HELIOSITE SOLAR  |  ${metadata.projectName || location.name}  |  ${m.dateStr}`,
                    size: 16,
                    color: MUTED_HEX,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Documento Ejecutivo Editado para Presentación a Inversores y Socios  •  Página ',
                    size: 16,
                    color: MUTED_HEX,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: MUTED_HEX,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // COVER BANNER
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: NAVY_HEX, type: ShadingType.CLEAR },
                    margins: { top: 280, bottom: 280, left: 260, right: 260 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: NAVY_HEX },
                      bottom: { style: BorderStyle.SINGLE, size: 18, color: GREEN_HEX },
                      left: { style: BorderStyle.SINGLE, size: 6, color: NAVY_HEX },
                      right: { style: BorderStyle.SINGLE, size: 6, color: NAVY_HEX },
                    },
                    children: [
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          new TextRun({
                            text: 'MEMORIA EJECUTIVA DE VIABILIDAD SOLAR Y ESTRUCTURACIÓN SOCIETARIA',
                            bold: true,
                            size: 18,
                            color: 'A7F3D0',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 120 },
                        children: [
                          new TextRun({
                            text: metadata.projectName || `Parque Solar Fotovoltaico — ${location.name}`,
                            bold: true,
                            size: 36,
                            color: 'FFFFFF',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Emplazamiento: ${location.name} (${formatCoord(location.lat)}°, ${formatCoord(location.lng)}°)  |  Emisión: ${m.dateStr}`,
                            size: 20,
                            color: 'E2E8F0',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 }, children: [] }),

          // STAKEHOLDERS TABLE
          buildCorporateTable(
            ['Dato Corporativo de Portada', 'Detalle Asignado'],
            [
              ['Inversor / Consorcio Destinatario', metadata.investorEntity || 'Inversores y Socios Estratégicos'],
              ['Evaluador / Consultor Responsable', metadata.evaluatorName || 'Equipo de Ingeniería Heliosite Solar'],
              ['Vehículo de Participación Propuesto', `${m.vehicleInfo.title} (${formatPercent(metadata.equityFractionPercent)} inicial)`],
              ['Índice de Viabilidad Global', `${projections.viabilityScore} / 100 (${projections.viabilityGrade}) — IEC 61724`],
              ['Encuadre Regulatorio Vigente', `${m.regulatory.categoryName} (${m.regulatory.powerRangeLabel})`],
            ],
            NAVY_HEX
          ),

          makeHeading('1. Resumen Ejecutivo'),
          makeBodyParagraph(
            `El presente documento analiza la viabilidad técnica, energética, regulatoria y societaria para la instalación y operación del proyecto "${metadata.projectName || location.name}", emplazado en ${location.name} (${m.detectedProvince.name}, área de concesión ${m.detectedProvince.utility}). Con una capacidad instalada de ${formatNumber(m.dcCapacityKwp)} kWp DC (${formatNumber(m.acCapacityKw, 1)} kW AC) y un recurso solar de ${formatNumber(projections.annualGhiKwhM2)} kWh/m²/año, el sistema proyecta generar ${formatNumber(m.annualGenerationKwh)} kWh anuales (${formatNumber(m.annualGenerationMwh, 1)} MWh/año), con un Performance Ratio de ${formatPercent(projections.performanceRatio)} y un recupero simple estimado de ${m.paybackDisplay}.`
          ),
          makeBodyParagraph(
            `Para facilitar su estructuración entre socios o inversores bajo la figura "${m.vehicleInfo.title}", se presenta el desglose financiero correspondiente a una cuotaparte inicial del ${formatPercent(metadata.equityFractionPercent)} (aporte estimado de USD ${formatNumber(m.partnerCapexUsd)}), dejando planteada la hoja de ruta para escalar el parque hasta ${formatCapacityMw(m.expansionMw)}.`
          ),

          makeHeading('2. Parámetros Técnicos de Entrada'),
          buildCorporateTable(
            ['Parámetro Técnico', 'Valor del Proyecto', 'Especificación Complementaria'],
            [
              ['Ubicación Geográfica', location.name, `Latitud ${formatCoord(location.lat)}° / Longitud ${formatCoord(location.lng)}°`],
              ['Jurisdicción y Distribuidora', `${m.detectedProvince.name} (${m.detectedProvince.utility})`, m.detectedProvince.regulatoryLaw],
              ['Potencia Pico Instalada (DC)', `${formatNumber(m.dcCapacityKwp)} kWp (${formatCapacityMw(m.capacityMw)})`, `${formatNumber(Math.round((m.dcCapacityKwp * 1000) / (config.moduleWattageWp || 585)))} paneles Tier-1 (${config.moduleWattageWp || 585} Wp)`],
              ['Potencia de Acople AC', `${formatNumber(m.acCapacityKw, 1)} kW AC`, `Relación DC/AC: ${formatNumber(projections.dcAcRatio, 2)}x | Eficiencia inversor: ${formatPercent(config.inverterEfficiencyPercent)}`],
              ['Superficie Estimada', m.areaDisplay, solarCalcOverride ? `Cubierta: ${solarCalcOverride.roofType}` : `Factor de ocupación GCR: ${formatPercent(projections.groundCoverRatioPercent)}`],
              ['Tecnología Seleccionada', TECHNOLOGY_LABELS[config.technology], `Inclinación ${config.tiltAngleDegrees}° | Azimut ${config.azimuthDegrees}°`],
              ['Irradiación Solar Local', `GHI ${formatNumber(projections.annualGhiKwhM2)} kWh/m²/año`, `POA ${formatNumber(projections.annualPoaKwhM2)} kWh/m²/año | HSP ${formatNumber(projections.peakSunHoursDaily, 2)} h/día`],
            ],
            NAVY_HEX
          ),

          makeHeading('3. Análisis de Viabilidad y Producción Energética (IEC 61724)'),
          buildCorporateTable(
            ['Métrica de Rendimiento y Economía', 'Valor Calculado', 'Referencia / Impacto'],
            [
              ['Generación Anual Estimada (Año 1)', `${formatNumber(m.annualGenerationKwh)} kWh (${formatNumber(m.annualGenerationMwh, 1)} MWh)`, `Equivalente a ~${formatNumber(projections.homesPowered)} hogares`],
              ['Factor de Planta / Capacidad (CF)', formatPercent(projections.capacityFactorPercent), `Performance Ratio (PR): ${formatPercent(projections.performanceRatio)}`],
              ['Rendimiento Específico (Specific Yield)', `${formatNumber(projections.specificYieldKwhKwp)} kWh/kWp/año`, `Temp. celda media ${formatNumber(projections.averageCellTempC, 1)}°C (pérdida -${formatPercent(projections.tempLossPercent)})`],
              ['Generación Acumulada (25 Años)', `${formatNumber(projections.lifetimeGenerationMwh)} MWh`, `Degradación ${formatPercent(config.annualDegradationPercent || 0.45, 2)}/año | CO₂ evitado: ${formatNumber(projections.avoidedCo2TonsYear)} t/año`],
              ['Inversión Inicial (CAPEX) y LCOE', `USD ${formatNumber(m.capexTotalUsd)}`, `LCOE: $${formatNumber(projections.lcoeUsdMwh, 1)} USD/MWh | Payback: ${m.paybackDisplay} | TIR: ${formatPercent(projections.irrPercent)}`],
            ],
            GREEN_HEX
          ),

          new Paragraph({ spacing: { before: 140, after: 80 }, children: [new TextRun({ text: 'Distribución Mensual Estimada (12 Meses):', bold: true, size: 21, color: NAVY_HEX, font: 'Calibri' })] }),
          buildCorporateTable(
            ['Mes', 'Generación (MWh)', 'GHI (kWh/m²)', 'POA (kWh/m²)'],
            projections.monthlyGenerationMwh.map((item) => [
              item.month,
              formatNumber(item.generationMwh, 1),
              formatNumber(item.ghiKwhM2),
              formatNumber(item.poaKwhM2),
            ]),
            NAVY_HEX
          ),

          new Paragraph({ children: [new PageBreak()] }),

          makeHeading('4. Marco Normativo Aplicable (República Argentina 2025/2026)'),
          makeBodyParagraph(
            `El proyecto queda encuadrado en la categoría ${m.regulatory.categoryName} (${m.regulatory.powerRangeLabel}), correspondiendo la aplicación de ${m.regulatory.applicableFramework}.`,
            'Encuadre Regulatorio Central: '
          ),
          buildCorporateTable(
            ['Norma / Disposición', 'Alcance y Obligaciones Aplicables al Emprendimiento'],
            [
              ['Ley 27.424 y Res. SE 287/2025', `Establece el tope de Generación Distribuida hasta 12 MW y clasifica en UGpe (≤ 3 kW), UGme (3–300 kW) y UGma (300 kW–12 MW). Cómputo por suma de potencias AC de inversores (tope = potencia contratada salvo autorización del Ente Regulador). Facturación Neta (Net Billing) sin cargos extra por reserva o peajes.`],
              ['Modalidad Operativa Seleccionada', `${MODALITY_LABELS[metadata.modality]}. ${m.regulatory.compensationScheme}`],
              ['Ley 27.191 (Ley 28.282) y Res. SE 400/2025', `Prórroga de estabilidad fiscal hasta 31/12/2045 (Ley 28.282). La Res. SE 400/2025 normaliza el MEM, segmenta demanda GUDI (≥ 300 kW) y habilita contratos privados MAT/MATER para plantas > 12 MW o Grandes Usuarios.`],
              ['Normativa Provincial Aplicable', `${m.detectedProvince.name} — ${m.detectedProvince.regulatoryLaw} (${m.detectedProvince.utilityFullName}). ${m.detectedProvince.taxExemptions}`],
              ['Normas Técnicas y Telemetría', `${m.regulatory.technicalStandards.join(' • ')}. ${m.regulatory.telemetryRequirementText}`],
            ],
            NAVY_HEX
          ),

          makeHeading('5. Modelo de Participación e Inversión (Caso Societario / Fraccionado)'),
          makeBodyParagraph(m.vehicleInfo.summary, `${m.vehicleInfo.title} (${m.vehicleInfo.legalStructure}): `),
          buildCorporateTable(
            [
              'Variable Societaria / Económica',
              'Parque Completo (100%)',
              `Participación Socio (${formatPercent(metadata.equityFractionPercent)})`,
              `Horizonte Escalamiento (${formatCapacityMw(m.expansionMw)})`,
            ],
            [
              ['Potencia Atribuible DC', `${formatNumber(m.dcCapacityKwp)} kWp`, `${formatNumber(m.partnerDcKwp, 1)} kWp`, `${formatNumber(Math.round(m.expansionMw * 1000))} kWp`],
              ['Potencia Acople AC', `${formatNumber(m.acCapacityKw, 1)} kW`, `${formatNumber(m.partnerAcKw, 1)} kW`, `${formatNumber(Math.round((m.expansionMw * 1000) / (config.dcAcRatio || 1.25)))} kW`],
              ['Capital Comprometido (CAPEX)', `USD ${formatNumber(m.capexTotalUsd)}`, `USD ${formatNumber(m.partnerCapexUsd)}`, `USD ${formatNumber(m.expansionCapexUsd)}`],
              ['Generación Anual Atribuible', `${formatNumber(m.annualGenerationMwh, 1)} MWh`, `${formatNumber(m.partnerAnnualKwh)} kWh`, `${formatNumber(m.expansionAnnualMwh, 1)} MWh`],
              ['Ingreso / Ahorro Anual Bruto', `USD ${formatNumber(m.annualBenefitUsd)}`, `USD ${formatNumber(m.partnerAnnualBenefitUsd)}`, `USD ${formatNumber(m.expansionAnnualBenefitUsd)}`],
              ['Retorno Neto Acumulado (25 Años)', `USD ${formatNumber(Math.round(m.partner25YrEstimatedReturnUsd / m.fraction))}`, `USD ${formatNumber(m.partner25YrEstimatedReturnUsd)}`, `Sujeto a contrato PPA / etapa`],
            ],
            GREEN_HEX
          ),

          makeHeading('6. Proyección Financiera (Hitos 25 Años), Notas y Cierre'),
          buildCorporateTable(
            ['Año Operativo', 'Generación', 'Ingreso Bruto', 'OPEX', 'Flujo Neto', 'Acumulado'],
            cashflowRows,
            NAVY_HEX
          ),

          ...(metadata.notes?.trim() || aiAuditReport
            ? [
                new Paragraph({
                  spacing: { before: 180, after: 80 },
                  children: [
                    new TextRun({
                      text: 'Notas del Evaluador y Contexto de Emplazamiento:',
                      bold: true,
                      size: 21,
                      color: NAVY_HEX,
                      font: 'Calibri',
                    }),
                  ],
                }),
                makeBodyParagraph(
                  metadata.notes?.trim() ||
                    (aiAuditReport || '').replace(/#+/g, '').replace(/\*\*/g, '').slice(0, 800)
                ),
              ]
            : []),

          // DISCLAIMER CALLOUT
          new Paragraph({ spacing: { before: 180 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: GREEN_BG_HEX, type: ShadingType.CLEAR },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: GREEN_HEX },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN_HEX },
                      left: { style: BorderStyle.SINGLE, size: 16, color: NAVY_HEX },
                      right: { style: BorderStyle.SINGLE, size: 4, color: GREEN_HEX },
                    },
                    children: [
                      new Paragraph({
                        spacing: { after: 60 },
                        children: [
                          new TextRun({
                            text: 'NOTAS LEGALES Y VALIDEZ REGULATORIA',
                            bold: true,
                            size: 19,
                            color: NAVY_HEX,
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          new TextRun({
                            text: ARGENTINA_REGULATORY_DISCLAIMER,
                            bold: true,
                            size: 18,
                            color: DARK_HEX,
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Las cifras técnicas, costos de inversión (CAPEX/OPEX) y flujos financieros incluidos en este documento constituyen estimaciones preliminares de pre-factibilidad. La estructuración societaria definitiva y la decisión de inversión quedan sujetas al estudio de factibilidad definitivo, ensayo geotécnico, aprobación de acceso y punto de conexión (PAC/CAMMESA) y cuadros tarifarios locales vigentes.',
                            size: 18,
                            color: DARK_HEX,
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // SIGNATURES TABLE
          new Paragraph({ spacing: { before: 260 }, children: [] }),
          buildCorporateTable(
            ['Evaluador / Consultor Técnico Responsable', 'Inversor / Socio Participante'],
            [
              [
                `\n\n_________________________________________\n${metadata.evaluatorName || 'Evaluador Técnico'}\nFirma, Aclaración y Matrícula`,
                `\n\n_________________________________________\n${metadata.investorEntity || 'Inversor / Socio'}\nRecepción y Conformidad — Fecha: ${m.dateStr}`,
              ],
            ],
            NAVY_HEX
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${slugifyFileName(metadata.projectName || location.name)}-informe-ejecutivo.docx`;
  triggerBlobDownload(blob, fileName);
}
