import React from "react";
import { TrendingUp, Users, MessageCircle, Zap } from "lucide-react";

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

  const metrics = [
    {
      label: "Total Reach",
      value: overview.totalReach ? overview.totalReach.toLocaleString() : "—",
      subtext: "Estimated total interactions",
      icon: Users,
    },
    {
      label: "Engagement Rate",
      value: overview.engagementRate ? `${overview.engagementRate}%` : "—",
      subtext: "Interactions per follower",
      icon: TrendingUp,
    },
    {
      label: "Posts",
      value: overview.postCount || "0",
      subtext: `${overview.avgPostsPerWeek || 0} per week`,
      icon: MessageCircle,
    },
    {
      label: "Sentiment",
      value: overview.sentimentScore ? `${(overview.sentimentScore * 100).toFixed(0)}%` : "—",
      subtext: "Community sentiment",
      icon: Zap,
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
          Aggregated social intelligence from {overview.topPlatform || "connected platforms"}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 hover:border-brand-black/20 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-brand-red">
                  {metric.label}
                </p>
                <Icon className="h-4 w-4 text-brand-black/40" />
              </div>
              <p className="font-display text-2xl text-brand-black">{metric.value}</p>
              <p className="text-xs text-brand-black/60 mt-2">{metric.subtext}</p>
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
              <p className="text-sm font-semibold text-brand-black">{overview.topPlatform}</p>
              <p className="text-xs text-brand-black/60 mt-1">Primary channel</p>
            </div>
            {overview.topPlatformFollowers && (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                <p className="text-sm font-semibold text-brand-black">
                  {(overview.topPlatformFollowers / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-brand-black/60 mt-1">Followers</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consistency Score */}
      {overview.consistencyScore !== undefined && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 mb-3">
            Content Consistency
          </p>
          <div className="relative h-2 rounded-full bg-brand-black/10 overflow-hidden">
            <div
              className="h-full bg-brand-red transition-all"
              style={{ width: `${Math.min(overview.consistencyScore * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-brand-black/60 mt-2">
            {overview.consistencyScore > 0.8
              ? "Highly consistent posting schedule"
              : overview.consistencyScore > 0.6
              ? "Regular posting pattern"
              : overview.consistencyScore > 0.4
              ? "Moderate consistency"
              : "Irregular posting pattern"}
          </p>
        </div>
      )}
    </section>
  );
}
