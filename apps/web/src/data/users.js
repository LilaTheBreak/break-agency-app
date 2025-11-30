export const ACCOUNT_TYPES = [
  "Admin leadership",
  "Finance & GTM",
  "Operations",
  "Founder",
  "Brand seat",
  "Exclusive talent",
  "UGC talent",
  "Creator",
  "Observer"
];

export const SOCIAL_LINK_PRESETS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Pinterest",
  "Website",
  "Portfolio"
];

export const SOCIAL_LINK_PLACEHOLDERS = {
  instagram: "https://instagram.com/handle",
  tiktok: "https://www.tiktok.com/@handle",
  youtube: "https://youtube.com/@channel",
  linkedin: "https://linkedin.com/in/profile",
  pinterest: "https://pinterest.com/username",
  website: "https://yourdomain.com",
  portfolio: "https://site.com/portfolio"
};

export function getSocialPlaceholder(label) {
  if (!label) return "https://";
  const key = label.trim().toLowerCase();
  return SOCIAL_LINK_PLACEHOLDERS[key] || "https://";
}

export function ensureLinkSlots(links = []) {
  const normalized = (links || []).map((link) => ({
    label: link.label || "",
    url: link.url || ""
  }));
  const existing = new Set(
    normalized
      .map((link) => link.label?.trim().toLowerCase())
      .filter(Boolean)
  );
  SOCIAL_LINK_PRESETS.forEach((label) => {
    if (!existing.has(label.toLowerCase())) {
      normalized.push({ label, url: "" });
    }
  });
  return normalized;
}

export const USER_PROFILES = {
  "lila@thebreakco.com": {
    name: "Lila Prasad",
    role: "Admin",
    accountType: "Admin leadership",
    location: "London / Doha",
    timezone: "GMT+1",
    pronouns: "She/Her",
    status: "Active · Full access",
    bio: "Co-founder leading ops, client strategy, and the growth of the Break ecosystem.",
    personaRoute: "/admin/dashboard",
    personaLabel: "Admin control room",
    stats: [
      { label: "Briefs managed", value: "72" },
      { label: "Teams led", value: "4 pods" },
      { label: "Response time", value: "12m avg" }
    ],
    activity: [
      "Approved 3 hospitality creators for GCC roster",
      "Routed fintech brief to automation pod",
      "Flagged 2 invoices for manual review"
    ],
    tags: ["Admin", "Founder", "Ops"],
    links: [
      { label: "Calendly", url: "https://cal.com/lila" },
      { label: "Portfolio", url: "https://thebreak.co/lila" }
    ]
  },
  "mo@thebreakco.com": {
    name: "Mo Al Ghazi",
    role: "Admin",
    accountType: "Finance & GTM",
    location: "Dubai",
    timezone: "GMT+4",
    pronouns: "He/Him",
    status: "Active · Finance + GTM",
    bio: "Oversees commercial deals, finance operations, and hospitality partnerships.",
    personaRoute: "/admin/finance",
    personaLabel: "Finance cockpit",
    stats: [
      { label: "Campaigns", value: "38 live" },
      { label: "Receivables", value: "£120k" },
      { label: "Approvals", value: "6 pending" }
    ],
    activity: [
      "Cleared 4 payouts awaiting brand confirmation",
      "Shared AI copilot brief with talent pod",
      "Updated FY runway tracker"
    ],
    tags: ["Admin", "Finance"],
    links: [{ label: "LinkedIn", url: "https://linkedin.com/in/moalghazi" }]
  },
  "brand@client.com": {
    name: "Break Client",
    role: "Brand Partner",
    accountType: "Brand seat",
    location: "Paris / Remote",
    timezone: "GMT+2",
    pronouns: "They/Them",
    status: "Active brand seat",
    bio: "Retail + experiential team using Break creators across EU and GCC markets.",
    personaRoute: "/admin/view/brand",
    personaLabel: "Brand preview",
    stats: [
      { label: "Campaigns", value: "8 live" },
      { label: "Budget committed", value: "£510k" },
      { label: "Creators shortlisted", value: "34" }
    ],
    activity: [
      "Shared new creative for retail capsule tour",
      "Requested additional hospitality creators",
      "Approved invoices for AI fintech launch"
    ],
    tags: ["Brand", "Retail", "Experiential"],
    links: [{ label: "Brand site", url: "https://client-brand.com" }]
  },
  "exclusive@talent.com": {
    name: "Exclusive Creator",
    role: "Exclusive talent",
    accountType: "Exclusive talent",
    location: "New York",
    timezone: "GMT-4",
    pronouns: "She/Her",
    status: "Premium roster",
    bio: "Lifestyle + travel creator with white-glove support and hybrid IRL residencies.",
    personaRoute: "/admin/view/exclusive",
    personaLabel: "Exclusive talent preview",
    stats: [
      { label: "Active campaigns", value: "5" },
      { label: "Projected revenue", value: "£74k" },
      { label: "Briefs pending", value: "3" }
    ],
    activity: [
      "Uploaded final edits for Atlantis hospitality brief",
      "Negotiating fintech usage rights with ops",
      "Requested strategy session for Q2 tour"
    ],
    tags: ["Talent", "Lifestyle", "Travel"],
    links: [
      { label: "Instagram", url: "https://instagram.com/exclusive.creator" },
      { label: "Media kit", url: "https://break.agency/media/exclusive" }
    ]
  },
  "ugc@creator.com": {
    name: "UGC Creator",
    role: "UGC talent",
    accountType: "UGC talent",
    location: "Toronto",
    timezone: "GMT-5",
    pronouns: "He/Him",
    status: "Board access granted",
    bio: "UGC specialist delivering short-form edits and onboarding flows for Break brands.",
    personaRoute: "/admin/view/ugc",
    personaLabel: "UGC talent preview",
    stats: [
      { label: "Open briefs", value: "14" },
      { label: "Shortlists", value: "5" },
      { label: "Payouts pending", value: "7" }
    ],
    activity: [
      "Applied to eco skincare reels brief",
      "Sent version 2 of fintech onboarding video",
      "Requested pricing guidance for AI pilot"
    ],
    tags: ["UGC", "Short-form"],
    links: [{ label: "Portfolio", url: "https://breakugc.com/creator" }]
  }
};

export const DEFAULT_PROFILE = {
  name: "Platform Member",
  role: "User",
  accountType: "Member",
  location: "Remote",
  timezone: "GMT",
  pronouns: "They/Them",
  status: "Active",
  bio: "Profile details coming soon.",
  personaRoute: "/admin/users",
  personaLabel: "Users",
  stats: [
    { label: "Sessions", value: "—" },
    { label: "Campaigns", value: "—" },
    { label: "Approvals", value: "—" }
  ],
  activity: ["No recorded actions yet."],
  tags: ["User"],
  links: []
};
