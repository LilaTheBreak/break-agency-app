import React, { useState } from "react";

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
      const res = await fetch(`/api/ai/${encodeURIComponent(role)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.email
            ? {
                "x-user-id": session.email,
                ...(session.roles?.length ? { "x-user-roles": session.roles.join(",") } : {})
              }
            : {})
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
    <section className="rounded-3xl border border-brand-black/10 bg-brand-black text-brand-white p-5">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
      {description ? <p className="text-sm text-brand-white/70">{description}</p> : null}
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={canUse ? "Ask AI how to optimize this week…" : "Sign in to ask the assistant"}
        disabled={!canUse || loading}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-brand-white/30 bg-transparent px-3 py-2 text-sm text-brand-white focus:border-brand-white focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={askAssistant}
          disabled={!canUse || loading}
          className="rounded-full bg-brand-red px-4 py-1 text-xs uppercase tracking-[0.3em] disabled:opacity-40"
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
          className="rounded-full border border-brand-white/30 px-4 py-1 text-xs uppercase tracking-[0.3em]"
        >
          Reset
        </button>
      </div>
      {error ? <p className="mt-3 text-xs text-brand-red">{error}</p> : null}
      {response ? (
        <div className="mt-3 rounded-2xl border border-brand-white/20 bg-brand-white/5 p-3 text-sm text-brand-white/80">
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
