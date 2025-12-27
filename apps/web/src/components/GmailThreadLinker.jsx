import React, { useState } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * Gmail Thread Linker
 * Allows manual linking of outreach records to Gmail threads
 */
export default function GmailThreadLinker({ outreachId, currentThreadId, onLinked }) {
  const [linking, setLinking] = useState(false);
  const [threadIdInput, setThreadIdInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleLinkThread = async () => {
    if (!threadIdInput.trim()) {
      setError("Please enter a Gmail thread ID or URL");
      return;
    }

    setLinking(true);
    setError("");
    setSuccess(false);

    try {
      // Extract thread ID from URL if full URL was pasted
      let gmailThreadId = threadIdInput.trim();
      const urlMatch = threadIdInput.match(/thread-[a-zA-Z0-9_-]+|[a-fA-F0-9]{16}/);
      if (urlMatch) {
        gmailThreadId = urlMatch[0];
      }

      const response = await apiFetch(`/api/outreach/records/${outreachId}/link-gmail-thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailThreadId }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Failed to link thread: ${response.status}`);
      }

      setSuccess(true);
      setThreadIdInput("");
      onLinked?.(gmailThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link Gmail thread");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-white p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Gmail Integration</p>
        <h3 className="font-semibold text-brand-black">Link Thread</h3>
      </div>

      {currentThreadId && (
        <div className="rounded-lg bg-brand-linen/40 p-3 text-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-black/60">Current Thread</p>
          <p className="text-brand-black mt-1 font-mono text-xs break-all">{currentThreadId}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.25em] text-brand-black/60">
          Gmail Thread ID or URL
          <input
            type="text"
            value={threadIdInput}
            onChange={(e) => setThreadIdInput(e.target.value)}
            placeholder="Paste Gmail thread URL or ID"
            className="mt-1 w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
            disabled={linking}
          />
        </label>
        <button
          type="button"
          onClick={handleLinkThread}
          disabled={linking || !threadIdInput.trim()}
          className="w-full rounded-full border border-brand-black bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black/90 disabled:opacity-50"
        >
          {linking ? "Linking..." : "Link Thread"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-brand-red/20 bg-brand-red/5 p-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700">
          ✓ Gmail thread linked successfully
        </div>
      )}

      <p className="text-xs text-brand-black/50">
        Paste a Gmail thread URL or thread ID to connect this outreach record with email correspondence.
      </p>
    </div>
  );
}
