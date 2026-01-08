import React, { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * ExclusiveTalentSnapshot
 *
 * Displays an admin snapshot of exclusive talents with:
 * - Commercial metrics (pipeline, revenue, unpaid)
 * - Risk flags (deals without stage, overdue, unpaid, no manager)
 * - Quick actions (view talent, view deals)
 * 
 * @typedef {Object} TalentSnapshot
 * @property {string} id
 * @property {string} name
 * @property {string | null} displayName
 * @property {string | null} status
 * @property {string | null} representationType
 * @property {string | null} managerId
 * @property {string | null} managerName
 * @property {Object} deals
 * @property {number} deals.openPipeline
 * @property {number} deals.confirmedRevenue
 * @property {number} deals.paid
 * @property {number} deals.unpaid
 * @property {number} deals.activeCount
 * @property {Object} flags
 * @property {number} flags.dealsWithoutStage
 * @property {number} flags.overdueDeals
 * @property {number} flags.unpaidDeals
 * @property {boolean} flags.noManagerAssigned
 * @property {("HIGH"|"MEDIUM"|"LOW")} riskLevel
 * 
 * @typedef {Object} SnapshotResponse
 * @property {TalentSnapshot[]} talents
 * @property {Object} meta
 * @property {number} meta.totalExclusiveTalents
 * @property {number} meta.highRisk
 * @property {number} meta.mediumRisk
 * @property {string} meta.generatedAt
 */

export function ExclusiveTalentSnapshot() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFetch(
          "/api/admin/dashboard/exclusive-talent-snapshot"
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError("Admin access required");
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error("[ExclusiveTalentSnapshot]", err);
        setError("Failed to load exclusive talent snapshot");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <p className="text-sm text-brand-black/60">
          Loading exclusive talent snapshot…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <p className="text-sm text-brand-red/70">{error}</p>
      </div>
    );
  }

  if (!data || data.talents.length === 0) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <p className="text-sm text-brand-black/60">
          No exclusive talent currently assigned
        </p>
      </div>
    );
  }

  const formatGBP = (amount) => {
    if (!amount) return "£0";
    return `£${Math.round(amount).toLocaleString("en-GB")}`;
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">
            Exclusive Talent
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            Quick View
          </h3>
          <p className="mt-2 text-sm text-brand-black/60">
            {data.meta.totalExclusiveTalents} talent
            {data.meta.totalExclusiveTalents !== 1 ? "s" : ""} •{" "}
            {data.meta.highRisk} high risk • {data.meta.mediumRisk} medium risk
          </p>
        </div>
      </div>

      {/* Talent Cards */}
      <div className="space-y-3">
        {data.talents.map((talent) => {
          const riskColor =
            talent.riskLevel === "HIGH"
              ? "border-brand-red/30 bg-brand-red/5"
              : talent.riskLevel === "MEDIUM"
                ? "border-amber-300/30 bg-amber-100/5"
                : "border-brand-black/10 bg-brand-white";

          const riskBadge =
            talent.riskLevel === "HIGH"
              ? "bg-brand-red/10 text-brand-red"
              : talent.riskLevel === "MEDIUM"
                ? "bg-amber-100 text-amber-800"
                : "bg-brand-black/5 text-brand-black/60";

          return (
            <div
              key={talent.id}
              className={`rounded-2xl border p-4 ${riskColor}`}
            >
              {/* Header: Name + Status + Risk */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-brand-black">
                    {talent.displayName || talent.name}
                  </h4>
                  <p className="text-xs text-brand-black/50 mt-1">
                    Manager: {talent.managerName || "Unassigned"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[0.65rem] uppercase tracking-[0.35em] px-2 py-1 rounded-full bg-brand-black/5 text-brand-black/70">
                    {talent.status || "—"}
                  </span>
                  <span
                    className={`text-[0.65rem] uppercase tracking-[0.35em] px-2 py-1 rounded-full font-semibold ${riskBadge}`}
                  >
                    {talent.riskLevel}
                  </span>
                </div>
              </div>

              {/* Commercial Metrics: Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                {/* Open Pipeline */}
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 font-semibold">
                    Pipeline
                  </p>
                  <p className="text-sm font-display uppercase text-brand-black mt-1">
                    {formatGBP(talent.deals.openPipeline)}
                  </p>
                </div>

                {/* Confirmed Revenue */}
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 font-semibold">
                    Confirmed
                  </p>
                  <p className="text-sm font-display uppercase text-brand-black mt-1">
                    {formatGBP(talent.deals.confirmedRevenue)}
                  </p>
                </div>

                {/* Unpaid */}
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 font-semibold">
                    Unpaid
                  </p>
                  <p
                    className={`text-sm font-display uppercase mt-1 ${
                      talent.deals.unpaid > 0
                        ? "text-brand-red"
                        : "text-brand-black"
                    }`}
                  >
                    {formatGBP(talent.deals.unpaid)}
                  </p>
                </div>

                {/* Active Deals */}
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 font-semibold">
                    Active
                  </p>
                  <p className="text-sm font-display uppercase text-brand-black mt-1">
                    {talent.deals.activeCount}
                  </p>
                </div>

                {/* Flags Count */}
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 font-semibold">
                    Flags
                  </p>
                  <p
                    className={`text-sm font-display uppercase mt-1 ${
                      talent.flags.dealsWithoutStage > 0 ||
                      talent.flags.overdueDeals > 0 ||
                      talent.flags.unpaidDeals > 0
                        ? "text-brand-red"
                        : "text-brand-black"
                    }`}
                  >
                    {talent.flags.dealsWithoutStage +
                      talent.flags.overdueDeals +
                      talent.flags.unpaidDeals}
                  </p>
                </div>
              </div>

              {/* Flags: Inline */}
              {(talent.flags.dealsWithoutStage > 0 ||
                talent.flags.overdueDeals > 0 ||
                talent.flags.unpaidDeals > 0 ||
                talent.flags.noManagerAssigned) && (
                <div className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 space-y-1">
                  {talent.flags.dealsWithoutStage > 0 && (
                    <p>
                      ⚠️ {talent.flags.dealsWithoutStage} deal
                      {talent.flags.dealsWithoutStage !== 1 ? "s" : ""} without
                      stage
                    </p>
                  )}
                  {talent.flags.overdueDeals > 0 && (
                    <p>
                      ⚠️ {talent.flags.overdueDeals} overdue deal
                      {talent.flags.overdueDeals !== 1 ? "s" : ""}
                    </p>
                  )}
                  {talent.flags.unpaidDeals > 0 && (
                    <p>
                      ⚠️ {talent.flags.unpaidDeals} unpaid deal
                      {talent.flags.unpaidDeals !== 1 ? "s" : ""}
                    </p>
                  )}
                  {talent.flags.noManagerAssigned && (
                    <p>⚠️ No manager assigned</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 text-right text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/40">
        <p>Updated {new Date(data.meta.generatedAt).toLocaleTimeString()}</p>
      </div>
    </section>
  );
}
