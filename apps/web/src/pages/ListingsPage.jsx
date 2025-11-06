import React, { useEffect, useMemo, useState } from "react";

import { createListing, getListing, getListings, getListingViewings } from "../api/client.js";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Coming soon", value: "COMING_SOON" },
  { label: "Active", value: "ACTIVE" },
  { label: "Under offer", value: "UNDER_OFFER" },
  { label: "Sold", value: "SOLD" },
  { label: "Withdrawn", value: "WITHDRAWN" }
];

const PAGE_SIZE = 20;

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export default function ListingsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({ items: [], total: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewings, setViewings] = useState([]);
  const [creating, setCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const targetListing = window.sessionStorage?.getItem("crm:targetListing");
      if (targetListing) {
        window.sessionStorage.removeItem("crm:targetListing");
        setSelectedId(targetListing);
        setPage(1);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getListings({
      status: status || undefined,
      q: search || undefined,
      page,
      pageSize: PAGE_SIZE
    })
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || "Failed to load listings");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [status, search, page]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setViewings([]);
      return;
    }
    let cancelled = false;
    Promise.all([getListing(selectedId), getListingViewings(selectedId)])
      .then(([listing, viewingsRes]) => {
        if (!cancelled) {
          setSelected(listing);
          setViewings(viewingsRes);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load listing");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const pages = useMemo(() => {
    if (!data.total) return 1;
    return Math.ceil(data.total / PAGE_SIZE);
  }, [data.total]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      refCode: form.get("refCode"),
      status: form.get("status"),
      priceGuide: Number(form.get("priceGuide")),
      beds: Number(form.get("beds")),
      baths: Number(form.get("baths")),
      sqft: form.get("sqft") ? Number(form.get("sqft")) : undefined,
      address: {
        line1: form.get("line1"),
        line2: form.get("line2") || undefined,
        city: form.get("city"),
        postcode: form.get("postcode")
      },
      description: form.get("description") || undefined,
      features: form.get("features")
        ? form
            .get("features")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    };

    setCreating(true);
    setError("");
    try {
      const listing = await createListing(payload);
      setShowNewForm(false);
      setPage(1);
      setSelectedId(listing.id);
      // trigger refresh
      const latest = await getListings({ page: 1, pageSize: PAGE_SIZE });
      setData(latest);
    } catch (err) {
      setError(err.message || "Failed to create listing");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr] xl:grid-cols-[3fr,2fr]">
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Listings</h1>
            <p className="text-slate-400 text-sm">Centralised view of all properties and their progression.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewForm(true)}
              className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition"
            >
              New listing
            </button>
          </div>
        </header>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-sm text-slate-400">Search</span>
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="Address, ref code, description..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price guide</th>
                  <th className="px-4 py-3 font-medium">Beds/Baths</th>
                  <th className="px-4 py-3 font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {data.items.map((listing) => (
                  <tr
                    key={listing.id}
                    onClick={() => setSelectedId(listing.id)}
                    className={
                      "cursor-pointer transition hover:bg-white/5 " +
                      (selectedId === listing.id ? "bg-emerald-500/10" : "")
                    }
                  >
                    <td className="px-4 py-3 font-semibold text-white">{listing.refCode}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{listing.address?.line1}</div>
                      <div className="text-xs text-slate-500">
                        {[listing.address?.city, listing.address?.postcode].filter(Boolean).join(", ")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={listing.status} />
                    </td>
                    <td className="px-4 py-3">{formatCurrency(listing.priceGuide)}</td>
                    <td className="px-4 py-3">
                      {listing.beds} / {listing.baths}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(listing.updatedAt || listing.createdAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="border-t border-white/5 px-4 py-3 text-sm text-slate-400">Loading listings…</div>
          )}
          {error && (
            <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {!loading && !data.items.length && (
            <div className="border-t border-white/5 px-4 py-10 text-center text-sm text-slate-400">
              No listings found. Adjust filters or create a new listing.
            </div>
          )}
          <footer className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs text-slate-400">
            <span>
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </footer>
        </div>
      </section>

      <aside className="space-y-4">
        {selected ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold text-white">{selected.address?.line1 || selected.refCode}</h2>
            <div className="mt-2 text-sm text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">Ref:</span> {selected.refCode}
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                <StatusBadge status={selected.status} />
              </div>
              <div>
                <span className="text-slate-500">Guide price:</span> {formatCurrency(selected.priceGuide)}
              </div>
              <div>
                <span className="text-slate-500">Beds/Baths:</span> {selected.beds} / {selected.baths}
              </div>
              <div>
                <span className="text-slate-500">Negotiator:</span>{" "}
                {selected.negotiator ? selected.negotiator.name : "Unassigned"}
              </div>
              <div>
                <span className="text-slate-500">Owner:</span>{" "}
                {selected.ownerContact ? selected.ownerContact.name : "Not linked"}
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-300">
              <p>{selected.description || "No description added yet."}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-medium text-white">Recent viewings</div>
              <div className="mt-2 space-y-2 text-xs text-slate-400">
                {viewings.slice(0, 5).map((viewing) => (
                  <div key={viewing.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="font-medium text-slate-200">
                      {new Date(viewing.start).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </div>
                    <div>Status: <StatusBadge status={viewing.status} size="sm" /></div>
                    {viewing.attendees.length ? (
                      <div className="mt-1 text-slate-400">
                        {viewing.attendees.map((att) => att.contact?.name || att.user?.name).filter(Boolean).join(", ")}
                      </div>
                    ) : (
                      <div className="mt-1 text-slate-500">No attendees recorded</div>
                    )}
                  </div>
                ))}
                {!viewings.length && <div>No viewings logged yet.</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
            Select a listing to see its summary, stakeholders, and recent activity.
          </div>
        )}

        {showNewForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-5 space-y-3 text-sm text-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Create listing</h3>
              <button type="button" onClick={() => setShowNewForm(false)} className="text-xs text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Ref code
                <input
                  name="refCode"
                  required
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Status
                <select
                  name="status"
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                  defaultValue="ACTIVE"
                >
                  {STATUS_OPTIONS.filter((o) => o.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Price guide (£)
                <input
                  name="priceGuide"
                  type="number"
                  required
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Beds
                <input
                  name="beds"
                  type="number"
                  min={0}
                  required
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Baths
                <input
                  name="baths"
                  type="number"
                  min={0}
                  required
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Sqft (optional)
                <input
                  name="sqft"
                  type="number"
                  min={0}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Address line 1
                <input
                  name="line1"
                  required
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Address line 2
                <input
                  name="line2"
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                  City
                  <input
                    name="city"
                    required
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                  Postcode
                  <input
                    name="postcode"
                    required
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </label>
              </div>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Features (comma separated)
                <input
                  name="features"
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs uppercase tracking-wide text-emerald-200">
                Description
                <textarea
                  name="description"
                  rows={3}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create listing"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

function StatusBadge({ status, size = "md" }) {
  const styles = {
    COMING_SOON: "bg-blue-500/10 text-blue-200 border-blue-500/30",
    ACTIVE: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    UNDER_OFFER: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    SOLD: "bg-purple-500/20 text-purple-100 border-purple-500/30",
    WITHDRAWN: "bg-slate-500/15 text-slate-200 border-slate-400/30",
    REQUESTED: "bg-slate-500/15 text-slate-200 border-slate-400/30",
    CONFIRMED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    CANCELLED: "bg-red-500/15 text-red-200 border-red-500/30",
    COMPLETED: "bg-purple-500/20 text-purple-100 border-purple-500/30"
  };
  const className = [
    "inline-flex items-center gap-2 rounded-full border px-3",
    size === "sm" ? "py-0.5 text-xs" : "py-1 text-sm",
    styles[status] || "bg-white/10 text-slate-200 border-white/20"
  ].join(" ");
  return <span className={className}>{status.replace(/_/g, " ")}</span>;
}
