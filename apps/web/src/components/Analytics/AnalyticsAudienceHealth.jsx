import React, { useState } from "react";
import { Users, MessageSquare, TrendingUp, AlertCircle, HelpCircle } from "lucide-react";

/**
 * Metric Tooltip component
 */
function MetricTooltip({ explanation, status }) {
  const [show, setShow] = useState(false);
  
  if (!explanation) return null;
  
  return (
    <div className="relative inline-block">
      <HelpCircle 
        className="h-3 w-3 text-brand-black/20 cursor-help hover:text-brand-black/40"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-0 mb-2 w-40 bg-brand-black rounded-lg p-2 text-white text-xs z-50">
          <p>{explanation}</p>
          <div className="absolute top-full left-2 w-2 h-2 bg-brand-black transform rotate-45 -mt-1"></div>
        </div>
      )}
    </div>
  );
}

/**
 * AnalyticsAudienceHealth
 * 
 * Shows community health metrics:
 * - Comment velocity & trends
 * - Response rate
 * - Sentiment trends
 * - Community "temperature" (stable/growing/volatile)
 * - Health warnings
 */
export default function AnalyticsAudienceHealth({ data }) {
  if (!data || !data.community) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-6">
        <p className="text-center text-sm text-brand-black/60">No community data available</p>
      </section>
    );
  }

  const community = data.community;

  // Helper to extract metric value and metadata
  const getMetricValue = (metric) => {
    if (!metric) return { display: "—", status: "unavailable", explanation: "", source: "" };
    if (typeof metric === "object" && "value" in metric) {
      // New standardized format
      const { value, status, explanation, source } = metric;
      let display = "—";
      if (value !== null && value !== undefined && value !== 0) {
        if (typeof value === "number") {
          display = value.toLocaleString ? value.toLocaleString() : value.toString();
        } else {
          display = value;
        }
      }
      return { display, status, explanation, source };
    }
    // Fallback for old format
    return { 
      display: metric || "—",
      status: "unknown",
      explanation: "",
      source: ""
    };
  };

  // Determine community temperature
  const getTemperature = () => {
    if (!community.commentTrend) return "stable";
    const trendValue = community.commentTrend?.value !== undefined 
      ? community.commentTrend.value 
      : community.commentTrend;
    if (trendValue > 0.15) return "growing";
    if (trendValue < -0.15) return "declining";
    return "stable";
  };

  const temperature = getTemperature();

  const temperatureConfig = {
    growing: { label: "Growing", color: "text-green-600", bg: "bg-green-100", icon: "📈" },
    declining: { label: "Declining", color: "text-orange-600", bg: "bg-orange-100", icon: "📉" },
    stable: { label: "Stable", color: "text-blue-600", bg: "bg-blue-100", icon: "→" },
  };

  const config = temperatureConfig[temperature];
  const commentVolumeMetric = getMetricValue(community.commentVolume);
  const responseRateMetric = getMetricValue(community.responseRate);
  const sentimentMetric = getMetricValue(community.averageSentiment);
  const commentTrendMetric = getMetricValue(community.commentTrend);
  const consistencyMetric = getMetricValue(community.consistencyScore);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-brand-red" />
          <h3 className="font-display text-2xl uppercase text-brand-black">Audience & Community</h3>
        </div>
        <p className="text-sm text-brand-black/60">
          Engagement patterns and sentiment analysis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Comment Velocity */}
        <div className={`rounded-2xl border border-brand-black/10 p-4 ${
          commentVolumeMetric.status === "unavailable" 
            ? "bg-brand-linen/20 opacity-60" 
            : "bg-brand-linen/30"
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
                Comment Volume
              </p>
              {commentVolumeMetric.explanation && (
                <MetricTooltip 
                  explanation={commentVolumeMetric.explanation} 
                  status={commentVolumeMetric.status}
                />
              )}
            </div>
            <MessageSquare className="h-4 w-4 text-brand-black/40" />
          </div>
          <p className="font-display text-2xl text-brand-black">
            {commentVolumeMetric.display}
          </p>
          <p className="text-xs text-brand-black/60 mt-2">
            {commentTrendMetric.status === "unavailable" ? "—" : (
              <>
                {commentTrendMetric.display > 0 ? "📈 " : commentTrendMetric.display < 0 ? "📉 " : "→ "}
                {commentTrendMetric.display}% trend
              </>
            )}
          </p>
        </div>

        {/* Response Rate */}
        <div className={`rounded-2xl border border-brand-black/10 p-4 ${
          responseRateMetric.status === "unavailable" 
            ? "bg-brand-linen/20 opacity-60" 
            : "bg-brand-linen/30"
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
                Response Rate
              </p>
              {responseRateMetric.explanation && (
                <MetricTooltip 
                  explanation={responseRateMetric.explanation} 
                  status={responseRateMetric.status}
                />
              )}
            </div>
            <TrendingUp className="h-4 w-4 text-brand-black/40" />
          </div>
          <p className="font-display text-2xl text-brand-black">
            {responseRateMetric.display}
          </p>
          <p className="text-xs text-brand-black/60 mt-2">
            How often creator responds
          </p>
        </div>

        {/* Sentiment */}
        <div className={`rounded-2xl border border-brand-black/10 p-4 ${
          sentimentMetric.status === "unavailable" 
            ? "bg-brand-linen/20 opacity-60" 
            : "bg-brand-linen/30"
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
                Avg Sentiment
              </p>
              {sentimentMetric.explanation && (
                <MetricTooltip 
                  explanation={sentimentMetric.explanation} 
                  status={sentimentMetric.status}
                />
              )}
            </div>
            <div className="text-2xl">
              {sentimentMetric.display === "—" ? "?" : (
                sentimentMetric.display > 0.6
                  ? "😊"
                  : sentimentMetric.display < 0.4
                  ? "😕"
                  : "😐"
              )}
            </div>
          </div>
          <p className="font-display text-2xl text-brand-black">
            {sentimentMetric.display}
          </p>
          <p className="text-xs text-brand-black/60 mt-2">
            Community sentiment score
          </p>
        </div>

        {/* Community Temperature */}
        <div className={`rounded-2xl border border-brand-black/10 ${config.bg} p-4`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
              Community Temp
            </p>
            <span className="text-2xl">{config.icon}</span>
          </div>
          <p className={`font-display text-2xl ${config.color}`}>{config.label}</p>
          <p className="text-xs text-brand-black/60 mt-2">
            Based on comment velocity
          </p>
        </div>
      </div>

      {/* Consistency Score Progress Bar */}
      {consistencyMetric.status !== "unavailable" && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60">
              Engagement Consistency
            </p>
            {consistencyMetric.explanation && (
              <MetricTooltip 
                explanation={consistencyMetric.explanation} 
                status={consistencyMetric.status}
              />
            )}
          </div>
          <div className="relative h-3 rounded-full bg-brand-black/10 overflow-hidden mb-2">
            <div
              className="h-full bg-brand-red transition-all"
              style={{ width: `${Math.min(consistencyMetric.display * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-brand-black/60">
            {consistencyMetric.display > 0.8
              ? "Highly consistent engagement patterns"
              : consistencyMetric.display > 0.6
              ? "Regular engagement cycles"
              : "Variable engagement patterns"}
          </p>
        </div>
      )}

      {/* Alerts */}
      {community.alerts && community.alerts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-brand-black/10 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Health Alerts
          </p>
          <div className="space-y-2">
            {community.alerts.map((alert, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-orange-200 bg-orange-50 p-3"
              >
                <p className="text-xs text-orange-800 font-semibold">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
