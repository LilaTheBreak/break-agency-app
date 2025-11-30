import React, { useCallback, useRef, useState } from "react";
import { useFileUploads } from "../hooks/useFileUploads.js";

export default function FileUploader({ onUploaded }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("");
  const { loading, error, requestUploadUrl, confirmUpload } = useFileUploads();

  const handleSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("Requesting upload URL...");
    const { uploadUrl, fileKey } = await requestUploadUrl({
      filename: file.name,
      contentType: file.type || "application/octet-stream"
    });
    setStatus("Uploading to storage...");
    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });
    setStatus("Confirming...");
    const saved = await confirmUpload({ fileKey, filename: file.name, type: file.type || "file" });
    setStatus("Uploaded");
    onUploaded?.(saved);
  }, [confirmUpload, onUploaded, requestUploadUrl]);

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white transition hover:bg-brand-red"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleSelect}
        />
        <p className="text-sm text-brand-black/60">{status}</p>
      </div>
      {error ? <p className="mt-2 text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}
