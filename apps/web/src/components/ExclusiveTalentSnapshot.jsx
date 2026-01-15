import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";
import { ChevronDown, ChevronUp, AlertCircle, Users } from "lucide-react";

/**
 * ExclusiveTalentSnapshot - Risk-Focused Quick View
 *
 * Displays an admin snapshot of exclusive talents with:
 * - Risk-based sorting (high → medium → low)
 * - Tiered display: expanded for high-risk, compact for low-risk
 * - Focused metrics: Pipeline, Unpaid (default); Confirmed, Active (expanded)
 * - Issues section: Manager assignment, Overdue, Unpaid consolidated
 * - Manager assignment CTA: Prominent inline action
 * - Section controls: Toggle "show only needing attention"
 * 
 * Achieves the "quick view" goal:
 * - Identify who needs attention in < 3 seconds
 * - High-risk impossible to miss
 * - Low-risk doesn't clutter view
 */
export function ExclusiveTalentSnapshot() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTalents, setExpandedTalents] = useState(new Set());
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);

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

  // Helper: Count issues for a talent
  const countIssues = (talent) => {
    return (
      (talent.flags.dealsWithoutStage || 0) +
      (talent.flags.overdueDeals || 0) +
      (talent.flags.unpaidDeals || 0) +
      (talent.flags.noManagerAssigned ? 1 : 0)
    );
  };

  // Helper: Sort talents by risk, then by issue count
  const sortTalents = (talents) => {
    const sorted = [...talents].sort((a, b) => {
      // 1. Sort by risk level (HIGH → MEDIUM → LOW)
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const riskDiff =
        (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2);
      if (riskDiff !== 0) return riskDiff;

      // 2. Within risk level, sort by issue count (most issues first)
      const issuesA = countIssues(a);
      const issuesB = countIssues(b);
      if (issuesA !== issuesB) return issuesB - issuesA;

      // 3. Then by unpaid value (highest first)
      if (a.deals.unpaid !== b.deals.unpaid) {
        return (b.deals.unpaid || 0) - (a.deals.unpaid || 0);
      }

      // 4. Alphabetical fallback
      return (a.displayName || a.name).localeCompare(
        b.displayName || b.name
      );
    });

    // Filter if "show only at risk" is enabled
    if (showOnlyAtRisk) {
      return sorted.filter(
        (t) => t.riskLevel !== "LOW" || countIssues(t) > 0
      );
    }
    return sorted;
  };

  const toggleExpanded = (talentId) => {
    const newExpanded = new Set(expandedTalents);
    if (newExpanded.has(talentId)) {
      newExpanded.delete(talentId);
    } else {
      newExpanded.add(talentId);
    }
    setExpandedTalents(newExpanded);
  };

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
      <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">
              Exclusive Talent
            </p>
            <h3 className="font-display text-2xl uppercase text-brand-black">
              Quick View
            </h3>
            <p className="mt-2 text-sm text-brand-black/60">
              No exclusive talent currently assigned
            </p>
          </div>
          <Link
            to="/admin/talent"
            className="whitespace-nowrap rounded-full border border-brand-black bg-brand-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-black/90 transition-colors"
          >
            Manage Talent →
          </Link>
        </div>
      </section>
    );
  }

  const formatGBP = (amount) => {
    if (!amount) return "£0";
    return `£${Math.round(amount).toLocaleString("en-GB")}`;
  };

  const sortedTalents = sortTalents(data.talents);
  const atRiskCount = data.talents.filter(
    (t) => t.riskLevel !== "LOW" || countIssues(t) > 0
  ).length;

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      {/* Header with Section Title and Controls */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Title */}
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

        {/* Section Controls */}
        <div className="flex flex-wrap items-center gap-4 py-3 border-t border-brand-black/10">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showOnlyAtRisk}
              onChange={(e) => setShowOnlyAtRisk(e.target.checked)}
              className="w-4 h-4 accent-brand-red rounded"
            />
            <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60 group-hover:text-brand-black transition-colors">
              Show only needing attention ({atRiskCount})
            </span>
          </label>
          <div className="ml-auto">
            <Link
              to="/admin/talent"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-brand-black/60 hover:text-brand-black transition-colors"
            >
              View full list →
            </Link>
          </div>
        </div>
      </div>

      {/* Talent Rows - Risk-Based Layout */}
      <div className="space-y-2">
        {sortedTalents.map((talent) => {
          const isExpanded = expandedTalents.has(talent.id);
          const issues = countIssues(talent);
          const isHighRisk = talent.riskLevel === "HIGH";
          const isMediumRisk = talent.riskLevel === "MEDIUM";
          const shouldExpandByDefault = isHighRisk || issues > 0;

          // Color scheme based on risk
          const borderColor =
            talent.riskLevel === "HIGH"
              ? "border-brand-red/40"
              : talent.riskLevel === "MEDIUM"
                ? "border-amber-300/40"
                : "border-brand-black/10";

          const bgColor =
            talent.riskLevel === "HIGH"
              ? "bg-brand-red/3"
              : talent.riskLevel === "MEDIUM"
                ? "bg-amber-50/40"
                : "bg-brand-white";

          const riskBadgeBg =
            talent.riskLevel === "HIGH"
              ? "bg-brand-red/10 text-brand-red"
              : talent.riskLevel === "MEDIUM"
                ? "bg-amber-100/60 text-amber-900"
                : "bg-brand-black/5 text-brand-black/50";

          // For high-risk or with issues: show expanded; for low-risk with no issues: show compact
          const showCompact = !shouldExpandByDefault && !isExpanded;

          return (
            <div
              key={talent.id}
              className={`rounded-xl border transition-all duration-200 ${borderColor} ${bgColor}`}
            >
              {/* COMPACT ROW - Always visible */}
              <button
                onClick={() => toggleExpanded(talent.id)}
                className="w-full text-left px-4 py-3 hover:bg-brand-black/2 transition-colors rounded-xl flex items-center justify-between gap-3 group"
              >
                {/* Left: Name + Manager Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-brand-black truncate">
                      {talent.displayName || talent.name}
                    </h4>
                    {talent.flags.noManagerAssigned && (
                      <span className="text-[0.6rem] bg-brand-red/10 text-brand-red px-1.5 py-0.5 rounded whitespace-nowrap">
                        No Manager
                      </span>
                    )}
                    {isHighRisk && (
                      <span
                        className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded ${riskBadgeBg}`}
                      >
                        HIGH RISK
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-black/50 mt-1">
                    {talent.managerName || "Unassigned"}
                  </p>
                </div>

                {/* Middle: Key Metrics (Pipeline, Unpaid) */}
                <div className="hidden sm:flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/50">
                      Pipeline
                    </p>
                    <p className="text-sm font-semibold text-brand-black">
                      {formatGBP(talent.deals.openPipeline)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/50">
                      Unpaid
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        talent.deals.unpaid > 0
                          ? "text-brand-red"
                          : "text-brand-black"
                      }`}
                    >
                      {formatGBP(talent.deals.unpaid)}
                    </p>
                  </div>
                </div>

                {/* Right: Issues Badge + Expand Toggle */}
                <div className="flex items-center gap-2">
                  {issues > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-red/10">
                      <AlertCircle className="w-3 h-3 text-brand-red flex-shrink-0" />
                      <span className="text-xs font-semibold text-brand-red">
                        {issues}
                      </span>
                    </div>
                  )}
                  {shouldExpandByDefault || isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-brand-black/40 group-hover:text-brand-black/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-brand-black/40 group-hover:text-brand-black/60" />
                  )}
                </div>
              </button>

              {/* EXPANDED DETAILS - For high-risk or when clicked */}
              {(shouldExpandByDefault || isExpanded) && (
                <div className="border-t border-brand-black/10 px-4 py-3 space-y-3 bg-brand-black/2">
                  {/* Full Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/50 font-semibold">
                        Pipeline
                      </p>
                      <p className="text-sm font-semibold text-brand-black mt-1">
                        {formatGBP(talent.deals.openPipeline)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/50 font-semibold">
                        Confirmed
                      </p>
                      <p className="text-sm font-semibold text-brand-black mt-1">
                        {formatGBP(talent.deals.confirmedRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/50 font-semibold">
                        Unpaid
                      </p>
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          talent.deals.unpaid > 0
                            ? "text-brand-red"
                            : "text-brand-black"
                        }`}
                      >
                        {formatGBP(talent.deals.unpaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/50 font-semibold">
                        Active
                      </p>
                      <p className="text-sm font-semibold text-brand-black mt-1">
                        {talent.deals.activeCount}
                      </p>
                    </div>
                  </div>

                  {/* Issues Section */}
                  {issues > 0 && (
                    <div className="rounded-lg bg-brand-red/5 border border-brand-red/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Issues ({issues})
                      </p>
                      <ul className="space-y-1 text-xs text-brand-black/70">
                        {talent.flags.noManagerAssigned && (
                          <li className="flex items-center justify-between">
                            <span>No manager assigned</span>
                            <button className="px-2 py-1 rounded bg-brand-red text-white text-[0.6rem] font-semibold hover:bg-brand-red/90 transition-colors">
                              Assign
                            </button>
                          </li>
                        )}
                        {talent.flags.overdueDeals > 0 && (
                          <li>
                            {talent.flags.overdueDeals} overdue deal
                            {talent.flags.overdueDeals !== 1 ? "s" : ""}
                          </li>
                        )}
                        {talent.flags.unpaidDeals > 0 && (
                          <li>
                            {talent.flags.unpaidDeals} unpaid deal
                            {talent.flags.unpaidDeals !== 1 ? "s" : ""}
                          </li>
                        )}
                        {talent.flags.dealsWithoutStage > 0 && (
                          <li>
                            {talent.flags.dealsWithoutStage} deal
                            {talent.flags.dealsWithoutStage !== 1 ? "s" : ""}{" "}
                            missing stage
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.2em] text-brand-black/40 border-t border-brand-black/10 pt-4">
        <p>
          Updated {new Date(data.meta.generatedAt).toLocaleTimeString()}
        </p>
        <p>
          {sortedTalents.length} of {data.meta.totalExclusiveTalents}
        </p>
      </div>
    </section>
  );
}
