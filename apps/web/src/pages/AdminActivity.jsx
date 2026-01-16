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
  { label: "Social", value: "social" },
  { label: "Audit", value: "audit" }
];

const ACTION_OPTIONS = [
  { label: "All actions", value: "" },
  { label: "Login", value: "LOGIN" },
  { label: "Logout", value: "LOGOUT" },
  { label: "Role change", value: "ROLE_CHANGE" },
  { label: "User approved", value: "USER_APPROVED" },
  { label: "User rejected", value: "USER_REJECTED" },
  { label: "User archived", value: "USER_ARCHIVED" },
  { label: "Brief created", value: "BRIEF_CREATED" },
  { label: "Audit viewed", value: "AUDIT_VIEWED" },
  { label: "Audit exported", value: "AUDIT_EXPORTED" }
];

const ROLE_OPTIONS = [
  { label: "All roles", value: "" },
  { label: "Superadmin", value: "SUPERADMIN" },
  { label: "Admin", value: "ADMIN" },
  { label: "Brand", value: "BRAND" },
  { label: "Creator", value: "CREATOR" }
];

const PAGE_LIMIT = 25;

export function AdminActivityPage() {
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState({
    userId: "",
    entityType: "",
    action: "",
    userRole: "",
    startDate: "",
    endDate: ""
  });
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
  const [lastFetch, setLastFetch] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
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
      if (filters.action) params.set("action", filters.action);
      if (filters.userRole) params.set("userRole", filters.userRole);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await apiFetch(`/audit?${params.toString()}`);

      if (response.status === 403) {
        setLogs([]);
        setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
        setError("Access denied. Admin privileges required.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setLogs([]);
        setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
        setError(errorData.error || "Failed to load audit logs. Please refresh or contact support.");
        return;
      }

      const payload = await response.json();
      
      if (!payload.success) {
        setError(payload.error || "An error occurred loading audit logs.");
        setLogs([]);
        setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
        return;
      }

      setLogs(payload.logs ?? []);
      setPagination(
        payload.pagination ?? {
          page,
          totalPages: 1,
          total: payload.logs?.length ?? 0,
          limit: PAGE_LIMIT
        }
      );
      setLastFetch(new Date());
      setError("");
    } catch (err) {
      console.error("Audit logs error:", err);
      setLogs([]);
      setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, hasRole]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Entity breakdown shows current page counts
  const entityBreakdown = useMemo(() => {
    const counts = new Map();
    logs.forEach((log) => {
      const entity = log.entityType || "unclassified";
      counts.set(entity, (counts.get(entity) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [logs]);

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
    const defaults = {
      userId: "",
      entityType: "",
      action: "",
      userRole: "",
      startDate: "",
      endDate: ""
    };
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

  const exportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      const trimmedUser = filters.userId.trim();
      if (trimmedUser) params.set("userId", trimmedUser);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.action) params.set("action", filters.action);
      if (filters.userRole) params.set("userRole", filters.userRole);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await apiFetch(`/audit/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export audit logs. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Enhanced empty state logic
  const getEmptyStateMessage = () => {
    if (error) {
      return error;
    }
    if (activeFiltersCount > 0) {
      return "No audit entries match your current filters. Try adjusting or resetting them.";
    }
    if (pagination.total === 0) {
      return "No audit entries exist yet. Actions will appear here as users interact with the platform.";
    }
    return "No audit entries found.";
  };

  // Get user display for clickable link
  const getUserDisplay = (log) => {
    if (log.User?.email) {
      return log.User.email;
    }
    if (log.User?.name) {
      return log.User.name;
    }
    return log.userId || "—";
  };

  // Format timestamp as two lines: date and time
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    return { dateStr, timeStr };
  };

  // Convert ALL_CAPS action to Title Case with Spaces
  const formatActionLabel = (action) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Map entity types to readable labels
  const getEntityLabel = (entityType) => {
    const labelMap = {
      auth: "Auth",
      user: "User",
      brief: "Brief",
      approval: "Approval",
      finance: "Finance",
      social: "Social",
      audit: "Audit",
      cron: "Cron Job"
    };
    return labelMap[entityType] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  // Determine severity for action
  const getActionSeverity = (action) => {
    const critical = ["USER_ARCHIVED", "ROLE_CHANGE", "USER_REJECTED", "PASSWORD_RESET"];
    const warning = ["USER_APPROVED", "LOGIN_FAILED", "PERMISSION_DENIED"];
    if (critical.some((a) => action.includes(a))) return "critical";
    if (warning.some((a) => action.includes(a))) return "warning";
    return "info";
  };

  return (
    <DashboardShell
      title="Activity"
      subtitle="Complete audit trail of all platform actions. All filters applied at database level."
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Filter Summary Bar */}
      {activeFiltersCount > 0 && (
        <div className="mt-6 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                {activeFiltersCount} Active Filter{activeFiltersCount > 1 ? "s" : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {filters.userId && (
                  <Badge tone="info">User: {filters.userId}</Badge>
                )}
                {filters.entityType && (
                  <Badge tone="info">Entity: {filters.entityType}</Badge>
                )}
                {filters.action && (
                  <Badge tone="info">Action: {filters.action}</Badge>
                )}
                {filters.userRole && (
                  <Badge tone="info">Role: {filters.userRole}</Badge>
                )}
                {filters.startDate && (
                  <Badge tone="info">From: {filters.startDate}</Badge>
                )}
                {filters.endDate && (
                  <Badge tone="info">To: {filters.endDate}</Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-brand-black/60">
                Showing {logs.length} of {pagination.total} total records
                {lastFetch && (
                  <span className="ml-2">
                    · Last updated {lastFetch.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-brand-red px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-red hover:bg-brand-red hover:text-white"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <form
          className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 h-fit sticky top-6"
          onSubmit={applyFilters}
        >
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Filters</p>
          
          {/* User ID */}
          <div className="mt-4 space-y-3 text-sm">
            <label className="block space-y-1">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">User ID</span>
              <input
                type="text"
                value={formState.userId}
                onChange={handleFilterChange("userId")}
                placeholder="user-id-123"
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            
            {/* Entity Type */}
            <label className="block space-y-1">
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
            
            {/* Action */}
            <label className="block space-y-1">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">Action</span>
              <select
                value={formState.action}
                onChange={handleFilterChange("action")}
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            
            {/* User Role */}
            <label className="block space-y-1">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">User role</span>
              <select
                value={formState.userRole}
                onChange={handleFilterChange("userRole")}
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Date Range Group */}
            <div className="border-t border-brand-black/10 pt-3 mt-3">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60 mb-2">Date Range</p>
              <label className="block space-y-1 mb-2">
                <span className="text-[0.55rem] uppercase tracking-[0.2em] text-brand-black/50">From</span>
                <input
                  type="date"
                  value={formState.startDate}
                  onChange={handleFilterChange("startDate")}
                  className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[0.55rem] uppercase tracking-[0.2em] text-brand-black/50">To</span>
                <input
                  type="date"
                  value={formState.endDate}
                  onChange={handleFilterChange("endDate")}
                  className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col gap-2 sticky bottom-0 bg-brand-white pt-4 border-t border-brand-black/10">
            <button
              type="submit"
              className="w-full rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] hover:bg-brand-black/5"
            >
              Reset
            </button>
          </div>

          {/* Entity Breakdown */}
          <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3 text-xs text-brand-black/70">
            <p className="font-subtitle text-[0.55rem] uppercase tracking-[0.35em] text-brand-red">
              Page Mix
            </p>
            <p className="mt-0.5 text-[0.6rem] text-brand-black/50">
              Current page entity counts
            </p>
            <ul className="mt-2 space-y-1">
              {entityBreakdown.length ? (
                entityBreakdown.slice(0, 5).map(([entity, count]) => (
                  <li key={entity} className="flex items-center justify-between text-[0.6rem]">
                    <span className="uppercase tracking-[0.2em]">{entity}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))
              ) : (
                <li className="text-[0.6rem]">No entries on page.</li>
              )}
            </ul>
          </div>
        </form>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Audit</p>
              <h3 className="font-display text-3xl uppercase">Activity table</h3>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={exportCSV}
                disabled={exportLoading || loading || logs.length === 0}
                className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black/5 whitespace-nowrap"
              >
                {exportLoading ? "Exporting…" : "Export CSV"}
              </button>
              <button
                type="button"
                onClick={() => fetchLogs()}
                className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black/5 whitespace-nowrap"
                disabled={loading}
              >
                {loading ? "Syncing…" : "Refresh"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">Error</p>
              <p className="mt-2 text-sm text-brand-black/80">{error}</p>
            </div>
          ) : loading ? (
            <p className="mt-4 text-sm text-brand-black/60">Loading audit entries…</p>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto border border-brand-black/10 rounded-2xl">
                <table className="w-full text-left text-sm text-brand-black/80 border-collapse" style={{ tableLayout: "fixed", minWidth: "1200px" }}>
                  <thead>
                    <tr className="bg-brand-linen/50 text-xs uppercase tracking-[0.3em] text-brand-black/50 border-b border-brand-black/10">
                      <th className="w-[120px] px-3 py-3 font-semibold truncate">Timestamp</th>
                      <th className="w-[140px] px-3 py-3 font-semibold truncate">User</th>
                      <th className="w-[90px] px-3 py-3 font-semibold truncate">Role</th>
                      <th className="w-[250px] px-3 py-3 font-semibold truncate">Action</th>
                      <th className="w-[110px] px-3 py-3 font-semibold truncate">Entity</th>
                      <th className="w-[140px] px-3 py-3 font-semibold truncate">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => {
                      const severity = getActionSeverity(log.action);
                      const { dateStr, timeStr } = formatTimestamp(log.createdAt);
                      const actionLabel = formatActionLabel(log.action);
                      const entityLabel = getEntityLabel(log.entityType);
                      return (
                        <tr
                          key={log.id}
                          className={`text-xs border-b border-brand-black/10 hover:bg-brand-linen/40 transition-colors ${
                            idx % 2 === 1 ? "bg-brand-linen/20" : ""
                          }`}
                        >
                          <td className="w-[120px] px-3 py-3 overflow-hidden">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-brand-black truncate">{dateStr}</span>
                              <span className="text-[0.65rem] text-brand-black/50 truncate">{timeStr}</span>
                            </div>
                          </td>
                          <td className="w-[140px] px-3 py-3 overflow-hidden">
                            {log.userId ? (
                              <a
                                href={`/admin/users?search=${log.userId}`}
                                className="text-brand-red font-medium hover:text-brand-red/80 hover:underline transition-colors truncate block"
                                title={`View user: ${getUserDisplay(log)}`}
                              >
                                {getUserDisplay(log)}
                              </a>
                            ) : (
                              <span className="text-brand-black/40">—</span>
                            )}
                          </td>
                          <td className="w-[90px] px-3 py-3 overflow-hidden">
                            <span className="inline-block text-[0.65rem] font-medium px-2 py-1 rounded-lg bg-brand-black/5 text-brand-black/70 uppercase tracking-[0.15em] truncate max-w-full">
                              {log.userRole || "—"}
                            </span>
                          </td>
                          <td className="w-[250px] px-3 py-3 overflow-hidden">
                            <div className="flex items-start gap-2 min-h-6">
                              {severity === "critical" && (
                                <span
                                  className="h-2 w-2 rounded-full bg-brand-red flex-shrink-0 mt-1.5"
                                  title="Critical action"
                                />
                              )}
                              {severity === "warning" && (
                                <span
                                  className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0 mt-1.5"
                                  title="Warning action"
                                />
                              )}
                              <span className="font-semibold text-brand-black text-ellipsis overflow-hidden line-clamp-2" title={actionLabel}>{actionLabel}</span>
                            </div>
                          </td>
                          <td className="w-[110px] px-3 py-3 overflow-hidden">
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-block text-[0.65rem] font-medium px-2 py-1 rounded-lg bg-brand-black/5 text-brand-black/70 uppercase tracking-[0.15em] w-fit truncate max-w-[90px]">
                                {entityLabel}
                              </span>
                              {log.entityId && (
                                <span
                                  className="text-[0.6rem] text-brand-black/50 truncate cursor-help hover:text-brand-black/70"
                                  title={log.entityId}
                                >
                                  ID: {log.entityId.substring(0, 8)}…
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="w-[140px] px-3 py-3 text-[0.65rem] text-brand-black/60 font-mono overflow-hidden">
                            <span title={log.ipAddress || ""} className="truncate block">
                              {log.ipAddress || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!logs.length ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-xs text-brand-black/60">
                          {getEmptyStateMessage()}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-black/70">
                <p className="uppercase tracking-[0.3em]">
                  Page {pagination.page || page} / {pagination.totalPages || 1} · {pagination.total} total records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => paginate("prev")}
                    disabled={page <= 1}
                    className="rounded-full border border-brand-black px-4 py-1 uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black/5"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => paginate("next")}
                    disabled={page >= (pagination.totalPages || 1)}
                    className="rounded-full border border-brand-black px-4 py-1 uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black/5"
                  >
                    Next
                  </button>
                </div>
              </div>
              
              {/* Retention Policy Footer */}
              <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-xs text-brand-black/60">
                <p className="font-semibold uppercase tracking-[0.3em]">Retention Policy</p>
                <p className="mt-2">
                  Audit logs are retained for the platform lifetime during beta. Retention policy may be updated before public launch. Export regularly for your records.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
