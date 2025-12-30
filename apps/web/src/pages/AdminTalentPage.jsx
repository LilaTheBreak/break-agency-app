import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import { Badge } from "../components/Badge.jsx";
import { Plus, User, UserX, Edit2, Archive } from "lucide-react";
import { toast } from "react-hot-toast";

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
    <span className={`inline-block h-2 w-2 rounded-full ${statusOption.color} mr-2`} />
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await apiFetch("/api/admin/talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create talent");
      }

      const data = await response.json();
      toast.success("Talent created successfully");
      onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Add New Talent</p>
            <h3 className="font-display text-2xl uppercase">Create Talent Record</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/10 p-4 text-sm text-brand-red">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
              placeholder="Talent display name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Legal Name
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Primary Email
              </label>
              <input
                type="email"
                value={formData.primaryEmail}
                onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Representation Type
              </label>
              <select
                value={formData.representationType}
                onChange={(e) => setFormData({ ...formData, representationType: e.target.value })}
                className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
              >
                {REPRESENTATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
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
            <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
              Internal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
              placeholder="Optional internal notes"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-black/20 px-6 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Talent"}
            </button>
          </div>
        </form>
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

  const fetchTalents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch("/api/admin/talent");
      if (!response.ok) {
        throw new Error("Failed to fetch talent");
      }
      const data = await response.json();
      setTalents(Array.isArray(data.talents) ? data.talents : []);
    } catch (err) {
      console.error("Error fetching talent:", err);
      setError(err.message || "Failed to load talent");
      setTalents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  const handleRowClick = (talentId) => {
    navigate(`/admin/talent/${talentId}`);
  };

  return (
    <DashboardShell
      title="Talent Management"
      subtitle="Manage all talent records, representation types, and relationships. Talent can exist independently of user accounts."
      navLinks={ADMIN_NAV_LINKS}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-black/60">
            {talents.length} {talents.length === 1 ? "talent" : "talents"}
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

      {loading && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-center">
          <p className="text-brand-black/60">Loading talent...</p>
        </section>
      )}

      {error && !loading && (
        <section className="rounded-3xl border border-brand-red/20 bg-brand-red/10 p-8 text-center">
          <p className="text-brand-red">{error}</p>
        </section>
      )}

      {!loading && !error && talents.length === 0 && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-black/10 bg-brand-linen/50">
            <User className="h-8 w-8 text-brand-black/40" />
          </div>
          <h3 className="font-display text-xl uppercase mb-2">No talent yet</h3>
          <p className="text-sm text-brand-black/60 mb-6">
            Create your first talent record to start managing representation and relationships.
          </p>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black"
          >
            <Plus className="inline h-4 w-4 mr-2" />
            Add New Talent
          </button>
        </section>
      )}

      {!loading && !error && talents.length > 0 && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white overflow-hidden">
          <table className="w-full text-left text-sm text-brand-black/80">
            <thead>
              <tr>
                <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red w-[25%]">
                  Talent Name
                </th>
                <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red w-[15%]">
                  Type
                </th>
                <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red w-[10%]">
                  Status
                </th>
                <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red w-[20%]">
                  Linked User
                </th>
                <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red w-[15%]">
                  Metrics
                </th>
                <th className="border-b border-brand-black/10 px-4 py-3 text-right w-[15%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {talents.map((talent) => (
                <tr
                  key={talent.id}
                  onClick={() => handleRowClick(talent.id)}
                  className="cursor-pointer hover:bg-brand-black/5 transition-colors"
                >
                  <td className="border-b border-brand-black/5 px-4 py-4">
                    <div className="font-semibold text-brand-black">{talent.displayName || talent.name}</div>
                  </td>
                  <td className="border-b border-brand-black/5 px-4 py-4">
                    <RepresentationBadge type={talent.representationType || "NON_EXCLUSIVE"} />
                  </td>
                  <td className="border-b border-brand-black/5 px-4 py-4">
                    <div className="flex items-center">
                      <StatusBadge status={talent.status || "ACTIVE"} />
                      <span className="text-xs uppercase tracking-[0.2em]">
                        {talent.status || "ACTIVE"}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-brand-black/5 px-4 py-4">
                    {talent.linkedUser ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-brand-black/40" />
                        <span className="text-sm">{talent.linkedUser.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-brand-black/40">
                        <UserX className="h-4 w-4" />
                        <span className="text-xs italic">Not linked</span>
                      </div>
                    )}
                  </td>
                  <td className="border-b border-brand-black/5 px-4 py-4">
                    <div className="text-xs text-brand-black/60">
                      <div>{talent.metrics?.activeDeals || 0} active deals</div>
                      <div>{talent.metrics?.openOpportunities || 0} opportunities</div>
                    </div>
                  </td>
                  <td className="border-b border-brand-black/5 px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(talent.id);
                      }}
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] hover:bg-brand-black/5"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <AddTalentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchTalents}
      />
    </DashboardShell>
  );
}

