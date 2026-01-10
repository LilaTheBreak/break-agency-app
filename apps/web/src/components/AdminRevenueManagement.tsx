import React, { useState, useEffect } from "react";
import type { FC } from "react";

interface RevenueSource {
  id: string;
  talentId: string;
  platform: string;
  displayName: string;
  externalAccountId?: string;
  status: string;
  createdAt: string;
}

interface RevenueEvent {
  id: string;
  revenueSourceId: string;
  date: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
  type: string;
  sourceReference?: string;
}

interface RevenueSummary {
  totalGross: number;
  totalNet: number;
  currency: string;
  sourceCount: number;
  eventCount: number;
}

interface PlatformBreakdown {
  platform: string;
  totalGross: number;
  totalNet: number;
  sourceCount: number;
  eventCount: number;
}

interface RevenueGoal {
  id: string;
  talentId: string;
  goalType: string;
  platform?: string;
  targetAmount: number;
  currency: string;
}

interface GoalProgress {
  goal: RevenueGoal;
  actualAmount: number;
  percentageOfTarget: number;
  isOnTrack: boolean;
  daysRemaining: number;
}

interface AdminRevenueManagementProps {
  talentId: string;
  isAdmin?: boolean;
}

// Platform icons mapping
const platformIcons = {
  SHOPIFY: "🛍️",
  TIKTOK_SHOP: "🎵",
  LTK: "📱",
  AMAZON: "🎁",
  CUSTOM: "🔗",
};

const AdminRevenueManagement: FC<AdminRevenueManagementProps> = ({ talentId, isAdmin = true }) => {
  const [sources, setSources] = useState<RevenueSource[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown[]>([]);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newSource, setNewSource] = useState({
    platform: "SHOPIFY",
    displayName: "",
    externalAccountId: "",
  });
  const [newGoal, setNewGoal] = useState({
    goalType: "MONTHLY_TOTAL",
    platform: "",
    targetAmount: 0,
  });

  // Fetch revenue data
  useEffect(() => {
    fetchRevenueData();
  }, [talentId]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sources
      const sourcesRes = await fetch(`/api/revenue/sources/${talentId}`);
      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.data || []);
      }

      // Fetch summary
      const summaryRes = await fetch(`/api/revenue/summary/${talentId}`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }

      // Fetch platform breakdown
      const platformRes = await fetch(`/api/revenue/by-platform/${talentId}`);
      if (platformRes.ok) {
        const platformData = await platformRes.json();
        setPlatformBreakdown(platformData.data || []);
      }

      // Fetch goals
      const goalsRes = await fetch(`/api/revenue/goals/${talentId}`);
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    try {
      const res = await fetch("/api/revenue/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentId,
          ...newSource,
        }),
      });

      if (res.ok) {
        setNewSource({ platform: "SHOPIFY", displayName: "", externalAccountId: "" });
        setShowAddSource(false);
        fetchRevenueData();
      } else {
        const error = await res.json();
        setError(error.error?.message || "Failed to create source");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating source");
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Delete this revenue source?")) return;

    try {
      const res = await fetch(`/api/revenue/sources/${sourceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRevenueData();
      } else {
        const error = await res.json();
        setError(error.error?.message || "Failed to delete source");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting source");
    }
  };

  const handleAddGoal = async () => {
    try {
      const res = await fetch("/api/revenue/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentId,
          ...newGoal,
        }),
      });

      if (res.ok) {
        setNewGoal({ goalType: "MONTHLY_TOTAL", platform: "", targetAmount: 0 });
        setShowAddGoal(false);
        fetchRevenueData();
      } else {
        const error = await res.json();
        setError(error.error?.message || "Failed to create goal");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating goal");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Delete this goal?")) return;

    try {
      const res = await fetch(`/api/revenue/goals/${goalId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRevenueData();
      } else {
        const error = await res.json();
        setError(error.error?.message || "Failed to delete goal");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting goal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-black/20 border-t-brand-red mx-auto"></div>
          <p className="text-sm text-brand-black/60">Loading commerce data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Error State */}
      {error && (
        <div className="rounded-3xl border border-red-200/50 bg-red-50/50 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.3em] text-red-600">Error</p>
              <p className="mt-1 text-sm text-brand-black/80">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Commerce Overview */}
      {summary && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl uppercase text-brand-black">Commerce Overview</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">This Month</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue Card */}
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-sm">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Total Revenue</p>
              <div className="mt-4">
                <p className="font-display text-2xl text-brand-black">£{summary.totalNet.toFixed(0)}</p>
                <p className="mt-2 text-xs text-brand-black/50">Gross: £{summary.totalGross.toFixed(2)}</p>
              </div>
            </div>

            {/* Active Sources Card */}
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-sm">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Connected</p>
              <div className="mt-4">
                <p className="font-display text-2xl text-brand-black">{summary.sourceCount}</p>
                <p className="mt-2 text-xs text-brand-black/50">Revenue source{summary.sourceCount !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Total Events Card */}
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-sm">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Transactions</p>
              <div className="mt-4">
                <p className="font-display text-2xl text-brand-black">{summary.eventCount}</p>
                <p className="mt-2 text-xs text-brand-black/50">Total tracked</p>
              </div>
            </div>

            {/* Average per Source Card */}
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-sm">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Avg per Source</p>
              <div className="mt-4">
                <p className="font-display text-2xl text-brand-black">
                  £{(summary.totalNet / (summary.sourceCount || 1)).toFixed(0)}
                </p>
                <p className="mt-2 text-xs text-brand-black/50">Per platform</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue by Platform */}
      {platformBreakdown.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl uppercase text-brand-black">Revenue by Platform</h2>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-sm">
            <div className="space-y-4">
              {platformBreakdown.map((platform, idx) => (
                <div key={platform.platform}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{(platformIcons as any)[platform.platform] || "💰"}</span>
                      <div>
                        <p className="font-semibold text-brand-black">{platform.platform}</p>
                        <p className="text-xs text-brand-black/50">
                          {platform.sourceCount} store{platform.sourceCount !== 1 ? "s" : ""} • {platform.eventCount} transaction{platform.eventCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg text-brand-black">£{platform.totalNet.toFixed(2)}</p>
                      <p className="text-xs text-brand-black/50">Gross: £{platform.totalGross.toFixed(2)}</p>
                    </div>
                  </div>
                  {idx < platformBreakdown.length - 1 && (
                    <div className="mt-4 border-t border-brand-black/5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Sources */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl uppercase text-brand-black">Revenue Sources</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="font-subtitle text-xs uppercase tracking-[0.3em] text-brand-red transition-colors hover:text-brand-red/80"
            >
              {showAddSource ? "Cancel" : "+ Add Source"}
            </button>
          )}
        </div>

        {showAddSource && (
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white/50 p-6">
            <div className="space-y-4">
              <div>
                <label className="font-subtitle block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">
                  Platform
                </label>
                <select
                  value={newSource.platform}
                  onChange={(e) => setNewSource({ ...newSource, platform: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none focus:ring-1 focus:ring-brand-red"
                >
                  <option value="SHOPIFY">Shopify</option>
                  <option value="TIKTOK_SHOP">TikTok Shop</option>
                  <option value="LTK">LTK (Like To Know It)</option>
                  <option value="AMAZON">Amazon Affiliate</option>
                  <option value="CUSTOM">Custom Affiliate</option>
                </select>
              </div>

              <div>
                <label className="font-subtitle block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Shopify Store"
                  value={newSource.displayName}
                  onChange={(e) => setNewSource({ ...newSource, displayName: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="font-subtitle block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">
                  Account ID
                </label>
                <input
                  type="text"
                  placeholder="e.g., shop_abc123def456"
                  value={newSource.externalAccountId}
                  onChange={(e) => setNewSource({ ...newSource, externalAccountId: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <button
                onClick={handleAddSource}
                className="w-full rounded-2xl bg-brand-red py-3 font-semibold text-brand-white text-sm uppercase tracking-[0.3em] transition-colors hover:bg-brand-red/90"
              >
                Connect Store
              </button>
            </div>
          </div>
        )}

        {sources.length === 0 ? (
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white/30 p-12 text-center">
            <p className="text-brand-black/60">No revenue sources connected yet.</p>
            {isAdmin && (
              <p className="mt-2 text-xs text-brand-black/40">
                Connect a Shopify store, TikTok Shop, LTK, or affiliate account to start tracking revenue.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <div key={source.id} className="group rounded-3xl border border-brand-black/10 bg-brand-white p-6 transition-all hover:border-brand-red/20 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{(platformIcons as any)[source.platform] || "💰"}</span>
                    <div>
                      <p className="font-semibold text-brand-black">{source.displayName}</p>
                      <p className="text-xs text-brand-black/50 mt-1">
                        {source.platform} • {new Date(source.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-brand-black/40 hover:text-brand-red"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Goals */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl uppercase text-brand-black">Revenue Goals</h2>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="font-subtitle text-xs uppercase tracking-[0.3em] text-brand-red transition-colors hover:text-brand-red/80"
            >
              {showAddGoal ? "Cancel" : "+ Add Goal"}
            </button>
          </div>

          {showAddGoal && (
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white/50 p-6">
              <div className="space-y-4">
                <div>
                  <label className="font-subtitle block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">
                    Goal Type
                  </label>
                  <select
                    value={newGoal.goalType}
                    onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                    className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  >
                    <option value="MONTHLY_TOTAL">Monthly Total</option>
                    <option value="QUARTERLY_TOTAL">Quarterly Total</option>
                    <option value="ANNUAL_TOTAL">Annual Total</option>
                    <option value="PLATFORM_SPECIFIC">Platform Specific</option>
                  </select>
                </div>

                <div>
                  <label className="font-subtitle block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">
                    Target Amount
                  </label>
                  <div className="flex items-center">
                    <span className="mr-2 text-brand-black">£</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) })}
                      className="flex-1 rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                </div>

                {newGoal.goalType === "PLATFORM_SPECIFIC" && (
                  <div>
                    <label className="font-subtitle block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">
                      Platform
                    </label>
                    <select
                      value={newGoal.platform}
                      onChange={(e) => setNewGoal({ ...newGoal, platform: e.target.value })}
                      className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    >
                      <option value="">Select platform</option>
                      <option value="SHOPIFY">Shopify</option>
                      <option value="TIKTOK_SHOP">TikTok Shop</option>
                      <option value="LTK">LTK</option>
                      <option value="AMAZON">Amazon Affiliate</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAddGoal}
                  className="w-full rounded-2xl bg-brand-red py-3 font-semibold text-brand-white text-sm uppercase tracking-[0.3em] transition-colors hover:bg-brand-red/90"
                >
                  Set Goal
                </button>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white/30 p-12 text-center">
              <p className="text-brand-black/60">No revenue goals set yet.</p>
              <p className="mt-2 text-xs text-brand-black/40">Create monthly, quarterly, or annual targets to track progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((progress) => (
                <div key={progress.goal.id} className="group rounded-3xl border border-brand-black/10 bg-brand-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-brand-black">
                        {progress.goal.goalType.replace(/_/g, " ")}
                      </p>
                      {progress.goal.platform && (
                        <p className="text-xs text-brand-black/50 mt-1">{progress.goal.platform}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(progress.goal.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-brand-black/40 hover:text-brand-red"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-black/60">Progress</span>
                      <span className="font-display text-lg text-brand-black">{Math.round(progress.percentageOfTarget)}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 rounded-full bg-brand-black/10 overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          progress.isOnTrack ? "bg-brand-red" : "bg-brand-black/40"
                        }`}
                        style={{ width: `${Math.min(progress.percentageOfTarget, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-brand-black/50">
                      <span>£{progress.actualAmount.toFixed(0)} of £{progress.goal.targetAmount}</span>
                      <span className={progress.isOnTrack ? "text-brand-black/60" : "text-brand-black/40"}>
                        {progress.daysRemaining} days left
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRevenueManagement;
