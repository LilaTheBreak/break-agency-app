import React, { useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const FINANCE_SUMMARY = [
  { label: "Payouts pending", value: "£94k", detail: "Across 12 creators" },
  { label: "Invoices due", value: "8", detail: "Awaiting brand payment" },
  { label: "Reconciled this week", value: "£120k", detail: "All cleared" }
];

const DETAILS = [
  {
    title: "Payouts pending",
    rows: [
      { label: "Creator Residency NYC", amount: "£48k", status: "Needs bank confirmation" },
      { label: "UGC retainer batch", amount: "£23k", status: "Clears Friday" },
      { label: "Concierge pipeline", amount: "£9k", status: "Waiting on brand sign-off" }
    ]
  },
  {
    title: "Invoices due",
    rows: [
      { label: "Brand X Q3 retainer", amount: "£18k", status: "Overdue · 5 days" },
      { label: "Retail capsule tour", amount: "£12k", status: "Due tomorrow" }
    ]
  },
  {
    title: "Awaiting brand payment",
    rows: [
      { label: "Hospitality residency", amount: "£34k", status: "Wire initiated" },
      { label: "Creator CFO toolkit", amount: "£4k", status: "Pending PO" }
    ]
  },
  {
    title: "Reconciled this week",
    rows: [
      { label: "Exclusive talent bonus", amount: "£15k", status: "Cleared" },
      { label: "Paid media uplift", amount: "£11k", status: "Cleared" }
    ]
  }
];

export function AdminFinancePage() {
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalData, setModalData] = useState({ label: "", amount: "", status: "" });
  const [addModal, setAddModal] = useState(null);
  const [detailsData, setDetailsData] = useState(DETAILS);

  const closeModal = () => {
    setEditingEntry(null);
    setModalData({ label: "", amount: "", status: "" });
  };

  const handleEdit = (panelTitle, row) => {
    setEditingEntry({ panelTitle, row });
    setModalData({ label: row.label, amount: row.amount, status: row.status });
  };

  const handleAdd = (panelTitle) => {
    setAddModal({ panelTitle, form: { label: "", amount: "", status: "" } });
  };

  const handleSaveNew = (event) => {
    event.preventDefault();
    if (!addModal) return;
    setDetailsData((prev) =>
      prev.map((panel) =>
        panel.title === addModal.panelTitle
          ? {
              ...panel,
              rows: [...panel.rows, { ...addModal.form, label: addModal.form.label || "New entry" }]
            }
          : panel
      )
    );
    setAddModal(null);
  };

  const modalVisible = Boolean(editingEntry || addModal);
  const modalHeader = editingEntry ? "Edit entry" : "Add new entry";

  return (
    <DashboardShell
      title="Finance"
      subtitle="Track payouts, invoicing, and reconciliation tasks."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {FINANCE_SUMMARY.map((tile) => (
          <div key={tile.label} className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{tile.label}</p>
            <p className="mt-2 font-display text-4xl uppercase text-brand-black">{tile.value}</p>
            <p className="text-sm text-brand-black/60">{tile.detail}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {detailsData.map((panel) => (
          <article key={panel.title} className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              {panel.title}
            </p>
            <button
              className="mt-2 rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
              onClick={() => handleAdd(panel.title)}
            >
              Add new
            </button>
            <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
              {panel.rows.map((row) => (
                <li key={row.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-black">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span>{row.amount}</span>
                      <button
                        className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em]"
                        onClick={() => handleEdit(panel.title, row)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-brand-black/60">{row.status}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6 text-left">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Next actions</p>
        <ul className="mt-4 space-y-3 text-sm text-brand-black/80">
          <li>• Trigger payouts for “Creator Residency NYC” once final approvals clear.</li>
          <li>• Follow up with brand@client.com on overdue invoice #447.</li>
          <li>• Sync finance ledger with CRM before Friday recap call.</li>
        </ul>
      </section>

      {modalVisible && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-[36px] border border-brand-black/15 bg-brand-white p-8 text-left text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <h3 className="font-display text-3xl uppercase">{modalHeader}</h3>
            <p className="text-sm text-brand-black/70">
              {(editingEntry && editingEntry.panelTitle) || addModal?.panelTitle}
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={editingEntry ? (e) => e.preventDefault() : handleSaveNew}
            >
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Label
              </label>
              <input
                value={(editingEntry ? modalData.label : addModal?.form.label) || ""}
                onChange={(e) =>
                  editingEntry
                    ? setModalData((prev) => ({ ...prev, label: e.target.value }))
                    : setAddModal((prev) => ({ ...prev, form: { ...prev.form, label: e.target.value } }))
                }
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Amount
              </label>
              <input
                value={(editingEntry ? modalData.amount : addModal?.form.amount) || ""}
                onChange={(e) =>
                  editingEntry
                    ? setModalData((prev) => ({ ...prev, amount: e.target.value }))
                    : setAddModal((prev) => ({ ...prev, form: { ...prev.form, amount: e.target.value } }))
                }
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Status
              </label>
              <textarea
                rows={2}
                value={(editingEntry ? modalData.status : addModal?.form.status) || ""}
                onChange={(e) =>
                  editingEntry
                    ? setModalData((prev) => ({ ...prev, status: e.target.value }))
                    : setAddModal((prev) => ({ ...prev, form: { ...prev.form, status: e.target.value } }))
                }
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Upload supporting docs
              </label>
              <input type="file" className="w-full text-sm" multiple />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    setAddModal(null);
                  }}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
