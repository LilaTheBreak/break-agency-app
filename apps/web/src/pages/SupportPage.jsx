import React, { useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Roles } from "../constants/roles.js";
import { readCrmTasks, upsertCrmTask, validateTask } from "../lib/crmTasks.js";

const STRATEGY_TRACKS = [
  {
    id: "brand-strategy",
    title: "Brand growth strategy",
    audience: "Brands & founders",
    duration: "45 min",
    slots: ["Tue · 10:00 GMT", "Wed · 16:00 GMT", "Fri · 11:30 GMT"],
    focus: ["Launch planning", "Brief review", "Paid media pacing"]
  },
  {
    id: "exclusive-talent",
    title: "Exclusive talent runway",
    audience: "Exclusive talent",
    duration: "40 min",
    slots: ["Mon · 17:00 GMT", "Thu · 14:00 GMT"],
    focus: ["Offer positioning", "Rate validation", "Pipeline sequencing"]
  },
  {
    id: "ops-fast-track",
    title: "Ops fast track",
    audience: "Brands & talent",
    duration: "25 min",
    slots: ["Daily · 09:30 GMT", "Daily · 18:00 GMT"],
    focus: ["Unblock deliverables", "Finance + legal clarifications"]
  }
];

const OFFICE_HOURS = [
  { id: "campaign-clinic", title: "Campaign clinic", host: "Break Strategy Pod", window: "Mon & Thu · 13:00–15:00 GMT", note: "Drop-in time for quick reviews, no booking needed." },
  { id: "payments", title: "Payments & finance", host: "Finance Desk", window: "Tue · 15:00–16:00 GMT", note: "Payouts, invoices, tax docs, and usage questions." },
  { id: "product-labs", title: "Product labs", host: "Product & Data", window: "Wed · 11:00–12:00 GMT", note: "Feedback on product, reporting, and integrations." }
];

const WORKSHOPS = [
  { id: "gtm-lab", title: "GTM & launch lab", date: "Next: 14 May", seats: "6 seats", focus: "Break down a launch plan with templates and pacing models." },
  { id: "ugc-systems", title: "UGC systems workshop", date: "Next: 16 May", seats: "10 seats", focus: "How to brief, QA, and recycle UGC with fewer rounds." },
  { id: "finance-ops", title: "Finance ops hour", date: "Next: 21 May", seats: "8 seats", focus: "Clean payout workflows, reconciliations, and approvals." }
];

const RECORDINGS = [
  {
    id: "q2-retro",
    title: "Strategy retro: AI finance launch",
    date: "12 May",
    length: "38m",
    highlights: ["Audience routing", "Budget locks", "Creative pivots"]
  },
  {
    id: "ugc-playbook",
    title: "UGC playbook teardown",
    date: "02 May",
    length: "42m",
    highlights: ["Briefing structure", "Review cadence", "Creator QA gates"]
  },
  {
    id: "talent-offer",
    title: "Exclusive talent offer lab",
    date: "26 Apr",
    length: "35m",
    highlights: ["Pricing ladders", "Platform mix", "Sponsor hygiene"]
  }
];

const ACTION_POINTS = [
  { id: "brief-refresh", title: "Share updated brand brief with paid media guardrails", dueInDays: 2, priority: "High" },
  { id: "talent-trio", title: "Confirm top 3 talent picks for the June drop", dueInDays: 1, priority: "Medium" },
  { id: "retro-notes", title: "Upload retro notes and next steps into the workspace", dueInDays: 3, priority: "Low" }
];

const FAQ_ENTRIES = [
  { q: "How do I request a strategy call?", a: "Pick a track, choose a slot, and add context. Brands, founders, and exclusive talent get priority scheduling." },
  { q: "Where do recordings live?", a: "We archive recordings here with quick notes. You can also request a copy via async questions if you missed a session." },
  { q: "Can action points become tasks?", a: "Yes—use the Add to tasks button. Items land in your CRM task list with due dates pre-filled." },
  { q: "How fast are async responses?", a: "Most questions are answered within a few business hours. Urgent items are escalated to an on-call strategist." }
];

const SUPPORTED_STRATEGY_ROLES = [Roles.BRAND, Roles.FOUNDER, Roles.EXCLUSIVE_TALENT];

function dueDateFromNow(days = 2) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function SupportPage() {
  const { user } = useAuth();
  const [bookingNotes, setBookingNotes] = useState({});
  const [lastBooking, setLastBooking] = useState(null);
  const [taskState, setTaskState] = useState({});
  const [tasks, setTasks] = useState(() => readCrmTasks());
  const [questionDraft, setQuestionDraft] = useState("");
  const [asyncQueue, setAsyncQueue] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(RECORDINGS[0]);

  const userLabel = user?.name || user?.email || "Member";
  const canBookStrategy = SUPPORTED_STRATEGY_ROLES.includes(user?.role);

  const navigation = useMemo(
    () => [
      { label: "Live support", anchor: "#strategy", default: true },
      { label: "Office hours", anchor: "#office-hours" },
      { label: "Recordings", anchor: "#recordings" },
      { label: "Action points", anchor: "#action-points" },
      { label: "Async Q&A", anchor: "#async" },
      { label: "FAQ", anchor: "#faq" }
    ],
    []
  );

  const handleBook = (track, slot) => {
    if (!canBookStrategy) return;
    const note = bookingNotes[track.id] || "";
    setLastBooking({ track: track.title, slot, note: note.trim() || null });
    setBookingNotes((prev) => ({ ...prev, [track.id]: "" }));
  };

  const handleAddTask = (action) => {
    const nextTask = {
      id: `support-${action.id}`,
      title: action.title,
      status: "Pending",
      priority: action.priority || "Medium",
      dueDate: dueDateFromNow(action.dueInDays || 2),
      owner: userLabel,
      brandId: "",
      dealId: "",
      campaignId: "",
      eventId: "",
      contractId: "",
      source: "Support"
    };
    const { ok } = validateTask(nextTask);
    if (!ok) {
      setTaskState((prev) => ({ ...prev, [action.id]: "error" }));
      return;
    }
    const updated = upsertCrmTask(nextTask);
    setTasks(updated);
    setTaskState((prev) => ({ ...prev, [action.id]: "added" }));
  };

  const handleSubmitQuestion = () => {
    if (!questionDraft.trim()) return;
    const entry = {
      id: `question-${Date.now()}`,
      body: questionDraft.trim(),
      status: "Queued",
      createdAt: new Date().toISOString()
    };
    setAsyncQueue((prev) => [entry, ...prev]);
    setQuestionDraft("");
  };

  const liveTasksPreview = (tasks || []).slice(0, 4);

  return (
    <DashboardShell
      title="Support"
      subtitle="Book strategy time, rewatch sessions, push action points into tasks, and get answers without leaving the console."
      navigation={navigation}
      role={user?.role}
    >
      <section id="strategy" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Live support</p>
            <p className="text-sm text-brand-black/70">Dedicated strategy calls plus a fast-track lane for blockers.</p>
          </div>
          {!canBookStrategy ? (
            <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
              Strategy calls available for brands, founders, and exclusive talent
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STRATEGY_TRACKS.map((track) => (
            <article key={track.id} className="flex h-full flex-col justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg uppercase">{track.title}</p>
                  <span className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70">
                    {track.duration}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{track.audience}</p>
                <div className="flex flex-wrap gap-2">
                  {track.focus.map((item) => (
                    <span key={item} className="rounded-full bg-brand-white px-3 py-1 text-[0.7rem] text-brand-black/80">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-2 space-y-1 text-sm text-brand-black/80">
                  {track.slots.map((slot) => (
                    <label key={slot} className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2 text-sm shadow-sm">
                      <input
                        type="radio"
                        name={track.id}
                        value={slot}
                        onChange={() => handleBook(track, slot)}
                        disabled={!canBookStrategy}
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                className="mt-3 w-full rounded-2xl border border-brand-black/15 bg-brand-white px-3 py-2 text-sm text-brand-black/80 focus:border-brand-black focus:outline-none"
                placeholder="Add context for this session (optional)"
                value={bookingNotes[track.id] || ""}
                onChange={(e) =>
                  setBookingNotes((prev) => ({
                    ...prev,
                    [track.id]: e.target.value
                  }))
                }
                disabled={!canBookStrategy}
              />
            </article>
          ))}
        </div>
        {lastBooking ? (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-black/90 px-4 py-3 text-brand-white">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-white/70">Booked</p>
            <p className="text-sm">
              {lastBooking.track} locked for {lastBooking.slot}.{" "}
              {lastBooking.note ? `Context shared: ${lastBooking.note}` : "We will confirm and send an invite."}
            </p>
          </div>
        ) : null}
      </section>

      <section
        id="office-hours"
        className="space-y-4 rounded-3xl border border-brand-black/10 bg-gradient-to-br from-brand-linen/50 via-brand-white to-brand-linen/40 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Office hours & workshops</p>
            <p className="text-sm text-brand-black/70">Drop in for quick help or reserve a deeper working session.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-brand-black">Office hours</p>
            <div className="space-y-3">
              {OFFICE_HOURS.map((hour) => (
                <div key={hour.id} className="rounded-xl border border-brand-black/10 bg-brand-linen/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-brand-black">{hour.title}</p>
                    <span className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{hour.host}</span>
                  </div>
                  <p className="text-sm text-brand-black/80">{hour.window}</p>
                  <p className="text-xs text-brand-black/60">{hour.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-brand-black">Workshops</p>
            <div className="space-y-3">
              {WORKSHOPS.map((workshop) => (
                <div key={workshop.id} className="flex items-start justify-between gap-3 rounded-xl border border-brand-black/10 bg-brand-linen/40 p-3">
                  <div>
                    <p className="font-semibold text-brand-black">{workshop.title}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{workshop.date}</p>
                    <p className="text-sm text-brand-black/70">{workshop.focus}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-brand-black hover:-translate-y-0.5 hover:bg-brand-white"
                  >
                    Reserve · {workshop.seats}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="recordings" className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Recordings</p>
            <p className="text-sm text-brand-black/70">Catch up on sessions you missed with highlights and notes.</p>
          </div>
          <span className="rounded-full border border-brand-black/15 bg-brand-linen/50 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
            Latest: {selectedRecording?.title}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {RECORDINGS.map((recording) => (
            <article
              key={recording.id}
              className={`cursor-pointer rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                selectedRecording?.id === recording.id
                  ? "border-brand-red bg-brand-linen/60"
                  : "border-brand-black/10 bg-brand-white"
              }`}
              onClick={() => setSelectedRecording(recording)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-brand-black">{recording.title}</p>
                <span className="rounded-full border border-brand-black/20 px-2 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70">
                  {recording.length}
                </span>
              </div>
              <p className="text-xs text-brand-black/60">{recording.date}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recording.highlights.map((item) => (
                  <span key={item} className="rounded-full bg-brand-linen/70 px-3 py-1 text-[0.75rem] text-brand-black/80">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        {selectedRecording ? (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-black/90 px-4 py-3 text-brand-white">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-white/70">Selected recording</p>
            <p className="text-sm">
              {selectedRecording.title} ({selectedRecording.length}) — saved on {selectedRecording.date}. Request a download via async Q&A if you need the file.
            </p>
          </div>
        ) : null}
      </section>

      <section id="action-points" className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Meeting action points</p>
            <p className="text-sm text-brand-black/70">Push follow-ups straight into your tasks with one click.</p>
          </div>
          <span className="rounded-full border border-brand-black/15 bg-brand-linen/50 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
            Tasks sync locally
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {ACTION_POINTS.map((action) => (
            <article key={action.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 shadow-sm">
              <p className="font-semibold text-brand-black">{action.title}</p>
              <p className="text-xs text-brand-black/60">Due in ~{action.dueInDays} day(s) · Priority {action.priority}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAddTask(action)}
                  className="rounded-full bg-brand-black px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-brand-white transition hover:-translate-y-0.5"
                >
                  Add to tasks
                </button>
                <span className="text-xs text-brand-black/60">
                  {taskState[action.id] === "added" ? "Added" : taskState[action.id] === "error" ? "Could not save" : "CRM sync"}
                </span>
              </div>
            </article>
          ))}
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Task list preview</p>
          {liveTasksPreview.length === 0 ? (
            <p className="mt-2 text-sm text-brand-black/70">No tasks stored yet. Add an action point to create your first task.</p>
          ) : (
            <ul className="mt-3 divide-y divide-brand-black/5">
              {liveTasksPreview.map((task) => (
                <li key={task.id} className="flex items-center justify-between py-2 text-sm text-brand-black/80">
                  <div>
                    <p className="font-semibold text-brand-black">{task.title}</p>
                    <p className="text-xs text-brand-black/60">
                      Status: {task.status || "Pending"} · Owner: {task.owner || "You"}
                    </p>
                  </div>
                  <span className="text-xs text-brand-black/60">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "No due date"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="async" className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Async questions</p>
            <p className="text-sm text-brand-black/70">Log blockers, share files, and we’ll route to the right pod.</p>
          </div>
          <span className="rounded-full border border-brand-black/15 bg-brand-linen/50 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
            Replies within a few hours
          </span>
        </div>
        <textarea
          className="w-full rounded-2xl border border-brand-black/15 bg-brand-linen/40 px-3 py-3 text-sm text-brand-black/80 focus:border-brand-black focus:outline-none"
          placeholder="Ask a question, paste a link, or outline a blocker…"
          value={questionDraft}
          onChange={(e) => setQuestionDraft(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSubmitQuestion}
            className="rounded-full bg-brand-black px-5 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-brand-white transition hover:-translate-y-0.5"
          >
            Send async update
          </button>
          <div className="flex flex-wrap gap-2 text-xs text-brand-black/60">
            <span className="rounded-full bg-brand-linen/60 px-3 py-1">Attach drive link</span>
            <span className="rounded-full bg-brand-linen/60 px-3 py-1">Tag finance</span>
            <span className="rounded-full bg-brand-linen/60 px-3 py-1">Mark as urgent</span>
          </div>
        </div>
        {asyncQueue.length ? (
          <ul className="divide-y divide-brand-black/5 rounded-2xl border border-brand-black/10 bg-brand-white">
            {asyncQueue.map((item) => (
              <li key={item.id} className="space-y-1 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-brand-black/15 bg-brand-linen/50 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70">
                    {item.status}
                  </span>
                  <span className="text-xs text-brand-black/60">
                    {new Date(item.createdAt).toLocaleString("en-GB")}
                  </span>
                </div>
                <p className="text-sm text-brand-black/80">{item.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section id="faq" className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">FAQ</p>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ_ENTRIES.map((item) => (
            <article key={item.q} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 shadow-sm">
              <p className="font-semibold text-brand-black">{item.q}</p>
              <p className="mt-1 text-sm text-brand-black/70">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}

export default SupportPage;
