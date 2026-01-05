import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { fetchTalents, deleteTalent } from "../services/crmClient.js";
import { Badge } from "../components/Badge.jsx";
import { Plus, User, UserX, Search, Filter, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { normalizeApiArray } from "../lib/dataNormalization.js";

const REPRESENTATION_TYPES = [
  { value: "EXCLUSIVE", label: "Exclusive", color: "bg-brand-red text-white" },
  { value: "NON_EXCLUSIVE", label: "Non-Exclusive", color: "bg-brand-black/10 text-brand-black" },
  { value: "FRIEND_OF_HOUSE", label: "Friends of House", color: "bg-purple-100 text-purple-700" },
  { value: "UGC", label: "UGC", color: "bg-blue-100 text-blue-700" },
  { value: "FOUNDER", label: "Founder", color: "bg-green-100 text-green-700" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-green-500" },
  { value: "PAUSED", label: "Paused", color: "bg-yellow-500" },
  { value: "ARCHIVED", label: "Archived", color: "bg-gray-400" },
];

function RepresentationBadge({ type }) {
  const repType = REPRESENTATION_TYPES.find((t) => t.value === type) || REPRESENTATION_TYPES[1];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${repType.color}`}>
      {repType.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${statusOption.color}`} />
      <span className="text-xs uppercase tracking-[0.2em]">{statusOption.label}</span>
    </div>
  );
}

function Avatar({ user, name, size = "w-10 h-10" }) {
  const initials = useMemo(() => {
    const displayName = user?.name || name || "?";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name, name]);

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || name}
        className={`${size} rounded-full object-cover border border-brand-black/10`}
      />
    );
  }

  return (
    <div className={`${size} rounded-full bg-brand-red/10 flex items-center justify-center border border-brand-black/10`}>
      <span className="text-xs font-semibold text-brand-red">{initials}</span>
    </div>
  );
}

function SocialHandle({ handle, platform }) {
  if (!handle) return null;
  
  const platformIcon = {
    INSTAGRAM: "📷",
    TIKTOK: "🎵",
    YOUTUBE: "▶️",
    X: "🐦",
  }[platform] || "@";
  
  return (
    <span className="text-xs text-brand-black/60 flex items-center gap-1">
      <span>{platformIcon}</span>
      <span>@{handle}</span>
    </span>
  );
}

function AddTalentModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    displayName: "",
    legalName: "",
    primaryEmail: "",
    representationType: "NON_EXCLUSIVE",
    status: "ACTIVE",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!formData.displayName || !formData.displayName.trim()) {
      setError("Display name is required");
      setSaving(false);
      return;
    }

    if (formData.primaryEmail && formData.primaryEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.primaryEmail.trim())) {
        setError("Please enter a valid email address");
        setSaving(false);
        return;
      }
    }

    try {
      const response = await apiFetch("/api/admin/talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to create talent (${response.status})`);
      }

      toast.success("Talent created successfully");
      await new Promise(resolve => setTimeout(resolve, 1000));
      await onSuccess();
      // Broadcast creation event to other pages/components
      window.dispatchEvent(new CustomEvent('talent-created', { detail: { talentId: result.id } }));
      onClose();
      setFormData({
        displayName: "",
        legalName: "",
        primaryEmail: "",
        representationType: "NON_EXCLUSIVE",
        status: "ACTIVE",
        notes: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create talent");
      toast.error(err.message || "Failed to create talent");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-[720px] rounded-[36px] border border-brand-black/15 bg-brand-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-brand-black/10 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-3xl uppercase text-brand-black">Create Talent Record</h3>
              <p className="mt-2 text-sm text-brand-black/70">
                Add a new talent profile to manage representation and relationships
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/60 hover:bg-brand-black/5"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-8 py-6">
          <form id="add-talent-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-brand-red/20 bg-brand-red/10 p-4 text-sm text-brand-red">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Display Name *
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
                placeholder="Talent display name"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="legalName" className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Legal Name
                </label>
                <input
                  id="legalName"
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label htmlFor="primaryEmail" className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Primary Email
                </label>
                <input
                  id="primaryEmail"
                  type="email"
                  value={formData.primaryEmail}
                  onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
                  placeholder="Optional - link to existing user"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="representationType" className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Representation Type
                </label>
                <select
                  id="representationType"
                  value={formData.representationType}
                  onChange={(e) => setFormData({ ...formData, representationType: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
                >
                  {REPRESENTATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Internal Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10 resize-none"
                placeholder="Optional internal notes"
              />
            </div>
          </form>
        </div>

        <div className="border-t border-brand-black/10 px-8 py-6 bg-brand-white">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-black/20 px-6 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-talent-form"
              disabled={saving}
              className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Talent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTalentPage() {
  const navigate = useNavigate();
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // CRITICAL FIX: Renamed to avoid shadowing imported fetchTalents
  // The local function was calling itself recursively, causing infinite loop
  // Root cause: Variable shadowing - local fetchTalents shadowed imported fetchTalents
  const loadTalents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      console.log('[TALENT] loadTalents called - fetching from API');
      const data = await fetchTalents(); // Now correctly calls imported function from crmClient
      const talentsArray = normalizeApiArray(data, 'talents');
      setTalents(talentsArray);
      console.log('[TALENT] Successfully loaded', talentsArray.length, 'talents');
    } catch (err) {
      console.error("[TALENT] Error fetching talent:", {
        message: err?.message,
        status: err?.status,
        response: err?.response,
      });
      const errorMessage = err?.message || "Failed to load talent";
      setError(errorMessage);
      setTalents([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - only fetch once on mount

  const handleDeleteTalent = async (talentId, talentName) => {
    if (!confirm(`Are you sure you want to delete "${talentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('[TALENT] Attempting to delete talent:', talentId);
      await deleteTalent(talentId);
      console.log('[TALENT] Talent deleted successfully:', talentId);
      toast.success("Talent deleted successfully");
      // Remove talent from local state immediately (don't refetch)
      setTalents(prev => prev.filter(t => t.id !== talentId));
      // Broadcast deletion event to other pages/components
      window.dispatchEvent(new CustomEvent('talent-deleted', { detail: { talentId } }));
      // Note: If user is on detail page, they should be redirected
      // This is handled by the detail page's error handling
    } catch (err) {
      console.error("[TALENT] Error deleting talent:", {
        message: err?.message,
        status: err?.status,
        response: err?.response,
        fullError: err,
      });
      const errorMessage = err?.message || "Failed to delete talent";
      
      // Handle specific error cases
      if (err?.status === 409 || errorMessage.includes("CONFLICT")) {
        toast.error("Cannot delete talent: Related deals or tasks exist. Please remove them first.");
      } else if (err?.status === 404 || errorMessage.includes("NOT_FOUND")) {
        toast.error("Talent not found. It may have already been deleted.");
        // Remove from local state anyway to ensure UI is in sync
        setTalents(prev => prev.filter(t => t.id !== talentId));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  useEffect(() => {
    loadTalents(); // Use renamed function
  }, [loadTalents]);

  const filteredTalents = useMemo(() => {
    return talents.filter((talent) => {
      const matchesSearch = !searchQuery || 
        (talent.displayName || talent.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (talent.linkedUser?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (talent.primarySocialHandle || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || (talent.status || "ACTIVE") === statusFilter;
      const matchesType = typeFilter === "ALL" || (talent.representationType || "NON_EXCLUSIVE") === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [talents, searchQuery, statusFilter, typeFilter]);

  const handleRowClick = (talentId) => {
    navigate(`/admin/talent/${talentId}`);
  };

  return (
    <DashboardShell
      title="Talent Management"
      subtitle="Manage all talent records, representation types, and relationships"
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Header with filters and add button */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-black/60">
              {filteredTalents.length} {filteredTalents.length === 1 ? "talent" : "talents"}
              {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" ? ` (filtered from ${talents.length})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Talent
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-black/40" />
            <input
              type="text"
              placeholder="Search by name, email, or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-brand-black/10 bg-brand-white text-sm focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
          >
            <option value="ALL">All Types</option>
            {REPRESENTATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-center">
          <p className="text-brand-black/60">Loading talent...</p>
        </section>
      )}

      {/* Error State */}
      {error && !loading && (
        <section className="rounded-3xl border border-brand-red/20 bg-brand-red/10 p-8 text-center">
          <p className="text-brand-red">{error}</p>
        </section>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTalents.length === 0 && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-black/10 bg-brand-linen/50">
            <User className="h-8 w-8 text-brand-black/40" />
          </div>
          <h3 className="font-display text-xl uppercase mb-2">
            {talents.length === 0 ? "No talent yet" : "No matching talent"}
          </h3>
          <p className="text-sm text-brand-black/60 mb-6">
            {talents.length === 0 
              ? "Create your first talent record to start managing representation and relationships."
              : "Try adjusting your search or filters."}
          </p>
          {talents.length === 0 && (
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black"
            >
              <Plus className="inline h-4 w-4 mr-2" />
              Add New Talent
            </button>
          )}
        </section>
      )}

      {/* Talent Table - Responsive Grid Layout */}
      {!loading && !error && filteredTalents.length > 0 && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-brand-white border-b border-brand-black/10">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">
                    Talent
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">
                    Linked User
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">
                    Metrics
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTalents.map((talent) => (
                  <tr
                    key={talent.id}
                    className="hover:bg-brand-black/5 transition-colors border-b border-brand-black/5"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={talent.linkedUser} name={talent.displayName || talent.name} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-brand-black truncate">
                            {talent.displayName || talent.name}
                          </div>
                          {talent.primarySocialHandle && (
                            <SocialHandle 
                              handle={talent.primarySocialHandle} 
                              platform={talent.socialAccounts?.find(s => s.handle === talent.primarySocialHandle)?.platform}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RepresentationBadge type={talent.representationType || "NON_EXCLUSIVE"} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={talent.status || "ACTIVE"} />
                    </td>
                    <td className="px-4 py-4">
                      {talent.linkedUser ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-brand-black/40" />
                          <span className="text-sm truncate max-w-[200px]">{talent.linkedUser.email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-brand-black/40">
                          <UserX className="h-4 w-4" />
                          <span className="text-xs italic">Not linked</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-brand-black/60 space-y-1">
                        <div>{talent.metrics?.activeDeals || 0} active deals</div>
                        <div>{talent.metrics?.openOpportunities || 0} opportunities</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(talent.id);
                          }}
                          className="px-3 py-1.5 text-xs uppercase tracking-[0.2em] rounded-lg border border-brand-black/20 hover:bg-brand-black/5 transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTalent(talent.id, talent.displayName || talent.name);
                          }}
                          className="p-1.5 text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"
                          title="Delete talent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AddTalentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadTalents}
      />
    </DashboardShell>
  );
}
