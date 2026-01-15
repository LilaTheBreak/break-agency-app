import React, { useMemo, useState } from "react";
import { Flame, MessageCircle, Heart, Eye, HelpCircle } from "lucide-react";

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
 * AnalyticsContentPerformance
 * 
 * Shows top content ranked by engagement metrics
 * - Engagement rate
 * - Saves
 * - Comments
 * - Watch time (video platforms)
 */
export default function AnalyticsContentPerformance({ data, platformFilter }) {
  const topPosts = useMemo(() => {
    if (!data || !data.contentPerformance) return [];
    
    let posts = data.contentPerformance;
    
    // Filter by platform if specified
    if (platformFilter !== "ALL") {
      posts = posts.filter(p => p.platform === platformFilter);
    }
    
    return posts.slice(0, 8);
  }, [data, platformFilter]);

  if (!topPosts || topPosts.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="h-5 w-5 text-brand-red" />
          <h3 className="font-display text-2xl uppercase text-brand-black">Top Content</h3>
        </div>
        <p className="text-center text-sm text-brand-black/60">No content data available</p>
      </section>
    );
  }

  // Helper to extract metric value and metadata
  const getMetricValue = (metric) => {
    if (!metric) return { display: "—", status: "unavailable", explanation: "", source: "" };
    if (typeof metric === "object" && "value" in metric) {
      // New standardized format
      const { value, status, explanation, source } = metric;
      let display = "—";
      if (value !== null && value !== undefined && value !== 0) {
        if (typeof value === "number") {
          display = value > 1000 
            ? `${(value / 1000).toFixed(1)}K`
            : value.toString();
        } else {
          display = value;
        }
      }
      return { display, status, explanation, source };
    }
    // Fallback for old format
    return { 
      display: typeof metric === "number" 
        ? metric > 1000 
          ? `${(metric / 1000).toFixed(1)}K`
          : metric.toString()
        : metric || "—",
      status: "unknown",
      explanation: "",
      source: ""
    };
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-5 w-5 text-brand-red" />
          <h3 className="font-display text-2xl uppercase text-brand-black">Top Content</h3>
        </div>
        <p className="text-sm text-brand-black/60">
          Best-performing posts ranked by engagement
        </p>
      </div>

      <div className="space-y-3">
        {topPosts.map((post, idx) => {
          const engagementMetrics = [
            { label: "Engagement", metric: post.engagementRate, icon: Flame, color: "text-brand-red" },
            { label: "Comments", metric: post.comments, icon: MessageCircle, color: "text-blue-600" },
            { label: "Likes", metric: post.likes, icon: Heart, color: "text-pink-600" },
            ...(post.views ? [{ label: "Views", metric: post.views, icon: Eye, color: "text-purple-600" }] : []),
          ];

          return (
            <div
              key={post.id || idx}
              className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 hover:border-brand-black/20 transition"
            >
              {/* Rank & Platform */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.1em] font-semibold text-brand-red">
                      {post.platform || "Unknown"}
                    </p>
                  </div>
                </div>
                {post.contentType && (
                  <span className="text-[0.7rem] uppercase tracking-[0.1em] font-semibold text-brand-black/60 bg-brand-black/5 px-2 py-1 rounded-full">
                    {post.contentType}
                  </span>
                )}
              </div>

              {/* Caption preview */}
              {post.caption && (
                <p className="text-sm text-brand-black/80 mb-3 line-clamp-2">
                  {post.caption}
                </p>
              )}

              {/* Engagement Metrics */}
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                {engagementMetrics.map((metricConfig) => {
                  const Icon = metricConfig.icon;
                  const { display, status, explanation, source } = getMetricValue(metricConfig.metric);
                  const isUnavailable = status === "unavailable";
                  
                  return (
                    <div
                      key={metricConfig.label}
                      className={`flex items-start gap-2 ${isUnavailable ? "opacity-50" : ""}`}
                    >
                      <Icon className={`h-3 w-3 mt-1 ${metricConfig.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-[0.7rem] uppercase tracking-[0.1em] text-brand-black/60">
                            {metricConfig.label}
                          </p>
                          {explanation && <MetricTooltip explanation={explanation} status={status} />}
                        </div>
                        <p className="text-sm font-semibold text-brand-black">{display}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Date & Source */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-black/10">
                {post.postedAt && (
                  <p className="text-[0.7rem] text-brand-black/50">
                    {new Date(post.postedAt).toLocaleDateString()}
                  </p>
                )}
                {post.likes?.source && (
                  <span className="text-[0.65rem] uppercase tracking-[0.1em] font-semibold px-2 py-0.5 rounded-full bg-brand-black/5 text-brand-black/50">
                    {post.likes.source}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {data.contentPerformance && data.contentPerformance.length > 8 && (
        <button
          className="mt-6 w-full rounded-full border border-brand-black/20 px-4 py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-brand-black/5 transition"
          disabled
          title="Coming soon"
        >
          View All {data.contentPerformance.length} Posts
        </button>
      )}
    </section>
  );
}
