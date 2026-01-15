import React, { useState } from "react";
import { TrendingUp, Users, MessageCircle, Zap, HelpCircle, Info } from "lucide-react";

/**
 * Tooltip component for metric explanations
 */
function MetricTooltip({ explanation, status }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <HelpCircle 
        className="h-3 w-3 text-brand-black/30 cursor-help hover:text-brand-black/50"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-brand-black rounded-lg p-3 text-white text-xs z-50">
          <p className="mb-1">{explanation}</p>
          <p className="text-brand-black/60">Status: {status}</p>
          <div className="absolute top-full left-2 w-2 h-2 bg-brand-black transform rotate-45 -mt-1"></div>
        </div>
      )}
    </div>
  );
}

/**
 * AnalyticsOverviewIntelligence
 * 
 * Displays aggregated social intelligence metrics:
 * - Total reach / engagement
 * - Engagement rate
 * - Posting frequency
 * - Platform mix
 * - Audience sentiment
 * - Consistency score
 */
export default function AnalyticsOverviewIntelligence({ data, profile }) {
  if (!data || !data.overview) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-6">
        <p className="text-center text-sm text-brand-black/60">No overview data available</p>
      </section>
    );
  }

  const overview = data.overview;
  
  // Helper to extract metric value and metadata
  const getMetricValue = (metric) => {
    if (!metric) return { display: "—", status: "unavailable", explanation: "" };
    if (typeof metric === "object" && "value" in metric) {
      // New standardized format
      const { value, status, explanation, source } = metric;
      let display = "—";
      if (value !== null && value !== undefined && value !== 0) {
        if (typeof value === "number") {
          display = metric.label?.includes("Rate") || metric.label?.includes("Sentiment") 
            ? `${value}%` 
            : value.toLocaleString?.() || value;
        } else {
          display = value;
        }
      }
      return { display, status, explanation, source };
    }
    // Fallback for old format
    return { display: metric || "—", status: "unknown", explanation: "" };
  };

  const metrics = [
    {
      label: "Total Reach",
      metric: overview.totalReach,
      icon: Users,
      defaultSubtext: "Estimated total interactions",
    },
    {
      label: "Engagement Rate",
      metric: overview.engagementRate,
      icon: TrendingUp,
      defaultSubtext: "Interactions per follower",
    },
    {
      label: "Posts",
      metric: overview.postCount,
      icon: MessageCircle,
      defaultSubtext: "Total public posts",
    },
    {
      label: "Sentiment",
      metric: overview.sentimentScore,
      icon: Zap,
      defaultSubtext: "Community sentiment score",
    },
  ];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-5 w-5 text-brand-red" />
          <h3 className="font-display text-2xl uppercase text-brand-black">Overview</h3>
        </div>
        <p className="text-sm text-brand-black/60">
          Aggregated social intelligence from {overview.topPlatform?.value || overview.topPlatform || "connected platforms"}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metricConfig) => {
          const Icon = metricConfig.icon;
          const { display, status, explanation, source } = getMetricValue(metricConfig.metric);
          const isUnavailable = status === "unavailable";
          
          return (
            <div
              key={metricConfig.label}
              className={`rounded-2xl border border-brand-black/10 p-4 hover:border-brand-black/20 transition ${
                isUnavailable 
                  ? "bg-brand-linen/20 opacity-60" 
                  : "bg-brand-linen/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
                  {metricConfig.label}
                </p>
                <div className="flex gap-1 items-center">
                  {source && (
                    <span className="text-[0.6rem] uppercase tracking-[0.1em] font-semibold px-2 py-0.5 rounded-full bg-brand-black/5 text-brand-black/50">
                      {source}
                    </span>
                  )}
                  {explanation && (
                    <MetricTooltip explanation={explanation} status={status} />
                  )}
                </div>
              </div>
              <p className="font-display text-2xl text-brand-black">{display}</p>
              <p className="text-xs text-brand-black/60 mt-2">{metricConfig.defaultSubtext}</p>
            </div>
          );
        })}
      </div>

      {/* Platform Details */}
      {overview.topPlatform && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 mb-3">
            Top Platform
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
              <p className="text-sm font-semibold text-brand-black">
                {overview.topPlatform?.value || overview.topPlatform}
              </p>
              <p className="text-xs text-brand-black/60 mt-1">Primary channel</p>
            </div>
            {overview.topPlatformFollowers && (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                <p className="text-sm font-semibold text-brand-black">
                  {typeof overview.topPlatformFollowers === "object" 
                    ? overview.topPlatformFollowers.value?.toLocaleString?.() || "—"
                    : overview.topPlatformFollowers?.toLocaleString?.() || "—"}
                </p>
                <p className="text-xs text-brand-black/60 mt-1">Followers</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consistency Score */}
      {overview.consistencyScore && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60">
              Content Consistency
            </p>
            {overview.consistencyScore.explanation && (
              <MetricTooltip 
                explanation={overview.consistencyScore.explanation} 
                status={overview.consistencyScore.status}
              />
            )}
          </div>
          {overview.consistencyScore.value !== null ? (
            <div>
              <div className="relative h-2 rounded-full bg-brand-black/10 overflow-hidden">
                <div
                  className="h-full bg-brand-red transition-all"
                  style={{ width: `${Math.min((overview.consistencyScore.value || 0) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-brand-black/60 mt-2">
                {(overview.consistencyScore.value || 0) > 0.8
                  ? "Highly consistent posting schedule"
                  : (overview.consistencyScore.value || 0) > 0.6
                  ? "Regular posting pattern"
                  : (overview.consistencyScore.value || 0) > 0.4
                  ? "Moderate consistency"
                  : "Irregular posting pattern"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-brand-black/60">Not available for external profiles</p>
          )}
        </div>
      )}
    </section>
  );
}
