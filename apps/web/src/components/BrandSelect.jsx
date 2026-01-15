import React, { useState, useMemo } from "react";
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
    return brands.find(b => b.id === value);
  }, [brands, value]);

  // Filter brands by search text
  const filteredBrands = useMemo(() => {
    if (!searchText.trim()) return brands;
    const search = searchText.toLowerCase().trim();
    return brands.filter(b => b.name.toLowerCase().includes(search));
  }, [brands, searchText]);

  // Check if search text matches any existing brand (case-insensitive)
  const exactMatch = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    return brands.some(b => b.name.toLowerCase() === search);
  }, [brands, searchText]);

  // Should show "Create new brand" option?
  const shouldShowCreate = searchText.trim().length > 0 && !exactMatch;

  const handleCreateBrand = async () => {
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
  };

  const handleSelectBrand = (brandId) => {
    onChange(brandId);
    setIsOpen(false);
    setSearchText("");
  };

  return (
    <div className="relative w-full">
      {/* Main dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm text-left focus:border-brand-red focus:outline-none disabled:opacity-50 flex items-center justify-between hover:border-brand-black/20 transition"
      >
        <span className="text-brand-black">
          {isLoading ? "Loading brands..." : selectedBrand?.name || "Select a brand"}
        </span>
        <svg className="h-4 w-4 text-brand-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-brand-black/10 bg-brand-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-brand-black/10 p-2">
            <input
              autoFocus
              type="text"
              placeholder="Search or type brand name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded px-2 py-2 text-sm border border-brand-black/10 focus:border-brand-red focus:outline-none"
            />
          </div>

          {/* Error message */}
          {createError && (
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-b border-red-200">
              {createError}
            </div>
          )}

          {/* Brand list or empty state */}
          <div className="max-h-64 overflow-y-auto">
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-linen/50 transition ${
                    value === brand.id ? "bg-brand-red/10 text-brand-red" : "text-brand-black"
                  }`}
                >
                  {brand.name}
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
