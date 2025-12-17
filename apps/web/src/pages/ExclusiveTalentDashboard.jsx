import React, { useEffect, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ExclusiveSocialPanel } from "./ExclusiveSocialPanel.jsx";
import { Badge } from "../components/Badge.jsx";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { AiAssistantCard } from "../components/AiAssistantCard.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import { CalendarBoard } from "./AdminCalendarPage.jsx";
import { ExclusiveOverviewEnhanced } from "./ExclusiveOverviewEnhanced.jsx";

const NAV_LINKS = (basePath) => [
  { label: "Overview", to: `${basePath}`, end: true },
  { label: "My Profile", to: `${basePath}/profile` },
  { label: "Socials", to: `${basePath}/socials` },
  { label: "Campaigns", to: `${basePath}/campaigns` },
  { label: "Calendar", to: `${basePath}/calendar` },
  { label: "Projects", to: `${basePath}/projects` },
  { label: "Opportunities", to: `${basePath}/opportunities` },
  { label: "Tasks", to: `${basePath}/tasks` },
  { label: "Messages", to: `${basePath}/messages` },
  { label: "Settings", to: `${basePath}/settings` }
];

const PROFILE_INFO = {
  name: "Exclusive Creator",
  bio: "Lifestyle + travel creator with white-glove support, live residencies, and hybrid IRL launches.",
  location: "New York / Doha",
  email: "exclusive@talent.com",
  agent: "Lila Prasad"
};

// TODO: Fetch from API
const ACTIVE_CAMPAIGNS = [];

// TODO: Fetch from API
const PROJECTS = [];

// TODO: Fetch tasks from API
const TASKS = [];

// TODO: Fetch AI-suggested tasks from API
const SUGGESTED_TASKS = [];

const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@exclusive.creator",
    stats: {
      followers: "320K",
      growth: "+1.2% WoW",
      engagement: "5.3%",
      komiClicks: "1.8K",
      productClicks: "420"
    },
    topContent: [
      { title: "Runway prep carousel", metric: "68K saves" },
      { title: "AI copilot reel", metric: "1.2M views" }
    ],
    comments: ["Need full fit breakdown!", "AI copilot is genius 🔥"]
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@exclusive.talent",
    stats: {
      followers: "580K",
      growth: "+2.8% WoW",
      engagement: "7.1%",
      komiClicks: "2.4K",
      productClicks: "610"
    },
    topContent: [
      { title: "Supper club reveal", metric: "2.8M views" },
      { title: "35hr residency vlog", metric: "430K likes" }
    ],
    comments: ["Need BTS of the supper club", "Where is the dress from??"]
  },
  {
    id: "youtube",
    label: "YouTube",
    handle: "Exclusive Creator",
    stats: {
      followers: "210K",
      growth: "+0.8% WoW",
      engagement: "4.6%",
      komiClicks: "980",
      productClicks: "310"
    },
    topContent: [
      { title: "Creator finance AMA", metric: "120K live views" },
      { title: "Residency docu", metric: "88K watch hours" }
    ],
    comments: ["Please drop the deck template", "Post more finance deep dives!"]
  }
];

const INITIAL_PILLARS = ["Luxury travel diaries", "AI copilot tips", "Residency IRL drops"];

const TRENDING_CONTENT = [
  {
    id: "trend-1",
    platform: "Instagram",
    title: "Micro-itineraries carousel",
    insight: "+24% saves on 5-slide travel story formats."
  },
  {
    id: "trend-2",
    platform: "TikTok",
    title: "Ops POV mini-vlogs",
    insight: "Under 40s prefer vertical tours w/ AI voiceover."
  },
  {
    id: "trend-3",
    platform: "YouTube",
    title: "Creator finance AMAs",
    insight: "Live chat monetisation spikes for finance topics."
  },
  {
    id: "trend-4",
    platform: "Instagram",
    title: "Split-frame outfit planning",
    insight: "Shoppable tags + luxury wardrobe racks trending."
  },
  {
    id: "trend-5",
    platform: "TikTok",
    title: "Supper club guest reveals",
    insight: "Countdown content boosting IRL attendance."
  }
];

const OPPORTUNITIES = [
  {
    title: "Doha pop-up",
    status: "Awaiting reply",
    brand: "Luxury Hospitality",
    value: "£22K",
    nextStep: "Send revised hero concept",
    stage: "Awaiting reply"
  },
  {
    title: "AI finance walkthrough",
    status: "Reviewing offer",
    brand: "Fintech Labs",
    value: "£18K",
    nextStep: "Negotiate usage rights",
    stage: "Reviewing offer"
  },
  {
    title: "Retail capsule",
    status: "Pitch scheduled",
    brand: "Heritage Retail",
    value: "£25K",
    nextStep: "Confirm travel windows",
    stage: "Pitch scheduled"
  },
  {
    title: "GCC Residency series",
    status: "Briefing",
    brand: "Break Agency",
    value: "£40K",
    nextStep: "Share location scouting deck",
    stage: "Briefing"
  }
];

const FINANCIAL_SUMMARY = [
  { label: "Projected revenue", value: "£74K" },
  { label: "Payouts pending", value: "£9.6K" },
  { label: "Invoices sent", value: "6" }
];
const FINANCIAL_SERIES = {
  Week: [1200, 1600, 900, 2200, 1800],
  Month: [5200, 6100, 4300, 7800, 6500],
  YTD: [32000, 48000, 62000, 74000, 88000]
};
const INVOICES = [
  { id: 1, client: "Break Hospitality", amount: "£4,500", status: "Pending", due: "15 Nov" },
  { id: 2, client: "Fintech Labs", amount: "£6,200", status: "Paid", due: "02 Nov" }
];

const MESSAGES = [
  { subject: "Budget confirmation", context: "Brand ops · 2h ago" },
  { subject: "Residency travel plan", context: "Ops desk · 5h ago" },
  { subject: "Legal addendum", context: "Break legal · 1d ago" }
];

const CREATOR_ALERTS = [
  { id: "alert-1", label: "Komi spike", detail: "+34% click-through on Monaco itinerary", action: "Open dashboard" },
  { id: "alert-2", label: "Product waitlist", detail: "Cookbook pre-orders crossed 12K", action: "View funnel" },
  { id: "alert-3", label: "DM backlog", detail: "18 VIP replies waiting on travel upgrade", action: "Assign support" }
];

const CREATOR_RESOURCES = [
  { id: "tool-1", title: "Content brief generator", description: "AI prompts to spin new hooks in 3 clicks." },
  { id: "tool-2", title: "Sponsorship ratecard", description: "Latest blended CPM + premium uplift." },
  { id: "tool-3", title: "Residency playbook", description: "IRL launch checklist w/ staff ops." }
];

export default function ExclusiveTalentDashboardLayout({ basePath = "/admin/view/exclusive", session }) {
  return (
    <DashboardShell
      title="Exclusive Talent Control Room"
      subtitle=""
      navLinks={NAV_LINKS(basePath)}
    >
      <Outlet context={{ session, basePath }} />
    </DashboardShell>
  );
}

export function ExclusiveOverviewPage() {
  const { session, basePath } = useOutletContext() || {};
  // Use the new enhanced overview with full usability features
  return <ExclusiveOverviewEnhanced session={session} basePath={basePath} />;
}

export function ExclusiveProfilePage() {
  return <ExclusiveProfile />;
}

export function ExclusiveSocialsPage() {
  const [pillars, setPillars] = useState(INITIAL_PILLARS);
  const [pillarInput, setPillarInput] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [platformProfiles, setPlatformProfiles] = useState(SOCIAL_PLATFORMS);

  const handleAddPillar = (event) => {
    event.preventDefault();
    const value = pillarInput.trim();
    if (!value) return;
    setPillars((prev) => [...prev, value]);
    setPillarInput("");
  };

  const filteredTrends = TRENDING_CONTENT.filter(
    (item) => platformFilter === "All" || item.platform === platformFilter
  );
  const platforms = ["All", "Instagram", "TikTok", "YouTube"];

  const handleHandleUpdate = (platformId, value) => {
    setPlatformProfiles((prev) =>
      prev.map((platform) =>
        platform.id === platformId
          ? {
              ...platform,
              handle: value
            }
          : platform
      )
    );
  };

  return (
    <section id="exclusive-socials" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Socials</p>
      <p className="text-sm text-brand-black/70">Monitor reach, growth, and platform diagnostics.</p>
      <ExclusiveSocialPanel />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Content pillars</p>
              <p className="text-sm text-brand-black/70">Save new angles to brief studio editors.</p>
            </div>
          </div>
          <form className="mt-3 flex gap-2" onSubmit={handleAddPillar}>
            <input
              type="text"
              placeholder="Add a new pillar..."
              value={pillarInput}
              onChange={(e) => setPillarInput(e.target.value)}
              className="flex-1 rounded-2xl border border-brand-black/10 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Save
            </button>
          </form>
          <ul className="mt-3 space-y-2">
            {pillars.map((pillar) => (
              <li key={pillar} className="rounded-2xl border border-brand-black/10 bg-white/70 px-3 py-2 text-sm text-brand-black/80">
                {pillar}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Trending formats</p>
              <p className="text-sm text-brand-black/70">Filter by platform to spot fresh hooks.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em]">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setPlatformFilter(platform)}
                  className={`rounded-full border px-3 py-1 ${
                    platformFilter === platform ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {filteredTrends.map((trend) => (
              <article key={trend.id} className="rounded-2xl border border-brand-black/10 bg-white/80 p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-brand-black/60">
                  <span>{trend.platform}</span>
                  <Badge tone="neutral">Trending</Badge>
                </div>
                <p className="mt-2 font-semibold text-brand-black">{trend.title}</p>
                <p className="text-sm text-brand-black/70">{trend.insight}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Platform breakdown</p>
            <p className="text-sm text-brand-black/70">Track handles, engagement, and top-performing drops.</p>
          </div>
          <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
            Refresh stats
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {platformProfiles.map((platform) => (
            <article key={platform.id} className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg uppercase">{platform.label}</h3>
                <Badge tone="neutral">Live</Badge>
              </div>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
                Handle
                <input
                  type="text"
                  value={platform.handle}
                  onChange={(e) => handleHandleUpdate(platform.id, e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-2 text-sm text-brand-black/70">
                <div className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Followers</p>
                  <p className="text-lg font-semibold">{platform.stats.followers}</p>
                </div>
                <div className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Growth</p>
                  <p className="text-lg font-semibold">{platform.stats.growth}</p>
                </div>
                <div className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Engagement</p>
                  <p className="text-lg font-semibold">{platform.stats.engagement}</p>
                </div>
                <div className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Komi clicks</p>
                  <p className="text-lg font-semibold">{platform.stats.komiClicks}</p>
                </div>
                <div className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Product clicks</p>
                  <p className="text-lg font-semibold">{platform.stats.productClicks}</p>
                </div>
                <div className="rounded-xl border border-brand-black/10 bg-white/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Engaged fans</p>
                  <p className="text-lg font-semibold">Coming soon</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Top content</p>
                <ul className="mt-2 space-y-1 text-sm text-brand-black/80">
                  {platform.topContent.map((item) => (
                    <li key={item.title} className="rounded-xl border border-brand-black/10 bg-white/80 px-3 py-2">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-brand-black/60">{item.metric}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Signal comments</p>
                <ul className="mt-2 space-y-1 text-sm text-brand-black/80">
                  {platform.comments.map((comment) => (
                    <li key={comment} className="rounded-xl border border-brand-black/10 bg-white/80 px-3 py-2">
                      {comment}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
                  Pull stats
                </button>
                <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
                  View Komi report
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExclusiveCampaignsPage() {
  const { session } = useOutletContext() || {};
  return <ExclusiveCampaigns session={session} />;
}

export function ExclusiveCalendarPage() {
  return (
    <CalendarBoard
      headingTitle="Exclusive Talent Calendar"
      headingSubtitle="Track shoots, events, and creative deadlines — your business ops are handled for you."
    />
  );
}

export function ExclusiveProjectsPage() {
  return <ExclusiveProjects />;
}

export function ExclusiveTasksPage() {
  return <ExclusiveTasks />;
}

export function ExclusiveOpportunitiesPage() {
  return <ExclusiveOpportunities />;
}

export function ExclusiveFinancialsPage() {
  return <ExclusiveFinancials />;
}

export function ExclusiveMessagesPage() {
  return <ExclusiveMessages />;
}

export function ExclusiveContractsPage() {
  return (
    <section id="exclusive-contracts" className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Agreements</p>
      <p className="mt-2 text-sm text-brand-black/70">
        Contracts and negotiations are handled by your agent. If you need anything clarified, message your team and we’ll take care of it.
      </p>
      <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-5">
        <p className="font-semibold text-brand-black">Nothing to action here</p>
        <p className="mt-1 text-sm text-brand-black/70">
          You’ll be notified if a signature or confirmation is needed from you.
        </p>
      </div>
    </section>
  );
}

export function ExclusiveSettingsPage() {
  const { basePath } = useOutletContext() || {};
  return <ExclusiveSettings basePath={basePath} />;
}

function ExclusiveOverview({ session }) {
  const navigate = useNavigate();
  const firstName =
    session?.name?.split(" ")?.[0] ||
    session?.email?.split("@")?.[0]?.split(".")?.[0] ||
    "Creator";
  const focusCycle = getFocusCycleLabel();
  const [energyLevel, setEnergyLevel] = useState("Steady");
  const [workload, setWorkload] = useState("Balanced");
  const [goals] = useState({
    creative: 0.55,
    momentum: 0.4,
    balance: 0.6
  });

  const snapshotCards = [
    { label: "Active projects", value: "3", detail: "Residency + 2 campaigns", to: "projects" },
    { label: "Opportunities in motion", value: "4", detail: "Shortlist + briefs", to: "opportunities" },
    { label: "Creative tasks", value: "3", detail: "Content + approvals", to: "tasks" },
    { label: "Upcoming invites", value: "2", detail: "Events + shoots", to: "calendar" },
    { label: "Projected revenue", value: "£120K", detail: "High-level (handled by your agent)", to: null }
  ];

  const whatsInMotion = [
    {
      id: "motion-1",
      brand: "Luxury Hospitality",
      project: "Doha pop-up",
      type: "Residency",
      status: "In progress",
      yourNext: "Send revised hero concept (1 paragraph)"
    },
    {
      id: "motion-2",
      brand: "Fintech Labs",
      project: "AI finance walkthrough",
      type: "Campaign",
      status: "Awaiting approval",
      yourNext: "Confirm 2 hook options + CTA preference"
    },
    {
      id: "motion-3",
      brand: "Heritage Retail",
      project: "Retail capsule",
      type: "Event / Hosting",
      status: "Live planning",
      yourNext: "Share travel windows + wardrobe moodboard"
    },
    {
      id: "motion-4",
      brand: "Break",
      project: "GCC residency series",
      type: "Project",
      status: "Briefing",
      yourNext: "Pick 3 locations for scouting (quick shortlist)"
    }
  ];

  const events = [
    {
      id: "evt-1",
      title: "Doha pop-up weekend",
      location: "Doha",
      date: "Jan 24–26",
      required: "Attendance + 2 short-form posts",
      status: "Confirmed"
    },
    {
      id: "evt-2",
      title: "Heritage retail capsule launch",
      location: "London",
      date: "Feb 08",
      required: "Hosting + story coverage",
      status: "Pending invite"
    },
    {
      id: "evt-3",
      title: "Curated supper club (Break suggestion)",
      location: "Dubai",
      date: "Feb (flex)",
      required: "1 night + candid content",
      status: "Suggested"
    }
  ];

  const calendarBlocks = [
    { id: "cal-1", label: "Shoot day", date: "Tue", meta: "Outfit + location planning" },
    { id: "cal-2", label: "Event", date: "Fri", meta: "Doha pop-up" },
    { id: "cal-3", label: "Deadline", date: "Sun", meta: "Deliver 2 edits" }
  ];

  const whatsWorking = [
    { id: "ww-1", title: "Micro-itineraries", detail: "Short, high-signal travel formats are saving well." },
    { id: "ww-2", title: "Ops POV vlogs", detail: "Behind-the-scenes logistics content feels premium + real." },
    { id: "ww-3", title: "Split-frame outfit planning", detail: "Planning + shoppable moments without hard selling." }
  ];

  const assistantPrompts = [
    "What content should I post this week?",
    "Suggest viral angles for my audience",
    "What’s performing well in my niche right now?",
    "How can I balance work and rest this week?"
  ];

  const toolkit = [
    { id: "tool-1", title: "Content brief generator", description: "Generate hooks + shot lists in minutes." },
    { id: "tool-2", title: "Script prompts", description: "Short-form prompts tuned to your voice." },
    { id: "tool-3", title: "Product ideation", description: "Early-stage product ideas you can build with Break." }
  ];

  return (
    <section id="exclusive-overview" className="space-y-6">
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Overview</p>
            <h2 className="font-display text-4xl uppercase text-brand-black">Hi {firstName}.</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{focusCycle}</Badge>
              <span className="text-sm text-brand-black/60">
                The business side is handled — you can stay focused on creating.
              </span>
            </div>
            <p className="mt-2 text-sm text-brand-black/70">
              Here’s what’s happening around your content and opportunities right now.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Today’s focus</p>
            <p className="mt-2 text-sm text-brand-black/80">
              Pick one piece of content to ship, then protect your recovery window.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {snapshotCards.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={() => (metric.to ? navigate(`/admin/view/exclusive/${metric.to}`) : null)}
            className={[
              "rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5 text-left transition",
              metric.to ? "hover:-translate-y-0.5 hover:bg-brand-white" : "cursor-default"
            ].join(" ")}
            disabled={!metric.to}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{metric.label}</p>
            <p className="mt-2 font-display text-3xl uppercase text-brand-black">{metric.value}</p>
            <p className="text-sm text-brand-black/60">{metric.detail}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Revenue overview</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">Confidence, not accounting</h3>
          <p className="mt-1 text-sm text-brand-black/60">Managed by your agent.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniMetric label="Earnings to date" value="£48K" sub="YTD (rounded)" />
            <MiniMetric label="Potential revenue" value="£120K" sub="Pipeline estimate" />
            <MiniMetric label="Trend" value="Up" sub="Momentum improving" />
          </div>
          <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-sm text-brand-black/70">
              If you want a deeper breakdown, ask your agent — you don’t need to manage invoices or payouts here.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">What’s in motion</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">Projects + opportunities</h3>
          <p className="mt-1 text-sm text-brand-black/60">Only what you need to do — no admin noise.</p>
          <div className="mt-4 space-y-3">
            {whatsInMotion.map((item) => (
              <article key={item.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{item.type}</p>
                    <p className="font-semibold text-brand-black">{item.brand}</p>
                    <p className="text-sm text-brand-black/70">{item.project}</p>
                  </div>
                  <Badge tone="neutral">{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-brand-black/80">
                  <span className="font-semibold">You:</span> {item.yourNext}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
                    onClick={() => navigate("/admin/view/exclusive/opportunities")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-brand-black/20 px-4 py-1 text-xs uppercase tracking-[0.3em]"
                  >
                    Ask agent
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Events & invitations</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">Worth your time</h3>
          <p className="mt-1 text-sm text-brand-black/60">Accept/Decline is design-only here.</p>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{event.status}</p>
                    <p className="font-semibold text-brand-black">{event.title}</p>
                    <p className="text-sm text-brand-black/70">{event.location} · {event.date}</p>
                  </div>
                  <Badge tone="neutral">{event.required}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-brand-black/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/50"
                    title="Design only"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-brand-black/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/50"
                    title="Design only"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
                    onClick={() => navigate("/admin/view/exclusive/calendar")}
                  >
                    View calendar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Calendar preview</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">Protect your time</h3>
          <p className="mt-1 text-sm text-brand-black/60">Key dates only: shoots, events, deadlines.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {calendarBlocks.map((block) => (
              <div key={block.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{block.date}</p>
                <p className="mt-1 font-semibold text-brand-black">{block.label}</p>
                <p className="mt-1 text-sm text-brand-black/70">{block.meta}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/view/exclusive/calendar")}
            className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            Open calendar
          </button>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <AiAssistantCard
            session={session}
            role="exclusive"
            title="AI Assistant"
            description="Your creative partner — prompts, angles, and weekly planning."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {assistantPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
              >
                {prompt}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-black/60">
            Ask for content ideas, hooks, scripts, and balance — not contracts or invoices.
          </p>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">What’s working</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">High-level insights</h3>
          <p className="mt-1 text-sm text-brand-black/60">Themes, not dashboards.</p>
          <div className="mt-4 space-y-3">
            {whatsWorking.map((item) => (
              <article key={item.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="font-semibold text-brand-black">{item.title}</p>
                <p className="mt-1 text-sm text-brand-black/70">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Creator toolkit</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">Create faster</h3>
          <p className="mt-1 text-sm text-brand-black/60">
            Briefs, scripts, and product ideation — with white-label support available.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {toolkit.map((tool) => (
              <article key={tool.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="font-semibold text-brand-black">{tool.title}</p>
                <p className="mt-1 text-sm text-brand-black/70">{tool.description}</p>
                <button
                  type="button"
                  className="mt-3 rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
                >
                  Open
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Goals & wellbeing</p>
          <h3 className="font-display text-2xl uppercase text-brand-black">Gentle signals</h3>
          <p className="mt-1 text-sm text-brand-black/60">Supportive, not tracked.</p>

          <div className="mt-4 space-y-3">
            <GoalRow label="Creative goal" value={goals.creative} />
            <GoalRow label="Momentum" value={goals.momentum} />
            <GoalRow label="Balance" value={goals.balance} />
          </div>

          <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Wellbeing pulse</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-brand-black">Energy level</p>
                <PulseOptions value={energyLevel} setValue={setEnergyLevel} options={["Low", "Steady", "High"]} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-brand-black">Workload</p>
                <PulseOptions value={workload} setValue={setWorkload} options={["Light", "Balanced", "Heavy"]} />
              </div>
            </div>
            <p className="mt-3 text-sm text-brand-black/70">
              If things feel heavy, tell us — we’ll protect your calendar and adjust your load.
            </p>
          </div>
        </section>
      </section>
    </section>
  );
}

function MiniMetric({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</p>
      <p className="mt-2 font-display text-2xl uppercase text-brand-black">{value}</p>
      <p className="text-xs text-brand-black/60">{sub}</p>
    </div>
  );
}

function GoalRow({ label, value }) {
  const percent = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-black">{label}</p>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{percent}%</p>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-brand-black/10">
        <div className="h-2 rounded-full bg-brand-black/50" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PulseOptions({ value, setValue, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setValue(option)}
          className={[
            "rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition",
            value === option
              ? "border-brand-black bg-brand-black text-brand-white"
              : "border-brand-black/20 bg-brand-white text-brand-black hover:bg-brand-black/5"
          ].join(" ")}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function getFocusCycleLabel() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  const season = month === 11 || month <= 1 ? "Winter" : month <= 4 ? "Spring" : month <= 7 ? "Summer" : "Autumn";
  return `${season} cycle · Q${quarter} focus`;
}

function ExclusiveProfile() {
  return (
    <section id="exclusive-profile" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">My profile</p>
      <p className="text-sm text-brand-black/70">Identity snapshot for the roster preview.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <h3 className="font-display text-xl uppercase">{PROFILE_INFO.name}</h3>
          <p className="text-sm text-brand-black/70">{PROFILE_INFO.bio}</p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm text-brand-black/80">
          <p>Location: {PROFILE_INFO.location}</p>
          <p>Contact: {PROFILE_INFO.email}</p>
          <p>Partner lead: {PROFILE_INFO.agent}</p>
        </div>
      </div>
    </section>
  );
}

function ExclusiveCampaigns({ session }) {
  const { campaigns, loading, error } = useCampaigns({ session });
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id ?? null);
  useEffect(() => {
    setSelectedId((current) => current || campaigns[0]?.id || null);
  }, [campaigns]);
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedId) || campaigns[0];
  return (
    <section id="exclusive-campaigns" className="mt-4 space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Campaigns</p>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Add update
        </button>
      </div>
      <p className="text-sm text-brand-black/70">Live briefs with deliverables, stages, and budgets.</p>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {loading && !campaigns.length ? (
        <p className="text-sm text-brand-black/60">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No campaigns yet</p>
          <p className="mt-2 text-xs text-brand-black/40">Campaign assignments will appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className={`rounded-2xl border border-brand-black/10 px-4 py-3 text-sm text-brand-black/80 ${
                  selectedId === campaign.id ? "bg-brand-linen/70" : "bg-brand-linen/40"
                }`}
                onClick={() => setSelectedId(campaign.id)}
              >
                <p className="font-semibold text-brand-black">{campaign.title}</p>
                <p className="text-xs text-brand-black/60">Stage: {campaign.stage}</p>
                <p className="text-xs text-brand-black/60">
                  Brands: {campaign.brandSummaries?.map((brand) => brand.name).join(", ")}
                </p>
              </article>
            ))}
          </div>
          {selectedCampaign ? (
            <div className="pt-4">
              <MultiBrandCampaignCard campaign={selectedCampaign} showNotes={false} />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function ExclusiveProjects() {
  return (
    <section className="mt-4 space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center justify-between">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Projects</p>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          New project
        </button>
      </div>
      <p className="text-sm text-brand-black/70">Personal projects and goals - save edits and track progress.</p>
      <div className="space-y-3">
        {PROJECTS.map((project) => (
          <article key={project.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg uppercase">{project.title}</h3>
              <Badge tone="neutral">{project.status}</Badge>
            </div>
            <p className="text-sm text-brand-black/70">{project.summary}</p>
            <p className="text-xs text-brand-black/60">Owner: {project.owner} • Due: {project.due}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExclusiveTasks() {
  const [taskQueue, setTaskQueue] = useState(TASKS);
  const [suggestedTasks, setSuggestedTasks] = useState(SUGGESTED_TASKS);

  const handleAddSuggested = (taskId) => {
    const task = suggestedTasks.find((item) => item.id === taskId);
    if (!task) return;
    setTaskQueue((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}`,
        title: task.title,
        status: "Not started",
        due: task.due,
        brand: task.brand
      }
    ]);
    setSuggestedTasks((prev) => prev.filter((item) => item.id !== taskId));
  };

  return (
    <section className="mt-4 space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center justify-between">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Task queue</p>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Assign task
        </button>
      </div>
      <p className="text-sm text-brand-black/70">Follow-ups and creator deliverables awaiting action.</p>
      <div className="space-y-3">
        {taskQueue.map((task) => (
          <article key={task.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-brand-black">{task.title}</p>
                <p className="text-xs text-brand-black/60">{task.brand}</p>
              </div>
              <Badge tone="neutral">{task.status}</Badge>
            </div>
            <p className="text-xs text-brand-black/60">Due: {task.due}</p>
          </article>
        ))}
      </div>
      <div className="border-t border-brand-black/10 pt-4">
        <div className="flex flex-wrap items-center justify-between">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">AI suggested tasks</p>
          <p className="text-xs text-brand-black/60">Curated by AI.</p>
        </div>
        <div className="mt-3 space-y-3">
          {suggestedTasks.length === 0 ? (
            <p className="text-sm text-brand-black/60">All caught up — no suggestions pending.</p>
          ) : (
            suggestedTasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-linen/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-black">{task.title}</p>
                    <p className="text-xs text-brand-black/60">{task.brand}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSuggested(task.id)}
                    className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
                  >
                    Add to queue
                  </button>
                </div>
                <p className="text-xs text-brand-black/60">Suggested due: {task.due}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function ExclusiveOpportunities() {
  const [stageFilter, setStageFilter] = useState("All");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const stages = ["All", "Awaiting reply", "Reviewing offer", "Pitch scheduled", "Briefing"];
  const filtered = OPPORTUNITIES.filter((item) => stageFilter === "All" || item.stage === stageFilter);

  return (
    <section id="exclusive-opportunities" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
          <p className="text-sm text-brand-black/70">Pipeline of briefs and brand inbound.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em]">
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={`rounded-full border px-3 py-1 ${
                stageFilter === stage ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/80"
            onClick={() => setSelectedOpportunity(item)}
          >
            <div>
              <p className="font-semibold text-brand-black">{item.title}</p>
              <p className="text-xs text-brand-black/60">
                {item.brand} · {item.value}
              </p>
            </div>
            <Badge>{item.status}</Badge>
          </div>
        ))}
      </div>
      {selectedOpportunity ? (
        <Modal title="Opportunity" onClose={() => setSelectedOpportunity(null)}>
          <p className="font-semibold text-brand-black">{selectedOpportunity.title}</p>
          <p className="text-sm text-brand-black/70">{selectedOpportunity.brand}</p>
          <p className="mt-2 text-xs text-brand-black/60">Stage: {selectedOpportunity.stage}</p>
          <p className="text-xs text-brand-black/60">Value: {selectedOpportunity.value}</p>
          <p className="mt-3 text-sm text-brand-black/70">{selectedOpportunity.nextStep}</p>
        </Modal>
      ) : null}
    </section>
  );
}

function ExclusiveFinancials() {
  const [timeframe, setTimeframe] = useState("Month");
  const [campaignEdit, setCampaignEdit] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState({ open: false, invoice: null });
  const [invoices, setInvoices] = useState(INVOICES);
  const [chartPoints, setChartPoints] = useState(FINANCIAL_SERIES[timeframe]);

  useEffect(() => {
    setChartPoints(FINANCIAL_SERIES[timeframe] || FINANCIAL_SERIES.Month);
  }, [timeframe]);

  const openCampaignEdit = (campaign) => setCampaignEdit(campaign);
  const closeCampaignEdit = () => setCampaignEdit(null);

  const openInvoiceModal = (invoice = null) => setInvoiceModal({ open: true, invoice });
  const closeInvoiceModal = () => setInvoiceModal({ open: false, invoice: null });
  const handleInvoiceSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: invoiceModal.invoice?.id || Date.now(),
      client: formData.get("client") || "Untitled",
      amount: formData.get("amount") || "£0",
      status: formData.get("status") || "Pending",
      due: formData.get("due") || "TBD"
    };
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === payload.id);
      if (exists) return prev.map((inv) => (inv.id === payload.id ? payload : inv));
      return [payload, ...prev];
    });
    closeInvoiceModal();
  };

  return (
    <section id="exclusive-financials" className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Financials</p>
          <h3 className="font-display text-3xl uppercase">Revenue analytics</h3>
          <p className="text-sm text-brand-black/70">Forecast payouts, campaign revenue, and invoice status.</p>
        </div>
        <div className="flex gap-2 text-xs uppercase tracking-[0.3em]">
          {["Week", "Month", "YTD"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTimeframe(option)}
              className={`rounded-full border px-3 py-1 ${
                timeframe === option ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FINANCIAL_SUMMARY.map((item) => (
          <article key={item.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-brand-black">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Revenue trend</p>
        <LineChart points={chartPoints} />
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Campaign revenue</p>
          <button className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]">
            Add campaign
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {ACTIVE_CAMPAIGNS.map((campaign) => (
            <div
              key={campaign.title}
              className="cursor-pointer rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-sm text-brand-black/80"
              onClick={() => openCampaignEdit(campaign)}
            >
              <p className="font-semibold">{campaign.title}</p>
              <p className="text-xs text-brand-black/60">
                {campaign.phase} · {campaign.budget} · {campaign.due}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Invoices</p>
          <button
            type="button"
            onClick={() => openInvoiceModal()}
            className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
          >
            + New invoice
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="cursor-pointer rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-sm text-brand-black/80"
              onClick={() => openInvoiceModal(invoice)}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{invoice.client}</p>
                <Badge tone="positive">{invoice.amount}</Badge>
              </div>
              <p className="text-xs text-brand-black/60">
                {invoice.status} · Due {invoice.due}
              </p>
            </div>
          ))}
        </div>
      </div>

      {campaignEdit ? (
        <Modal title="Edit campaign" onClose={closeCampaignEdit}>
          <p className="text-sm text-brand-black/70">{campaignEdit.title}</p>
          <p className="text-xs text-brand-black/60">{campaignEdit.due}</p>
          <button
            type="button"
            onClick={closeCampaignEdit}
            className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Close
          </button>
        </Modal>
      ) : null}

      {invoiceModal.open ? (
        <Modal title={invoiceModal.invoice ? "Edit invoice" : "New invoice"} onClose={closeInvoiceModal}>
          <form className="space-y-3 text-sm" onSubmit={handleInvoiceSave}>
            <label className="block">
              Client
              <input
                name="client"
                defaultValue={invoiceModal.invoice?.client}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="block">
              Amount
              <input
                name="amount"
                defaultValue={invoiceModal.invoice?.amount}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="block">
              Status
              <select
                name="status"
                defaultValue={invoiceModal.invoice?.status || "Pending"}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Overdue</option>
              </select>
            </label>
            <label className="block">
              Due date
              <input
                name="due"
                defaultValue={invoiceModal.invoice?.due}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="rounded-full border border-brand-black px-3 py-2 text-xs uppercase tracking-[0.3em]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

function LineChart({ points }) {
  const max = Math.max(...points);
  return (
    <svg viewBox="0 0 100 40" className="mt-3 h-32 w-full">
      <path
        d={points
          .map((value, index) => {
            const x = (index / (points.length - 1)) * 100;
            const y = 40 - (value / max) * 40;
            return `${index === 0 ? "M" : "L"}${x},${y}`;
          })
          .join(" ")}
        fill="none"
        stroke="#b22222"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ExclusiveMessages() {
  return (
    <section id="exclusive-messages" className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Messages</p>
      <p className="text-sm text-brand-black/70">Latest comms and alerts.</p>
      <div className="space-y-2">
        {MESSAGES.map((message) => (
          <div key={message.subject} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-2 text-sm text-brand-black/80">
            <p className="font-semibold">{message.subject}</p>
            <p className="text-xs text-brand-black/60">{message.context}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExclusiveSettings({ basePath = "/exclusive" }) {
  const navigate = useNavigate();
  return (
    <section id="exclusive-settings" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Settings</p>
      <p className="text-sm text-brand-black/70">
        Configure notifications and access. These controls preview how permissions will display inside the production environment.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/goals`)}
          className="text-left rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm transition hover:bg-brand-linen/70"
        >
          <p className="font-semibold text-brand-black">Goals & intentions</p>
          <p className="text-xs text-brand-black/60">Update your creative direction, support preferences, and wellbeing notes.</p>
        </button>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm">
          <p className="font-semibold text-brand-black">Alerts</p>
          <p className="text-xs text-brand-black/60">Platform updates: Enabled</p>
          <p className="text-xs text-brand-black/60">Finance approvals: Enabled</p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm">
          <p className="font-semibold text-brand-black">Access</p>
          <p className="text-xs text-brand-black/60">AI agent: Allowed</p>
          <p className="text-xs text-brand-black/60">Multi-currency payouts: Allowed</p>
        </div>
      </div>
    </section>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[32px] border border-brand-black/15 bg-brand-white p-6 text-brand-black shadow-[0_35px_80px_rgba(0,0,0,0.4)]">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-display text-2xl uppercase">{title}</h4>
          <button type="button" onClick={onClose} className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
