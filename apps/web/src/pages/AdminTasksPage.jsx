import React, { useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

// TODO: Replace with real tasks from API once Task model is implemented
const TASKS = [];

const STATUS_OPTIONS = ["All statuses", "Pending", "In progress", "Awaiting release", "Complete"];

export function AdminTasksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [brandFilter, setBrandFilter] = useState("All brands");
  const [ownerFilter, setOwnerFilter] = useState("All owners");

  const brands = useMemo(() => ["All brands", ...new Set(TASKS.map((task) => task.brand))], []);
  const owners = useMemo(() => ["All owners", ...new Set(TASKS.map((task) => task.owner))], []);

  const tasks = useMemo(() => {
    return TASKS.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.brand.toLowerCase().includes(search.toLowerCase()) ||
        task.owner.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All statuses" || task.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesBrand = brandFilter === "All brands" || task.brand === brandFilter;
      const matchesOwner = ownerFilter === "All owners" || task.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesBrand && matchesOwner;
    });
  }, [search, statusFilter, brandFilter, ownerFilter]);

  const handleDelete = (id) => {
    alert(`Delete task ${id} (hook up API call here).`);
  };

  return (
    <DashboardShell
      title="Tasks"
      subtitle="Search, filter, and dispatch tasks across the Break platform."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Global search"
            className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            {brands.map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            {owners.map((owner) => (
              <option key={owner}>{owner}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="mt-4 w-full text-left text-sm text-brand-black/80">
            <thead>
              <tr className="border-b border-brand-black/10 text-xs uppercase tracking-[0.3em] text-brand-red">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-brand-black/5">
                  <td className="px-4 py-3 font-semibold text-brand-black">{task.title}</td>
                  <td className="px-4 py-3">{task.brand}</td>
                  <td className="px-4 py-3">{task.owner}</td>
                  <td className="px-4 py-3">{task.status}</td>
                  <td className="px-4 py-3">{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]">
                        View
                      </button>
                      <button
                        className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-brand-red px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-red"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-brand-black/60">No tasks match your filters.</p>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}

export default AdminTasksPage;
