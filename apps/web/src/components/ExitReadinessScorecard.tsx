import React, { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import SkeletonLoader from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';

interface ExitReadinessScore {
  id: string;
  talentId: string;
  overallScore: number;
  category: 'UNDERDEVELOPED' | 'DEVELOPING' | 'INVESTMENT_GRADE' | 'ENTERPRISE_CLASS';
  revenuePredicability: number;
  founderIndependence: number;
  teamDepth: number;
  ipOwnership: number;
  grossMargin: number;
  platformRisk: number;
  recurringRevenuePercent: number;
  updatedAt: string;
}

interface Recommendation {
  category: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: '1HR' | '1DAY' | '1WEEK' | '1MONTH';
  estimatedImpact: number;
  valueMultiplier: number;
}

interface Props {
  talentId: string;
  onLoadingChange?: (loading: boolean) => void;
}

const EXIT_READINESS_THRESHOLDS = {
  UNDERDEVELOPED: { min: 0, max: 35, color: '#ef4444', bgColor: '#fecaca' },
  DEVELOPING: { min: 35, max: 65, color: '#f59e0b', bgColor: '#fed7aa' },
  INVESTMENT_GRADE: { min: 65, max: 85, color: '#3b82f6', bgColor: '#bfdbfe' },
  ENTERPRISE_CLASS: { min: 85, max: 100, color: '#10b981', bgColor: '#a7f3d0' },
};

const ExitReadinessScorecard: React.FC<Props> = ({ talentId, onLoadingChange }) => {
  const [score, setScore] = useState<ExitReadinessScore | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch scorecard
        const scoreResponse = await fetch(`/api/exit-readiness/${talentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const contentType = scoreResponse.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('API returned invalid response (HTML instead of JSON)');
        }

        if (!scoreResponse.ok) {
          const errorData = await scoreResponse.json().catch(() => ({}));
          throw new Error(`Failed to fetch scorecard: ${scoreResponse.status} - ${errorData.error || 'Unknown error'}`);
        }

        const scoreData = await scoreResponse.json();
        setScore(scoreData.data || scoreData);

        // Fetch recommendations
        const recsResponse = await fetch(`/api/exit-readiness/${talentId}/recommendations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (recsResponse.ok) {
          const recsData = await recsResponse.json();
          setRecommendations(recsData.data || recsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scorecard');
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    };

    fetchScorecard();
  }, [talentId, onLoadingChange]);

  if (loading) {
    return <SkeletonLoader.Metrics count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error Loading Scorecard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No scorecard data available yet.</p>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = [
    { name: 'Revenue Predicability', value: score.revenuePredicability, fullMark: 100 },
    { name: 'Founder Independence', value: score.founderIndependence, fullMark: 100 },
    { name: 'Team Depth', value: score.teamDepth, fullMark: 100 },
    { name: 'IP Ownership', value: score.ipOwnership, fullMark: 100 },
    { name: 'Gross Margin', value: score.grossMargin, fullMark: 100 },
    { name: 'Platform Risk', value: score.platformRisk, fullMark: 100 },
    { name: 'Recurring Revenue %', value: score.recurringRevenuePercent, fullMark: 100 },
  ];

  const threshold = EXIT_READINESS_THRESHOLDS[score.category];

  // Get category description
  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      UNDERDEVELOPED: 'Early-stage creator business. Strong growth potential with significant development needed.',
      DEVELOPING: 'Growing business with improving systems. Ready for incremental scaling.',
      INVESTMENT_GRADE: 'Mature business with strong fundamentals. Attractive to institutional partners.',
      ENTERPRISE_CLASS: 'Exit-ready enterprise. Demonstrates all hallmarks of a valuable, scalable business.',
    };
    return descriptions[category] || '';
  };

  // Filter and sort recommendations
  const prioritizedRecommendations = [...recommendations]
    .sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (b.estimatedImpact * b.valueMultiplier) - (a.estimatedImpact * a.valueMultiplier);
    })
    .slice(0, 10);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Exit Readiness Scorecard</h2>
          <p className="text-sm text-gray-500 mt-1">
            How sellable is this business? Complete analysis across 7 key dimensions.
          </p>
        </div>

        {/* Main Score Card */}
        <div
          className="rounded-lg p-8 text-center border-2"
          style={{
            backgroundColor: threshold.bgColor,
            borderColor: threshold.color,
          }}
        >
          <div className="max-w-md mx-auto">
            {/* Score Circle */}
            <div className="mb-6">
              <div
                className="w-32 h-32 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: threshold.color }}
              >
                <div className="text-5xl font-bold text-white">{score.overallScore}</div>
              </div>
              <p className="text-sm text-gray-500 mt-2">/100</p>
            </div>

            {/* Category Badge */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{score.category.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-gray-700 mt-2">{getCategoryDescription(score.category)}</p>
            </div>

            {/* Category Indicators */}
            <div className="flex gap-2 justify-center mt-6">
              {Object.entries(EXIT_READINESS_THRESHOLDS).map(([cat, config]) => (
                <div
                  key={cat}
                  className="h-2 flex-1 rounded"
                  style={{
                    backgroundColor: cat === score.category ? config.color : '#e5e7eb',
                  }}
                  title={cat}
                />
              ))}
            </div>
            <div className="flex gap-2 justify-center text-xs text-gray-600 mt-2">
              <span>UND</span>
              <span>DEV</span>
              <span>GRADE</span>
              <span>CLASS</span>
            </div>
          </div>
        </div>

        {/* 7-Dimension Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Dimension Breakdown</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimension Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Scores</h3>
            <div className="space-y-4">
              {radarData.map((dimension) => (
                <div key={dimension.name}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">{dimension.name}</label>
                    <span className="text-sm font-bold text-gray-900">{dimension.value}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${dimension.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top {Math.min(10, prioritizedRecommendations.length)} Recommendations
          </h3>
          <div className="space-y-4">
            {prioritizedRecommendations.length > 0 ? (
              prioritizedRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.category}</h4>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          rec.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : rec.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 font-semibold">
                        {rec.effort}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-gray-500">Estimated Impact</p>
                      <p className="font-bold text-gray-900">{rec.estimatedImpact}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Value Multiplier</p>
                      <p className="font-bold text-gray-900">{rec.valueMultiplier}x</p>
                    </div>
                    <div className="ml-auto">
                      <p className="text-gray-500">Score Improvement</p>
                      <p className="font-bold text-green-600">
                        +{Math.round(rec.estimatedImpact * rec.valueMultiplier)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recommendations available</p>
            )}
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Valuation Insight</h4>
            <p className="text-sm text-blue-800">
              {score.overallScore >= 85
                ? 'This business is enterprise-class and ready for institutional investment or acquisition.'
                : score.overallScore >= 65
                ? 'Strong fundamentals position this business for strategic partnerships or investment.'
                : score.overallScore >= 35
                ? 'Focus on building systems and recurring revenue to increase enterprise value.'
                : 'Significant opportunity to build business systems and valuation through recommended improvements.'}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">🎯 Next Steps</h4>
            <p className="text-sm text-purple-800">
              {prioritizedRecommendations.length > 0
                ? `Start with the highest-priority recommendations above. The top action (${prioritizedRecommendations[0].category}) could improve your score by ~${Math.round(prioritizedRecommendations[0].estimatedImpact * prioritizedRecommendations[0].valueMultiplier)} points.`
                : 'Business is performing well across all dimensions.'}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
          Last updated: {new Date(score.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ExitReadinessScorecard;
