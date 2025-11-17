import React from "react";
import { Badge } from "./Badge.jsx";

export function SocialAnalyticsPanel({ data, loading, error, onRefresh }) {
  if (!data && loading) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-white/80 p-6">
        <p className="text-sm text-brand-black/70">Loading social analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-white/80 p-6 text-sm text-brand-red">
        {error}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="ml-2 rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em]"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (!data || !data.accounts?.length) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-white/80 p-6 text-sm text-brand-black/70">
        No social accounts connected yet. Connect Instagram, TikTok, YouTube, or X to sync analytics.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Social analytics</p>
          <h3 className="font-display text-3xl uppercase">Signal breakdown</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
        >
          Refresh
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {data.accounts.map((account) => (
          <article key={account.id} className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{account.platform}</p>
                <p className="font-semibold text-brand-black">@{account.username}</p>
                <p className="text-xs text-brand-black/50">{account.displayName}</p>
              </div>
              <Badge tone="neutral">{account.followers.toLocaleString()} followers</Badge>
            </div>
            <p className="text-xs text-brand-black/60">
              Engagement {account.engagementRate ? `${account.engagementRate.toFixed(1)}%` : "—"} · Velocity{" "}
              {account.velocityScore ? `${account.velocityScore.toFixed(2)}x` : "—"}
            </p>
            <TrendBar trend={account.trend} />
            <RecentPosts posts={account.posts} />
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendBar({ trend }) {
  if (!trend?.length) {
    return <p className="text-xs text-brand-black/60">No trend data yet.</p>;
  }
  const points = trend.slice(0, 5).reverse();
  return (
    <div className="text-xs text-brand-black/60">
      <p className="uppercase tracking-[0.3em]">30d followers</p>
      <div className="mt-2 flex items-end gap-1">
        {points.map((point) => (
          <span
            key={point.capturedAt}
            className="w-5 rounded-full bg-brand-red/40"
            style={{
              height: `${Math.max(point.followerCount / points[0].followerCount, 0.2) * 56}px`
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RecentPosts({ posts }) {
  if (!posts?.length) {
    return <p className="text-xs text-brand-black/60">No posts synced yet.</p>;
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Recent posts</p>
      <div className="mt-2 grid gap-2 text-xs">
        {posts.slice(0, 3).map((post) => (
          <div key={post.platformPostId} className="rounded-xl border border-brand-black/10 bg-white/80 p-2">
            <p className="font-semibold text-brand-black/80 truncate">{post.caption || "Untitled post"}</p>
            <p className="text-[0.6rem] text-brand-black/50">
              {formatNumber(post.views)} views · {formatNumber(post.likes)} likes · {formatNumber(post.comments)} comments
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNumber(value) {
  if (!value && value !== 0) return "—";
  if (value > 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value > 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}
