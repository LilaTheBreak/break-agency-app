import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const ENTITY_OPTIONS = [
  { label: "All entity types", value: "" },
  { label: "Auth events", value: "auth" },
  { label: "User profiles", value: "user" },
  { label: "Briefs", value: "brief" },
  { label: "Approvals", value: "approval" },
  { label: "Finance", value: "finance" },
  { label: "Social", value: "social" }
];

const PAGE_LIMIT = 25;

export function AdminActivityPage() {
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState({ userId: "", entityType: "", date: "" });
  const [formState, setFormState] = useState(filters);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_LIMIT
  });

  const fetchLogs = useCallback(async () => {
    // Check role before making API call
    if (!hasRole("ADMIN", "SUPERADMIN")) {
      setLogs([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        page: String(page)
      });
      const trimmedUser = filters.userId.trim();
      if (trimmedUser) params.set("userId", trimmedUser);
      if (filters.entityType) params.set("entityType", filters.entityType);
      const response = await apiFetch(`/audit?${params.toString()}`);
      if (response.status === 403 || response.status === 404) {
        setLogs([]);
        setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
        setError("");
        return;
      }
      if (!response.ok) {
        console.warn("Audit logs request failed:", response.status);
        setLogs([]);
        setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
        setError("");
        return;
      }
      const payload = await response.json();
      setLogs(payload.logs ?? []);
      setPagination(
        payload.pagination ?? {
          page,
          totalPages: 1,
          total: payload.logs?.length ?? 0,
          limit: PAGE_LIMIT
        }
      );
    } catch (err) {
      console.warn("Audit logs error:", err);
      // Silently fail - don't crash UI
      setLogs([]);
      setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
      setError("");
    } finally {
      setLoading(false);
    }
  }, [filters.entityType, filters.userId, page, hasRole]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    if (!filters.date) return logs;
    return logs.filter((log) => {
      if (!log?.createdAt) return false;
      return log.createdAt.slice(0, 10) === filters.date;
    });
  }, [logs, filters.date]);

  const entityBreakdown = useMemo(() => {
    const counts = new Map();
    filteredLogs.forEach((log) => {
      const entity = log.entityType || "unclassified";
      counts.set(entity, (counts.get(entity) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredLogs]);

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...formState });
  };

  const resetFilters = () => {
    const defaults = { userId: "", entityType: "", date: "" };
    setFormState(defaults);
    setFilters(defaults);
    setPage(1);
  };

  const paginate = (direction) => {
    setPage((prev) => {
      const next = direction === "next" ? prev + 1 : prev - 1;
      if (next < 1) return 1;
      if (next > (pagination.totalPages || 1)) return pagination.totalPages || 1;
      return next;
    });
  };

  return (
    <DashboardShell
      title="Activity"
      subtitle="Track every sensitive action across the console. Filters stay local so you can triage faster."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <form
          className="rounded-3xl border border-brand-black/10 bg-brand-white p-5"
          onSubmit={applyFilters}
        >
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Filters</p>
          <div className="mt-4 space-y-4 text-sm">
            <label className="block space-y-2">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">User</span>
              <input
                type="text"
                value={formState.userId}
                onChange={handleFilterChange("userId")}
                placeholder="user@example.com"
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">Entity type</span>
              <select
                value={formState.entityType}
                onChange={handleFilterChange("entityType")}
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">Date</span>
              <input
                type="date"
                value={formState.date}
                onChange={handleFilterChange("date")}
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              className="flex-1 rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]"
            >
              Reset
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-xs text-brand-black/70">
            <p className="font-subtitle text-[0.55rem] uppercase tracking-[0.35em] text-brand-red">
              Entity mix
            </p>
            <ul className="mt-2 space-y-1">
              {entityBreakdown.length ? (
                entityBreakdown.slice(0, 5).map(([entity, count]) => (
                  <li key={entity} className="flex items-center justify-between">
                    <span className="uppercase tracking-[0.2em]">{entity}</span>
                    <span>{count}</span>
                  </li>
                ))
              ) : (
                <li>No entries.</li>
              )}
            </ul>
          </div>
        </form>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Audit</p>
              <h3 className="font-display text-3xl uppercase">Activity table</h3>
            </div>
            <button
              type="button"
              onClick={() => fetchLogs()}
              className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
              disabled={loading}
            >
              {loading ? "Syncing…" : "Refresh"}
            </button>
          </div>
          {error ? (
            <p className="mt-4 text-sm text-brand-red">{error}</p>
          ) : loading ? (
            <p className="mt-4 text-sm text-brand-black/60">Loading audit entries…</p>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-brand-black/80">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.3em] text-brand-black/50">
                      <th className="py-2 pr-3">Timestamp</th>
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Action</th>
                      <th className="py-2 pr-3">Entity</th>
                      <th className="py-2 pr-3">Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-t border-brand-black/10 text-xs">
                        <td className="py-2 pr-3 text-brand-black/60">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">{log.userId || "—"}</td>
                        <td className="py-2 pr-3 text-brand-black uppercase tracking-[0.2em]">
                          <span>{log.action}</span>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-col gap-1">
                            <Badge tone="neutral">{log.entityType || "unclassified"}</Badge>
                            <span className="text-[0.6rem] text-brand-black/60">{log.entityId || "—"}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-brand-black/60">
                          <pre className="max-h-16 max-w-xs overflow-auto text-[0.6rem]">
                            {JSON.stringify(log.metadata ?? {}, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                    {!filteredLogs.length ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-xs text-brand-black/50">
                          No audit entries match those filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-black/70">
                <p className="uppercase tracking-[0.3em]">
                  Page {pagination.page || page} / {pagination.totalPages || 1} · {pagination.total} records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => paginate("prev")}
                    disabled={page <= 1}
                    className="rounded-full border border-brand-black px-4 py-1 uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => paginate("next")}
                    disabled={page >= (pagination.totalPages || 1)}
                    className="rounded-full border border-brand-black px-4 py-1 uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
