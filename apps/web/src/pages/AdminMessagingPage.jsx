import React, { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { useMessaging } from "../context/messaging.js";

const FILTERS = ["All", "Creators", "Brands", "Talent Managers", "External"];
const ACCEPTED_ATTACHMENTS = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.mp4,.mov,.xlsx,.csv";

export function AdminMessagingPage() {
  const {
    threads = [],
    templates = [],
    sendMessage,
    markThreadRead,
    alerts = [],
    connectionStatus = "connected",
    currentUser
  } = useMessaging();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [composer, setComposer] = useState({ body: "", attachments: [] });

  const filteredThreads = useMemo(() => {
    if (activeFilter === "All") return threads;
    const normalized = activeFilter.toLowerCase();
    const singular = normalized.endsWith("s") ? normalized.slice(0, -1) : normalized;
    return threads.filter((thread) => {
      const persona = (thread.persona || "").toLowerCase();
      if (!persona) return false;
      if (normalized === "talent managers") {
        return persona.includes("talent");
      }
      return persona.includes(singular);
    });
  }, [threads, activeFilter]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  useEffect(() => {
    if (selectedThread && currentUser) {
      markThreadRead(selectedThread.id, currentUser);
    }
  }, [selectedThread, currentUser, markThreadRead]);

  const handleOpenThread = (threadId) => {
    setSelectedThreadId(threadId);
    setComposer({ body: "", attachments: [] });
  };

  const handleTemplateInsert = (body) => {
    setComposer((prev) => ({
      ...prev,
      body: prev.body ? `${prev.body}\n\n${body}` : body
    }));
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      label: file.name,
      type: file.type || "file",
      size: file.size
    }));
    if (files.length) {
      setComposer((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    }
    event.target.value = "";
  };

  const handleRemoveAttachment = (id) => {
    setComposer((prev) => ({ ...prev, attachments: prev.attachments.filter((file) => file.id !== id) }));
  };

  const handleSend = async () => {
    if (!selectedThread || !composer.body.trim()) return;
    await sendMessage(selectedThread.id, { body: composer.body, attachments: composer.attachments });
    setComposer({ body: "", attachments: [] });
  };

  const connectionLabel = connectionStatus === "connected" ? "Live sync" : "Syncing…";

  return (
    <DashboardShell
      title="Messaging"
      subtitle="Monitor conversations, trigger automations, and keep receipts for every persona."
      navLinks={ADMIN_NAV_LINKS}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                activeFilter === filter ? "border-brand-black bg-brand-black text-brand-white" : "border-brand-black/30"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : "bg-amber-400 animate-pulse"
            }`}
          />
          {connectionLabel}
        </div>
      </div>
      <SystemAlerts alerts={alerts} />
      <section className="mt-4 space-y-3">
        {filteredThreads.length ? (
          filteredThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onOpen={handleOpenThread}
              currentUser={currentUser}
            />
          ))
        ) : (
          <p className="rounded-3xl border border-brand-black/10 bg-brand-white/80 p-6 text-sm text-brand-black/70">
            No threads in this filter yet.
          </p>
        )}
      </section>
      {selectedThread ? (
        <ThreadModal
          thread={selectedThread}
          onClose={() => setSelectedThreadId(null)}
          composer={composer}
          setComposer={setComposer}
          templates={templates}
          onTemplateInsert={handleTemplateInsert}
          onAttachmentChange={handleAttachmentChange}
          onRemoveAttachment={handleRemoveAttachment}
          onSend={handleSend}
        />
      ) : null}
    </DashboardShell>
  );
}

function ThreadCard({ thread, onOpen, currentUser }) {
  const lastMessage = thread.messages?.[thread.messages.length - 1];
  const preview = lastMessage?.body || thread.preview || "—";
  const unreadCount = thread.messages?.filter((message) => !message.readBy?.includes(currentUser)).length || 0;
  const timestamp = lastMessage?.timestamp;

  return (
    <article
      className="cursor-pointer rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] text-left transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
      onClick={() => onOpen(thread.id)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{thread.persona}</p>
          <h3 className="font-display text-2xl uppercase">{thread.subject}</h3>
        </div>
        <div className="text-right text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/50">
          {timestamp ? timeAgo(timestamp) : null}
        </div>
      </div>
      <p className="mt-2 text-sm text-brand-black/70 line-clamp-2">{preview}</p>
      <p className="mt-2 text-xs text-brand-black/50">
        Participants: {thread.participants?.join(", ")}
      </p>
      {unreadCount ? (
        <span className="mt-3 inline-flex items-center rounded-full border border-brand-red/20 bg-brand-red/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-brand-red">
          {unreadCount} unread
        </span>
      ) : (
        <span className="mt-3 inline-flex items-center rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/70">
          Read
        </span>
      )}
    </article>
  );
}

function ThreadModal({
  thread,
  onClose,
  composer,
  setComposer,
  templates,
  onTemplateInsert,
  onAttachmentChange,
  onRemoveAttachment,
  onSend
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[36px] border border-brand-black/15 bg-brand-white p-8 text-left text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl uppercase">{thread.subject}</h3>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{thread.persona}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-xs text-brand-black/60">
          Participants: {thread.participants?.join(", ")}
        </p>
        <div className="mt-6 space-y-4">
          {thread.messages?.map((message) => (
            <ThreadMessage key={message.id} message={message} />
          ))}
        </div>
        <div className="mt-6 space-y-4 rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">AI templates</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onTemplateInsert(template.body)}
                  className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black hover:text-brand-white"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Message
            <textarea
              value={composer.body}
              onChange={(event) => setComposer((prev) => ({ ...prev, body: event.target.value }))}
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-brand-black/20 bg-white px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              placeholder="Type a response, drop a summary, or paste a template…"
            />
          </label>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Attachments</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="cursor-pointer rounded-full border border-brand-black/50 px-4 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black hover:bg-brand-black hover:text-brand-white">
                Upload
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_ATTACHMENTS}
                  className="hidden"
                  onChange={onAttachmentChange}
                />
              </label>
              {composer.attachments.map((file) => (
                <span
                  key={file.id}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-black/15 bg-white px-3 py-1 text-xs text-brand-black/70"
                >
                  {file.label}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(file.id)}
                    className="text-brand-red"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={onSend}
              className="rounded-full bg-brand-black px-5 py-2 text-xs uppercase tracking-[0.35em] text-brand-white hover:bg-brand-black/90"
            >
              Send message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadMessage({ message }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-black">{message.sender}</p>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{message.senderRole}</p>
        </div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/50">{formatTimestamp(message.timestamp)}</p>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm text-brand-black/80">{message.body}</p>
      {message.attachments?.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {message.attachments.map((attachment) => (
            <span
              key={attachment.id || attachment.label}
              className="rounded-full border border-brand-black/20 bg-brand-linen/60 px-3 py-1 text-brand-black/70"
            >
              {attachment.label || attachment.name} · {attachment.type || "file"}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-[0.55rem] uppercase tracking-[0.35em] text-brand-black/40">
        {message.readBy?.length ? `Read by ${message.readBy.join(", ")}` : "Awaiting read receipt"}
      </p>
    </div>
  );
}

function SystemAlerts({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {alerts.slice(0, 4).map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm text-brand-black/80"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{alert.title}</p>
          <p className="mt-1">{alert.detail}</p>
          <p className="mt-2 text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/50">{timeAgo(alert.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return `${Math.max(1, Math.round(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short"
  }).format(timestamp);
}
