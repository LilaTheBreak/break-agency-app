import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { getRecentUsers } from "../services/dashboardClient.js";
import { apiFetch } from "../services/apiClient.js";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Talent Manager", value: "TALENT_MANAGER" },
  { label: "Brand", value: "BRAND" },
  { label: "Exclusive Talent", value: "EXCLUSIVE_TALENT" },
  { label: "Creator", value: "CREATOR" },
  { label: "UGC Talent", value: "UGC_TALENT" }
];

export function AdminUsersPage() {
  const [editingUser, setEditingUser] = useState(null);
  const [pendingRole, setPendingRole] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [modalMode, setModalMode] = useState("edit");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    setPendingRole("");
    setPendingEmail("");
    setPendingPassword("");
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
    try { // This part requires a DELETE endpoint which doesn't exist yet.
      const response = await apiFetch(`/admin/users/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      // Ensure prev is always an array
      setUsers((prev) => (Array.isArray(prev) ? prev.filter((user) => user.email !== email) : []));
    } catch (error) {
      alert(error.message || "Unable to delete user");
    }
  };

  return (
    <DashboardShell
      title="Users"
      subtitle="Audit everyone who has logged in. View persona, activity, and quick edit actions."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white">
        <table className="w-full text-left text-sm text-brand-black/80">
          <thead>
            <tr>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Email</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Roles</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-red">Joined</th>
              <th className="border-b border-brand-black/10 px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Add user
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="4" className="p-4 text-center text-brand-black/60">Loading users...</td></tr>}
            {error && <tr><td colSpan="4" className="p-4 text-center text-brand-black/60">{error}</td></tr>}
            {!loading && !error && users.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-brand-black/60">No users found</td></tr>}
            {!loading && !error && Array.isArray(users) && users.map((user) => (
                <tr key={user.id} className="border-b border-brand-black/5">
                  <td className="px-4 py-3">{user.email || "—"}</td>
                  <td className="px-4 py-3 capitalize">
                    {Array.isArray(user.roles) && user.roles.length > 0 ? user.roles.map(r => r?.role?.name || "Unknown").join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/users/${encodeURIComponent(user.email)}`}
                        className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                      >
                        View
                      </Link>
                      <button
                        className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                        onClick={() => {
                          setEditingUser(user);
                          setPendingRole(user.roles?.[0]?.role.name || "");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-brand-red px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-red"
                        onClick={() => handleDelete(user.email)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {editingUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-white p-4">
          <div className="w-full max-w-lg rounded-[36px] border border-brand-black/10 bg-brand-white p-8 text-left text-brand-black shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <h3 className="font-display text-3xl uppercase">
              {modalMode === "add" ? "Add user" : "Edit user"}
            </h3>
            {modalMode === "add" ? (
              <>
                <input
                  type="email"
                  value={pendingEmail}
                  onChange={(e) => setPendingEmail(e.target.value.toLowerCase())}
                  placeholder="user@example.com"
                  className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  required
                />
                <input
                  type="password"
                  value={pendingPassword}
                  onChange={(e) => setPendingPassword(e.target.value)}
                  placeholder="Password (optional)"
                  className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </>
            ) : (
              <p className="text-sm text-brand-black/70">{editingUser.email}</p>
            )}
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Change user type
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
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Other edits
              </label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                placeholder="Notes, flags, permissions..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
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
      ) : null}
    </DashboardShell>
  );
}
