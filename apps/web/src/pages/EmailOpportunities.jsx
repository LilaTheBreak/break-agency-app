import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// Fallback icon set to avoid external dependency
const makeIcon = (glyph) => (props) => (
  <span aria-hidden="true" {...props}>
    {glyph}
  </span>
);

const Sparkles = makeIcon("✦");
const Mail = makeIcon("✉");
const Calendar = makeIcon("📅");
const Users = makeIcon("👥");
const TrendingUp = makeIcon("↗");
const Filter = makeIcon("⏷");
const Search = makeIcon("🔍");
const Check = makeIcon("✓");
const X = makeIcon("✕");
const Clock = makeIcon("⏱");
const AlertCircle = makeIcon("!");
const ExternalLink = makeIcon("↗");
const MessageSquare = makeIcon("💬");
const FileText = makeIcon("📄");
const ThumbsUp = makeIcon("👍");
const ThumbsDown = makeIcon("👎");
const RefreshCw = makeIcon("⟳");
const BarChart3 = makeIcon("▤");

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const categoryConfig = {
  EVENT_INVITE: {
    label: "Event Invites",
    icon: Calendar,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  BRAND_OPPORTUNITY: {
    label: "Brand Opportunities",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  COLLABORATION_REQUEST: {
    label: "Collaboration Requests",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  INBOUND_BRAND_INTEREST: {
    label: "Inbound Brand Interest",
    icon: Sparkles,
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
};

const statusConfig = {
  NEW: { label: "New", color: "bg-blue-100 text-blue-700" },
  REPLIED: { label: "Replied", color: "bg-green-100 text-green-700" },
  DECLINED: { label: "Declined", color: "bg-red-100 text-red-700" },
  NEGOTIATING: { label: "Negotiating", color: "bg-yellow-100 text-yellow-700" },
  AWAITING_BRIEF: { label: "Awaiting Brief", color: "bg-purple-100 text-purple-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-700" },
};

export default function EmailOpportunities() {
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
      const data = await response.json();
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
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const scanInbox = async () => {
    try {
      setScanning(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/email-opportunities/scan`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to scan inbox");
      }

      const data = await response.json();
      alert(`Scan complete! Found ${data.newOpportunities} new opportunities.`);
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update opportunity");
      await fetchOpportunities();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const takeAction = async (id, actionType, actionData = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email-opportunities/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: actionType, ...actionData }),
      });

      if (!response.ok) throw new Error("Failed to take action");
      const result = await response.json();
      alert(result.message || "Action completed successfully");
      await fetchOpportunities();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const markRelevance = async (id, isRelevant) => {
    await updateOpportunity(id, { isRelevant });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Email Opportunities
            </h1>
            <p className="text-gray-600">AI-powered inbox scanning for creator opportunities</p>
          </div>
          <motion.button
            onClick={scanInbox}
            disabled={scanning}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
              scanning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl"
            }`}
          >
            {scanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Scan Inbox
              </>
            )}
          </motion.button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Opportunities"
              value={stats.total}
              icon={Mail}
              gradient="from-purple-500 to-pink-500"
            />
            <StatCard
              label="Urgent"
              value={stats.urgent}
              icon={AlertCircle}
              gradient="from-red-500 to-orange-500"
            />
            <StatCard
              label="New"
              value={stats.byStatus?.NEW || 0}
              icon={Sparkles}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="In Progress"
              value={stats.byStatus?.IN_PROGRESS || 0}
              icon={TrendingUp}
              gradient="from-green-500 to-emerald-500"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by subject, brand, or sender..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Urgent Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={showUrgentOnly}
                  onChange={(e) => setShowUrgentOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Urgent Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No opportunities found</p>
            <p className="text-gray-400 text-sm mt-2">Try scanning your inbox or adjusting filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSelect={() => setSelectedOpportunity(opportunity)}
                onMarkRelevance={markRelevance}
                onTakeAction={takeAction}
                onUpdateStatus={(status) => updateOpportunity(opportunity.id, { status })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onTakeAction={takeAction}
          onUpdateStatus={(status) => updateOpportunity(selectedOpportunity.id, { status })}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function OpportunityCard({ opportunity, onSelect, onMarkRelevance, onTakeAction, onUpdateStatus }) {
  const category = categoryConfig[opportunity.category];
  const status = statusConfig[opportunity.status];
  const CategoryIcon = category?.icon || Mail;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className={`bg-white rounded-2xl shadow-sm border ${category?.borderColor || "border-gray-200"} p-6 cursor-pointer transition-all hover:shadow-lg`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${category?.color || "from-gray-400 to-gray-500"}`}>
            <CategoryIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{opportunity.subject}</h3>
              {opportunity.isUrgent && (
                <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {opportunity.from}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(opportunity.receivedAt).toLocaleDateString()}
              </span>
              {opportunity.brandName && (
                <span className="flex items-center gap-1 font-medium text-purple-600">
                  <TrendingUp className="w-4 h-4" />
                  {opportunity.brandName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 ${status.color} text-xs font-medium rounded-lg`}>{status.label}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                {Math.round(opportunity.confidence * 100)}% confidence
              </span>
            </div>
            {opportunity.opportunityType && (
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Type:</span> {opportunity.opportunityType}
              </p>
            )}
            {opportunity.suggestedActions && opportunity.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {opportunity.suggestedActions.slice(0, 3).map((action, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                    {action}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMarkRelevance(opportunity.id, true)}
            className={`p-2 rounded-lg transition-colors ${
              opportunity.isRelevant === true
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
            }`}
            title="Mark as relevant"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMarkRelevance(opportunity.id, false)}
            className={`p-2 rounded-lg transition-colors ${
              opportunity.isRelevant === false
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600"
            }`}
            title="Mark as not relevant"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function OpportunityDetailModal({ opportunity, onClose, onTakeAction, onUpdateStatus }) {
  const category = categoryConfig[opportunity.category];
  const status = statusConfig[opportunity.status];
  const CategoryIcon = category?.icon || Mail;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={`p-6 border-b ${category?.borderColor || "border-gray-200"} ${category?.bgColor || "bg-gray-50"}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${category?.color || "from-gray-400 to-gray-500"}`}>
                <CategoryIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{opportunity.subject}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{opportunity.from}</span>
                  <span>•</span>
                  <span>{new Date(opportunity.receivedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 ${status.color} text-sm font-medium rounded-lg`}>{status.label}</span>
            {opportunity.isUrgent && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-lg flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Urgent
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
              {Math.round(opportunity.confidence * 100)}% confidence
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Brand & Type */}
          {(opportunity.brandName || opportunity.opportunityType) && (
            <div className="grid grid-cols-2 gap-4">
              {opportunity.brandName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <p className="text-gray-900 font-medium">{opportunity.brandName}</p>
                </div>
              )}
              {opportunity.opportunityType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{opportunity.opportunityType}</p>
                </div>
              )}
            </div>
          )}

          {/* Deliverables */}
          {opportunity.deliverables && opportunity.deliverables.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables</label>
              <ul className="list-disc list-inside space-y-1">
                {opportunity.deliverables.map((item, idx) => (
                  <li key={idx} className="text-gray-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dates, Location, Payment */}
          <div className="grid grid-cols-3 gap-4">
            {opportunity.dates && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                <p className="text-gray-900">{opportunity.dates}</p>
              </div>
            )}
            {opportunity.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{opportunity.location}</p>
              </div>
            )}
            {opportunity.paymentDetails && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                <p className="text-gray-900 font-medium text-green-600">{opportunity.paymentDetails}</p>
              </div>
            )}
          </div>

          {/* Contact Email */}
          {opportunity.contactEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <a
                href={`mailto:${opportunity.contactEmail}`}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {opportunity.contactEmail}
              </a>
            </div>
          )}

          {/* Email Body */}
          {opportunity.emailBody && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
              <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{opportunity.emailBody}</p>
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {opportunity.suggestedActions && opportunity.suggestedActions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Actions</label>
              <div className="flex flex-wrap gap-2">
                {opportunity.suggestedActions.map((action, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {opportunity.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <p className="text-gray-700">{opportunity.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                onTakeAction(opportunity.id, "reply");
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Reply
            </button>
            <button
              onClick={() => {
                onTakeAction(opportunity.id, "negotiate");
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Users className="w-4 h-4" />
              Negotiate
            </button>
            <button
              onClick={() => {
                onTakeAction(opportunity.id, "request_brief");
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Request Brief
            </button>
            <button
              onClick={() => {
                onTakeAction(opportunity.id, "decline");
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={() => {
                onTakeAction(opportunity.id, "archive");
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
            >
              Archive
            </button>
            <a
              href={`https://mail.google.com/mail/u/0/#inbox/${opportunity.gmailMessageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium ml-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Gmail
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
