import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { EmptyStateWithHint } from "../components/CrmMetaRuleHelper.jsx";
import { BrandChip } from "../components/BrandChip.jsx";
import { Badge } from "../components/Badge.jsx";
import { MentionInput } from "../components/MentionInput.jsx";
import { MultiSelect } from "../components/MultiSelect.jsx";
import { TASK_PRIORITIES, TASK_STATUSES } from "../lib/crmTasks.js";
import { 
  fetchCrmTasks, 
  fetchCrmTaskById,
  createCrmTask, 
  updateCrmTask, 
  deleteCrmTask,
  fetchTaskUsers,
  fetchTaskTalents 
} from "../services/crmTasksClient.js";
import { readCrmDeals } from "../lib/crmDeals.js";
import { readCrmCampaigns } from "../lib/crmCampaigns.js";
import { readCrmEvents } from "../lib/crmEvents.js";
import { readCrmContracts } from "../lib/crmContracts.js";
import { useAuth } from "../context/AuthContext.jsx";

const BRANDS_STORAGE_KEY = "break_admin_brands_v1";

function safeRead(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function formatInputDate(date = new Date()) {
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function TextButton({ children, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand-red"
    >
      {children}
    </button>
  );
}

function ModalFrame({ open, title, subtitle, onClose, footer, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener("keydown", handleTab);
    firstElement?.focus();
    return () => modalElement.removeEventListener("keydown", handleTab);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-[920px] max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-black/10 bg-white shadow-[0_35px_120px_rgba(0,0,0,0.25)]"
      >
        <div className="sticky top-0 z-10 bg-white border-b border-brand-black/5 px-6 pt-6 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{subtitle}</p>
              <h3 id="modal-title" className="font-display text-2xl uppercase text-brand-black">{title}</h3>
            </div>
            <TextButton onClick={onClose}>Close</TextButton>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {children}
        </div>
        
        {footer && (
          <div className="sticky bottom-0 z-10 bg-white border-t border-brand-black/5 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
      />
    </label>
  );
}

export function AdminTasksPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [brandFilter, setBrandFilter] = useState("All brands");

  // Data sources
  const [users, setUsers] = useState([]);
  const [talents, setTalents] = useState([]);
  const brands = useMemo(() => safeRead(BRANDS_STORAGE_KEY, []), []);
  const deals = useMemo(() => readCrmDeals(), []);
  const campaigns = useMemo(() => readCrmCampaigns(), []);
  const events = useMemo(() => readCrmEvents(), []);
  const contracts = useMemo(() => readCrmContracts(), []);

  const brandById = useMemo(() => new Map((brands || []).map((b) => [b.id, b])), [brands]);
  const brandOptions = useMemo(() => ["All brands", ...(brands || []).map((b) => b.brandName || b.name)], [brands]);

  // Load users and talents for mentions and assignments
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchTaskUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };

    const loadTalents = async () => {
      try {
        const data = await fetchTaskTalents();
        setTalents(data);
      } catch (err) {
        console.error("Failed to load talents:", err);
      }
    };

    loadUsers();
    loadTalents();
  }, []);

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchCrmTasks();
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    status: TASK_STATUSES[0],
    priority: "Medium",
    dueDate: formatInputDate(),
    ownerId: "",
    assignedUserIds: [],
    mentions: [],
    relatedBrands: [],
    relatedCreators: [],
    relatedDeals: [],
    relatedCampaigns: [],
    relatedEvents: [],
    relatedContracts: []
  });

  const visibleTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      const matchesSearch =
        !search ||
        (task.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus =
        statusFilter === "All statuses" || task.status.toLowerCase() === statusFilter.toLowerCase();
      
      const taskBrandNames = (task.relatedBrands || [])
        .map(brandId => brandById.get(brandId))
        .filter(Boolean)
        .map(b => b.brandName || b.name);
      
      const matchesBrand = 
        brandFilter === "All brands" || 
        taskBrandNames.includes(brandFilter);

      return matchesSearch && matchesStatus && matchesBrand;
    });
  }, [tasks, search, statusFilter, brandFilter, brandById]);

  // Calculate active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter !== "All statuses") count++;
    if (brandFilter !== "All brands") count++;
    return count;
  }, [search, statusFilter, brandFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All statuses");
    setBrandFilter("All brands");
  };

  const openCreate = () => {
    setEditingId("");
    setFormError("");
    setDraft({
      title: "",
      description: "",
      status: TASK_STATUSES[0],
      priority: "Medium",
      dueDate: formatInputDate(),
      ownerId: currentUser?.id || "",
      assignedUserIds: [],
      mentions: [],
      relatedBrands: [],
      relatedCreators: [],
      relatedDeals: [],
      relatedCampaigns: [],
      relatedEvents: [],
      relatedContracts: []
    });
    setCreateOpen(true);
  };

  const openEdit = async (taskIdOrObject) => {
    try {
      // Support both task ID string and task object
      const taskId = typeof taskIdOrObject === 'string' ? taskIdOrObject : taskIdOrObject.id;
      
      setEditingId(taskId);
      setFormError("");
      setFormLoading(true);
      setCreateOpen(true);
      
      // Fetch fresh task data from API (not stale local state)
      console.log("[AdminTasksPage] Fetching fresh task data for:", taskId);
      const task = await fetchCrmTaskById(taskId);
      console.log("[AdminTasksPage] Loaded task:", task);
      
      setDraft({
        title: task.title || "",
        description: task.description || "",
        status: task.status || TASK_STATUSES[0],
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : formatInputDate(),
        completedAt: task.completedAt || null,
        ownerId: task.ownerId || "",
        assignedUserIds: task.assignedUserIds || [],
        mentions: task.mentions || [],
        relatedBrands: task.relatedBrands || [],
        relatedCreators: task.relatedCreators || [],
        relatedDeals: task.relatedDeals || [],
        relatedCampaigns: task.relatedCampaigns || [],
        relatedEvents: task.relatedEvents || [],
        relatedContracts: task.relatedContracts || []
      });
      setFormLoading(false);
    } catch (err) {
      console.error("[AdminTasksPage] Error loading task:", err);
      setFormError(err.message || "Failed to load task");
      setFormLoading(false);
    }
  };

  const saveTask = async () => {
    // Prevent double submissions
    if (formSaving) {
      console.log("[AdminTasksPage] Already saving, ignoring duplicate call");
      return;
    }

    try {
      console.log("[AdminTasksPage] saveTask called", { editingId, draft });
      setFormSaving(true);
      setFormError("");
      
      if (!draft.title || !draft.title.trim()) {
        console.log("[AdminTasksPage] Validation failed: missing title");
        setFormError("Task title is required.");
        setFormSaving(false);
        return;
      }

      if (!draft.ownerId) {
        console.log("[AdminTasksPage] Validation failed: missing ownerId");
        setFormError("Primary owner is required.");
        setFormSaving(false);
        return;
      }

      // Auto-set completedAt when status changes to "Completed"
      let completedAt = draft.completedAt;
      if (draft.status === "Completed" && !completedAt) {
        completedAt = new Date().toISOString();
        console.log("[AdminTasksPage] Auto-setting completedAt:", completedAt);
      } else if (draft.status !== "Completed") {
        // Clear completedAt if status is changed away from Completed
        completedAt = null;
      }

      const taskData = {
        title: draft.title.trim(),
        description: draft.description || null,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        completedAt: completedAt,
        ownerId: draft.ownerId,
        assignedUserIds: draft.assignedUserIds,
        mentions: draft.mentions,
        relatedBrands: draft.relatedBrands,
        relatedCreators: draft.relatedCreators,
        relatedDeals: draft.relatedDeals,
        relatedCampaigns: draft.relatedCampaigns,
        relatedEvents: draft.relatedEvents,
        relatedContracts: draft.relatedContracts
      };

      console.log("[AdminTasksPage] Sending task data:", taskData);

      if (editingId) {
        console.log("[AdminTasksPage] Updating task:", editingId);
        await updateCrmTask(editingId, taskData);
      } else {
        console.log("[AdminTasksPage] Creating new task");
        const result = await createCrmTask(taskData);
        console.log("[AdminTasksPage] Task created:", result);
      }

      // Refetch tasks
      console.log("[AdminTasksPage] Refetching tasks");
      const data = await fetchCrmTasks();
      setTasks(data);
      setCreateOpen(false);
      setEditingId("");
      setFormSaving(false);
      
      // Show success message
      const message = editingId ? "Task updated successfully" : "Task created successfully";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 4000);
      
      console.log("[AdminTasksPage] saveTask completed successfully");
    } catch (err) {
      console.error("[AdminTasksPage] Error saving task:", err);
      setFormError(err.message || "Failed to save task");
      setFormSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    
    try {
      setError("");
      await deleteCrmTask(id);
      const data = await fetchCrmTasks();
      setTasks(data);
      setSuccessMessage("Task deleted successfully");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(err.message || "Failed to delete task");
    }
  };

  const handleDeleteFromModal = async () => {
    if (!editingId) return;
    
    setDeleteConfirmOpen(false);
    setDeleting(true);
    
    try {
      setFormError("");
      await deleteCrmTask(editingId);
      
      // Refetch tasks and close modal
      const data = await fetchCrmTasks();
      setTasks(data);
      setCreateOpen(false);
      setEditingId("");
      setDeleting(false);
      
      setSuccessMessage("Task deleted successfully");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("[AdminTasksPage] Error deleting task:", err);
      setFormError(err.message || "Failed to delete task");
      setDeleting(false);
    }
  };

  // Permission check
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const isAdmin = currentUser?.role === "ADMIN" || isSuperAdmin;

  return (
    <DashboardShell
      title="Tasks"
      subtitle="Central operational hub for tracking work across Break platform."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">CRM</p>
            <h2 className="font-display text-2xl uppercase text-brand-black">Tasks</h2>
          </div>
          <PrimaryButton onClick={openCreate}>Add task</PrimaryButton>
        </div>

        {/* Filter Summary Bar */}
        {activeFiltersCount > 0 && !loading && (
          <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                  {activeFiltersCount} Active Filter{activeFiltersCount > 1 ? "s" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {search && <Badge tone="info">Search: {search}</Badge>}
                  {statusFilter !== "All statuses" && <Badge tone="info">Status: {statusFilter}</Badge>}
                  {brandFilter !== "All brands" && <Badge tone="info">Brand: {brandFilter}</Badge>}
                </div>
                <p className="mt-2 text-xs text-brand-black/60">
                  Showing {visibleTasks.length} of {tasks.length} total tasks
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

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-700">Success</p>
            <p className="mt-2 text-sm text-brand-black/80">{successMessage}</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">Error</p>
            <p className="mt-2 text-sm text-brand-black/80">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-black/60">
            Loading tasks...
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {["All statuses", ...TASK_STATUSES].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {brandOptions.map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="mt-4 w-full text-left text-sm text-brand-black/80">
                <thead>
                  <tr className="border-b border-brand-black/10 text-xs uppercase tracking-[0.3em] text-brand-red">
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.length === 0 && !loading && !error ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-brand-black/60">
                        {tasks.length === 0 ? (
                          <div>
                            <p className="font-semibold text-brand-black">No tasks yet</p>
                            <p className="mt-1">Tasks will appear here once created. Click "Add Task" to get started.</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-brand-black">No tasks match your filters</p>
                            <p className="mt-1">Try adjusting your search or filter criteria, or reset filters to see all tasks.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                  {visibleTasks.map((task) => {
                    const owner = users.find(u => u.id === task.ownerId);
                    const assigned = (task.assignedUserIds || [])
                      .map(id => users.find(u => u.id === id))
                      .filter(Boolean);

                    return (
                      <tr 
                        key={task.id} 
                        className="border-b border-brand-black/5 cursor-pointer hover:bg-brand-linen/30 transition-colors"
                        onClick={() => openEdit(task.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-brand-black">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-brand-black/60 line-clamp-1 mt-0.5">
                              {task.description.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
                            </p>
                          )}
                          {(task.relatedBrands?.length || task.relatedCreators?.length || task.relatedDeals?.length) ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(task.relatedBrands || []).slice(0, 2).map(brandId => {
                                const brand = brandById.get(brandId);
                                return brand ? (
                                  <span key={brandId} className="text-[0.6rem] uppercase px-2 py-0.5 rounded-full bg-brand-linen text-brand-black/70">
                                    {brand.brandName || brand.name}
                                  </span>
                                ) : null;
                              })}
                              {(task.relatedCreators?.length || 0) > 0 && (
                                <span className="text-[0.6rem] uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                  {task.relatedCreators.length} creator{task.relatedCreators.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {owner?.avatarUrl && (
                              <img src={owner.avatarUrl} alt={owner.name} className="w-6 h-6 rounded-full" />
                            )}
                            <span className="text-sm">{owner?.name || owner?.email || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {assigned.length === 0 ? (
                            <span className="text-brand-black/40">—</span>
                          ) : (
                            <div className="flex -space-x-2">
                              {assigned.slice(0, 3).map(user => (
                                <img 
                                  key={user.id}
                                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`}
                                  alt={user.name || user.email}
                                  title={user.name || user.email}
                                  className="w-6 h-6 rounded-full border-2 border-white"
                                />
                              ))}
                              {assigned.length > 3 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-brand-black/5 flex items-center justify-center text-[0.6rem] font-semibold">
                                  +{assigned.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={task.status === "Completed" ? "positive" : "neutral"}>
                            {task.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={task.priority === "High" ? "negative" : task.priority === "Medium" ? "neutral" : "positive"}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB", { 
                            day: "numeric", 
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(task.id);
                              }}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                className="rounded-full border border-brand-red px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-red hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {visibleTasks.length === 0 && tasks.length === 0 ? (
                <div className="px-4 py-6">
                  <EmptyStateWithHint
                    entity="tasks"
                    onCreate={openCreate}
                  />
                </div>
              ) : visibleTasks.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-brand-black/60">No tasks match your filters.</p>
              ) : null}
            </div>
          </>
        )}
      </section>

      {/* Task Modal */}
      <ModalFrame
        open={createOpen}
        title={editingId ? "Edit task" : "Add task"}
        subtitle="Tasks"
        onClose={() => {
          if (!formSaving && !deleting) {
            setCreateOpen(false);
            setEditingId("");
            setFormError("");
            setDeleteConfirmOpen(false);
          }
        }}
        footer={
          <div className="space-y-3">
            {formError && (
              <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">Error</p>
                <p className="mt-1 text-sm text-brand-black/80">{formError}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div>
                {editingId && isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={formSaving || deleting}
                    className="rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-red hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Task"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TextButton
                  onClick={() => {
                    setCreateOpen(false);
                    setEditingId("");
                    setFormError("");
                    setDeleteConfirmOpen(false);
                  }}
                  disabled={formSaving || deleting}
                >
                  Cancel
                </TextButton>
                <PrimaryButton onClick={saveTask} disabled={formSaving || deleting || formLoading}>
                  {formSaving ? "Saving..." : editingId ? "Save changes" : "Create task"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        }
      >
        {formLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-brand-black/60">Loading task data...</p>
          </div>
        ) : (
          <>
        {/* Section 1: Core Task */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-black/10">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold">Core Task</span>
          </div>
          
          <Field 
            label="Title" 
            value={draft.title} 
            onChange={(v) => setDraft((p) => ({ ...p, title: v }))} 
            placeholder="e.g. Send contract v2 for review" 
          />

          <div>
            <span className="block text-xs uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Description (with @mentions)
            </span>
            <MentionInput
              value={draft.description}
              onChange={(v) => setDraft((p) => ({ ...p, description: v }))}
              users={users}
              onMentionsChange={(mentions) => setDraft((p) => ({ ...p, mentions }))}
              placeholder="Describe the task... Type @ to mention users"
              rows={4}
            />
          </div>
        </div>

        {/* Section 2: Ownership */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-black/10">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold">Ownership</span>
          </div>

          <Select
            label="Primary Owner (required)"
            value={draft.ownerId}
            onChange={(v) => setDraft((p) => ({ ...p, ownerId: v }))}
            options={[
              { value: "", label: "Select owner..." },
              ...users.map(u => ({ value: u.id, label: `${u.name || u.email} (${u.role})` }))
            ]}
          />

          <MultiSelect
            label="Assigned Users (multi-select)"
            value={draft.assignedUserIds}
            onChange={(v) => setDraft((p) => ({ ...p, assignedUserIds: v }))}
            options={users.map(u => ({ id: u.id, name: `${u.name || u.email}` }))}
            placeholder="Select users to assign..."
          />
        </div>

        {/* Section 3: Status & Priority */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-black/10">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold">Status & Priority</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select 
              label="Status" 
              value={draft.status} 
              onChange={(v) => setDraft((p) => ({ ...p, status: v }))} 
              options={TASK_STATUSES} 
            />
            <Select 
              label="Priority" 
              value={draft.priority} 
              onChange={(v) => setDraft((p) => ({ ...p, priority: v }))} 
              options={TASK_PRIORITIES} 
            />
          </div>

          <Field 
            label="Due date" 
            type="datetime-local" 
            value={draft.dueDate} 
            onChange={(v) => setDraft((p) => ({ ...p, dueDate: v }))} 
          />
        </div>

        {/* Section 4: Relations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-black/10">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold">Relations</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <MultiSelect
              label="Brands (multi)"
              value={draft.relatedBrands}
              onChange={(v) => setDraft((p) => ({ ...p, relatedBrands: v }))}
              options={brands.map(b => ({ id: b.id, name: b.brandName || b.name }))}
              placeholder="Link brands..."
            />

            <MultiSelect
              label="Creators / Talent (multi)"
              value={draft.relatedCreators}
              onChange={(v) => setDraft((p) => ({ ...p, relatedCreators: v }))}
              options={talents.map(t => ({ id: t.id, name: t.name }))}
              placeholder="Link creators..."
            />

            <MultiSelect
              label="Deals (multi)"
              value={draft.relatedDeals}
              onChange={(v) => setDraft((p) => ({ ...p, relatedDeals: v }))}
              options={deals.map(d => ({ id: d.id, name: d.dealName || `Deal ${d.id.slice(0, 8)}` }))}
              placeholder="Link deals..."
            />

            <MultiSelect
              label="Campaigns (multi)"
              value={draft.relatedCampaigns}
              onChange={(v) => setDraft((p) => ({ ...p, relatedCampaigns: v }))}
              options={campaigns.map(c => ({ id: c.id, name: c.campaignName }))}
              placeholder="Link campaigns..."
            />

            <MultiSelect
              label="Events (multi)"
              value={draft.relatedEvents}
              onChange={(v) => setDraft((p) => ({ ...p, relatedEvents: v }))}
              options={events.map(e => ({ id: e.id, name: e.eventName }))}
              placeholder="Link events..."
            />

            <MultiSelect
              label="Contracts (multi)"
              value={draft.relatedContracts}
              onChange={(v) => setDraft((p) => ({ ...p, relatedContracts: v }))}
              options={contracts.map(c => ({ id: c.id, name: c.contractName }))}
              placeholder="Link contracts..."
            />
          </div>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs text-brand-black/70">
              💡 <strong>Tip:</strong> Link tasks to brands, creators, deals, campaigns, events, or contracts to keep work contextual and trackable.
            </p>
          </div>
        </div>

        {/* Completed Date Display (Read-only) */}
        {draft.completedAt && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-700">Task Completed</p>
            <p className="mt-1 text-sm text-green-800">
              Completed on {new Date(draft.completedAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        )}
        </>
        )}
      </ModalFrame>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-brand-red/20 bg-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Confirm Deletion</p>
              <h3 className="font-display text-2xl uppercase text-brand-black">Delete this task?</h3>
            </div>
            <p className="text-sm text-brand-black/70 mb-6">
              This action cannot be undone. The task and all its data will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <TextButton
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </TextButton>
              <button
                type="button"
                onClick={handleDeleteFromModal}
                disabled={deleting}
                className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default AdminTasksPage;
