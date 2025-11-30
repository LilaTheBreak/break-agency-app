import React, { useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function AiAssistantCard({ session, role, title = "AI Assistant", description }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");

  const canUse = Boolean(session?.email);

  const askAssistant = async () => {
    if (!input.trim() || !canUse) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/ai/${encodeURIComponent(role)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userInput: input })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Request failed");
      }
      const payload = await res.json();
      setResponse(payload.suggestions || "No suggestions returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to contact AI assistant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white text-brand-black p-5 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
      {description ? <p className="text-sm text-brand-black/60">{description}</p> : null}
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={canUse ? "Ask AI how to optimize this week…" : "Sign in to ask the assistant"}
        disabled={!canUse || loading}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-brand-black/20 bg-brand-linen/70 px-3 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={askAssistant}
          disabled={!canUse || loading}
          className="rounded-full bg-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-white disabled:opacity-40"
        >
          {loading ? "Thinking…" : "Ask AI"}
        </button>
        <button
          type="button"
          onClick={() => {
            setInput("");
            setResponse("");
            setError("");
          }}
          className="rounded-full border border-brand-black/30 px-4 py-1 text-xs uppercase tracking-[0.3em]"
        >
          Reset
        </button>
      </div>
      {error ? <p className="mt-3 text-xs text-brand-red">{error}</p> : null}
      {response ? (
        <div className="mt-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3 text-sm text-brand-black/80">
          {response.split("\n").map((line, index) => (
            <p key={`${line}-${index}`} className="mb-1">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
