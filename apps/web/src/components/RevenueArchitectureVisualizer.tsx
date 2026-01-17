import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import SkeletonLoader from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';
import { apiFetch } from '../services/apiClient.js';

interface RevenueArchitecture {
  id: string;
  talentId: string;
  contentMRR: number;
  contentSources: number;
  leadGenerationMRR: number;
  leadChannels: number;
  conversionMRR: number;
  conversionRate: number;
  recurringRevenueMRR: number;
  recurringPercent: number;
  gaps: string[];
  recommendations: string[];
  updatedAt: string;
}

interface PathMetric {
  name: string;
  mrr: number;
  health: 'HEALTHY' | 'DEVELOPING' | 'CRITICAL';
}

interface Props {
  talentId: string;
  onLoadingChange?: (loading: boolean) => void;
}

const RevenueArchitectureVisualizer: React.FC<Props> = ({ talentId, onLoadingChange }) => {
  const [architecture, setArchitecture] = useState<RevenueArchitecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArchitecture = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(`/api/revenue/architecture/${talentId}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('API returned invalid response (HTML instead of JSON)');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch architecture: ${response.status}`);
        }

        const data = await response.json();
        setArchitecture(data.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load architecture');
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    };

    fetchArchitecture();
  }, [talentId, onLoadingChange]);

  if (loading) {
    return <SkeletonLoader.Metrics count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error Loading Architecture</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No architecture data available yet.</p>
      </div>
    );
  }

  // Prepare path data for visualization
  const pathMetrics: PathMetric[] = [
    {
      name: 'Content Creation',
      mrr: architecture.contentMRR,
      health: architecture.contentMRR > 0 ? 'HEALTHY' : 'CRITICAL',
    },
    {
      name: 'Lead Generation',
      mrr: architecture.leadGenerationMRR,
      health: architecture.leadGenerationMRR > 0 && architecture.leadChannels > 1 ? 'HEALTHY' : 'DEVELOPING',
    },
    {
      name: 'Conversion',
      mrr: architecture.conversionMRR,
      health: architecture.conversionRate > 10 ? 'HEALTHY' : architecture.conversionRate > 5 ? 'DEVELOPING' : 'CRITICAL',
    },
    {
      name: 'Recurring Revenue',
      mrr: architecture.recurringRevenueMRR,
      health: architecture.recurringPercent > 50 ? 'HEALTHY' : architecture.recurringPercent > 30 ? 'DEVELOPING' : 'CRITICAL',
    },
  ];

  const chartData = pathMetrics.map((path) => ({
    name: path.name,
    MRR: path.mrr,
    health: path.health,
  }));

  const getHealthColor = (health: string): string => {
    if (health === 'HEALTHY') return '#10b981';
    if (health === 'DEVELOPING') return '#f59e0b';
    return '#ef4444';
  };

  const getHealthLabel = (health: string): string => {
    return health.charAt(0) + health.slice(1).toLowerCase();
  };

  // Calculate overall pipeline health
  const healthyStages = pathMetrics.filter((p) => p.health === 'HEALTHY').length;
  const overallHealth = healthyStages === 4 ? 'OPTIMAL' : healthyStages >= 3 ? 'GOOD' : healthyStages >= 2 ? 'NEEDS_WORK' : 'CRITICAL';

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Revenue Architecture</h2>
          <p className="text-sm text-gray-500 mt-1">
            Content → Leads → Conversions → Recurring Revenue pipeline analysis
          </p>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Pipeline</h3>

          {/* Flow Diagram */}
          <div className="flex items-center justify-between mb-8">
            {/* Stage 1: Content */}
            <div className="flex-1 text-center">
              <div
                className={`rounded-lg p-4 mb-3 ${
                  pathMetrics[0].health === 'HEALTHY'
                    ? 'bg-green-50 border border-green-200'
                    : pathMetrics[0].health === 'DEVELOPING'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">Content Creation</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${architecture.contentMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-600 mt-1">{architecture.contentSources} sources</p>
              </div>
              <p
                className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
                  pathMetrics[0].health === 'HEALTHY'
                    ? 'bg-green-100 text-green-800'
                    : pathMetrics[0].health === 'DEVELOPING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getHealthLabel(pathMetrics[0].health)}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 px-4">
              <div className="text-2xl text-gray-400">→</div>
            </div>

            {/* Stage 2: Leads */}
            <div className="flex-1 text-center">
              <div
                className={`rounded-lg p-4 mb-3 ${
                  pathMetrics[1].health === 'HEALTHY'
                    ? 'bg-green-50 border border-green-200'
                    : pathMetrics[1].health === 'DEVELOPING'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">Lead Generation</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${architecture.leadGenerationMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-600 mt-1">{architecture.leadChannels} channels</p>
              </div>
              <p
                className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
                  pathMetrics[1].health === 'HEALTHY'
                    ? 'bg-green-100 text-green-800'
                    : pathMetrics[1].health === 'DEVELOPING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getHealthLabel(pathMetrics[1].health)}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 px-4">
              <div className="text-2xl text-gray-400">→</div>
            </div>

            {/* Stage 3: Conversion */}
            <div className="flex-1 text-center">
              <div
                className={`rounded-lg p-4 mb-3 ${
                  pathMetrics[2].health === 'HEALTHY'
                    ? 'bg-green-50 border border-green-200'
                    : pathMetrics[2].health === 'DEVELOPING'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">Conversions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {architecture.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ${architecture.conversionMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })} MRR
                </p>
              </div>
              <p
                className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
                  pathMetrics[2].health === 'HEALTHY'
                    ? 'bg-green-100 text-green-800'
                    : pathMetrics[2].health === 'DEVELOPING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getHealthLabel(pathMetrics[2].health)}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 px-4">
              <div className="text-2xl text-gray-400">→</div>
            </div>

            {/* Stage 4: Recurring */}
            <div className="flex-1 text-center">
              <div
                className={`rounded-lg p-4 mb-3 ${
                  pathMetrics[3].health === 'HEALTHY'
                    ? 'bg-green-50 border border-green-200'
                    : pathMetrics[3].health === 'DEVELOPING'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">Recurring Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {architecture.recurringPercent.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ${architecture.recurringRevenueMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })} MRR
                </p>
              </div>
              <p
                className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
                  pathMetrics[3].health === 'HEALTHY'
                    ? 'bg-green-100 text-green-800'
                    : pathMetrics[3].health === 'DEVELOPING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getHealthLabel(pathMetrics[3].health)}
              </p>
            </div>
          </div>

          {/* Overall Health Gauge */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Pipeline Health</h4>
              <span
                className={`text-lg font-bold px-3 py-1 rounded-full ${
                  overallHealth === 'OPTIMAL'
                    ? 'bg-green-100 text-green-800'
                    : overallHealth === 'GOOD'
                    ? 'bg-blue-100 text-blue-800'
                    : overallHealth === 'NEEDS_WORK'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {overallHealth}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {pathMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: getHealthColor(metric.health) }}
                  title={metric.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* MRR Flow Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">MRR by Pipeline Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              />
              <Bar dataKey="MRR" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getHealthColor(pathMetrics[index].health)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Content → Leads</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {architecture.contentMRR > 0
                ? ((architecture.leadGenerationMRR / architecture.contentMRR) * 100).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">Conversion rate</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Leads → Conversions</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{architecture.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Close rate</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Conversions → Recurring</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {architecture.conversionMRR > 0
                ? ((architecture.recurringRevenueMRR / architecture.conversionMRR) * 100).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">Recurring rate</p>
          </div>
        </div>

        {/* Gaps & Blockers */}
        {architecture.gaps.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-3">⚠️ Pipeline Gaps Detected</h4>
            <ul className="space-y-2">
              {architecture.gaps.map((gap, index) => (
                <li key={index} className="text-sm text-yellow-800">
                  • {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {architecture.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Improvement Recommendations</h4>
            <ul className="space-y-2">
              {architecture.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-800">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Insights */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-semibold text-indigo-900 mb-3">📊 Key Insights</h4>
          <div className="space-y-2 text-sm text-indigo-800">
            <p>
              • Your business generates <strong>${(architecture.contentMRR + architecture.leadGenerationMRR).toLocaleString('en-US', { maximumFractionDigits: 0 })} MRR</strong> from content and lead generation
            </p>
            <p>
              • <strong>{architecture.conversionRate.toFixed(1)}% of leads</strong> convert to paying customers
            </p>
            <p>
              • <strong>{architecture.recurringPercent.toFixed(0)}% of revenue</strong> is recurring/auto-renewing
            </p>
            {architecture.contentSources < 3 && (
              <p>• ⚠️ Consider diversifying content across {3 - architecture.contentSources} additional channels</p>
            )}
            {architecture.recurringPercent < 50 && (
              <p>• 🎯 Focus on converting one-off deals to recurring subscriptions (+{(50 - architecture.recurringPercent).toFixed(0)}% opportunity)</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
          Last updated: {new Date(architecture.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default RevenueArchitectureVisualizer;
