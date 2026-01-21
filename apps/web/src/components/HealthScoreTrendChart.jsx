import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * HealthScoreTrendChart - Displays health score trend over time
 * 
 * Shows:
 * - Line chart of score over 7 or 30 days
 * - Direction indicator (↑ improving / → stable / ↓ declining)
 * - Percentage change
 * - Key insights below chart
 * 
 * Props:
 * - trend: { current, starting, change, direction, percentChange, snapshots }
 * - days: 7 or 30 (default 30)
 */
export function HealthScoreTrendChart({ trend, days = 30 }) {
  if (!trend) {
    return (
      <div className="rounded-xl border border-brand-black/10 bg-brand-white p-6">
        <p className="text-sm text-brand-black/60">
          📊 Health score tracking will appear once activity begins.
        </p>
      </div>
    );
  }

  const chartHeight = 120;
  const padding = 10;
  const width = 320;

  // Calculate chart path
  const chartPath = useMemo(() => {
    if (!trend.snapshots || trend.snapshots.length < 2) {
      return null;
    }

    const minScore = Math.min(...trend.snapshots.map(s => s.score), 0);
    const maxScore = Math.max(...trend.snapshots.map(s => s.score), 100);
    const range = maxScore - minScore || 1;

    const points = trend.snapshots.map((snapshot, index) => {
      const x = (index / (trend.snapshots.length - 1)) * (width - 2 * padding) + padding;
      const y = chartHeight - ((snapshot.score - minScore) / range) * (chartHeight - 2 * padding) + padding;
      return { x, y, score: snapshot.score };
    });

    // Build SVG path
    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    
    return { pathData, points };
  }, [trend.snapshots]);

  // Determine trend color and icon
  const getTrendStyle = () => {
    if (trend.direction === "improving") {
      return { color: "#10b981", bgColor: "#ecfdf5", icon: TrendingUp, text: "Improving" };
    }
    if (trend.direction === "declining") {
      return { color: "#ef4444", bgColor: "#fef2f2", icon: TrendingDown, text: "Declining" };
    }
    return { color: "#f59e0b", bgColor: "#fffbeb", icon: Minus, text: "Stable" };
  };

  const trendStyle = getTrendStyle();
  const TrendIcon = trendStyle.icon;

  // Format percentage change text
  const percentText =
    trend.direction === "improving"
      ? `+${trend.percentChange}%`
      : trend.direction === "declining"
      ? `-${Math.abs(trend.percentChange)}%`
      : "Stable";

  return (
    <div className="rounded-xl border border-brand-black/10 bg-brand-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-black uppercase tracking-[0.2em]">
          Score Trend ({days} days)
        </h3>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: trendStyle.bgColor, color: trendStyle.color }}
        >
          <TrendIcon className="w-4 h-4" />
          {trendStyle.text}
        </div>
      </div>

      {/* Chart */}
      {chartPath ? (
        <div className="mb-4">
          <svg width={width} height={chartHeight} className="w-full h-24" viewBox={`0 0 ${width} ${chartHeight}`}>
            {/* Grid lines (subtle) */}
            <line x1={padding} y1={chartHeight / 2} x2={width - padding} y2={chartHeight / 2} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="2,2" />

            {/* Score area gradient */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={trendStyle.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={trendStyle.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Fill area under line */}
            <path
              d={`${chartPath.pathData} L ${chartPath.points[chartPath.points.length - 1].x} ${chartHeight} L ${padding} ${chartHeight} Z`}
              fill="url(#scoreGradient)"
            />

            {/* Score line */}
            <path
              d={chartPath.pathData}
              stroke={trendStyle.color}
              strokeWidth={2}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {chartPath.points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={2}
                fill={trendStyle.color}
                opacity={i === 0 || i === chartPath.points.length - 1 ? 1 : 0.4}
              />
            ))}
          </svg>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div>
          <p className="text-xs text-brand-black/50 uppercase tracking-[0.15em] mb-1">Current</p>
          <p className="text-2xl font-bold text-brand-black">{trend.current}%</p>
        </div>
        <div>
          <p className="text-xs text-brand-black/50 uppercase tracking-[0.15em] mb-1">Change</p>
          <p
            className="text-lg font-semibold"
            style={{ color: trend.direction === "improving" ? "#10b981" : trend.direction === "declining" ? "#ef4444" : "#f59e0b" }}
          >
            {percentText}
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-black/50 uppercase tracking-[0.15em] mb-1">Average</p>
          <p className="text-2xl font-bold text-brand-black">{trend.average}%</p>
        </div>
      </div>

      {/* Insight Message */}
      <div
        className="rounded-lg p-3 text-xs"
        style={{ backgroundColor: trendStyle.bgColor, color: trendStyle.color }}
      >
        <p className="font-medium">
          {trend.direction === "improving" && (
            <>✅ Nice work — profile health is trending up. Keep momentum going.</>
          )}
          {trend.direction === "declining" && (
            <>🔴 Profile health declining. Address the highest-impact issues to reverse the trend.</>
          )}
          {trend.direction === "stable" && (
            <>⚪ Profile health stable. Monitor for changes and address any emerging issues.</>
          )}
        </p>
      </div>

      {/* Timeline (optional, for very compact display) */}
      {trend.snapshots && trend.snapshots.length > 0 && (
        <div className="mt-4 text-xs text-brand-black/50">
          <p className="font-medium text-brand-black/60 mb-2">Timeline</p>
          <div className="flex items-center justify-between gap-2 text-[0.65rem]">
            <span>{new Date(trend.snapshots[0].date).toLocaleDateString()}</span>
            <span className="flex-1 border-b border-brand-black/10"></span>
            <span>{new Date(trend.snapshots[trend.snapshots.length - 1].date).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lightweight trend badge for summary display
 * Use this in the Health Score card or dashboard summary
 */
export function HealthScoreTrendBadge({ trend }) {
  if (!trend) return null;

  const isImproving = trend.direction === "improving";
  const isDeclining = trend.direction === "declining";

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
      style={{
        backgroundColor: isImproving ? "#ecfdf5" : isDeclining ? "#fef2f2" : "#fffbeb",
        color: isImproving ? "#10b981" : isDeclining ? "#ef4444" : "#f59e0b"
      }}
    >
      {isImproving && <TrendingUp className="w-3 h-3" />}
      {isDeclining && <TrendingDown className="w-3 h-3" />}
      {!isImproving && !isDeclining && <Minus className="w-3 h-3" />}
      {trend.direction === "improving" && `+${trend.percentChange}%`}
      {trend.direction === "declining" && `-${Math.abs(trend.percentChange)}%`}
      {trend.direction === "stable" && "Stable"}
    </div>
  );
}
