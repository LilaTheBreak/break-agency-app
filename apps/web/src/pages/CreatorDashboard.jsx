import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { Badge } from "../components/Badge.jsx";
import { CountUpNumber } from "../components/CountUpNumber.jsx";
import { FileUploadPanel } from "../components/FileUploadPanel.jsx";
import { ContractsPanel } from "../components/ContractsPanel.jsx";
import { VersionHistoryCard } from "../components/VersionHistoryCard.jsx";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import { OnboardingSnapshot } from "../components/OnboardingSnapshot.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { Roles } from "../auth/session.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useCrmOnboarding } from "../hooks/useCrmOnboarding.js";
import { CrmContactPanel } from "../components/CrmContactPanel.jsx";
import { getContact } from "../lib/crmContacts.js";
import { useNavigate } from "react-router-dom";
import { isFeatureEnabled } from "../config/features.js";
import { ComingSoon, BetaBadge } from "../components/ComingSoon.jsx";
import { SkeletonMetrics, SkeletonSection, SkeletonCampaign, SkeletonWithMessage } from "../components/SkeletonLoader.jsx";
import { SkeletonMetrics, SkeletonSection, SkeletonCampaign, SkeletonWithMessage } from "../components/SkeletonLoader.jsx";

export function CreatorDashboard({ session }) {
  const auth = useAuth();
  const activeSession = session || auth.user;
  if (auth.loading) return <LoadingScreen />;
  if (!activeSession) return <Navigate to="/" replace />;

  return (
    <ControlRoomView config={CONTROL_ROOM_PRESETS.talent} session={activeSession}>
      <CreatorRevenueSection />
      <CreatorEmailOpportunitiesSection />
      <CreatorOpportunitiesSection />
      <CreatorCampaignsPanel session={activeSession} />
      <CreatorSubmissionsSection session={activeSession} />
      <CreatorOnboardingSection />
      <CreatorContractsSection session={activeSession} />
      <CrmContactPanel contact={getContact(activeSession?.email)} heading="CRM contact" />
    </ControlRoomView>
  );
}

function CreatorRevenueSection() {
  return (
    <section id="creator-overview" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Revenue & growth</p>
          <h3 className="font-display text-3xl uppercase">Momentum trackers</h3>
        </div>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
        <p className="text-sm text-brand-black/60">Metrics not yet available</p>
        <p className="mt-2 text-xs text-brand-black/40">Revenue tracking, audience growth, and deal metrics will appear once your campaigns are live</p>
      </div>
    </section>
  );
}

function CreatorEmailOpportunitiesSection() {
  const navigate = useNavigate();
  return (
    <section className="mt-6 space-y-4 rounded-3xl border border-brand-black/10 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-purple-600">AI-Powered Inbox</p>
          <h3 className="font-display text-3xl uppercase">Email Opportunities</h3>
          <p className="mt-2 text-sm text-brand-black/70">Automatically scan and classify brand opportunities from your Gmail inbox</p>
        </div>
        <button
          onClick={() => navigate('/creator/opportunities')}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          View Opportunities
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-purple-200 bg-white p-4">
          <p className="text-xs text-brand-black/60 mb-1">Event Invites</p>
          <p className="text-2xl font-bold text-purple-600">—</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-white p-4">
          <p className="text-xs text-brand-black/60 mb-1">Brand Opportunities</p>
          <p className="text-2xl font-bold text-blue-600">—</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-white p-4">
          <p className="text-xs text-brand-black/60 mb-1">Collaborations</p>
          <p className="text-2xl font-bold text-green-600">—</p>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-white p-4">
          <p className="text-xs text-brand-black/60 mb-1">Inbound Interest</p>
          <p className="text-2xl font-bold text-orange-600">—</p>
        </div>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-white p-6">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h4 className="font-semibold text-brand-black">How it works</h4>
            <p className="text-xs text-brand-black/60">Connect your Gmail to unlock AI-powered opportunity detection</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-brand-black/70">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>AI scans your inbox for brand partnerships, event invites, and collaboration requests</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Automatically extracts key details: brand names, dates, compensation, deliverables</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Filters out spam, newsletters, and irrelevant emails</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Provides suggested actions and confidence scores for each opportunity</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

const OPPORTUNITY_STAGE_FLOW = [
  "Open briefs",
  "Shortlisted",
  "Pending submissions",
  "Awaiting approval",
  "Accepted",
  "Rejected"
];

const STAGE_ACTIONS = {
  "Open briefs": { label: "Apply to brief", nextStage: "Shortlisted" },
  "Shortlisted": { label: "Submit concept", nextStage: "Pending submissions" },
  "Pending submissions": { label: "Upload final content", nextStage: "Awaiting approval" },
  "Awaiting approval": { label: "Add status note", nextStage: null },
  "Accepted": { label: "View deliverables", nextStage: null },
  "Rejected": { label: "View feedback", nextStage: null }
};

// Creator opportunities - guarded by feature flag CREATOR_OPPORTUNITIES_ENABLED
const CREATOR_OPPORTUNITY_PIPELINE = [];

const SUBMISSION_TABS = ["Drafts", "Revisions requested", "Awaiting approval", "Scheduled", "Approved", "Usage log"];

// Submissions - guarded by feature flag CREATOR_SUBMISSIONS_ENABLED
const SUBMISSION_PAYLOADS = [];

function CreatorOpportunitiesSection() {
  // Guard with feature flag
  if (!isFeatureEnabled('CREATOR_OPPORTUNITIES_ENABLED')) {
    return (
      <section id="creator-opportunities" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities system</p>
            <h3 className="font-display text-3xl uppercase">Apply, submit, track</h3>
          </div>
        </div>
        <ComingSoon
          feature="CREATOR_OPPORTUNITIES_ENABLED"
          title="Creator Opportunities"
          description="Browse open briefs, submit applications, and track your submissions through the approval process"
        />
      </section>
    );
  }

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setError(null);
        const response = await apiFetch('/api/opportunities/creator/all');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError(err.message || 'Failed to load opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  if (loading) {
    return (
      <section id="creator-opportunities" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities system</p>
            <h3 className="font-display text-3xl uppercase">Apply, submit, track</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/20 border-t-brand-black"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="creator-opportunities" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities system</p>
            <h3 className="font-display text-3xl uppercase">Apply, submit, track</h3>
          </div>
        </div>
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
      </section>
    );
  }

  if (opportunities.length === 0) {
    return (
      <section id="creator-opportunities" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities system</p>
            <h3 className="font-display text-3xl uppercase">Apply, submit, track</h3>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No opportunities yet</p>
          <p className="mt-2 text-xs text-brand-black/40">Brand opportunities will appear here once campaigns are live</p>
        </div>
      </section>
    );
  }

  return (
    <section id="creator-opportunities" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities system</p>
          <h3 className="font-display text-3xl uppercase">Apply, submit, track</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {opportunities.map((opp) => (
          <OpportunitySummaryCard
            key={opp.id}
            opportunity={opp}
            applicationStatus={opp.applicationStatus}
            hasSubmission={opp.hasSubmission}
          />
        ))}
      </div>
    </section>
  );
}

function OpportunitySummaryCard({ opportunity, applicationStatus, hasSubmission }) {
  const handleApply = async () => {
    if (applicationStatus) return;
    
    try {
      const response = await apiFetch(`/api/opportunities/${opportunity.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          pitch: '',
          proposedRate: null,
        }),
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      alert('Failed to apply to opportunity');
    }
  };

  return (
    <article className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold text-brand-black">{opportunity.title}</h4>
          <p className="text-xs text-brand-black/60">{opportunity.brand || 'Brand'}</p>
        </div>
        {opportunity.payment && (
          <Badge tone="positive">{opportunity.payment}</Badge>
        )}
      </div>
      
      {opportunity.deliverables && (
        <p className="text-sm text-brand-black/70">{opportunity.deliverables}</p>
      )}
      {opportunity.deadline && (
        <p className="text-xs text-brand-black/60">Deadline: {opportunity.deadline}</p>
      )}
      
      <div className="flex flex-wrap items-center gap-2">
        {!applicationStatus && (
          <button
            type="button"
            onClick={handleApply}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white hover:bg-brand-red/90"
          >
            Apply now
          </button>
        )}
        {applicationStatus && (
          <Badge tone={applicationStatus === 'shortlisted' ? 'positive' : 'neutral'}>
            {applicationStatus}
          </Badge>
        )}
        {hasSubmission && (
          <Badge tone="info">Has submission</Badge>
        )}
      </div>
    </article>
  );
}

function OpportunityDetailPanel({ opportunity }) {
  if (!opportunity) {
    return (
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/70">
        Select a brief to see the tracker.
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Status tracker</p>
        <h4 className="font-semibold text-brand-black">{opportunity.title}</h4>
        <p className="text-xs text-brand-black/60">{opportunity.brand}</p>
      </div>
      <OpportunityTimeline stage={opportunity.status} />
      <div className="grid gap-2 text-xs text-brand-black/70">
        <p>
          <span className="uppercase tracking-[0.3em] text-brand-black/50">Due:</span> {opportunity.due}
        </p>
        <p>
          <span className="uppercase tracking-[0.3em] text-brand-black/50">Deliverables:</span> {opportunity.deliverables}
        </p>
        <p>
          <span className="uppercase tracking-[0.3em] text-brand-black/50">Latest:</span> {opportunity.lastUpdate}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Requirements</p>
        <ul className="mt-2 space-y-1 text-sm text-brand-black/80">
          {opportunity.requirements.map((req) => (
            <li key={req}>• {req}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OpportunityTimeline({ stage, compact = false }) {
  const activeIndex = OPPORTUNITY_STAGE_FLOW.indexOf(stage);
  const containerClass = compact ? "flex flex-wrap items-center gap-2 text-[0.6rem]" : "space-y-2 text-sm";
  return (
    <div className={containerClass}>
      {OPPORTUNITY_STAGE_FLOW.map((step, index) => {
        const reached = index <= activeIndex;
        const isCurrent = index === activeIndex;
        return (
          <div key={step} className={`flex items-center gap-1 ${compact ? "" : "text-left"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${reached ? "bg-brand-red" : "bg-brand-black/20"}`} />
            <span className={isCurrent ? "font-semibold text-brand-black" : "text-brand-black/50"}>{step}</span>
            {compact && index < OPPORTUNITY_STAGE_FLOW.length - 1 ? (
              <span className="h-px w-4 bg-brand-black/20" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CreatorOnboardingSection() {
  const { user } = useAuth();
  const onboarding = useCrmOnboarding(user?.email);
  return (
    <section id="creator-account" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <OnboardingSnapshot data={onboarding} role={user?.role || Roles.CREATOR} heading="Onboarding → CRM" />
    </section>
  );
}

function CreatorSubmissionsSection({ session }) {
  // Guard with feature flag
  if (!isFeatureEnabled('CREATOR_SUBMISSIONS_ENABLED')) {
    return (
      <section id="creator-submissions" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Submissions</p>
            <h3 className="font-display text-3xl uppercase">Uploads, revisions, approvals</h3>
          </div>
        </div>
        <ComingSoon
          feature="CREATOR_SUBMISSIONS_ENABLED"
          title="Submission Workflow"
          description="Upload drafts, receive revision requests, and track content through the approval process"
        />
      </section>
    );
  }

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setError(null);
        const response = await apiFetch('/api/submissions');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <section id="creator-submissions" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Submissions</p>
            <h3 className="font-display text-3xl uppercase">Uploads, revisions, approvals</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/20 border-t-brand-black"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="creator-submissions" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Submissions</p>
            <h3 className="font-display text-3xl uppercase">Uploads, revisions, approvals</h3>
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">Failed to load submissions</p>
          <p className="mt-2 text-xs text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-red-600 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-600 hover:bg-red-600 hover:text-white"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (submissions.length === 0) {
    return (
      <section id="creator-submissions" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Submissions</p>
            <h3 className="font-display text-3xl uppercase">Uploads, revisions, approvals</h3>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No submissions yet</p>
          <p className="mt-2 text-xs text-brand-black/40">Content submission tracking will appear once you have active campaigns</p>
        </div>
      </section>
    );
  }

  return (
    <section id="creator-submissions" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Submissions</p>
          <h3 className="font-display text-3xl uppercase">Uploads, revisions, approvals</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </div>
    </section>
  );
}

function CreatorContractsSection({ session }) {
  return (
    <section id="creator-contracts" className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <ContractsPanel
        session={session}
        title="Contracts"
        description="Check status of retainers, licensing agreements, and residency documents."
      />
    </section>
  );
}

function CreatorCampaignsPanel({ session }) {
  const { campaigns, loading, error } = useCampaigns({ session });
  return (
    <section id="creator-campaigns" className="mt-6 space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Campaigns</p>
          <h3 className="font-display text-3xl uppercase">Multi-brand workload</h3>
        </div>
      </div>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {loading && !campaigns.length ? (
        <SkeletonWithMessage message="Loading your active campaigns and collaborations...">
          <SkeletonCampaign />
        </SkeletonWithMessage>
      ) : campaigns.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No campaigns yet</p>
          <p className="mt-2 text-xs text-brand-black/40">Campaign assignments will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.slice(0, 2).map((campaign) => (
            <MultiBrandCampaignCard key={campaign.id} campaign={campaign} showNotes={false} />
          ))}
        </div>
      )}
    </section>
  );
}

function SubmissionCard({ submission }) {
  const opportunityTitle = submission.opportunity?.title || submission.title || 'Submission';
  const filesCount = Array.isArray(submission.files) ? submission.files.length : 0;
  const revisionsCount = Array.isArray(submission.revisions) ? submission.revisions.length : 0;
  
  const statusColors = {
    draft: 'neutral',
    pending: 'info',
    approved: 'positive',
    revision: 'warning',
    rejected: 'negative'
  };

  return (
    <article className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{submission.status}</p>
          <h4 className="font-semibold text-brand-black">{opportunityTitle}</h4>
          <p className="text-xs text-brand-black/60">{submission.platform}</p>
        </div>
        <Badge tone={statusColors[submission.status] || 'neutral'}>{submission.status}</Badge>
      </div>
      {submission.feedback && (
        <p className="text-xs text-brand-black/60 italic">{submission.feedback}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/50">
        <span>{filesCount} files</span>
        <span className="h-px w-6 bg-brand-black/20" />
        <span>{revisionsCount} revisions</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em]"
        >
          View details
        </button>
      </div>
    </article>
  );
}

function SubmissionDetailPanel({ submission, session }) {
  if (!submission) {
    return (
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/70">
        Select an upload to review files, captions, scheduling, and usage rights.
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Submission detail</p>
        <h4 className="font-semibold text-brand-black">{submission.title}</h4>
        <p className="text-xs text-brand-black/60">
          {submission.platform} · {submission.type}
        </p>
      </div>
      <SubmissionFilesList files={submission.files} />
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Revisions</p>
        {submission.revisions.length ? (
          <ul className="mt-2 space-y-1 text-sm text-brand-black/80">
            {submission.revisions.map((revision, index) => (
              <li key={`${revision.note}-${index}`}>• {revision.note} ({revision.date})</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-brand-black/50">No revisions requested.</p>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Captions</p>
        <p className="mt-1 text-sm text-brand-black/80">{submission.captions || "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Links</p>
        {submission.finalLinks.length ? (
          <ul className="mt-1 space-y-1 text-sm text-brand-black/80">
            {submission.finalLinks.map((link) => (
              <li key={link.label}>
                <a href={link.url} className="text-brand-red underline" target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-brand-black/50">No links provided yet.</p>
        )}
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3 text-xs text-brand-black/70">
        <p className="font-semibold text-brand-black">Usage rights</p>
        <p>{submission.usageRights}</p>
      </div>
      <VersionHistoryCard
        session={session}
        briefId={submission.id}
        data={submission}
        allowCreate={Boolean(session?.role === 'ADMIN' || session?.role === 'SUPERADMIN' || session?.role === 'AGENT')}
        allowRestore={Boolean(session?.role === 'ADMIN' || session?.role === 'SUPERADMIN' || session?.role === 'AGENT')}
      />
    </div>
  );
}

function SubmissionFilesList({ files }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Files</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {files.length ? (
          files.map((file) => (
            <span
              key={file.label}
              className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-xs text-brand-black/80"
            >
              {file.label} · {file.kind}
            </span>
          ))
        ) : (
          <span className="text-xs text-brand-black/50">No files uploaded.</span>
        )}
      </div>
    </div>
  );
}

function SubmissionUsageLog({ submissions }) {
  const usageEntries = submissions
    .filter((submission) => submission.stage === "Approved" || submission.stage === "Scheduled")
    .map((submission) => ({
      id: submission.id,
      title: submission.title,
      rights: submission.usageRights,
      schedule: submission.schedule,
      platform: submission.platform
    }));

  if (!usageEntries.length) {
    return (
      <p className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/70">
        No approved content yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {usageEntries.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          <p className="font-semibold text-brand-black">{entry.title}</p>
          <p className="text-xs text-brand-black/60">{entry.platform}</p>
          <p className="mt-2 text-xs text-brand-black/60">Usage rights: {entry.rights}</p>
          <p className="text-xs text-brand-black/60">Schedule: {entry.schedule}</p>
        </div>
      ))}
    </div>
  );
}
