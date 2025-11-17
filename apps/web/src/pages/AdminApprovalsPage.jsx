import React, { useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ContactAutocomplete } from "../components/ContactAutocomplete.jsx";

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const CONTACT_BOOK = [
  "brand@notion.com",
  "automation-pod@breakagency.com",
  "finance@breakagency.com",
  "legal@breakagency.com",
  "mo@thebreakco.com",
  "lila@thebreakco.com"
];

const INITIAL_APPROVALS = [
  {
    id: createId(),
    title: "Creator residency NYC",
    type: "Contract",
    submittedBy: "brand@notion.com",
    status: "Needs approval",
    owner: "Mo Al Ghazi",
    contact: "brand@notion.com",
    notes: "Confirm exclusivity terms with brand partner.",
    attachments: ["Residency_contract_v2.pdf"]
  },
  {
    id: createId(),
    title: "Q3 launch campaign brief",
    type: "Brief",
    submittedBy: "automation-pod@breakagency.com",
    status: "Legal review",
    owner: "Break Automation Pod",
    contact: "automation-pod@breakagency.com",
    notes: "Awaiting compliance sign-off for AI usage terms.",
    attachments: ["Q3_brief.docx"]
  },
  {
    id: createId(),
    title: "Payment batch #248",
    type: "Finance",
    submittedBy: "finance@breakagency.com",
    status: "Ready for payout",
    owner: "Finance Desk",
    contact: "finance@breakagency.com",
    notes: "Payout creators in GBP once brand wire confirms.",
    attachments: ["Batch_248.csv"]
  }
];

export function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);
  const [formState, setFormState] = useState(null);

  const openModal = (approval) => {
    const payload =
      approval ||
      ({
        id: createId(),
        title: "",
        type: "Contract",
        submittedBy: "",
        status: "Needs approval",
        owner: "",
        contact: "",
        notes: "",
        attachments: []
      });
    setActiveApproval(approval || null);
    setFormState(payload);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveApproval(null);
    setFormState(null);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttachmentAdd = () => {
    const value = window.prompt("Add attachment label (filename or link)");
    if (value) {
      setFormState((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), value]
      }));
    }
  };

  const handleAttachmentRemove = (item) => {
    setFormState((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((entry) => entry !== item) || []
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setApprovals((prev) => {
      const exists = prev.some((item) => item.id === formState.id);
      if (exists) {
        return prev.map((item) => (item.id === formState.id ? formState : item));
      }
      return [formState, ...prev];
    });
    closeModal();
  };

  const handleDelete = (id) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    closeModal();
  };

  return (
    <DashboardShell
      title="Approvals"
      subtitle="Review and clear anything that needs a human sign-off."
      navLinks={ADMIN_NAV_LINKS}
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => openModal(null)}
          className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
        >
          + New approval
        </button>
      </div>
      <section className="space-y-3">
        {approvals.map((approval) => (
          <article
            key={approval.id}
            className="cursor-pointer rounded-3xl border border-brand-black/10 bg-brand-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition hover:bg-brand-linen/40"
            onClick={() => openModal(approval)}
          >
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              {approval.type}
            </p>
            <h3 className="mt-2 font-display text-2xl uppercase">{approval.title || "Untitled"}</h3>
            <p className="text-sm text-brand-black/70">Submitted by {approval.submittedBy || "Unknown"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{approval.status}</Badge>
              {approval.owner ? <Badge tone="positive">{approval.owner}</Badge> : null}
              {approval.contact ? <Badge tone="neutral">{approval.contact}</Badge> : null}
            </div>
          </article>
        ))}
      </section>

      {modalOpen && formState ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[36px] border border-brand-black/15 bg-brand-white p-8 text-left text-brand-black shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-3xl uppercase">
                  {activeApproval ? "Edit approval" : "New approval"}
                </h3>
                <p className="text-sm text-brand-black/70">
                  Update the incoming request before issuing sign-off.
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
                  Type
                  <select
                    value={formState.type}
                    onChange={handleChange("type")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  >
                    {["Contract", "Brief", "Finance", "Support"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                  Submitted by (email)
                  <input
                    type="email"
                    value={formState.submittedBy}
                    onChange={handleChange("submittedBy")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                  Owner
                  <input
                    type="text"
                    value={formState.owner}
                    onChange={handleChange("owner")}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  />
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                Status
                <select
                  value={formState.status}
                  onChange={handleChange("status")}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                >
                  {["Needs approval", "Legal review", "Ready for payout", "In progress"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Associated contact</p>
                <ContactAutocomplete
                  options={CONTACT_BOOK}
                  value={formState.contact}
                  onSelect={(value) => setFormState((prev) => ({ ...prev, contact: value }))}
                />
              </div>
              <label className="text-xs uppercase tracking-[0.35em] text-brand-red">
                Notes
                <textarea
                  rows={4}
                  value={formState.notes}
                  onChange={handleChange("notes")}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </label>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Attachments</p>
                  <button
                    type="button"
                    onClick={handleAttachmentAdd}
                    className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70"
                  >
                    + Add attachment
                  </button>
                </div>
                {formState.attachments?.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                    {formState.attachments.map((item) => (
                      <li key={item} className="flex items-center justify-between rounded-2xl border border-brand-black/10 px-3 py-2">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleAttachmentRemove(item)}
                          className="text-xs uppercase tracking-[0.3em] text-brand-black/50"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-brand-black/50">No attachments uploaded.</p>
                )}
              </div>
              <div className="flex justify-between">
                {activeApproval ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(formState.id)}
                    className="rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-red"
                  >
                    Delete entry
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
                    {activeApproval ? "Save changes" : "Add approval"}
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
