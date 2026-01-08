import React, { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * TalentAccessSettings
 *
 * Admin panel for managing talent access control:
 * - Grant/revoke VIEW access to talent details
 * - Grant/revoke MANAGE access (edit, delete, assign to deals)
 * - Role-based defaults: superadmins auto-have access, managers see only assigned
 * 
 * @typedef {Object} AccessUser
 * @property {string} id
 * @property {string} email
 * @property {("VIEW"|"MANAGE")} [role]
 * @property {boolean} canRemove
 * @property {string} [reason]
 * 
 * @typedef {Object} TalentAccessSettingsProps
 * @property {string} talentId
 * @property {string} talentName
 * @property {string} ownerId
 * @property {string|null} managerId
 * @property {string} ownerEmail
 * @property {string|null} managerEmail
 */

export function TalentAccessSettings({
  talentId,
  talentName,
  ownerId,
  managerId,
  ownerEmail,
  managerEmail,
}) {
  const [users, setUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("VIEW");
  const [saving, setSaving] = useState(false);

  // Load current access list
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/api/talent/${talentId}/access-list`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setUsers(data.users || []);
        setAvailableUsers(data.available || []);
      } catch (err) {
        console.error("[TalentAccessSettings]", err);
        setError("Failed to load access settings");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [talentId]);

  const handleAddAccess = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await apiFetch(
        `/api/talent/${talentId}/access-set`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser,
            role: selectedRole,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to update access");
      }

      // Refresh list
      const listResponse = await apiFetch(
        `/api/talent/${talentId}/access-list`
      );
      const data = await listResponse.json();
      setUsers(data.users || []);
      setAvailableUsers(data.available || []);
      setSelectedUser("");
      setSelectedRole("VIEW");
    } catch (err) {
      console.error("[TalentAccessSettings]", err);
      setError(err instanceof Error ? err.message : "Failed to update access");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAccess = async (userId) => {
    try {
      setSaving(true);
      const response = await apiFetch(
        `/api/talent/${talentId}/access-revoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke access");
      }

      // Refresh list
      const listResponse = await apiFetch(
        `/api/talent/${talentId}/access-list`
      );
      const data = await listResponse.json();
      setUsers(data.users || []);
      setAvailableUsers(data.available || []);
    } catch (err) {
      console.error("[TalentAccessSettings]", err);
      setError(err instanceof Error ? err.message : "Failed to revoke access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
        <p className="text-sm text-brand-black/60">
          Loading access settings…
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">
          Access Control
        </p>
        <h3 className="font-display text-2xl uppercase text-brand-black">
          Manage Talent Access
        </h3>
        <p className="mt-2 text-sm text-brand-black/60">
          Talent: <strong>{talentName}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-brand-red/30 bg-brand-red/5 p-3 mb-4">
          <p className="text-sm text-brand-red">{error}</p>
        </div>
      )}

      {/* Current Users with Access */}
      <div className="mb-6">
        <h4 className="font-semibold text-brand-black text-sm mb-3">
          Current Access ({users.length})
        </h4>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-brand-black/10 p-3 bg-brand-white"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-black">
                  {user.email}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 items-center">
                  <span className="text-[0.65rem] uppercase tracking-[0.35em] px-2 py-1 rounded-full bg-brand-red/10 text-brand-red font-semibold">
                    {user.role === "MANAGE" ? "Can Manage" : "Can View"}
                  </span>
                  {user.reason && (
                    <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
                      ({user.reason})
                    </span>
                  )}
                </div>
              </div>
              {user.canRemove && (
                <button
                  onClick={() => handleRemoveAccess(user.id)}
                  disabled={saving}
                  className="ml-3 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-red hover:bg-brand-red/5 rounded transition disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {users.length === 0 && (
            <div className="rounded-lg border border-brand-black/10 bg-brand-linen/40 p-3">
              <p className="text-sm text-brand-black/60">
                No explicit access granted. Superadmins and the talent owner
                always have access.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Access */}
      <div className="rounded-lg border border-brand-black/10 bg-brand-linen/40 p-4">
        <h4 className="font-semibold text-brand-black text-sm mb-3">
          Grant Access
        </h4>
        <div className="space-y-3">
          {/* User Selection */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70 font-semibold mb-2">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={saving || availableUsers.length === 0}
              className="w-full rounded-lg border border-brand-black/20 bg-brand-white px-3 py-2 text-sm text-brand-black placeholder-brand-black/40 focus:outline-none focus:ring-2 focus:ring-brand-red/50 disabled:opacity-50"
            >
              <option value="">Choose a user…</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="text-[0.65rem] text-brand-black/50 mt-2">
                All users already have access to this talent.
              </p>
            )}
          </div>

          {/* Role Selection */}
          {selectedUser && (
            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70 font-semibold mb-2">
                Access Level
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="VIEW"
                    checked={selectedRole === "VIEW"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="rounded border-brand-black/20"
                  />
                  <span className="text-sm text-brand-black">
                    Can View (read-only)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="MANAGE"
                    checked={selectedRole === "MANAGE"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="rounded border-brand-black/20"
                  />
                  <span className="text-sm text-brand-black">
                    Can Manage (edit, delete)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={handleAddAccess}
            disabled={!selectedUser || saving}
            className="w-full rounded-lg bg-brand-red px-3 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-red/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Updating…" : "Grant Access"}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg bg-brand-linen/40 p-4">
        <p className="text-[0.65rem] uppercase tracking-[0.35em] font-semibold text-brand-black/70 mb-2">
          Access Rules
        </p>
        <ul className="text-xs text-brand-black/60 space-y-1">
          <li>• <strong>Owner</strong> ({ownerEmail}) always has full access</li>
          <li>
            • <strong>Manager</strong> {managerEmail ? `(${managerEmail})` : "(unassigned)"} always can edit
          </li>
          <li>• <strong>Superadmins</strong> always have access to all talent</li>
          <li>
            • <strong>VIEW</strong> = Can see talent details and deals (read-only)
          </li>
          <li>
            • <strong>MANAGE</strong> = Can edit talent, assign/unassign from deals
          </li>
        </ul>
      </div>
    </section>
  );
}
