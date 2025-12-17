import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useDashboardSummary } from "../hooks/useDashboardSummary.js";

const DEFAULT_STATUS_SUMMARY = {
  tasksDue: 0,
  dueTomorrow: 0,
  pendingApprovals: 0,
  contentDue: 0,
  briefsReview: 0,
  nextSteps: [],
  payoutTotals: {
    pending: { amount: 0, count: 0, currency: "usd", mixedCurrencies: false }
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
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [userToggledNav, setUserToggledNav] = useState(false);
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

  useEffect(() => {
    // Auto-collapse nav on scroll (only if user hasn't manually toggled)
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (!userToggledNav) {
        if (currentScrollY > 150 && !navCollapsed) {
          setNavCollapsed(true);
        } else if (currentScrollY < 50 && navCollapsed) {
          setNavCollapsed(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navCollapsed, userToggledNav]);

  const handleNavToggle = () => {
    setNavCollapsed((prev) => !prev);
    setUserToggledNav(true);
    // Reset user toggle flag after 5 seconds so auto-collapse can resume
    setTimeout(() => setUserToggledNav(false), 5000);
  };

  const labelAbbrev = (label) =>
    (label || "")
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

  const navBaseClasses = [
    "flex items-center rounded-2xl border text-[0.72rem] font-semibold uppercase tracking-[0.3em] transition",
    navCollapsed ? "justify-center px-3 py-3" : "justify-start px-4 py-2"
  ].join(" ");

  const renderNavItemContent = (label) =>
    navCollapsed ? (
      <span className="text-xs leading-none">{labelAbbrev(label)}</span>
    ) : (
      <span className="text-left">{label}</span>
    );

  const renderNavigation = () => {
    if (navLinks.length > 0) {
      return navLinks.map((link) => (
        <NavLink
          key={link.to}
          end={link.end}
          to={link.to}
          className={({ isActive }) =>
            [
              "w-full",
              navBaseClasses,
              isActive
                ? "border-brand-red bg-brand-red text-brand-white"
                : "border-brand-black/20 text-brand-black hover:-translate-y-0.5 hover:bg-brand-black/5"
            ].join(" ")
          }
        >
          {renderNavItemContent(link.label)}
        </NavLink>
      ));
    }
    return (navigation || []).map((item) => {
      if (item && typeof item === "object") {
        if (item.to) {
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "w-full",
                navBaseClasses,
                "border-brand-black/20 text-brand-black hover:-translate-y-0.5 hover:bg-brand-black/5"
              ].join(" ")}
            >
              {renderNavItemContent(item.label)}
            </Link>
          );
        }
        if (item.anchor) {
          const isActive = hash === item.anchor || (!hash && item.default);
          return (
            <a
              key={item.anchor}
              href={item.anchor}
              className={`w-full ${navBaseClasses} ${
                isActive
                  ? "border-brand-red bg-brand-red text-brand-white"
                  : "border-brand-black/20 text-brand-black hover:-translate-y-0.5 hover:bg-brand-black/5"
              }`}
            >
              {renderNavItemContent(item.label)}
            </a>
          );
        }
      }
      return (
        <span
          key={item}
          className={["w-full", navBaseClasses, "border-brand-black/20"].join(" ")}
        >
          {renderNavItemContent(item)}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-black">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-12">
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
        <div
          className={[
            "mt-2 flex flex-col gap-6 lg:flex-row",
            navCollapsed ? "lg:gap-4" : "lg:gap-6"
          ].join(" ")}
        >
          {(navLinks.length > 0 || (navigation || []).length > 0) && (
            <aside
              className={[
                "w-full rounded-3xl border border-brand-black/10 bg-brand-white p-4 shadow-brand transition-all",
                "lg:sticky lg:top-8 lg:self-start lg:shadow-brand/40",
                navCollapsed ? "lg:w-[104px]" : "lg:w-[260px]"
              ].join(" ")}
            >
              <div className={navCollapsed ? "flex justify-center" : "flex items-center justify-between gap-3"}>
                <button
                  type="button"
                  onClick={handleNavToggle}
                  className={[
                    "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold uppercase tracking-[0.2em] transition",
                    navCollapsed
                      ? "bg-brand-red text-brand-white shadow-brand hover:-translate-y-0.5"
                      : "border border-brand-black/20 bg-brand-ivory text-brand-black hover:-translate-y-0.5 hover:bg-brand-black/5"
                  ].join(" ")}
                  aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                  aria-pressed={navCollapsed}
                >
                  <img
                    src="/B Logo Mark.png"
                    alt="Break logo"
                    className="h-8 w-8 object-contain"
                  />
                </button>
                {!navCollapsed ? (
                  <button
                    type="button"
                    onClick={handleNavToggle}
                    className="rounded-2xl border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                  >
                    Collapse
                  </button>
                ) : null}
              </div>
              {!navCollapsed ? (
                <>
                  <p className="mt-4 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">Navigation</p>
                  <div className="mt-3 flex flex-col gap-2">{renderNavigation()}</div>
                </>
              ) : null}
            </aside>
          )}
          <div className="min-w-0 flex-1 rounded-3xl border border-brand-black/10 bg-brand-white/70 p-6 shadow-brand">
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
