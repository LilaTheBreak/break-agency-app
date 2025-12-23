import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { EditUserDrawer } from "../components/EditUserDrawer.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { getRecentUsers } from "../services/dashboardClient.js";
import { apiFetch } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Talent Manager", value: "TALENT_MANAGER" },
  { label: "Brand", value: "BRAND" },
  { label: "Exclusive Talent", value: "EXCLUSIVE_TALENT" },
  { label: "Creator", value: "CREATOR" },
  { label: "UGC Talent", value: "UGC_TALENT" }
];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  
  const [editingUser, setEditingUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [modalMode, setModalMode] = useState("edit");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [impersonating, setImpersonating] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        // Fetch more users for a user management page
        const data = await getRecentUsers(25);
        // Ensure data is always an array
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        // Set empty array on error to prevent crashes
        setUsers([]);
        // Set user-friendly error message
        if (err.message?.includes("403")) {
          setError("You don't have permission to view users");
        } else if (err.message?.includes("404")) {
          setError("Users not available yet");
        } else {
          setError("Unable to load users");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const closeModal = () => {
    setEditingUser(null);
    setDrawerOpen(false);
    setPendingRole("");
    setPendingEmail("");
    setPendingPassword("");
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      const response = await apiFetch(`/api/admin/users/${updatedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: updatedUser.name,
          secondaryEmail: updatedUser.secondaryEmail,
          photoUrl: updatedUser.photoUrl,
          role: updatedUser.role,
          onboarding_status: updatedUser.status,
          admin_notes: updatedUser.internalNotes,
          phoneNumber: updatedUser.phoneNumber,
          assignedPod: updatedUser.assignedPod,
          dashboardType: updatedUser.dashboardType
        })
      });
      
      if (!response.ok) throw new Error("Failed to update user");
      
      const result = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...result.user } : u))
      );
    } catch (error) {
      throw error;
    }
  };

  const handleArchiveUser = async (user) => {
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ onboarding_status: "archived" })
      });
      
      if (!response.ok) throw new Error("Failed to archive user");
      
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "archived", onboarding_status: "archived" } : u))
      );
    } catch (error) {
      throw error;
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ onboarding_status: "approved" })
      });
      
      if (!response.ok) throw new Error("Failed to restore user");
      
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "active", onboarding_status: "approved" } : u))
      );
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(user.email)}`, {
        method: "DELETE"
      });
      
      if (!response.ok) throw new Error("Failed to delete user");
      
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      throw error;
    }
  };

  const handleImpersonateUser = (user) => {
    setImpersonating(user);
    // TODO: Implement actual impersonation logic
    alert(`Impersonation feature coming soon. Would switch to ${user.email}'s view.`);
  };

  const handleExitImpersonation = () => {
    setImpersonating(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (modalMode === "add") {
      if (!pendingEmail || !pendingRole) return;
      try {
        const response = await apiFetch("/api/users", {
          method: "POST",
          body: JSON.stringify({ 
            email: pendingEmail, 
            role: pendingRole,
            password: pendingPassword || undefined
          })
        });
        if (!response.ok) throw new Error("Failed to create user");
        const user = await response.json();
        // Ensure prev is always an array
        setUsers((prev) => [user, ...(Array.isArray(prev) ? prev : [])]);
      } catch (error) {
        alert(error.message || "Unable to create user");
      }
    }
    closeModal();
  };

  const handleAdd = () => {
    setModalMode("add");
    setPendingEmail("");
    setPendingPassword("");
    setPendingRole(ROLE_OPTIONS[0].value);
    setEditingUser({ email: "", role: ROLE_OPTIONS[0].value });
  };

  const handleDelete = async (email) => {
    const confirmed = window.confirm(`Delete ${email}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers((prev) => (Array.isArray(prev) ? prev.filter((user) => user.email !== email) : []));
    } catch (error) {
      alert(error.message || "Unable to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const userStatus = user.status || user.onboarding_status || "active";
    if (showArchived) {
      return userStatus === "archived";
    }
    return userStatus !== "archived";
  });

  return (
    <DashboardShell
      title="Users"
      subtitle="Audit everyone who has logged in. View persona, activity, and quick edit actions."
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Impersonation Banner */}
      {impersonating && (
        <div className="mb-4 rounded-2xl border-2 border-purple-500 bg-purple-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👁</span>
              <div>
                <p className="font-semibold text-sm text-purple-900">
                  Viewing as {impersonating.email}
                </p>
                <p className="text-xs text-purple-700">
                  You're seeing the platform from their perspective
                </p>
              </div>
            </div>
            <button
              onClick={handleExitImpersonation}
              className="rounded-full bg-purple-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-purple-600"
            >
              Exit Impersonation
            </button>
          </div>
        </div>
      )}

      {/* Archive/Active Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
            !showArchived
              ? "bg-brand-black text-brand-white"
              : "border border-brand-black/30 text-brand-black/70 hover:border-brand-black/50"
          }`}
        >
          Active Users
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
            showArchived
              ? "bg-brand-black text-brand-white"
              : "border border-brand-black/30 text-brand-black/70 hover:border-brand-black/50"
          }`}
        >
          Archived Users
        </button>
        {showArchived && (
          <span className="ml-2 text-xs text-brand-black/60">
            ({filteredUsers.length} archived)
          </span>
        )}
      </div>

      <section className="rounded-3xl border border-brand-black/10 bg-brand-white">
        <table className="w-full text-left text-sm text-brand-black/80">
          <thead>
            <tr>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Email</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Roles</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Joined</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Status</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-right">
                {!showArchived && (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
                  >
                    Add user
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="p-4 text-center text-brand-black/60">Loading users...</td></tr>}
            {error && <tr><td colSpan="5" className="p-4 text-center text-brand-black/60">{error}</td></tr>}
            {!loading && !error && filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-brand-black/60">
                  {showArchived ? "No archived users" : "No users found"}
                </td>
              </tr>
            )}
            {!loading && !error && Array.isArray(filteredUsers) && filteredUsers.map((user) => {
              const userStatus = user.status || user.onboarding_status || "active";
              const statusColor = userStatus === "archived" ? "bg-gray-400" : userStatus === "suspended" ? "bg-red-500" : "bg-green-500";
              
              return (
                <tr key={user.id} className="border-b border-brand-black/5 hover:bg-brand-linen/30 transition-colors">
                  <td className="px-4 py-3">{user.email || "—"}</td>
                  <td className="px-4 py-3 capitalize">
                    {Array.isArray(user.roles) && user.roles.length > 0 
                      ? user.roles.map(r => r?.role?.name || "Unknown").join(", ")
                      : user.role || "—"}
                  </td>
                  <td className="px-4 py-3">{user.createdAt || user.created_at ? new Date(user.createdAt || user.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                      <span className="text-xs capitalize">{userStatus}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/users/${encodeURIComponent(user.email)}`}
                        className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
                      >
                        View
                      </Link>
                      <button
                        className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
                        onClick={() => {
                          setEditingUser(user);
                          setDrawerOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      {isSuperAdmin && !showArchived && (
                        <button
                          className="rounded-full border border-brand-red px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-red hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(user.email)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Edit User Drawer */}
      <EditUserDrawer
        user={editingUser}
        isOpen={drawerOpen}
        onClose={closeModal}
        onSave={handleSaveUser}
        onArchive={handleArchiveUser}
        onDelete={handleDeleteUser}
        onRestore={handleRestoreUser}
        onImpersonate={handleImpersonateUser}
      />

      {/* Add User Modal - Simple overlay for quick user creation */}
      {modalMode === "add" && editingUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[36px] border border-brand-black/10 bg-brand-white p-8 text-left text-brand-black shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <h3 className="font-display text-3xl uppercase">Add user</h3>
            <input
              type="email"
              value={pendingEmail}
              onChange={(e) => setPendingEmail(e.target.value.toLowerCase())}
              placeholder="user@example.com"
              className="mt-4 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              required
            />
            <input
              type="password"
              value={pendingPassword}
              onChange={(e) => setPendingPassword(e.target.value)}
              placeholder="Password (optional)"
              className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                User Role
              </label>
              <select
                value={pendingRole}
                onChange={(e) => setPendingRole(e.target.value)}
                className="w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-linen transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-black/90 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
