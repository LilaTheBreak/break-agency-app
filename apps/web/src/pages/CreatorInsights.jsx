import { useEffect, useState } from "react";
import { useInsights } from "../hooks/useInsights.js";

export default function CreatorInsightsPage({ userId }) {
  const { getInsights, generateInsights, getWeeklyReports } = useInsights();
  const [insights, setInsights] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!userId) return;
    getInsights(userId).then(setInsights).catch(() => undefined);
    // Weekly reports feature removed - endpoint returns 410
    // getWeeklyReports(userId).then(setReports).catch(() => undefined);
  }, [userId, getInsights]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Creator Performance Insights</h1>

      <button
        className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-red/90"
        onClick={() => generateInsights(userId).then((r) => setInsights((prev) => [r, ...prev]))}
      >
        Generate Latest Insight
      </button>

      {insights.length > 0 ? (
        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-lg font-semibold">Latest Insight</h2>
          <p className="mb-2 text-sm">{insights[0].summary}</p>
          <h3 className="mt-3 font-semibold">Opportunities</h3>
          <p className="text-sm">{insights[0].opportunities}</p>
          <h3 className="mt-3 font-semibold">Content Ideas</h3>
          <ul className="list-disc pl-5 text-sm">
            {(insights[0].contentIdeas || []).map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-brand-black/60">No insights yet.</p>
      )}

      <section className="rounded-xl bg-white p-5 shadow">
        <h2 className="mb-3 text-lg font-semibold">Weekly Reports</h2>
        <p className="text-sm text-brand-black/60">Weekly reports feature is not yet available.</p>
      </section>
    </div>
  );
}
