import React, { useMemo, useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ContactAutocomplete } from "../components/ContactAutocomplete.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";

const TALENT_DIRECTORY = [
  "Lila Prasad",
  "Mo Al Ghazi",
  "Exclusive Creator",
  "UGC Creator",
  "Finance Bot",
  "Automation Pod"
];

export function AdminQueuesPage() {
  // Queue items state
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  // Internal tasks state - NOW API-BACKED
  const [internalTasks, setInternalTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  
  // Modal state
  const [activeTask, setActiveTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(null);
  const [formSaving, setFormSaving] = useState(false);

  // Fetch queue items on mount
  useEffect(() => {
    fetchQueueItems();
    fetchInternalTasks();
  }, []);

  const fetchQueueItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/queues/all");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch queue items");
      }
      
      setQueueItems(data.items || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch queue items:", err);
      setError(err.message || "Failed to load queue items");
      setQueueItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalTasks = async () => {
    try {
      setTasksLoading(true);
      setTasksError(null);
      const response = await apiFetch("/api/queues/internal-tasks");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch internal tasks");
      }
      
      setInternalTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch internal tasks:", err);
      setTasksError(err.message || "Failed to load internal tasks");
      setInternalTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleMarkComplete = async (item) => {
    try {
      setDispatchingId(item.id);
      const response = await apiFetch(`/api/queues/${item.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setQueueItems(prev => prev.filter(q => q.id !== item.id));
      } else {
        alert(data.error || "Failed to mark item complete");
      }
    } catch (error) {
      console.error("Failed to complete item:", error);
      alert("Failed to mark item complete. Please try again.");
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm("Are you sure you want to reject this item?")) return;

    try {
      setDispatchingId(item.id);
      const response = await apiFetch(`/api/queues/${item.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type, reason: "Rejected from queue" })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setQueueItems(prev => prev.filter(q => q.id !== item.id));
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setDispatchingId(null);
    }
  };

  const getStatusBadgeTone = (status) => {
    if (status?.toLowerCase().includes("overdue")) return "negative";
    if (status?.toLowerCase().includes("pending") || status?.toLowerCase().includes("awaiting")) return "warning";
    return "neutral";
  };

  const getTypeBadge = (type) => {
    const labels = {
      onboarding: "Onboarding",
      content: "Content",
      contract: "Contract",
      support: "Support"
    };
    return labels[type] || type;
  };

  const openModal = (task) => {
    const payload =
      task ||
      ({
        title: "",
        dueDate: formatInputDate(new Date()),
        assignee: "",
        status: "pending",
        description: "",
        priority: "Medium"
      });
    setActiveTask(task || null);
    setFormState(payload);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTask(null);
    setFormState(null);
    setFormSaving(false);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formState.title || !formState.dueDate) {
      alert("Title and due date are required.");
      return;
    }
    
    try {
      setFormSaving(true);
      
      if (activeTask) {
        // Update existing task
        const response = await apiFetch(`/api/queues/internal-tasks/${activeTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formState.title,
            description: formState.description,
            priority: formState.priority,
            dueDate: formState.dueDate,
            assignedToUserId: formState.assignee || null,
            metadata: {
              talent: formState.talent || []
            }
          })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to update task");
        }
        
        await fetchInternalTasks();
      } else {
        // Create new task
        const response = await apiFetch("/api/queues/internal-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formState.title,
            description: formState.description,
            priority: formState.priority,
            dueDate: formState.dueDate,
            assignedToUserId: formState.assignee || null,
            metadata: {
              talent: formState.talent || []
            }
          })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to create task");
        }
        
        await fetchInternalTasks();
      }
      
      closeModal();
    } catch (error) {
      console.error("Failed to save task:", error);
      alert(error.message || "Failed to save task. Please try again.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      const response = await apiFetch(`/api/queues/internal-tasks/${id}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchInternalTasks();
        if (activeTask?.id === id) {
          closeModal();
        }
      } else {
        alert(data.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const formatInputDate = (date) => {
    const iso = new Date(date).toISOString();
    return iso.slice(0, 16);
  };

  const formattedTasks = useMemo(
    () =>
      internalTasks.map((task) => {
        const date = task.dueDate ? new Date(task.dueDate) : null;
        const isValid = date && !Number.isNaN(date.getTime());
        return {
          ...task,
          dueLabel: isValid
            ? date.toLocaleString("en-GB", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit"
              })
            : "No due date",
          assignee: task.AssignedToUser?.name || task.AssignedToUser?.email || "Unassigned",
          talent: task.metadata?.talent || []
        };
      }),
    [internalTasks]
  );

  return (
    <DashboardShell
      title="Queues"
      subtitle="See what needs attention. Triage tasks, watch recent activity, and unblock teams."
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Real Queue Items Section */}
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Queues</p>
            <h3 className="font-display text-2xl uppercase">What needs attention</h3>
            {lastRefreshed && !loading && !error && (
              <p className="text-xs text-brand-black/50 mt-1">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={fetchQueueItems}
            disabled={loading}
            className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition hover:bg-brand-black hover:text-brand-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {error ? (
            <div className="rounded-2xl border border-brand-red/30 bg-brand-red/5 px-4 py-6 text-center">
              <p className="font-semibold text-brand-red mb-2">⚠️ Failed to Load Queue</p>
              <p className="text-sm text-brand-black/70 mb-3">{error}</p>
              <button
                onClick={fetchQueueItems}
                className="rounded-full border border-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-red hover:bg-brand-red hover:text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : loading && queueItems.length === 0 ? (
            <div className="text-center py-8 text-brand-black/60">
              <p>Loading queue items...</p>
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8 text-brand-black/60">
              <p>No items require attention right now.</p>
            </div>
          ) : (
            queueItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-brand-black">{item.title}</p>
                  <p className="text-sm text-brand-black/60">Owner: {item.owner}</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
                  <div className="flex gap-2">
                    <Badge tone={getStatusBadgeTone(item.status)}>{item.status}</Badge>
                    <Badge tone="neutral">{getTypeBadge(item.type)}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(item)}
                      disabled={dispatchingId === item.id}
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5 disabled:opacity-50"
                    >
                      {dispatchingId === item.id ? "..." : "Mark complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={dispatchingId === item.id}
                      className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-red transition hover:-translate-y-0.5 hover:bg-brand-red/20 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Internal Tasks Section */}
      <section className="grid gap-4 md:grid-cols-2 mt-6">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Internal tasks</p>
          <button
            type="button"
            onClick={() => openModal(null)}
            className="mt-3 rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black hover:text-white transition-colors"
          >
            + New task
          </button>
          
          {tasksError ? (
            <div className="mt-4 rounded-2xl border border-brand-red/30 bg-brand-red/5 px-3 py-4 text-center">
              <p className="text-sm font-semibold text-brand-red mb-1">Failed to load tasks</p>
              <p className="text-xs text-brand-black/60 mb-2">{tasksError}</p>
              <button
                onClick={fetchInternalTasks}
                className="text-xs uppercase tracking-[0.3em] text-brand-red hover:underline"
              >
                Retry
              </button>
            </div>
          ) : tasksLoading ? (
            <div className="mt-4 text-center py-4 text-sm text-brand-black/60">
              Loading tasks...
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-left text-sm text-brand-black/80">
              {formattedTasks.length === 0 ? (
                <li className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 text-brand-black/60">
                  No internal tasks yet.
                </li>
              ) : (
                formattedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="cursor-pointer rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 transition hover:bg-brand-white"
                    onClick={() => openModal(task)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-brand-black">{task.title || "Untitled task"}</p>
                      <p className="text-xs text-brand-black/60">{task.dueLabel}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs uppercase tracking-[0.3em] text-brand-red"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="neutral">{task.assignee}</Badge>
                    <Badge tone="positive">{task.priority}</Badge>
                    {(task.talent || []).map((name) => (
                      <Badge key={name}>{name}</Badge>
                    ))}
                  </div>
                </li>
              ))
            )}
          </ul>
          )}
        </div>
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Queue summary</p>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-black/70">Total items</span>
              <span className="font-semibold text-brand-black">{queueItems.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-black/70">Onboarding</span>
              <span className="font-semibold text-brand-black">
                {queueItems.filter(q => q.type === "onboarding").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-black/70">Content approvals</span>
              <span className="font-semibold text-brand-black">
                {queueItems.filter(q => q.type === "content").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-black/70">Contracts</span>
              <span className="font-semibold text-brand-black">
                {queueItems.filter(q => q.type === "contract").length}
              </span>
            </div>
          </div>
        </div>
      </section>
      {modalOpen && formState ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[36px] border border-brand-black/15 bg-brand-white p-8 text-left text-brand-black shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-3xl uppercase">
                  {activeTask ? "Edit task" : "New task"}
                </h3>
                <p className="text-sm text-brand-black/70">
                  Capture task details, due dates, and associated talent.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-xs uppercase tracking-[0.35em] text-brand-black/60"
              >
                Close
              </button>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                  Title
                  <input
                    type="text"
                    value={formState.title}
                    onChange={handleChange("title")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                  Due date
                  <input
                    type="datetime-local"
                    value={formState.dueDate}
                    onChange={handleChange("dueDate")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                  Assignee
                  <input
                    type="text"
                    value={formState.assignee}
                    onChange={handleChange("assignee")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                  Priority
                  <select
                    value={formState.priority}
                    onChange={handleChange("priority")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  >
                    {["High", "Medium", "Low"].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                Description
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={handleChange("description")}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </label>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Associated contact</p>
                <div className="mt-2 space-y-2">
                  <ContactAutocomplete
                    options={TALENT_DIRECTORY}
                    value={(formState.talent || [])[0] || ""}
                    onSelect={(value) => setFormState((prev) => ({ ...prev, talent: value ? [value] : [] }))}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                {activeTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(activeTask.id)}
                    disabled={formSaving}
                    className="rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete task
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={formSaving}
                    className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-black hover:bg-brand-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formSaving ? "Saving..." : activeTask ? "Save changes" : "Add task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
