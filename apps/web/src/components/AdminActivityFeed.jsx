import React, { useMemo } from "react";
import { useAdminActivityFeed } from "../hooks/useAdminActivityFeed.js";

export function AdminActivityFeed() {
  const { activities, loading, error } = useAdminActivityFeed({ interval: 8000 });

  const grouped = useMemo(() => {
    const groups = new Map();
    activities.forEach((activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString();
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
          <h3 className="font-display text-3xl uppercase">Live feed</h3>
        </div>
        <span className="text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/60">
          {loading ? "Syncing…" : "Live"}
        </span>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-brand-red">{error}</p>
      ) : (
        <div className="mt-4 space-y-5">
          {grouped.map(([date, entries]) => (
            <div key={date}>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{date}</p>
              <div className="mt-2 space-y-2">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3 text-sm text-brand-black/80"
                  >
                    <p className="font-semibold uppercase tracking-[0.2em] text-brand-black">{entry.event}</p>
                    <p className="text-xs text-brand-black/60">
                      {new Date(entry.createdAt).toLocaleTimeString()} · Actor: {entry.actorId || "system"} · IP:{" "}
                      {entry.ip || "–"}
                    </p>
                    {entry.metadata ? (
                      <pre className="mt-1 text-[0.6rem] text-brand-black/60">
                        {JSON.stringify(entry.metadata, null, 0)}
                      </pre>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
          {!grouped.length && !loading ? (
            <p className="text-sm text-brand-black/60">No admin activity yet.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
