import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { isFeatureEnabled } from "../config/features.js";

const ROLE_OPTIONS = [
  { value: "SUPERADMIN", label: "Super Admin", description: "Full platform control" },
  { value: "ADMIN", label: "Admin", description: "Manage users & content" },
  { value: "AGENT", label: "Agent", description: "Talent management" },
  { value: "CREATOR", label: "Creator", description: "Content creator" },
  { value: "BRAND", label: "Brand", description: "Brand partner" },
  { value: "FOUNDER", label: "Founder", description: "Startup founder" },
  { value: "TALENT_MANAGER", label: "Talent Manager", description: "External manager" },
  { value: "EXCLUSIVE_TALENT", label: "Exclusive Talent", description: "VIP creator" }
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "archived", label: "Archived", color: "bg-gray-400" },
  { value: "suspended", label: "Suspended", color: "bg-red-500" }
];

function Section({ title, subtitle, children, className = "", superAdminOnly = false, isSuperAdmin = false }) {
  if (superAdminOnly && !isSuperAdmin) return null;
  
  return (
    <section className={`border-b border-brand-black/10 pb-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          {superAdminOnly && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider text-brand-red">
              Super Admin
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs text-brand-black/60">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, helper, readOnly = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/70">
        {label}
        {helper && <span className="ml-2 text-brand-black/50">({helper})</span>}
        {readOnly && <span className="ml-2 text-brand-black/40">Read-only</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, disabled, placeholder, type = "text", readOnly = false }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      disabled={disabled || readOnly}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full rounded-2xl border px-4 py-2 text-sm transition-colors ${
        disabled || readOnly
          ? "border-brand-black/10 bg-brand-linen/30 text-brand-black/50 cursor-not-allowed"
          : "border-brand-black/20 bg-brand-white focus:border-brand-black focus:outline-none"
      }`}
    />
  );
}

function Textarea({ value, onChange, disabled, placeholder, rows = 3, readOnly = false }) {
  return (
    <textarea
      value={value || ""}
      onChange={onChange}
      disabled={disabled || readOnly}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      className={`w-full rounded-2xl border px-4 py-2 text-sm transition-colors ${
        disabled || readOnly
          ? "border-brand-black/10 bg-brand-linen/30 text-brand-black/50 cursor-not-allowed"
          : "border-brand-black/20 bg-brand-white focus:border-brand-black focus:outline-none"
      }`}
    />
  );
}

function Select({ value, onChange, options, disabled = false, readOnly = false }) {
  return (
    <select
      value={value || ""}
      onChange={onChange}
      disabled={disabled || readOnly}
      className={`w-full rounded-2xl border px-4 py-2 text-sm transition-colors ${
        disabled || readOnly
          ? "border-brand-black/10 bg-brand-linen/30 text-brand-black/50 cursor-not-allowed"
          : "border-brand-black/20 bg-brand-white focus:border-brand-black focus:outline-none"
      }`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function EditUserDrawer({ user, isOpen, onClose, onSave, onArchive, onDelete, onRestore, onImpersonate }) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const isAdmin = currentUser?.role === "ADMIN" || isSuperAdmin;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    secondaryEmail: "",
    photoUrl: "",
    role: "",
    status: "active",
    assignedPod: "",
    dashboardType: "",
    internalNotes: "",
    phoneNumber: ""
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
        displayName: user.name || "",
        email: user.email || "",
        secondaryEmail: user.secondaryEmail || "",
        photoUrl: user.photoUrl || user.profilePhoto || "",
        role: user.role || "",
        status: user.status || user.onboarding_status || "active",
        assignedPod: user.assignedPod || "",
        dashboardType: user.dashboardType || "",
        internalNotes: user.admin_notes || user.internalNotes || "",
        phoneNumber: user.phoneNumber || ""
      });
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  }, [user]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...user,
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim() || formData.displayName
      });
      onClose();
    } catch (error) {
      alert(error.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm(`Archive ${user.email}? They will lose access but data will be preserved.`)) return;
    try {
      await onArchive(user);
      onClose();
    } catch (error) {
      alert(error.message || "Failed to archive user");
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== user.email) {
      alert("Please type the email address to confirm deletion");
      return;
    }
    try {
      await onDelete(user);
      onClose();
    } catch (error) {
      alert(error.message || "Failed to delete user");
    }
  };

  const handleRestore = async () => {
    if (!window.confirm(`Restore ${user.email}? They will regain access.`)) return;
    try {
      await onRestore(user);
      onClose();
    } catch (error) {
      alert(error.message || "Failed to restore user");
    }
  };

  const handleImpersonate = () => {
    if (!window.confirm(`View as ${user.email}? You will see the platform from their perspective.`)) return;
    onImpersonate(user);
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Send password reset email to ${user.email}?`)) return;
    // TODO: Implement password reset API call
    alert("Password reset email sent (TODO: implement)");
  };

  const handleForceLogout = async () => {
    if (!window.confirm(`Force logout ${user.email} from all sessions?`)) return;
    // TODO: Implement force logout API call
    alert("User logged out from all sessions (TODO: implement)");
  };

  if (!isOpen || !user) return null;

  const isArchived = formData.status === "archived";
  const currentRole = ROLE_OPTIONS.find(r => r.value === formData.role);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === formData.status);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-brand-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl overflow-y-auto border-l border-brand-black/10 bg-brand-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-brand-black/10 bg-brand-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-display text-3xl uppercase tracking-tight">Edit User</h2>
              <p className="mt-1 text-sm text-brand-black/60">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${currentStatus?.color || "bg-gray-400"}`} />
                <span className="text-xs uppercase tracking-wider text-brand-black/70">
                  {currentStatus?.label || formData.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-brand-black/20 p-2 hover:border-brand-black/40 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-0 px-8 py-6">
          {/* User Identity */}
          <Section title="User Identity" subtitle="Basic profile information">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name">
                  <Input
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    placeholder="John"
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    placeholder="Doe"
                  />
                </Field>
              </div>

              <Field label="Display Name">
                <Input
                  value={formData.displayName}
                  onChange={handleChange("displayName")}
                  placeholder="John Doe"
                />
              </Field>

              <Field label="Primary Email" readOnly>
                <Input
                  value={formData.email}
                  onChange={handleChange("email")}
                  type="email"
                  readOnly
                  disabled
                />
              </Field>

              <Field label="Secondary Email" helper="optional">
                <Input
                  value={formData.secondaryEmail}
                  onChange={handleChange("secondaryEmail")}
                  type="email"
                  placeholder="backup@example.com"
                />
              </Field>

              <Field label="Phone Number" helper="optional">
                <Input
                  value={formData.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                />
              </Field>

              <Field label="Profile Photo URL" helper="optional">
                <Input
                  value={formData.photoUrl}
                  onChange={handleChange("photoUrl")}
                  placeholder="https://..."
                />
              </Field>
            </div>
          </Section>

          {/* Access & Role */}
          <Section
            title="Access & Role"
            subtitle={isSuperAdmin ? "Manage user permissions and role" : "View user role (editing requires Super Admin)"}
            superAdminOnly={false}
            className="mt-6"
          >
            <div className="space-y-4">
              <Field label="User Role" readOnly={!isSuperAdmin}>
                <Select
                  value={formData.role}
                  onChange={handleChange("role")}
                  options={ROLE_OPTIONS}
                  disabled={!isSuperAdmin}
                  readOnly={!isSuperAdmin}
                />
                {currentRole && (
                  <p className="mt-1 text-xs text-brand-black/60">{currentRole.description}</p>
                )}
              </Field>

              <Field label="Status" readOnly={!isSuperAdmin}>
                <Select
                  value={formData.status}
                  onChange={handleChange("status")}
                  options={STATUS_OPTIONS}
                  disabled={!isSuperAdmin}
                  readOnly={!isSuperAdmin}
                />
              </Field>

              <Field label="Date Joined" readOnly>
                <Input
                  value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  }) : "—"}
                  readOnly
                  disabled
                />
              </Field>
            </div>
          </Section>

          {/* Security */}
          {isAdmin && (
            <Section title="Security" subtitle="Authentication and session management" className="mt-6">
              <div className="space-y-4">
                <Field label="Last Login" readOnly>
                  <Input
                    value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Login Method" readOnly>
                  <Input
                    value={user.oauthProvider || "Email"}
                    readOnly
                    disabled
                  />
                </Field>

                {/* Phase 6: Guard non-functional buttons with feature flags */}
                {isFeatureEnabled('USER_PASSWORD_RESET_ENABLED') && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleResetPassword}
                      className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
                    >
                      Send Password Reset Email
                    </button>
                  </div>
                )}

                {isFeatureEnabled('USER_FORCE_LOGOUT_ENABLED') && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleForceLogout}
                      className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
                    >
                      Force Logout from All Sessions
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* CRM & Platform Settings */}
          {isAdmin && (
            <Section title="CRM & Platform Settings" subtitle="Admin-only configuration" className="mt-6">
              <div className="space-y-4">
                <Field label="Assigned Pod/Team" helper="optional">
                  <Input
                    value={formData.assignedPod}
                    onChange={handleChange("assignedPod")}
                    placeholder="e.g., West Coast Team"
                  />
                </Field>

                <Field label="Default Dashboard" helper="optional">
                  <Select
                    value={formData.dashboardType}
                    onChange={handleChange("dashboardType")}
                    options={[
                      { value: "", label: "Default" },
                      { value: "creator", label: "Creator Dashboard" },
                      { value: "brand", label: "Brand Dashboard" },
                      { value: "admin", label: "Admin Dashboard" }
                    ]}
                  />
                </Field>

                <Field label="Internal Admin Notes" helper="never visible to user">
                  <Textarea
                    value={formData.internalNotes}
                    onChange={handleChange("internalNotes")}
                    placeholder="Add internal notes about this user..."
                    rows={4}
                  />
                </Field>
              </div>
            </Section>
          )}

          {/* Activity & Audit */}
          <Section title="Activity & Audit" subtitle="Read-only activity summary" className="mt-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-2">Recent Activity</p>
                <p className="text-sm text-brand-black/70">
                  Last active: {user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : "Unknown"}
                </p>
                <p className="text-sm text-brand-black/70 mt-1">
                  Created resources: {user.createdBrandsCount || 0} brands, {user.createdDealsCount || 0} deals
                </p>
              </div>
            </div>
          </Section>

          {/* View As User */}
          {isSuperAdmin && !isArchived && isFeatureEnabled('USER_IMPERSONATION_ENABLED') && (
            <Section title="Impersonation" subtitle="View platform as this user" superAdminOnly className="mt-6">
              <button
                onClick={handleImpersonate}
                className="w-full rounded-full bg-purple-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-purple-600 transition-colors"
              >
                👁 View As This User
              </button>
              <p className="mt-2 text-xs text-brand-black/60">
                You'll see a banner at the top. Click "Exit Impersonation" to return to your account.
              </p>
            </Section>
          )}

          {/* User Lifecycle - Danger Zone */}
          {isSuperAdmin && (
            <Section title="User Lifecycle" subtitle="Destructive actions - use with caution" superAdminOnly className="mt-6">
              <div className="space-y-4">
                {!isArchived ? (
                  <button
                    onClick={handleArchive}
                    className="w-full rounded-full border border-orange-500 px-4 py-3 text-xs uppercase tracking-[0.3em] text-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    📦 Archive User
                  </button>
                ) : (
                  <button
                    onClick={handleRestore}
                    className="w-full rounded-full border border-green-500 px-4 py-3 text-xs uppercase tracking-[0.3em] text-green-500 hover:bg-green-50 transition-colors"
                  >
                    ↩️ Restore User
                  </button>
                )}

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full rounded-full border border-brand-red px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red hover:bg-red-50 transition-colors"
                  >
                    🗑 Delete User (Hard Delete)
                  </button>
                ) : (
                  <div className="rounded-2xl border-2 border-brand-red bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-red mb-2">
                      ⚠️ Confirm Deletion
                    </p>
                    <p className="text-xs text-brand-black/70 mb-3">
                      This will permanently delete all user data. Type <strong>{user.email}</strong> to confirm:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type email address"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                        className="flex-1 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleteConfirmText !== user.email}
                        className="flex-1 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-brand-black/50 mt-2">
                  <strong>Archive</strong> preserves data but removes access. <strong>Delete</strong> is permanent and irreversible.
                </p>
              </div>
            </Section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-brand-black/10 bg-brand-white px-8 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-brand-black px-6 py-3 text-xs uppercase tracking-[0.3em] hover:bg-brand-linen transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
