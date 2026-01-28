import React, { useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import toast from "react-hot-toast";

const FILTERS = ["Unreviewed", "Approved", "Dismissed", "All"];

export function AdminOpportunitiesInboxPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Unreviewed");
  const [selectedOpp, setSelectedOpp] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, [activeFilter]);

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const statusMap = {
        "Unreviewed": "unreviewed",
        "Approved": "approved",
        "Dismissed": "dismissed",
        "All": "all"
      };
      
      const status = statusMap[activeFilter];
      const url = status === "all" 
        ? "/api/opportunities/inbox-detected" 
        : `/api/opportunities/inbox-detected?status=${status}`;
      
      const data = await apiFetch(url);
      setOpportunities(data || []);
    } catch (error) {
      console.error("Failed to fetch opportunities:", error);
      toast.error("Failed to load opportunities");
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(opportunityId) {
    try {
      await apiFetch(`/api/opportunities/${opportunityId}/approve`, {
        method: "PATCH",
      });
      
      toast.success("Opportunity approved");
      fetchOpportunities(); // Refresh list
      setSelectedOpp(null);
    } catch (error) {
      console.error("Failed to approve opportunity:", error);
      toast.error("Failed to approve opportunity");
    }
  }

  async function handleDismiss(opportunityId, reason) {
    try {
      await apiFetch(`/api/opportunities/${opportunityId}/dismiss`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      
      toast.success("Opportunity dismissed");
      fetchOpportunities(); // Refresh list
      setSelectedOpp(null);
    } catch (error) {
      console.error("Failed to dismiss opportunity:", error);
      toast.error("Failed to dismiss opportunity");
    }
  }

  const filteredOpportunities = opportunities;

  return (
    <DashboardShell
      title="Opportunities"
      subtitle="Review deal opportunities detected from your inbox"
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
              activeFilter === filter
                ? "border-brand-red bg-brand-red text-white"
                : "border-brand-black/30 text-brand-black hover:border-brand-black/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border border-brand-black/10 bg-brand-linen/20 animate-pulse"
            />
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-12 text-center">
          <p className="text-sm font-medium text-brand-black/80 mb-1">
            No {activeFilter.toLowerCase()} opportunities
          </p>
          <p className="text-xs text-brand-black/60">
            {activeFilter === "Unreviewed" 
              ? "New opportunities will appear here when detected from your inbox"
              : `No opportunities marked as ${activeFilter.toLowerCase()}`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onApprove={handleApprove}
              onDismiss={handleDismiss}
              onView={setSelectedOpp}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOpp && (
        <OpportunityDetailModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onApprove={handleApprove}
          onDismiss={handleDismiss}
        />
      )}
    </DashboardShell>
  );
}

function OpportunityCard({ opportunity, onApprove, onDismiss, onView }) {
  const confidence = Math.round((opportunity.confidence || 0) * 100);
  const confidenceColor = confidence >= 70 ? "green" : confidence >= 40 ? "yellow" : "red";
  const confidenceBg = {
    green: "bg-green-100 border-green-300 text-green-700",
    yellow: "bg-yellow-100 border-yellow-300 text-yellow-700",
    red: "bg-red-100 border-red-300 text-red-700",
  }[confidenceColor];

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-5 hover:border-brand-black/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💼</span>
            <h3 className="font-semibold text-brand-black truncate">{opportunity.title}</h3>
            <span
              className={`px-2 py-0.5 rounded-full border text-[0.6rem] uppercase tracking-wider font-semibold ${confidenceBg}`}
            >
              {confidence}% confidence
            </span>
          </div>

          {/* Brand + Type */}
          <div className="flex items-center gap-3 text-xs text-brand-black/70 mb-3">
            <span className="font-medium">{opportunity.brand}</span>
            <span className="text-brand-black/40">•</span>
            <span className="px-2 py-0.5 rounded-full bg-brand-linen border border-brand-black/10">
              {opportunity.detectedType || "DEAL"}
            </span>
          </div>

          {/* Metadata */}
          {opportunity.metadata && (
            <div className="text-xs text-brand-black/60 space-y-1">
              {opportunity.metadata.fromEmail && (
                <p>From: {opportunity.metadata.fromEmail}</p>
              )}
              {opportunity.metadata.snippet && (
                <p className="line-clamp-2 italic">"{opportunity.metadata.snippet}"</p>
              )}
            </div>
          )}

          {/* Signals */}
          {opportunity.metadata?.signals && opportunity.metadata.signals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {opportunity.metadata.signals.slice(0, 3).map((signal, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-brand-linen/60 border border-brand-black/10 text-[0.6rem] text-brand-black/60"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {opportunity.reviewStatus === "unreviewed" && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onApprove(opportunity.id)}
              className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-green-700 transition-colors"
              title="Approve and make active"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onDismiss(opportunity.id, "False positive")}
              className="px-4 py-2 rounded-full border border-brand-black/20 text-brand-black text-xs font-semibold uppercase tracking-wider hover:bg-brand-black/5 transition-colors"
              title="Dismiss as false positive"
            >
              × Dismiss
            </button>
          </div>
        )}

        {opportunity.reviewStatus !== "unreviewed" && (
          <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold ${
            opportunity.reviewStatus === "approved" 
              ? "bg-green-100 border border-green-300 text-green-700"
              : "bg-gray-100 border border-gray-300 text-gray-600"
          }`}>
            {opportunity.reviewStatus}
          </span>
        )}
      </div>
    </div>
  );
}

function OpportunityDetailModal({ opportunity, onClose, onApprove, onDismiss }) {
  const [dismissReason, setDismissReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-xl uppercase text-brand-black">{opportunity.title}</h2>
          <button
            onClick={onClose}
            className="text-brand-black/60 hover:text-brand-black text-2xl"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-1">Brand</p>
            <p className="text-brand-black font-medium">{opportunity.brand}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-1">Type</p>
            <p className="text-brand-black">{opportunity.detectedType || "DEAL"}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-1">Confidence</p>
            <p className="text-brand-black">{Math.round((opportunity.confidence || 0) * 100)}%</p>
          </div>

          {opportunity.metadata?.fromEmail && (
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-1">From</p>
              <p className="text-brand-black">{opportunity.metadata.fromEmail}</p>
            </div>
          )}

          {opportunity.metadata?.snippet && (
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-1">Snippet</p>
              <p className="text-brand-black/70 italic">"{opportunity.metadata.snippet}"</p>
            </div>
          )}

          {opportunity.metadata?.signals && (
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-black/60 mb-1">Detected Signals</p>
              <div className="flex flex-wrap gap-2">
                {opportunity.metadata.signals.map((signal, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full bg-brand-linen border border-brand-black/10 text-xs"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {opportunity.reviewStatus === "unreviewed" && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                onApprove(opportunity.id);
                onClose();
              }}
              className="flex-1 px-4 py-3 rounded-full bg-green-600 text-white text-sm font-semibold uppercase tracking-wider hover:bg-green-700 transition-colors"
            >
              ✓ Approve & Make Active
            </button>
            <button
              onClick={() => {
                onDismiss(opportunity.id, dismissReason || "False positive");
                onClose();
              }}
              className="flex-1 px-4 py-3 rounded-full border border-brand-black/20 text-brand-black text-sm font-semibold uppercase tracking-wider hover:bg-brand-black/5 transition-colors"
            >
              × Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
