import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

export const CONTROL_ROOM_PRESETS = {
  admin: {
    role: "admin",
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
        { title: "AI talent desk", owner: "Automation Pod", status: "Collecting requirements" }
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
        title: "Outreach",
        copy: "Track outbound to brands + creators with Gmail-linked follow-ups and opportunities.",
        to: "/admin/outreach"
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
    role: "exclusive-talent",
    title: "Exclusive Talent Control Room",
    subtitle: "",
    tabs: [
      { label: "Overview", anchor: "#exclusive-overview", default: true },
      { label: "My Profile", anchor: "#exclusive-profile" },
      { label: "Socials", anchor: "#exclusive-socials" },
      { label: "Campaigns", anchor: "#exclusive-campaigns" },
      { label: "Opportunities", anchor: "#exclusive-opportunities" },
      { label: "Financials", anchor: "#exclusive-financials" },
      { label: "Messages", anchor: "#exclusive-messages" },
      { label: "Contracts", anchor: "#exclusive-contracts" },
      { label: "Settings", anchor: "#exclusive-settings" }
    ],
    metrics: [
      { label: "Active campaigns", value: "8", sub: "Live creator projects" },
      { label: "Revenue earned", value: "£1.2M", sub: "Past 12 months" },
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
      { title: "Roster", copy: "Profiles, retainers, and deliverable calendars held by lead strategists." },
      { title: "Opportunities", copy: "Direct brand requests before they graduate into UGC board." },
      { title: "Creator desk", copy: "Research, budgets, and negotiation transcripts for context." },
      { title: "Messages", copy: "High-touch comms with assistants and partner teams." }
    ]
  },
  talent: {
    role: "talent",
    title: "Talent Control Room",
    subtitle: "See what a vetted creator experiences — briefs, revenue, and automations in one place.",
    tabs: [
      { label: "Overview", anchor: "#creator-overview", default: true },
      { label: "Campaigns", anchor: "#creator-campaigns" },
      { label: "Opportunities", anchor: "#creator-opportunities" },
      { label: "Agent", anchor: "#creator-agent" },
      { label: "Messages", anchor: "#creator-messages" },
      { label: "Contracts", anchor: "#creator-contracts" },
      { label: "Account", anchor: "#creator-account" }
    ],
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
      { title: "Opportunities", copy: "Public + priority briefs filtered to your markets and platforms." },
      { title: "AI agent", copy: "Prep responses, rate cards, and trackers via natural language." },
      { title: "Finance", copy: "Invoices sent, payouts pending, compliance docs on file." }
    ]
  },
  ugc: {
    role: "ugc",
    title: "UGC Talent Control Room",
    subtitle: "The lightweight console for UGC creators shipping briefs via the public board.",
    tabs: [
      "Overview",
      { label: "Briefs", to: "/ugc/briefs" },
      { label: "Tools", to: "/ugc/tools" },
      { label: "Finance", to: "/ugc/finance" },
      { label: "Education", to: "/resource-hub" },
      { label: "Messages", to: "/ugc/messages" }
    ],
    opportunities: [
      {
        brand: "Atlantis The Royal",
        logo: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80",
        coverPhoto: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        title: "Luxury resort staycation reels",
        pay: "AED 18k – 24k + travel",
        requirements: "3x Reels • 1x TikTok • Stills",
        apply: "Apply via the public board by Feb 10",
        tone: "positive"
      },
      {
        brand: "Gulf Air",
        logo: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=200&q=80",
        coverPhoto: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
        title: "Gulf Air Creator Desk",
        pay: "£6k flat + travel",
        requirements: "Mini vlog • Stories pack • London + Doha",
        apply: "Shortlist opens after Feb 22",
        tone: "neutral"
      },
      {
        brand: "Notion x Break",
        logo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
        coverPhoto: "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=800&q=80",
        title: "AI productivity stack features",
        pay: "Revenue share • rolling deadline",
        requirements: "Guide + newsletter placement",
        apply: "Public briefs require login",
        tone: "caution"
      },
      {
        brand: "Heritage Street",
        logo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
        coverPhoto: "https://images.unsplash.com/photo-1448743971082-08c8f0b8a0d7?auto=format&fit=crop&w=900&q=80",
        title: "Cultural corridor documentary",
        pay: "£4k + photo pack",
        requirements: "Editorial stills, 1-day shoot",
        apply: "Deadline March 8",
        tone: "neutral"
      },
      {
        brand: "Dubai Airport",
        logo: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=200&q=80",
        coverPhoto: "https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=900&q=80",
        title: "Airport lounge lifestyle clips",
        pay: "AED 12k fixed",
        requirements: "Lifestyle stills + 30s Reel",
        apply: "Apply by March 1 – travel required",
        tone: "positive"
      },
      {
        brand: "Voyage Collective",
        logo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80",
        coverPhoto: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
        title: "City weekend capsule stories",
        pay: "USD 5k + gifting",
        requirements: "UGC storytelling",
        apply: "Rolling intake",
        tone: "positive"
      }
    ],
    metrics: [
      { label: "Open briefs", value: "14", sub: "Accepting applications", to: "/ugc/briefs" },
      { label: "Shortlisted", value: "5", sub: "Awaiting deliverables", to: "/ugc/briefs" },
      { label: "Payouts pending", value: "7", sub: "In finance review", to: "/ugc/finance" }
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
    role: "founder",
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
    role: "brand",
    title: "Brand Control Room",
    subtitle: "Campaign controls, creator match, contracts, messaging, and reporting in one lane.",
    tabs: [
      { label: "Overview", anchor: "#brand-overview", default: true },
      { label: "Campaigns", anchor: "#brand-campaigns" },
      { label: "Creators", anchor: "#brand-creators" },
      { label: "Reports", anchor: "#brand-reports" },
      { label: "Messages", anchor: "#brand-messages" },
      { label: "Account", anchor: "#brand-account" }
    ],
    metrics: [
      { label: "Live campaigns", value: "8", sub: "Running this week" },
      { label: "Budget committed", value: "£510K", sub: "Q4 allocations" },
      { label: "Spaces remaining", value: "3", sub: "Annual intake" }
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
