import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { EmptyStateWithHint } from "../components/CrmMetaRuleHelper.jsx";
import { BrandChip } from "../components/BrandChip.jsx";
import { DealChip } from "../components/DealChip.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { EventChip } from "../components/EventChip.jsx";
import { ContractChip } from "../components/ContractChip.jsx";
import { Badge } from "../components/Badge.jsx";
import { TASK_PRIORITIES, TASK_STATUSES } from "../lib/crmTasks.js";
import { fetchCrmTasks, createCrmTask, updateCrmTask, deleteCrmTask } from "../services/crmTasksClient.js";
import { readCrmDeals } from "../lib/crmDeals.js";
import { readCrmCampaigns } from "../lib/crmCampaigns.js";
import { readCrmEvents } from "../lib/crmEvents.js";
import { readCrmContracts } from "../lib/crmContracts.js";
import { listGmailMessages } from "../services/gmailClient.js";

const BRANDS_STORAGE_KEY = "break_admin_brands_v1";

const STATUS_OPTIONS = ["All statuses", ...TASK_STATUSES];

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
      className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand-black"
    >
      {children}
    </button>
  );
}

function ModalFrame({ open, title, subtitle, onClose, footer, children }) {
  const modalRef = useRef(null);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Trap focus inside modal
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

    return () => {
      modalElement.removeEventListener("keydown", handleTab);
    };
  }, [open]);

  // Prevent body scroll when modal is open
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-[820px] max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-black/10 bg-brand-white shadow-[0_35px_120px_rgba(0,0,0,0.25)]"
      >
        <div className="sticky top-0 z-10 bg-brand-white border-b border-brand-black/5 px-6 pt-6 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{subtitle}</p>
              <h3 id="modal-title" className="font-display text-2xl uppercase text-brand-black">{title}</h3>
            </div>
            <TextButton onClick={onClose}>Close</TextButton>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          {children}
        </div>
        
        {footer && (
          <div className="sticky bottom-0 z-10 bg-brand-white border-t border-brand-black/5 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render modal via portal to document.body
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formError, setFormError] = useState("");
  const [suggested, setSuggested] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [suggestedError, setSuggestedError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [brandFilter, setBrandFilter] = useState("All brands");
  const [ownerFilter, setOwnerFilter] = useState("All owners");

  const brands = useMemo(() => safeRead(BRANDS_STORAGE_KEY, []), []);
  const deals = useMemo(() => readCrmDeals(), []);
  const campaigns = useMemo(() => readCrmCampaigns(), []);
  const events = useMemo(() => readCrmEvents(), []);
  const contracts = useMemo(() => readCrmContracts(), []);

  const brandById = useMemo(() => new Map((brands || []).map((b) => [b.id, b])), [brands]);
  const dealById = useMemo(() => new Map((deals || []).map((d) => [d.id, d])), [deals]);
  const campaignById = useMemo(() => new Map((campaigns || []).map((c) => [c.id, c])), [campaigns]);
  const eventById = useMemo(() => new Map((events || []).map((e) => [e.id, e])), [events]);
  const contractById = useMemo(() => new Map((contracts || []).map((c) => [c.id, c])), [contracts]);

  const brandOptions = useMemo(() => ["All brands", ...(brands || []).map((b) => b.brandName || b.name)], [brands]);
  const owners = useMemo(() => ["All owners", ...new Set((tasks || []).map((task) => task.owner).filter(Boolean))], [tasks]);

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
    status: TASK_STATUSES[0],
    priority: "Medium",
    dueDate: formatInputDate(),
    owner: "Admin",
    brandId: "",
    dealId: "",
    campaignId: "",
    eventId: "",
    contractId: ""
  });

  const visibleTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      const matchesSearch =
        !search ||
        (task.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (task.owner || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All statuses" || task.status.toLowerCase() === statusFilter.toLowerCase();
      const brandName =
        task.brandId ? brandById.get(task.brandId)?.brandName || brandById.get(task.brandId)?.name || "" : "";
      const matchesBrand = brandFilter === "All brands" || brandName === brandFilter;
      const matchesOwner = ownerFilter === "All owners" || (task.owner || "") === ownerFilter;
      return matchesSearch && matchesStatus && matchesBrand && matchesOwner;
    });
  }, [tasks, search, statusFilter, brandFilter, ownerFilter, brandById]);

  const openCreate = () => {
    setEditingId("");
    setFormError("");
    setDraft({
      title: "",
      status: TASK_STATUSES[0],
      priority: "Medium",
      dueDate: formatInputDate(),
      owner: "Admin",
      brandId: "",
      dealId: "",
      campaignId: "",
      eventId: "",
      contractId: ""
    });
    setCreateOpen(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setFormError("");
    setDraft({
      title: task.title || "",
      status: task.status || TASK_STATUSES[0],
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : formatInputDate(),
      owner: task.owner || "Admin",
      brandId: task.brandId || "",
      dealId: task.dealId || "",
      campaignId: task.campaignId || "",
      eventId: task.eventId || "",
      contractId: task.contractId || ""
    });
    setCreateOpen(true);
  };

  const saveTask = async () => {
    try {
      setFormError("");
      
      if (!draft.title || !draft.title.trim()) {
        setFormError("Task title is required.");
        return;
      }

      const hasContext = Boolean(draft.brandId || draft.dealId || draft.campaignId || draft.eventId || draft.contractId);
      if (!hasContext && !confirm("Create a task with no CRM context link? This is allowed, but harder to track later.")) {
        return;
      }

      const taskData = {
        title: draft.title,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        owner: draft.owner || null,
        brandId: draft.brandId || null,
        dealId: draft.dealId || null,
        campaignId: draft.campaignId || null,
        eventId: draft.eventId || null,
        contractId: draft.contractId || null
      };

      if (editingId) {
        await updateCrmTask(editingId, taskData);
      } else {
        await createCrmTask(taskData);
      }

      // Reload tasks
      const data = await fetchCrmTasks();
      setTasks(data);
      setCreateOpen(false);
      setEditingId("");
    } catch (err) {
      console.error("Error saving task:", err);
      setFormError(err.message || "Failed to save task");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    
    try {
      await deleteCrmTask(id);
      const data = await fetchCrmTasks();
      setTasks(data);
    } catch (err) {
      console.error("Error deleting task:", err);
      alert(err.message || "Failed to delete task");
    }
  };

  useEffect(() => {
    const loadSuggested = async () => {
      try {
        setSuggestedLoading(true);
        setSuggestedError("");
        const messages = await listGmailMessages();
        
        // If no messages, check if Gmail is connected and suggest syncing
        if (!messages || messages.length === 0) {
          setSuggestedError("No Gmail messages found. Try syncing your inbox or connect Gmail if you haven't already.");
          setSuggested([]);
          return;
        }
        
        const normalized = (messages || [])
          .flatMap((msg) => {
            const emails = msg.emails || msg.InboundEmail || [];
            return emails.map((email, index) => {
              const title =
                email.aiRecommendedAction ||
                email.subject ||
                msg.subject ||
                email.aiSummary ||
                msg.snippet ||
                "Follow up";
              const summary = email.aiSummary || email.body || msg.snippet || "";
              const receivedAt = email.receivedAt || email.date || msg.lastMessageAt;
              const priority =
                (email.aiUrgency && email.aiUrgency.toLowerCase() === "high") ? "High" : "Medium";
              return {
                id: `${msg.threadId || msg.id || "thread"}-${email.id || email.gmailId || index}`,
                title,
                summary,
                from: email.fromEmail || (msg.participants ? msg.participants[0] : ""),
                receivedAt,
                priority,
                status: email.aiCategory || "Suggested",
                threadId: msg.threadId || email.threadId || null
              };
            });
          })
          .filter((item) => item.title && item.title.trim())
          .slice(0, 10);
        setSuggested(normalized);
      } catch (error) {
        console.error("Failed to load suggested tasks from Gmail:", error);
        
        // Provide more helpful error messages
        let errorMessage = "Unable to load email suggestions.";
        if (error.code === "gmail_not_connected") {
          errorMessage = "Gmail account is not connected. Please connect your Gmail account first.";
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = "Unable to load email suggestions. Connect Gmail and try again.";
        }
        
        setSuggestedError(errorMessage);
        setSuggested([]);
      } finally {
        setSuggestedLoading(false);
      }
    };

    loadSuggested();
  }, []);

  const convertSuggestionToTask = (suggestion) => {
    setEditingId("");
    setFormError("");
    const due = suggestion.priority === "High"
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    setDraft((prev) => ({
      ...prev,
      title: suggestion.title,
      owner: suggestion.from || prev.owner,
      priority: suggestion.priority || "Medium",
      status: TASK_STATUSES[0],
      dueDate: formatInputDate(due),
      brandId: "",
      dealId: "",
      campaignId: "",
      eventId: "",
      contractId: ""
    }));
    setCreateOpen(true);
  };

  return (
    <DashboardShell
      title="Tasks"
      subtitle="Search, filter, and dispatch tasks across the Break platform."
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
        
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-black/60">
            Loading tasks...
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Global search"
                className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
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
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {owners.map((owner) => (
                  <option key={owner}>{owner}</option>
                ))}
              </select>
            </div>
        <div className="overflow-x-auto">
          <table className="mt-4 w-full text-left text-sm text-brand-black/80">
            <thead>
              <tr className="border-b border-brand-black/10 text-xs uppercase tracking-[0.3em] text-brand-red">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Context</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => {
                const deal = task.dealId ? dealById.get(task.dealId) : null;
                const brand = task.brandId ? brandById.get(task.brandId) : deal?.brandId ? brandById.get(deal.brandId) : null;
                const campaign = task.campaignId ? campaignById.get(task.campaignId) : null;
                const event = task.eventId ? eventById.get(task.eventId) : null;
                const contract = task.contractId ? contractById.get(task.contractId) : null;
                return (
                <tr key={task.id} className="border-b border-brand-black/5">
                  <td className="px-4 py-3 font-semibold text-brand-black">{task.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {brand ? <BrandChip name={brand.brandName || brand.name} status={brand.status || "Active"} size="sm" /> : null}
                      {deal ? <DealChip name={deal.dealName} status={deal.status} size="sm" /> : null}
                      {campaign ? <CampaignChip name={campaign.campaignName} status={campaign.status} size="sm" /> : null}
                      {event ? <EventChip name={event.eventName} status={event.status} size="sm" /> : null}
                      {contract ? <ContractChip name={contract.contractName} status={contract.status} size="sm" /> : null}
                      {!brand && !deal && !campaign && !event && !contract ? (
                        <span className="text-xs uppercase tracking-[0.35em] text-brand-black/50">Unlinked</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{task.owner}</td>
                  <td className="px-4 py-3">{task.status}</td>
                  <td className="px-4 py-3">{task.dueDate ? new Date(task.dueDate).toLocaleString("en-GB") : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                        onClick={() => openEdit(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-brand-red px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-red"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
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
                onLearnMore={() => window.location.href = "/admin/crm-settings"}
              />
            </div>
          ) : visibleTasks.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-brand-black/60">No tasks match your filters.</p>
          ) : null}
        </div>
          </>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Suggested tasks</p>
            <h2 className="font-display text-2xl uppercase text-brand-black">Pulled from synced emails</h2>
            <p className="text-sm text-brand-black/60">Based on Gmail thread summaries and AI recommendations.</p>
          </div>
        </div>
        {suggestedError ? <p className="text-sm text-brand-red">{suggestedError}</p> : null}
        {suggestedLoading ? (
          <p className="text-sm text-brand-black/60">Scanning synced inbox for actions…</p>
        ) : suggested.length === 0 ? (
          <p className="text-sm text-brand-black/60">No suggestions yet. Sync Gmail to see recommended tasks.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {suggested.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
                      {item.from || "Email"} · {item.status}
                    </p>
                    <h4 className="font-semibold text-brand-black">{item.title}</h4>
                    {item.summary ? <p className="text-sm text-brand-black/70 line-clamp-3">{item.summary}</p> : null}
                  </div>
                  <Badge tone={item.priority === "High" ? "positive" : "neutral"}>{item.priority}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-brand-black/50">
                  <span>{item.receivedAt ? new Date(item.receivedAt).toLocaleString("en-GB") : "No timestamp"}</span>
                  {item.threadId ? (
                    <a
                      href={`/admin/inbox#${item.threadId}`}
                      className="text-brand-red underline underline-offset-4"
                    >
                      View thread
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                    onClick={() => convertSuggestionToTask(item)}
                  >
                    Convert to task
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ModalFrame
        open={createOpen}
        title={editingId ? "Edit task" : "Add task"}
        subtitle="Tasks"
        onClose={() => {
          setCreateOpen(false);
          setEditingId("");
          setFormError("");
        }}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {formError ? <p className="mr-auto text-sm text-brand-red">{formError}</p> : null}
            <TextButton
              onClick={() => {
                setCreateOpen(false);
                setEditingId("");
                setFormError("");
              }}
            >
              Cancel
            </TextButton>
            <PrimaryButton onClick={saveTask}>
              {editingId ? "Save task" : "Create task"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-sm text-brand-black/80">Tasks are action. Notes are memory. Outreach is contact.</p>
          <p className="mt-2 text-xs text-brand-black/60">
            Optional: link to a deal/brand/campaign/event/contract to keep follow-through contextual.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" value={draft.title} onChange={(v) => setDraft((p) => ({ ...p, title: v }))} placeholder="e.g. Send contract v2 for review" />
          <Field label="Owner" value={draft.owner} onChange={(v) => setDraft((p) => ({ ...p, owner: v }))} placeholder="Agent / admin" />
          <Select label="Status" value={draft.status} onChange={(v) => setDraft((p) => ({ ...p, status: v }))} options={TASK_STATUSES} />
          <Select label="Priority" value={draft.priority} onChange={(v) => setDraft((p) => ({ ...p, priority: v }))} options={TASK_PRIORITIES} />
          <Field label="Due date" type="datetime-local" value={draft.dueDate} onChange={(v) => setDraft((p) => ({ ...p, dueDate: v }))} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Brand (optional)"
            value={draft.brandId || ""}
            onChange={(v) => setDraft((p) => ({ ...p, brandId: v, dealId: "" }))}
            options={[{ value: "", label: "None" }, ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))]}
          />
          <Select
            label="Deal (optional)"
            value={draft.dealId || ""}
            onChange={(v) => setDraft((p) => ({ ...p, dealId: v }))}
            options={[
              { value: "", label: draft.brandId ? "None" : "None (select brand to narrow deals)" },
              ...(draft.brandId ? deals.filter((d) => d.brandId === draft.brandId) : deals).map((d) => ({ value: d.id, label: d.dealName }))
            ]}
          />
          <Select
            label="Campaign (optional)"
            value={draft.campaignId || ""}
            onChange={(v) => setDraft((p) => ({ ...p, campaignId: v }))}
            options={[{ value: "", label: "None" }, ...campaigns.map((c) => ({ value: c.id, label: c.campaignName }))]}
          />
          <Select
            label="Event (optional)"
            value={draft.eventId || ""}
            onChange={(v) => setDraft((p) => ({ ...p, eventId: v }))}
            options={[{ value: "", label: "None" }, ...events.map((e) => ({ value: e.id, label: e.eventName }))]}
          />
          <Select
            label="Contract (optional)"
            value={draft.contractId || ""}
            onChange={(v) => setDraft((p) => ({ ...p, contractId: v }))}
            options={[{ value: "", label: "None" }, ...contracts.map((c) => ({ value: c.id, label: c.contractName }))]}
          />
        </div>
      </ModalFrame>
    </DashboardShell>
  );
}

export default AdminTasksPage;
