import React, { useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const FILTERS = ["All", "Creators", "Brands", "Talent Managers"];
const THREADS = [
  {
    subject: "UGC board feedback",
    persona: "Creators",
    participants: ["ugc@creator.com"],
    preview: "Thanks for the notes—I'll revise the draft tonight."
  },
  {
    subject: "Budget confirmation",
    persona: "Brands",
    participants: ["brand@client.com"],
    preview: "Confirming the new £45k cap for Paid media."
  },
  {
    subject: "Roster onboarding",
    persona: "Talent Managers",
    participants: ["manager@breaktalent.com"],
    preview: "Need a quick check on the exclusivity clause."
  }
];

export function AdminMessagingPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filteredThreads =
    activeFilter === "All"
      ? THREADS
      : THREADS.filter((thread) => thread.persona === activeFilter);

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
            key={thread.subject}
            className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] text-left"
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
    </DashboardShell>
  );
}
