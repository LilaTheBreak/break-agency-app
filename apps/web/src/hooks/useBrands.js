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

// Global cache for brands (persist across component mounts)
let brandsCacheGlobal = null;
let brandsCachePromise = null;

export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch brands - use global cache to avoid duplicate requests
  useEffect(() => {
    let cancelled = false;

    const loadBrands = async () => {
      try {
        // If we have cached data, use it immediately
        if (brandsCacheGlobal) {
          if (!cancelled) {
            setBrands(brandsCacheGlobal);
            setIsLoading(false);
          }
          return;
        }

        // If a request is already in flight, wait for it
        if (brandsCachePromise) {
          const result = await brandsCachePromise;
          if (!cancelled) {
            setBrands(result);
            setIsLoading(false);
          }
          return;
        }

        // Initiate new request
        setIsLoading(true);
        setError(null);

        brandsCachePromise = fetch('/api/crm-brands')
          .then(async (res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch brands: ${res.status}`);
            }
            const data = await res.json();
            
            // Normalize and deduplicate brands
            const normalized = normalizeBrands(data);
            brandsCacheGlobal = normalized;
            return normalized;
          })
          .finally(() => {
            brandsCachePromise = null;
          });

        const result = await brandsCachePromise;
        if (!cancelled) {
          setBrands(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useBrands] Error fetching brands:', err);
          setError(err.message || 'Failed to fetch brands');
          setIsLoading(false);
        }
      }
    };

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  // Create brand function - used by BrandSelect for inline creation
  const createBrand = useCallback(async (brandName) => {
    try {
      const response = await fetch('/api/brands', {
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
          console.warn('[useBrands] Error response was not valid JSON:', parseError);
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse success response with better error handling
      let newBrand;
      try {
        newBrand = await response.json();
      } catch (parseError) {
        console.error('[useBrands] Failed to parse JSON response:', parseError);
        throw new Error("Failed to parse brand response from server");
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

  return {
    brands,
    isLoading,
    error,
    createBrand,
    refetch: async () => {
      // Clear cache and reload
      brandsCacheGlobal = null;
      brandsCachePromise = null;
      setIsLoading(true);
      setError(null);
    }
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
