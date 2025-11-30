import React, { useState } from "react";
import { CATEGORY_STYLES } from "../../constants/threadCategories.js";

export default function ThreadListItem({ thread, classification }) {
  const style = classification?.category
    ? CATEGORY_STYLES[classification.category] || CATEGORY_STYLES.Other
    : null;
  const hasCalendarEvent = thread?.hasCalendarEvent || thread?.eventLinked || false;
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const platform = thread?.platform || "email";
  const snippet = (thread?.parsed?.body || "").slice(0, 140);
  const aiCategory = (thread?.aiCategory || classification?.category || "").toLowerCase();

  const aiBadge =
    aiCategory.includes("deal") || aiCategory === "pr"
      ? "AI: Deal Opportunity"
      : aiCategory.includes("gift")
        ? "AI: Gift Offer"
        : aiCategory.includes("invite") || aiCategory.includes("event")
          ? "AI: Event Invite"
          : thread?.aiUrgency === "low"
            ? "AI: Low Priority"
            : aiCategory
              ? `AI: ${aiCategory}`
              : null;

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-black/70">
              {platform}
            </span>
            {aiBadge ? (
              <span className="rounded-full bg-brand-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-red">
                {aiBadge}
              </span>
            ) : null}
            {classification ? (
              <span
                className={`inline-block max-w-[180px] truncate rounded-full px-2 py-1 text-xs font-semibold ${style?.color}`}
                title={style?.label}
              >
                {style?.label || "General"}
              </span>
            ) : (
              <span className="inline-block rounded-full bg-neutral-300 px-2 py-1 text-xs text-black">Analysing…</span>
            )}
          </div>
          <p className="truncate text-sm font-semibold text-brand-black">{thread.parsed?.from || "Unknown sender"}</p>
          <p className="truncate text-base font-display uppercase text-brand-black">
            {thread.parsed?.subject || "(No subject)"}
          </p>
          <p className="text-sm text-brand-black/70">{snippet}</p>
        </div>
        <div className="shrink-0 text-right">
          {thread?.parsed?.date ? (
            <p className="text-xs text-brand-black/60">{new Date(thread.parsed.date).toLocaleString()}</p>
          ) : null}
          {hasCalendarEvent ? (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-black/10 px-2 py-1 text-[11px] font-semibold text-brand-black/80">
                <span role="img" aria-label="calendar">
                  📅
                </span>
                Event saved
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-brand-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
        >
          Reply
        </button>
        <button
          type="button"
          onClick={() => setAutoReplyEnabled((prev) => !prev)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
            autoReplyEnabled
              ? "border-brand-red bg-brand-red text-brand-white"
              : "border-brand-black/30 text-brand-black hover:bg-brand-black/5"
          }`}
        >
          Auto-reply
        </button>
        <button
          type="button"
          className="rounded-full border border-brand-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
        >
          Convert to deal
        </button>
        <button
          type="button"
          className="rounded-full border border-brand-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
        >
          Set reminder
        </button>
        <button
          type="button"
          className="rounded-full border border-brand-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
        >
          Link to thread
        </button>
      </div>
    </div>
  );
}
