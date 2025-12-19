import React from "react";
import { Badge } from "./Badge.jsx";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{label}</p>
      <p className="text-sm text-brand-black/80">{value || "—"}</p>
    </div>
  );
}

export function CrmContactPanel({ contact, heading = "CRM contact", cta }) {
  if (!contact) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{heading}</p>
        <p className="mt-2 text-sm text-brand-black/70">No CRM record yet.</p>
        {cta}
      </section>
    );
  }

  const timeline = contact.updates || [];
  const tasksFromBlockers = (contact.blockers || []).map((blocker, idx) => ({
    id: `${contact.email}-blocker-${idx}`,
    title: blocker,
    status: "Pending",
    owner: contact.owner || "Admin"
  }));

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{heading}</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">{contact.preferredName || contact.email}</h3>
          <p className="text-sm text-brand-black/60">{contact.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{contact.stage || "Onboarding"}</Badge>
          <Badge tone="neutral">Owner: {contact.owner || "Admin"}</Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Role / context" value={[contact.role, contact.context].filter(Boolean).join(" · ")} />
        <Field label="Goal" value={contact.primaryGoal || contact.goals?.join(" · ")} />
        <Field label="Platforms" value={(contact.platforms || []).join(", ")} />
        <Field label="Niche" value={(contact.niches || []).join(", ")} />
        <Field label="Partnership preference" value={contact.partnershipPreference} />
        <Field label="Capacity / lead time" value={[contact.capacity, contact.leadTime].filter(Boolean).join(" · ")} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Tasks from blockers</p>
          {tasksFromBlockers.length ? (
            tasksFromBlockers.map((task) => (
              <div key={task.id} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                <p className="font-semibold text-brand-black">{task.title}</p>
                <p className="text-xs text-brand-black/60">Owner: {task.owner}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-black/60">No blockers captured.</p>
          )}
        </div>
        <div className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Status updates</p>
          {timeline.length ? (
            timeline.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                <p className="font-semibold text-brand-black">{item.title}</p>
                <p className="text-sm text-brand-black/70">{item.body}</p>
                <p className="text-xs text-brand-black/50">{item.ts ? new Date(item.ts).toLocaleString() : ""}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-black/60">No updates yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default CrmContactPanel;
