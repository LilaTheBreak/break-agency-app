import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { Badge } from "../components/Badge.jsx";
import { CountUpNumber } from "../components/CountUpNumber.jsx";
import { FileUploadPanel } from "../components/FileUploadPanel.jsx";
import { ContractsPanel } from "../components/ContractsPanel.jsx";
import { VersionHistoryCard } from "../components/VersionHistoryCard.jsx";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { FALLBACK_CAMPAIGNS } from "../data/campaignsFallback.js";
import { Roles } from "../auth/session.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

export function CreatorDashboard({ session }) {
  const auth = useAuth();
  const activeSession = session || auth.user;
  if (auth.loading) return <LoadingScreen />;
  if (!activeSession) return <Navigate to="/" replace />;

  return (
    <ControlRoomView config={CONTROL_ROOM_PRESETS.talent} session={activeSession}>
      <CreatorRevenueSection />
      <CreatorOpportunitiesSection />
      <CreatorCampaignsPanel session={activeSession} />
      <CreatorSubmissionsSection session={activeSession} />
      <CreatorOnboardingSection />
      <CreatorContractsSection session={activeSession} />
    </ControlRoomView>
  );
}

function CreatorRevenueSection() {
  const stats = [
    { label: "Overall revenue target", value: 120000, progress: 54, prefix: "£" },
    { label: "Audience growth", value: 8.2, context: "Last 30 days", suffix: "%", decimals: 1 },
    { label: "Deals this month", value: 6, context: "Signed" }
  ];
  const growthTrend = [
    { label: "Jan", value: 3 },
    { label: "Feb", value: 5 },
    { label: "Mar", value: 7 },
    { label: "Apr", value: 5 },
    { label: "May", value: 9 }
  ];
  return (
    <section id="creator-overview" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Revenue & growth</p>
          <h3 className="font-display text-3xl uppercase">Momentum trackers</h3>
        </div>
        <Badge tone="neutral">Updated hourly</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{stats[0].label}</p>
          <p className="mt-1 text-3xl font-semibold text-brand-black">
            <CountUpNumber value={stats[0].value} prefix="£" />
          </p>
          <ProgressBar value={stats[0].progress} />
          <p className="mt-1 text-xs text-brand-black/50">{stats[0].progress}% achieved</p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Audience growth</p>
          <p className="mt-1 text-3xl font-semibold text-brand-black">
            <CountUpNumber value={stats[1].value} suffix="%" decimals={1} />
          </p>
          <p className="text-xs text-brand-black/50">{stats[1].context}</p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Deals this month</p>
          <p className="mt-1 text-3xl font-semibold text-brand-black">
            <CountUpNumber value={stats[2].value} />
          </p>
          <p className="text-xs text-brand-black/50">{stats[2].context}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Deals trend</p>
        <div className="mt-4 grid grid-cols-5 gap-3 text-center text-sm text-brand-black/70">
          {growthTrend.map((point) => (
            <div key={point.label}>
              <div className="mx-auto h-20 w-6 rounded-full bg-brand-black/10">
                <div
                  className="w-full rounded-full bg-brand-red"
                  style={{ height: `${point.value * 10}%` }}
                />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.2em]">{point.label}</p>
              <p className="text-xs">{point.value} deals</p>
            </div>
          ))}
        </div>
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

const CREATOR_OPPORTUNITY_PIPELINE = [
  {
    id: "luxury-travel",
    title: "Luxury Travel Drop",
    brand: "FiveStar Collective",
    payout: 8000,
    due: "Pitch closes 12 Dec",
    deliverables: "2x IG Reels + 1 TikTok travel diary",
    status: "Open briefs",
    requirements: ["Showcase elevated hotel experiences", "Highlight unique dining moments", "Tag brand hashtag #FiveStarResidency"],
    lastUpdate: "Awaiting your application"
  },
  {
    id: "ai-banking",
    title: "AI Banking Launch",
    brand: "NuWave Finance",
    payout: 5200,
    due: "Creative sync 14 Dec",
    deliverables: "Explainer carousel + landing page walkthrough",
    status: "Shortlisted",
    requirements: ["Include AI compliance callout", "Use brand palette", "Mention referral code BREAK20"],
    lastUpdate: "Send concept moodboard"
  },
  {
    id: "doha-hospitality",
    title: "Doha Hospitality Tour",
    brand: "GCC Tourism Board",
    payout: 9200,
    due: "Draft due 18 Dec",
    deliverables: "3x TikTok vlogs + itinerary PDF",
    status: "Pending submissions",
    requirements: ["Focus on premium experience", "Include Arabic subtitles", "Upload raw files to Break Drive"],
    lastUpdate: "Waiting on final cut"
  },
  {
    id: "fintech-onboarding",
    title: "Fintech Walkthrough",
    brand: "FlowPay",
    payout: 6200,
    due: "Approval call 22 Dec",
    deliverables: "1x YouTube long-form + 2 cutdowns",
    status: "Awaiting approval",
    requirements: ["Show onboarding flow", "Add call-to-action overlay", "Highlight security features"],
    lastUpdate: "Brand reviewing v2 today"
  },
  {
    id: "residency-series",
    title: "Creator Residency Series",
    brand: "Break Agency",
    payout: 11000,
    due: "Wrap-up 02 Jan",
    deliverables: "Live stream + recap reel",
    status: "Accepted",
    requirements: ["Share behind-the-scenes", "Capture community Q&A", "Deliver retro report"],
    lastUpdate: "Payment queued once retro uploaded"
  },
  {
    id: "fast-fashion",
    title: "Fast Fashion Capsule",
    brand: "StyleDrop",
    payout: 3000,
    due: "Pitch review rolling",
    deliverables: "3x IG static + 1 story set",
    status: "Rejected",
    requirements: ["Focus on denim line", "No mention of competitors", "Highlight sustainability"],
    lastUpdate: "Roster already filled—see feedback"
  }
];

const SUBMISSION_TABS = ["Drafts", "Revisions requested", "Awaiting approval", "Scheduled", "Approved", "Usage log"];

const SUBMISSION_PAYLOADS = [
  {
    id: "submission-1",
    title: "Luxury Travel Drop",
    platform: "Instagram Reels",
    type: "Video",
    stage: "Awaiting approval",
    files: [
      { label: "Final edit.mp4", kind: "video" },
      { label: "Thumbnail.png", kind: "thumbnail" },
      { label: "Captions.srt", kind: "captions" }
    ],
    revisions: [{ note: "Tweak CTA to emphasise hospitality credit.", date: "Dec 03" }],
    finalLinks: [{ label: "Reel link", url: "https://instagram.com/thebreakco" }],
    captions: "Traveling through Doha with @FiveStarCollective — tap for premium perks.",
    usageRights: "Global paid + organic 12 months",
    schedule: "Ready to schedule after approval"
  },
  {
    id: "submission-2",
    title: "AI Banking Walkthrough",
    platform: "TikTok",
    type: "Short-form",
    stage: "Revisions requested",
    files: [
      { label: "Draft v2.mp4", kind: "video" },
      { label: "TikTok-caption.txt", kind: "captions" }
    ],
    revisions: [
      { note: "Mention referral code earlier", date: "Dec 01" },
      { note: "Add screenshot of security page", date: "Dec 02" }
    ],
    finalLinks: [],
    captions: "The AI-powered onboarding that doesn't feel like paperwork. Use BREAK20.",
    usageRights: "Organic only",
    schedule: "Pending admin review"
  },
  {
    id: "submission-3",
    title: "Doha Hospitality Tour",
    platform: "UGC variant",
    type: "UGC package",
    stage: "Scheduled",
    files: [
      { label: "UGC variant.mov", kind: "video" },
      { label: "Story set.psd", kind: "deliverable" },
      { label: "Thumbnail_UCG.png", kind: "thumbnail" }
    ],
    revisions: [],
    finalLinks: [{ label: "Break Drive folder", url: "https://drive.google.com" }],
    captions: "Slide into Doha with Break — curated experiences daily.",
    usageRights: "Paid + whitelisting 18 months",
    schedule: "Scheduled for Dec 15 10:00 GMT"
  },
  {
    id: "submission-4",
    title: "Residency Recap",
    platform: "YouTube",
    type: "Long-form",
    stage: "Drafts",
    files: [
      { label: "Residency_script.docx", kind: "document" },
      { label: "Thumbnail_draft.png", kind: "thumbnail" }
    ],
    revisions: [],
    finalLinks: [],
    captions: "Residency recap draft caption will go here.",
    usageRights: "Pending admin approval",
    schedule: "Not scheduled"
  },
  {
    id: "submission-5",
    title: "Retail Capsule Series",
    platform: "Instagram + TikTok",
    type: "Multi-platform",
    stage: "Approved",
    files: [
      { label: "IG Reel_final.mp4", kind: "video" },
      { label: "TikTok_cut.mov", kind: "video" },
      { label: "Caption_pack.txt", kind: "captions" }
    ],
    revisions: [],
    finalLinks: [{ label: "TikTok live link", url: "https://tiktok.com/@thebreakco" }],
    captions: "Sneak peek at the capsule drop — code BREAKCAP for early access.",
    usageRights: "Paid + brand whitelisting 24 months",
    schedule: "Live since Dec 01"
  }
];

function CreatorOpportunitiesSection() {
  const [opportunities, setOpportunities] = useState(CREATOR_OPPORTUNITY_PIPELINE);
  const [activeStatus, setActiveStatus] = useState(OPPORTUNITY_STAGE_FLOW[0]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(CREATOR_OPPORTUNITY_PIPELINE[0].id);

  const gaps = [
    "No affiliate links connected. Add Amazon + RewardStyle IDs.",
    "You rarely post long-form. Consider monthly deep dives.",
    "Finance vertical performing better than travel last quarter."
  ];
  const quickWins = [
    "Enable auto-invoice on Opportunities board submissions.",
    "Add 3 hero testimonials to boost rate card approval.",
    "Repurpose latest Residency vlog into 15s reels."
  ];

  const filtered = opportunities.filter((opp) => opp.status === activeStatus);
  const selectedOpportunity = opportunities.find((opp) => opp.id === selectedOpportunityId);

  const handleAction = (id) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== id) return opp;
        const action = STAGE_ACTIONS[opp.status];
        if (!action?.nextStage) return opp;
        return { ...opp, status: action.nextStage, lastUpdate: `Moved to ${action.nextStage} just now.` };
      })
    );
  };

  return (
    <section id="creator-opportunities" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities system</p>
          <h3 className="font-display text-3xl uppercase">Apply, submit, track</h3>
        </div>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          View full board
        </button>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {OPPORTUNITY_STAGE_FLOW.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStatus(stage)}
              className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.25em] ${
                activeStatus === stage ? "border-brand-black bg-brand-black text-brand-white" : "border-brand-black/30"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {filtered.length ? (
              filtered.map((opportunity) => (
                <OpportunitySummaryCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onAction={() => handleAction(opportunity.id)}
                  onTrack={() => setSelectedOpportunityId(opportunity.id)}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm text-brand-black/70">
                Nothing in this stage yet.
              </p>
            )}
          </div>
          <div className="space-y-4">
            <OpportunityDetailPanel opportunity={selectedOpportunity} />
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Gaps analysis</p>
              <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
                {gaps.map((gap) => (
                  <li key={gap}>• {gap}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Quick wins</p>
              <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
                {quickWins.map((win) => (
                  <li key={win}>• {win}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OpportunitySummaryCard({ opportunity, onAction, onTrack }) {
  const action = STAGE_ACTIONS[opportunity.status];
  return (
    <article className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{opportunity.status}</p>
          <h4 className="font-semibold text-brand-black">{opportunity.title}</h4>
          <p className="text-xs text-brand-black/60">{opportunity.brand}</p>
        </div>
        <Badge tone="positive">£{opportunity.payout.toLocaleString()}</Badge>
      </div>
      <p className="text-sm text-brand-black/70">{opportunity.due}</p>
      <p className="text-xs text-brand-black/60">Deliverables: {opportunity.deliverables}</p>
      <OpportunityTimeline stage={opportunity.status} compact />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTrack}
          className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em]"
        >
          Track status
        </button>
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-brand-white hover:bg-brand-black/90"
          >
            {action.label}
          </button>
        ) : null}
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
  return (
    <section id="creator-account" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Onboarding questionnaire</p>
      <h3 className="font-display text-3xl uppercase">Tell Break how you work</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
          Revenue target (annual)
          <input type="number" placeholder="£120000" className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
        </label>
        <label className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
          Affiliate linking
          <select className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none">
            <option>Yes, I'm active</option>
            <option>No, but open to it</option>
            <option>Not interested</option>
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Platforms</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {["Instagram", "TikTok", "YouTube", "Pinterest", "Newsletter"].map((platform) => (
            <button
              key={platform}
              type="button"
              className="rounded-full border border-brand-black/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-black hover:border-brand-black"
            >
              {platform}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Gaps summary</p>
        <p className="mt-2 text-sm text-brand-black/70">
          The system identifies missing opportunities based on your submissions. Complete onboarding to unlock automation rules, AI agents, and proactive briefs tailored to your growth plan.
        </p>
      </div>
    </section>
  );
}

function CreatorSubmissionsSection({ session }) {
  const [submissions, setSubmissions] = useState(SUBMISSION_PAYLOADS);
  const [activeTab, setActiveTab] = useState(SUBMISSION_TABS[0]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(SUBMISSION_PAYLOADS[0]?.id);
  const stageFiltered =
    activeTab === "Usage log"
      ? submissions
      : submissions.filter((submission) => submission.stage === activeTab);
  const selectedSubmission = submissions.find((submission) => submission.id === selectedSubmissionId);

  const handleAdvanceStage = (id) => {
    setSubmissions((prev) =>
      prev.map((submission) => {
        if (submission.id !== id) return submission;
        const currentIndex = SUBMISSION_TABS.indexOf(submission.stage);
        const nextStage = SUBMISSION_TABS[currentIndex + 1] || submission.stage;
        if (submission.stage === nextStage || nextStage === "Usage log") return submission;
        return {
          ...submission,
          stage: nextStage,
          lastAction: `Moved to ${nextStage} on ${new Date().toLocaleDateString()}`
        };
      })
    );
  };

  const handleUploadDraft = () => {
    const timestamp = Date.now();
    const newSubmission = {
      id: `submission-${timestamp}`,
      title: "New submission draft",
      platform: "Select platform",
      type: "UGC",
      stage: "Drafts",
      files: [],
      revisions: [],
      finalLinks: [],
      captions: "",
      usageRights: "Pending admin approval",
      schedule: "Not scheduled",
      lastAction: "Draft created just now"
    };
    setSubmissions((prev) => [newSubmission, ...prev]);
    setSelectedSubmissionId(newSubmission.id);
    setActiveTab("Drafts");
  };

  const filteredList = activeTab === "Usage log" ? stageFiltered : stageFiltered;

  return (
    <section id="creator-submissions" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Submissions</p>
          <h3 className="font-display text-3xl uppercase">Uploads, revisions, approvals</h3>
        </div>
        <button
          type="button"
          onClick={handleUploadDraft}
          className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
        >
          Upload new
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUBMISSION_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.25em] ${
              activeTab === tab ? "border-brand-black bg-brand-black text-brand-white" : "border-brand-black/30"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {activeTab === "Usage log" ? (
            <SubmissionUsageLog submissions={submissions} />
          ) : filteredList.length ? (
            filteredList.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onSelect={() => setSelectedSubmissionId(submission.id)}
                onAdvance={() => handleAdvanceStage(submission.id)}
              />
            ))
          ) : (
            <p className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/70">
              No submissions in this stage yet.
            </p>
          )}
        </div>
        <div>
          <SubmissionDetailPanel submission={selectedSubmission} session={session} />
        </div>
      </div>
      <FileUploadPanel
        session={session}
        folder="creator-deliverables"
        title="Deliverable uploads"
        description="Share reels, edits, decks, or proofs for Break to review."
      />
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
  const data = (campaigns.length ? campaigns : FALLBACK_CAMPAIGNS).slice(0, 2);
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
        <p className="text-sm text-brand-black/60">Loading campaigns…</p>
      ) : (
        <div className="space-y-4">
          {data.map((campaign) => (
            <MultiBrandCampaignCard key={campaign.id} campaign={campaign} showNotes={false} />
          ))}
        </div>
      )}
    </section>
  );
}

function SubmissionCard({ submission, onSelect, onAdvance }) {
  return (
    <article className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{submission.stage}</p>
          <h4 className="font-semibold text-brand-black">{submission.title}</h4>
          <p className="text-xs text-brand-black/60">{submission.platform}</p>
        </div>
        <Badge tone="positive">{submission.type}</Badge>
      </div>
      <p className="text-xs text-brand-black/60">{submission.schedule}</p>
      <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.35em] text-brand-black/50">
        <span>{submission.files.length} files</span>
        <span className="h-px w-6 bg-brand-black/20" />
        <span>{submission.revisions.length} revisions</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em]"
        >
          View details
        </button>
        {submission.stage !== "Approved" && submission.stage !== "Scheduled" ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-full bg-brand-black px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-brand-white hover:bg-brand-black/90"
          >
            {submission.stage === "Revisions requested" ? "Submit revision" : "Mark ready"}
          </button>
        ) : null}
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
        allowCreate={Boolean(session?.roles?.some((role) => [Roles.ADMIN, Roles.AGENT].includes(role)))}
        allowRestore={Boolean(session?.roles?.some((role) => [Roles.ADMIN, Roles.AGENT].includes(role)))}
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
