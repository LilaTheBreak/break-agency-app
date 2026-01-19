import { useState, useEffect } from "react";
import { isFeatureEnabled } from "../config/features.js";
import { ComingSoon } from "../components/ComingSoon.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const categoryConfig = {
  EVENT_INVITE: { label: "Event Invites" },
  BRAND_OPPORTUNITY: { label: "Brand Opportunities" },
  COLLABORATION_REQUEST: { label: "Collaboration Requests" },
  INBOUND_BRAND_INTEREST: { label: "Inbound Brand Interest" },
};

const statusConfig = {
  NEW: { label: "New" },
  REPLIED: { label: "Replied" },
  DECLINED: { label: "Declined" },
  NEGOTIATING: { label: "Negotiating" },
  AWAITING_BRIEF: { label: "Awaiting Brief" },
  IN_PROGRESS: { label: "In Progress" },
  ARCHIVED: { label: "Archived" },
};

export default function EmailOpportunities() {
  if (!isFeatureEnabled('CREATOR_OPPORTUNITIES_ENABLED')) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <ComingSoon
          feature="CREATOR_OPPORTUNITIES_ENABLED"
          title="Email Opportunities"
          description="Automatically scan and classify brand opportunities from your Gmail inbox"
        />
      </div>
    );
  }

  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOpportunities();
    fetchStats();
  }, [selectedCategory, selectedStatus, showUrgentOnly]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (showUrgentOnly) params.append("urgent", "true");

      const response = await fetch(`${API_BASE_URL}/api/email-opportunities?${params}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch opportunities");
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("JSON parse error:", e);
        data = [];
      }
      setOpportunities(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email-opportunities/stats/summary`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch stats");
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("JSON parse error:", e);
        data = {};
      }
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const scanInbox = async () => {
    try {
      setScanning(true);
      const response = await fetch(`${API_BASE_URL}/api/inbox/rescan`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to scan inbox");
      
      // Refresh opportunities after scanning
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchOpportunities();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const updateOpportunity = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email-opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update opportunity");
      await fetchOpportunities();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        opp.subject?.toLowerCase().includes(query) ||
        opp.brandName?.toLowerCase().includes(query) ||
        opp.from?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-12">
      {/* Header */}
      <div className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Inbox scanning</p>
            <h1 className="font-display text-3xl uppercase">Email Opportunities</h1>
            <p className="mt-2 text-sm text-brand-black/70">AI-powered inbox scanning for creator opportunities</p>
          </div>
          <button
            onClick={scanInbox}
            disabled={scanning}
            className={`flex-shrink-0 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
              scanning
                ? "bg-brand-black/30 text-brand-white cursor-not-allowed"
                : "bg-brand-red text-brand-white hover:bg-brand-red/90"
            }`}
          >
            {scanning ? "Scanning..." : "+ Scan Inbox"}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-brand-red/30 bg-brand-red/10 p-4">
            <span className="flex-shrink-0 text-xl">!</span>
            <p className="text-sm font-medium text-brand-black">{error}</p>
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Total</p>
            <p className="mt-2 font-display text-2xl uppercase text-brand-black">{stats.total || 0}</p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Urgent</p>
            <p className="mt-2 font-display text-2xl uppercase text-brand-red">{stats.urgent || 0}</p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">New</p>
            <p className="mt-2 font-display text-2xl uppercase text-brand-black">{stats.byStatus?.NEW || 0}</p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">In Progress</p>
            <p className="mt-2 font-display text-2xl uppercase text-brand-black">{stats.byStatus?.IN_PROGRESS || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-brand-black/10 bg-brand-white p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Filters</p>
        <div className="flex flex-col gap-3 md:flex-row md:gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            <option value="ALL">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject, brand, or sender..."
            className="flex-1 rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />

          {/* Urgent Toggle */}
          <label className="flex items-center gap-2 rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 cursor-pointer hover:bg-brand-linen/50 transition-colors">
            <input
              type="checkbox"
              checked={showUrgentOnly}
              onChange={(e) => setShowUrgentOnly(e.target.checked)}
              className="h-4 w-4 accent-brand-red"
            />
            <span className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.2em] text-brand-black/70">Urgent Only</span>
          </label>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/20 border-t-brand-black"></div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-brand-black/70">No opportunities found</p>
            <p className="mt-2 text-xs text-brand-black/50">Try scanning your inbox or adjusting filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                onClick={() => setSelectedOpportunity(opportunity)}
                className="cursor-pointer rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 transition-colors hover:bg-brand-linen/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-brand-black">{opportunity.subject}</h3>
                      {opportunity.isUrgent && (
                        <span className="flex-shrink-0 rounded-full bg-brand-red/20 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand-red">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-brand-black/60">
                      <span>{opportunity.from}</span>
                      <span>•</span>
                      <span>{new Date(opportunity.receivedAt).toLocaleDateString()}</span>
                      {opportunity.brandName && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-brand-black">{opportunity.brandName}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full border border-brand-black/20 bg-brand-white px-2 py-1 text-xs font-medium text-brand-black/70">
                        {statusConfig[opportunity.status]?.label || opportunity.status}
                      </span>
                      <span className="rounded-full border border-brand-black/20 bg-brand-white px-2 py-1 text-xs font-medium text-brand-black/70">
                        {Math.round(opportunity.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOpportunity && (
        <div 
          className="fixed inset-0 z-50 grid place-items-center bg-brand-black/20 backdrop-blur-sm p-4"
          onClick={() => setSelectedOpportunity(null)}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-brand-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl uppercase mb-2">{selectedOpportunity.subject}</h2>
                <p className="text-sm text-brand-black/70 mb-2">{selectedOpportunity.from}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="rounded-full border border-brand-black/20 bg-brand-linen/50 px-3 py-1 text-xs font-medium">
                    {statusConfig[selectedOpportunity.status]?.label || selectedOpportunity.status}
                  </span>
                  {selectedOpportunity.isUrgent && (
                    <span className="rounded-full bg-brand-red/20 px-3 py-1 text-xs font-semibold text-brand-red uppercase tracking-[0.1em]">
                      Urgent
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="flex-shrink-0 rounded-full border border-brand-black/20 px-3 py-2 font-semibold uppercase tracking-[0.2em] hover:bg-brand-linen/50 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 border-t border-brand-black/10 pt-6">
              {selectedOpportunity.brandName && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Brand</p>
                  <p className="mt-2 font-semibold text-brand-black">{selectedOpportunity.brandName}</p>
                </div>
              )}

              {selectedOpportunity.opportunityType && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Type</p>
                  <p className="mt-2 text-brand-black">{selectedOpportunity.opportunityType}</p>
                </div>
              )}

              {selectedOpportunity.deliverables && selectedOpportunity.deliverables.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Deliverables</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-brand-black">
                    {selectedOpportunity.deliverables.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOpportunity.paymentDetails && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Payment</p>
                  <p className="mt-2 font-semibold text-brand-red">{selectedOpportunity.paymentDetails}</p>
                </div>
              )}

              {selectedOpportunity.dates && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Dates</p>
                  <p className="mt-2 text-brand-black">{selectedOpportunity.dates}</p>
                </div>
              )}

              {selectedOpportunity.emailBody && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Message</p>
                  <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-brand-black/80 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                    {selectedOpportunity.emailBody}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 pt-6 border-t border-brand-black/10">
              <button
                onClick={() => {
                  updateOpportunity(selectedOpportunity.id, { status: "REPLIED" });
                  setSelectedOpportunity(null);
                }}
                className="flex-1 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
              >
                Mark Replied
              </button>
              <button
                onClick={() => {
                  updateOpportunity(selectedOpportunity.id, { status: "DECLINED" });
                  setSelectedOpportunity(null);
                }}
                className="flex-1 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
              >
                Mark Declined
              </button>
              <button
                onClick={() => {
                  updateOpportunity(selectedOpportunity.id, { status: "ARCHIVED" });
                  setSelectedOpportunity(null);
                }}
                className="flex-1 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-brand-white transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
