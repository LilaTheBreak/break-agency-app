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

interface SourceBreakdown {
  sourceId: string;
  platform: string;
  displayName: string;
  totalGross: number;
  totalNet: number;
  eventCount: number;
}

interface RevenueSummary {
  totalGross: number;
  totalNet: number;
  currency: string;
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

interface TalentRevenueDashboardProps {
  talentId?: string;
}

const TalentRevenueDashboard: FC<TalentRevenueDashboardProps> = ({ talentId: providedTalentId }) => {
  const [talentId, setTalentId] = useState(providedTalentId || "");
  const [sources, setSources] = useState<RevenueSource[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdown[]>([]);
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

  // Get talent ID from user context or parameter
  useEffect(() => {
    if (!providedTalentId) {
      // In production, would fetch from user context/session
      const storedTalentId = localStorage.getItem("talentId");
      if (storedTalentId) {
        setTalentId(storedTalentId);
      }
    }
  }, [providedTalentId]);

  // Fetch revenue data
  useEffect(() => {
    if (talentId) {
      fetchRevenueData();
    } else {
      setLoading(false);
    }
  }, [talentId]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for ~4x faster loading
      const [sourcesRes, summaryRes, sourceRes, goalsRes] = await Promise.all([
        fetch(`/api/revenue/sources/${talentId}`),
        fetch(`/api/revenue/summary/${talentId}`),
        fetch(`/api/revenue/by-source/${talentId}`),
        fetch(`/api/revenue/goals/${talentId}`)
      ]);

      // Process responses
      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.data || []);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }

      if (sourceRes.ok) {
        const sourceData = await sourceRes.json();
        setSourceBreakdown(sourceData.data || []);
      }

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
    if (!confirm("Delete this revenue source? This will not delete historical data.")) return;

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

  if (!talentId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Revenue dashboard requires a valid talent ID</p>
          <p className="text-sm text-gray-500">This feature is available for exclusive talent members</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading your revenue data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-gray-900">Your Revenue Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your earnings across all platforms and manage revenue goals</p>
        </div>

        {/* Error Message */}
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

        {/* Revenue Summary */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">£{summary.totalNet.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-gray-500">Net earnings</p>
                </div>
                <div className="text-4xl text-green-200">💰</div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Platforms</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">{summary.sourceCount}</p>
                  <p className="mt-1 text-xs text-gray-500">Connected sources</p>
                </div>
                <div className="text-4xl text-blue-200">🔗</div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">{summary.eventCount}</p>
                  <p className="mt-1 text-xs text-gray-500">Total tracked</p>
                </div>
                <div className="text-4xl text-purple-200">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue by Source */}
        {sourceBreakdown.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue by Source</h2>
            <div className="space-y-3">
              {sourceBreakdown.map((source) => (
                <div key={source.sourceId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{source.displayName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {source.platform} • {source.eventCount} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">£{source.totalNet.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">net</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Revenue Sources */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Revenue Sources</h2>
            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showAddSource ? "Cancel" : "+ Add Source"}
            </button>
          </div>

          {showAddSource && (
            <div className="mb-4 space-y-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={newSource.platform}
                  onChange={(e) => setNewSource({ ...newSource, platform: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="SHOPIFY">Shopify Store</option>
                  <option value="TIKTOK_SHOP">TikTok Shop</option>
                  <option value="LTK">LTK (Like To Know It)</option>
                  <option value="AMAZON">Amazon Affiliate</option>
                  <option value="CUSTOM">Custom Affiliate Program</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store/Account Name</label>
                <input
                  type="text"
                  placeholder="e.g., My Beauty Store, Patricia's Picks"
                  value={newSource.displayName}
                  onChange={(e) => setNewSource({ ...newSource, displayName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <input
                  type="text"
                  placeholder="Platform-specific account identifier"
                  value={newSource.externalAccountId}
                  onChange={(e) => setNewSource({ ...newSource, externalAccountId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleAddSource}
                className="w-full rounded-lg bg-green-600 py-2 text-white font-medium hover:bg-green-700 transition-colors"
              >
                Connect Source
              </button>
            </div>
          )}

          {sources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No revenue sources connected yet</p>
              <p className="text-gray-400 text-xs mt-1">Add your first platform to start tracking revenue</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{source.displayName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {source.platform} • Connected {new Date(source.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Goals */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Goals</h2>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showAddGoal ? "Cancel" : "+ Set Goal"}
            </button>
          </div>

          {showAddGoal && (
            <div className="mb-4 space-y-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <select
                  value={newGoal.goalType}
                  onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="MONTHLY_TOTAL">Monthly Revenue Target</option>
                  <option value="QUARTERLY_TOTAL">Quarterly Target</option>
                  <option value="ANNUAL_TOTAL">Annual Target</option>
                  <option value="PLATFORM_SPECIFIC">Platform-Specific Target</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (£)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {newGoal.goalType === "PLATFORM_SPECIFIC" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    value={newGoal.platform}
                    onChange={(e) => setNewGoal({ ...newGoal, platform: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a platform</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.platform}>
                        {source.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleAddGoal}
                className="w-full rounded-lg bg-green-600 py-2 text-white font-medium hover:bg-green-700 transition-colors"
              >
                Create Goal
              </button>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No goals set yet</p>
              <p className="text-gray-400 text-xs mt-1">Set a goal to track your progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((progress) => (
                <div key={progress.goal.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{progress.goal.goalType.replace(/_/g, " ")}</p>
                      {progress.goal.platform && (
                        <p className="text-xs text-gray-500 mt-1">{progress.goal.platform}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(progress.goal.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className={`text-sm font-bold ${progress.isOnTrack ? "text-green-600" : "text-orange-600"}`}>
                        {progress.percentageOfTarget}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          progress.isOnTrack ? "bg-green-500" : "bg-orange-500"
                        }`}
                        style={{ width: `${Math.min(progress.percentageOfTarget, 100)}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>£{progress.actualAmount.toFixed(2)} of £{progress.goal.targetAmount.toFixed(2)}</span>
                      <span>{progress.daysRemaining} days remaining</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentRevenueDashboard;
