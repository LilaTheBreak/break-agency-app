import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

export const CONTROL_ROOM_PRESETS = {
  admin: {
    title: "Admin Control Room",
    subtitle: "Monitor pipelines, unblock campaigns, and dispatch briefings across the platform.",
    navLinks: ADMIN_NAV_LINKS,
    metrics: [
      { label: "Active creators", value: "148", sub: "Onboarded + compliant" },
      { label: "Live campaigns", value: "32", sub: "Across 7 markets" },
      { label: "Pending briefs", value: "11", sub: "Awaiting approvals" }
    ],
    queue: {
      label: "Queues",
      title: "What needs attention",
      cta: "Dispatch update",
      items: [
        { title: "Luxury hospitality roster", owner: "Mo Al Ghazi", status: "Ready for review" },
        { title: "Creator residency NYC", owner: "Lila Prasad", status: "Contracts out" },
        { title: "AI talent concierge", owner: "Automation Pod", status: "Collecting requirements" }
      ]
    },
    quickLinks: [
      {
        title: "Overview",
        copy: "Snapshot of adoption, usage, and alerts for the last 7 days.",
        to: "/admin/dashboard"
      },
      {
        title: "Queues",
        copy: "Incoming approvals, onboarding, and support requests awaiting routing.",
        to: "/admin/queues"
      },
      {
        title: "Approvals",
        copy: "White-glove review of contracts, briefs, and payments before they go live.",
        to: "/admin/approvals"
      },
      {
        title: "Users",
        copy: "Audit creator, brand, and manager accounts. Impersonate or edit roles quickly.",
        to: "/admin/users"
      },
      {
        title: "Messaging",
        copy: "Internal inbox mirroring creator comms. Filter by persona or queue.",
        to: "/admin/messaging"
      },
      {
        title: "Finance",
        copy: "Payment batches, invoices, and reconciliation tasks awaiting review.",
        to: "/admin/finance"
      },
      {
        title: "Settings",
        copy: "Access control, integrations, outbound comms, and admin notes.",
        to: "/admin/settings"
      }
    ]
  },
  exclusive: {
    title: "Exclusive Talent Control Room",
    subtitle: "Preview the concierge roster — pitching, deal flow, and AI assistance for white-glove creators.",
    tabs: [
      { label: "Overview", anchor: "#exclusive-overview" },
      { label: "Roster", anchor: "#exclusive-roster" },
      { label: "Opportunities", anchor: "#exclusive-opportunities" },
      { label: "Concierge", anchor: "#exclusive-concierge" },
      { label: "Socials", anchor: "#exclusive-socials" },
      { label: "Messages", anchor: "#exclusive-messages" },
      { label: "Settings", anchor: "#exclusive-settings" }
    ],
    metrics: [
      { label: "Invite-only creators", value: "24", sub: "Active roster" },
      { label: "Concierge requests", value: "9", sub: "Pending uplifts" },
      { label: "Task queue", value: "18", sub: "Awaiting updates" }
    ],
    queue: {
      label: "Exclusive requests",
      title: "Hands-on items",
      cta: "Dispatch update",
      items: [
        { title: "VIP roster expansion", owner: "Lila Prasad", status: "Ready for review" },
        { title: "Luxury residency cohort", owner: "Mo Al Ghazi", status: "Contracts out" },
        { title: "AMA series with editors", owner: "Editorial Pod", status: "Planning" }
      ]
    },
    quickLinks: [
      { title: "Roster", copy: "Profiles, retainers, and deliverable calendars held by concierge leads." },
      { title: "Opportunities", copy: "Direct brand requests before they graduate into UGC board." },
      { title: "Concierge desk", copy: "Research, budgets, and negotiation transcripts for context." },
      { title: "Messages", copy: "High-touch comms with assistants and partner teams." }
    ]
  },
  talent: {
    title: "Talent Control Room",
    subtitle: "See what a vetted creator experiences — briefs, revenue, and automations in one place.",
    tabs: ["Overview", "Campaigns", "UGC Board", "Agent", "Messages", "Account"],
    metrics: [
      { label: "Active campaigns", value: "6", sub: "Deliverables due this week" },
      { label: "Projected revenue", value: "£74K", sub: "Next 90 days" },
      { label: "Inbox health", value: "96%", sub: "Responses under 12h" }
    ],
    queue: {
      label: "Action items",
      title: "Creator to-do",
      cta: "Open planner",
      items: [
        { title: "Upload Atlantis hero cut", owner: "Content Pod", status: "Due tomorrow" },
        { title: "Approve fintech usage rights", owner: "Legal Desk", status: "Needs signature" },
        { title: "Confirm AI live brief", owner: "Automation Pod", status: "Draft reminder" }
      ]
    },
    quickLinks: [
      { title: "Campaign pipeline", copy: "View every signed brief with budgets, deliverables, and chat." },
      { title: "UGC board", copy: "Public + priority briefs filtered to your markets and platforms." },
      { title: "AI agent", copy: "Prep responses, rate cards, and trackers via natural language." },
      { title: "Finance", copy: "Invoices sent, payouts pending, compliance docs on file." }
    ]
  },
  ugc: {
    title: "UGC Talent Control Room",
    subtitle: "The lightweight console for UGC creators shipping briefs via the public board.",
    tabs: ["Overview", "Briefs", "Submissions", "Education", "Messages"],
    metrics: [
      { label: "Open briefs", value: "14", sub: "Accepting applications" },
      { label: "Shortlisted", value: "5", sub: "Awaiting deliverables" },
      { label: "Payouts pending", value: "7", sub: "In finance review" }
    ],
    queue: {
      label: "Brief tracker",
      title: "What creators see",
      cta: "Open board",
      items: [
        { title: "Eco skincare reels", owner: "Break Ops", status: "Apply now" },
        { title: "Doha hospitality tour", owner: "Brand Pod", status: "Under review" },
        { title: "Fintech onboarding flow", owner: "Automation Pod", status: "Deliverables due" }
      ]
    },
    quickLinks: [
      { title: "Applications", copy: "Submission history, W-9 / VAT docs, and NDA agreements." },
      { title: "Content locker", copy: "Deliverables, references, and edit histories in one feed." },
      { title: "Education", copy: "Micro lessons on pricing, rights, logistics, and compliance." },
      { title: "Messaging", copy: "Creator <> ops dialogue with templates + escalation paths." }
    ]
  },
  founder: {
    title: "Founder Control Room",
    subtitle: "High-level view for founders to scan growth, GTM signals, and revenue flows.",
    tabs: ["Overview", "Growth", "Product", "People", "Investors"],
    metrics: [
      { label: "Monthly revenue", value: "£410K", sub: "Up 18% MoM" },
      { label: "Gross margin", value: "62%", sub: "After payouts" },
      { label: "New partners", value: "12", sub: "Signed this quarter" }
    ],
    queue: {
      label: "Founder queue",
      title: "Signals & escalations",
      cta: "View briefs",
      items: [
        { title: "Paris retail activation", owner: "Experiential Pod", status: "Budget approval" },
        { title: "AI underwriting launch", owner: "Product Pod", status: "Needs GTM sign-off" },
        { title: "Break Fund close", owner: "Finance Pod", status: "Docs in diligence" }
      ]
    },
    quickLinks: [
      { title: "Investor desk", copy: "Narratives, pull requests, and board-ready snapshots." },
      { title: "People ops", copy: "Hiring pipeline, enablement packs, and staffing charts." },
      { title: "Product pulse", copy: "Roadmap, release health, and dependency tracking." },
      { title: "Finance", copy: "Cash runway, receivables aging, payouts + AR." }
    ]
  },
  brand: {
    title: "Brand Control Room",
    subtitle: "Campaign controls, creator match, contracts, messaging, and reporting in one lane.",
    tabs: ["Overview", "Campaigns", "Creator Match", "Reports", "Messages", "Account"],
    metrics: [
      { label: "Live campaigns", value: "8", sub: "Running this week" },
      { label: "Creator shortlist", value: "34", sub: "Awaiting feedback" },
      { label: "Budget committed", value: "£510K", sub: "Q4 allocations" }
    ],
    queue: {
      label: "Brand queues",
      title: "Pending actions",
      cta: "Review all",
      items: [
        { title: "Retail capsule tour", owner: "In-house team", status: "Approve creators" },
        { title: "AI finance launch", owner: "Break Ops", status: "Upload assets" },
        { title: "Heritage travel push", owner: "Agency partner", status: "Confirm budget" }
      ]
    },
    quickLinks: [
      { title: "Campaign pipeline", copy: "Status, spend, and conversations per brief." },
      { title: "Creator match", copy: "Filters for geography, platforms, and compliance signals." },
      { title: "Contracts & invoices", copy: "Templates with guardrails for legal + finance." },
      { title: "Insights", copy: "Performance dashboards, lift studies, and recaps." }
    ]
  }
};
