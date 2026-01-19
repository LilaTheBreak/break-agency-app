import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

export const CONTROL_ROOM_PRESETS = {
  admin: {
    role: "admin",
    title: "Admin Control Room",
    subtitle: "Monitor pipelines, unblock campaigns, and dispatch briefings across the platform.",
    navLinks: ADMIN_NAV_LINKS,
    metrics: [],
    queue: null,
    quickLinks: [
      {
        title: "Overview",
        copy: "Snapshot of adoption, usage, and alerts for the last 7 days.",
        to: "/admin/dashboard"
      }, // Keep first - primary entry point
      {
        title: "Reports & Activity",
        copy: "Comprehensive analytics, audit logs, and reporting dashboard in one place.",
        to: "/admin/reports"
      },
      {
        title: "Approvals",
        copy: "White-glove review of contracts, briefs, and payments before they go live.",
        to: "/admin/approvals"
      },
      {
        title: "Brands",
        copy: "Track brands as long-lived CRM entities across deals, tasks, outreach, and finance.",
        to: "/admin/brands"
      },
      {
        title: "Campaigns",
        copy: "Group multi-deal activations so teams work around moments, not just contracts.",
        to: "/admin/campaigns"
      },
      {
        title: "Deals",
        copy: "The commercial spine. Every deal belongs to a brand and anchors work and follow-through.",
        to: "/admin/deals"
      },
      {
        title: "Documents / Contracts",
        copy: "Track contract status, timing, and renewal risk in context — not just files.",
        to: "/admin/documents"
      },
      {
        title: "Events",
        copy: "Track brand dinners, trips, panels, and previews with prep + follow-up in context.",
        to: "/admin/events"
      },
      {
        title: "Finance",
        copy: "Payment batches, invoices, and reconciliation tasks awaiting review.",
        to: "/admin/finance"
      },
      {
        title: "Messaging",
        copy: "Internal inbox mirroring creator comms. Filter by persona or queue.",
        to: "/admin/messaging"
      },
      {
        title: "Outreach",
        copy: "Track outbound to brands + creators with Gmail-linked follow-ups and opportunities.",
        to: "/admin/outreach"
      },
      {
        title: "Queues",
        copy: "Incoming approvals, onboarding, and support requests awaiting routing.",
        to: "/admin/queues"
      },
      {
        title: "Tasks",
        copy: "Task management and workflow tracking.",
        to: "/admin/tasks"
      },
      {
        title: "Talent",
        copy: "Manage talent profiles, representation types, and relationships.",
        to: "/admin/talent"
      },
      {
        title: "Users",
        copy: "Audit creator, brand, and manager accounts. Impersonate or edit roles quickly.",
        to: "/admin/users"
      },
      {
        title: "Settings",
        copy: "Access control, integrations, outbound comms, and admin notes.",
        to: "/admin/settings"
      } // Keep last - standard placement
    ]
  },
  exclusive: {
    role: "exclusive-talent",
    title: "Exclusive Talent Control Room",
    subtitle: "",
    tabs: [
      { label: "Overview", anchor: "#exclusive-overview", default: true }, // Keep first - default tab
      { label: "Campaigns", anchor: "#exclusive-campaigns" },
      { label: "Contracts", anchor: "#exclusive-contracts" },
      { label: "Financials", anchor: "#exclusive-financials" },
      { label: "Messages", anchor: "#exclusive-messages" },
      { label: "My Profile", anchor: "#exclusive-profile" },
      { label: "Opportunities", anchor: "#exclusive-opportunities" },
      { label: "Settings", anchor: "#exclusive-settings" }, // Keep last - standard placement
      { label: "Socials", anchor: "#exclusive-socials" }
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
      { label: "Overview", to: "/creator/dashboard" },
      { label: "Account", to: "/creator/account" },
      { label: "Agent", to: "/creator/agent" },
      { label: "Campaigns", to: "/creator/campaigns" },
      { label: "Calendar", to: "/creator/calendar" },
      { label: "Contracts", to: "/creator/contracts" },
      { label: "Messages", to: "/creator/messages" },
      { label: "Socials", to: "/creator/socials" },
      { label: "Opportunities", to: "/creator/opportunities" }
    ],
    metrics: [],  // Populated dynamically from real data
    queue: {
      label: "Action items",
      title: "Creator to-do",
      cta: "Open planner",
      items: []  // Populated dynamically from real data
    },
    quickLinks: [
      { title: "AI agent", copy: "Prep responses, rate cards, and trackers via natural language." },
      { title: "Campaign pipeline", copy: "View every signed brief with budgets, deliverables, and chat." },
      { title: "Finance", copy: "Invoices sent, payouts pending, compliance docs on file." },
      { title: "Opportunities", copy: "Public + priority briefs filtered to your markets and platforms." }
    ]
  },
  ugc: {
    role: "ugc",
    title: "UGC Talent Control Room",
    subtitle: "The lightweight console for UGC creators shipping briefs via the public board.",
    tabs: [
      "Overview", // Keep first - primary entry point
      { label: "Briefs", to: "/ugc/briefs" },
      { label: "Education", to: "/resource-hub" },
      { label: "Finance", to: "/ugc/finance" },
      { label: "Messages", to: "/ugc/messages" },
      { label: "Tools", to: "/ugc/tools" }
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
    ] // Already alphabetized
  },
  founder: {
    role: "founder",
    title: "Founder Control Room",
    subtitle: "Your strategic home — clarity, direction, and hands-on support from The Break.",
    orientation:
      "This is your strategic home. Use this space to review audience signals, see how strategy is evolving, and understand what The Break is focused on for you.",
    tabs: [
      { label: "Overview", anchor: "#founder-overview", default: true }, // Keep first - default tab
      { label: "Content & Distribution", anchor: "#founder-content" },
      { label: "Offers & Revenue", anchor: "#founder-offers" },
      { label: "Projects", anchor: "#founder-projects" },
      { label: "Resources", anchor: "#founder-resources" },
      { label: "Sessions & Support", anchor: "#founder-sessions" },
      { label: "Strategy", anchor: "#founder-strategy" },
      { label: "Account", anchor: "#founder-account" } // Keep last - standard placement
    ],
    metrics: [
      { label: "Current focus", value: "Audience → Offer", sub: "Active strategy phase" },
      { label: "Next actions", value: "3", sub: "Queued by The Break" },
      { label: "Goal status", value: "On track", sub: "North Star alignment" }
    ],
    goals: {
      primary: ["Establish authority as the go-to operator for AI-driven consumer launches.", "Protect premium positioning while scaling partnerships."],
      quarterFocus: "Q1 focus: validate offer ladder and grow qualified pipeline from founder-led content.",
      notPriority: "Not a priority right now: expanding into unrelated niches that dilute positioning."
    },
    audienceSignals: [
      {
        title: "What your audience is responding to",
        points: [
          "Threads that unpack behind-the-scenes of founder decisions get the highest saves.",
          "Mini-teardowns of AI launch playbooks drive DMs asking for templates.",
          "Requests for pricing transparency and how you vet partners."
        ]
      },
      {
        title: "What needs more clarity",
        points: [
          "Difference between founder-led strategy vs. self-serve platform access.",
          "Who your offer is best for: emerging brands vs. scaled operators."
        ]
      }
    ],
    brandTrust: {
      clarity: [
        "Positioning understood as: founder-led strategy plus platform execution.",
        "Audience recognizes premium tier but wants clearer entry points."
      ],
      trustSignals: [
        "Saves and shares on pricing/offer breakdown posts.",
        "DMs requesting direct consultations after case-study drops."
      ],
      misalignment: [
        "Some comments still conflate you with a generic agency — need sharper language on 'operator-led'."
      ]
    },
    nicheAlignment: [
      { label: "AI founders & operators", status: "Strong alignment", note: "High engagement on GTM threads and case studies." },
      { label: "Luxury / premium consumer", status: "Mixed signals", note: "Interest present but needs clearer offer fit." },
      { label: "General creator economy", status: "Early / exploratory", note: "Use for top-of-funnel visibility, not core focus." }
    ],
    brandEcosystem: [
      { label: "Founder brand site", url: "#", description: "Primary narrative and offer access point." },
      { label: "Offers", url: "#", description: "Current offer ladder and pricing hypotheses." },
      { label: "Instagram", url: "#", description: "Founder POV, behind-the-scenes, and launches." },
      { label: "LinkedIn", url: "#", description: "Operator audience and B2B positioning." },
      { label: "X / Threads", url: "#", description: "Real-time thinking, market signals, and asks." },
      { label: "Email list / community", url: "#", description: "Deeper strategy drops and nurture." }
    ],
    meetingsTranslation: [
      {
        title: "Weekly founder strategy",
        insight: "Audience → Offer sequencing needs clearer entry offer.",
        decision: "Lead with a diagnostic + rapid offer lab before retainer.",
        action: "Break is drafting the diagnostic outline and pricing guardrails."
      },
      {
        title: "Offer lab: pricing",
        insight: "Premium tier is well-received; mid-tier positioning is fuzzy.",
        decision: "Rename mid-tier to 'Operator Sprint' with defined outcomes.",
        action: "Update offer ladder draft and social proof for Operator Sprint."
      }
    ],
    strategyUpdates: [
      { title: "Offer ladder draft updated", detail: "Added Operator Sprint entry point + premium guardrails.", when: "Today" },
      { title: "Audience signal review completed", detail: "Validated AI founders as primary lane; luxury remains secondary.", when: "This week" },
      { title: "Pricing assumptions stress-tested", detail: "Modeled margin vs. delivery load for three tiers.", when: "This week" }
    ],
    meetings: {
      anchor: "founder-sessions",
      upcoming: [
        { title: "Weekly founder strategy", date: "Thu · 10:30 GMT", owner: "Strategy Pod", detail: "Reprioritize GTM sprint + AI newsletter." },
        { title: "Offer lab: pricing", date: "Mon · 15:00 GMT", owner: "Revenue Ops", detail: "Validate new tiered offer + promo plan." }
      ],
      notes: [
        { title: "Last session recap", detail: "Aligned on Audience → Offer focus. Homework: publish 2x founder POV threads.", action: "Draft talking points for Threads + LinkedIn." },
        { title: "Next actions", detail: "Upload revised lead magnet copy; share KPIs from paid test.", action: "Send metrics to Strategy Pod for review." }
      ]
    },
    projects: {
      anchor: "founder-projects",
      active: [
        { title: "Audience → Offer sprint", owner: "Strategy Pod", status: "In motion", due: "This week", detail: "Clarify ICP, refine offer ladder, and prep nurture path." },
        { title: "Founder content revamp", owner: "Content Desk", status: "In review", due: "Next week", detail: "Monthly talking points + AI-assisted outlines." }
      ],
      milestones: [
        { title: "ICP + narrative lock", date: "Wed", status: "On track" },
        { title: "Offer sheet v2", date: "Fri", status: "Needs inputs" },
        { title: "Distribution map", date: "Next Mon", status: "Planned" }
      ],
      deliverables: [
        { title: "Offer one-pager + pricing", owner: "Revenue Ops", status: "Drafted" },
        { title: "Founder POV threads (2)", owner: "Content Desk", status: "In progress" },
        { title: "Nurture email 0 + 1", owner: "Lifecycle", status: "Queued" }
      ],
      files: [
        { title: "Narrative board", type: "FigJam", url: "#" },
        { title: "Offer ladder sheet", type: "Sheet", url: "#" },
        { title: "Promo plan", type: "Deck", url: "#" }
      ],
      updates: [
        { title: "Strategy recap", body: "ICP narrowed to AI founders in UAE/UK; next focus is pricing proof." },
        { title: "Risk watch", body: "Need KPI snapshots before scaling paid test." }
      ]
    },
    queue: {
      label: "Founder queue",
      title: "Signals & clarity",
      cta: "View plan",
      items: [
        { title: "Positioning update draft", owner: "Strategy Pod", status: "Ready for review" },
        { title: "GTM sprint outline", owner: "Growth Desk", status: "Needs prioritization" },
        { title: "Offer pricing review", owner: "Revenue Ops", status: "Awaiting notes" }
      ]
    },
    quickLinks: [
      { title: "Content & distribution", copy: "Platform focus, monthly talking points, and CTAs." },
      { title: "Offers & revenue", copy: "Live offers, pricing guidance, and partnership ideas." },
      { title: "Sessions & support", copy: "Book calls, drop async questions, and review notes." },
      { title: "Strategy", copy: "Narrative, ICP, offer stack, GTM direction, and notes." }
    ]
  },
  brand: {
    role: "brand",
    title: "Brand Control Room",
    subtitle: "Campaign controls, creator match, contracts, messaging, and reporting in one lane.",
    tabs: [
      { label: "Overview", anchor: "#brand-overview", default: true }, // Keep first - default tab
      { label: "Account", anchor: "#brand-account" }, // Keep last - standard placement
      { label: "Campaigns", anchor: "#brand-campaigns" },
      { label: "Creators", anchor: "#brand-creators" },
      { label: "Messages", anchor: "#brand-messages" },
      { label: "Reports", anchor: "#brand-reports" }
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
      { title: "Contracts & invoices", copy: "Templates with guardrails for legal + finance." },
      { title: "Creator match", copy: "Filters for geography, platforms, and compliance signals." },
      { title: "Insights", copy: "Performance dashboards, lift studies, and recaps." }
    ]
  }
};
