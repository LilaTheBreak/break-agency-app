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
}

const AdminRevenueManagement: FC<AdminRevenueManagementProps> = ({ talentId }) => {
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Revenue Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">Total Revenue (Net)</div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              £{summary.totalNet.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-gray-500">Gross: £{summary.totalGross.toFixed(2)}</div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">Active Sources</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{summary.sourceCount}</div>
            <div className="mt-1 text-xs text-gray-500">Connected platforms</div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="mt-2 text-2xl font-bold text-purple-600">{summary.eventCount}</div>
            <div className="mt-1 text-xs text-gray-500">Transactions tracked</div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">Avg per Source</div>
            <div className="mt-2 text-2xl font-bold text-indigo-600">
              £{(summary.totalNet / (summary.sourceCount || 1)).toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-gray-500">Per platform</div>
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900">Revenue by Platform</h3>
          <div className="mt-4 space-y-3">
            {platformBreakdown.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="font-medium text-gray-900">{platform.platform}</div>
                  <div className="text-xs text-gray-500">
                    {platform.sourceCount} source{platform.sourceCount !== 1 ? "s" : ""} • {platform.eventCount} events
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">£{platform.totalNet.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Gross: £{platform.totalGross.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Sources */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Sources</h3>
          <button
            onClick={() => setShowAddSource(!showAddSource)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
          >
            {showAddSource ? "Cancel" : "Add Source"}
          </button>
        </div>

        {showAddSource && (
          <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <select
                value={newSource.platform}
                onChange={(e) => setNewSource({ ...newSource, platform: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="SHOPIFY">Shopify</option>
                <option value="TIKTOK_SHOP">TikTok Shop</option>
                <option value="LTK">LTK (Like To Know It)</option>
                <option value="AMAZON">Amazon Affiliate</option>
                <option value="CUSTOM">Custom Affiliate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                placeholder="e.g., My Shopify Store"
                value={newSource.displayName}
                onChange={(e) => setNewSource({ ...newSource, displayName: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">External Account ID</label>
              <input
                type="text"
                placeholder="e.g., shop_abc123def456"
                value={newSource.externalAccountId}
                onChange={(e) => setNewSource({ ...newSource, externalAccountId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={handleAddSource}
              className="w-full rounded-lg bg-green-600 py-2 text-white text-sm font-medium hover:bg-green-700"
            >
              Create Source
            </button>
          </div>
        )}

        {sources.length === 0 ? (
          <div className="mt-4 text-center text-gray-500">No revenue sources yet. Add one to get started.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <div className="font-medium text-gray-900">{source.displayName}</div>
                  <div className="text-xs text-gray-500">
                    {source.platform} • Added {new Date(source.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Goals */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Goals</h3>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
          >
            {showAddGoal ? "Cancel" : "Add Goal"}
          </button>
        </div>

        {showAddGoal && (
          <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal Type</label>
              <select
                value={newGoal.goalType}
                onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="MONTHLY_TOTAL">Monthly Total</option>
                <option value="QUARTERLY_TOTAL">Quarterly Total</option>
                <option value="ANNUAL_TOTAL">Annual Total</option>
                <option value="PLATFORM_SPECIFIC">Platform Specific</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Target Amount (£)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {newGoal.goalType === "PLATFORM_SPECIFIC" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Platform</label>
                <select
                  value={newGoal.platform}
                  onChange={(e) => setNewGoal({ ...newGoal, platform: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              className="w-full rounded-lg bg-green-600 py-2 text-white text-sm font-medium hover:bg-green-700"
            >
              Create Goal
            </button>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="mt-4 text-center text-gray-500">No goals set yet. Add one to track progress.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {goals.map((progress) => (
              <div key={progress.goal.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{progress.goal.goalType.replace(/_/g, " ")}</div>
                    {progress.goal.platform && (
                      <div className="text-xs text-gray-500">{progress.goal.platform}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(progress.goal.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{progress.percentageOfTarget}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress.isOnTrack ? "bg-green-600" : "bg-orange-600"
                      }`}
                      style={{ width: `${Math.min(progress.percentageOfTarget, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>£{progress.actualAmount.toFixed(2)} of £{progress.goal.targetAmount}</span>
                    <span>{progress.daysRemaining} days left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenueManagement;
