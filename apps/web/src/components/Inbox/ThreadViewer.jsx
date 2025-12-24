import React, { useRef, useState } from "react";
import { useAiThreadSummary } from "../../hooks/useAiThreadSummary.js";
import { useAiThreadClassification } from "../../hooks/useAiThreadClassification.js";
import { useEventExtraction } from "../../hooks/useEventExtraction.js";
import SmartActionBar from "./SmartActionBar.jsx";
import Composer from "./Composer.jsx";
import { CATEGORY_STYLES } from "../../constants/threadCategories.js";
import { apiFetch } from "../../services/apiClient.js";
import DealExtractorPanel from "../DealExtractorPanel.jsx";
import RiskWarnings from "../RiskWarnings.jsx";
import { checkRisk } from "../../hooks/useRiskCheck.js";
import AuthenticityWarnings from "../AuthenticityWarnings.jsx";
import { checkAuthenticity } from "../../hooks/useAuthenticityCheck.js";

const SENTIMENT_CLASS = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-brand-black/10 text-brand-black",
  negative: "bg-brand-red/10 text-brand-red"
};

export default function ThreadViewer({ thread }) {
  const composerRef = useRef(null);
  const { summary, loading, error } = useAiThreadSummary(thread?.id);
  const { data: classification, loading: classLoading } = useAiThreadClassification(thread?.id);
  const { data: eventSuggestion, loading: eventLoading, error: eventError, extract: extractEvent } = useEventExtraction(thread?.id);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    start: "",
    end: "",
    location: "",
    description: ""
  });

  const sentimentClass = summary?.sentiment ? SENTIMENT_CLASS[summary.sentiment] || SENTIMENT_CLASS.neutral : SENTIMENT_CLASS.neutral;
  const score = summary?.opportunityScore ?? 0;
  const scoreColor = score >= 75 ? "bg-emerald-500 text-white" : score >= 50 ? "bg-yellow-400 text-brand-black" : "bg-brand-red text-white";
  const [riskResult, setRiskResult] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [authResult, setAuthResult] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleCheckEvent = async () => {
    try {
      const result = await extractEvent();
      setShowEventPanel(true);
      if (result) {
        setEventForm({
          title: result.title || "",
          start: result.start || "",
          end: result.end || "",
          location: result.location || "",
          description: result.description || ""
        });
      }
    } catch {
      setShowEventPanel(true);
    }
  };

  const handleOpenModal = () => {
    if (eventSuggestion) {
      setEventForm({
        title: eventSuggestion.title || "",
        start: eventSuggestion.start || "",
        end: eventSuggestion.end || "",
        location: eventSuggestion.location || "",
        description: eventSuggestion.description || ""
      });
    }
    setShowEventModal(true);
  };

  const handleSubmitEvent = async () => {
    try {
      const res = await apiFetch("/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventForm,
          source: "email",
          emailId: thread?.id
        })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create event");
      }
      alert("Event added to calendar");
      setShowEventModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  const handleRiskCheck = async () => {
    if (!thread?.parsed?.body) return;
    setRiskLoading(true);
    setRiskError("");
    try {
      const result = await checkRisk(thread.parsed.body);
      setRiskResult(result);
    } catch (err) {
      setRiskError(err instanceof Error ? err.message : "Unable to check risk");
    } finally {
      setRiskLoading(false);
    }
  };

  const extractLinks = (text: string) => {
    const matches = text.match(/https?:\/\/[^\s)]+/gi);
    return matches || [];
  };

  const handleAuthenticityCheck = async () => {
    if (!thread?.parsed?.body) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await checkAuthenticity({
        senderEmail: thread?.parsed?.from,
        text: thread.parsed.body,
        links: extractLinks(thread.parsed.body)
      });
      setAuthResult(result);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to check authenticity");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Thread Classification</p>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              classification?.category
                ? (CATEGORY_STYLES[classification.category]?.color || CATEGORY_STYLES.Other.color)
                : "bg-neutral-300 text-black"
            }`}
          >
            {classification?.category
              ? CATEGORY_STYLES[classification.category]?.label || "General"
              : "Analysing…"}
          </span>
          <div className="flex items-center gap-2">
            <p className="text-xs text-brand-black/60">Confidence</p>
            <div className="w-32 rounded bg-black/10">
              <div
                className="h-2 rounded bg-brand-black transition-all"
                style={{ width: `${classification?.confidence ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-brand-black/60">{classification?.confidence ?? 0}%</p>
          </div>
        </div>
        {classLoading ? (
          <p className="text-sm text-brand-black/60">Loading classification...</p>
        ) : classification?.reasons?.length ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-brand-black/70">
            {classification.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Event suggestion</p>
            <h3 className="text-lg font-semibold text-brand-black">Email → Calendar</h3>
          </div>
          <button
            type="button"
            onClick={handleCheckEvent}
            className="rounded-full border border-brand-black/10 bg-brand-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-white transition hover:bg-brand-red"
          >
            Check for calendar event
          </button>
        </div>
        {showEventPanel ? (
          <div className="mt-3 space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3">
            {eventLoading ? <p className="text-sm text-brand-black/60">Scanning email...</p> : null}
            {eventError ? <p className="text-sm text-brand-red">{eventError}</p> : null}
            {eventSuggestion ? (
              eventSuggestion.hasEvent ? (
                <>
                  <p className="text-sm font-semibold text-brand-black">
                    📅 Event detected: {eventSuggestion.title || "Untitled"}
                  </p>
                  <p className="text-sm text-brand-black/70">
                    🕒 {eventSuggestion.start || "TBD"}
                    {eventSuggestion.end ? ` → ${eventSuggestion.end}` : ""}
                  </p>
                  {eventSuggestion.location ? (
                    <p className="text-sm text-brand-black/70">📍 {eventSuggestion.location}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="rounded-full bg-brand-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-white transition hover:bg-brand-red"
                    >
                      Add to calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEventModal(true)}
                      className="rounded-full border border-brand-black/20 bg-brand-linen px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-red/10"
                    >
                      Edit first
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEvidence((prev) => !prev)}
                      className="text-xs text-brand-black underline"
                    >
                      {showEvidence ? "Hide reasoning" : "Show reasoning"}
                    </button>
                  </div>
                  {showEvidence && (eventSuggestion.reasons?.length || eventSuggestion.description) ? (
                    <div className="rounded-xl border border-brand-black/10 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/70">
                        Why this was suggested
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-sm text-brand-black/70">
                        {(eventSuggestion.reasons || []).map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                        {eventSuggestion.description ? <li>{eventSuggestion.description}</li> : null}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-brand-black/60">No event detected in this email.</p>
              )
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand-black/10 bg-brand-linen p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">AI Summary</p>
            <h3 className="text-lg font-semibold text-brand-black">{summary?.title || "Thread insight"}</h3>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${scoreColor}`}>
            {score}
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-brand-black/60">Loading summary...</p>
        ) : error ? (
          <p className="text-sm text-brand-red">{error}</p>
        ) : summary ? (
          <div className="mt-3 space-y-3">
            {summary.bulletPoints?.length ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-brand-black/80">
                {summary.bulletPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            ) : null}
            {summary.actionItems?.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">Action items</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-brand-black/80">
                  {summary.actionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {summary.sentiment ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${sentimentClass}`}>
                Sentiment: {summary.sentiment}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-brand-black/60">No summary yet.</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAuthenticityCheck}
            disabled={!thread?.parsed?.body || authLoading}
            className="rounded-full border border-brand-orange px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange disabled:opacity-50"
          >
            {authLoading ? "Checking authenticity..." : "Check Authenticity"}
          </button>
          {authError ? <span className="text-xs text-brand-orange">{authError}</span> : null}
        </div>
        <AuthenticityWarnings summary={authResult?.summary} warnings={authResult?.warnings} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRiskCheck}
            disabled={!thread?.parsed?.body || riskLoading}
            className="rounded-full border border-brand-red px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-red disabled:opacity-50"
          >
            {riskLoading ? "Checking risk..." : "Check Risk"}
          </button>
          {riskError ? <span className="text-xs text-brand-red">{riskError}</span> : null}
        </div>
        <RiskWarnings summary={riskResult?.summary} findings={riskResult?.findings} />
      </section>

      <DealExtractorPanel sourceText={thread?.parsed?.body || ""} />

      <SmartActionBar
        threadId={thread?.id}
        onInsertDraft={(text) => composerRef.current?.insertDraft(text)}
      />

      <Composer ref={composerRef} onSend={() => {}} />

      {showEventModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-black/10 bg-brand-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-black">Add to calendar</h3>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="text-sm text-brand-black/60 hover:text-brand-black"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-brand-black">
                Title
                <input
                  value={eventForm.title}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-brand-black/10 p-2 text-sm"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm text-brand-black">
                  Start
                  <input
                    type="datetime-local"
                    value={eventForm.start}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, start: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-brand-black/10 p-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-brand-black">
                  End
                  <input
                    type="datetime-local"
                    value={eventForm.end}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, end: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-brand-black/10 p-2 text-sm"
                  />
                </label>
              </div>
              <label className="block text-sm text-brand-black">
                Location
                <input
                  value={eventForm.location}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-brand-black/10 p-2 text-sm"
                />
              </label>
              <label className="block text-sm text-brand-black">
                Description
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-brand-black/10 p-2 text-sm"
                  rows={3}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEvent}
                  className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-brand-red"
                >
                  Save event
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
