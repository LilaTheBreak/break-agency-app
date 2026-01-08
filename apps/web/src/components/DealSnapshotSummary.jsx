import React, { useState, useEffect } from "react";

/**
 * DealSnapshotSummary
 * 
 * Displays high-signal operational metrics about all deals:
 * - Open pipeline (non-completed, non-declined deals)
 * - Confirmed revenue (signed/active deals)
 * - Paid vs Outstanding (financial clarity)
 * - Deals needing attention (count of problematic deals)
 * - Closing this month (count + value)
 * 
 * Real data from backend /api/crm-deals/snapshot endpoint
 * GBP currency throughout
 */
export function DealSnapshotSummary() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/crm-deals/snapshot");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setSnapshot(data);
      } catch (err) {
        console.error("Failed to fetch snapshot:", err);
        setError("Could not load snapshot");
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <p className="text-sm text-brand-black/60">Loading snapshot…</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <p className="text-sm text-brand-red/70">{error || "No snapshot available"}</p>
      </div>
    );
  }

  const { snapshot: metrics, meta } = snapshot;

  // Format GBP amounts: 1000000 → "£1,000,000"
  const formatGBP = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return `£${Math.round(value).toLocaleString("en-GB")}`;
  };

  // Format counts
  const formatCount = (value) => {
    return value ?? "—";
  };

  return (
    <div className="space-y-4">
      {/* Summary cards in horizontal grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Open Pipeline */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Open Pipeline</p>
          <p className="mt-3 font-display text-2xl uppercase text-brand-black">
            {formatGBP(metrics.openPipeline)}
          </p>
          <p className="mt-2 text-[0.65rem] text-brand-black/50">Active (non-declined)</p>
        </div>

        {/* Card 2: Confirmed Revenue */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Confirmed</p>
          <p className="mt-3 font-display text-2xl uppercase text-brand-black">
            {formatGBP(metrics.confirmedRevenue)}
          </p>
          <p className="mt-2 text-[0.65rem] text-brand-black/50">Signed / live</p>
        </div>

        {/* Card 3: Paid vs Outstanding */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Paid</p>
          <p className="font-display text-lg uppercase text-brand-black">
            {formatGBP(metrics.paid)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-brand-black/50">Outstanding</p>
          <p className="font-display text-lg uppercase text-brand-red">
            {formatGBP(metrics.outstanding)}
          </p>
        </div>

        {/* Card 4: Needs Attention */}
        <div className={[
          "rounded-2xl border p-4",
          metrics.needsAttentionCount > 0
            ? "border-brand-red/30 bg-brand-red/5"
            : "border-brand-black/10 bg-brand-white"
        ].join(" ")}>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Attention</p>
          <p className={[
            "mt-3 font-display text-2xl uppercase",
            metrics.needsAttentionCount > 0
              ? "text-brand-red"
              : "text-brand-black"
          ].join(" ")}>
            {formatCount(metrics.needsAttentionCount)}
          </p>
          <p className="mt-2 text-[0.65rem] text-brand-black/50">Missing owner/stage/value</p>
        </div>

        {/* Card 5: Closing This Month */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Closing</p>
          <p className="font-display text-lg uppercase text-brand-black">
            {formatCount(metrics.closingThisMonthCount)} deal{metrics.closingThisMonthCount === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-brand-black/50">Value</p>
          <p className="font-display text-lg uppercase text-brand-black">
            {formatGBP(metrics.closingThisMonthValue)}
          </p>
        </div>
      </div>

      {/* Meta info: total deals, currency, generated time */}
      <div className="text-right text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/40">
        <p>
          {metrics.totalDeals || 0} deals total • {meta.currency} • Updated just now
        </p>
      </div>
    </div>
  );
}
