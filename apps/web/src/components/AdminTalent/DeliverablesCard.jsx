import React from 'react';
import { CheckSquare, Calendar, FileText, AlertCircle, Edit2, Trash2 } from 'lucide-react';

/**
 * DeliverablesCard Component
 * 
 * Card component for displaying a deliverable/task.
 * Shows: title, status, due date, deal reference, and action buttons.
 */
export function DeliverablesCard({ deliverable, onEdit, onDelete, isLoading = false }) {
  if (!deliverable) return null;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-brand-black/5';
    if (status === 'COMPLETED') return 'bg-green-100';
    if (status === 'IN_PROGRESS') return 'bg-blue-100';
    if (status === 'NOT_STARTED') return 'bg-gray-100';
    if (status === 'OVERDUE') return 'bg-red-100';
    return 'bg-yellow-100';
  };

  const getStatusTextColor = (status) => {
    if (!status) return 'text-brand-black/60';
    if (status === 'COMPLETED') return 'text-green-700';
    if (status === 'IN_PROGRESS') return 'text-blue-700';
    if (status === 'NOT_STARTED') return 'text-gray-700';
    if (status === 'OVERDUE') return 'text-red-700';
    return 'text-yellow-700';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Not Set';
    return status.replace(/_/g, ' ');
  };

  const isOverdue = deliverable.dueDate && new Date(deliverable.dueDate) < new Date() && deliverable.status !== 'COMPLETED';
  const displayStatus = isOverdue ? 'OVERDUE' : deliverable.status;

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:border-brand-red/30 hover:-translate-y-1 group">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-brand-black/10 bg-brand-white/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-black truncate">
            {deliverable.title || deliverable.name || 'Untitled Deliverable'}
          </p>
          <p className="text-xs text-brand-black/50 truncate">
            {deliverable.deal?.brand?.name || deliverable.dealName || 'No deal'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            onClick={() => onEdit?.(deliverable)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
            title="Edit deliverable"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(deliverable)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete deliverable"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <CheckSquare className="w-3 h-3" />
            Status
          </span>
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(displayStatus)} ${getStatusTextColor(displayStatus)}`}>
            {getStatusLabel(displayStatus)}
          </span>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due Date
          </span>
          <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-brand-black/80'}`}>
            {formatDate(deliverable.dueDate)}
          </span>
        </div>

        {/* Completion Date (if applicable) */}
        {deliverable.completedDate && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Completed</span>
            <span className="text-xs text-green-600 font-semibold">
              {formatDate(deliverable.completedDate)}
            </span>
          </div>
        )}

        {/* Type/Category */}
        {deliverable.type && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Type
            </span>
            <span className="text-xs text-brand-black/80 bg-brand-black/5 rounded px-2 py-1">
              {deliverable.type}
            </span>
          </div>
        )}

        {/* Description */}
        {deliverable.description && (
          <p className="text-xs text-brand-black/60 line-clamp-2 pt-2 border-t border-brand-black/10">
            {deliverable.description}
          </p>
        )}
      </div>
    </div>
  );
}
