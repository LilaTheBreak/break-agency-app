import React, { useEffect, useMemo, useState } from "react";
import { fetchProfile } from "../services/profileClient.js";
import { Badge } from "../components/Badge.jsx";

const EXCLUSIVE_EMAIL = "exclusive@talent.com";

const DEFAULT_METRICS = [
  { label: "Instagram", followers: 0, growth: 0 },
  { label: "TikTok", followers: 0, growth: 0 },
  { label: "YouTube", followers: 0, growth: 0 }
];

export function ExclusiveSocialPanel() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchProfile(EXCLUSIVE_EMAIL)
      .then((data) => {
        if (active) {
          setProfile(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load linked socials right now.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const chartData = useMemo(() => buildChartData(profile), [profile]);

  if (!profile && !error) {
    return (
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white/90 p-6" id="exclusive-socials">
        <p className="text-sm text-brand-black/60">Loading socials…</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white/90 p-6" id="exclusive-socials">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Socials</p>
          <h3 className="font-display text-2xl uppercase">Amplification lanes</h3>
          <p className="text-sm text-brand-black/70">
            Auto-pulls from the creator profile. Metrics are mock data for preview purposes.
          </p>
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-brand-red">{error}</p>
      ) : (
        <div className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {chartData.metrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
              >
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-black/60">
                  {metric.label}
                </p>
                <p className="font-display text-3xl uppercase text-brand-black">
                  {metric.followers.toLocaleString()}
                </p>
                <p className="text-xs text-brand-black/50">Followers</p>
                <p className="mt-2 text-xs text-brand-red">{metric.growth}% last 30d</p>
              </article>
            ))}
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              Performance trend
            </p>
            <LineChart points={chartData.trend} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(profile?.links || []).map((link, index) => (
              <article
                key={`${link.url}-${index}`}
                className="rounded-2xl border border-brand-black/10 bg-brand-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-black">{link.label || "Social link"}</p>
                  <Badge tone="neutral">Live</Badge>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand-red underline"
                >
                  {link.url}
                </a>
              </article>
            ))}
            {(profile?.links || []).length === 0 ? (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4 text-sm text-brand-black/60">
                No social links have been saved yet. Add them from the creator's profile.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function buildChartData(profile) {
  if (!profile?.links?.length) {
    return { metrics: DEFAULT_METRICS, trend: generateTrend(DEFAULT_METRICS) };
  }
  const metrics = profile.links.slice(0, 3).map((link, index) => ({
    label: link.label || `Channel ${index + 1}`,
    followers: Math.floor(120000 / (index + 1)),
    growth: index === 0 ? 12 : index === 1 ? 8 : 5
  }));
  return { metrics, trend: generateTrend(metrics) };
}

function generateTrend(metrics) {
  const weeks = 6;
  return Array.from({ length: weeks }).map((_, idx) => {
    const base = metrics.reduce((sum, metric) => sum + metric.followers, 0) / metrics.length;
    const noise = Math.sin(idx) * 1500;
    return {
      label: `Week ${idx + 1}`,
      value: Math.max(0, base + noise + idx * 250)
    };
  });
}

function LineChart({ points }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - (point.value / max) * 100;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-3">
      <svg viewBox="0 0 100 100" className="h-40 w-full">
        <path d={path} fill="none" stroke="#d63031" strokeWidth="2" />
        {points.map((point, index) => {
          const x = (index / (points.length - 1)) * 100;
          const y = 100 - (point.value / max) * 100;
          return <circle key={point.label} cx={x} cy={y} r={1.5} fill="#d63031" />;
        })}
      </svg>
      <div className="mt-2 grid grid-cols-3 text-xs text-brand-black/60">
        {points.slice(-3).map((point) => (
          <div key={point.label}>
            <p>{point.label}</p>
            <p className="font-semibold">{Math.round(point.value).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
