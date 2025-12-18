import React, { useCallback, useMemo, useState } from "react";
import { useSocialInsights } from "../hooks/useSocialInsights.js";
import { FeatureGate, useFeature, DisabledNotice } from "./FeatureGate.jsx";

// UNLOCK WHEN: AI_SOCIAL_INSIGHTS flag set to true + /api/ai/social-insights working
export function SocialInsightsPanel({ userId, onExport }) {
  const isAIEnabled = useFeature("AI_SOCIAL_INSIGHTS");
  const { loading, error, insights, generateInsights } = useSocialInsights();
  const [lastRun, setLastRun] = useState(null);

  const handleGenerate = useCallback(async () => {
    if (!userId) return;
    try {
      await generateInsights(userId);
      setLastRun(new Date());
    } catch (err) {
      // handled via hook state
    }
  }, [generateInsights, userId]);

  const lastRunLabel = useMemo(() => {
    if (!lastRun) return "Not run yet";
    const diffMs = Date.now() - lastRun.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  }, [lastRun]);

  const platformEntries = useMemo(() => {
    if (!insights?.platformSpecific || typeof insights.platformSpecific !== "object") return [];
    return Object.entries(insights.platformSpecific).filter(([key]) => key);
  }, [insights]);

  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <DisabledNotice feature="AI_SOCIAL_INSIGHTS" className="mb-4" />
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">AI Insights</p>
          <h3 className="font-display text-3xl uppercase">Talent performance breakdown</h3>
          <p className="text-xs text-brand-black/60">Last analysis: {lastRunLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FeatureGate feature="AI_SOCIAL_INSIGHTS" mode="button">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!userId || loading}
              className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate AI Insights"}
            </button>
          </FeatureGate>
          <FeatureGate feature="AI_SOCIAL_INSIGHTS" mode="button">
            <button
              type="button"
              onClick={() => onExport && insights && onExport(insights)}
              disabled={!onExport || !insights}
              className="rounded-full border border-brand-black/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70 disabled:opacity-40"
            >
              Export Insights
            </button>
          </FeatureGate>
        </div>
      </div>

      {error ? <p className="text-sm text-brand-red">{error}</p> : null}

      {!insights && !loading ? (
        <p className="text-sm text-brand-black/70">Trigger analysis to see engagement trends and posting cues.</p>
      ) : null}

      {loading ? <p className="text-sm text-brand-black/70">Analysing recent social signals...</p> : null}

      {insights ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-black/70">Engagement overview</h4>
            <p className="text-sm text-brand-black/80">{insights.engagementSummary || "No engagement summary yet."}</p>
          </div>
          <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-black/70">Growth trajectory</h4>
            <p className="text-sm text-brand-black/80">{insights.growthSummary || "No growth notes yet."}</p>
          </div>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-black/70">Content themes</h4>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-black/80">
              {insights.contentThemes?.length ? (
                insights.contentThemes.map((theme) => (
                  <span key={theme} className="rounded-full border border-brand-black/20 px-3 py-1">
                    {theme}
                  </span>
                ))
              ) : (
                <span className="text-brand-black/60">No themes detected yet.</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-black/70">Posting rhythm</h4>
            <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
              {insights.bestTimes?.length ? (
                insights.bestTimes.map((item) => (
                  <li key={item} className="rounded-xl bg-brand-linen/60 px-3 py-2">
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-brand-black/60">No timing pattern detected.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-black/70">Platform summary</h4>
              {typeof insights.confidence === "number" ? (
                <span className="text-xs text-brand-black/60">Confidence {Math.round(insights.confidence * 100)}%</span>
              ) : null}
            </div>
            {platformEntries.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {platformEntries.map(([platform, note]) => (
                  <div key={platform} className="rounded-xl border border-brand-black/10 bg-brand-white/80 p-3 text-sm text-brand-black/80">
                    <p className="text-xs uppercase tracking-[0.25em] text-brand-black/60">{platform}</p>
                    <p>{typeof note === "string" ? note : JSON.stringify(note)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-brand-black/60">No platform-specific notes yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4 md:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-black/70">Benchmarks</h4>
            <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
              {insights.benchmarkNotes?.length ? (
                insights.benchmarkNotes.map((note) => (
                  <li key={note} className="rounded-xl bg-brand-linen/50 px-3 py-2">
                    {note}
                  </li>
                ))
              ) : (
                <li className="text-brand-black/60">No benchmark notes yet.</li>
              )}
            </ul>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-brand-black/60">
        AI output is suggestive only. Avoid treating this as directive guidance; always validate against real results.
      </p>
    </section>
  );
}
