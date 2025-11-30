export const resourceItems = [
  {
    title: "AI-Native Brief Builder",
    type: "Template",
    audience: "Everyone",
    description: "Framings to scope influencer or UGC campaigns in minutes.",
    cta: "Download",
    category: "Templates"
  },
  {
    title: "Dubai & London Launch Playbook",
    type: "Guide",
    audience: "Brands",
    description: "Regional talent fees, shoot logistics, and compliance guardrails.",
    cta: "Read guide",
    category: "Articles"
  },
  {
    title: "Creator CFO Toolkit",
    type: "Digital Product",
    audience: "Creators",
    description: "Notion finance HQ + rate calculator used by Break Agency talent.",
    cta: "Purchase",
    category: "Digital Product"
  },
  {
    title: "Inbox Zero for Talent Managers",
    type: "Checklist",
    audience: "Managers",
    description: "Weekly operating rhythm for campaigns, comms, invoices.",
    cta: "Copy checklist",
    category: "Checklists"
  },
  {
    title: "Pitch Clinic: Case Studies Library",
    type: "Webinar",
    audience: "Everyone",
    description: "Live walk-through of 3 partnership wins with Q&A.",
    cta: "Register",
    category: "Webinars"
  }
];

export const ugcBriefs = [
  {
    id: "ugc-1",
    title: "Luxury Resort Staycation Reels",
    brand: "Atlantis The Royal",
    budget: "AED 18k – AED 24k",
    deliverables: ["3x Reels", "1x TikTok", "Stills"],
    deadline: "10 Feb",
    region: "Dubai only",
    status: "Open",
    access: "priority"
  },
  {
    id: "ugc-2",
    title: "Gulf-Air Creator Desk",
    brand: "Gulf Air",
    budget: "£6k flat",
    deliverables: ["Mini vlog", "Stories pack"],
    deadline: "22 Feb",
    region: "London + Doha",
    status: "Shortlisting",
    access: "priority"
  },
  {
    id: "ugc-3",
    title: "AI Productivity Stack Features",
    brand: "Notion x Break",
    budget: "Revenue share",
    deliverables: ["Guide", "Newsletter placement"],
    deadline: "Rolling",
    region: "Remote",
    status: "Always-on",
    access: "public"
  }
];

export const creatorMetrics = [
  { label: "Active campaigns", value: "4", delta: "+2 vs last month" },
  { label: "Projected revenue", value: "£28.4k", delta: "Includes paid media uplift" },
  { label: "UGC priority slots", value: "3", delta: "1 reserved for AI SaaS" },
  { label: "Brief response SLA", value: "3h avg", delta: "Goal under 4h" }
];

export const brandCampaigns = [
  {
    id: "cmp-1",
    name: "Creator Residency · Q2",
    status: "Live sprint",
    stage: "Deliverables",
    reach: "12.4M",
    creators: 8,
    owner: "Mo Al Ghazi"
  },
  {
    id: "cmp-2",
    name: "UGC Bank · Always-On",
    status: "Briefing",
    stage: "Shortlisting",
    reach: "—",
    creators: 24,
    owner: "Break Studio"
  },
  {
    id: "cmp-3",
    name: "Creator Match Pilot (AI)",
    status: "Discovery",
    stage: "Needs analysis",
    reach: "Target 6M",
    creators: 0,
    owner: "Automation Pod"
  }
];

export const questionnaires = [
  {
    title: "Brand Needs Finder",
    summary: "Creates a scoped brief, budget rails, and onboarding link.",
    cta: "Start questionnaire",
    route: "/brand?questionnaire=needs"
  },
  {
    title: "Creator Readiness Check",
    summary: "Audits socials, usage rights readiness, and consent.",
    cta: "Take readiness check",
    route: "/creator?questionnaire=readiness"
  }
];
