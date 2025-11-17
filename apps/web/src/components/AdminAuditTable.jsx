import React from "react";
import { useAuditLogs } from "../hooks/useAuditLogs.js";

export function AdminAuditTable() {
  const { logs, loading, error, reload } = useAuditLogs();

  return (
    <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Audit logs</p>
          <h3 className="font-display text-3xl uppercase">Sensitive actions</h3>
        </div>
        <button
          type="button"
          onClick={reload}
          className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-brand-black/60">Loading entries…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-brand-red">{error}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-brand-black/80">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-brand-black/50">
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2 pr-3">IP</th>
                <th className="py-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-brand-black/10">
                  <td className="py-2 pr-3 text-xs text-brand-black/60">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-xs">{log.actorId || "—"}</td>
                  <td className="py-2 pr-3 text-xs uppercase tracking-[0.2em] text-brand-black">{log.action}</td>
                  <td className="py-2 pr-3 text-xs">{log.targetId || "—"}</td>
                  <td className="py-2 pr-3 text-xs text-brand-black/60">{log.ip || "—"}</td>
                  <td className="py-2 text-xs text-brand-black/60">
                    <pre className="max-w-xs truncate text-[0.6rem]">
                      {JSON.stringify(log.metadata ?? {}, null, 0) || "{}"}
                    </pre>
                  </td>
                </tr>
              ))}
              {!logs.length ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-brand-black/50">
                    No audit entries yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
