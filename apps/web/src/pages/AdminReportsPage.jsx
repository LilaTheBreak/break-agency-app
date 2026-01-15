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

export function AdminReportsPage() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("activity");
  
  // Activity state
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
  const [exportLoading, setExportLoading] = useState(false);

  // Reporting state
  const [reportMetrics, setReportMetrics] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    groupBy: "month"
  });
  const [reportsTab, setReportsTab] = useState("overview");

  // Fetch activity logs
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
        setError(errorData.error || "Failed to load audit logs");
        return;
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message || "Failed to load audit logs");
      setLogs([]);
      setPagination({ page: 1, totalPages: 1, total: 0, limit: PAGE_LIMIT });
    } finally {
      setLoading(false);
    }
  }, [page, filters, hasRole]);

  // Fetch reporting metrics
  const fetchReportMetrics = useCallback(async () => {
    if (!hasRole("ADMIN", "SUPERADMIN")) {
      setReportMetrics(null);
      setReportLoading(false);
      return;
    }

    setReportLoading(true);
    setReportError("");
    try {
      const params = new URLSearchParams();
      if (reportFilters.startDate) params.append("startDate", reportFilters.startDate);
      if (reportFilters.endDate) params.append("endDate", reportFilters.endDate);

      const response = await apiFetch(`/analytics/summary?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setReportError(errorData.error || "Failed to load reports");
        return;
      }

      const data = await response.json();
      setReportMetrics(data);
    } catch (err) {
      console.error("Error fetching report metrics:", err);
      setReportError(err.message || "Failed to load reports");
    } finally {
      setReportLoading(false);
    }
  }, [reportFilters, hasRole]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReportMetrics();
    }
  }, [activeTab, reportFilters, fetchReportMetrics]);

  const handleApplyFilters = () => {
    setFilters(formState);
    setPage(1);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      userId: "",
      entityType: "",
      action: "",
      userRole: "",
      startDate: "",
      endDate: ""
    };
    setFormState(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v).length;
  }, [filters]);

  const exportCSV = async () => {
    if (exportLoading || logs.length === 0) return;

    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "10000",
        page: "1"
      });
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.action) params.set("action", filters.action);
      if (filters.userRole) params.set("userRole", filters.userRole);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await apiFetch(`/audit?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();
      const csv = [
        "Timestamp,User ID,User,Role,Action,Entity Type,IP Address",
        ...data.logs.map(log => 
          `"${log.createdAt}","${log.userId || ''}","${log.userName || ''}","${log.userRole || ''}","${log.action}","${log.entityType}","${log.ipAddress || ''}"`
        )
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      await apiFetch("/audit/export", {
        method: "POST",
        body: JSON.stringify({ filters, logCount: data.logs.length })
      });
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const getActionSeverity = (action) => {
    const critical = ["USER_APPROVED", "ROLE_CHANGE", "USER_ARCHIVED"];
    const warning = ["USER_APPROVED", "LOGIN_FAILED", "PERMISSION_DENIED"];
    if (critical.some(a => action.includes(a))) return "critical";
    if (warning.some(a => action.includes(a))) return "warning";
    return "info";
  };

  const getUserDisplay = (log) => {
    return log.userName && log.userId 
      ? `${log.userName} (${log.userId.slice(0, 8)})`
      : log.userId?.slice(0, 12) || "Unknown";
  };

  const getEmptyStateMessage = () => {
    if (filters.userId || filters.action) return "No records match your search.";
    if (filters.startDate || filters.endDate) return "No activity in this date range.";
    return "No audit log entries found.";
  };

  const paginate = (direction) => {
    if (direction === "prev" && page > 1) setPage(page - 1);
    if (direction === "next" && page < pagination.totalPages) setPage(page + 1);
  };

  return (
    <DashboardShell
      title="Reports & Activity"
      subtitle="Analytics, activity logs, and comprehensive reporting dashboard"
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Tab Navigation */}
      <div className="mt-6 flex gap-4 border-b border-brand-black/10">
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
            activeTab === "activity"
              ? "border-b-2 border-brand-red text-brand-red"
              : "text-brand-black/60 hover:text-brand-black"
          }`}
        >
          Activity Audit
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
            activeTab === "reports"
              ? "border-b-2 border-brand-red text-brand-red"
              : "text-brand-black/60 hover:text-brand-black"
          }`}
        >
          Reports & Analytics
        </button>
      </div>

      {/* ACTIVITY TAB */}
      {activeTab === "activity" && (
        <div className="mt-6 space-y-4">
          {/* Filter Summary */}
          {activeFiltersCount > 0 && (
            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                  {activeFiltersCount} Active Filter{activeFiltersCount > 1 ? "s" : ""}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red hover:text-brand-red/80"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  User ID or Name
                </label>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={formState.userId}
                  onChange={(e) => setFormState({ ...formState, userId: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Entity Type
                </label>
                <select
                  value={formState.entityType}
                  onChange={(e) => setFormState({ ...formState, entityType: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                >
                  {ENTITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Action
                </label>
                <select
                  value={formState.action}
                  onChange={(e) => setFormState({ ...formState, action: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  User Role
                </label>
                <select
                  value={formState.userRole}
                  onChange={(e) => setFormState({ ...formState, userRole: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={formState.startDate}
                  onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={formState.endDate}
                  onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleApplyFilters}
                className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="rounded-full border border-brand-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 hover:bg-brand-black/5 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Export & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Audit</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportCSV}
                disabled={exportLoading || loading || logs.length === 0}
                className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black hover:text-brand-white transition"
              >
                {exportLoading ? "Exporting…" : "Export CSV"}
              </button>
              <button
                type="button"
                onClick={() => fetchLogs()}
                className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] disabled:cursor-not-allowed hover:bg-brand-black hover:text-brand-white transition"
                disabled={loading}
              >
                {loading ? "Syncing…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">Error</p>
              <p className="mt-2 text-sm text-brand-black/80">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <p className="mt-4 text-sm text-brand-black/60">Loading audit entries…</p>
          )}

          {/* Activity Table */}
          {!loading && !error && (
            <>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-brand-black/10">
                <table className="min-w-full text-left text-sm text-brand-black/80">
                  <thead>
                    <tr className="border-b border-brand-black/10 bg-brand-linen/30 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const severity = getActionSeverity(log.action);
                      return (
                        <tr key={log.id} className="border-t border-brand-black/10 hover:bg-brand-linen/20 transition">
                          <td className="py-3 px-4 text-xs text-brand-black/60">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {log.userId ? (
                              <a
                                href={`/admin/users?search=${log.userId}`}
                                className="text-brand-red font-semibold hover:underline"
                                title="View user"
                              >
                                {getUserDisplay(log)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge tone={log.userRole === "SUPERADMIN" ? "critical" : "info"}>
                              {log.userRole || "—"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge tone={severity}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-brand-black/60">
                            {log.entityType || "—"}
                          </td>
                          <td className="py-3 px-4 text-xs text-brand-black/60">
                            {log.ipAddress || "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {!logs.length && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-brand-black/60">
                          {getEmptyStateMessage()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-black/70">
                <p className="uppercase tracking-[0.3em]">
                  Page {pagination.page || page} / {pagination.totalPages || 1} · {pagination.total} total records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => paginate("prev")}
                    disabled={page <= 1}
                    className="rounded-full border border-brand-black/30 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black/5 transition"
                  >
                    ← Previous
                  </button>
                  <span className="flex items-center px-3 py-1">
                    {page} / {pagination.totalPages || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => paginate("next")}
                    disabled={page >= pagination.totalPages}
                    className="rounded-full border border-brand-black/30 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-black/5 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Retention Notice */}
              <p className="mt-4 text-xs text-brand-black/60">
                📌 Activity logs are retained for 90 days. Admin actions are logged for compliance purposes.
              </p>
            </>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="mt-6 space-y-4">
          {/* Sub-tabs for Reports */}
          <div className="flex gap-4 border-b border-brand-black/10">
            <button
              onClick={() => setReportsTab("overview")}
              className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                reportsTab === "overview"
                  ? "border-b-2 border-brand-red text-brand-red"
                  : "text-brand-black/60 hover:text-brand-black"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setReportsTab("users")}
              className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                reportsTab === "users"
                  ? "border-b-2 border-brand-red text-brand-red"
                  : "text-brand-black/60 hover:text-brand-black"
              }`}
            >
              Users & Signups
            </button>
            <button
              onClick={() => setReportsTab("activity")}
              className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                reportsTab === "activity"
                  ? "border-b-2 border-brand-red text-brand-red"
                  : "text-brand-black/60 hover:text-brand-black"
              }`}
            >
              Platform Activity
            </button>
          </div>

          {/* Report Filters */}
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={reportFilters.startDate}
                  onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={reportFilters.endDate}
                  onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Group By
                </label>
                <select
                  value={reportFilters.groupBy}
                  onChange={(e) => setReportFilters({ ...reportFilters, groupBy: e.target.value })}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
              <button
                onClick={() => setReportFilters({ startDate: "", endDate: "", groupBy: "month" })}
                className="rounded-full border border-brand-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 hover:bg-brand-black/5 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Report Error State */}
          {reportError && (
            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">Error</p>
              <p className="mt-2 text-sm text-brand-black/80">{reportError}</p>
            </div>
          )}

          {/* Report Loading State */}
          {reportLoading && (
            <p className="mt-4 text-sm text-brand-black/60">Loading reports…</p>
          )}

          {/* Report Content */}
          {!reportLoading && !reportError && reportMetrics && (
            <>
              {reportsTab === "overview" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                      Total Users
                    </p>
                    <p className="mt-2 text-3xl font-display text-brand-red">
                      {reportMetrics.totalUsers || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                      Active This Month
                    </p>
                    <p className="mt-2 text-3xl font-display text-brand-red">
                      {reportMetrics.activeThisMonth || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                      Platform Actions
                    </p>
                    <p className="mt-2 text-3xl font-display text-brand-red">
                      {reportMetrics.totalActions || 0}
                    </p>
                  </div>
                </div>
              )}

              {reportsTab === "users" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
                    <h3 className="font-semibold text-brand-black">User Signups Trend</h3>
                    <p className="mt-2 text-sm text-brand-black/60">
                      New user registrations over the selected period ({reportFilters.groupBy})
                    </p>
                    <div className="mt-4 h-40 bg-brand-linen/40 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-brand-black/40">Chart data would display here</p>
                    </div>
                  </div>
                </div>
              )}

              {reportsTab === "activity" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
                    <h3 className="font-semibold text-brand-black">Platform Activity Breakdown</h3>
                    <p className="mt-2 text-sm text-brand-black/60">
                      Distribution of actions by entity type
                    </p>
                    <div className="mt-4 h-40 bg-brand-linen/40 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-brand-black/40">Chart data would display here</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!reportLoading && !reportError && !reportMetrics && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-8 text-center">
              <p className="text-sm text-brand-black/60">No report data available for the selected period.</p>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

