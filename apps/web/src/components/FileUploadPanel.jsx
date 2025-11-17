import React, { useCallback, useEffect, useState } from "react";
import { uploadFileRequest, listFilesRequest, deleteFileRequest } from "../services/fileClient.js";

export function FileUploadPanel({ session, folder, title, description, userId }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!session?.email) return;
    setLoading(true);
    setError("");
    try {
      const response = await listFilesRequest({ folder, session, userId });
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
      const response = await uploadFileRequest({ file, folder, session });
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
      await deleteFileRequest({ id, session });
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete file");
    }
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          {description ? <p className="text-sm text-brand-black/60">{description}</p> : null}
        </div>
        <label className="inline-flex cursor-pointer flex-shrink-0 items-center rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
          {uploading ? "Uploading…" : "Upload file"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading || !session?.email} />
        </label>
      </div>
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
    </section>
  );
}
