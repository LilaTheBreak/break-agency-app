import React, { useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ContactAutocomplete } from "../components/ContactAutocomplete.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const LATEST = [
  { action: "brand@sohohouse.com submitted the Q2 intake form.", time: "5m ago" },
  { action: "creator@breaktalent.com completed onboarding.", time: "38m ago" },
  { action: "Contracts for 'Residence Series' moved to legal review.", time: "1h ago" }
];

const TALENT_DIRECTORY = [
  "Lila Prasad",
  "Mo Al Ghazi",
  "Exclusive Creator",
  "UGC Creator",
  "Finance Bot",
  "Automation Pod"
];

const INITIAL_TASKS = [
  {
    id: createId(),
    title: "Finalize brand brief",
    dueDate: "2025-01-15T16:00",
    assignee: "Mo Al Ghazi",
    status: "In progress",
    description: "Deliver final draft for hospitality brief and route to brand partner.",
    talent: ["Mo Al Ghazi"],
    priority: "High"
  },
  {
    id: createId(),
    title: "Review new creator profile",
    dueDate: "2025-01-16T10:00",
    assignee: "Lila Prasad",
    status: "Queued",
    description: "Verify compliance docs and update onboarding checklist.",
    talent: ["Lila Prasad"],
    priority: "Medium"
  },
  {
    id: createId(),
    title: "Approve finance reconciliation",
    dueDate: "2025-01-17T13:00",
    assignee: "Finance Bot",
    status: "Waiting on brand",
    description: "Greenlight payouts after confirming brand remittance.",
    talent: ["Finance Bot"],
    priority: "Medium"
  }
];

export function AdminQueuesPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(null);

  const openModal = (task) => {
    const payload =
      task ||
      ({
        id: createId(),
        title: "",
        dueDate: new Date().toISOString().slice(0, 16),
        assignee: "",
        status: "Queued",
        description: "",
        talent: [],
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
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTalent = (name) => {
    setFormState((prev) => {
      const picked = new Set(prev.talent || []);
      if (picked.has(name)) {
        picked.delete(name);
      } else {
        picked.add(name);
      }
      return { ...prev, talent: Array.from(picked) };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTasks((prev) => {
      const exists = prev.some((item) => item.id === formState.id);
      if (exists) {
        return prev.map((item) => (item.id === formState.id ? formState : item));
      }
      return [formState, ...prev];
    });
    closeModal();
  };

  const handleDelete = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (activeTask?.id === id) {
      closeModal();
    }
  };

  const formattedTasks = useMemo(
    () =>
      tasks.map((task) => {
        const date = new Date(task.dueDate);
        const isValid = !Number.isNaN(date.getTime());
        return {
          ...task,
          dueLabel: isValid
            ? date.toLocaleString("en-GB", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit"
              })
            : "No due date"
        };
      }),
    [tasks]
  );

  return (
    <DashboardShell
      title="Queues"
      subtitle="See what needs attention. Triage tasks, watch recent activity, and unblock teams."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Tasks due</p>
          <button
            type="button"
            onClick={() => openModal(null)}
            className="mt-3 rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            + New task
          </button>
          <ul className="mt-4 space-y-3 text-left text-sm text-brand-black/80">
            {formattedTasks.map((task) => (
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
                      handleDelete(task.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="neutral">{task.assignee || "Unassigned"}</Badge>
                <Badge tone="positive">{task.priority}</Badge>
                {(task.talent || []).map((name) => (
                  <Badge key={name}>{name}</Badge>
                ))}
              </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Latest actions</p>
          <ul className="mt-4 space-y-3 text-left text-sm text-brand-black/80">
            {LATEST.map((item) => (
              <li
                key={item.action}
                className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3"
              >
                <p>{item.action}</p>
                <p className="text-xs text-brand-black/60">{item.time}</p>
              </li>
            ))}
          </ul>
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
                    value={formState.talent?.[0] || ""}
                    onSelect={(value) => setFormState((prev) => ({ ...prev, talent: value ? [value] : [] }))}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                {activeTask ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(formState.id)}
                    className="rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-red"
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
                    className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.35em]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white"
                  >
                    {activeTask ? "Save changes" : "Add task"}
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
