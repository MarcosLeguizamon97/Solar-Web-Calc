/**
 * Heliosite Solar - Standard Argentine / Spanish Number Formatting (i18n)
 *
 * Rules:
 * 1. Decimal separator: ALWAYS comma (,) (e.g. 0,5 or 49,6 or 1476,2)
 * 2. Thousands separator: ALWAYS dot (.) ONLY when the number is >= 10.000 (e.g. 10.000 or 1.098.879)
 * 3. Four-digit numbers < 10.000 (e.g. 1476, 2100, 5000, 9999) NEVER carry thousands dots
 *    (strictly 1476, NEVER 1.476).
 */

/**
 * Core formatter following the strict Argentine/Spanish convention.
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals?: number
): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) {
    return String(value);
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  let numStr: string;
  if (decimals !== undefined) {
    numStr = absNum.toFixed(decimals);
  } else {
    // Round to avoid float precision bugs, but preserve up to 4 significant decimals
    const rounded = Math.round(absNum * 10000) / 10000;
    numStr = rounded.toString();
  }

  const parts = numStr.split('.');
  const integerDigits = parts[0];
  const decimalDigits = parts[1];

  let formattedInteger: string;
  const intVal = parseInt(integerDigits, 10);

  // Rule: Only apply thousands dot if integer part is 10.000 or greater
  if (intVal >= 10000) {
    formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    // 0 to 9999: NO thousands separator (e.g. 1476, 2100)
    formattedInteger = integerDigits;
  }

  const sign = isNegative ? '-' : '';

  if (decimalDigits !== undefined && decimalDigits.length > 0) {
    return `${sign}${formattedInteger},${decimalDigits}`;
  }

  return `${sign}${formattedInteger}`;
}

/**
 * Formats a number with explicit decimals, replacing dot with comma.
 * e.g. formatDecimal(0.5, 1) => "0,5"
 */
export function formatDecimal(
  value: number | string | null | undefined,
  decimals = 1
): string {
  return formatNumber(value, decimals);
}

/**
 * Formats an integer or whole number count with Argentine rules.
 * e.g. 1476 => "1476", 42000 => "42.000", 1098879 => "1.098.879"
 */
export function formatInteger(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return '0';
  return formatNumber(Math.round(num), 0);
}

/**
 * Formats percentages with comma separator.
 * e.g. 22 => "22%", 49.6 => "49,6%", 0.45 => "0,45%"
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals?: number
): string {
  if (value === null || value === undefined || value === '') return '0%';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return '0%';

  const dec = decimals !== undefined ? decimals : (Number.isInteger(num) ? 0 : 1);
  return `${formatNumber(num, dec)}%`;
}

/**
 * Formats currency (USD) with dollar sign and comma decimals if needed.
 * e.g. 42000 => "$42.000", 1476 => "$1476", 1098879 => "$1.098.879"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  decimals = 0,
  prefix = '$'
): string {
  return `${prefix}${formatNumber(value, decimals)}`;
}

/**
 * Formats solar capacity in MWp.
 * e.g. 0.5 => "0,5 MWp", 1 => "1 MWp", 2.5 => "2,5 MWp"
 */
export function formatCapacityMw(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return '0 MWp';
  const dec = Number.isInteger(num) ? 0 : 1;
  return `${formatNumber(num, dec)} MWp`;
}

/**
 * Formats surface in hectares.
 * e.g. 0.8 => "0,8 ha", 1.6 => "1,6 ha", 14 => "14 ha"
 */
export function formatHectares(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return '0 ha';
  const dec = Number.isInteger(num) ? 0 : 1;
  return `${formatNumber(num, dec)} ha`;
}

/**
 * Formats coordinates for display with comma as decimal separator.
 * e.g. -32.9874 => "-32,9874"
 */
export function formatCoord(coord: number, decimals = 4): string {
  return formatNumber(coord, decimals);
}

/**
 * Normalizes numbers inside generated text, reports, and WhatsApp messages
 * to strictly follow the Argentine / Spanish standard:
 * 1. Comma for decimals (e.g., 0.5 MWp -> 0,5 MWp, 49.6% -> 49,6%, 1.6 ha -> 1,6 ha)
 * 2. 4-digit numbers < 10.000 never carry thousands dots (e.g., 1.476 -> 1476, 2.100 -> 2100)
 * 3. Dot for thousands >= 10.000 is preserved (e.g., 10.000, 1.098.879)
 */
export function normalizeReportNumbers(text: string): string {
  if (!text) return '';
  let result = text;

  // Rule 1: Remove erroneous thousands dot for 4-digit numbers < 10.000
  // e.g. "1.476 kWh" -> "1476 kWh", "2.100 MWh" -> "2100 MWh", "8.760 h" -> "8760 h", "1.500 Wp" -> "1500 Wp"
  result = result.replace(/\b([1-9])\.(\d{3})\b(?![.,]\d)/g, '$1$2');

  // Rule 2: Turn decimal points into decimal commas for numbers followed by units or common metrics
  // e.g. "0.5 MWp" -> "0,5 MWp", "1.6 ha" -> "1,6 ha", "49.6%" -> "49,6%", "9.2 / 10" -> "9,2 / 10", "13.2 kV" -> "13,2 kV", "22.4 °C" -> "22,4 °C"
  result = result.replace(/(\b\d{1,3})\.(\d{1,2})\b(?!\.\d)/g, '$1,$2');

  return result;
}
