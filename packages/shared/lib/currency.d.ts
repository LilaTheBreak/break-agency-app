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
    compact?: boolean;
    decimals?: number;
    showCurrency?: boolean;
}
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
export declare function formatCurrency(amount: number | null | undefined, currency?: CurrencyCode, options?: CurrencyFormatOptions): string;
/**
 * Get the currency symbol for a given code
 * @example getCurrencySymbol('GBP') → "£"
 */
export declare function getCurrencySymbol(currency: CurrencyCode): string;
/**
 * Get the proper locale for a currency
 * Useful for Intl operations
 */
export declare function getCurrencyLocale(currency: CurrencyCode): string;
/**
 * Check if a currency code is valid
 */
export declare function isValidCurrency(code: string): code is CurrencyCode;
/**
 * Get all supported currency codes
 */
export declare function getSupportedCurrencies(): CurrencyCode[];
/**
 * Parse a currency string and extract amount
 * Handles various formats: £1,500 | $50K | €1.2M
 * @example parseCurrencyAmount('£1,500') → 1500
 */
export declare function parseCurrencyAmount(value: string): number;
/**
 * Convert amount from one currency to another
 * NOTE: This is a placeholder - real implementation would use exchange rates API
 * For now, returns the same amount (to be implemented with real rates)
 */
export declare function convertCurrency(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number;
export default formatCurrency;
