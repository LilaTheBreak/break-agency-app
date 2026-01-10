import React, { useMemo } from "react";
import { Flame, MessageCircle, Heart, Eye } from "lucide-react";

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
            { label: "Engagement", value: post.engagementRate, icon: Flame, color: "text-brand-red" },
            { label: "Comments", value: post.commentCount, icon: MessageCircle, color: "text-blue-600" },
            { label: "Likes", value: post.likeCount, icon: Heart, color: "text-pink-600" },
            ...(post.watchTime ? [{ label: "Views", value: post.watchTime, icon: Eye, color: "text-purple-600" }] : []),
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
                {engagementMetrics.map((metric) => {
                  const Icon = metric.icon;
                  const value = typeof metric.value === "number" 
                    ? metric.value > 1000 
                      ? `${(metric.value / 1000).toFixed(1)}K`
                      : metric.value.toString()
                    : metric.value || "—";
                  
                  return (
                    <div
                      key={metric.label}
                      className="flex items-start gap-2"
                    >
                      <Icon className={`h-3 w-3 mt-1 ${metric.color}`} />
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.1em] text-brand-black/60">
                          {metric.label}
                        </p>
                        <p className="text-sm font-semibold text-brand-black">{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Date */}
              {post.postedAt && (
                <p className="text-[0.7rem] text-brand-black/50 mt-3 pt-3 border-t border-brand-black/10">
                  {new Date(post.postedAt).toLocaleDateString()}
                </p>
              )}
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
