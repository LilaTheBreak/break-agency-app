/**
 * Data Normalization Utilities
 * 
 * Shared helpers for normalizing API responses to consistent array formats.
 * Prevents crashes from unexpected API response shapes (empty strings, objects, etc.)
 * 
 * VERSION: 3d85fa9 - All safe state memos now validate and return [] if not array
 */

/**
 * Normalizes API response to an array format.
 * Handles various response shapes:
 * - Direct array: [1, 2, 3]
 * - Wrapped object: { data: [...] }
 * - Wrapped object: { items: [...] }
 * - Wrapped object: { brands: [...] }, { deals: [...] }, etc.
 * - Empty string: ""
 * - Null/undefined: null, undefined
 * 
 * @param {unknown} input - The API response to normalize
 * @param {string} [key] - Optional key to extract from object (e.g., 'brands', 'deals')
 * @returns {any[]} Always returns an array, never null/undefined/empty string
 * 
 * @example
 * normalizeApiArray([1, 2, 3]) // [1, 2, 3]
 * normalizeApiArray({ brands: [...] }) // [...]
 * normalizeApiArray({ data: [...] }) // [...]
 * normalizeApiArray("") // []
 * normalizeApiArray(null) // []
 */
export function normalizeApiArray(input, key) {
  // Handle empty string, null, undefined, false
  if (input === "" || input === null || input === undefined || input === false) {
    return [];
  }
  
  // Handle direct array - return as-is
  if (Array.isArray(input)) {
    return input;
  }
  
  // If not an object at this point, return empty array
  if (!input || typeof input !== 'object') {
    return [];
  }
  
  // Handle object with specific key (e.g., { brands: [...] })
  if (key && Array.isArray(input[key])) {
    return input[key];
  }
  
  // Handle common wrapper patterns
  if (Array.isArray(input.data)) {
    return input.data;
  }
  if (Array.isArray(input.items)) {
    return input.items;
  }
  
  // Try common plural keys if no specific key provided
  if (!key) {
    const commonKeys = ['brands', 'deals', 'campaigns', 'events', 'contracts', 'contacts', 'tasks', 'users', 'talents'];
    for (const commonKey of commonKeys) {
      if (Array.isArray(input[commonKey])) {
        return input[commonKey];
      }
    }
  }
  
  // Fallback: return empty array (input is object but doesn't match any pattern)
  return [];
}

/**
 * Normalizes a value to an array, with runtime guard logging.
 * Same as normalizeApiArray but logs warnings for unexpected shapes.
 * 
 * @param {unknown} input - The value to normalize
 * @param {string} [key] - Optional key to extract from object
 * @param {string} [context] - Context string for logging (e.g., 'Brands CRM')
 * @returns {any[]} Always returns an array
 */
export function normalizeApiArrayWithGuard(input, key, context = '') {
  const normalized = normalizeApiArray(input, key);
  
  // Runtime guard: Only warn if input was not already an array AND we had to normalize
  // Don't warn for expected API response shapes like { brands: [...] } - this is normal
  if (!Array.isArray(input) && input !== "" && input !== null && input !== undefined) {
    // Only warn if normalization failed (returned empty array when we expected data)
    // or if the input is an unexpected type (not an object with the expected key)
    const isExpectedObjectShape = input && typeof input === 'object' && (
      (key && Array.isArray(input[key])) ||
      Array.isArray(input.data) ||
      Array.isArray(input.items)
    );
    
    if (!isExpectedObjectShape || normalized.length === 0) {
      console.warn(`[${context || 'DATA_NORMALIZATION'}] Expected array, received:`, {
        input,
        type: typeof input,
        isArray: Array.isArray(input),
        normalizedLength: normalized.length,
        key
      });
    }
  }
  
  return normalized;
}

