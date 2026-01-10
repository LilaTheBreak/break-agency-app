/**
 * Centralized currency formatting utility
 * Single source of truth for all currency display across the platform
 * 
 * Usage:
 * formatCurrency(1500, 'GBP') → "£1,500"
 * formatCurrency(50000, 'USD') → "$50,000"
 * formatCurrency(75, 'EUR') → "€75"
 * formatCurrency(5000, 'AED') → "AED 5,000"
 */

export type CurrencyCode = 'GBP' | 'USD' | 'EUR' | 'AED' | 'CAD' | 'AUD' | 'JPY';

interface CurrencyFormatOptions {
  compact?: boolean; // If true, use K/M notation (1500 → £1.5K)
  decimals?: number; // Number of decimal places (default: 0 for standard, 1 for compact)
  showCurrency?: boolean; // If false, omit currency symbol (default: true)
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  AED: 'AED',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: '¥'
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'de-DE',
  AED: 'ar-AE',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP'
};

/**
 * Format a number as currency with proper symbol and locale
 * 
 * @param amount - The numeric amount to format
 * @param currency - Currency code (GBP, USD, EUR, AED, etc.)
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1500, 'GBP') → "£1,500"
 * formatCurrency(1500, 'GBP', { compact: true }) → "£1.5K"
 * formatCurrency(50000, 'USD', { compact: true }) → "$50K"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: CurrencyCode = 'GBP',
  options: CurrencyFormatOptions = {}
): string {
  // Handle null/undefined
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const { compact = false, decimals, showCurrency = true } = options;

  if (compact) {
    return formatCompactCurrency(amount, currency, decimals, showCurrency);
  }

  return formatStandardCurrency(amount, currency, decimals, showCurrency);
}

/**
 * Format currency in standard format with thousand separators
 * Examples: £1,500 | $50,000 | €1,234,567
 */
function formatStandardCurrency(
  amount: number,
  currency: CurrencyCode,
  decimals?: number,
  showCurrency: boolean = true
): string {
  const decimalPlaces = decimals ?? (currency === 'JPY' ? 0 : 2);
  const locale = CURRENCY_LOCALES[currency] || 'en-GB';
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  // Use Intl for proper locale formatting
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);

    return formatted;
  } catch {
    // Fallback if Intl fails
    const numberFormatted = amount.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (!showCurrency) return numberFormatted;
    
    // For currencies like AED that prefix the symbol
    if (currency === 'AED') {
      return `${symbol} ${numberFormatted}`;
    }
    
    return `${symbol}${numberFormatted}`;
  }
}

/**
 * Format currency in compact format with K/M notation
 * Examples: £1.5K | $50K | €1.2M
 */
function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode,
  decimals?: number,
  showCurrency: boolean = true
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  let formatted: string;
  let suffix: string = '';

  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    const decimalPlaces = decimals ?? 1;
    formatted = millions.toFixed(decimalPlaces);
    suffix = 'M';
  } else if (Math.abs(amount) >= 1_000) {
    const thousands = amount / 1_000;
    const decimalPlaces = decimals ?? 1;
    formatted = thousands.toFixed(decimalPlaces);
    suffix = 'K';
  } else {
    const decimalPlaces = decimals ?? 0;
    formatted = amount.toFixed(decimalPlaces);
  }

  // Remove trailing zeros after decimal
  formatted = formatted.replace(/\.0+$/, '');

  if (!showCurrency) return `${formatted}${suffix}`;

  // Format based on currency
  if (currency === 'AED') {
    return `${symbol} ${formatted}${suffix}`;
  }

  return `${symbol}${formatted}${suffix}`;
}

/**
 * Get the currency symbol for a given code
 * @example getCurrencySymbol('GBP') → "£"
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get the proper locale for a currency
 * Useful for Intl operations
 */
export function getCurrencyLocale(currency: CurrencyCode): string {
  return CURRENCY_LOCALES[currency] || 'en-GB';
}

/**
 * Check if a currency code is valid
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return code in CURRENCY_SYMBOLS;
}

/**
 * Get all supported currency codes
 */
export function getSupportedCurrencies(): CurrencyCode[] {
  return Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[];
}

/**
 * Parse a currency string and extract amount
 * Handles various formats: £1,500 | $50K | €1.2M
 * @example parseCurrencyAmount('£1,500') → 1500
 */
export function parseCurrencyAmount(value: string): number {
  if (!value) return 0;

  // Remove currency symbols
  let cleaned = value.trim();
  for (const symbol of Object.values(CURRENCY_SYMBOLS)) {
    cleaned = cleaned.replace(new RegExp(`^${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '');
  }

  // Extract number
  const match = cleaned.match(/[\d.,]+/);
  if (!match) return 0;

  let number = match[0];
  
  // Handle K/M notation
  const suffix = cleaned.match(/[KM]$/)?.[0];
  number = number.replace(/,/g, '');
  
  let amount = parseFloat(number);
  if (suffix === 'K') amount *= 1000;
  if (suffix === 'M') amount *= 1_000_000;

  return isNaN(amount) ? 0 : amount;
}

/**
 * Convert amount from one currency to another
 * NOTE: This is a placeholder - real implementation would use exchange rates API
 * For now, returns the same amount (to be implemented with real rates)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  // TODO: Integrate with real exchange rate API when available
  // For now, return amount as-is (no conversion applied)
  return amount;
}

export default formatCurrency;
