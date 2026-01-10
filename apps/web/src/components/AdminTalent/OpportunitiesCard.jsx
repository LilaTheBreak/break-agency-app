import React from 'react';
import { Zap, Calendar, Building2, TrendingUp, Edit2, Trash2 } from 'lucide-react';

/**
 * OpportunitiesCard Component
 * 
 * Card component for displaying a sales opportunity.
 * Shows: brand, value, priority, close date, and action buttons.
 */
export function OpportunitiesCard({ opportunity, onEdit, onDelete, isLoading = false }) {
  if (!opportunity) return null;

  const formatCurrency = (value) => {
    if (!value) return '—';
    return `£${(value / 1000).toFixed(1)}k`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-brand-black/5';
    if (priority === 'HIGH') return 'bg-red-100';
    if (priority === 'MEDIUM') return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getPriorityTextColor = (priority) => {
    if (!priority) return 'text-brand-black/60';
    if (priority === 'HIGH') return 'text-red-700';
    if (priority === 'MEDIUM') return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:border-brand-red/30 hover:-translate-y-1 group">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-brand-black/10 bg-brand-white/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-black truncate">
            {opportunity.brand?.name || opportunity.brandName || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            onClick={() => onEdit?.(opportunity)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
            title="Edit opportunity"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(opportunity)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete opportunity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Value */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Potential Value
          </span>
          <span className="font-semibold text-brand-black">
            {formatCurrency(opportunity.estimatedValue)}
          </span>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Priority
          </span>
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(opportunity.priority)} ${getPriorityTextColor(opportunity.priority)}`}>
            {opportunity.priority || 'Normal'}
          </span>
        </div>

        {/* Target Close Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Target Close
          </span>
          <span className="text-xs text-brand-black/80">
            {formatDate(opportunity.targetCloseDate)}
          </span>
        </div>

        {/* Description */}
        {opportunity.description && (
          <p className="text-xs text-brand-black/60 line-clamp-2 pt-2 border-t border-brand-black/10">
            {opportunity.description}
          </p>
        )}
      </div>
    </div>
  );
}
