import React from 'react';
import { FileText, Calendar, CheckCircle, AlertCircle, Edit2, Trash2, Download } from 'lucide-react';

/**
 * ContractsCard Component
 * 
 * Card component for displaying a contract.
 * Shows: title, status, signed date, parties, and action buttons.
 */
export function ContractsCard({ contract, onEdit, onDelete, onDownload, isLoading = false }) {
  if (!contract) return null;

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
    if (status === 'SIGNED') return 'bg-green-100';
    if (status === 'PENDING') return 'bg-yellow-100';
    if (status === 'EXPIRED') return 'bg-red-100';
    return 'bg-gray-100';
  };

  const getStatusTextColor = (status) => {
    if (!status) return 'text-brand-black/60';
    if (status === 'SIGNED') return 'text-green-700';
    if (status === 'PENDING') return 'text-yellow-700';
    if (status === 'EXPIRED') return 'text-red-700';
    return 'text-gray-700';
  };

  const getStatusIcon = (status) => {
    if (status === 'SIGNED') return CheckCircle;
    if (status === 'EXPIRED') return AlertCircle;
    return FileText;
  };

  const StatusIcon = getStatusIcon(contract.status);

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:border-brand-red/30 hover:-translate-y-1 group">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-brand-black/10 bg-brand-white/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-black truncate">
            {contract.title || contract.name || 'Untitled Contract'}
          </p>
          <p className="text-xs text-brand-black/50 truncate">
            {contract.counterparty || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {contract.fileUrl && (
            <button
              onClick={() => onDownload?.(contract)}
              disabled={isLoading}
              className="p-1.5 text-brand-black/40 hover:text-brand-blue transition-colors disabled:opacity-50"
              title="Download contract"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit?.(contract)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
            title="Edit contract"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(contract)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete contract"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Status</span>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${getStatusTextColor(contract.status)}`} />
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(contract.status)} ${getStatusTextColor(contract.status)}`}>
              {contract.status || 'Draft'}
            </span>
          </div>
        </div>

        {/* Signed Date */}
        {contract.signedDate && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Signed
            </span>
            <span className="text-xs text-brand-black/80">
              {formatDate(contract.signedDate)}
            </span>
          </div>
        )}

        {/* Expiry Date */}
        {contract.expiryDate && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Expires
            </span>
            <span className={`text-xs font-semibold ${new Date(contract.expiryDate) < new Date() ? 'text-red-600' : 'text-brand-black/80'}`}>
              {formatDate(contract.expiryDate)}
            </span>
          </div>
        )}

        {/* Notes */}
        {contract.notes && (
          <p className="text-xs text-brand-black/60 line-clamp-2 pt-2 border-t border-brand-black/10">
            {contract.notes}
          </p>
        )}
      </div>
    </div>
  );
}
