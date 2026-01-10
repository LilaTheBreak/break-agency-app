import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Mail,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Flag,
  Upload,
  Download,
  Trash2,
  Clock,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Professional Deal Management Panel
 * Replaces the basic Edit Deal modal with a comprehensive deal management interface
 * 
 * Sections:
 * 1. Core Deal Details
 * 2. Financials & Payment
 * 3. Documents & Assets
 * 4. Email & Communication
 * 5. Internal Notes & Activity Log
 */
export function DealManagementPanel({
  deal,
  isOpen,
  onClose,
  onSave,
  talent,
  userRole = "admin",
}) {
  // Core state
  const [form, setForm] = useState({
    dealName: "",
    brandId: "",
    stage: "",
    dealType: "Campaign",
    dealOwner: "",
    priority: "Normal",
    value: "",
    currency: "GBP",
    paymentStructure: "One-off",
    expectedClose: "",
    invoiceStatus: "Unpaid",
    notes: "",
  });

  const [documents, setDocuments] = useState([]);
  const [emails, setEmails] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [internalNotes, setInternalNotes] = useState("");
  const [newNote, setNewNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [uploadingFile, setUploadingFile] = useState(false);

  const isReadOnly = userRole !== "admin";

  // Initialize form when deal opens
  useEffect(() => {
    if (!isOpen || !deal?.id) {
      setForm({
        dealName: "",
        brandId: "",
        stage: "",
        dealType: "Campaign",
        dealOwner: "",
        priority: "Normal",
        value: "",
        currency: "GBP",
        paymentStructure: "One-off",
        expectedClose: "",
        invoiceStatus: "Unpaid",
        notes: "",
      });
      return;
    }

    setError(null);
    loadDealData();
  }, [isOpen, deal?.id]);

  const loadDealData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/deals/${deal.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Deal not found");
        }
        throw new Error("Failed to load deal details");
      }

      const dealData = await response.json();

      setForm({
        dealName: dealData.dealName || dealData.name || "",
        brandId: dealData.brandId || "",
        stage: dealData.stage || "",
        dealType: dealData.dealType || "Campaign",
        dealOwner: dealData.dealOwner || "",
        priority: dealData.priority || "Normal",
        value: dealData.value ? (dealData.value / 1000).toString() : "",
        currency: dealData.currency || "GBP",
        paymentStructure: dealData.paymentStructure || "One-off",
        expectedClose: dealData.expectedClose
          ? new Date(dealData.expectedClose).toISOString().split("T")[0]
          : "",
        invoiceStatus: dealData.invoiceStatus || "Unpaid",
        notes: dealData.notes || "",
      });

      // Load related data
      await Promise.all([
        loadDocuments(deal.id),
        loadEmails(deal.id),
        loadActivityLog(deal.id),
      ]);
    } catch (err) {
      console.error("[DEAL_PANEL] Load error:", err);
      setError(
        err.message === "Deal not found"
          ? "This deal no longer exists"
          : "Failed to load deal. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (dealId) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      }
    } catch (err) {
      console.error("[DOCUMENTS] Load error:", err);
    }
  };

  const loadEmails = async (dealId) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/emails`);
      if (response.ok) {
        const data = await response.json();
        setEmails(Array.isArray(data) ? data : data.emails || []);
      }
    } catch (err) {
      console.error("[EMAILS] Load error:", err);
    }
  };

  const loadActivityLog = async (dealId) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivityLog(Array.isArray(data) ? data : data.activity || []);
      }
    } catch (err) {
      console.error("[ACTIVITY] Load error:", err);
    }
  };

  const handleSave = async () => {
    if (!form.dealName.trim()) {
      setError("Deal name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        dealName: form.dealName,
        brandId: form.brandId,
        stage: form.stage,
        dealType: form.dealType,
        dealOwner: form.dealOwner,
        priority: form.priority,
        value: form.value ? parseFloat(form.value) * 1000 : 0,
        currency: form.currency,
        paymentStructure: form.paymentStructure,
        expectedClose: form.expectedClose || null,
        invoiceStatus: form.invoiceStatus,
        notes: form.notes,
      };

      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save deal");
      }

      toast.success("Deal updated successfully");
      if (onSave) await onSave();
      onClose();
    } catch (err) {
      console.error("[SAVE] Error:", err);
      setError(err.message || "Failed to save changes");
      toast.error("Failed to save deal");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (file) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOCX, PNG, and JPG files are allowed");
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dealId", deal.id);

      const response = await fetch(`/api/deals/${deal.id}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      toast.success("Document uploaded");
      await loadDocuments(deal.id);
    } catch (err) {
      console.error("[UPLOAD] Error:", err);
      toast.error("Failed to upload document");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      const response = await fetch(`/api/deals/${deal.id}/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Document deleted");
      await loadDocuments(deal.id);
    } catch (err) {
      console.error("[DELETE] Error:", err);
      toast.error("Failed to delete document");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/deals/${deal.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      setNewNote("");
      toast.success("Note added");
      await loadActivityLog(deal.id);
    } catch (err) {
      console.error("[NOTE] Error:", err);
      toast.error("Failed to add note");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end lg:items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Main Panel Container */}
      <div className="bg-brand-white rounded-2xl border border-brand-black/10 w-full lg:max-w-4xl max-h-[95vh] flex flex-col shadow-xl animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="border-b border-brand-black/5 px-6 lg:px-8 py-5 flex items-center justify-between bg-gradient-to-r from-brand-white to-brand-linen/20">
          <div>
            <h1 className="text-xl lg:text-2xl font-subtitle uppercase tracking-[0.35em] text-brand-black">
              Deal Management
            </h1>
            <p className="text-xs text-brand-black/50 mt-1">
              {talent?.name} • {form.dealName || "Untitled Deal"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-brand-black/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 lg:mx-8 rounded-lg border border-orange-200 bg-orange-50 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900">{error}</p>
              <button
                onClick={loadDealData}
                className="text-xs text-orange-700 hover:text-orange-900 font-semibold mt-1"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && activeTab === "details" ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 border-2 border-brand-black/10 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-brand-black/60">Loading deal details...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-brand-black/5 px-6 lg:px-8 flex overflow-x-auto">
              {[
                { id: "details", label: "Details", icon: FileText },
                { id: "financial", label: "Financial", icon: DollarSign },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "emails", label: "Emails", icon: Mail },
                { id: "notes", label: "Activity", icon: Clock },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === id
                      ? "border-brand-red text-brand-red"
                      : "border-transparent text-brand-black/50 hover:text-brand-black"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* DETAILS TAB */}
              {activeTab === "details" && (
                <div className="p-6 lg:p-8 space-y-6">
                  {/* Core Deal Details Section */}
                  <div>
                    <h2 className="text-sm font-subtitle uppercase tracking-[0.3em] text-brand-black/70 mb-4">
                      Core Deal Details
                    </h2>
                    <div className="space-y-4 bg-brand-linen/20 rounded-lg p-4">
                      {/* Deal Name */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                          Deal Name *
                        </label>
                        <input
                          type="text"
                          value={form.dealName}
                          onChange={(e) =>
                            setForm({ ...form, dealName: e.target.value })
                          }
                          disabled={isReadOnly}
                          placeholder="e.g., Instagram Collab Q1 2026"
                          className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 disabled:bg-brand-black/5 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Brand & Deal Type */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Brand
                          </label>
                          <select
                            value={form.brandId}
                            onChange={(e) =>
                              setForm({ ...form, brandId: e.target.value })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="">Select brand...</option>
                            <option value="brand1">Brand 1</option>
                            <option value="brand2">Brand 2</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Deal Type
                          </label>
                          <select
                            value={form.dealType}
                            onChange={(e) =>
                              setForm({ ...form, dealType: e.target.value })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="Campaign">Campaign</option>
                            <option value="Ambassador">Ambassador</option>
                            <option value="Gifting">Gifting</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Stage & Priority */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Stage
                          </label>
                          <select
                            value={form.stage}
                            onChange={(e) =>
                              setForm({ ...form, stage: e.target.value })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="">Select stage...</option>
                            <option value="NEW_LEAD">In Discussion</option>
                            <option value="NEGOTIATION">Negotiation</option>
                            <option value="CONTRACT_SENT">Contract Sent</option>
                            <option value="CONTRACT_SIGNED">Contract Signed</option>
                            <option value="DELIVERABLES_IN_PROGRESS">Active</option>
                            <option value="PAYMENT_PENDING">Payment Pending</option>
                            <option value="COMPLETED">Completed Won</option>
                            <option value="LOST">Closed Lost</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Priority
                          </label>
                          <select
                            value={form.priority}
                            onChange={(e) =>
                              setForm({ ...form, priority: e.target.value })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>

                      {/* Deal Owner */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                          Deal Owner
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-black/10 bg-brand-white text-sm text-brand-black/70">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{talent?.name || "Unassigned"}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                          Deal Notes
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                          disabled={isReadOnly}
                          placeholder="Add any additional context or requirements..."
                          rows={3}
                          className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FINANCIAL TAB */}
              {activeTab === "financial" && (
                <div className="p-6 lg:p-8 space-y-6">
                  <div>
                    <h2 className="text-sm font-subtitle uppercase tracking-[0.3em] text-brand-black/70 mb-4">
                      Financials & Payment
                    </h2>
                    <div className="space-y-4 bg-brand-linen/20 rounded-lg p-4">
                      {/* Value & Currency */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Deal Value
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-brand-black/60 font-medium">
                              {form.currency}
                            </span>
                            <input
                              type="number"
                              value={form.value}
                              onChange={(e) =>
                                setForm({ ...form, value: e.target.value })
                              }
                              disabled={isReadOnly}
                              placeholder="50.5"
                              step="0.1"
                              className="flex-1 rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                            />
                            <span className="text-sm text-brand-black/60">k</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Currency
                          </label>
                          <select
                            value={form.currency}
                            onChange={(e) =>
                              setForm({ ...form, currency: e.target.value })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="GBP">GBP (£)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="AUD">AUD (A$)</option>
                            <option value="CAD">CAD (C$)</option>
                          </select>
                        </div>
                      </div>

                      {/* Payment Structure & Status */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Payment Structure
                          </label>
                          <select
                            value={form.paymentStructure}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                paymentStructure: e.target.value,
                              })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="One-off">One-off</option>
                            <option value="Split">Split Payments</option>
                            <option value="Milestone">Milestone-based</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                            Invoice Status
                          </label>
                          <select
                            value={form.invoiceStatus}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                invoiceStatus: e.target.value,
                              })
                            }
                            disabled={isReadOnly}
                            className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Partial">Partial Payment</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                      </div>

                      {/* Expected Close Date */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                          Expected Close Date
                        </label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-black/40" />
                          <input
                            type="date"
                            value={form.expectedClose}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                expectedClose: e.target.value,
                              })
                            }
                            disabled={isReadOnly}
                            className="flex-1 rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-brand-black/5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === "documents" && (
                <div className="p-6 lg:p-8 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-subtitle uppercase tracking-[0.3em] text-brand-black/70">
                        Documents & Assets
                      </h2>
                      {!isReadOnly && (
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-black/10 hover:bg-brand-black/5 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                            Upload
                          </span>
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadDocument(e.target.files[0]);
                              }
                            }}
                            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                            disabled={uploadingFile}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-brand-black/5 hover:bg-brand-black/2 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-brand-red flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-brand-black truncate">
                                  {doc.filename}
                                </p>
                                <p className="text-xs text-brand-black/50">
                                  {doc.uploadedBy} • {doc.uploadedAt && new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-brand-black/5 rounded transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-brand-black/10 rounded-lg">
                        <FileText className="w-8 h-8 text-brand-black/20 mx-auto mb-2" />
                        <p className="text-sm text-brand-black/50">
                          No documents yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EMAILS TAB */}
              {activeTab === "emails" && (
                <div className="p-6 lg:p-8 space-y-6">
                  <div>
                    <h2 className="text-sm font-subtitle uppercase tracking-[0.3em] text-brand-black/70 mb-4">
                      Email & Communication
                    </h2>

                    {emails.length > 0 ? (
                      <div className="space-y-3">
                        {emails.map((email) => (
                          <div
                            key={email.id}
                            className="p-4 rounded-lg border border-brand-black/5 hover:bg-brand-black/2 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Mail className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-brand-black">
                                  {email.subject}
                                </p>
                                <p className="text-xs text-brand-black/50 mt-1">
                                  {email.participants?.join(", ")}
                                </p>
                                <p className="text-xs text-brand-black/40 mt-0.5">
                                  {email.date && new Date(email.date).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-brand-black/10 rounded-lg">
                        <Mail className="w-8 h-8 text-brand-black/20 mx-auto mb-2" />
                        <p className="text-sm text-brand-black/50">
                          No emails linked yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NOTES & ACTIVITY TAB */}
              {activeTab === "notes" && (
                <div className="p-6 lg:p-8 space-y-6">
                  {/* Add Note */}
                  {!isReadOnly && (
                    <div className="bg-brand-linen/20 rounded-lg p-4">
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                        Add Internal Note
                      </label>
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note visible only to admins..."
                        rows={2}
                        className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none mb-3"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="w-full rounded-lg bg-brand-red text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-brand-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Post Note
                      </button>
                    </div>
                  )}

                  {/* Activity Log */}
                  <div>
                    <h2 className="text-sm font-subtitle uppercase tracking-[0.3em] text-brand-black/70 mb-4">
                      Activity Timeline
                    </h2>

                    {activityLog.length > 0 ? (
                      <div className="space-y-3">
                        {activityLog.map((activity, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-brand-red mt-2" />
                              {idx < activityLog.length - 1 && (
                                <div className="w-0.5 h-12 bg-brand-black/10 my-1" />
                              )}
                            </div>
                            <div className="pb-4">
                              <p className="text-sm font-medium text-brand-black">
                                {activity.action}
                              </p>
                              <p className="text-xs text-brand-black/50 mt-1">
                                {activity.actor} • {activity.timestamp && new Date(activity.timestamp).toLocaleString()}
                              </p>
                              {activity.content && (
                                <p className="text-sm text-brand-black/70 mt-2 bg-brand-linen/30 rounded p-2">
                                  {activity.content}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-brand-black/10 rounded-lg">
                        <Clock className="w-8 h-8 text-brand-black/20 mx-auto mb-2" />
                        <p className="text-sm text-brand-black/50">
                          No activity yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer / Actions */}
        {!error && !loading && (
          <div className="border-t border-brand-black/5 px-6 lg:px-8 py-4 flex justify-end gap-3 bg-brand-linen/10">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border border-brand-black/10 bg-brand-white text-xs font-semibold uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={loading || !form.dealName.trim()}
                className="px-6 py-2.5 rounded-lg bg-brand-red text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DealManagementPanel;
