import React from "react";
import { Calendar, Building2, DollarSign, Trash2, Edit2 } from "lucide-react";
import { DealStatusBadge, getStageColor } from "./DealStatusBadge.jsx";
import { toast } from "react-hot-toast";

/**
 * DealTrackerCard Component
 * 
 * Card component showing individual deal with key metrics.
 * Displays: brand, value, status, close date, and action buttons.
 */
export function DealTrackerCard({ deal, onEdit, onDelete, isLoading = false }) {
  if (!deal) return null;

  const formatCurrency = (value, currency = "GBP") => {
    if (!value) return "—";
    return `${currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}${(
      value / 1000
    ).toFixed(1)}k`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue =
    deal.expectedClose && new Date(deal.expectedClose) < new Date() && !["COMPLETED", "LOST"].includes(deal.stage);

  const bgColor = getStageColor(deal.stage);

  return (
    <div
      className={`rounded-2xl border border-brand-black/10 ${bgColor} overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:border-brand-red/30 hover:-translate-y-1 group`}
    >
      {/* Header with Status and Actions */}
      <div className="flex items-start justify-between border-b border-brand-black/10 bg-brand-white/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <DealStatusBadge stage={deal.stage} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            onClick={() => onEdit?.(deal)}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
            title="Edit deal"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this deal? This action cannot be undone.")) {
                onDelete?.(deal.id);
              }
            }}
            disabled={isLoading}
            className="p-1.5 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
            title="Delete deal"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Brand */}
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-brand-black/40 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Brand</p>
            <p className="text-sm font-semibold text-brand-black truncate">{deal.brand?.name || deal.brandId || "—"}</p>
          </div>
        </div>

        {/* Value */}
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-brand-black/40 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Value</p>
            <p className="text-sm font-semibold text-brand-black">
              {formatCurrency(deal.value, deal.currency || "GBP")}
            </p>
            {deal.paymentStatus && (
              <p className="text-xs text-brand-black/50 mt-1">{deal.paymentStatus}</p>
            )}
          </div>
        </div>

        {/* Close Date */}
        <div className="flex items-start gap-2">
          <Calendar
            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
              isOverdue ? "text-brand-red" : "text-brand-black/40"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Expected Close</p>
            <p className={`text-sm font-semibold ${isOverdue ? "text-brand-red" : "text-brand-black"}`}>
              {formatDate(deal.expectedClose)}
            </p>
            {isOverdue && <p className="text-xs text-brand-red mt-1 font-semibold">Overdue</p>}
          </div>
        </div>

        {/* Description */}
        {deal.description && (
          <div className="pt-2 border-t border-brand-black/10">
            <p className="text-xs text-brand-black/70 line-clamp-2">{deal.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
