import React, { useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { useMessaging } from "../context/messaging.js";

const FILTERS = ["All", "Creators", "Brands", "Talent Managers", "External"];

export function AdminMessagingPage() {
  const { messages } = useMessaging();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedThread, setSelectedThread] = useState(null);
  const filteredThreads =
    activeFilter === "All"
      ? messages
      : messages.filter((thread) => thread.persona === activeFilter);

  return (
    <DashboardShell
      title="Messaging"
      subtitle="Monitor conversations and dispatch inbox responses without leaving the console."
      navLinks={ADMIN_NAV_LINKS}
    >
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
      <section className="mt-4 space-y-3">
        {filteredThreads.map((thread) => (
          <article
            key={thread.id || thread.subject}
            className="cursor-pointer rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] text-left transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
            onClick={() => setSelectedThread(thread)}
          >
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{thread.persona}</p>
            <h3 className="font-display text-2xl uppercase">{thread.subject}</h3>
            <p className="text-sm text-brand-black/70">{thread.preview}</p>
            <p className="mt-2 text-xs text-brand-black/50">
              Participants: {thread.participants.join(", ")}
            </p>
          </article>
        ))}
      </section>
      {selectedThread ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/90 p-4">
          <div className="w-full max-w-2xl rounded-[36px] border border-brand-black/15 bg-brand-white p-8 text-left text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <h3 className="font-display text-3xl uppercase">{selectedThread.subject}</h3>
            <p className="text-sm text-brand-black/70">{selectedThread.persona}</p>
            <p className="mt-4 text-sm text-brand-black/80">{selectedThread.preview}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-brand-red">Participants</p>
            <p className="text-sm text-brand-black/70">{selectedThread.participants.join(", ")}</p>
            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setSelectedThread(null)}
                className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
