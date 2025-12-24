import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ContactAutocomplete } from "../components/ContactAutocomplete.jsx";
import { FileUploadPanel } from "../components/FileUploadPanel.jsx";
import { VersionHistoryCard } from "../components/VersionHistoryCard.jsx";
import { getPendingApprovals } from "../services/dashboardClient.js";
import { apiFetch } from "../services/apiClient.js";

const CONTACT_BOOK = [
  "brand@notion.com",
  "automation-pod@breakagency.com",
  "finance@breakagency.com",
  "legal@breakagency.com",
  "mo@thebreakco.com",
  "lila@thebreakco.com"
];

const createId = () => `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function AdminApprovalsPage({ session }) {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);
  const [formState, setFormState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real approval counts from backend
  const [contentCount, setContentCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [contractCount, setContractCount] = useState(0);
  const [briefCount, setBriefCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPendingApprovals();
        setApprovals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching approvals:", err);
        setError(err.message || "Could not load approvals");
        setApprovals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch real approval counts from various endpoints
  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoadingCounts(true);
        
        // Fetch content queue count
        try {
          const contentRes = await apiFetch("/api/queues?status=pending");
          if (contentRes.ok) {
            const contentType = contentRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const contentData = await contentRes.json();
              setContentCount(Array.isArray(contentData) ? contentData.length : 0);
            } else {
              console.warn("Content queue returned non-JSON response");
              setContentCount(0);
            }
          } else {
            console.warn("Content queue returned status:", contentRes.status);
            setContentCount(0);
          }
        } catch (err) {
          console.error("Could not fetch content count:", err);
          setContentCount(0);
        }

        // Fetch invoice count (unpaid/pending)
        try {
          const invoiceRes = await apiFetch("/api/admin/finance/invoices?status=Due");
          if (invoiceRes.ok) {
            const contentType = invoiceRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const invoiceData = await invoiceRes.json();
              setInvoiceCount(Array.isArray(invoiceData) ? invoiceData.length : 0);
            } else {
              console.warn("Invoice endpoint returned non-JSON response");
              setInvoiceCount(0);
            }
          } else {
            console.warn("Invoice endpoint returned status:", invoiceRes.status);
            setInvoiceCount(0);
          }
        } catch (err) {
          console.error("Could not fetch invoice count:", err);
          setInvoiceCount(0);
        }

        // Fetch contract count (unsigned)
        try {
          const contractRes = await apiFetch("/api/contracts?status=pending");
          if (contractRes.ok) {
            const contentType = contractRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const contractData = await contractRes.json();
              setContractCount(Array.isArray(contractData) ? contractData.length : 0);
            } else {
              console.warn("Contract endpoint returned non-JSON response");
              setContractCount(0);
            }
          } else {
            console.warn("Contract endpoint returned status:", contractRes.status);
            setContractCount(0);
          }
        } catch (err) {
          console.error("Could not fetch contract count:", err);
          setContractCount(0);
        }

        // Fetch brief count (draft/review)
        try {
          const briefRes = await apiFetch("/api/briefs?status=draft");
          if (briefRes.ok) {
            const contentType = briefRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const briefData = await briefRes.json();
              setBriefCount(Array.isArray(briefData) ? briefData.length : 0);
            } else {
              console.warn("Brief endpoint returned non-JSON response");
              setBriefCount(0);
            }
          } else {
            console.warn("Brief endpoint returned status:", briefRes.status);
            setBriefCount(0);
          }
        } catch (err) {
          console.error("Could not fetch brief count:", err);
          setBriefCount(0);
        }
      } catch (err) {
        console.error("Error fetching approval counts:", err);
      } finally {
        setLoadingCounts(false);
      }
    }
    fetchCounts();
  }, []);

  const APPROVAL_SECTIONS = [
    {
      title: "Content approvals",
      description: "Stills, cuts, and copy waiting for brand sign-off.",
      count: contentCount,
      cta: "Open content queue",
      action: () => navigate("/admin/queues"),
      enabled: true
    },
    {
      title: "Invoice approvals",
      description: "Invoices, payouts, and reconciliations needing finance review.",
      count: invoiceCount,
      cta: "Review invoices",
      action: () => navigate("/admin/finance"),
      enabled: true
    },
    {
      title: "Contract approvals",
      description: "Signed agreements, NDAs, and compliance docs tied to deals.",
      count: contractCount,
      cta: "Go to contracts",
      action: () => navigate("/admin/documents"),
      enabled: true
    },
    {
      title: "Campaign & brief approvals",
      description: "Briefs, scopes, and creative direction that need a go/no-go.",
      count: briefCount,
      cta: "Review briefs",
      action: () => navigate("/admin/campaigns"),
      enabled: true
    }
  ];

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      // Optimistically update UI
      setApprovals((prev) => {
        const exists = prev.some((item) => item.id === formState.id);
        if (exists) {
          return prev.map((item) => (item.id === formState.id ? formState : item));
        }
        return [formState, ...prev];
      });
      closeModal();

      // TODO: Send to backend when endpoint exists
      // await apiFetch("/api/approvals", {
      //   method: activeApproval ? "PATCH" : "POST",
      //   body: JSON.stringify(formState)
      // });
    } catch (err) {
      console.error("Error saving approval:", err);
      alert("Failed to save approval. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this approval entry? This cannot be undone.")) return;
    
    try {
      setApprovals((prev) => prev.filter((item) => item.id !== id));
      closeModal();

      // TODO: Send to backend when endpoint exists
      // await apiFetch(`/api/approvals/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting approval:", err);
      alert("Failed to delete approval. Please try again.");
    }
  };

  return (
    <DashboardShell
      title="Approvals"
      subtitle="Review and clear anything that needs a human sign-off."
      navLinks={ADMIN_NAV_LINKS}
    >
      <FileUploadPanel
        session={session}
        folder="admin-contracts"
        title="Contract attachments"
        description="Store signed contracts, NDAs, and compliance docs tied to approvals."
      />
      
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        {APPROVAL_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="flex h-full flex-col justify-between rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
          >
            <div className="space-y-2">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                {section.title}
              </p>
              <p className="text-sm text-brand-black/70">{section.description}</p>
              
              {loadingCounts ? (
                <p className="mt-3 text-sm text-brand-black/50">Loading...</p>
              ) : section.count === 0 ? (
                <p className="mt-3 text-sm text-brand-black/50">No approvals pending</p>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-red/10 text-sm font-semibold text-brand-red">
                    {section.count}
                  </span>
                  <span className="text-sm text-brand-black/70">
                    {section.count === 1 ? "item pending" : "items pending"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={section.action}
                disabled={!section.enabled}
                className="rounded-full border border-brand-black px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {section.cta}
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-6 mb-4 flex items-center justify-between">
        <h2 className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          All approval requests
        </h2>
        <button
          type="button"
          onClick={() => openModal(null)}
          className="rounded-full border border-brand-black px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-white transition-colors"
        >
          + New approval
        </button>
      </div>

      {loading && (
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-center">
          <p className="text-sm text-brand-black/60">Loading approvals...</p>
        </div>
      )}
      
      {error && (
        <div className="rounded-3xl border border-brand-red/20 bg-brand-red/5 p-6 text-center">
          <p className="text-sm text-brand-red">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-red hover:bg-brand-red hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && approvals.length === 0 && (
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-8 text-center">
          <p className="text-sm text-brand-black/70">No approval requests yet.</p>
          <p className="mt-1 text-xs text-brand-black/50">
            Create a new approval or wait for pending items to appear from other workflows.
          </p>
        </div>
      )}
      
      {!loading && !error && approvals.length > 0 && (
        <section className="space-y-3">
          {approvals.map((approval) => (
            <article
              key={approval.id}
              className="cursor-pointer rounded-3xl border border-brand-black/10 bg-brand-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition hover:bg-brand-linen/40"
              onClick={() => openModal(approval)}
            >
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                {approval.type || "General"}
              </p>
              <h3 className="mt-2 font-display text-2xl uppercase">{approval.title || "Untitled"}</h3>
              <p className="text-sm text-brand-black/70">
                Submitted by {approval.requestor?.name || approval.submittedBy || "System"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={approval.status === "Approved" ? "positive" : "neutral"}>
                  {approval.status || "Pending"}
                </Badge>
                {approval.owner ? <Badge tone="positive">{approval.owner}</Badge> : null}
              </div>
            </article>
          ))}
        </section>
      )}

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
                className="text-xs uppercase tracking-[0.35em] text-brand-black/60 hover:text-brand-black"
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
                    {["Contract", "Brief", "Finance", "Content", "Support"].map((option) => (
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
                  {["Needs approval", "Approved", "Rejected", "In review", "Escalated"].map((item) => (
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
                    className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70 hover:text-brand-black"
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
                          className="text-xs uppercase tracking-[0.3em] text-brand-black/50 hover:text-brand-red"
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
              <VersionHistoryCard
                session={session}
                briefId={formState.id}
                data={formState}
                allowCreate
                allowRestore
              />
              <div className="flex justify-between">
                {activeApproval ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(formState.id)}
                    className="rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-red hover:bg-brand-red hover:text-white transition-colors"
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
                    className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.35em] hover:bg-brand-black hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90 transition-colors"
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
