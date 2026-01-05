import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import { Badge } from "../components/Badge.jsx";
import { 
  User, UserX, Edit2, Link2, Unlink, 
  TrendingUp, Briefcase, FileText, Mail, 
  CheckSquare, DollarSign, FileEdit, 
  ArrowLeft, Archive, AlertCircle, Plus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { DealChip } from "../components/DealChip.jsx";
import { NotesIntelligenceSection } from "../components/NotesIntelligenceSection.jsx";

const REPRESENTATION_TYPES = [
  { value: "EXCLUSIVE", label: "Exclusive", color: "bg-brand-red text-white", description: "Full-service representation" },
  { value: "NON_EXCLUSIVE", label: "Non-Exclusive", color: "bg-brand-black/10 text-brand-black", description: "Project-based" },
  { value: "FRIEND_OF_HOUSE", label: "Friends of House", color: "bg-purple-100 text-purple-700", description: "Preferred partners" },
  { value: "UGC", label: "UGC", color: "bg-blue-100 text-blue-700", description: "User-generated content" },
  { value: "FOUNDER", label: "Founder", color: "bg-green-100 text-green-700", description: "Brand partners" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-green-500" },
  { value: "PAUSED", label: "Paused", color: "bg-yellow-500" },
  { value: "ARCHIVED", label: "Archived", color: "bg-gray-400" },
];

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "deals", label: "Deal Tracker", icon: Briefcase },
  { id: "opportunities", label: "Opportunities", icon: TrendingUp },
  { id: "deliverables", label: "Content Deliverables", icon: CheckSquare },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "payments", label: "Payments & Finance", icon: DollarSign },
  { id: "notes", label: "Notes & History", icon: FileEdit },
  { id: "files", label: "Files & Assets", icon: Archive },
];

function RepresentationBadge({ type }) {
  const repType = REPRESENTATION_TYPES.find((t) => t.value === type) || REPRESENTATION_TYPES[1];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${repType.color}`}>
      {repType.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${statusOption.color}`} />
      <span className="text-xs uppercase tracking-[0.2em]">{statusOption.label}</span>
    </div>
  );
}

function SnapshotCard({ label, value, subtext, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-brand-black/40" />}
      </div>
      <p className="font-display text-2xl uppercase text-brand-black">{value}</p>
      {subtext && <p className="mt-1 text-xs text-brand-black/50">{subtext}</p>}
    </div>
  );
}

function LinkUserModal({ open, onClose, talentId, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const response = await apiFetch("/api/users?limit=100");
          if (response.ok) {
            const data = await response.json();
            // API returns { users: [...] }
            setUsers(Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []));
          }
        } catch (err) {
          console.error("Error fetching users:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [open]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const searchLower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(searchLower) ||
        u.name?.toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  const handleLink = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/talent/${talentId}/link-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to link user");
      }

      toast.success("User linked successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to link user");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Link User Account</p>
            <h3 className="font-display text-2xl uppercase">Connect Talent to User</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Cancel
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-brand-black/10 px-4 py-3 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading && <p className="text-center text-brand-black/60 py-4">Loading users...</p>}
          {!loading && filteredUsers.length === 0 && (
            <p className="text-center text-brand-black/60 py-4">No users found</p>
          )}
          {!loading && filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUserId(user.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedUserId === user.id
                  ? "border-brand-red bg-brand-red/10"
                  : "border-brand-black/10 hover:bg-brand-black/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-brand-black">{user.name || user.email}</p>
                  <p className="text-xs text-brand-black/60">{user.email}</p>
                </div>
                {selectedUserId === user.id && (
                  <div className="h-4 w-4 rounded-full bg-brand-red" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-6 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLink}
            disabled={!selectedUserId}
            className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black disabled:opacity-50"
          >
            Link User
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTalentDetailPage() {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchTalent = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch(`/api/admin/talent/${talentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch talent");
      }
      const data = await response.json();
      setTalent(data.talent);
    } catch (err) {
      console.error("Error fetching talent:", err);
      setError(err.message || "Failed to load talent");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (talentId) {
      fetchTalent();
    }
  }, [talentId]);

  const isExclusive = talent?.representationType === "EXCLUSIVE";

  if (loading) {
    return (
      <DashboardShell title="Talent Management" navLinks={ADMIN_NAV_LINKS}>
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-center">
          <p className="text-brand-black/60">Loading talent details...</p>
        </section>
      </DashboardShell>
    );
  }

  if (error || !talent) {
    return (
      <DashboardShell title="Talent Management" navLinks={ADMIN_NAV_LINKS}>
        <section className="rounded-3xl border border-brand-red/20 bg-brand-red/10 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-brand-red mx-auto mb-4" />
          <p className="text-brand-red">{error || "Talent not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/admin/talent")}
            className="mt-4 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            Back to Talent List
          </button>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Talent Management"
      subtitle={`Managing ${talent.displayName || talent.name}`}
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin/talent")}
          className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Talent List
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Header Section with Profile Image and Social Handles */}
      <section className="mb-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="mb-6 flex items-start gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {talent.linkedUser?.avatarUrl ? (
              <img
                src={talent.linkedUser.avatarUrl}
                alt={talent.displayName || talent.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-brand-black/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-red/10 flex items-center justify-center border-2 border-brand-black/10">
                <span className="text-2xl font-semibold text-brand-red">
                  {(talent.displayName || talent.name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          
          {/* Talent Info */}
          <div className="flex-1 min-w-0">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-2">Talent Profile</p>
            <h3 className="font-display text-3xl uppercase mb-4">{talent.displayName || talent.name}</h3>
            
            {/* Social Handles */}
            {talent.socialAccounts && talent.socialAccounts.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {talent.socialAccounts.map((social) => {
                  const platformIcon = {
                    INSTAGRAM: "📷",
                    TIKTOK: "🎵",
                    YOUTUBE: "▶️",
                    X: "🐦",
                    LINKEDIN: "💼",
                  }[social.platform] || "@";
                  return (
                    <a
                      key={social.id}
                      href={`https://${social.platform.toLowerCase()}.com/${social.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-brand-black/10 px-3 py-1.5 text-xs hover:bg-brand-black/5 transition-colors"
                    >
                      <span>{platformIcon}</span>
                      <span className="font-medium">@{social.handle}</span>
                    </a>
                  );
                })}
              </div>
            )}
            
            {/* Badges */}
            <div className="flex items-center gap-4">
              <RepresentationBadge type={talent.representationType || "NON_EXCLUSIVE"} />
              <StatusBadge status={talent.status || "ACTIVE"} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SnapshotCard
            label="Open Opportunities"
            value={talent.snapshot?.openOpportunities || 0}
            icon={TrendingUp}
          />
          <SnapshotCard
            label="Active Deals"
            value={talent.snapshot?.activeDeals || 0}
            icon={Briefcase}
          />
          <SnapshotCard
            label="Active Campaigns"
            value={talent.snapshot?.activeCampaigns || 0}
            icon={FileText}
          />
          {isExclusive && (
            <SnapshotCard
              label="Total Revenue"
              value={`£${((talent.snapshot?.totalRevenue || 0) / 1000).toFixed(1)}k`}
              subtext={`Net: £${((talent.snapshot?.netRevenue || 0) / 1000).toFixed(1)}k`}
              icon={DollarSign}
            />
          )}
        </div>

        {/* User Linking Section */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">Linked User Account</p>
              {talent.linkedUser ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-brand-black/40" />
                  <span className="text-sm font-semibold text-brand-black">{talent.linkedUser.email}</span>
                  {talent.linkedUser.name && (
                    <span className="text-xs text-brand-black/60">({talent.linkedUser.name})</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-brand-black/40">
                  <UserX className="h-4 w-4" />
                  <span className="text-sm italic">Not linked to any user account</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {talent.linkedUser ? (
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement unlink
                    toast.info("Unlink functionality will be available after schema migration");
                  }}
                  className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
                >
                  <Unlink className="h-4 w-4" />
                  Unlink
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
                >
                  <Link2 className="h-4 w-4" />
                  Link User
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-brand-black/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-2xl border-b-2 px-4 py-3 text-xs uppercase tracking-[0.3em] transition ${
                isActive
                  ? "border-brand-red text-brand-red"
                  : "border-transparent text-brand-black/60 hover:text-brand-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <OverviewTab talent={talent} isExclusive={isExclusive} />
        )}
        {activeTab === "deals" && (
          <DealsTab talent={talent} />
        )}
        {activeTab === "opportunities" && (
          <OpportunitiesTab talentId={talentId} isExclusive={isExclusive} />
        )}
        {activeTab === "deliverables" && (
          <DeliverablesTab talent={talent} />
        )}
        {activeTab === "contracts" && (
          <ContractsTab talentId={talentId} />
        )}
        {activeTab === "payments" && (
          <RevenueTab talent={talent} isExclusive={isExclusive} />
        )}
        {activeTab === "notes" && (
          <NotesTab talentId={talentId} />
        )}
        {activeTab === "files" && (
          <FilesTab talentId={talentId} />
        )}
      </div>

      <LinkUserModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        talentId={talentId}
        onSuccess={fetchTalent}
      />
    </DashboardShell>
  );
}

// Tab Components
function OverviewTab({ talent, isExclusive }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Representation Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Type</p>
            <p className="mt-2">
              <RepresentationBadge type={talent.representationType || "NON_EXCLUSIVE"} />
            </p>
            <p className="mt-2 text-xs text-brand-black/50">
              {REPRESENTATION_TYPES.find((t) => t.value === (talent.representationType || "NON_EXCLUSIVE"))?.description}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Status</p>
            <p className="mt-2">
              <StatusBadge status={talent.status || "ACTIVE"} />
            </p>
          </div>
          {talent.legalName && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Legal Name</p>
              <p className="mt-2 text-sm text-brand-black">{talent.legalName}</p>
            </div>
          )}
          {talent.primaryEmail && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Primary Email</p>
              <p className="mt-2 text-sm text-brand-black">{talent.primaryEmail}</p>
            </div>
          )}
        </div>
      </section>

      {talent.notes && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Internal Notes</p>
          <p className="text-sm text-brand-black/80 whitespace-pre-wrap">{talent.notes}</p>
        </section>
      )}
    </div>
  );
}

function OpportunitiesTab({ talentId, isExclusive }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/opportunities`);
        if (response.ok) {
          const data = await response.json();
          setOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
        }
      } catch (err) {
        console.error("Error fetching opportunities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Opportunities</p>
      {loading ? (
        <p className="text-brand-black/60">Loading opportunities...</p>
      ) : opportunities.length === 0 ? (
        <p className="text-brand-black/60">No opportunities found. This will be populated when Opportunity model is updated with talentId.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div key={opp.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{opp.title}</p>
              <p className="text-xs text-brand-black/60 mt-1">{opp.status}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DealsTab({ talent }) {
  const deals = talent.deals || [];
  const [stageFilter, setStageFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("dueDate");

  // Map DealStage enum to display labels
  const stageLabels = {
    NEW_LEAD: "In discussion",
    NEGOTIATION: "In discussion",
    CONTRACT_SENT: "Awaiting contract",
    CONTRACT_SIGNED: "Contract signed",
    DELIVERABLES_IN_PROGRESS: "Live",
    PAYMENT_PENDING: "Live",
    PAYMENT_RECEIVED: "Completed",
    COMPLETED: "Completed",
    LOST: "Declined",
  };

  const filteredDeals = useMemo(() => {
    let filtered = deals;
    if (stageFilter !== "ALL") {
      filtered = filtered.filter(d => d.stage === stageFilter);
    }
    return filtered;
  }, [deals, stageFilter]);

  const sortedDeals = useMemo(() => {
    const sorted = [...filteredDeals];
    if (sortBy === "dueDate") {
      sorted.sort((a, b) => {
        const dateA = a.expectedClose ? new Date(a.expectedClose) : new Date(0);
        const dateB = b.expectedClose ? new Date(b.expectedClose) : new Date(0);
        return dateA - dateB;
      });
    } else if (sortBy === "brand") {
      sorted.sort((a, b) => {
        const nameA = (a.brand?.name || a.brandName || "").toLowerCase();
        const nameB = (b.brand?.name || b.brandName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    return sorted;
  }, [filteredDeals, sortBy]);

  // Calculate totals
  const totals = useMemo(() => {
    const pipeline = sortedDeals.filter(d => 
      !["COMPLETED", "LOST", "PAYMENT_RECEIVED"].includes(d.stage)
    );
    const confirmed = sortedDeals.filter(d => 
      ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(d.stage)
    );
    
    const pipelineValue = pipeline.reduce((sum, d) => sum + (d.value || 0), 0);
    const confirmedRevenue = confirmed.reduce((sum, d) => sum + (d.value || 0), 0);
    
    // Get payment status from Payment relation (if available in API response)
    const paid = sortedDeals.filter(d => d.stage === "PAYMENT_RECEIVED" || d.stage === "COMPLETED");
    const unpaid = sortedDeals.filter(d => 
      ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(d.stage)
    );
    
    const paidValue = paid.reduce((sum, d) => sum + (d.value || 0), 0);
    const unpaidValue = unpaid.reduce((sum, d) => sum + (d.value || 0), 0);
    
    return { pipelineValue, confirmedRevenue, paidValue, unpaidValue };
  }, [sortedDeals]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Deal Tracker</p>
        <div className="flex items-center gap-3">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-2xl border border-brand-black/10 bg-brand-white px-3 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
          >
            <option value="ALL">All Stages</option>
            <option value="NEW_LEAD">In discussion</option>
            <option value="NEGOTIATION">In discussion</option>
            <option value="CONTRACT_SENT">Awaiting contract</option>
            <option value="CONTRACT_SIGNED">Contract signed</option>
            <option value="DELIVERABLES_IN_PROGRESS">Live</option>
            <option value="PAYMENT_PENDING">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="LOST">Declined</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl border border-brand-black/10 bg-brand-white px-3 py-2 text-xs uppercase tracking-[0.2em] focus:border-brand-black focus:outline-none"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="brand">Sort by Brand</option>
          </select>
          <button
            type="button"
            onClick={() => {
              // TODO: Open add deal modal
              toast.info("Add deal functionality coming soon");
            }}
            className="flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black"
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Pipeline Value</p>
          <p className="font-display text-xl uppercase text-brand-black">
            {talent.revenue?.currency || "USD"} {totals.pipelineValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Confirmed Revenue</p>
          <p className="font-display text-xl uppercase text-brand-black">
            {talent.revenue?.currency || "USD"} {totals.confirmedRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Paid</p>
          <p className="font-display text-xl uppercase text-brand-black">
            {talent.revenue?.currency || "USD"} {totals.paidValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-1">Unpaid</p>
          <p className="font-display text-xl uppercase text-brand-black">
            {talent.revenue?.currency || "USD"} {totals.unpaidValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Deal Tracker Table */}
      {sortedDeals.length === 0 ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-brand-black/60">
            {deals.length === 0 
              ? "No deals found for this talent."
              : "No deals match the current filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-brand-white border-b border-brand-black/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Brand</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Scope of Work</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Currency</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Fee</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Stage</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Payment Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal) => {
                // Get scope from Deliverable or notes
                const scope = deal.Deliverable?.[0]?.title || deal.aiSummary || deal.notes || "—";
                const dueDate = deal.expectedClose 
                  ? new Date(deal.expectedClose).toLocaleDateString()
                  : "—";
                
                // Determine payment status from Payment relation or stage
                let paymentStatus = "Pending";
                if (deal.stage === "PAYMENT_RECEIVED" || deal.stage === "COMPLETED") {
                  paymentStatus = "Paid";
                } else if (deal.stage === "PAYMENT_PENDING") {
                  paymentStatus = "Unpaid";
                } else if (["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS"].includes(deal.stage)) {
                  paymentStatus = "Awaiting";
                }

                return (
                  <tr key={deal.id} className="border-b border-brand-black/5 hover:bg-brand-black/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-black">
                        {deal.brand?.name || deal.brandName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-brand-black/80 text-xs max-w-[200px] truncate block" title={scope}>
                        {scope}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-brand-black/60 uppercase text-xs">{deal.currency || "USD"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-black">
                        {deal.value ? `${deal.currency || "USD"} ${deal.value.toLocaleString()}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                        deal.stage === "COMPLETED" ? "bg-green-100 text-green-700" :
                        deal.stage === "LOST" ? "bg-gray-100 text-gray-700" :
                        ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(deal.stage) ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {stageLabels[deal.stage] || deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-brand-black/60 text-xs">{dueDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        paymentStatus === "Paid" ? "bg-green-100 text-green-700" :
                        paymentStatus === "Unpaid" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-brand-black/60 text-xs max-w-[200px] truncate block" title={deal.notes || ""}>
                        {deal.notes || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CampaignsTab({ talentId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/campaigns`);
        if (response.ok) {
          const data = await response.json();
          setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Campaigns</p>
      {loading ? (
        <p className="text-brand-black/60">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <p className="text-brand-black/60">No campaigns found. This will be populated when Campaign model is updated with talentId.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{campaign.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ContractsTab({ talentId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/contracts`);
        if (response.ok) {
          const data = await response.json();
          setContracts(Array.isArray(data.contracts) ? data.contracts : []);
        }
      } catch (err) {
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Contracts</p>
      {loading ? (
        <p className="text-brand-black/60">Loading contracts...</p>
      ) : contracts.length === 0 ? (
        <p className="text-brand-black/60">No contracts found. This will be populated when Contract model is updated with talentId.</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div key={contract.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{contract.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InboxTab({ talentId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await apiFetch(`/api/admin/talent/${talentId}/inbox`);
        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch (err) {
        console.error("Error fetching inbox:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, [talentId]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Inbox</p>
      {loading ? (
        <p className="text-brand-black/60">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-brand-black/60">No messages found. Messages will appear here when talent is linked to a user account with Gmail connected.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="font-semibold text-brand-black">{msg.subject || "No subject"}</p>
              <p className="text-xs text-brand-black/60 mt-1">{msg.snippet || msg.body?.substring(0, 100)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TasksTab({ talent }) {
  const tasks = talent.tasks || [];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Tasks</p>
      {tasks.length === 0 ? (
        <p className="text-brand-black/60">No tasks found for this talent.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-black">{task.title}</p>
                  <p className="text-xs text-brand-black/60 mt-1">Status: {task.status}</p>
                  {task.dueDate && (
                    <p className="text-xs text-brand-black/60 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {task.priority && (
                  <span className="rounded-full border border-brand-black/10 px-2 py-1 text-xs uppercase tracking-[0.2em]">
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RevenueTab({ talent, isExclusive }) {
  const revenue = talent.revenue || { total: 0, payouts: 0, net: 0 };

  if (!isExclusive) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Revenue</p>
        <p className="text-brand-black/60">
          Revenue details are only available for Exclusive Talent.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Revenue & Payouts</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Total Revenue</p>
          <p className="font-display text-2xl uppercase text-brand-black mt-2">
            £{((revenue.total || 0) / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Payouts</p>
          <p className="font-display text-2xl uppercase text-brand-black mt-2">
            £{((revenue.payouts || 0) / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Net Revenue</p>
          <p className="font-display text-2xl uppercase text-brand-black mt-2">
            £{((revenue.net || 0) / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {revenue.payments && revenue.payments.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-3">Recent Payments</p>
          <div className="space-y-2">
            {revenue.payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-black">£{((payment.amount || 0) / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-brand-black/60">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DeliverablesTab({ talent }) {
  const deals = talent.deals || [];
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const allDeliverables = [];
        for (const deal of deals) {
          try {
            const response = await apiFetch(`/api/deliverables?dealId=${deal.id}`);
            if (response.ok) {
              const data = await response.json();
              const dealDeliverables = Array.isArray(data.deliverables) ? data.deliverables : [];
              allDeliverables.push(...dealDeliverables.map(d => ({ ...d, dealId: deal.id, dealBrand: deal.brand?.name || deal.brandName })));
            }
          } catch (err) {
            console.warn(`Error fetching deliverables for deal ${deal.id}:`, err);
          }
        }
        setDeliverables(allDeliverables);
      } catch (err) {
        console.error("Error fetching deliverables:", err);
      } finally {
        setLoading(false);
      }
    };
    if (deals.length > 0) {
      fetchDeliverables();
    } else {
      setLoading(false);
    }
  }, [deals]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Content Deliverables</p>
      {loading ? (
        <p className="text-brand-black/60">Loading deliverables...</p>
      ) : deliverables.length === 0 ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-brand-black/60 mb-2">No deliverables found.</p>
          <p className="text-xs text-brand-black/50">
            Deliverables will appear here when deals have content items assigned.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-brand-white border-b border-brand-black/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Deal / Brand</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Deliverable Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.3em] text-brand-red font-semibold">Platform</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((deliverable) => (
                <tr key={deliverable.id} className="border-b border-brand-black/5 hover:bg-brand-black/5">
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-black">{deliverable.dealBrand || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-black/80">{deliverable.title || deliverable.deliverableType || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-black/60 text-xs">
                      {deliverable.dueAt || deliverable.dueDate 
                        ? new Date(deliverable.dueAt || deliverable.dueDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      deliverable.approvedAt ? "bg-green-100 text-green-700" :
                      deliverable.status === "posted" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {deliverable.approvedAt ? "Approved" : deliverable.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-black/60 text-xs uppercase">
                      {deliverable.platform || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FilesTab({ talentId }) {
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Files & Assets</p>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
        <Archive className="h-12 w-12 text-brand-black/40 mx-auto mb-4" />
        <p className="text-brand-black/60 mb-2">Files & Assets</p>
        <p className="text-xs text-brand-black/50 mb-4">
          Coming soon: Media kit, rate card, past campaign assets, and press imagery will be available here.
        </p>
        <p className="text-xs text-brand-black/40">
          This section will support uploading and managing talent assets when the API endpoint is implemented.
        </p>
      </div>
    </section>
  );
}

function NotesTab({ talentId }) {
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Notes & History</p>
      <NotesIntelligenceSection
        context={{
          talentId,
        }}
        session={null}
      />
    </section>
  );
}

