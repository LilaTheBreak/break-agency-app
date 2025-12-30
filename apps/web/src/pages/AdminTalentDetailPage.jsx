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
  ArrowLeft, Archive, AlertCircle 
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
  { id: "opportunities", label: "Opportunities", icon: TrendingUp },
  { id: "deals", label: "Deals", icon: Briefcase },
  { id: "campaigns", label: "Campaigns", icon: FileText },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "inbox", label: "Inbox", icon: Mail },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "notes", label: "Notes & History", icon: FileEdit },
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

      {/* Snapshot Overview */}
      <section className="mb-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Talent Snapshot</p>
            <h3 className="font-display text-3xl uppercase mt-2">{talent.displayName || talent.name}</h3>
            <div className="mt-4 flex items-center gap-4">
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
        {activeTab === "opportunities" && (
          <OpportunitiesTab talentId={talentId} isExclusive={isExclusive} />
        )}
        {activeTab === "deals" && (
          <DealsTab talent={talent} />
        )}
        {activeTab === "campaigns" && (
          <CampaignsTab talentId={talentId} />
        )}
        {activeTab === "contracts" && (
          <ContractsTab talentId={talentId} />
        )}
        {activeTab === "inbox" && (
          <InboxTab talentId={talentId} />
        )}
        {activeTab === "tasks" && (
          <TasksTab talent={talent} />
        )}
        {activeTab === "revenue" && (
          <RevenueTab talent={talent} isExclusive={isExclusive} />
        )}
        {activeTab === "notes" && (
          <NotesTab talentId={talentId} />
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

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-4">Deals</p>
      {deals.length === 0 ? (
        <p className="text-brand-black/60">No deals found for this talent.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <div key={deal.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-black">{deal.title}</p>
                  {deal.brand && (
                    <p className="text-xs text-brand-black/60 mt-1">Brand: {deal.brand.name}</p>
                  )}
                  <p className="text-xs text-brand-black/60 mt-1">Status: {deal.status}</p>
                  {deal.value && (
                    <p className="text-xs text-brand-black/60 mt-1">Value: £{deal.value}</p>
                  )}
                </div>
                <DealChip deal={deal} />
              </div>
            </div>
          ))}
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

