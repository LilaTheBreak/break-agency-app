import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend as ChartLegend, Tooltip as ChartTooltip } from 'recharts';
import SkeletonLoader from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';

interface EnterpriseValueMetrics {
  id: string;
  talentId: string;
  totalMRR: number;
  recurringRevenue: number;
  recurringPercent: number;
  founderDependentRevenue: number;
  founderDependentPercent: number;
  creatorOwnedPercent: number;
  platformRiskPercent: number;
  concentrationRisk: number;
  assetInventoryValue: number;
  assetCount: number;
  updatedAt: string;
}

interface HistoryData {
  date: string;
  mrrValue: number;
  recurringPercent: number;
}

const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4'];

interface Props {
  talentId: string;
  onLoadingChange?: (loading: boolean) => void;
}

const EnterpriseValueDashboard: React.FC<Props> = ({ talentId, onLoadingChange }) => {
  const [metrics, setMetrics] = useState<EnterpriseValueMetrics | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current metrics
        const metricsResponse = await fetch(`/api/enterprise-value/${talentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!metricsResponse.ok) {
          throw new Error(`Failed to fetch metrics: ${metricsResponse.status}`);
        }

        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);

        // Fetch 12-month history
        const historyResponse = await fetch(
          `/api/enterprise-value/${talentId}/history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    };

    fetchMetrics();
  }, [talentId, onLoadingChange]);

  if (loading) {
    return <SkeletonLoader.Metrics count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error Loading Metrics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No metrics data available yet.</p>
      </div>
    );
  }

  // Prepare pie chart data for revenue breakdown
  const revenueBreakdown = [
    {
      name: 'Recurring',
      value: metrics.recurringRevenue,
      percent: metrics.recurringPercent,
    },
    {
      name: 'Non-Recurring',
      value: metrics.totalMRR - metrics.recurringRevenue,
      percent: 100 - metrics.recurringPercent,
    },
  ];

  // Risk indicators
  const founderDependencyScore = metrics.founderDependentPercent;
  const concentrationRiskScore = metrics.concentrationRisk;
  const platformRiskScore = metrics.platformRiskPercent;

  // Determine risk colors
  const getRiskColor = (score: number): string => {
    if (score < 30) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRiskLabel = (score: number): string => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Enterprise Value Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(metrics.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total MRR */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Monthly Recurring Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${metrics.totalMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{metrics.recurringPercent.toFixed(1)}% recurring</p>
          </div>

          {/* Creator Owned */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Creator-Owned Revenue</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {metrics.creatorOwnedPercent.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ${(metrics.totalMRR * (metrics.creatorOwnedPercent / 100)).toLocaleString('en-US', { maximumFractionDigits: 0 })} MRR
            </p>
          </div>

          {/* Asset Inventory */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">IP & Assets Value</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">
              ${metrics.assetInventoryValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{metrics.assetCount} assets tracked</p>
          </div>

          {/* Concentration Risk */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Concentration Risk</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{metrics.concentrationRisk.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mt-1">Platform dependency</p>
          </div>
        </div>

        {/* Revenue Breakdown & Risk Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Pie Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            {revenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No revenue data available</p>
            )}
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Indicators</h3>
            <div className="space-y-4">
              {/* Founder Dependency */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Founder Dependency</label>
                  <span className={`text-sm font-semibold px-2 py-1 rounded border ${getRiskColor(founderDependencyScore)}`}>
                    {getRiskLabel(founderDependencyScore)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${founderDependencyScore < 30 ? 'bg-green-500' : founderDependencyScore < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${founderDependencyScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{founderDependencyScore.toFixed(1)}% of revenue dependent on founder</p>
              </div>

              {/* Concentration Risk */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Concentration Risk</label>
                  <span className={`text-sm font-semibold px-2 py-1 rounded border ${getRiskColor(concentrationRiskScore)}`}>
                    {getRiskLabel(concentrationRiskScore)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${concentrationRiskScore < 30 ? 'bg-green-500' : concentrationRiskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${concentrationRiskScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{concentrationRiskScore.toFixed(1)}% revenue from single platform</p>
              </div>

              {/* Platform Risk */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Platform Risk</label>
                  <span className={`text-sm font-semibold px-2 py-1 rounded border ${getRiskColor(platformRiskScore)}`}>
                    {getRiskLabel(platformRiskScore)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${platformRiskScore < 30 ? 'bg-green-500' : platformRiskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${platformRiskScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{platformRiskScore.toFixed(1)}% platform dependency exposure</p>
              </div>
            </div>
          </div>
        </div>

        {/* 12-Month Trend */}
        {history.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">12-Month Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip />
                <ChartLegend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mrrValue"
                  stroke="#3b82f6"
                  name="MRR ($)"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="recurringPercent"
                  stroke="#10b981"
                  name="Recurring %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Action Items */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Improvement Recommendations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {founderDependencyScore > 60 && (
              <li>• Reduce founder dependency by delegating key business functions</li>
            )}
            {concentrationRiskScore > 60 && (
              <li>• Diversify revenue across additional platforms</li>
            )}
            {metrics.recurringPercent < 50 && (
              <li>• Focus on converting one-off deals to recurring revenue streams</li>
            )}
            {metrics.assetCount < 3 && (
              <li>• Build and document owned assets (email list, community, IP, etc.)</li>
            )}
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnterpriseValueDashboard;
