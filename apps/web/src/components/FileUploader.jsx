import React, { useCallback, useRef, useState } from "react";
import { useFileUploads } from "../hooks/useFileUploads.js";

export default function FileUploader({ onUploaded }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const { loading, error, requestUploadUrl, confirmUpload } = useFileUploads();

  const handleSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setStatus("Requesting upload URL...");
      setUploadProgress(10);
      
      const { uploadUrl, fileKey } = await requestUploadUrl({
        filename: file.name,
        contentType: file.type || "application/octet-stream"
      });
      
      setStatus(`Uploading ${file.name}...`);
      setUploadProgress(30);
      
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });
      
      setStatus("Confirming upload...");
      setUploadProgress(80);
      
      const saved = await confirmUpload({ fileKey, filename: file.name, type: file.type || "file" });
      
      setStatus("✓ Upload complete");
      setUploadProgress(100);
      
      setTimeout(() => {
        setStatus("");
        setUploadProgress(0);
      }, 2000);
      
      onUploaded?.(saved);
    } catch (err) {
      setStatus("Upload failed");
      setUploadProgress(0);
      console.error("Upload error:", err);
    }
  }, [confirmUpload, onUploaded, requestUploadUrl]);

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-red disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          {loading && (
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          )}
          {loading ? "Uploading..." : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleSelect}
        />
        <div className="flex-1">
          <p className="text-sm text-brand-black/60">{status}</p>
          {loading && uploadProgress > 0 && (
            <div className="mt-1 h-1.5 w-full rounded-full bg-brand-black/10 overflow-hidden">
              <div 
                className="h-full bg-brand-red transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}
