import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import { fetchTalent, createDeal, fetchBrands, updateDeal } from "../services/crmClient.js";
import { Badge } from "../components/Badge.jsx";
import { TalentAccessSettings } from "../components/TalentAccessSettings.jsx";
import { ViewAsTalentButton } from "../components/ViewAsTalentButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AdminRevenueManagement from "../components/AdminRevenueManagement.jsx";
import { 
  User, UserX, Edit2, Link2, Unlink, 
  TrendingUp, Briefcase, FileText, Mail, 
  CheckSquare, DollarSign, FileEdit, 
  ArrowLeft, Archive, AlertCircle, Plus, Trash2, MoreVertical, ShoppingCart
} from "lucide-react";
import { toast } from "react-hot-toast";
import { DealChip } from "../components/DealChip.jsx";
import { NotesIntelligenceSection } from "../components/NotesIntelligenceSection.jsx";
import { TalentCommandHeader } from "../components/AdminTalent/TalentCommandHeader.jsx";
import { HealthSnapshotCards } from "../components/AdminTalent/HealthSnapshotCards.jsx";
import { TalentSocialProfilesAccordion } from "../components/AdminTalent/TalentSocialProfilesAccordion.jsx";
import { QuickEmailInput } from "../components/AdminTalent/QuickEmailInput.jsx";
import { CollapsibleDetailSection } from "../components/AdminTalent/CollapsibleDetailSection.jsx";

const REPRESENTATION_TYPES = [
  { value: "EXCLUSIVE", label: "Exclusive", color: "bg-brand-red text-white", description: "Full-service representation" },
  { value: "NON_EXCLUSIVE", label: "Non-Exclusive", color: "bg-brand-black/10 text-brand-black", description: "Project-based" },
  { value: "FRIEND_OF_HOUSE", label: "Friends of House", color: "bg-purple-100 text-purple-700", description: "Preferred partners" },
  { value: "UGC", label: "UGC", color: "bg-blue-100 text-blue-700", description: "User-generated content" },
  { value: "FOUNDER", label: "Founder", color: "bg-green-100 text-green-700", description: "Brand partners" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-green-500" },
  { value: "PAUSED", label: "Paused", color: "bg-yellow-500" },
  { value: "ARCHIVED", label: "Archived", color: "bg-gray-400" },
];

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "deals", label: "Deal Tracker", icon: Briefcase },
  { id: "opportunities", label: "Opportunities", icon: TrendingUp },
  { id: "deliverables", label: "Content Deliverables", icon: CheckSquare },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "payments", label: "Payments & Finance", icon: DollarSign },
  { id: "commerce", label: "Commerce", icon: ShoppingCart },
  { id: "access", label: "Access Control", icon: User },
  { id: "notes", label: "Notes & History", icon: FileEdit },
  { id: "files", label: "Files & Assets", icon: Archive },
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

function SnapshotCard({ label, value, subtext, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-brand-black/40" />}
      </div>
      <p className="font-display text-2xl uppercase text-brand-black">{value}</p>
      {subtext && <p className="mt-1 text-xs text-brand-black/50">{subtext}</p>}
    </div>
  );
}

function LinkUserModal({ open, onClose, talentId, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const response = await apiFetch("/api/users?limit=100");
          if (response.ok) {
            const data = await response.json();
            // API returns { users: [...] }
            setUsers(Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []));
          }
        } catch (err) {
          console.error("Error fetching users:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [open]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const searchLower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(searchLower) ||
        u.name?.toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  const handleLink = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/link-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to link user");
      }

      toast.success("User linked successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to link user");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Link User Account</p>
            <h3 className="font-display text-2xl uppercase">Connect Talent to User</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Cancel
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading && <p className="text-center text-brand-black/60 py-4">Loading users...</p>}
          {!loading && filteredUsers.length === 0 && (
            <p className="text-center text-brand-black/60 py-4">No users found</p>
          )}
          {!loading && filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUserId(user.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedUserId === user.id
                  ? "border-brand-red bg-brand-red/10"
                  : "border-brand-black/10 hover:bg-brand-black/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-brand-black">{user.name || user.email}</p>
                  <p className="text-xs text-brand-black/60">{user.email}</p>
                </div>
                {selectedUserId === user.id && (
                  <div className="h-4 w-4 rounded-full bg-brand-red" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-6 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLink}
            disabled={!selectedUserId}
            className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black disabled:opacity-50"
          >
            Link User
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTalentModal({ open, onClose, talent, onSuccess }) {
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
  const formRef = useRef(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (open && talent) {
      setFormData({
        displayName: talent.displayName || talent.name || "",
        legalName: talent.legalName || "",
        primaryEmail: talent.primaryEmail || talent.linkedUser?.email || "",
        representationType: talent.representationType || "NON_EXCLUSIVE",
        status: talent.status || "ACTIVE",
        notes: talent.notes || "",
      });
      setError("");
    }
  }, [open, talent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!formData.displayName || !formData.displayName.trim()) {
      setError("Display name is required");
      setSaving(false);
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/talent/${talent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to update talent (${response.status})`);
      }

      // CRITICAL: Parse response and verify it contains data before showing success
      const responseData = await response.json();
      if (!responseData || !responseData.talent) {
        throw new Error("Server returned no talent data");
      }

      // Show success only after confirming response
      toast.success("Talent updated successfully");
      onClose();
      await onSuccess();
    } catch (err) {
      console.error("UPDATE TALENT FAILED", err);
      setError(err.message || "Failed to update talent");
      toast.error(err.message || "Failed to update talent");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
              <h3 className="font-display text-3xl uppercase text-brand-black">Edit Talent</h3>
              <p className="mt-2 text-sm text-brand-black/70">
                Update talent profile information
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
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-brand-red/20 bg-brand-red/10 p-4">
                <p className="text-sm text-brand-red font-semibold">{error}</p>
              </div>
            )}

            {/* Display Name */}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full rounded-xl border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Enter display name"
              />
            </div>

            {/* Legal Name */}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Legal Name
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full rounded-xl border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Enter legal name"
              />
            </div>

            {/* Primary Email */}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Primary Email
              </label>
              <input
                type="email"
                value={formData.primaryEmail}
                onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                className="w-full rounded-xl border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Enter primary email"
              />
            </div>

            {/* Representation Type */}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Representation Type
              </label>
              <select
                value={formData.representationType}
                onChange={(e) => setFormData({ ...formData, representationType: e.target.value })}
                className="w-full rounded-xl border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                {REPRESENTATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-xl border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                rows={4}
                placeholder="Enter any notes about this talent"
              />
            </div>
          </form>
        </div>

        <div className="border-t border-brand-black/10 px-8 py-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-6 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => formRef.current?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))}
            disabled={saving}
            className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TALENT EMAILS SECTION
// ============================================

function TalentEmailsSection({ talentId }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', label: '' });
  const [error, setError] = useState("");

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/emails`);
      if (response.ok) {
        const data = await response.json();
        setEmails(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[EMAILS] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!form.email) return;
    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/emails`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          label: form.label || null,
          isPrimary: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add email");
      }

      toast.success("Email added successfully");
      setForm({ email: '', label: '' });
      await loadEmails();
    } catch (err) {
      console.error("[ADD EMAIL ERROR]", err);
      toast.error(err.message || "Failed to add email");
    }
  };

  const handleSetPrimary = async (emailId) => {
    try {
      const response = await apiFetch(`/api/admin/talent/emails/${emailId}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true })
      });

      if (!response.ok) throw new Error("Failed to set primary");
      toast.success("Primary email updated");
      await loadEmails();
    } catch (err) {
      console.error("[SET PRIMARY ERROR]", err);
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (emailId) => {
    try {
      const response = await apiFetch(`/api/admin/talent/emails/${emailId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Failed to delete email");
      toast.success("Email deleted");
      await loadEmails();
    } catch (err) {
      console.error("[DELETE EMAIL ERROR]", err);
      toast.error(err.message || "Failed to delete");
    }
  };

  useEffect(() => {
    loadEmails();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Linked Emails</p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="flex-1 px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
        />
        <button
          onClick={handleAddEmail}
          className="px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] hover:bg-brand-black"
        >
          Add
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-brand-black/60">Loading...</p>
      ) : emails.length === 0 ? (
        <p className="text-sm text-brand-black/60">No emails added yet</p>
      ) : (
        <div className="space-y-2">
          {emails.map(email => (
            <div key={email.id} className="flex items-center justify-between p-3 bg-brand-black/5 rounded-lg">
              <div>
                <p className="font-mono text-sm text-brand-black">{email.email}</p>
                {email.label && <p className="text-xs text-brand-black/60">{email.label}</p>}
                {email.isPrimary && <span className="text-xs bg-brand-red text-white px-2 py-1 rounded mt-1 inline-block">Primary</span>}
              </div>
              <div className="flex gap-2">
                {!email.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(email.id)}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleDelete(email.id)}
                  className="text-xs text-brand-red hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================
// TALENT TASKS SECTION
// ============================================

function TalentTasksSection({ talentId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', dueDate: '' });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[TASKS] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!form.title) return;
    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/tasks`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          notes: form.notes || null,
          dueDate: form.dueDate || null,
          status: 'PENDING'
        })
      });

      if (!response.ok) throw new Error("Failed to add task");
      toast.success("Task added successfully");
      setForm({ title: '', notes: '', dueDate: '' });
      await loadTasks();
    } catch (err) {
      console.error("[ADD TASK ERROR]", err);
      toast.error(err.message || "Failed to add task");
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      const response = await apiFetch(`/api/admin/talent/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
        })
      });

      if (!response.ok) throw new Error("Failed to update task");
      toast.success(newStatus === 'COMPLETED' ? "Task completed" : "Task reopened");
      await loadTasks();
    } catch (err) {
      console.error("[TOGGLE TASK ERROR]", err);
      toast.error(err.message || "Failed to update task");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await apiFetch(`/api/admin/talent/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Failed to delete task");
      toast.success("Task deleted");
      await loadTasks();
    } catch (err) {
      console.error("[DELETE TASK ERROR]", err);
      toast.error(err.message || "Failed to delete");
    }
  };

  useEffect(() => {
    loadTasks();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Tasks / To-Do</p>
      
      <div className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
        />
        <textarea
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
          rows="2"
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
        />
        <button
          onClick={handleAddTask}
          className="w-full px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] hover:bg-brand-black"
        >
          Add Task
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-brand-black/60">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-brand-black/60">No tasks yet</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className={`p-3 rounded-lg border ${task.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'border-brand-black/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleToggleComplete(task.id, task.status)}
                    />
                    <span className={task.status === 'COMPLETED' ? 'line-through text-brand-black/50 text-sm' : 'text-sm text-brand-black'}>
                      {task.title}
                    </span>
                  </label>
                  {task.notes && <p className="text-xs text-brand-black/60 mt-1 ml-6">{task.notes}</p>}
                  {task.dueDate && (
                    <p className="text-xs text-brand-black/60 mt-1 ml-6">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-xs text-brand-red hover:underline ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================
// TALENT SOCIAL SECTION
// ============================================

function TalentSocialSection({ talentId }) {
  const [socials, setSocials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrapingHandle, setScrapingHandle] = useState(null);
  const [form, setForm] = useState({
    platform: 'INSTAGRAM',
    handle: '',
    url: '',
    followers: ''
  });

  const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'X', 'LINKEDIN'];

  const loadSocials = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/socials`);
      if (response.ok) {
        const data = await response.json();
        setSocials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[SOCIALS] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSocial = async () => {
    // For Instagram, only handle is required - URL will be normalized on backend
    // For other platforms, both handle and URL are required
    if (!form.handle) {
      toast.error("Handle is required");
      return;
    }
    
    if (form.platform !== 'INSTAGRAM' && !form.url) {
      toast.error("URL is required for non-Instagram platforms");
      return;
    }

    setScrapingHandle(form.handle);
    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/socials`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          handle: form.handle,
          url: form.url || undefined, // Let backend normalize Instagram URLs
          followers: form.followers ? parseInt(form.followers) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to add social");
      }
      
      toast.success("Social profile added successfully");
      setForm({ platform: 'INSTAGRAM', handle: '', url: '', followers: '' });
      await loadSocials();
    } catch (err) {
      console.error("[ADD SOCIAL ERROR]", err);
      toast.error(err.message || "Failed to add social");
    } finally {
      setScrapingHandle(null);
    }
  };

  const handleDelete = async (socialId) => {
    try {
      const response = await apiFetch(`/api/admin/talent/socials/${socialId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Failed to delete social");
      toast.success("Social profile deleted");
      await loadSocials();
    } catch (err) {
      console.error("[DELETE SOCIAL ERROR]", err);
      toast.error(err.message || "Failed to delete");
    }
  };

  useEffect(() => {
    loadSocials();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Social Profiles</p>
      
      <div className="space-y-2 mb-4">
        <select
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value })}
          className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
        >
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        
        {form.platform === 'INSTAGRAM' ? (
          <>
            <input
              type="text"
              placeholder="Instagram handle or profile URL (e.g., @username or instagram.com/username)"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
            />
            {form.handle && form.platform === 'INSTAGRAM' && (
              <p className="text-xs text-brand-black/60 italic">
                ℹ️ Public profile data will auto-populate after adding (followers, posts, profile picture)
              </p>
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Handle (e.g., talent_name)"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
            />
            <input
              type="url"
              placeholder="Profile URL"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
            />
          </>
        )}
        
        <input
          type="number"
          placeholder="Followers (optional, auto-populated for Instagram)"
          value={form.followers}
          onChange={(e) => setForm({ ...form, followers: e.target.value })}
          className="w-full px-3 py-2 border border-brand-black/10 rounded-lg text-sm"
        />
        <button
          onClick={handleAddSocial}
          disabled={scrapingHandle === form.handle}
          className="w-full px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] hover:bg-brand-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scrapingHandle === form.handle ? `⏳ Fetching ${form.platform === 'INSTAGRAM' ? 'public profile data' : 'data'}...` : 'Add Social Profile'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-brand-black/60">Loading...</p>
      ) : socials.length === 0 ? (
        <p className="text-sm text-brand-black/60">No social profiles added yet</p>
      ) : (
        <div className="space-y-3">
          {socials.map(social => (
            <div
              key={social.id}
              className="flex items-start gap-3 p-3 bg-brand-black/5 rounded-lg"
            >
              {social.profileImageUrl && (
                <img 
                  src={social.profileImageUrl} 
                  alt={social.handle}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="flex-1 min-w-0">
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:underline"
                >
                  <p className="font-semibold text-sm text-brand-black">
                    {social.displayName || social.platform}
                  </p>
                  <p className="text-xs text-brand-black/60">@{social.handle}</p>
                </a>
                
                {/* Show scraped Instagram data */}
                {social.platform === 'INSTAGRAM' && social.lastScrapedAt && (
                  <div className="mt-2 text-xs text-brand-black/60 space-y-1">
                    <p className="font-medium italic text-brand-black/50">Public Instagram data</p>
                    <div className="flex gap-4 flex-wrap">
                      {social.followers && (
                        <span>{social.followers.toLocaleString()} followers</span>
                      )}
                      {social.following && (
                        <span>{social.following.toLocaleString()} following</span>
                      )}
                      {social.postCount && (
                        <span>{social.postCount.toLocaleString()} posts</span>
                      )}
                    </div>
                    <p className="text-xs text-brand-black/40">
                      Fetched {new Date(social.lastScrapedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {/* Show manually set follower count for non-Instagram */}
                {social.platform !== 'INSTAGRAM' && social.followers && (
                  <p className="text-xs text-brand-black/60 mt-1">{social.followers.toLocaleString()} followers</p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(social.id);
                }}
                className="text-xs text-brand-red hover:underline flex-shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminTalentDetailPage() {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Use ref to prevent multiple simultaneous fetches
  const fetchingRef = useRef(false);

  const fetchTalentData = useCallback(async () => {
    if (!talentId || fetchingRef.current) return;
    
    fetchingRef.current = true;
    try {
      setLoading(true);
      setError("");
      const data = await fetchTalent(talentId);
      // Handle both { talent: {...} } and direct talent object responses
      const talentData = data.talent || data;
      if (!talentData || !talentData.id) {
        throw new Error("Talent not found");
      }
      // API now sanitizes data, but add extra safety for any remaining circular refs
      // Use structuredClone if available (handles circular refs), otherwise shallow copy
      let sanitizedTalent;
      try {
        // Try structuredClone first (available in modern browsers, handles circular refs)
        if (typeof structuredClone !== 'undefined') {
          sanitizedTalent = structuredClone(talentData);
        } else {
          // Fallback: shallow copy with explicit field mapping for safety
          sanitizedTalent = {
            ...talentData,
            deals: Array.isArray(talentData.deals) ? talentData.deals.map(d => ({ ...d })) : [],
            tasks: Array.isArray(talentData.tasks) ? talentData.tasks.map(t => ({ ...t })) : [],
            revenue: talentData.revenue ? {
              total: talentData.revenue.total,
              payouts: talentData.revenue.payouts,
              net: talentData.revenue.net,
              payments: Array.isArray(talentData.revenue.payments) 
                ? talentData.revenue.payments.map(p => ({ ...p })) 
                : [],
              payoutsList: Array.isArray(talentData.revenue.payoutsList) 
                ? talentData.revenue.payoutsList.map(p => ({ ...p })) 
                : [],
            } : null,
          };
        }
      } catch (cloneError) {
        // Last resort: create minimal safe copy
        console.warn("[TALENT] Could not clone talent data, creating minimal safe copy:", cloneError);
        sanitizedTalent = {
          id: talentData.id,
          name: talentData.name,
          displayName: talentData.displayName,
          representationType: talentData.representationType,
          status: talentData.status,
          linkedUser: talentData.linkedUser,
          deals: [],
          tasks: [],
          revenue: null,
        };
      }
      
      setTalent(sanitizedTalent);
    } catch (err) {
      console.error("[TALENT] Error fetching talent:", {
        message: err?.message,
        status: err?.status,
        response: err?.response,
        fullError: err,
      });
      const errorMessage = err?.message || "Failed to load talent";
      setError(errorMessage);
      
      // If talent not found (404), redirect to list after a short delay
      if (err?.status === 404 || errorMessage.includes("not found") || errorMessage.includes("NOT_FOUND")) {
        toast.error("Talent not found. It may have been deleted.");
        setTimeout(() => {
          navigate("/admin/talent");
        }, 2000);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [talentId, navigate]);

  useEffect(() => {
    fetchTalentData();
  }, [fetchTalentData]);

  const isExclusive = talent?.representationType === "EXCLUSIVE";

  if (loading) {
    return (
      <DashboardShell title="Talent Management" navLinks={ADMIN_NAV_LINKS}>
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-center">
          <p className="text-brand-black/60">Loading talent details...</p>
        </section>
      </DashboardShell>
    );
  }

  if (error || !talent) {
    return (
      <DashboardShell title="Talent Management" navLinks={ADMIN_NAV_LINKS}>
        <section className="rounded-3xl border border-brand-red/20 bg-brand-red/10 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-brand-red mx-auto mb-4" />
          <p className="text-brand-red">{error || "Talent not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/admin/talent")}
            className="mt-4 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Back to Talent List
          </button>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Talent Management"
      subtitle={`Managing ${talent.displayName || talent.name}`}
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin/talent")}
          className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* TIER 1: Command Header (Identity) */}
      <TalentCommandHeader
        talent={talent}
        onEdit={() => setEditModalOpen(true)}
        onViewAs={() => {
          // Navigate to ViewAsTalentButton logic
          const talentUserId = talent.linkedUser?.id;
          if (talentUserId) {
            navigate(`/?impersonate=${talentUserId}`);
          } else {
            toast.error("Talent is not linked to a user account");
          }
        }}
      />

      {/* TIER 2: Health Snapshot (Key Metrics) */}
      <HealthSnapshotCards talent={talent} />

      {/* TIER 2B: Quick Details (Collapsible) */}
      <section className="mb-6 space-y-3">
        {/* Social Profiles */}
        <TalentSocialProfilesAccordion
          talent={talent}
          onUpdate={fetchTalentData}
        />

        {/* Emails */}
        <CollapsibleDetailSection title="Contact Information">
          <QuickEmailInput talent={talent} onUpdate={fetchTalentData} />
        </CollapsibleDetailSection>

        {/* Representation Details */}
        <CollapsibleDetailSection
          title="Representation Details"
          badge={talent.representationType || "NON_EXCLUSIVE"}
        >
          <div className="space-y-3">
            <div className="rounded-lg bg-brand-white border border-brand-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Type
              </p>
              <p>
                <RepresentationBadge type={talent.representationType || "NON_EXCLUSIVE"} />
              </p>
              <p className="mt-2 text-xs text-brand-black/50">
                {REPRESENTATION_TYPES.find((t) => t.value === (talent.representationType || "NON_EXCLUSIVE"))?.description}
              </p>
            </div>

            <div className="rounded-lg bg-brand-white border border-brand-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                Status
              </p>
              <p>
                <StatusBadge status={talent.status || "ACTIVE"} />
              </p>
            </div>

            {talent.legalName && (
              <div className="rounded-lg bg-brand-white border border-brand-black/10 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                  Legal Name
                </p>
                <p className="text-sm text-brand-black">{talent.legalName}</p>
              </div>
            )}
          </div>
        </CollapsibleDetailSection>

        {/* Linked User Account */}
        <CollapsibleDetailSection
          title="Linked User Account"
          badge={talent.linkedUser ? "Connected" : "Not Linked"}
        >
          <div className="space-y-3">
            {talent.linkedUser ? (
              <>
                <div className="rounded-lg bg-brand-white border border-brand-black/10 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                    Email
                  </p>
                  <p className="text-sm text-brand-black">{talent.linkedUser.email}</p>
                </div>
                {talent.linkedUser.name && (
                  <div className="rounded-lg bg-brand-white border border-brand-black/10 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                      Name
                    </p>
                    <p className="text-sm text-brand-black">{talent.linkedUser.name}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    toast.info("Unlink functionality will be available after schema migration");
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5 transition-colors"
                >
                  <Unlink className="h-4 w-4" />
                  Unlink Account
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setLinkModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-xs uppercase tracking-[0.3em] text-white font-semibold hover:bg-brand-red/90 transition-colors"
              >
                <Link2 className="h-4 w-4" />
                Link User Account
              </button>
            )}
          </div>
        </CollapsibleDetailSection>
      </section>

      {/* TIER 3: Workspace Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-brand-black/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-2xl border-b-2 px-4 py-3 text-xs uppercase tracking-[0.3em] transition ${
                isActive
                  ? "border-brand-red text-brand-red"
                  : "border-transparent text-brand-black/60 hover:text-brand-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <OverviewTab talent={talent} isExclusive={isExclusive} />
        )}
        {activeTab === "deals" && (
          <DealsTab talent={talent} onDealCreated={fetchTalentData} />
        )}
        {activeTab === "opportunities" && (
          <OpportunitiesTab talentId={talentId} isExclusive={isExclusive} />
        )}
        {activeTab === "deliverables" && (
          <DeliverablesTab talent={talent} />
        )}
        {activeTab === "contracts" && (
          <ContractsTab talentId={talentId} />
        )}
        {activeTab === "payments" && (
          <RevenueTab talent={talent} isExclusive={isExclusive} />
        )}
        {activeTab === "commerce" && (
          <CommerceTab talent={talent} isExclusive={isExclusive} />
        )}
        {activeTab === "access" && (
          <AccessControlTab talent={talent} />
        )}
        {activeTab === "notes" && (
          <NotesTab talentId={talentId} />
        )}
        {activeTab === "files" && (
          <FilesTab talentId={talentId} />
        )}
      </div>

      <LinkUserModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        talentId={talentId}
        onSuccess={fetchTalentData}
      />

      <EditTalentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        talent={talent}
        onSuccess={fetchTalentData}
      />
    </DashboardShell>
  );
}

// Tab Components
function OverviewTab({ talent, isExclusive }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Representation Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Type</p>
            <p className="mt-2">
              <RepresentationBadge type={talent.representationType || "NON_EXCLUSIVE"} />
            </p>
            <p className="mt-2 text-xs text-brand-black/50">
              {REPRESENTATION_TYPES.find((t) => t.value === (talent.representationType || "NON_EXCLUSIVE"))?.description}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Status</p>
            <p className="mt-2">
              <StatusBadge status={talent.status || "ACTIVE"} />
            </p>
          </div>
          {talent.legalName && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Legal Name</p>
              <p className="mt-2 text-sm text-brand-black">{talent.legalName}</p>
            </div>
          )}
          {talent.primaryEmail && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Primary Email</p>
              <p className="mt-2 text-sm text-brand-black">{talent.primaryEmail}</p>
            </div>
          )}
        </div>
      </section>

      {talent.notes && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Internal Notes</p>
          <p className="text-sm text-brand-black/80 whitespace-pre-wrap">{talent.notes}</p>
        </section>
      )}

      <TalentEmailsSection talentId={talent.id} />
      <TalentTasksSection talentId={talent.id} />
      <TalentSocialSection talentId={talent.id} />
    </div>
  );
}

function OpportunitiesTab({ talentId, isExclusive }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/opportunities`);
        if (response.ok) {
          const data = await response.json();
          const opps = Array.isArray(data.opportunities) ? data.opportunities : [];
          setOpportunities(opps);
        }
      } catch (err) {
        console.error("Error fetching opportunities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Opportunities</p>
      {loading ? (
        <p className="text-brand-black/60">Loading opportunities...</p>
      ) : opportunities.length === 0 ? (
        <p className="text-brand-black/60">No opportunities found. This will be populated when Opportunity model is updated with talentId.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div key={opp.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{opp.title}</p>
              <p className="text-xs text-brand-black/60 mt-1">{opp.status}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DealsTab({ talent, onDealCreated }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  
  const deals = talent.deals || [];
  const [dealView, setDealView] = useState("deals"); // "deals" or "opportunities"
  const [stageFilter, setStageFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("dueDate");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    dealName: "",
    brandId: "",
    status: "NEW_LEAD",
    estimatedValue: "",
    currency: "GBP",
    expectedCloseDate: "",
    notes: ""
  });
  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // Load brands when modal opens
  useEffect(() => {
    if (!createOpen) return;
    
    const loadBrands = async () => {
      setBrandsLoading(true);
      try {
        const data = await fetchBrands();
        setBrands(Array.isArray(data?.brands) ? data.brands : (Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("[BRANDS] Load error:", err);
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    
    loadBrands();
  }, [createOpen]);

  // Handle inline field edits
  const handleEditField = async (dealId, field, value) => {
    setUpdateError("");
    try {
      // Map UI field names to API field names
      const updatePayload = {};
      if (field === "fee") updatePayload.value = parseFloat(value);
      if (field === "currency") updatePayload.currency = value;
      if (field === "stage") updatePayload.stage = value;
      if (field === "expectedCloseDate") updatePayload.expectedClose = value ? new Date(value).toISOString() : null;
      if (field === "paymentStatus") {
        // Handle payment status mapping
        if (value === "Paid") {
          updatePayload.stage = "PAYMENT_RECEIVED";
        } else if (value === "Unpaid") {
          updatePayload.stage = "PAYMENT_PENDING";
        }
      }
      if (field === "notes") updatePayload.notes = value;
      if (field === "scope") updatePayload.notes = value;

      await updateDeal(dealId, updatePayload);
      
      setEditingDealId(null);
      setEditingField(null);
      setEditValue("");
      toast.success("Deal updated successfully");
      
      // Refresh talent data
      if (onDealCreated) {
        onDealCreated();
      }
    } catch (err) {
      console.error("[UPDATE DEAL ERROR]", err);
      setUpdateError("Failed to update: " + (err.message || "Unknown error"));
      toast.error("Failed to update deal: " + err.message);
    }
  };

  // Determine payment status from stage
  const getPaymentStatus = (stage) => {
    if (stage === "PAYMENT_RECEIVED" || stage === "COMPLETED") {
      return "Paid";
    } else if (stage === "PAYMENT_PENDING") {
      return "Unpaid";
    } else if (["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS"].includes(stage)) {
      return "Awaiting";
    }
    return "Pending";
  };

  const handleCreateDeal = async () => {
    setCreateError("");
    
    if (!createForm.dealName.trim()) {
      setCreateError("Deal name is required");
      return;
    }
    if (!createForm.brandId) {
      setCreateError("Brand is required");
      return;
    }

    const dealPayload = {
      dealName: createForm.dealName.trim(),
      brandId: createForm.brandId,
      userId: "", // Will be set by API
      talentId: talent.id,
      status: createForm.status,
      estimatedValue: createForm.estimatedValue ? parseFloat(createForm.estimatedValue) : null,
      currency: createForm.currency || "GBP",
      expectedCloseDate: createForm.expectedCloseDate || null,
      notes: createForm.notes || null,
    };

    try {
      const created = await createDeal(dealPayload);
      if (!created || !created.id) {
        throw new Error("Server returned no deal data");
      }
      
      toast.success("Deal created successfully");
      setCreateOpen(false);
      
      // Reset form
      setCreateForm({
        dealName: "",
        brandId: "",
        status: "NEW_LEAD",
        estimatedValue: "",
        currency: "GBP",
        expectedCloseDate: "",
        notes: ""
      });
      
      // Refresh talent data to show new deal
      if (onDealCreated) {
        onDealCreated();
      }
    } catch (err) {
      console.error("[CREATE DEAL ERROR]", err);
      setCreateError("Failed to create deal: " + (err.message || "Unknown error"));
      toast.error("Failed to create deal: " + err.message);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete?.id) return;

    setDeleteError("");
    setDeleteLoading(true);

    try {
      const response = await apiFetch(`/api/admin/deals/${dealToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `Error: ${response.status}`;
        throw new Error(errorMsg);
      }

      // Success: remove deal from local state
      if (onDealCreated) {
        onDealCreated();
      }

      toast.success("Deal deleted successfully");
      setDeleteModalOpen(false);
      setDealToDelete(null);
    } catch (err) {
      console.error("[DELETE DEAL ERROR]", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setDeleteError(errorMsg);
      toast.error("Failed to delete deal: " + errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Map DealStage enum to display labels
  const stageLabels = {
    NEW_LEAD: "In discussion",
    NEGOTIATION: "In discussion",
    CONTRACT_SENT: "Awaiting contract",
    CONTRACT_SIGNED: "Contract signed",
    DELIVERABLES_IN_PROGRESS: "Live",
    PAYMENT_PENDING: "Live",
    PAYMENT_RECEIVED: "Completed",
    COMPLETED: "Completed",
    LOST: "Declined",
  };

  const filteredDeals = useMemo(() => {
    let filtered = deals;
    
    // Split into Opportunities (no stage) vs Deals (has stage)
    if (dealView === "opportunities") {
      filtered = filtered.filter(d => !d.stage);
    } else {
      filtered = filtered.filter(d => d.stage);
    }
    
    if (stageFilter !== "ALL") {
      filtered = filtered.filter(d => d.stage === stageFilter);
    }
    if (currencyFilter !== "ALL") {
      filtered = filtered.filter(d => (d.currency || "GBP") === currencyFilter);
    }
    if (paymentFilter !== "ALL") {
      const payStatus = paymentFilter;
      filtered = filtered.filter(d => {
        const dPayStatus = getPaymentStatus(d.stage);
        return dPayStatus === payStatus;
      });
    }
    return filtered;
  }, [deals, dealView, stageFilter, currencyFilter, paymentFilter]);

  const sortedDeals = useMemo(() => {
    const sorted = [...filteredDeals];
    if (sortBy === "dueDate") {
      sorted.sort((a, b) => {
        const dateA = a.expectedClose ? new Date(a.expectedClose) : new Date(0);
        const dateB = b.expectedClose ? new Date(b.expectedClose) : new Date(0);
        return dateA - dateB;
      });
    } else if (sortBy === "brand") {
      sorted.sort((a, b) => {
        const nameA = (a.brand?.name || a.brandName || "").toLowerCase();
        const nameB = (b.brand?.name || b.brandName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === "stage") {
      sorted.sort((a, b) => {
        const stageA = a.stage || "";
        const stageB = b.stage || "";
        return stageA.localeCompare(stageB);
      });
    } else if (sortBy === "value") {
      sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
    }
    return sorted;
  }, [filteredDeals, sortBy]);

  // Calculate totals in GBP
  const totals = useMemo(() => {
    const pipeline = sortedDeals.filter(d => 
      !["COMPLETED", "LOST", "PAYMENT_RECEIVED"].includes(d.stage)
    );
    const confirmed = sortedDeals.filter(d => 
      ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(d.stage)
    );
    const paid = sortedDeals.filter(d => d.stage === "PAYMENT_RECEIVED" || d.stage === "COMPLETED");
    const pending = sortedDeals.filter(d => 
      ["NEW_LEAD", "NEGOTIATION", "CONTRACT_SENT"].includes(d.stage)
    );
    
    // Convert all to GBP values (stored at deal level)
    const pipelineValue = pipeline.reduce((sum, d) => sum + (d.value || 0), 0);
    const confirmedRevenue = confirmed.reduce((sum, d) => sum + (d.value || 0), 0);
    const paidValue = paid.reduce((sum, d) => sum + (d.value || 0), 0);
    const unpaidValue = confirmed.reduce((sum, d) => {
      if (!["PAYMENT_RECEIVED", "COMPLETED"].includes(d.stage)) {
        return sum + (d.value || 0);
      }
      return sum;
    }, 0);
    const pendingValue = pending.reduce((sum, d) => sum + (d.value || 0), 0);
    
    const avgValue = sortedDeals.length > 0 ? pipelineValue / sortedDeals.length : 0;
    const largestDeal = sortedDeals.length > 0 
      ? Math.max(...sortedDeals.map(d => d.value || 0))
      : 0;
    
    // Count deals closing this month
    const now = new Date();
    const thisMonth = sortedDeals.filter(d => {
      if (!d.expectedClose) return false;
      const closeDate = new Date(d.expectedClose);
      return closeDate.getMonth() === now.getMonth() && 
             closeDate.getFullYear() === now.getFullYear();
    });
    
    return { 
      pipelineValue, 
      confirmedRevenue, 
      paidValue, 
      unpaidValue,
      pendingValue,
      avgValue: Math.round(avgValue),
      largestDeal,
      closingThisMonth: thisMonth.length
    };
  }, [sortedDeals]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      {/* Deal/Opportunity Toggle */}
      <div className="mb-6 flex items-center justify-between border-b border-brand-black/10 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setDealView("opportunities")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] rounded-lg transition ${
              dealView === "opportunities"
                ? "bg-purple-100 text-purple-700 border border-purple-300"
                : "text-brand-black/60 hover:text-brand-black"
            }`}
          >
            Opportunities ({deals.filter(d => !d.stage).length})
          </button>
          <button
            onClick={() => setDealView("deals")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] rounded-lg transition ${
              dealView === "deals"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "text-brand-black/60 hover:text-brand-black"
            }`}
          >
            Deals ({deals.filter(d => d.stage).length})
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black"
        >
          <Plus className="h-4 w-4" />
          Add {dealView === "opportunities" ? "Opportunity" : "Deal"}
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {dealView === "deals" && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/10 bg-brand-white px-3 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
          >
            <option value="ALL">All Stages</option>
            <option value="NEW_LEAD">In discussion</option>
            <option value="NEGOTIATION">In discussion</option>
            <option value="CONTRACT_SENT">Awaiting contract</option>
            <option value="CONTRACT_SIGNED">Contract signed</option>
            <option value="DELIVERABLES_IN_PROGRESS">Live</option>
            <option value="PAYMENT_PENDING">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="LOST">Declined</option>
          </select>
        )}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-2xl border border-brand-black/10 bg-brand-white px-3 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
        >
          <option value="ALL">All Payment Status</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Awaiting">Awaiting</option>
          <option value="Pending">Pending</option>
        </select>
        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
          className="rounded-2xl border border-brand-black/10 bg-brand-white px-3 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
        >
          <option value="ALL">All Currencies</option>
          <option value="GBP">GBP</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="AUD">AUD</option>
          <option value="CAD">CAD</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-2xl border border-brand-black/10 bg-brand-white px-3 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
        >
          <option value="dueDate">Sort by Due Date</option>
          <option value="brand">Sort by Brand</option>
          <option value="stage">Sort by Stage</option>
          <option value="value">Sort by Value</option>
        </select>
      </div>

      {/* Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Total Pipeline</p>
          <p className="font-display text-xl uppercase text-brand-black">
            £{totals.pipelineValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Pending Deals</p>
          <p className="font-display text-xl uppercase text-brand-black">
            £{totals.pendingValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Confirmed Revenue</p>
          <p className="font-display text-xl uppercase text-brand-black">
            £{totals.confirmedRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Paid vs Unpaid</p>
          <p className="font-display text-xl uppercase text-brand-black">
            £{totals.paidValue.toLocaleString()} / £{totals.unpaidValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Avg Deal Value</p>
          <p className="font-display text-xl uppercase text-brand-black">
            £{totals.avgValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Largest Deal</p>
          <p className="font-display text-xl uppercase text-brand-black">
            £{totals.largestDeal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Closing This Month</p>
          <p className="font-display text-xl uppercase text-brand-black">
            {totals.closingThisMonth}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Total Deals</p>
          <p className="font-display text-xl uppercase text-brand-black">
            {sortedDeals.length}
          </p>
        </div>
      </div>

      {/* Deal Tracker Table */}
      {sortedDeals.length === 0 ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-brand-black/60">
            {deals.length === 0 
              ? "No deals found for this talent."
              : "No deals match the current filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-brand-white border-b border-brand-black/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Brand</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Scope of Work</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Currency</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Fee</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Stage</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Payment</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Notes</th>
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-center text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal) => {
                const scope = deal.aiSummary || deal.notes || "—";
                const dueDate = deal.expectedClose 
                  ? new Date(deal.expectedClose).toISOString().split('T')[0]
                  : "";
                const paymentStatus = getPaymentStatus(deal.stage);

                return (
                  <tr key={deal.id} className="border-b border-brand-black/5 hover:bg-brand-black/5 transition-colors">
                    {/* Brand */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-black">
                        {deal.brand?.name || deal.brandName || "—"}
                      </span>
                    </td>

                    {/* Scope of Work */}
                    <td className="px-4 py-3">
                      {editingDealId === deal.id && editingField === "scope" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditField(deal.id, "scope", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditField(deal.id, "scope", editValue);
                            if (e.key === "Escape") {
                              setEditingDealId(null);
                              setEditingField(null);
                              setEditValue("");
                            }
                          }}
                          autoFocus
                          className="w-full max-w-xs rounded-lg border border-brand-red bg-brand-white px-3 py-2 text-xs focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDealId(deal.id);
                            setEditingField("scope");
                            setEditValue(scope);
                          }}
                          className="text-brand-black/80 text-xs max-w-[200px] truncate block cursor-pointer hover:underline" 
                          title={scope}
                        >
                          {scope}
                        </span>
                      )}
                    </td>

                    {/* Currency */}
                    <td className="px-4 py-3">
                      {editingDealId === deal.id && editingField === "currency" ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditField(deal.id, "currency", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingDealId(null);
                              setEditingField(null);
                            }
                          }}
                          autoFocus
                          className="w-24 rounded-lg border border-brand-red bg-brand-white px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="GBP">GBP</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                        </select>
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDealId(deal.id);
                            setEditingField("currency");
                            setEditValue(deal.currency || "GBP");
                          }}
                          className="text-brand-black/60 uppercase text-xs cursor-pointer hover:underline"
                        >
                          {deal.currency || "GBP"}
                        </span>
                      )}
                    </td>

                    {/* Fee */}
                    <td className="px-4 py-3">
                      {editingDealId === deal.id && editingField === "fee" ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditField(deal.id, "fee", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditField(deal.id, "fee", editValue);
                            if (e.key === "Escape") {
                              setEditingDealId(null);
                              setEditingField(null);
                              setEditValue("");
                            }
                          }}
                          autoFocus
                          className="w-32 rounded-lg border border-brand-red bg-brand-white px-3 py-2 text-xs focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDealId(deal.id);
                            setEditingField("fee");
                            setEditValue(deal.value || "");
                          }}
                          className="font-medium text-brand-black cursor-pointer hover:underline"
                        >
                          {deal.value ? `${deal.currency || "GBP"} ${deal.value.toLocaleString()}` : "—"}
                        </span>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      {editingDealId === deal.id && editingField === "stage" ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditField(deal.id, "stage", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingDealId(null);
                              setEditingField(null);
                            }
                          }}
                          autoFocus
                          className="rounded-lg border border-brand-red bg-brand-white px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="">Clear Stage (Opportunity)</option>
                          <option value="NEW_LEAD">In discussion</option>
                          <option value="NEGOTIATION">Negotiation</option>
                          <option value="CONTRACT_SENT">Contract Sent</option>
                          <option value="CONTRACT_SIGNED">Contract Signed</option>
                          <option value="DELIVERABLES_IN_PROGRESS">Deliverables</option>
                          <option value="PAYMENT_PENDING">Payment Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="LOST">Declined</option>
                        </select>
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDealId(deal.id);
                            setEditingField("stage");
                            setEditValue(deal.stage || "");
                          }}
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] cursor-pointer hover:underline ${
                            deal.stage === "COMPLETED" ? "bg-green-100 text-green-700" :
                            deal.stage === "LOST" ? "bg-gray-100 text-gray-700" :
                            ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(deal.stage) ? "bg-blue-100 text-blue-700" :
                            deal.stage ? "bg-yellow-100 text-yellow-700" :
                            "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {deal.stage ? stageLabels[deal.stage] || deal.stage : "Opportunity"}
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      {editingDealId === deal.id && editingField === "expectedCloseDate" ? (
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditField(deal.id, "expectedCloseDate", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingDealId(null);
                              setEditingField(null);
                              setEditValue("");
                            }
                          }}
                          autoFocus
                          className="w-32 rounded-lg border border-brand-red bg-brand-white px-3 py-2 text-xs focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDealId(deal.id);
                            setEditingField("expectedCloseDate");
                            setEditValue(dueDate);
                          }}
                          className="text-brand-black/60 text-xs cursor-pointer hover:underline"
                        >
                          {dueDate || "—"}
                        </span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        paymentStatus === "Paid" ? "bg-green-100 text-green-700" :
                        paymentStatus === "Unpaid" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {paymentStatus}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3">
                      {editingDealId === deal.id && editingField === "notes" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditField(deal.id, "notes", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditField(deal.id, "notes", editValue);
                            if (e.key === "Escape") {
                              setEditingDealId(null);
                              setEditingField(null);
                              setEditValue("");
                            }
                          }}
                          autoFocus
                          className="w-full max-w-xs rounded-lg border border-brand-red bg-brand-white px-3 py-2 text-xs focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDealId(deal.id);
                            setEditingField("notes");
                            setEditValue(deal.notes || "");
                          }}
                          className="text-brand-black/60 text-xs max-w-[150px] truncate block cursor-pointer hover:underline" 
                          title={deal.notes || ""}
                        >
                          {deal.notes || "—"}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setDealToDelete(deal);
                            setDeleteModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center p-2 text-brand-black/60 hover:text-brand-red hover:bg-brand-red/5 rounded-lg transition"
                          title="Delete deal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Deal Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-3xl border border-brand-black/10 bg-brand-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 text-brand-black/40 hover:text-brand-black"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="mb-4 font-subtitle text-base uppercase tracking-[0.35em] text-brand-red">Create New Deal</h2>

            {/* Error Message */}
            {createError && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3">
                <p className="text-sm text-red-700">{createError}</p>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {/* Deal Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                  Deal Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter deal name"
                  value={createForm.dealName}
                  onChange={(e) => setCreateForm({...createForm, dealName: e.target.value})}
                  className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>

              {/* Brand Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                  Brand *
                </label>
                <select
                  value={createForm.brandId}
                  onChange={(e) => setCreateForm({...createForm, brandId: e.target.value})}
                  disabled={brandsLoading}
                  className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none disabled:opacity-50"
                >
                  <option value="">{brandsLoading ? "Loading brands..." : "Select a brand"}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                  Stage
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                >
                  <option value="NEW_LEAD">In discussion</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CONTRACT_SENT">Contract Sent</option>
                  <option value="CONTRACT_SIGNED">Contract Signed</option>
                  <option value="DELIVERABLES_IN_PROGRESS">Deliverables In Progress</option>
                  <option value="PAYMENT_PENDING">Payment Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="LOST">Declined</option>
                </select>
              </div>

              {/* Estimated Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                    Estimated Value
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={createForm.estimatedValue}
                    onChange={(e) => setCreateForm({...createForm, estimatedValue: e.target.value})}
                    className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                    Currency
                  </label>
                  <select
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({...createForm, currency: e.target.value})}
                    className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                  >
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              {/* Expected Close Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={createForm.expectedCloseDate}
                  onChange={(e) => setCreateForm({...createForm, expectedCloseDate: e.target.value})}
                  className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Add notes about this deal..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                  rows={3}
                  className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex-1 rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDeal}
                className="flex-1 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-black transition-colors"
              >
                Create Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Deal Confirmation Modal */}
      {deleteModalOpen && dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-3xl border border-brand-black/10 bg-brand-white p-8 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setDealToDelete(null);
              }}
              className="absolute right-4 top-4 text-brand-black/40 hover:text-brand-black"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center font-display text-lg text-brand-black mb-2">Delete deal?</h2>

            {/* Description */}
            <p className="text-center text-sm text-brand-black/60 mb-6">
              This will permanently delete the deal <span className="font-semibold text-brand-black">"{dealToDelete.brandName || dealToDelete.brand?.name || "Untitled"}"</span> with {dealToDelete.currency || "GBP"} {dealToDelete.value?.toLocaleString() || "0"}. This action cannot be undone.
            </p>

            {/* Error Message */}
            {deleteError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{deleteError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDealToDelete(null);
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="flex-1 rounded-lg border border-brand-black/10 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDeal}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Deal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CampaignsTab({ talentId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/campaigns`);
        if (response.ok) {
          const data = await response.json();
          setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Campaigns</p>
      {loading ? (
        <p className="text-brand-black/60">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <p className="text-brand-black/60">No campaigns found. This will be populated when Campaign model is updated with talentId.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{campaign.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ContractsTab({ talentId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/contracts`);
        if (response.ok) {
          const data = await response.json();
          const cnts = Array.isArray(data.contracts) ? data.contracts : [];
          setContracts(cnts);
        }
      } catch (err) {
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Contracts</p>
      {loading ? (
        <p className="text-brand-black/60">Loading contracts...</p>
      ) : contracts.length === 0 ? (
        <p className="text-brand-black/60">No contracts found. This will be populated when Contract model is updated with talentId.</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div key={contract.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{contract.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InboxTab({ talentId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/inbox`);
        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch (err) {
        console.error("Error fetching inbox:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Inbox</p>
      {loading ? (
        <p className="text-brand-black/60">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-brand-black/60">No messages found. Messages will appear here when talent is linked to a user account with Gmail connected.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{msg.subject || "No subject"}</p>
              <p className="text-xs text-brand-black/60 mt-1">{msg.snippet || msg.body?.substring(0, 100)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TasksTab({ talent }) {
  const tasks = talent.tasks || [];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Tasks</p>
      {tasks.length === 0 ? (
        <p className="text-brand-black/60">No tasks found for this talent.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-black">{task.title}</p>
                  <p className="text-xs text-brand-black/60 mt-1">Status: {task.status}</p>
                  {task.dueDate && (
                    <p className="text-xs text-brand-black/60 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {task.priority && (
                  <span className="rounded-full border border-brand-black/10 px-2 py-1 text-xs uppercase tracking-[0.2em]">
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RevenueTab({ talent, isExclusive }) {
  if (!isExclusive) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Revenue</p>
        <p className="text-brand-black/60">
          Revenue details are only available for Exclusive Talent.
        </p>
      </section>
    );
  }

  return <AdminRevenueManagement talentId={talent.id} />;
}

function CommerceTab({ talent, isExclusive }) {
  if (!isExclusive) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Commerce</p>
        <p className="text-brand-black/60">
          Commerce management is only available for Exclusive Talent.
        </p>
      </section>
    );
  }

  return <AdminRevenueManagement talentId={talent.id} isAdmin={true} />;
}

function DeliverablesTab({ talent }) {
  const deals = talent.deals || [];
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const allDeliverables = [];
        for (const deal of deals) {
          try {
            const response = await apiFetch(`/api/deliverables?dealId=${deal.id}`);
            if (response.ok) {
              const data = await response.json();
              const dealDeliverables = Array.isArray(data.deliverables) ? data.deliverables : [];
              allDeliverables.push(...dealDeliverables.map(d => ({ ...d, dealId: deal.id, dealBrand: deal.brand?.name || deal.brandName })));
            }
          } catch (err) {
            console.warn(`Error fetching deliverables for deal ${deal.id}:`, err);
          }
        }
        setDeliverables(allDeliverables);
      } catch (err) {
        console.error("Error fetching deliverables:", err);
      } finally {
        setLoading(false);
      }
    };
    if (deals.length > 0) {
      fetchDeliverables();
    } else {
      setLoading(false);
    }
  }, [deals]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Content Deliverables</p>
      {loading ? (
        <p className="text-brand-black/60">Loading deliverables...</p>
      ) : deliverables.length === 0 ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-brand-black/60 mb-2">No deliverables found.</p>
          <p className="text-xs text-brand-black/50">
            Deliverables will appear here when deals have content items assigned.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-brand-white border-b border-brand-black/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Deal / Brand</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Deliverable Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Platform</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((deliverable) => (
                <tr key={deliverable.id} className="border-b border-brand-black/5 hover:bg-brand-black/5">
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-black">{deliverable.dealBrand || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-black/80">{deliverable.title || deliverable.deliverableType || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-black/60 text-xs">
                      {deliverable.dueAt || deliverable.dueDate 
                        ? new Date(deliverable.dueAt || deliverable.dueDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      deliverable.approvedAt ? "bg-green-100 text-green-700" :
                      deliverable.status === "posted" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {deliverable.approvedAt ? "Approved" : deliverable.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-black/60 text-xs uppercase">
                      {deliverable.platform || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FilesTab({ talentId }) {
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Files & Assets</p>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
        <Archive className="h-12 w-12 text-brand-black/40 mx-auto mb-4" />
        <p className="text-brand-black/60 mb-2">Files & Assets</p>
        <p className="text-xs text-brand-black/50 mb-4">
          Coming soon: Media kit, rate card, past campaign assets, and press imagery will be available here.
        </p>
        <p className="text-xs text-brand-black/40">
          This section will support uploading and managing talent assets when the API endpoint is implemented.
        </p>
      </div>
    </section>
  );
}

function AccessControlTab({ talent }) {
  return (
    <TalentAccessSettings
      talentId={talent.id}
      talentName={talent.name}
      ownerId={talent.userId}
      managerId={talent.managerId}
      ownerEmail={talent.user?.email || "Unknown"}
      managerEmail={talent.Manager?.email || null}
    />
  );
}

function NotesTab({ talentId }) {
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Notes & History</p>
      <NotesIntelligenceSection
        context={{
          talentId,
        }}
        session={null}
      />
    </section>
  );
}

