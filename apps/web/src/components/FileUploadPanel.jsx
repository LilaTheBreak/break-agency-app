import React, { useCallback, useEffect, useState } from "react";
import { uploadFileRequest, listFilesRequest, deleteFileRequest } from "../services/fileClient.js";
import { useFileInsights } from "../hooks/useFileInsights.js";
import DealExtractorPanel from "./DealExtractorPanel.jsx";
import DocumentTextExtractor from "./DocumentTextExtractor.jsx";
import { FeatureGate, useFeature, DisabledNotice } from "./FeatureGate.jsx";

const UPLOAD_FLAG = "FILE_UPLOAD_ENABLED";

export function FileUploadPanel({ session, folder, title, description, userId, onAddToDeal }) {
  // UNLOCK WHEN: FILE_UPLOAD_ENABLED flag + /api/files endpoints functional + S3 storage configured
  const isUploadEnabled = useFeature(UPLOAD_FLAG);
  
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState("");

  const {
    loading: insightsLoading,
    error: insightsError,
    data: insightsData,
    extractInsights,
    reset: resetInsights
  } = useFileInsights();

  const loadFiles = useCallback(async () => {
    if (!session?.email) return;
    setLoading(true);
    setError("");
    try {
      const response = await listFilesRequest({ folder, userId });
      setFiles(response.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load files");
    } finally {
      setLoading(false);
    }
  }, [folder, session, userId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const response = await uploadFileRequest({ file, folder });
      setFiles((prev) => [response.file, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      await deleteFileRequest({ id });
      setFiles((prev) => prev.filter((file) => file.id !== id));
      if (selectedFileId === id) {
        setSelectedFileId("");
        resetInsights();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete file");
    }
  };

  const handleAnalyse = async (file) => {
    if (!file?.id) return;
    setSelectedFileId(file.id);
    resetInsights();
    try {
      await extractInsights(file.id);
    } catch (err) {
      // errors are handled via state
    }
  };

  const activeFile = files.find((file) => file.id === selectedFileId) || null;
  const confidenceDisplay = insightsData?.confidence !== undefined ? Math.round((insightsData.confidence || 0) * 100) : null;
  const canAddToDeal = typeof onAddToDeal === "function";

  const metadata = insightsData?.metadata || {};

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          {description ? <p className="text-sm text-brand-black/60">{description}</p> : null}
        </div>
        <FeatureGate feature={UPLOAD_FLAG} mode="button">
          <label className="inline-flex cursor-pointer flex-shrink-0 items-center rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading || !session?.email || !isUploadEnabled} />
          </label>
        </FeatureGate>
      </div>
      {!isUploadEnabled && <DisabledNotice feature={UPLOAD_FLAG} />}
      {error ? <p className="mt-3 text-sm text-brand-red">{error}</p> : null}
      {loading ? (
        <p className="mt-3 text-sm text-brand-black/60">Loading attachments…</p>
      ) : files.length ? (
        <ul className="mt-4 space-y-3 text-sm text-brand-black/80">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3"
            >
              <div>
                <p className="font-semibold">{file.filename}</p>
                <p className="text-xs text-brand-black/60">
                  {new Date(file.createdAt).toLocaleString()} · {file.type?.toUpperCase()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em]">
                <button
                  type="button"
                  onClick={() => handleAnalyse(file)}
                  disabled={insightsLoading && selectedFileId === file.id}
                  className="rounded-full border border-brand-black px-3 py-1 text-brand-black hover:bg-brand-black/10 disabled:opacity-50"
                >
                  {insightsLoading && selectedFileId === file.id ? "Analysing..." : "Analyse File"}
                </button>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-brand-black px-3 py-1 text-brand-black hover:bg-brand-black/10"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  className="rounded-full border border-brand-red px-3 py-1 text-brand-red hover:bg-brand-red/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-brand-black/60">No files uploaded yet.</p>
      )}

      {selectedFileId ? (
        <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-black">Insights</p>
              <p className="text-sm text-brand-black/70">{activeFile?.filename || "Selected file"}</p>
            </div>
            {activeFile ? (
              <a
                href={activeFile.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/10"
              >
                Open file
              </a>
            ) : null}
          </div>

          {insightsLoading ? <p className="mt-3 text-sm text-brand-black/70">Analysing file...</p> : null}
          {insightsError ? <p className="mt-3 text-sm text-brand-red">{insightsError}</p> : null}

          {insightsData ? (
            <div className="mt-4 space-y-3 text-sm text-brand-black/80">
              <div>
                <p className="font-semibold">Summary</p>
                <p className="text-brand-black/70">{insightsData.summary || "No summary available."}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-brand-white/60 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Detected File Type</p>
                  <p className="font-semibold text-brand-black">
                    {metadata.detectedType || "Unknown"}
                    {confidenceDisplay !== null ? ` (${confidenceDisplay}% confidence)` : ""}
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-white/60 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Parties</p>
                  <p className="text-brand-black/70">
                    {metadata.parties?.length ? metadata.parties.map((item) => `- ${item}`).join("  ") : "Not detected"}
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-white/60 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Dates Mentioned</p>
                  <p className="text-brand-black/70">
                    {metadata.dates?.length ? metadata.dates.map((date) => `- ${date}`).join("  ") : "Not detected"}
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-white/60 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Suggested Keywords</p>
                  <p className="text-brand-black/70">
                    {metadata.keywords?.length ? metadata.keywords.map((keyword) => `- ${keyword}`).join("  ") : "Not detected"}
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-white/60 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Extracted Amounts</p>
                  <p className="text-brand-black/70">
                    {metadata.amountValues?.length ? metadata.amountValues.map((amount) => `- ${amount}`).join("  ") : "Not detected"}
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-white/60 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Brands Mentioned</p>
                  <p className="text-brand-black/70">
                    {metadata.brandNames?.length ? metadata.brandNames.map((brand) => `- ${brand}`).join("  ") : "Not detected"}
                  </p>
                </div>
              </div>

              {insightsData.supportingTextSnippets?.length ? (
                <details className="rounded-2xl border border-brand-black/10 bg-brand-white/80 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-black">
                    Supporting text snippets (expand)
                  </summary>
                  <ul className="mt-2 space-y-2 text-xs text-brand-black/70">
                    {insightsData.supportingTextSnippets.map((snippet, idx) => (
                      <li key={idx} className="rounded-xl bg-brand-linen/50 p-2">
                        {snippet}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {metadata.detectedType === "contract" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!canAddToDeal}
                    onClick={() => activeFile && insightsData && canAddToDeal && onAddToDeal(activeFile, insightsData)}
                    className="rounded-full border border-brand-black bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
                  >
                    Add to Deal
                  </button>
                  {!canAddToDeal ? (
                    <p className="text-xs text-brand-black/60">Connect a deal selection callback to attach this file manually.</p>
                  ) : null}
                </div>
              ) : null}

              <p className="text-xs text-brand-black/60">
                AI output may be inaccurate. Always review manually before acting on suggestions.
              </p>
            </div>
          ) : !insightsLoading ? (
            <p className="mt-3 text-sm text-brand-black/60">Click "Analyse File" to generate an AI summary and metadata.</p>
          ) : null}

          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Deal terms</p>
            <p className="text-sm text-brand-black/70">Extract text from this document, then summarise deal terms (no legal advice).</p>
            <div className="mt-2">
              <DocumentTextExtractor fileId={selectedFileId} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
