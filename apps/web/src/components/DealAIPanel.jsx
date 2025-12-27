import React, { useState } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * Deal AI Intelligence Panel
 * Displays AI-extracted deal data and negotiation insights
 */
export default function DealAIPanel({ emailId, dealId }) {
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  const handleExtractDeal = async () => {
    if (!emailId) return;
    setExtracting(true);
    setError("");
    try {
      const response = await apiFetch("/api/ai/deal/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      if (!response.ok) {
        throw new Error(`Failed to extract deal: ${response.status}`);
      }
      const result = await response.json();
      setExtracted(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract deal");
    } finally {
      setExtracting(false);
    }
  };

  const handleGetInsights = async () => {
    if (!dealId) return;
    setError("");
    try {
      const response = await apiFetch("/api/ai/deal/negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      if (!response.ok) {
        throw new Error(`Failed to get insights: ${response.status}`);
      }
      const result = await response.json();
      setInsights(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get negotiation insights");
    }
  };

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-gradient-to-br from-brand-linen/60 to-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">AI Intelligence</p>
          <h3 className="font-display text-xl uppercase text-brand-black">Deal Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {emailId && (
            <button
              type="button"
              onClick={handleExtractDeal}
              disabled={extracting}
              className="rounded-full border border-brand-black/20 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black hover:bg-brand-black/5 disabled:opacity-50"
            >
              {extracting ? "Extracting..." : "Extract Deal"}
            </button>
          )}
          {dealId && (
            <button
              type="button"
              onClick={handleGetInsights}
              className="rounded-full border border-brand-red bg-brand-red px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-brand-red/90"
            >
              Get Insights
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-brand-red/20 bg-brand-red/5 p-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      {extracted && (
        <div className="rounded-xl border border-brand-black/10 bg-white p-4 space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black">
            Extracted Deal Terms
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {extracted.brandName && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-black/60">Brand</p>
                <p className="text-sm font-medium text-brand-black mt-1">{extracted.brandName}</p>
              </div>
            )}
            {extracted.dealValue && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-black/60">Value</p>
                <p className="text-sm font-medium text-brand-black mt-1">
                  {extracted.currency || "$"}{extracted.dealValue.toLocaleString()}
                </p>
              </div>
            )}
            {extracted.contactEmail && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-black/60">Contact</p>
                <p className="text-sm font-medium text-brand-black mt-1">{extracted.contactEmail}</p>
              </div>
            )}
            {extracted.deliverables && extracted.deliverables.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-black/60">Deliverables</p>
                <ul className="mt-1 space-y-1">
                  {extracted.deliverables.map((item, idx) => (
                    <li key={idx} className="text-sm text-brand-black flex items-start gap-2">
                      <span className="text-brand-red mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {insights && insights.message && (
        <div className="rounded-xl border border-brand-black/10 bg-white p-4 space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black">
            Negotiation Insights
          </h4>
          <p className="text-sm text-brand-black/80">{insights.message}</p>
        </div>
      )}

      {!extracted && !insights && !error && (
        <p className="text-sm text-brand-black/60 text-center py-4">
          {emailId
            ? "Click 'Extract Deal' to analyze email content with AI"
            : "Link an email or create a deal to enable AI analysis"}
        </p>
      )}
    </div>
  );
}
