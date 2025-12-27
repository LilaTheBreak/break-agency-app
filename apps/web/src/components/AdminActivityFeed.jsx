import React, { useState, useEffect, useMemo } from "react";
import { getRecentActivity } from "../services/dashboardClient.js";
import { useAuth } from "../context/AuthContext.jsx";

export function AdminActivityFeed() {
  const { hasRole } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadActivity() {
      // Check role before making API call
      if (!hasRole("ADMIN", "SUPERADMIN")) {
        setActivities([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getRecentActivity(7);
        setActivities(data);
      } catch (err) {
        console.error("Activity feed error:", err);
        // Silent failure for permission errors
        if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
          setActivities([]);
          setError(null);
        } else {
          setError("Unable to load recent activity");
        }
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [hasRole]);

  const grouped = useMemo(() => {
    const groups = new Map();
    activities.forEach((activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date).push(activity);
    });
    return Array.from(groups.entries());
  }, [activities]);

  return (
    <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Admin activity</p>
          <h3 className="font-display text-3xl uppercase">Recent Actions</h3>
          <p className="mt-1 text-xs text-brand-black/50">Last 7 days</p>
        </div>
        {loading && (
          <span className="text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/40">Syncing…</span>
        )}
      </div>
      {error ? (
        <p className="mt-4 text-sm text-brand-black/60">{error}</p>
      ) : (
        <div className="mt-4 space-y-5">
          {loading && !activities.length ? (
             <p className="text-sm text-brand-black/60">Loading activity...</p>
          ) : grouped.length > 0 ? (
            grouped.map(([date, entries]) => (
              <div key={date}>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{date}</p>
                <div className="mt-2 space-y-2">
                  {entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3 text-sm text-brand-black/80"
                    >
                      <p className="font-semibold uppercase tracking-[0.2em] text-brand-black">{entry.action}</p>
                      <p className="text-xs text-brand-black/60">
                        {new Date(entry.createdAt).toLocaleTimeString()} · Actor: {entry.user?.name || "system"}
                      </p>
                      {entry.details && Object.keys(entry.details).length > 0 ? (
                        <pre className="mt-1 text-[0.6rem] text-brand-black/60">
                          {JSON.stringify(entry.details)}
                        </pre>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div>
              <p className="text-sm text-brand-black/60">No recent activity</p>
              <p className="mt-1 text-xs text-brand-black/40">Actions like approvals, role changes, and resource updates appear here</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
