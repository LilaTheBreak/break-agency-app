import React, { useState } from "react";
import { useAiSmartActions } from "../../hooks/useAiSmartActions.js";

export default function SmartActionBar({ threadId, onInsertDraft }) {
  const { generateReply, loading } = useAiSmartActions();
  const [error, setError] = useState("");

  const handleClick = async (intent) => {
    try {
      setError("");
      const draft = await generateReply({ threadId, intent });
      if (draft) {
        onInsertDraft?.(draft);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reply");
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleClick("accept")}
          disabled={loading}
          className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-emerald-700"
        >
          Accept Offer
        </button>
        <button
          type="button"
          onClick={() => handleClick("decline")}
          disabled={loading}
          className="rounded-full bg-brand-red px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-brand-red/80"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => handleClick("negotiate")}
          disabled={loading}
          className="rounded-full bg-brand-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-white transition hover:bg-brand-black/80"
        >
          Negotiate
        </button>
        <button
          type="button"
          onClick={() => handleClick("custom")}
          disabled={loading}
          className="rounded-full border border-brand-black/10 bg-brand-linen px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-red/10"
        >
          Create Custom Reply
        </button>
      </div>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}
