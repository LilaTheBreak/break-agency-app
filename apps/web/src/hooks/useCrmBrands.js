/**
 * useCrmBrands - Custom hook for fetching and managing CRM brands
 * 
 * This fetches from /api/crm-brands and returns CrmBrand entities.
 * Used by CRM forms (contacts, deals, events, etc.) to link to actual CRM brands.
 * 
 * Distinct from useBrands which fetches onboarding/platform brands from /api/brands.
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
 * const { brands, isLoading, error, createBrand } = useCrmBrands();
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

// Global cache for CRM brands (persist across component mounts)
let crmBrandsCacheGlobal = null;
let crmBrandsCachePromise = null;

export function useCrmBrands() {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch CRM brands - use global cache to avoid duplicate requests
  const loadBrands = useCallback(async (forceRefresh = false) => {
    try {
      // Clear cache if force refresh requested
      if (forceRefresh) {
        crmBrandsCacheGlobal = null;
        crmBrandsCachePromise = null;
      }

      // If we have cached data and not force refreshing, use it immediately
      if (crmBrandsCacheGlobal && !forceRefresh) {
        setBrands(crmBrandsCacheGlobal);
        setIsLoading(false);
        return;
      }

      // If a request is already in flight, wait for it
      if (crmBrandsCachePromise) {
        const result = await crmBrandsCachePromise;
        setBrands(result);
        setIsLoading(false);
        return;
      }

      // Initiate new request
      setIsLoading(true);
      setError(null);

      crmBrandsCachePromise = apiFetch('/api/crm-brands')
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch CRM brands: ${res.status} ${res.statusText}`);
          }
          
          let data;
          try {
            data = await res.json();
          } catch (parseError) {
            console.error('[useCrmBrands] Failed to parse response:', parseError);
            throw new Error('Failed to parse brands response');
          }
          
          // Handle both direct array and wrapped object
          let brandsArray = Array.isArray(data) ? data : (data?.brands || []);
          
          // Normalize and deduplicate brands
          const normalized = normalizeCrmBrands(brandsArray);
          console.log('[useCrmBrands] Successfully fetched', normalized.length, 'CRM brands');
          crmBrandsCacheGlobal = normalized;
          return normalized;
        })
        .catch((err) => {
          console.error('[useCrmBrands] Fetch error:', err);
          throw err;
        })
        .finally(() => {
          crmBrandsCachePromise = null;
        });

      const result = await crmBrandsCachePromise;
      setBrands(result);
      setIsLoading(false);
    } catch (err) {
      setBrands([]);
      console.error('[useCrmBrands] Error fetching brands:', err);
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
      const response = await apiFetch('/api/crm-brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: brandName }),
      });

      if (!response.ok) {
        // Try to parse error response as JSON, fallback to status text
        let errorMessage = `Failed to create brand (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('[useCrmBrands] Error response was not valid JSON:', parseError);
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse success response with better error handling
      let newBrand;
      try {
        newBrand = await response.json();
      } catch (parseError) {
        console.error('[useCrmBrands] Failed to parse JSON response:', parseError);
        throw new Error("Failed to parse brand response from server");
      }

      if (!newBrand || !newBrand.id) {
        throw new Error("Invalid response: missing brand ID");
      }

      // Refresh cache to get new brand
      const result = await loadBrands(true);
      setBrands(result || brands);

      console.log('[useCrmBrands] Successfully created brand:', newBrand.name);

      return newBrand;
    } catch (err) {
      console.error('[useCrmBrands] Error creating brand:', err);
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
 * Normalize CRM brands from API
 * Handles different field names
 * Deduplicates by ID
 */
function normalizeCrmBrands(data) {
  if (!Array.isArray(data)) {
    console.warn('[useCrmBrands] API returned non-array:', data);
    return [];
  }

  // Deduplicate by ID and normalize field names
  const seen = new Set();
  const normalized = [];

  for (const brand of data) {
    if (!brand?.id || seen.has(brand.id)) {
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

  return normalized;
}

/**
 * Clear CRM brands cache globally
 * Use this after creating/updating/deleting brands
 */
export function clearCrmBrandsCache() {
  crmBrandsCacheGlobal = null;
  crmBrandsCachePromise = null;
}

/**
 * Search CRM brands helper function
 * Case-insensitive partial matching on name and brandName
 * 
 * Usage:
 * ```jsx
 * const filtered = searchCrmBrands(brands, "nut");
 * // Returns: [{ name: "Nutrogena" }, { name: "Nutrafol" }, ...]
 * ```
 */
export function searchCrmBrands(brands, searchText) {
  if (!searchText.trim()) return brands;

  const query = searchText.toLowerCase().trim();
  const brandArray = Array.isArray(brands) ? brands : [];

  return brandArray.filter(b => {
    const name = (b?.name || b?.brandName || '')
      .toLowerCase();
    
    return name.includes(query);
  });
}
