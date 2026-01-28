/**
 * useBrands - Custom hook for fetching and managing brands
 * 
 * This is the SINGLE SOURCE OF TRUTH for brand data across the entire app.
 * All "Select Brand" dropdowns must use this hook to fetch brands.
 * 
 * Features:
 * - Fetches from /api/crm-brands once and caches
 * - Provides brands array and loading state
 * - Supports search filtering (case-insensitive, partial match)
 * - Provides createBrand function for inline creation
 * - Auto-deduplicates brands
 * 
 * Usage:
 * ```jsx
 * const { brands, isLoading, error, createBrand } = useBrands();
 * 
 * <BrandSelect
 *   brands={brands}
 *   value={selectedBrandId}
 *   onChange={setSelectedBrandId}
 *   isLoading={isLoading}
 *   onCreateBrand={createBrand}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/apiClient.js';
import { normalizeArray, normalizeApiResponse } from '../lib/apiNormalization.js';

// Global cache for brands (persist across component mounts)
let brandsCacheGlobal = null;
let brandsCachePromise = null;

export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch brands - use global cache to avoid duplicate requests
  const loadBrands = useCallback(async (forceRefresh = false) => {
    try {
      // Clear cache if force refresh requested
      if (forceRefresh) {
        brandsCacheGlobal = null;
        brandsCachePromise = null;
      }

      // If we have cached data and not force refreshing, use it immediately
      if (brandsCacheGlobal && !forceRefresh) {
        setBrands(brandsCacheGlobal);
        setIsLoading(false);
        return;
      }

      // If a request is already in flight, wait for it
      if (brandsCachePromise) {
        const result = await brandsCachePromise;
        setBrands(result);
        setIsLoading(false);
        return;
      }

      // Initiate new request
      setIsLoading(true);
      setError(null);

      brandsCachePromise = apiFetch('/api/brands')
        .then(async (res) => {
          const { data, error } = await normalizeApiResponse(res, '/api/brands');
          
          if (error) {
            console.error('[useBrands] API error:', error);
            throw new Error(error.message || 'Failed to fetch brands');
          }
          
          console.log('[useBrands] API response data:', data);
          
          // Normalize response - handle both direct array and wrapped object
          const brandsArray = normalizeArray(data, { 
            context: 'useBrands',
            warnOnInvalid: true 
          });
          
          console.log('[useBrands] Brands array before normalization:', brandsArray);
          
          // Deduplicate and normalize brands
          const normalized = normalizeBrands(brandsArray);
          console.log('[useBrands] Successfully fetched', normalized.length, 'brands after normalization:', normalized);
          brandsCacheGlobal = normalized;
          return normalized;
        })
        .catch((err) => {
          console.error('[useBrands] Fetch error:', err);
          throw err;
        })
        .finally(() => {
          brandsCachePromise = null;
        });

      const result = await brandsCachePromise;
      setBrands(result);
      setIsLoading(false);
    } catch (err) {
      setBrands([]);
      console.error('[useBrands] Error fetching brands:', err);
      setError(err.message || 'Failed to fetch brands');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Create brand function - used by BrandSelect for inline creation
  const createBrand = useCallback(async (brandName) => {
    try {
      const response = await apiFetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: brandName }),
      });

      const { data: newBrand, error } = await normalizeApiResponse(response, '/api/brands POST');

      if (error) {
        throw new Error(error.message || 'Failed to create brand');
      }

      if (!newBrand || !newBrand.id) {
        throw new Error("Invalid response: missing brand ID");
      }

      // Add to cache and state
      const updated = [
        ...brands,
        {
          id: newBrand.id,
          name: newBrand.name,
          brandName: newBrand.name,
        }
      ];
      
      brandsCacheGlobal = updated;
      setBrands(updated);

      return newBrand;
    } catch (err) {
      console.error('[useBrands] Error creating brand:', err);
      throw err;
    }
  }, [brands]);

  // Refresh brands function - forces cache clear and reload
  const refresh = useCallback(async () => {
    return loadBrands(true);  // forceRefresh = true
  }, [loadBrands]);

  return {
    brands,
    isLoading,
    error,
    createBrand,
    refresh,
    refetch: refresh,  // Alias for backward compatibility
  };
}

/**
 * Normalize brands from API
 * Handles different field names (name vs brandName)
 * Deduplicates by ID
 */
function normalizeBrands(data) {
  if (!Array.isArray(data)) {
    console.warn('[useBrands] API returned non-array:', data);
    return [];
  }

  // Deduplicate by ID and normalize field names
  const seen = new Set();
  const normalized = [];
  let skippedCount = 0;

  for (const brand of data) {
    if (!brand?.id) {
      console.warn('[useBrands] Brand missing id field:', brand);
      skippedCount++;
      continue; // Skip items without ID
    }
    
    if (seen.has(brand.id)) {
      console.log('[useBrands] Skipping duplicate brand:', brand.id);
      skippedCount++;
      continue; // Skip duplicates
    }

    seen.add(brand.id);
    normalized.push({
      id: brand.id,
      name: brand.name || brand.brandName || 'Unnamed Brand',
      brandName: brand.brandName || brand.name || 'Unnamed Brand',
      // Preserve all other fields
      ...brand,
    });
  }
  
  if (skippedCount > 0) {
    console.log(`[useBrands] Skipped ${skippedCount} invalid brands out of ${data.length}`);
  }

  return normalized;
}

/**
 * Clear brands cache globally
 * Use this after creating/updating/deleting brands
 */
export function clearBrandsCache() {
  brandsCacheGlobal = null;
  brandsCachePromise = null;
}

/**
 * Search brands helper function
 * Case-insensitive partial matching on name and brandName
 * 
 * Usage:
 * ```jsx
 * const filtered = searchBrands(brands, "nut");
 * // Returns: [{ name: "Nutrogena" }, { name: "Nutrafol" }, ...]
 * ```
 */
export function searchBrands(brands, searchText) {
  if (!searchText.trim()) return brands;

  const query = searchText.toLowerCase().trim();
  const brandArray = Array.isArray(brands) ? brands : [];

  return brandArray.filter(b => {
    const name = (b?.name || b?.brandName || '')
      .toLowerCase();
    
    return name.includes(query);
  });
}
