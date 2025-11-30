import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchBriefVersions,
  createBriefVersion,
  restoreBriefVersion
} from "../services/briefVersionsClient.js";
import { Badge } from "./Badge.jsx";

export function VersionHistoryCard({
  session,
  briefId,
  data,
  allowCreate = false,
  allowRestore = false
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serializedData = useMemo(() => sanitize(data), [data]);
  const hasBrief = Boolean(briefId);

  const load = useCallback(async () => {
    if (!hasBrief || !session?.email) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchBriefVersions({ briefId });
      setVersions(response.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load versions");
    } finally {
      setLoading(false);
    }
  }, [briefId, hasBrief, session]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!briefId || !session?.email) return;
    try {
      await createBriefVersion({ briefId, data: serializedData });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save version");
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await restoreBriefVersion({ versionId });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to restore version");
    }
  };

  if (!session?.email || !briefId) {
    return (
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/60">
        Sign in to view brief versions.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Version history</p>
        {allowCreate ? (
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em]"
          >
            Save version
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-xs text-brand-red">{error}</p> : null}
      {loading ? (
        <p className="mt-3 text-xs text-brand-black/60">Loading…</p>
      ) : versions.length ? (
        <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex flex-wrap items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white/80 px-3 py-2"
            >
              <div>
                <p className="font-semibold">
                  v{version.versionNumber} · {version.createdBy || "system"}
                </p>
                <p className="text-xs text-brand-black/60">
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </div>
              {allowRestore ? (
                <button
                  type="button"
                  className="rounded-full border border-brand-black px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em]"
                  onClick={() => handleRestore(version.id)}
                >
                  Restore
                </button>
              ) : (
                <Badge tone="neutral">View</Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-brand-black/60">No versions yet.</p>
      )}
    </div>
  );
}

function sanitize(input) {
  if (!input) return {};
  try {
    return JSON.parse(JSON.stringify(input));
  } catch {
    return { note: String(input) };
  }
}
