import React, { useState } from "react";
import { useDealExtraction } from "../hooks/useDealExtraction.js";
import { getSuitabilityScore } from "../hooks/useSuitability.js";
import SuitabilityScore from "./SuitabilityScore.jsx";

export default function DealExtractorPanel({ sourceText = "" }) {
  const [result, setResult] = useState(null);
  const [text, setText] = useState(sourceText || "");
  const { loading, error, extract } = useDealExtraction();
  const [fitResult, setFitResult] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState("");

  const handleRun = async () => {
    if (!text.trim()) return;
    const output = await extract(text.trim());
    setResult(output);
  };

  const handleFit = async () => {
    setFitLoading(true);
    setFitError("");
    try {
      const result = await getSuitabilityScore({
        talent: {
          categories: ["fashion", "lifestyle"],
          audienceInterests: ["beauty", "shopping"],
          avgEngagementRate: 3.4,
          platforms: ["instagram", "tiktok"],
          brandSafetyFlags: []
        },
        brief: {
          industry: "fashion",
          targetInterests: ["fashion", "beauty"],
          goals: ["awareness"],
          requiredPlatforms: ["instagram", "tiktok"],
          excludedCategories: []
        }
      });
      setFitResult(result);
    } catch (err) {
      setFitError(err instanceof Error ? err.message : "Unable to calculate fit");
    } finally {
      setFitLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Deal terms</p>
          <h3 className="text-lg font-semibold text-brand-black">Extract deal terms</h3>
        </div>
        <button
          className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
          disabled={loading || !text.trim()}
          onClick={handleRun}
        >
          {loading ? "Analysing..." : "Extract Deal Terms"}
        </button>
      </div>

      <textarea
        className="w-full rounded-xl border border-brand-black/10 bg-brand-linen/40 p-3 text-sm text-brand-black"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste email, contract, or doc text to extract key terms."
      />

      {error ? <p className="text-sm text-brand-red">{error}</p> : null}

      {result ? (
        <pre className="max-h-72 overflow-auto rounded-xl bg-brand-linen/60 p-3 text-xs text-brand-black/90">
{JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Suitability</p>
            <p className="text-sm text-brand-black/80">Pattern-based talent-brand fit (no identity inference).</p>
          </div>
          <button
            type="button"
            onClick={handleFit}
            disabled={fitLoading}
            className="rounded-full border border-brand-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black disabled:opacity-50"
          >
            {fitLoading ? "Scoring..." : "Score fit"}
          </button>
        </div>
        {fitError ? <p className="text-sm text-brand-red">{fitError}</p> : null}
        {fitResult ? (
          <div className="mt-3">
            <SuitabilityScore {...fitResult} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
