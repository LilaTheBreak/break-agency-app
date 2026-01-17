import React, { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";

/**
 * BrandSelect - Searchable brand selector with inline creation
 * 
 * Features:
 * - Search/filter brands by name
 * - Type to create new brand
 * - Prevent duplicate brands (case-insensitive)
 * - Show "Create new brand" action when no match found
 * - Works like modern CRM dropdowns (Notion, Linear, HubSpot)
 * 
 * Props:
 * - brands: Array of brand objects {id, name}
 * - value: Selected brandId
 * - onChange: (brandId) => void - Called when brand selected/created
 * - isLoading: bool - Show loading state
 * - disabled: bool - Disable interaction
 * - onCreateBrand: (brandName) => Promise<{id, name}> - Create brand function
 * - error?: string - Show error message
 */
export function BrandSelect({
  brands = [],
  value,
  onChange,
  isLoading = false,
  disabled = false,
  onCreateBrand,
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Get selected brand display name
  const selectedBrand = useMemo(() => {
    return (brands || []).find(b => b?.id === value);
  }, [brands, value]);

  // Advanced search: starts-with + contains matching (case-insensitive)
  // Searches both 'name' and 'brandName' fields
  const filteredBrands = useMemo(() => {
    if (!searchText.trim()) return brands || [];
    
    const search = searchText.toLowerCase().trim();
    const brandArray = (brands || []);
    
    // Helper to get searchable text from brand object
    const getSearchText = (brand) => {
      const name = brand?.name || '';
      const brandName = brand?.brandName || '';
      return `${name} ${brandName}`.toLowerCase();
    };
    
    // Split results: exact starts-with matches first, then contains matches
    const startsWithMatches = brandArray.filter(b => 
      getSearchText(b).split(' ').some(part => part.startsWith(search))
    );
    const containsMatches = brandArray.filter(b => {
      const text = getSearchText(b);
      return text.includes(search) && 
             !text.split(' ').some(part => part.startsWith(search));
    });
    
    return [...startsWithMatches, ...containsMatches];
  }, [brands, searchText]);

  // Check if search text matches any existing brand (case-insensitive)
  // Checks both name and brandName fields
  const exactMatch = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    if (!search) return false;
    
    return (brands || []).some(b => {
      const name = (b?.name || '').toLowerCase();
      const brandName = (b?.brandName || '').toLowerCase();
      return name === search || brandName === search;
    });
  }, [brands, searchText]);

  // Should show "Create new brand" option?
  // Only show if user typed something AND no exact match exists AND we have brands loaded
  const shouldShowCreate = searchText.trim().length > 0 && !exactMatch && !isLoading;

  const handleCreateBrand = useCallback(async () => {
    if (!onCreateBrand) {
      console.warn("onCreateBrand handler not provided");
      return;
    }

    const brandName = searchText.trim();
    if (!brandName) {
      setCreateError("Brand name cannot be empty");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const newBrand = await onCreateBrand(brandName);
      
      if (!newBrand || !newBrand.id) {
        throw new Error("API returned invalid brand response");
      }

      // Auto-select the newly created brand
      onChange(newBrand.id);
      setIsOpen(false);
      setSearchText("");
    } catch (err) {
      console.error("[BrandSelect] Create error:", err);
      setCreateError(err.message || "Failed to create brand. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }, [onCreateBrand, searchText]);

  const handleSelectBrand = useCallback((brandId) => {
    onChange(brandId);
    setIsOpen(false);
    setSearchText("");
  }, [onChange]);

  // Handle keyboard navigation and Esc key
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="relative w-full">
      {/* Main dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-left focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 disabled:opacity-50 flex items-center justify-between hover:border-brand-black/20 transition"
      >
        <span className={isLoading ? "text-brand-black/50" : "text-brand-black"}>
          {isLoading ? "Loading brands..." : selectedBrand?.name || "Select a brand"}
        </span>
        <svg 
          className={`h-4 w-4 text-brand-black/60 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown menu - Portal-like positioning to escape modal scroll */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] rounded-lg border border-brand-black/10 bg-brand-white shadow-xl">
          {/* Search input */}
          <div className="border-b border-brand-black/10 p-3 sticky top-0 bg-brand-white z-10">
            <input
              autoFocus
              type="text"
              placeholder="Search brands (e.g., 'nut' finds Neutrogena)…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg px-3 py-2 text-sm border border-brand-black/10 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          {/* Error message */}
          {createError && (
            <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-200">
              <p className="font-medium">Error creating brand:</p>
              <p>{createError}</p>
            </div>
          )}

          {/* Brand list or empty state */}
          <div className="max-h-72 overflow-y-auto">
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-linen/60 transition ${
                    value === brand.id ? "bg-brand-red/10 text-brand-red font-medium" : "text-brand-black"
                  }`}
                >
                  {brand.name || brand.brandName}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-brand-black/60">
                {searchText.trim() ? "No brands match your search" : "No brands available"}
              </div>
            )}

            {/* "Create new brand" action */}
            {shouldShowCreate && (
              <button
                onClick={handleCreateBrand}
                disabled={isCreating}
                className="w-full text-left px-3 py-2 text-sm border-t border-brand-black/10 bg-brand-linen/30 hover:bg-brand-linen/50 transition flex items-center gap-2 text-brand-red font-semibold disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {isCreating ? "Creating..." : `Create new brand "${searchText.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error display below dropdown (if not in dropdown) */}
      {error && !isOpen && (
        <div className="mt-1 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

export default BrandSelect;
