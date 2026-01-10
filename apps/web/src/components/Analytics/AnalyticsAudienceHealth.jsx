import React from "react";
import { Users, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";

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

  // Determine community temperature
  const getTemperature = () => {
    if (!community.commentTrend) return "stable";
    if (community.commentTrend > 0.15) return "growing";
    if (community.commentTrend < -0.15) return "declining";
    return "stable";
  };

  const temperature = getTemperature();

  const temperatureConfig = {
    growing: { label: "Growing", color: "text-green-600", bg: "bg-green-100", icon: "📈" },
    declining: { label: "Declining", color: "text-orange-600", bg: "bg-orange-100", icon: "📉" },
    stable: { label: "Stable", color: "text-blue-600", bg: "bg-blue-100", icon: "→" },
  };

  const config = temperatureConfig[temperature];

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
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
              Comment Volume
            </p>
            <MessageSquare className="h-4 w-4 text-brand-black/40" />
          </div>
          <p className="font-display text-2xl text-brand-black">
            {community.commentVolume || "0"}
          </p>
          <p className="text-xs text-brand-black/60 mt-2">
            {community.commentTrend > 0 ? "📈 " : community.commentTrend < 0 ? "📉 " : "→ "}
            {Math.abs(community.commentTrend * 100).toFixed(1)}% trend
          </p>
        </div>

        {/* Response Rate */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
              Response Rate
            </p>
            <TrendingUp className="h-4 w-4 text-brand-black/40" />
          </div>
          <p className="font-display text-2xl text-brand-black">
            {community.responseRate ? `${(community.responseRate * 100).toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-brand-black/60 mt-2">
            How often creator responds
          </p>
        </div>

        {/* Sentiment */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
              Avg Sentiment
            </p>
            <div className="text-2xl">
              {community.averageSentiment > 0.6
                ? "😊"
                : community.averageSentiment < 0.4
                ? "😕"
                : "😐"}
            </div>
          </div>
          <p className="font-display text-2xl text-brand-black">
            {community.averageSentiment
              ? `${(community.averageSentiment * 100).toFixed(0)}%`
              : "—"}
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
      {community.consistencyScore !== undefined && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 mb-3">
            Engagement Consistency
          </p>
          <div className="relative h-3 rounded-full bg-brand-black/10 overflow-hidden mb-2">
            <div
              className="h-full bg-brand-red transition-all"
              style={{ width: `${Math.min(community.consistencyScore * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-brand-black/60">
            {community.consistencyScore > 0.8
              ? "Highly consistent engagement patterns"
              : community.consistencyScore > 0.6
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

      {/* Response Trend */}
      {community.responseTrend !== undefined && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 mb-3">
            Response Trend
          </p>
          <p className="text-sm text-brand-black">
            {community.responseTrend > 0 ? (
              <span className="text-green-600 font-semibold">↑ Improving</span>
            ) : community.responseTrend < 0 ? (
              <span className="text-orange-600 font-semibold">↓ Declining</span>
            ) : (
              <span className="text-blue-600 font-semibold">→ Stable</span>
            )}
            {" "}({Math.abs(community.responseTrend * 100).toFixed(1)}%)
          </p>
        </div>
      )}
    </section>
  );
}
