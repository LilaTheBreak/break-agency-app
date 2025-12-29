import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ContactAutocomplete } from "../components/ContactAutocomplete.jsx";
import { FileUploadPanel } from "../components/FileUploadPanel.jsx";
import { apiFetch } from "../services/apiClient.js";

const CONTACT_BOOK = [
  "brand@notion.com",
  "automation-pod@breakagency.com",
  "finance@breakagency.com",
  "legal@breakagency.com",
  "mo@thebreakco.com",
  "lila@thebreakco.com"
];

export function AdminApprovalsPage({ session }) {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);
  const [formState, setFormState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Approval type counts from Approval model
  const [typeCounts, setTypeCounts] = useState({
    Content: 0,
    Finance: 0,
    Contract: 0,
    Brief: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (filterStatus) params.set("status", filterStatus);
        if (filterType) params.set("type", filterType);
        if (searchQuery) params.set("search", searchQuery);
        params.set("limit", "50");
        
        const response = await apiFetch(`/api/approvals?${params.toString()}`);
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Admin access required to view approvals");
          }
          throw new Error(`Failed to load approvals (${response.status})`);
        }
        
        const data = await response.json();
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
  }, [filterStatus, filterType, searchQuery]);

  // Calculate approval type counts from loaded approvals
  useEffect(() => {
    if (!loading && !error && Array.isArray(approvals)) {
      const counts = {
        Content: 0,
        Finance: 0,
        Contract: 0,
        Brief: 0
      };
      
      approvals.forEach(approval => {
        if (approval.status === "PENDING" && counts[approval.type] !== undefined) {
          counts[approval.type]++;
        }
      });
      
      setTypeCounts(counts);
    }
  }, [approvals, loading, error]);

  const APPROVAL_SECTIONS = [
    {
      title: "Content approvals",
      description: "Content pending approval from the Approval system.",
      count: typeCounts.Content,
      cta: "Filter content approvals",
      action: () => setFilterType("Content"),
      enabled: true
    },
    {
      title: "Finance approvals",
      description: "Financial items pending approval.",
      count: typeCounts.Finance,
      cta: "Filter finance approvals",
      action: () => setFilterType("Finance"),
      enabled: true
    },
    {
      title: "Contract approvals",
      description: "Contracts pending sign-off.",
      count: typeCounts.Contract,
      cta: "Filter contract approvals",
      action: () => setFilterType("Contract"),
      enabled: true
    },
    {
      title: "Brief approvals",
      description: "Briefs and campaigns pending approval.",
      count: typeCounts.Brief,
      cta: "Filter brief approvals",
      action: () => setFilterType("Brief"),
      enabled: true
    }
  ];

  const openModal = (approval) => {
    const payload =
      approval ||
      ({
        title: "",
        type: "Contract",
        submittedBy: "",
        status: "PENDING",
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
    
    if (!formState.type || !formState.title) {
      alert("Type and title are required");
      return;
    }

    try {
      setLoading(true);
      
      const method = activeApproval ? "PATCH" : "POST";
      const endpoint = activeApproval ? `/api/approvals/${formState.id}` : "/api/approvals";
      
      const response = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formState.type,
          title: formState.title,
          description: formState.notes || null,
          ownerId: formState.owner || null,
          attachments: formState.attachments || [],
          metadata: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to save approval");
      }

      const savedApproval = await response.json();
      
      // Update local state with server response
      setApprovals((prev) => {
        if (activeApproval) {
          return prev.map((item) => (item.id === savedApproval.id ? savedApproval : item));
        }
        return [savedApproval, ...prev];
      });
      
      closeModal();
      alert(activeApproval ? "Approval updated successfully" : "Approval created successfully");
    } catch (err) {
      console.error("Error saving approval:", err);
      alert(err.message || "Failed to save approval. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this approval entry? This cannot be undone.")) return;
    
    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/approvals/${id}`, { 
        method: "DELETE" 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete approval");
      }

      setApprovals((prev) => prev.filter((item) => item.id !== id));
      closeModal();
      alert("Approval deleted successfully");
    } catch (err) {
      console.error("Error deleting approval:", err);
      alert(err.message || "Failed to delete approval. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm("Approve this request? This will mark it as approved.")) return;
    
    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/approvals/${id}/approve`, { 
        method: "POST" 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to approve");
      }

      const updatedApproval = await response.json();
      
      // Update local state with server response
      setApprovals((prev) => 
        prev.map((item) => (item.id === updatedApproval.id ? updatedApproval : item))
      );
      
      closeModal();
      alert("Approval approved successfully");
    } catch (err) {
      console.error("Error approving:", err);
      alert(err.message || "Failed to approve. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this request? This will mark it as rejected.")) return;
    
    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/approvals/${id}/reject`, { 
        method: "POST" 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to reject");
      }

      const updatedApproval = await response.json();
      
      // Update local state with server response
      setApprovals((prev) => 
        prev.map((item) => (item.id === updatedApproval.id ? updatedApproval : item))
      );
      
      closeModal();
      alert("Approval rejected successfully");
    } catch (err) {
      console.error("Error rejecting:", err);
      alert(err.message || "Failed to reject. Please try again.");
    } finally {
      setLoading(false);
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
              
              {loading ? (
                <p className="mt-3 text-sm text-brand-black/50">Loading...</p>
              ) : error ? (
                <p className="mt-3 text-sm text-brand-red/70">Error loading approvals</p>
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

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] focus:border-brand-black focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] focus:border-brand-black focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="Contract">Contract</option>
          <option value="Brief">Brief</option>
          <option value="Finance">Finance</option>
          <option value="Content">Content</option>
          <option value="Support">Support</option>
        </select>

        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-full border border-brand-black/20 px-4 py-2 text-xs focus:border-brand-black focus:outline-none"
        />
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
          {approvals.map((approval) => {
            const statusMap = {
              PENDING: { label: "Pending", tone: "neutral" },
              APPROVED: { label: "Approved", tone: "positive" },
              REJECTED: { label: "Rejected", tone: "negative" }
            };
            const statusInfo = statusMap[approval.status] || { label: approval.status, tone: "neutral" };
            
            return (
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
                  Submitted by {approval.Requestor?.name || approval.submittedBy || "System"}
                </p>
                {approval.Approver && (
                  <p className="text-xs text-brand-black/50 mt-1">
                    {approval.status === "APPROVED" ? "Approved" : "Handled"} by {approval.Approver.name}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={statusInfo.tone}>
                    {statusInfo.label}
                  </Badge>
                  {approval.ownerId ? <Badge tone="positive">{approval.ownerId}</Badge> : null}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalOpen && formState ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[36px] border border-brand-black/15 bg-white p-8 text-left text-brand-black shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
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
                  disabled={activeApproval}
                >
                  {["PENDING", "APPROVED", "REJECTED"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {activeApproval && (
                  <p className="mt-1 text-xs text-brand-black/50">
                    Status is managed by approve/reject actions
                  </p>
                )}
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
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {activeApproval && formState.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(formState.id)}
                        disabled={loading}
                        className="rounded-full border border-green-600 bg-green-600 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(formState.id)}
                        disabled={loading}
                        className="rounded-full border border-brand-red bg-brand-red px-4 py-2 text-xs uppercase tracking-[0.35em] text-white hover:bg-brand-red/90 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {activeApproval && formState.status !== "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleDelete(formState.id)}
                      disabled={loading}
                      className="rounded-full border border-brand-red px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-red hover:bg-brand-red hover:text-white transition-colors disabled:opacity-50"
                    >
                      Delete entry
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.35em] hover:bg-brand-black hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  {formState.status === "PENDING" && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-full bg-brand-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-black/90 transition-colors disabled:opacity-50"
                    >
                      {activeApproval ? "Save changes" : "Add approval"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
