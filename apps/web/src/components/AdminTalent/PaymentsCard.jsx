import React from 'react';
import { DollarSign, Calendar, TrendingUp, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';

/**
 * PaymentsCard Component
 * 
 * Card component for displaying a payment record.
 * Shows: amount, status, due date, deal reference, and action buttons.
 */
export function PaymentsCard({ payment, onEdit, onDelete, isLoading = false }) {
  if (!payment) return null;

  const formatCurrency = (value, currency = 'GBP') => {
    if (!value) return '—';
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
    return `${symbol}${(value / 1000).toFixed(1)}k`;
  };

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
    if (status === 'PAID') return 'bg-green-100';
    if (status === 'PENDING') return 'bg-yellow-100';
    if (status === 'OVERDUE') return 'bg-red-100';
    return 'bg-gray-100';
  };

  const getStatusTextColor = (status) => {
    if (!status) return 'text-brand-black/60';
    if (status === 'PAID') return 'text-green-700';
    if (status === 'PENDING') return 'text-yellow-700';
    if (status === 'OVERDUE') return 'text-red-700';
    return 'text-gray-700';
  };

  const isOverdue = payment.status === 'PENDING' && payment.dueDate && new Date(payment.dueDate) < new Date();

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:border-brand-red/30 hover:-translate-y-1 group">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-brand-black/10 bg-brand-white/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-black">
            {payment.deal?.brand?.name || payment.dealName || 'Payment'}
          </p>
          <p className="text-xs text-brand-black/50">
            {payment.description || 'Invoice'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            onClick={() => onEdit?.(payment)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
            title="Edit payment"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(payment)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete payment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Amount
          </span>
          <span className="font-semibold text-brand-black">
            {formatCurrency(payment.amount, payment.currency)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            {payment.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            Status
          </span>
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(isOverdue ? 'OVERDUE' : payment.status)} ${getStatusTextColor(isOverdue ? 'OVERDUE' : payment.status)}`}>
            {isOverdue ? 'Overdue' : payment.status || 'Pending'}
          </span>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due Date
          </span>
          <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-brand-black/80'}`}>
            {formatDate(payment.dueDate)}
          </span>
        </div>

        {/* Paid Date (if applicable) */}
        {payment.paidDate && (
          <div className="flex items-center justify-between pt-2 border-t border-brand-black/10">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Paid On</span>
            <span className="text-xs text-green-600 font-semibold">
              {formatDate(payment.paidDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
