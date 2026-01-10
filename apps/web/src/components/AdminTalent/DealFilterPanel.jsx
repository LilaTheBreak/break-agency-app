import React, { useState, useCallback } from 'react';
import { ChevronDown, X, RotateCcw } from 'lucide-react';

/**
 * DealFilterPanel - Filter and sort deals by multiple criteria
 * 
 * Features:
 * - Filter by deal stage (NEW_LEAD, NEGOTIATION, CONTRACT_SENT, etc.)
 * - Filter by value range (min/max currency)
 * - Filter by close date range
 * - Sort options (newest first, highest value, brand A-Z)
 * - Active filter count badge
 * - Clear all filters button
 */
export default function DealFilterPanel({ 
  filters, 
  onFiltersChange, 
  dealCount = 0 
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Stage options matching deal stages
  const stageOptions = [
    { value: '', label: 'Opportunity (No Stage)' },
    { value: 'NEW_LEAD', label: 'In Discussion' },
    { value: 'NEGOTIATION', label: 'Negotiation' },
    { value: 'CONTRACT_SENT', label: 'Contract Sent' },
    { value: 'CONTRACT_SIGNED', label: 'Contract Signed' },
    { value: 'DELIVERABLES_IN_PROGRESS', label: 'Deliverables' },
    { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'LOST', label: 'Declined' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: '📅 Newest First' },
    { value: 'oldest', label: '📅 Oldest First' },
    { value: 'highestValue', label: '💰 Highest Value' },
    { value: 'lowestValue', label: '💰 Lowest Value' },
    { value: 'brandAZ', label: '🏢 Brand A-Z' },
    { value: 'brandZA', label: '🏢 Brand Z-A' },
  ];

  // Handle stage filter toggle
  const handleStageToggle = useCallback((stage) => {
    const newStages = filters.stages || [];
    const index = newStages.indexOf(stage);
    
    if (index > -1) {
      newStages.splice(index, 1);
    } else {
      newStages.push(stage);
    }

    onFiltersChange({
      ...filters,
      stages: newStages.length > 0 ? newStages : undefined,
    });
  }, [filters, onFiltersChange]);

  // Handle value range change
  const handleValueMinChange = useCallback((e) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    onFiltersChange({
      ...filters,
      valueMin: val,
    });
  }, [filters, onFiltersChange]);

  const handleValueMaxChange = useCallback((e) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    onFiltersChange({
      ...filters,
      valueMax: val,
    });
  }, [filters, onFiltersChange]);

  // Handle date range change
  const handleDateMinChange = useCallback((e) => {
    onFiltersChange({
      ...filters,
      dateMin: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  const handleDateMaxChange = useCallback((e) => {
    onFiltersChange({
      ...filters,
      dateMax: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  // Handle sort change
  const handleSortChange = useCallback((e) => {
    onFiltersChange({
      ...filters,
      sortBy: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onFiltersChange({
      stages: undefined,
      valueMin: undefined,
      valueMax: undefined,
      dateMin: undefined,
      dateMax: undefined,
      sortBy: undefined,
    });
  }, [onFiltersChange]);

  // Count active filters
  const activeFilterCount = [
    (filters.stages && filters.stages.length > 0) ? 1 : 0,
    filters.valueMin ? 1 : 0,
    filters.valueMax ? 1 : 0,
    filters.dateMin ? 1 : 0,
    filters.dateMax ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFilterCount > 0 || filters.sortBy;

  return (
    <div className="relative">
      {/* Filter Button with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ease-out ${
          hasActiveFilters
            ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm hover:shadow-md'
            : 'border-brand-black/10 bg-brand-white text-brand-black hover:border-brand-red/30 hover:bg-brand-red/2'
        }`}
      >
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-brand-red text-brand-white animate-pulse">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute z-20 top-full right-0 mt-2 w-80 rounded-xl border border-brand-black/10 bg-brand-white shadow-lg p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-brand-black">Filter & Sort Deals</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-brand-black/60 hover:text-brand-black rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Section */}
          <div className="mb-6 pb-6 border-b border-brand-black/10">
            <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-wider mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy || ''}
              onChange={handleSortChange}
              className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm text-brand-black focus:outline-none focus:border-brand-red"
            >
              <option value="">None</option>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter Section */}
          <div className="mb-6 pb-6 border-b border-brand-black/10">
            <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-wider mb-3">
              Pipeline Stage
            </label>
            <div className="space-y-2">
              {stageOptions.map((stage) => (
                <label key={stage.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(filters.stages || []).includes(stage.value)}
                    onChange={() => handleStageToggle(stage.value)}
                    className="w-4 h-4 rounded border-brand-black/20 text-brand-red focus:ring-brand-red cursor-pointer"
                  />
                  <span className="text-sm text-brand-black/80 group-hover:text-brand-black">
                    {stage.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Value Range Filter Section */}
          <div className="mb-6 pb-6 border-b border-brand-black/10">
            <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-wider mb-3">
              Deal Value Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.valueMin || ''}
                onChange={handleValueMinChange}
                className="flex-1 rounded-lg border border-brand-black/10 px-2 py-2 text-sm text-brand-black placeholder-brand-black/40 focus:outline-none focus:border-brand-red"
              />
              <span className="text-xs text-brand-black/60">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.valueMax || ''}
                onChange={handleValueMaxChange}
                className="flex-1 rounded-lg border border-brand-black/10 px-2 py-2 text-sm text-brand-black placeholder-brand-black/40 focus:outline-none focus:border-brand-red"
              />
            </div>
            <p className="text-xs text-brand-black/40 mt-2">Values in deal currency (GBP/USD)</p>
          </div>

          {/* Date Range Filter Section */}
          <div className="mb-6 pb-6 border-b border-brand-black/10">
            <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-wider mb-3">
              Close Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateMin || ''}
                onChange={handleDateMinChange}
                className="flex-1 rounded-lg border border-brand-black/10 px-2 py-2 text-xs text-brand-black focus:outline-none focus:border-brand-red"
              />
              <input
                type="date"
                value={filters.dateMax || ''}
                onChange={handleDateMaxChange}
                className="flex-1 rounded-lg border border-brand-black/10 px-2 py-2 text-xs text-brand-black focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Footer - Results & Clear */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-black/60">
              {dealCount === 1 ? '1 deal' : `${dealCount} deals`}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 text-xs text-brand-red hover:text-brand-red/70 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
