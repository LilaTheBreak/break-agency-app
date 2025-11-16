import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const USERS = [
  { email: "lila@thebreakco.com", role: "admin", lastActive: "2m ago" },
  { email: "mo@thebreakco.com", role: "admin", lastActive: "1h ago" },
  { email: "brand@client.com", role: "brand", lastActive: "Today" },
  { email: "exclusive@talent.com", role: "exclusive-talent", lastActive: "Yesterday" },
  { email: "ugc@creator.com", role: "ugc-creator", lastActive: "3d ago" }
];

export function AdminUsersPage() {
  const [editingUser, setEditingUser] = useState(null);
  const [pendingRole, setPendingRole] = useState("");

  const closeModal = () => {
    setEditingUser(null);
    setPendingRole("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    closeModal();
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
            {USERS.map((user) => (
              <tr key={user.email} className="border-b border-brand-black/5">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role.replace("-", " ")}</td>
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editingUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[36px] border border-brand-black/15 bg-brand-white p-8 text-left text-brand-black shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <h3 className="font-display text-3xl uppercase">Edit user</h3>
            <p className="text-sm text-brand-black/70">{editingUser.email}</p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Change user type
              </label>
              <select
                value={pendingRole}
                onChange={(e) => setPendingRole(e.target.value)}
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                {["admin", "exclusive-talent", "non-exclusive-talent", "ugc-creator", "brand"].map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Other edits
              </label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
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
