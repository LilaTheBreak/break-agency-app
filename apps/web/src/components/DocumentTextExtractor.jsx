import React, { useState } from "react";
import { useDocumentExtraction } from "../hooks/useDocumentExtraction.js";
import DealExtractorPanel from "./DealExtractorPanel.jsx";
import RiskWarnings from "./RiskWarnings.jsx";
import { checkRisk } from "../hooks/useRiskCheck.js";
import AuthenticityWarnings from "./AuthenticityWarnings.jsx";
import { checkAuthenticity } from "../hooks/useAuthenticityCheck.js";

export function DocumentTextExtractor({ fileId }) {
  const { loading, error, text, extract } = useDocumentExtraction();
  const [lastRun, setLastRun] = useState(null);
  const [risk, setRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [auth, setAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleExtract = async () => {
    try {
      await extract(fileId);
      setLastRun(new Date());
    } catch {
      /* handled by hook */
    }
  };

  const handleRiskCheck = async () => {
    if (!text) return;
    setRiskLoading(true);
    setRiskError("");
    try {
      const result = await checkRisk(text);
      setRisk(result);
    } catch (err) {
      setRiskError(err instanceof Error ? err.message : "Unable to check risk");
    } finally {
      setRiskLoading(false);
    }
  };

  const extractLinks = (value) => {
    const matches = value.match(/https?:\/\/[^\s)]+/gi);
    return matches || [];
  };

  const handleAuthCheck = async () => {
    if (!text) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await checkAuthenticity({ senderEmail: undefined, text, links: extractLinks(text) });
      setAuth(result);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to check authenticity");
    } finally {
      setAuthLoading(false);
    }
  };

  const lastRunLabel = lastRun ? `${Math.round((Date.now() - lastRun.getTime()) / 60000) || 0}m ago` : "Not run";

  return (
    <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Document text</p>
          <p className="text-sm text-brand-black/70">Last extraction: {lastRunLabel}</p>
        </div>
        <button
          type="button"
          onClick={handleExtract}
          disabled={!fileId || loading}
          className="rounded-full border border-brand-black bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Extract Text"}
        </button>
      </div>

      {error ? <p className="text-sm text-brand-red">{error}</p> : null}

      {text ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Preview</p>
          <div className="max-h-48 overflow-auto rounded-xl bg-brand-linen/50 p-3 text-xs text-brand-black/80 whitespace-pre-wrap">
            {text.slice(0, 4000)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRiskCheck}
              disabled={riskLoading}
              className="rounded-full border border-brand-red px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-red disabled:opacity-50"
            >
              {riskLoading ? "Checking risk..." : "Check Risk"}
            </button>
            {riskError ? <span className="text-xs text-brand-red">{riskError}</span> : null}
          </div>
          <RiskWarnings summary={risk?.summary} findings={risk?.findings} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAuthCheck}
              disabled={authLoading}
              className="rounded-full border border-brand-orange px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange disabled:opacity-50"
            >
              {authLoading ? "Checking authenticity..." : "Check Authenticity"}
            </button>
            {authError ? <span className="text-xs text-brand-orange">{authError}</span> : null}
          </div>
          <AuthenticityWarnings summary={auth?.summary} warnings={auth?.warnings} />
        </div>
      ) : null}

      <DealExtractorPanel sourceText={text} />
    </div>
  );
}

export default DocumentTextExtractor;
