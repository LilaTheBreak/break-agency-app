import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useDashboardSummary } from "../hooks/useDashboardSummary.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isAwaitingApproval, loadOnboardingState } from "../lib/onboardingState.js";

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
  const { user, logout } = useAuth();
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

  const showApprovalHold = isAwaitingApproval(user);
  const onboardingLocal = user ? loadOnboardingState(user.email) : {};
  const connectPlatforms = onboardingLocal.responses?.platforms || [];

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
          <div className="relative min-w-0 flex-1 rounded-3xl border border-brand-black/10 bg-brand-white/70 p-6 shadow-brand">
            {showApprovalHold ? <ApprovalHoldOverlay onLogout={logout} platforms={connectPlatforms} /> : null}
            <div className={showApprovalHold ? "pointer-events-none blur-[2px] opacity-70" : ""}>
              <div className="space-y-6">
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
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-black/80">
            {(nextSteps && nextSteps.length ? nextSteps : ["No next steps queued by AI right now."]).map((step, index) => (
              <li key={index}>{step}</li>
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

function ApprovalHoldOverlay({ platforms, onLogout }) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformUrl, setPlatformUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState({});

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // Platform icons using actual icon components
  const PlatformIcon = ({ platform }) => {
    switch (platform) {
      case "Instagram":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case "TikTok":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      case "YouTube":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case "Twitter":
      case "X":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case "LinkedIn":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return <span className="text-base">🔗</span>;
    }
  };

  const uniquePlatforms = Array.from(new Set(platforms));

  const handleConnect = (platform) => {
    setSelectedPlatform(platform);
    setPlatformUrl("");
    setError(null);
    setShowConnectModal(true);
  };

  const handleSave = async () => {
    if (!platformUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/auth/social-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          platform: selectedPlatform,
          url: platformUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save social link");
      }

      const data = await response.json();
      setConnectedPlatforms((prev) => ({
        ...prev,
        [selectedPlatform]: platformUrl,
      }));
      
      setShowConnectModal(false);
      setSelectedPlatform(null);
      setPlatformUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center rounded-3xl bg-brand-black/30 backdrop-blur-sm">
      <div className="pointer-events-auto mt-6 w-full max-w-3xl space-y-4 rounded-2xl border border-brand-black/10 bg-white/95 p-6 text-center text-brand-black shadow-[0_18px_70px_rgba(0,0,0,0.25)]">
        <h3 className="font-display text-3xl uppercase leading-tight text-brand-black">Your account is being reviewed</h3>
        <p className="text-sm text-brand-black/80">
          Thanks for completing onboarding. Our team is reviewing your account — you’ll receive an email once you’re approved.
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">This usually takes 1–2 business days.</p>
        {uniquePlatforms.length ? (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-red">While you wait</p>
            <p className="mt-1 text-sm text-brand-black/80">Connect your socials now so we can calibrate faster.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {uniquePlatforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handleConnect(platform)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] shadow-sm transition hover:-translate-y-0.5 ${
                    connectedPlatforms[platform]
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-brand-black/15 bg-white text-brand-black hover:border-brand-red hover:text-brand-red"
                  }`}
                >
                  <PlatformIcon platform={platform} />
                  <span>{platform}</span>
                  {connectedPlatforms[platform] && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
          >
            Log out
          </button>
          <Link
            to="/"
            className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 hover:bg-brand-red"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>

    {/* Connection Modal */}
    {showConnectModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-brand-black/10 bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-xl uppercase text-brand-black">
              Connect {selectedPlatform}
            </h4>
            <button
              onClick={() => setShowConnectModal(false)}
              className="text-brand-black/60 hover:text-brand-black"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-2">
                Profile URL
              </label>
              <input
                type="url"
                value={platformUrl}
                onChange={(e) => setPlatformUrl(e.target.value)}
                placeholder={`https://${selectedPlatform?.toLowerCase()}.com/yourhandle`}
                className="w-full px-4 py-2 border border-brand-black/20 rounded-lg text-brand-black focus:outline-none focus:border-brand-red"
                autoFocus
              />
              <p className="mt-1 text-xs text-brand-black/60">
                Enter your full profile URL
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-red/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowConnectModal(false)}
                disabled={saving}
                className="flex-1 rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:bg-brand-black/5 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
