import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useDashboardSummary } from "../hooks/useDashboardSummary.js";

const DEFAULT_STATUS_SUMMARY = {
  tasksDue: 5,
  dueTomorrow: 3,
  pendingApprovals: 4,
  contentDue: 6,
  briefsReview: 2,
  nextSteps: [
    "AI recommends reallocating one producer to the Luxury drop tasks to maintain SLA.",
    "Send finance reminder for the £22K outstanding invoice tied to Campaign Q3.",
    "Review the AI banking brief comments before tomorrow's stand-up."
  ],
  payoutTotals: {
    pending: { amount: 2200000, count: 4, currency: "usd", mixedCurrencies: false }
  },
  invoiceTotals: {},
  reconciledThisWeek: 0
};

export function DashboardShell({
  title,
  subtitle,
  navigation,
  navLinks = [],
  children,
  statusSummary = {},
  role,
  showStatusSummary = false
}) {
  const location = useLocation();
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const { summary, loading: summaryLoading, error: summaryError } = useDashboardSummary(role);
  const mergedSummary = useMemo(
    () => ({ ...DEFAULT_STATUS_SUMMARY, ...statusSummary, ...(summary || {}) }),
    [statusSummary, summary]
  );
  const payoutPending = mergedSummary.payoutTotals?.pending;
  const statusTiles = [
    {
      label: "Tasks due",
      value: formatCount(mergedSummary.tasksDue),
      detail: "Across all queues",
      to: "/admin/tasks"
    },
    { label: "Due tomorrow", value: formatCount(mergedSummary.dueTomorrow), detail: "Next 24h" },
    {
      label: "Payouts pending",
      value: formatMoneyMetric(payoutPending),
      detail: payoutPending?.count ? `${payoutPending.count} payouts` : "Awaiting release"
    },
    { label: "Pending approvals", value: formatCount(mergedSummary.pendingApprovals), detail: "Awaiting admin review" },
    { label: "Content due", value: formatCount(mergedSummary.contentDue), detail: "Assets expected" },
    { label: "Briefs needing review", value: formatCount(mergedSummary.briefsReview), detail: "Submitted briefs" }
  ];

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-black">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="space-y-3">
          <p className="font-subtitle text-xs uppercase tracking-[0.4em] text-brand-red">
            Secure console
          </p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-brand-black">
            <span className="inline-flex h-1 w-12 rounded-full bg-brand-red align-middle" />
            <span className="ml-3">{title}</span>
          </h1>
          <p className="text-base text-brand-black/70">{subtitle}</p>
        </div>
        {navLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                end={link.end}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "rounded-full border px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.3em]",
                    isActive ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20 hover:bg-brand-black/5"
                  ].join(" ")
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(navigation || []).map((item) => {
              if (item && typeof item === "object" && item.anchor) {
                const isActive = hash === item.anchor || (!hash && item.default);
                return (
                  <a
                    key={item.anchor}
                    href={item.anchor}
                    className={`rounded-full border px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.25em] ${
                      isActive ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20 hover:bg-brand-black/5"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <span
                  key={item}
                  className="rounded-full border border-brand-black/20 px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.25em]"
                >
                  {item}
                </span>
              );
            })}
          </div>
        )}
        <div className="rounded-billboard border border-brand-black/10 bg-brand-white/70 p-6 shadow-brand">
          {showStatusSummary ? (
            <DashboardStatusGrid
              tiles={statusTiles}
              nextSteps={mergedSummary.nextSteps}
              loading={summaryLoading}
              error={summaryError}
            />
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

function DashboardStatusGrid({ tiles, nextSteps, loading, error }) {
  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((tile) => {
          const content = (
            <>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{tile.label}</p>
              <p className="font-display text-3xl uppercase text-brand-black">
                {loading ? "…" : tile.value ?? "—"}
              </p>
              <p className="text-xs text-brand-black/60">{tile.detail}</p>
            </>
          );
          return tile.to ? (
            <Link
              key={tile.label}
              to={tile.to}
              className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4 transition hover:-translate-y-0.5 hover:bg-brand-white"
            >
              {content}
            </Link>
          ) : (
            <div
              key={tile.label}
              className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4"
            >
              {content}
            </div>
          );
        })}
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">AI-generated next steps</p>
        {loading ? (
          <p className="mt-3 text-sm text-brand-black/60">Loading insights…</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
            {(nextSteps && nextSteps.length ? nextSteps : ["No next steps queued by AI right now."]).map((step, index) => (
              <li key={index}>• {step}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatCount(value) {
  if (typeof value === "number") return value;
  return value ?? "—";
}

function formatMoneyMetric(entry) {
  if (!entry) return "—";
  if (entry.mixedCurrencies) {
    return `${entry.count ?? 0} payouts`;
  }
  return formatCurrency(entry.amount ?? 0, entry.currency);
}

function formatCurrency(amount = 0, currency = "usd") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}
