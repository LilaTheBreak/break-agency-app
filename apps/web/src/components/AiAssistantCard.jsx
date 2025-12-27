import React, { useState } from "react";
import { apiFetch } from "../services/apiClient.js";
import { FeatureGate, useFeature, DisabledNotice } from "./FeatureGate.jsx";

// UNLOCK WHEN: AI_ASSISTANT flag set to true + /api/ai/:role endpoints return real responses
export function AiAssistantCard({ session, role, title = "AI Assistant", description }) {
  const isAIEnabled = useFeature("AI_ASSISTANT");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const canUse = Boolean(session?.email);

  // Role-specific suggested prompts
  const suggestedPrompts = {
    admin: [
      "What tasks need my attention today?",
      "Show me pending approvals",
      "Summarize team activity this week",
    ],
    brand: [
      "What campaigns are ready to launch?",
      "Show me creator recommendations",
      "Review my campaign budget status",
    ],
    agent: [
      "Which creators need contract follow-up?",
      "Show me upcoming deliverables",
      "What deals need negotiation?",
    ],
    talent: [
      "What are my upcoming deadlines?",
      "Show me pending brand responses",
      "Help me optimize my content calendar",
    ],
    "exclusive-talent": [
      "What premium opportunities are available?",
      "Show me my performance analytics",
      "What campaigns should I prioritize?",
    ],
    ugc: [
      "What briefs need my response?",
      "Help me plan this week's deliverables",
      "Show me available campaigns",
    ],
  };

  const prompts = suggestedPrompts[role] || suggestedPrompts.admin;

  const askAssistant = async () => {
    if (!input.trim() || !canUse) return;
    setLoading(true);
    setError("");
    setShowSuggestions(false);
    try {
      const res = await apiFetch(`/ai/${encodeURIComponent(role)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          userInput: input,
          userId: session?.id 
        })
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

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
    setShowSuggestions(false);
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white text-brand-black p-5 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          {description ? <p className="text-sm text-brand-black/60">{description}</p> : (
            <p className="mt-1 text-xs text-brand-black/50">Ask questions about your workflow, pending items, and optimization suggestions</p>
          )}
        </div>
        <span className="rounded-full bg-brand-black/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-brand-black/50">Beta</span>
      </div>
      
      <DisabledNotice feature="AI_ASSISTANT" className="mt-3" />

      {showSuggestions && !response && canUse && isAIEnabled ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-brand-black/50 uppercase tracking-[0.3em]">Suggested prompts</p>
          {prompts.map((prompt, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(prompt)}
              className="w-full text-left rounded-xl border border-brand-black/10 bg-brand-linen px-3 py-2 text-sm text-brand-black hover:border-brand-black/30 hover:bg-brand-linen/80 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={canUse ? "Ask AI how to optimize this week…" : "Sign in to ask the assistant"}
        disabled={!canUse || loading || !isAIEnabled}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-brand-black/20 bg-brand-linen px-3 py-2 text-sm text-brand-black placeholder:text-brand-black/50 focus:border-brand-black focus:outline-none disabled:opacity-50"
      />
      <div className="mt-2 flex gap-2">
        <FeatureGate feature="AI_ASSISTANT" mode="button">
          <button
            type="button"
            onClick={askAssistant}
            disabled={!canUse || loading || !input.trim()}
            className="rounded-full bg-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-white disabled:opacity-40 hover:bg-brand-black/80 transition-colors"
          >
            {loading ? "Thinking…" : "Ask AI"}
          </button>
        </FeatureGate>
        <button
          type="button"
          onClick={() => {
            setInput("");
            setResponse("");
            setError("");
            setShowSuggestions(true);
          }}
          disabled={!input && !response && !error}
          className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black hover:text-white transition-colors disabled:opacity-40"
        >
          Reset
        </button>
      </div>
      {loading && (
        <div className="mt-3 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3">
          <p className="text-xs text-brand-black/60 animate-pulse">Analyzing your request...</p>
        </div>
      )}
      {error ? (
        <div className="mt-3 rounded-2xl border border-brand-red/20 bg-red-50 p-3">
          <p className="text-xs font-semibold text-brand-red">Unable to get response</p>
          <p className="mt-1 text-xs text-brand-black/60">{error}</p>
        </div>
      ) : null}
      {response && !loading ? (
        <div className="mt-3 rounded-2xl border border-brand-black/10 bg-brand-linen p-3 text-sm text-brand-black">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/50 mb-2">AI Response</p>
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
