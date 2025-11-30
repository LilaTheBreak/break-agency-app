import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Talent Manager", value: "TALENT_MANAGER" },
  { label: "Brand", value: "BRAND" },
  { label: "Exclusive Talent", value: "EXCLUSIVE_TALENT" },
  { label: "Creator", value: "CREATOR" },
  { label: "UGC Talent", value: "UGC_TALENT" }
];

const USERS = [
  { email: "lila@thebreakco.com", role: "ADMIN", lastActive: "2m ago" },
  { email: "mo@thebreakco.com", role: "ADMIN", lastActive: "1h ago" },
  { email: "brand@client.com", role: "BRAND", lastActive: "Today" },
  { email: "exclusive@talent.com", role: "EXCLUSIVE_TALENT", lastActive: "Yesterday" },
  { email: "ugc@creator.com", role: "UGC_TALENT", lastActive: "3d ago" }
];

export function AdminUsersPage() {
  const [editingUser, setEditingUser] = useState(null);
  const [pendingRole, setPendingRole] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [modalMode, setModalMode] = useState("edit");
  const [users, setUsers] = useState(USERS);

  const closeModal = () => {
    setEditingUser(null);
    setPendingRole("");
    setPendingEmail("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (modalMode === "add") {
      if (!pendingEmail || !pendingRole) return;
      try {
        const response = await apiFetch("/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail, role: pendingRole })
        });
        if (!response.ok) throw new Error("Failed to create user");
        const { user } = await response.json();
        setUsers((prev) => [
          ...prev,
          { email: user.email, role: user.role, lastActive: "Just now" }
        ]);
      } catch (error) {
        alert(error.message || "Unable to create user");
      }
    }
    closeModal();
  };

  const handleAdd = () => {
    setModalMode("add");
    setPendingEmail("");
    setPendingRole(ROLE_OPTIONS[0].value);
    setEditingUser({ email: "", role: ROLE_OPTIONS[0].value });
  };

  const handleDelete = async (email) => {
    const confirmed = window.confirm(`Delete ${email}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const response = await apiFetch(`/admin/users/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers((prev) => prev.filter((user) => user.email !== email));
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
            <tr className="border-b border-brand-black/10 text-xs uppercase tracking-[0.3em] text-brand-red">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
          <div className="flex justify-end px-4 py-3">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Add user
            </button>
          </div>
          {users.map((user) => (
              <tr key={user.email} className="border-b border-brand-black/5">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{ROLE_OPTIONS.find((r) => r.value === user.role)?.label || user.role}</td>
                <td className="px-4 py-3">{user.lastActive}</td>
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
                        setPendingRole(user.role);
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[36px] border border-brand-black/10 bg-brand-white p-8 text-left text-brand-black shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <h3 className="font-display text-3xl uppercase">
              {modalMode === "add" ? "Add user" : "Edit user"}
            </h3>
            {modalMode === "add" ? (
              <input
                type="email"
                value={pendingEmail}
                onChange={(e) => setPendingEmail(e.target.value.toLowerCase())}
                placeholder="user@example.com"
                className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                required
              />
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
