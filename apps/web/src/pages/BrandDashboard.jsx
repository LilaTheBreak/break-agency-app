import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useOutletContext, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { Badge } from "../components/Badge.jsx";
import { usePayoutSummary } from "../hooks/usePayoutSummary.js";
import { FileUploadPanel } from "../components/FileUploadPanel.jsx";
import { VersionHistoryCard } from "../components/VersionHistoryCard.jsx";
import { AiAssistantCard } from "../components/AiAssistantCard.jsx";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { Roles } from "../constants/roles.js";
import { FeatureGate } from "../components/FeatureGate.jsx";
import { useRevenue, useMetrics } from "../hooks/useAnalytics.js";
import { LineChart as RechartsLineChart } from "../components/charts/index.js";
import { isFeatureEnabled } from "../config/features.js";
import { ComingSoon, BetaBadge } from "../components/ComingSoon.jsx";
import { OpportunitiesCard } from "../components/OpportunitiesCard.jsx";
import { SkeletonMetrics, SkeletonSection, SkeletonCampaign, SkeletonWithMessage } from "../components/SkeletonLoader.jsx";

// Creator roster - guarded by feature flag CREATOR_ROSTER_ENABLED
const CREATOR_ROSTER = [];


const BRAND_NAV_LINKS = (basePath) => [
  { label: "Overview", to: `${basePath}`, end: true },
  { label: "My Profile", to: `${basePath}/profile` },
  { label: "Socials", to: `${basePath}/socials` },
  { label: "Campaigns", to: `${basePath}/campaigns` },
  { label: "Opportunities", to: `${basePath}/opportunities` },
  { label: "Contracts", to: `${basePath}/contracts` },
  { label: "Financials", to: `${basePath}/financials` },
  { label: "Messages", to: `${basePath}/messages` },
  { label: "Email Opportunities", to: `/creator/opportunities` },
  { label: "Settings", to: `${basePath}/settings` }
];

export default function BrandDashboardLayout({ basePath = "/brand/dashboard", session }) {
  return (
    <DashboardShell
      title={
        <div className="flex items-center gap-3">
          <span>Brand Control Room</span>
          <BetaBadge variant="subtle" />
        </div>
      }
      subtitle="Campaign controls, creator match, contracts, messaging, and reporting in one lane."
      role="brand"
      navLinks={BRAND_NAV_LINKS(basePath)}
    >
      <Outlet context={{ session }} />
    </DashboardShell>
  );
}

export function BrandOverviewPage() {
  const { session } = useOutletContext() || {};
  return <BrandOverviewSection session={session} />;
}

export function BrandProfilePage() {
  return <BrandProfileSection />;
}

export function BrandSocialsPage() {
  return <BrandSocialsSection />;
}

export function BrandCampaignsPage() {
  const { session } = useOutletContext() || {};
  return <BrandCampaignSection session={session} />;
}

export function BrandOpportunitiesPage() {
  const { session } = useOutletContext() || {};
  return <BrandOpportunitiesSection session={session} />;
}

export function BrandContractsPage() {
  const { session } = useOutletContext() || {};
  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6" id="brand-contracts">
      <ContractsPanel
        session={session}
        title="Contracts"
        description="Track briefs sent for signature and monitor who has signed."
      />
    </section>
  );
}

export function BrandFinancialsPage() {
  return <BrandFinancialSection />;
}

export function BrandMessagesPage() {
  return <BrandMessagesSection />;
}

export function BrandSettingsPage() {
  return <BrandSettingsSection />;
}

function BrandOverviewSection({ session }) {
  // Use analytics hooks for real data
  const { data: revenueData, loading: revenueLoading } = useRevenue('Month');
  const { data: metricsData, loading: metricsLoading } = useMetrics();

  const overview = {
    description:
      "A Break campaign is a scoped engagement spanning ideation, creator sourcing, production, and measurement. The system tracks every touchpoint so brand, creator, and ops stay aligned.",
    progress: 62,
    phase: "Creative production",
    nextSteps: ["Approve creator travel budget", "Upload legal addendum", "Schedule edit review"],
    results: metricsData ? [
      { label: "Active Campaigns", value: metricsData.activeCampaigns?.toString() || "0", context: "Currently running" },
      { label: "Win Rate", value: metricsData.winRate || "0%", context: "Opportunity success" },
      { label: "Avg Deal Value", value: metricsData.avgDealValue || "£0", context: "Per campaign" }
    ] : []
  };

  return (
    <section className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <AiAssistantCard
        session={session}
        role="brand"
        title="AI Assistant"
        description="Ask AI for brief optimization or risk alerts."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Overview</p>
          <h3 className="font-display text-3xl uppercase">What is a campaign?</h3>
        </div>
        <Badge tone="neutral">{overview.phase}</Badge>
      </div>
      <p className="text-sm text-brand-black/70">{overview.description}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-brand-black/60">
          <span>Progress</span>
          <span>{overview.progress}%</span>
        </div>
        <ProgressBar value={overview.progress} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Next steps</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
            {Array.isArray(overview.nextSteps) && overview.nextSteps.length > 0 ? (
              overview.nextSteps.map((item) => (
                <li key={item}>• {item}</li>
              ))
            ) : (
              <li className="text-brand-black/40">No immediate steps required</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Results summary</p>
          <div className="mt-3 grid gap-3 text-brand-black">
            {Array.isArray(overview.results) && overview.results.length > 0 ? (
              overview.results.map((result) => (
                <div key={result.label}>
                  <p className="text-sm uppercase tracking-[0.3em] text-brand-black/60">{result.label}</p>
                  <p className="font-display text-2xl uppercase">{result.value}</p>
                  <p className="text-xs text-brand-black/50">{result.context}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-black/40">Results will appear after campaign activity</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Analytics + reporting</p>
            <h4 className="font-display text-2xl uppercase">Revenue tracking</h4>
          </div>
          {revenueData && (
            <div className="text-right">
              <p className="text-sm text-brand-black/60">Current</p>
              <p className="font-display text-2xl uppercase">{revenueData.current || "£0"}</p>
              <p className="text-xs text-brand-black/50">{revenueData.trend || "—"}</p>
            </div>
          )}
        </div>
        {revenueLoading ? (
          <div className="h-64 rounded-2xl border border-brand-black/10 bg-brand-linen/50 animate-pulse"></div>
        ) : revenueData?.breakdown && revenueData.breakdown.length > 0 ? (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
            <RechartsLineChart
              data={revenueData.breakdown}
              xKey="date"
              yKey="amount"
              color="#000000"
              height={220}
              formatValue={(v) => `£${Math.round(v / 1000)}K`}
              formatXAxis={(v) => {
                const date = new Date(v);
                return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
              }}
              showGrid={true}
              showTooltip={true}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
            <p className="text-sm text-brand-black/60">Revenue analytics loading...</p>
            <p className="mt-2 text-xs text-brand-black/40">Metrics will appear once campaigns generate revenue</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Brand social analytics - guarded by feature flag BRAND_SOCIAL_ANALYTICS_ENABLED
const BRAND_SOCIALS = [];

// Creator matches - guarded by feature flag BRAND_CREATOR_MATCHES_ENABLED
// TODO: Replace with real API call to /api/creators or /api/roster when available
// Currently empty array - computeCreatorMatches will return [] until API is implemented
const CREATOR_MATCH_POOL = [];

const FINANCIAL_PROFILES = {
  brand: {
    name: "Primary Brand Retainer",
    revenue30: 82000,
    revenue90: 245000,
    projected: 360000,
    grossMargin: 0.42,
    payoutsPending: [
      { id: "pay-001", recipient: "Exclusive Creator", amount: 12000, status: "Pending Stripe release" },
      { id: "pay-002", recipient: "UGC Creator", amount: 4200, status: "Scheduled tomorrow" }
    ],
    invoices: [
      { id: "inv-9102", amount: 18000, due: "12 Dec", status: "Awaiting brand payment" },
      { id: "inv-9103", amount: 9500, due: "18 Dec", status: "Sent" }
    ],
    taxForms: [
      { label: "W-8BEN", status: "Submitted", updated: "Sep 12" },
      { label: "VAT return", status: "In review", updated: "Nov 30" }
    ],
    payments: [
      { label: "Stripe transfer", amount: 20000, date: "Nov 28" },
      { label: "PayPal payout", amount: 6500, date: "Nov 24" }
    ]
  },
  "Exclusive Creator": {
    name: "Exclusive Creator",
    revenue30: 24000,
    revenue90: 72000,
    projected: 110000,
    grossMargin: 0.35,
    payoutsPending: [{ id: "pay-003", recipient: "Exclusive Creator", amount: 7800, status: "Docs pending approval" }],
    invoices: [{ id: "invoice-tal-001", amount: 7800, due: "14 Dec", status: "Draft" }],
    taxForms: [{ label: "1099-MISC", status: "Awaiting signature", updated: "Dec 03" }],
    payments: [{ label: "Stripe transfer", amount: 5200, date: "Nov 10" }]
  }
};


function BrandCampaignSection({ session }) {
  const { campaigns, loading, error } = useCampaigns({ session });
  const [notes, setNotes] = useState({});
  useEffect(() => {
    setNotes((prev) => {
      const next = {};
      // Defensive: Ensure campaigns is an array before iterating
      if (Array.isArray(campaigns)) {
        campaigns.forEach((campaign) => {
          next[campaign.id] = prev[campaign.id] ?? campaign.metadata?.notes ?? "";
        });
      }
      return next;
    });
  }, [campaigns]);
  return (
    <section className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Campaign management</p>
          <h3 className="font-display text-3xl uppercase">Live campaigns</h3>
        </div>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Add campaign
        </button>
      </div>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {loading && !campaigns.length ? (
        <SkeletonWithMessage message="Loading your campaigns and performance data...">
          <SkeletonCampaign />
        </SkeletonWithMessage>
      ) : campaigns.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No campaigns yet</p>
          <p className="mt-2 text-xs text-brand-black/40">Campaign data will appear once created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <MultiBrandCampaignCard
              key={campaign.id}
              campaign={campaign}
              notes={notes[campaign.id]}
              onNotesChange={(id, value) => setNotes((prev) => ({ ...prev, [id]: value }))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BrandSocialsSection() {
  // Guard with feature flag
  if (!isFeatureEnabled('BRAND_SOCIAL_ANALYTICS_ENABLED')) {
    return (
      <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Socials</p>
            <h3 className="font-display text-3xl uppercase">Brand amplification</h3>
          </div>
        </div>
        <ComingSoon
          feature="BRAND_SOCIAL_ANALYTICS_ENABLED"
          title="Social Analytics"
          description="Track your brand's social media performance across Instagram, TikTok, and other platforms"
        />
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Socials</p>
          <h3 className="font-display text-3xl uppercase">Brand amplification</h3>
        </div>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Export metrics
        </button>
      </div>
      {BRAND_SOCIALS.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {BRAND_SOCIALS.map((social) => (
            <article key={social.channel} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{social.channel}</p>
              <p className="text-2xl font-semibold text-brand-black">{social.followers}</p>
              <p className="text-xs text-brand-black/60">{social.cadence}</p>
              <p className="text-xs text-brand-red">{social.highlight}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-6 text-center">
          <p className="text-sm text-brand-black/60">No social analytics available yet.</p>
          <p className="mt-2 text-xs text-brand-black/40">Connect your social accounts to see performance metrics here.</p>
        </div>
      )}
    </section>
  );
}

function BrandOpportunitiesSection({ session }) {
  // Guard with feature flag
  if (!isFeatureEnabled('BRAND_OPPORTUNITIES_ENABLED')) {
    return (
      <section className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
            <h3 className="font-display text-3xl uppercase">Automated creator matching</h3>
          </div>
        </div>
        <ComingSoon
          feature="BRAND_OPPORTUNITIES_ENABLED"
          title="Opportunities Marketplace"
          description="Post briefs and get matched with creators based on AI-powered fit analysis"
        />
      </section>
    );
  }

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [shortlists, setShortlists] = useState({});
  const [approvals, setApprovals] = useState({});

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setError(null);
        const response = await apiFetch("/api/opportunities");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setOpportunities(data);
        if (data.length > 0 && !selectedOpportunityId) {
          setSelectedOpportunityId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching opportunities:", err);
        setError(err.message || "Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const selectedOpportunity = useMemo(
    () => opportunities.find((deal) => deal.id === selectedOpportunityId) ?? null,
    [opportunities, selectedOpportunityId]
  );

  const recommendedMatches = useMemo(() => {
    if (!selectedOpportunity) return [];
    return computeCreatorMatches(selectedOpportunity, CREATOR_MATCH_POOL);
  }, [selectedOpportunity]);

  const shortlistedNames = selectedOpportunity ? shortlists[selectedOpportunity.id] ?? [] : [];
  const approvedNames = selectedOpportunity ? approvals[selectedOpportunity.id] ?? [] : [];

  const handleShortlist = (creatorName) => {
    if (!selectedOpportunity) return;
    setShortlists((prev) => {
      const existing = new Set(prev[selectedOpportunity.id] ?? []);
      existing.add(creatorName);
      return { ...prev, [selectedOpportunity.id]: Array.from(existing) };
    });
  };

  const handleApprove = (creatorName) => {
    if (!selectedOpportunity) return;
    handleShortlist(creatorName);
    setApprovals((prev) => {
      const existing = new Set(prev[selectedOpportunity.id] ?? []);
      existing.add(creatorName);
      return { ...prev, [selectedOpportunity.id]: Array.from(existing) };
    });
  };

  const handleSaveRecommended = () => {
    if (!selectedOpportunity) return;
    const topNames = recommendedMatches.slice(0, 3).map((match) => match.creator.name);
    setShortlists((prev) => {
      const merged = new Set([...(prev[selectedOpportunity.id] ?? []), ...topNames]);
      return { ...prev, [selectedOpportunity.id]: Array.from(merged) };
    });
  };

  return (
    <section className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
          <h3 className="font-display text-3xl uppercase">Automated creator matching</h3>
        </div>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Add opportunity
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/20 border-t-brand-black"></div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">Failed to load opportunities</p>
          <p className="mt-2 text-xs text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-red-600 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-600 hover:bg-red-600 hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : opportunities.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-3">
            {opportunities.map((deal) => {
            const isActive = deal.id === selectedOpportunityId;
            return (
              <button
                key={deal.id}
                onClick={() => setSelectedOpportunityId(deal.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive ? "border-brand-black bg-brand-linen/80" : "border-brand-black/10 bg-brand-linen/40 hover:border-brand-black/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-black">{deal.title}</p>
                    <p className="text-xs text-brand-black/60">{deal.status || "Active"}</p>
                  </div>
                  <Badge tone="positive">£{deal.payment?.toLocaleString() || "TBD"}</Badge>
                </div>
                <p className="mt-1 text-xs text-brand-black/60">Brand: {deal.brand || "Unknown"}</p>
              </button>
            );
          })}
        </div>
        <div className="space-y-6">
          {selectedOpportunity ? (
            <>
              <article className="space-y-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Opportunity brief</p>
                    <h4 className="font-display text-2xl uppercase">{selectedOpportunity.title}</h4>
                  </div>
                  <Badge tone="neutral">{selectedOpportunity.status || "Active"}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-brand-white/50 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Brand</p>
                    <p className="mt-1 text-sm font-medium">{selectedOpportunity.brand || "Not specified"}</p>
                  </div>
                  <div className="rounded-lg bg-brand-white/50 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Payment</p>
                    <p className="mt-1 text-sm font-medium">£{selectedOpportunity.payment?.toLocaleString() || "TBD"}</p>
                  </div>
                  {selectedOpportunity.deliverables && (
                    <div className="rounded-lg bg-brand-white/50 p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Deliverables</p>
                      <p className="mt-1 text-sm">{selectedOpportunity.deliverables}</p>
                    </div>
                  )}
                  {selectedOpportunity.deadline && (
                    <div className="rounded-lg bg-brand-white/50 p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Deadline</p>
                      <p className="mt-1 text-sm">{new Date(selectedOpportunity.deadline).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-brand-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Applications</p>
                  <p className="mt-2 text-sm text-brand-black/70">
                    {selectedOpportunity.Applications?.length || 0} applications received
                  </p>
                </div>
              </article>
              <VersionHistoryCard
                session={session}
                briefId={selectedOpportunity.id}
                data={selectedOpportunity}
                allowCreate={Boolean(session?.role === 'ADMIN' || session?.role === 'SUPERADMIN')}
                allowRestore={Boolean(session?.role === 'ADMIN' || session?.role === 'SUPERADMIN')}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Recommended matches</p>
                  <p className="text-sm text-brand-black/70">
                    Matching audience, demographic, style, performance, availability, pricing, and affinity signals.
                  </p>
                </div>
                <button
                  onClick={handleSaveRecommended}
                  className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
                >
                  Save top matches
                </button>
              </div>
              <div className="space-y-4">
                {Array.isArray(recommendedMatches) && recommendedMatches.length > 0 ? (
                  recommendedMatches.map((match) => {
                    const isShortlisted = shortlistedNames.includes(match.creator.name);
                    const isApproved = approvedNames.includes(match.creator.name);
                    return (
                      <article key={match.creator.name} className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-brand-black">{match.creator.name}</p>
                            <p className="text-xs text-brand-black/60">{match.creator.style}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone="positive">{match.score}% match</Badge>
                            {isApproved ? (
                              <Badge tone="positive">Approved</Badge>
                            ) : isShortlisted ? (
                              <Badge tone="neutral">Shortlisted</Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="grid gap-3 text-sm text-brand-black/70 md:grid-cols-3">
                          <OpportunityFact label="Audience" value={match.creator.audience} />
                          <OpportunityFact label="Demographics" value={match.creator.demographics} />
                          <OpportunityFact label="Availability" value={match.creator.availability} />
                          <OpportunityFact label="Pricing" value={match.creator.pricing} />
                          <OpportunityFact label="Performance" value={match.creator.performance} />
                          <OpportunityFact label="Affinity" value={match.creator.affinity} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {Array.isArray(match.signals) && match.signals.length > 0 ? (
                            match.signals.map((signal) => (
                              <span
                                key={signal}
                                className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em]"
                              >
                                {signal}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-brand-black/60">No signals available</span>
                          )}
                        </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => handleShortlist(match.creator.name)}
                          className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
                        >
                          {isShortlisted ? "Shortlisted" : "Shortlist"}
                        </button>
                        <button
                          onClick={() => handleApprove(match.creator.name)}
                          className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.3em] ${
                            isApproved ? "border-brand-red bg-brand-red text-white" : "border-brand-black/20 text-brand-black hover:bg-brand-black/5"
                          }`}
                        >
                          {isApproved ? "Approved" : "Approve"}
                        </button>
                      </div>
                    </article>
                  );
                })
                ) : (
                  <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-6 text-center">
                    <p className="text-sm text-brand-black/60">No recommended matches available</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-6 text-sm text-brand-black/60">
              Select an opportunity to view the auto-matched roster.
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-8 text-center">
          <p className="text-sm text-brand-black/60">No opportunities in your pipeline yet.</p>
          <p className="mt-2 text-xs text-brand-black/40">Click "Add opportunity" to start matching creators with your campaigns.</p>
        </div>
      )}
      <FileUploadPanel
        session={session}
        folder="brand-briefs"
        title="Brief attachments"
        description="Upload decks, scope docs, and example assets for this opportunity pipeline."
      />
    </section>
  );
}

function BrandFinancialSection() {
  const profiles = Object.keys(FINANCIAL_PROFILES);
  const [activeProfile, setActiveProfile] = useState(profiles[0]);
  const profileData = FINANCIAL_PROFILES[activeProfile];
  const { data: payoutSummary, loading: payoutLoading, error: payoutError } = usePayoutSummary();

  const statBlocks = [
    { label: "Revenue · 30 days", value: profileData.revenue30, detail: "Gross" },
    { label: "Revenue · 90 days", value: profileData.revenue90, detail: "Gross" },
    { label: "Projected revenue", value: profileData.projected, detail: "Forward 3 months" },
    { label: "Gross margin", value: `${Math.round(profileData.grossMargin * 100)}%`, detail: "After ops fees" }
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Financials & payouts</p>
          <h3 className="font-display text-3xl uppercase">Revenue health</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => (
            <button
              key={profile}
              onClick={() => setActiveProfile(profile)}
              className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] ${
                activeProfile === profile ? "border-brand-red bg-brand-red text-white" : "border-brand-black/30"
              }`}
            >
              {profile}
            </button>
          ))}
          <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
            Export CSV
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {statBlocks.map((item) => (
          <article key={item.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{item.label}</p>
            <p className="text-2xl font-semibold text-brand-black">
              {typeof item.value === "number" ? `£${item.value.toLocaleString()}` : item.value}
            </p>
            <p className="text-xs text-brand-black/50">{item.detail}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FinanceListCard title="Payouts pending" items={profileData.payoutsPending} />
        <FinanceListCard title="Invoices" items={profileData.invoices} />
        <FinanceListCard title="Tax forms" items={profileData.taxForms} />
        <FinanceListCard title="Payment history" items={profileData.payments} />
      </div>
      <div className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-linen/40 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Stripe Connect · PayPal</p>
        <p className="mt-2 text-sm text-brand-black/70">
          Stripe Connect handles primary settlement, with PayPal as a backup rail for creators who cannot receive
          bank transfers. Toggle per profile to see wallet IDs, transfer cadence, and audit trails.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.35em]">
          <span className="rounded-full border border-brand-black/15 bg-white px-3 py-1">Stripe connected</span>
          <span className="rounded-full border border-brand-black/15 bg-white px-3 py-1">PayPal active</span>
          <span className="rounded-full border border-brand-black/15 bg-white px-3 py-1">2FA enforced</span>
        </div>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Live payouts</p>
            <h4 className="font-display text-2xl uppercase">Creator settlement</h4>
          </div>
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/60">
            {payoutLoading ? "Syncing" : "Updated"}
          </span>
        </div>
        {payoutError ? (
          <p className="mt-3 text-sm text-brand-red">{payoutError}</p>
        ) : payoutSummary ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Object.entries(payoutSummary.summary || {}).map(([status, amount]) => (
              <article key={status} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{status}</p>
                <p className="font-display text-xl uppercase text-brand-black">£{(amount / 100).toFixed(2)}</p>
              </article>
            ))}
            {!Object.keys(payoutSummary.summary || {}).length ? (
              <p className="text-sm text-brand-black/60">No payouts yet.</p>
            ) : null}
          </div>
        ) : null}
        {payoutSummary?.latestPayouts?.length ? (
          <div className="mt-4 space-y-2">
            {payoutSummary.latestPayouts.map((payout) => (
              <div key={payout.id} className="rounded-xl border border-brand-black/10 bg-brand-linen/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-black">£{(payout.amount / 100).toFixed(2)}</p>
                  <Badge tone={payout.status === "paid" ? "positive" : "neutral"}>{payout.status}</Badge>
                </div>
                <p className="text-xs text-brand-black/60">{new Date(payout.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BrandMessagesSection() {
  const navigate = useNavigate();
  const threads = [];

  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Messages & Opportunities</p>
          <h3 className="font-display text-3xl uppercase">Threaded comms</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/creator/opportunities')}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Email Opportunities
          </button>
          <Link
            to="/admin/messaging"
            className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
          >
            Open inbox
          </Link>
        </div>
      </div>
      <div className="space-y-2">
        {Array.isArray(threads) && threads.length > 0 ? (
          threads.map((thread) => (
            <div
              key={thread.subject}
              className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3 text-sm text-brand-black/80"
            >
              <p className="font-semibold text-brand-black">{thread.subject}</p>
              <p className="text-xs text-brand-black/60">Contact: {thread.contact}</p>
              <p className="text-xs text-brand-red">{thread.status}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3 text-center">
            <p className="text-sm text-brand-black/60">No active threads</p>
          </div>
        )}
      </div>
    </section>
  );
}

function BrandProfileSection() {
  return (
    <section className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Brand onboarding</p>
      <h3 className="font-display text-3xl uppercase">Account + application</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <h4 className="font-semibold uppercase tracking-[0.3em] text-brand-red">Account details</h4>
          <label className="mt-3 block text-xs uppercase tracking-[0.3em] text-brand-black/60">
            Brand name
            <input className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
          </label>
          <label className="mt-3 block text-xs uppercase tracking-[0.3em] text-brand-black/60">
            Primary contact
            <input className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
          </label>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <h4 className="font-semibold uppercase tracking-[0.3em] text-brand-red">Bank details</h4>
          <label className="mt-3 block text-xs uppercase tracking-[0.3em] text-brand-black/60">
            IBAN / Account number
            <input className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
          </label>
          <label className="mt-3 block text-xs uppercase tracking-[0.3em] text-brand-black/60">
            Billing contact
            <input className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
          </label>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Retainer</p>
          <select className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none">
            <option>3-month retainer (default)</option>
            <option>6-month retainer</option>
            <option>12-month retainer</option>
          </select>
          <p className="mt-2 text-xs text-brand-black/60">
            All retainers include invoicing, ops, and reporting guardrails.
          </p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Talent application</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Only 12 spaces per year. Brands must apply; creators define how they identify and what markets they support.
          </p>
          <FeatureGate feature="BRIEF_APPLICATIONS_ENABLED" mode="button">
            <button className="mt-4 w-full rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]">
              Submit application
            </button>
          </FeatureGate>
        </div>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Identity guidelines</p>
        <p className="mt-2 text-sm text-brand-black/70">
          Creators self-identify; the platform reflects their wording and categories. Ensure campaign briefs respect how each creator describes their work, culture, and communities.
        </p>
      </div>
    </section>
  );
}

function BrandSettingsSection() {
  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Settings</p>
          <h3 className="font-display text-3xl uppercase">Permissions & alerts</h3>
        </div>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Update policy
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Notifications</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
            <li>• Brief approvals → On</li>
            <li>• Finance alerts → On</li>
            <li>• Creator messages → Digest</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Access</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
            <li>• Finance seat — enabled</li>
            <li>• Messaging — enabled</li>
            <li>• Opportunities — enabled</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function OpportunityFact({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{label}</p>
      <p className="text-sm text-brand-black/80">{value}</p>
    </div>
  );
}

function FinanceListCard({ title, items }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
      <div className="mt-3 space-y-3 text-sm text-brand-black/80">
        {items?.length ? (
          items.map((item) => (
            <div key={item.id || item.label} className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
              <p className="font-semibold text-brand-black">{item.recipient || item.label || item.id}</p>
              {item.amount ? (
                <p className="text-xs text-brand-black/60">
                  {typeof item.amount === "number" ? `£${item.amount.toLocaleString()}` : item.amount}
                </p>
              ) : null}
              <p className="text-xs text-brand-black/60">{item.status || item.detail || item.date || item.due}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-brand-black/60">Nothing queued.</p>
        )}
      </div>
    </div>
  );
}

function computeCreatorMatches(opportunity, pool) {
  return pool
    .map((creator) => {
      const signals = [];
      if (sharesLanguage(opportunity.audience, creator.audience)) signals.push("Audience match");
      if (sharesLanguage(opportunity.demographics, creator.demographics)) signals.push("Demographics");
      if (sharesLanguage(opportunity.style, creator.style)) signals.push("Content style");
      if (sharesLanguage(opportunity.performance, creator.performance)) signals.push("Performance");
      if (sharesLanguage(opportunity.availability, creator.availability)) signals.push("Availability");
      if (sharesLanguage(opportunity.pricing, creator.pricing)) signals.push("Pricing");
      if (sharesLanguage(opportunity.affinity, creator.affinity)) signals.push("Brand affinity");
      const score = Math.min(40 + signals.length * 9, 98);
      return { creator, score, signals };
    })
    .sort((a, b) => b.score - a.score);
}

function sharesLanguage(source = "", target = "") {
  const sourceTokens = normalizeTokens(source);
  const targetLower = target.toLowerCase();
  return sourceTokens.some((token) => token && targetLower.includes(token));
}

function normalizeTokens(value) {
  return (value ?? "")
    .toString()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}
