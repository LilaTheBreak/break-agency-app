import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { LISTINGS } from "../data/listings";

const NAV_ITEMS = [
  { to: "/crm/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/crm/listings", label: "Listings", icon: "📋" },
  { to: "/crm/contacts", label: "Contacts", icon: "👥" },
  { to: "/crm/viewings", label: "Viewings", icon: "🗓️" },
  { to: "/crm/offers", label: "Offers", icon: "💬" },
  { to: "/crm/sales", label: "Sales", icon: "🔁" },
  { to: "/crm/letters", label: "Letters", icon: "✉️" },
  { to: "/crm/settings", label: "Settings", icon: "⚙️" }
];

const SEARCH_TYPE_STYLES = {
  "Board request": "border-amber-400/40 bg-amber-500/10 text-amber-100",
  Compliance: "border-rose-400/40 bg-rose-500/10 text-rose-100",
  Offer: "border-sky-400/40 bg-sky-500/10 text-sky-100",
  Viewing: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  Seller: "border-purple-400/40 bg-purple-500/10 text-purple-100",
  Listing: "border-slate-400/40 bg-slate-500/10 text-slate-200"
};

const SELLER_PROFILES_KEY = "home_seller_profiles_v1";
const USER_PROFILES_KEY = "home_user_profiles_v1";
const CRM_PIPELINE_TARGETS = { clients: 12, onboarding: 3, active: 5 };

function offsetDate(daysFromToday) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + daysFromToday);
  return base.toISOString().slice(0, 10);
}

function hoursAgo(hours) {
  const base = new Date();
  base.setHours(base.getHours() - hours);
  return base;
}

function minutesAgo(minutes) {
  const base = new Date();
  base.setMinutes(base.getMinutes() - minutes);
  return base;
}

function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const iso = `${dateStr}T${timeStr || "09:00"}`;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatCurrency(amount, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function formatShortDate(date) {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function formatShortTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortDateTime(date) {
  if (!date) return "—";
  return `${formatShortDate(date)} • ${formatShortTime(date)}`;
}

function formatRelative(date) {
  if (!date) return "";
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const absMinutes = Math.round(absMs / 60000);
  if (absMinutes < 1) return diffMs >= 0 ? "in moments" : "just now";
  if (absMinutes < 60) {
    return diffMs >= 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`;
  }
  const absHours = Math.round(absMs / 3600000);
  if (absHours < 48) {
    return diffMs >= 0 ? `in ${absHours}h` : `${absHours}h ago`;
  }
  const absDays = Math.round(absMs / 86400000);
  return diffMs >= 0 ? `in ${absDays}d` : `${absDays}d ago`;
}

function isWithinDaysFromNow(date, days) {
  if (!date) return false;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 86400000;
}

function loadJSONSafe(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function deriveDisplayName(email, fallback = "Contact") {
  if (!email) return fallback;
  const [prefix] = email.split("@");
  if (!prefix) return fallback;
  return prefix
    .split(/[._-]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

const BASE_LISTING_ID = LISTINGS[0]?.id || "w8-123";
const SECONDARY_LISTING_ID = LISTINGS[1]?.id || BASE_LISTING_ID;

const CRM_SELLER_BASELINE = {
  "seller@test.com": {
    contactName: "Seller Summit",
    status: "active",
    address: "123 Kensington High St, London W8",
    postcode: "W8 5TT",
    planKey: "premier",
    activeListingId: BASE_LISTING_ID,
    marketingLaunch: offsetDate(-5),
    boardPreference: "yes",
    boardInstallBooked: null,
    boardRequestUpdatedAt: hoursAgo(16).toISOString(),
    ownershipDocReceived: true,
    idDocsVerified: true,
    amlCleared: true,
    epcDocument: true,
    valuationRange: { lower: 1800000, upper: 1900000, midpoint: 1850000 },
    salesStage: "offers"
  },
  "valuation@test.com": {
    contactName: "Valuation Preview",
    status: "prospect",
    address: "45 Brookfield Avenue, London N1",
    postcode: "N1 3AB",
    planKey: "core",
    boardPreference: "undecided",
    boardInstallBooked: null,
    boardRequestUpdatedAt: hoursAgo(4).toISOString(),
    ownershipDocReceived: false,
    idDocsVerified: false,
    amlCleared: false,
    epcDocument: false,
    valuationRange: { lower: 820000, upper: 910000, midpoint: 865000 },
    salesStage: "valuation"
  },
  "developer@test.com": {
    contactName: "Developer Lead",
    status: "checkout",
    address: "18 Harbour Point, Canary Wharf E14",
    postcode: "E14 9SH",
    planKey: "premier",
    activeListingId: SECONDARY_LISTING_ID,
    marketingLaunch: offsetDate(1),
    boardPreference: "yes",
    boardInstallBooked: offsetDate(3),
    boardRequestUpdatedAt: hoursAgo(8).toISOString(),
    ownershipDocReceived: true,
    idDocsVerified: true,
    amlCleared: true,
    epcDocument: true,
    valuationRange: { lower: 1250000, upper: 1350000, midpoint: 1300000 },
    salesStage: "onboarding"
  }
};

const CRM_USER_BASELINE = {
  "seller@test.com": { displayName: "Seller Summit" },
  "valuation@test.com": { displayName: "Valuation Preview" },
  "developer@test.com": { displayName: "Developer Lead" },
  "buyer@test.com": { displayName: "Buyer Beta" },
  "buyerseller@test.com": { displayName: "Hybrid Hero" },
  "priya.dan@buyers.com": { displayName: "Priya & Dan" },
  "corporate@relocators.com": { displayName: "Corporate Relocation" },
  "luca@buyers.com": { displayName: "Luca P." },
  "agent@test.com": { displayName: "Agent Apex" },
  "lila@thebreakco.com": { displayName: "Lila @ HOME" }
};

const CRM_AGENT_CONTACTS = [
  {
    email: "lila@thebreakco.com",
    name: "Lila @ HOME",
    phone: "+44 20 1111 2222",
    company: "HOME AI",
    role: "Agent admin",
    notes: "Oversees onboarding and compliance."
  },
  {
    email: "mo@thebreakco.com",
    name: "Mo @ HOME",
    phone: "+44 20 3333 4444",
    company: "HOME AI",
    role: "Agent",
    notes: "Leads high-value marketing campaigns."
  },
  {
    email: "agent@test.com",
    name: "Agent Apex",
    phone: "+44 20 5555 9000",
    company: "HOME AI",
    role: "Agent",
    notes: "Assigned to Kensington listings."
  }
];

const CRM_LEGAL_CONTACTS = [
  {
    email: "alex.morgan@legalpartners.co.uk",
    name: "Alex Morgan",
    company: "Legal Partners LLP",
    phone: "+44 20 7000 1122",
    notes: "Preferred conveyancer; integrated with offer workflow."
  },
  {
    email: "sarah.cho@citylawgroup.com",
    name: "Sarah Cho",
    company: "City Law Group",
    phone: "+44 20 7555 8877",
    notes: "Handles new build developer contracts."
  }
];

const CRM_VIEWINGS_BASELINE = [
  {
    id: "vw-1",
    listingId: BASE_LISTING_ID,
    sellerEmail: "seller@test.com",
    buyerEmail: "priya.dan@buyers.com",
    buyerName: "Priya & Dan",
    agent: "Agent Apex",
    status: "Confirmed",
    date: offsetDate(1),
    time: "15:00",
    notes: "Confirm parking instructions 24h prior."
  },
  {
    id: "vw-2",
    listingId: BASE_LISTING_ID,
    sellerEmail: "seller@test.com",
    buyerEmail: "corporate@relocators.com",
    buyerName: "Corporate relocation",
    agent: "Lila @ HOME",
    status: "Awaiting confirm",
    date: offsetDate(3),
    time: "11:30",
    notes: "Need video tour if diary clashes."
  },
  {
    id: "vw-3",
    listingId: SECONDARY_LISTING_ID,
    sellerEmail: "developer@test.com",
    buyerEmail: "buyer@test.com",
    buyerName: "Buyer Beta",
    agent: "Agent Apex",
    status: "Scheduled",
    date: offsetDate(5),
    time: "10:00",
    notes: "Pre-launch walkthrough with developer contact."
  }
];

const CRM_OFFERS_BASELINE = [
  {
    id: "of-101",
    listingId: BASE_LISTING_ID,
    sellerEmail: "seller@test.com",
    buyerEmail: "priya.dan@buyers.com",
    buyerName: "Priya & Dan",
    amount: 1825000,
    status: "Awaiting proof",
    updatedAt: hoursAgo(4).toISOString(),
    notes: "Proof of funds requested — due COB today."
  },
  {
    id: "of-102",
    listingId: SECONDARY_LISTING_ID,
    sellerEmail: "developer@test.com",
    buyerEmail: "luca@buyers.com",
    buyerName: "Luca P.",
    amount: 1285000,
    status: "Counter sent",
    updatedAt: hoursAgo(19).toISOString(),
    notes: "Replied with revised completion timeline."
  }
];

const CRM_ACTIVITY_BASELINE = [
  {
    id: "act-ops",
    title: "Marketing performance summary sent to Seller Summit",
    detail: "Agent Apex recapped portal leads for the past 7 days.",
    timestamp: minutesAgo(50).toISOString(),
    tone: "info"
  },
  {
    id: "act-buyer",
    title: "New buyer registration: buyer@test.com",
    detail: "Preferences saved for SW3 / £1.2m. Assigned to Agent Apex.",
    timestamp: hoursAgo(9).toISOString(),
    tone: "neutral"
  }
];

const CONTACT_TYPE_ORDER = ["Buyer & Seller", "Seller", "Buyer", "Legal", "Agent", "Site member"];

function buildContactDirectory({ sellers, userProfiles, listingMap }) {
  const directory = new Map();

  const ensure = (email, defaults = {}) => {
    if (!email) return null;
    const key = email.toLowerCase();
    if (!directory.has(key)) {
      directory.set(key, {
        email,
        name: defaults.name || deriveDisplayName(email),
        phone: defaults.phone || "",
        company: defaults.company || "",
        notes: defaults.notes || "",
        types: new Set(defaults.type ? [defaults.type] : []),
        relatedListings: new Set(defaults.relatedListings || []),
        lastInteraction: defaults.lastInteraction ? new Date(defaults.lastInteraction) : null
      });
    } else if (defaults.name) {
      directory.get(key).name = defaults.name;
    }
    const record = directory.get(key);
    if (defaults.phone && !record.phone) record.phone = defaults.phone;
    if (defaults.company && !record.company) record.company = defaults.company;
    if (defaults.notes) {
      record.notes = record.notes ? `${record.notes} ${defaults.notes}`.trim() : defaults.notes;
    }
    if (defaults.type) record.types.add(defaults.type);
    if (defaults.relatedListings) {
      defaults.relatedListings.forEach((id) => record.relatedListings.add(id));
    }
    if (defaults.lastInteraction) {
      const dt = new Date(defaults.lastInteraction);
      if (!record.lastInteraction || dt > record.lastInteraction) {
        record.lastInteraction = dt;
      }
    }
    return record;
  };

  sellers.forEach((seller) => {
    ensure(seller.email, {
      name: seller.contactName || deriveDisplayName(seller.email),
      type: "Seller",
      phone: seller.phone,
      notes:
        seller.status === "checkout"
          ? "Onboarding"
          : seller.status === "active"
          ? "Active instruction"
          : "Prospect",
      relatedListings: seller.activeListingId ? [seller.activeListingId] : [],
      lastInteraction: seller._updatedAt || seller.boardRequestUpdatedAt || Date.now()
    });
  });

  CRM_AGENT_CONTACTS.forEach((agent) => {
    ensure(agent.email, {
      name: agent.name,
      type: "Agent",
      phone: agent.phone,
      company: agent.company,
      notes: agent.role ? `${agent.role}. ${agent.notes || ""}`.trim() : agent.notes || ""
    });
  });

  CRM_LEGAL_CONTACTS.forEach((contact) => {
    ensure(contact.email, {
      name: contact.name,
      company: contact.company,
      phone: contact.phone,
      type: "Legal",
      notes: contact.notes
    });
  });

  CRM_VIEWINGS_BASELINE.forEach((viewing) => {
    const occursAt = combineDateTime(viewing.date, viewing.time);
    ensure(viewing.buyerEmail, {
      name: viewing.buyerName,
      type: "Buyer",
      relatedListings: [viewing.listingId],
      lastInteraction: occursAt
    });
    ensure(viewing.sellerEmail, {
      type: "Seller",
      relatedListings: [viewing.listingId],
      lastInteraction: occursAt
    });
  });

  CRM_OFFERS_BASELINE.forEach((offer) => {
    ensure(offer.buyerEmail, {
      name: offer.buyerName,
      type: "Buyer",
      relatedListings: [offer.listingId],
      lastInteraction: offer.updatedAt
    });
    ensure(offer.sellerEmail, {
      type: "Seller",
      relatedListings: [offer.listingId],
      lastInteraction: offer.updatedAt
    });
  });

  Object.entries(userProfiles).forEach(([email, profile]) => {
    ensure(email, {
      name: profile.displayName,
      notes: profile.summary,
      type: "Site member"
    });
  });

  const contacts = Array.from(directory.values()).map((record) => {
    const types = Array.from(record.types);
    if (types.includes("Seller") && types.includes("Buyer")) {
      record.types = new Set(["Buyer & Seller"]);
    }
    const finalTypes = Array.from(record.types);
    const orderedType =
      finalTypes.sort(
        (a, b) => CONTACT_TYPE_ORDER.indexOf(a) - CONTACT_TYPE_ORDER.indexOf(b)
      )[0] || "Site member";
    return {
      ...record,
      type: orderedType,
      types: finalTypes,
      relatedListings: Array.from(record.relatedListings)
        .map((id) => listingMap[id]?.title || id)
        .filter(Boolean)
    };
  });

  return contacts.sort((a, b) => {
    const diff = CONTACT_TYPE_ORDER.indexOf(a.type) - CONTACT_TYPE_ORDER.indexOf(b.type);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

function collectSellerRecords() {
  const stored = loadJSONSafe(SELLER_PROFILES_KEY, {});
  const merged = {};
  Object.entries(CRM_SELLER_BASELINE).forEach(([email, record]) => {
    merged[email] = { ...record };
  });
  Object.entries(stored || {}).forEach(([email, record]) => {
    merged[email] = { ...(merged[email] || {}), ...record };
  });
  return Object.entries(merged).map(([email, record]) => ({
    email,
    ...record,
    status: (record.status || "prospect").toLowerCase()
  }));
}

function collectUserProfiles() {
  const stored = loadJSONSafe(USER_PROFILES_KEY, {});
  const merged = { ...CRM_USER_BASELINE, ...(stored || {}) };
  return merged;
}

function buildDashboardData() {
  const sellers = collectSellerRecords();
  const userProfiles = collectUserProfiles();
  const listingMap = Object.fromEntries(LISTINGS.map((listing) => [listing.id, listing]));
  const contacts = buildContactDirectory({ sellers, userProfiles, listingMap });

  const viewings = CRM_VIEWINGS_BASELINE.map((viewing) => {
    const occursAt = combineDateTime(viewing.date, viewing.time);
    const listing = listingMap[viewing.listingId] || null;
    const seller = sellers.find((candidate) => candidate.email === viewing.sellerEmail) || null;
    const buyerProfile = userProfiles[viewing.buyerEmail] || {};
    const buyerLabel = viewing.buyerName || buyerProfile.displayName || deriveDisplayName(viewing.buyerEmail);
    return {
      ...viewing,
      occursAt,
      listing,
      seller,
      buyerLabel
    };
  }).sort((a, b) => {
    const aTime = a.occursAt ? a.occursAt.getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.occursAt ? b.occursAt.getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const offers = CRM_OFFERS_BASELINE.map((offer) => {
    const listing = listingMap[offer.listingId] || null;
    const seller = sellers.find((candidate) => candidate.email === offer.sellerEmail) || null;
    const buyerProfile = userProfiles[offer.buyerEmail] || {};
    const buyerLabel = offer.buyerName || buyerProfile.displayName || deriveDisplayName(offer.buyerEmail);
    const updatedAt = offer.updatedAt ? new Date(offer.updatedAt) : null;
    return {
      ...offer,
      listing,
      seller,
      buyerLabel,
      amountDisplay: formatCurrency(offer.amount || listing?.price || 0),
      updatedAt
    };
  }).sort((a, b) => {
    const aTime = a.updatedAt ? a.updatedAt.getTime() : 0;
    const bTime = b.updatedAt ? b.updatedAt.getTime() : 0;
    return bTime - aTime;
  });

  const counts = sellers.reduce(
    (acc, seller) => {
      const status = seller.status || "prospect";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { prospect: 0, checkout: 0, active: 0 }
  );

  const activeListingIds = new Set();
  sellers.forEach((seller) => {
    if (seller.activeListingId) activeListingIds.add(seller.activeListingId);
    if (Array.isArray(seller.properties)) {
      seller.properties.forEach((property) => {
        if (property.listingId) activeListingIds.add(property.listingId);
      });
    }
  });
  const activeListings = [...activeListingIds]
    .map((id) => listingMap[id])
    .filter(Boolean);

  const contactsByType = contacts.reduce((acc, contact) => {
    acc[contact.type] = (acc[contact.type] || 0) + 1;
    return acc;
  }, {});

  const viewingsThisWeek = viewings.filter((viewing) => isWithinDaysFromNow(viewing.occursAt, 7)).length;
  const pendingViewings = viewings.filter((viewing) =>
    (viewing.status || "").toLowerCase().includes("await")
  ).length;

  const offerPipeline = offers.filter((offer) => {
    const status = (offer.status || "").toLowerCase();
    return !status.includes("withdrawn") && !status.includes("completed");
  });
  const totalOfferVolume = offerPipeline.reduce((sum, offer) => sum + (offer.amount || 0), 0);
  const acceptedOffers = offers.filter((offer) => (offer.status || "").toLowerCase().includes("accept"));

  const viewingsByListing = viewings.reduce((acc, viewing) => {
    if (!viewing.listingId) return acc;
    acc[viewing.listingId] = (acc[viewing.listingId] || 0) + 1;
    return acc;
  }, {});
  const offersByListing = offers.reduce((acc, offer) => {
    if (!offer.listingId) return acc;
    const status = (offer.status || "").toLowerCase();
    if (!status.includes("withdrawn")) {
      acc[offer.listingId] = (acc[offer.listingId] || 0) + 1;
    }
    return acc;
  }, {});

  const metrics = [
    {
      key: "listings",
      label: "Active listings",
      value: activeListings.length,
      meta:
        acceptedOffers.length > 0
          ? `${acceptedOffers.length} under offer`
          : `${offerPipeline.length} offer${offerPipeline.length === 1 ? "" : "s"} in play`
    },
    {
      key: "clients",
      label: "Clients",
      value: contacts.length,
      meta: `${contactsByType["Seller"] || 0} sellers • ${contactsByType["Buyer"] || 0} buyers`
    },
    {
      key: "viewings",
      label: "Viewings (7d)",
      value: viewingsThisWeek,
      meta:
        pendingViewings > 0
          ? `${pendingViewings} awaiting confirm`
          : "All confirmed"
    },
    {
      key: "offers",
      label: "Offers in review",
      value: offerPipeline.length,
      meta: `${formatCurrency(totalOfferVolume)} pipeline`
    }
  ];

  const pipeline = [
    {
      key: "clients",
      title: "Clients",
      count: contacts.length,
      target: CRM_PIPELINE_TARGETS.clients,
      progress: Math.min(100, Math.round((contacts.length / CRM_PIPELINE_TARGETS.clients) * 100)),
      status:
        contacts.length === 0
          ? "empty"
          : contacts.length >= CRM_PIPELINE_TARGETS.clients
          ? "healthy"
          : "focus",
      description: "Active relationships across buyers, sellers, and partners.",
      highlights: contacts.slice(0, 3).map((contact) => {
        const detail =
          contact.relatedListings.length > 0
            ? `Linked to ${contact.relatedListings[0]}`
            : contact.type;
        const tone =
          contact.type === "Seller"
            ? "success"
            : contact.type === "Buyer"
            ? "info"
            : contact.type === "Legal"
            ? "warning"
            : "neutral";
        return {
          label: contact.name,
          detail,
          tone
        };
      })
    },
    {
      key: "onboarding",
      title: "Onboarding",
      count: counts.checkout || 0,
      target: CRM_PIPELINE_TARGETS.onboarding,
      progress: Math.min(100, Math.round(((counts.checkout || 0) / CRM_PIPELINE_TARGETS.onboarding) * 100)),
      status:
        counts.checkout >= CRM_PIPELINE_TARGETS.onboarding
          ? "healthy"
          : counts.checkout
          ? "focus"
          : "empty",
      description: "Sellers completing contracts and upfront payments.",
      highlights: sellers
        .filter((seller) => seller.status === "checkout")
        .slice(0, 3)
        .map((seller) => ({
          label: seller.address?.split(",")[0] || seller.contactName || deriveDisplayName(seller.email),
          detail: seller.contractSignedAt ? "Contract signed" : "Awaiting agreement",
          tone: seller.contractSignedAt ? "success" : "warning"
        }))
    },
    {
      key: "active",
      title: "Live listings",
      count: counts.active || 0,
      target: CRM_PIPELINE_TARGETS.active,
      progress: Math.min(100, Math.round(((counts.active || 0) / CRM_PIPELINE_TARGETS.active) * 100)),
      status: counts.active >= CRM_PIPELINE_TARGETS.active ? "healthy" : counts.active ? "focus" : "empty",
      description: "Properties live with marketing and enquiries.",
      highlights: activeListings.slice(0, 3).map((listing) => {
        const viewingsCount = viewingsByListing[listing.id] || 0;
        const offersCount = offersByListing[listing.id] || 0;
        let detail = `${viewingsCount} viewing${viewingsCount === 1 ? "" : "s"} scheduled`;
        if (offersCount) {
          detail += ` • ${offersCount} offer${offersCount === 1 ? "" : "s"}`;
        }
        return {
          label: listing.title,
          detail,
          tone: offersCount ? "success" : viewingsCount ? "neutral" : "warning"
        };
      })
    }
  ];

  const boardRequests = sellers
    .map((seller) => {
      const pref = seller.boardPreference || "undecided";
      if (pref === "no") return null;
      const listing = seller.activeListingId ? listingMap[seller.activeListingId] : null;
      const requestedAt = seller.boardRequestUpdatedAt ? new Date(seller.boardRequestUpdatedAt) : null;
      if (pref === "undecided") {
        return {
          id: `${seller.email}-decision`,
          seller,
          listing,
          status: "Awaiting seller decision",
          tone: "warning",
          requestedAt
        };
      }
      if (!seller.boardInstallBooked) {
        return {
          id: `${seller.email}-schedule`,
          seller,
          listing,
          status: "Schedule install",
          tone: "warning",
          requestedAt
        };
      }
      return {
        id: `${seller.email}-booked`,
        seller,
        listing,
        status: `Install booked ${formatShortDate(new Date(seller.boardInstallBooked))}`,
        tone: "neutral",
        requestedAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.requestedAt ? a.requestedAt.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.requestedAt ? b.requestedAt.getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  const docChecks = sellers
    .map((seller) => {
      const missing = [];
      if (!seller.ownershipDocReceived && !seller.ownershipDoc) missing.push("Proof of ownership");
      if (!seller.idDocsVerified) missing.push("ID / AML");
      if (!seller.epcDocument) missing.push("EPC");
      if (!missing.length) return null;
      return {
        id: `${seller.email}-docs`,
        seller,
        missing,
        tone: missing.length > 1 ? "warning" : "neutral"
      };
    })
    .filter(Boolean);

  const offerActivities = offers.slice(0, 4).map((offer) => {
    const tone = (offer.status || "").toLowerCase().includes("await") ? "warning" : "info";
    return {
      id: `offer-${offer.id}`,
      title: `Offer ${offer.status?.toLowerCase()}`,
      detail: `${offer.buyerLabel} • ${offer.listing?.title || offer.listingId}`,
      timestamp: offer.updatedAt || new Date(),
      tone
    };
  });

  const viewingActivities = viewings.slice(0, 4).map((viewing) => ({
    id: `viewing-${viewing.id}`,
    title: `${viewing.status} viewing`,
    detail: `${viewing.buyerLabel} • ${viewing.listing?.title || viewing.listingId}`,
    timestamp: viewing.occursAt || new Date(),
    tone: (viewing.status || "").toLowerCase().includes("await") ? "warning" : "success"
  }));

  const baseActivities = CRM_ACTIVITY_BASELINE.map((entry) => ({
    ...entry,
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date()
  }));

  const activity = [...baseActivities, ...offerActivities, ...viewingActivities]
    .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
    .slice(0, 8);

  return {
    metrics,
    pipeline,
    viewings,
    offers,
    boardRequests,
    docChecks,
    activity,
    activeListings,
    counts,
    sellers,
    userProfiles
  };
}

function useCrmData(extraDeps = []) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handle = (event) => {
      if (!event || !("key" in event)) {
        setVersion((n) => n + 1);
        return;
      }
      if (event.key === null || event.key === SELLER_PROFILES_KEY || event.key === USER_PROFILES_KEY) {
        setVersion((n) => n + 1);
      }
    };
    window.addEventListener("storage", handle);
    window.addEventListener("focus", handle);
    return () => {
      window.removeEventListener("storage", handle);
      window.removeEventListener("focus", handle);
    };
  }, []);

  return useMemo(() => buildDashboardData(), [version, ...extraDeps]);
}

function badgeClassForStatus(statusLabel) {
  const normalised = (statusLabel || "").toLowerCase();
  if (normalised.includes("confirm") && normalised.includes("await")) {
    return "border border-amber-400/40 text-amber-200";
  }
  if (normalised.includes("confirm")) {
    return "border border-emerald-400/40 text-emerald-200";
  }
  if (normalised.includes("proof") || normalised.includes("counter")) {
    return "border border-sky-400/40 text-sky-200";
  }
  if (normalised.includes("reject") || normalised.includes("withdraw")) {
    return "border border-rose-400/40 text-rose-200";
  }
  return "border border-slate-400/40 text-slate-200";
}

function readSessionValue(key, fallback = null) {
  if (typeof window === "undefined" || !window.sessionStorage) return fallback;
  try {
    const value = window.sessionStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    if (value === undefined || value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // ignore storage quota failures
  }
}

function removeSessionValue(key) {
  writeSessionValue(key, null);
}

export default function CrmLayout({ session, navItems = NAV_ITEMS, title = "Internal CRM" }) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (!event || typeof event.key !== "string") return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        const target = event.target;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [searchOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (searchOpen) {
      setSearchQuery("");
      setSearchActiveIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 0);
      document.body.style.setProperty("overflow", "hidden");
    } else {
      document.body.style.removeProperty("overflow");
    }
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [searchOpen]);

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  const searchData = useCrmData([searchOpen]);

  const searchResults = useMemo(() => {
    const items = [];
    const pushItem = (item) => {
      const keywords = item.keywords || [];
      const haystack = [item.title, item.description, item.badge, ...keywords]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      items.push({ ...item, keywords, haystack });
    };

    (searchData.boardRequests || []).forEach((request) => {
      pushItem({
        id: `board-${request.id}`,
        type: "Board request",
        title: request.seller?.contactName || deriveDisplayName(request.seller?.email),
        badge: request.listing?.title || request.seller?.address || "Board install",
        description: request.status,
        meta: request.requestedAt ? formatRelative(request.requestedAt) : "New",
        priority: 0,
        keywords: [
          request.seller?.email,
          request.seller?.postcode,
          request.listing?.area,
          request.status
        ],
        route: "/crm/dashboard"
      });
    });

    (searchData.docChecks || []).forEach((item) => {
      pushItem({
        id: `doc-${item.id}`,
        type: "Compliance",
        title: item.seller?.contactName || deriveDisplayName(item.seller?.email),
        badge: item.missing.length === 1 ? "1 outstanding" : `${item.missing.length} outstanding`,
        description: item.missing.join(", "),
        meta: item.seller?.postcode || "",
        priority: 1,
        keywords: [
          item.seller?.email,
          item.seller?.address,
          ...item.missing
        ],
        route: "/crm/dashboard"
      });
    });

    (searchData.offers || []).forEach((offer) => {
      pushItem({
        id: `offer-${offer.id}`,
        type: "Offer",
        title: offer.listing?.title || "Offer",
        badge: offer.status,
        description: `${offer.buyerLabel || "Buyer"} • ${offer.amountDisplay}`,
        meta: offer.updatedAt ? formatRelative(offer.updatedAt) : "",
        priority: 2,
        keywords: [
          offer.buyerLabel,
          offer.listing?.area,
          offer.seller?.contactName,
          offer.status,
          offer.amountDisplay
        ],
        route: "/crm/offers",
        onSelect: () => {
          writeSessionValue("crm:focusOffer", offer.id);
          navigate("/crm/offers");
        }
      });
    });

    (searchData.viewings || []).forEach((viewing) => {
      pushItem({
        id: `viewing-${viewing.id}`,
        type: "Viewing",
        title: viewing.listing?.title || "Viewing",
        badge: formatShortDate(viewing.occursAt),
        description: `${viewing.buyerLabel || "Buyer"} • ${formatShortTime(viewing.occursAt)}`,
        meta: viewing.status,
        priority: 3,
        keywords: [
          viewing.buyerLabel,
          viewing.listing?.area,
          viewing.seller?.contactName,
          viewing.status,
          viewing.notes
        ],
        route: "/crm/viewings",
        onSelect: () => {
          writeSessionValue("crm:focusViewing", viewing.id);
          navigate("/crm/viewings");
        }
      });
    });

    (searchData.sellers || []).forEach((seller) => {
      pushItem({
        id: `seller-${seller.email}`,
        type: "Seller",
        title: seller.contactName || deriveDisplayName(seller.email),
        badge: seller.status ? seller.status.charAt(0).toUpperCase() + seller.status.slice(1) : "Seller",
        description: seller.address || seller.postcode || "Address pending",
        meta: seller.planKey ? `${seller.planKey === "premier" ? "Premier" : "Core"} plan` : "",
        priority: seller.status === "prospect" ? 2.5 : 3.5,
        keywords: [
          seller.email,
          seller.postcode,
          seller.planKey,
          seller.status,
          seller.address
        ],
        route: "/crm/dashboard",
        onSelect: () => {
          writeSessionValue("crm:focusSeller", seller.email);
          navigate("/crm/dashboard");
        }
      });
    });

    LISTINGS.forEach((listing) => {
      pushItem({
        id: `listing-${listing.id}`,
        type: "Listing",
        title: listing.title,
        badge: listing.area || listing.postcode || "Listing",
        description: listing.address || listing.postcode || "",
        meta: formatCurrency(listing.price),
        priority: 4,
        keywords: [
          listing.id,
          listing.postcode,
          listing.address,
          listing.type,
          ...(listing.features || [])
        ],
        route: "/crm/listings",
        onSelect: () => {
          writeSessionValue("crm:targetListing", listing.id);
          navigate("/crm/listings");
        }
      });
    });

    const query = searchQuery.trim().toLowerCase();
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];
    const sortedItems = items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.title.localeCompare(b.title);
    });
    const filtered = tokens.length
      ? sortedItems.filter((item) => tokens.every((token) => item.haystack.includes(token)))
      : sortedItems;
    return filtered.slice(0, 20);
  }, [navigate, searchData, searchQuery]);

  useEffect(() => {
    setSearchActiveIndex((idx) => {
      if (!searchResults.length) return 0;
      return Math.min(idx, searchResults.length - 1);
    });
  }, [searchResults.length]);

  const handleResultSelect = (item) => {
    if (!item) return;
    setSearchOpen(false);
    if (typeof item.onSelect === "function") {
      item.onSelect();
      return;
    }
    if (item.route) {
      navigate(item.route);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchActiveIndex((idx) => Math.min(idx + 1, Math.max(searchResults.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchActiveIndex((idx) => Math.max(idx - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleResultSelect(searchResults[searchActiveIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-white/5 bg-slate-900/60 backdrop-blur">
        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-sm uppercase tracking-[0.32em] text-slate-500">Home • The Break Co.</div>
          <div className="mt-2 text-xl font-semibold text-white">CRM Console</div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                ].join(" ")
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/5 text-xs text-slate-500">
          Logged in as{" "}
          <span className="text-slate-300">{session?.email || "agent@home.local"}</span>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-white">{title}</span>
            <span className="text-xs text-slate-500 uppercase tracking-[0.32em]">Beta</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
              onClick={() => setSearchOpen(true)}
            >
              Global search (⌘K)
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-6">
          <Outlet />
        </main>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="mx-auto mt-24 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-[0.35em] text-white/40">Global search</span>
                <span className="uppercase tracking-[0.35em] text-white/30">Esc to close</span>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/60 px-4 py-3">
                <span className="text-sm text-white/30">🔎</span>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search listings, sellers, offers, viewings..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="text-xs text-white/50 hover:text-white/80"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-white/10">
              {searchResults.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-400">
                  No matches for <span className="text-white/70">&ldquo;{searchQuery}&rdquo;</span>. Try different keywords.
                </div>
              ) : (
                searchResults.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleResultSelect(item)}
                    onMouseEnter={() => setSearchActiveIndex(index)}
                    className={
                      "flex w-full items-start gap-3 px-6 py-4 text-left transition " +
                      (index === searchActiveIndex ? "bg-white/10" : "hover:bg-white/5")
                    }
                  >
                    <div className="flex flex-shrink-0 flex-col items-start gap-2">
                      <span
                        className={
                          "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.35em] " +
                          (SEARCH_TYPE_STYLES[item.type] || "border-slate-400/40 bg-slate-500/10 text-slate-200")
                        }
                      >
                        {item.type}
                      </span>
                      {item.meta && (
                        <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                          {item.meta}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.title}</p>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                      )}
                      {item.badge && (
                        <p className="mt-2 text-xs text-white/60">
                          {item.badge}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CrmPlaceholder({ title, description }) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-slate-400">{description}</p>
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-slate-300">
        <p>
          This area will soon host the full workflow for {title.toLowerCase()}. Listings is the first fully implemented flow; the others are stubs.
        </p>
      </div>
    </div>
  );
}

export function CrmDashboardPage() {
  const navigate = useNavigate();
  const data = useCrmData();
  const {
    metrics,
    pipeline,
    viewings,
    offers,
    boardRequests,
    docChecks,
    activity,
    activeListings,
    contacts
  } = data;

  const headerSummary = [
    `${activeListings.length} live ${activeListings.length === 1 ? "listing" : "listings"}`,
    `${contacts.length} client${contacts.length === 1 ? "" : "s"} in CRM`,
    `${viewings.length} viewing${viewings.length === 1 ? "" : "s"} scheduled`,
    `${offers.length} offer${offers.length === 1 ? "" : "s"} tracked`
  ].join(" • ");

  const toneDot = (tone) => {
    switch (tone) {
      case "success":
        return "bg-emerald-400";
      case "warning":
        return "bg-amber-400";
      case "info":
        return "bg-sky-400";
      default:
        return "bg-slate-500";
    }
  };

  const toneText = (tone) => {
    switch (tone) {
      case "success":
        return "text-emerald-300";
      case "warning":
        return "text-amber-300";
      case "info":
        return "text-sky-300";
      default:
        return "text-slate-300";
    }
  };

  const pipelineBar = (status) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-400";
      case "focus":
        return "bg-amber-400";
      default:
        return "bg-slate-600";
    }
  };

  const handleMetricClick = (key) => {
    switch (key) {
      case "listings":
        writeSessionValue("crm:listingsFilter", "active");
        navigate("/crm/listings");
        break;
      case "clients":
        navigate("/crm/contacts");
        break;
      case "viewings":
        writeSessionValue("crm:viewingsFocus", "calendar");
        navigate("/crm/viewings");
        break;
      case "offers":
        writeSessionValue("crm:offersFilter", "active");
        navigate("/crm/offers");
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Agent dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor pipeline health, today&rsquo;s deadlines, and compliance tasks at a glance.
          </p>
          <p className="text-xs text-slate-500 mt-3">{headerSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
            Create listing
          </button>
          <button className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 transition">
            Log progress update
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            type="button"
            key={metric.key}
            onClick={() => handleMetricClick(metric.key)}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-lg shadow-black/5 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/50">{metric.label}</p>
            <div className="mt-3 text-3xl font-semibold text-white">{metric.value}</div>
            {metric.meta && <p className="mt-3 text-xs text-slate-400">{metric.meta}</p>}
          </button>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Pipeline health</h2>
            <p className="text-sm text-slate-400">Valuations, onboarding, and live instructions.</p>
          </div>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
            View listings board
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {pipeline.map((stage) => (
            <div
              key={stage.key}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{stage.title}</p>
                  <p className="text-xs text-slate-400">{stage.description}</p>
                </div>
                <span className="text-2xl font-semibold text-white">{stage.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`${pipelineBar(stage.status)} h-2 rounded-full transition-all`}
                  style={{ width: `${stage.progress}%` }}
                />
              </div>
              <ul className="space-y-3">
                {stage.highlights.length === 0 && (
                  <li className="text-xs text-slate-500">No records in this stage right now.</li>
                )}
                {stage.highlights.map((item, index) => (
                  <li
                    key={`${stage.key}-${index}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{item.label}</span>
                      <span className={`text-[10px] uppercase tracking-[0.35em] ${toneText(item.tone)}`}>
                        {item.tone === "warning" ? "Action" : item.tone === "success" ? "On track" : "Note"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Upcoming schedule</h2>
            <p className="text-sm text-slate-400">Viewings and onsite commitments over the next 7 days.</p>
          </div>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
            Open calendar
          </button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 divide-y divide-white/5">
          {viewings.length === 0 && (
            <div className="px-4 py-5 text-sm text-slate-400">No scheduled viewings. Check inbound enquiries.</div>
          )}
          {viewings.slice(0, 6).map((viewing) => (
            <div key={viewing.id} className="flex flex-wrap items-center gap-4 px-4 py-4 text-sm text-slate-200">
              <div className="w-32 min-w-[7rem]">
                <p className="font-semibold text-white">{formatShortDate(viewing.occursAt)}</p>
                <p className="text-xs text-slate-400">{formatShortTime(viewing.occursAt)}</p>
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium text-white">{viewing.listing?.title || "Listing TBD"}</p>
                <p className="text-xs text-slate-400">{viewing.buyerLabel}</p>
              </div>
              <div className="w-40 min-w-[9rem]">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${badgeClassForStatus(viewing.status)}`}>
                  {viewing.status}
                </span>
              </div>
              <div className="flex-1 min-w-[200px] text-xs text-slate-500">
                {viewing.notes || "No notes yet."}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Offers desk</h2>
            <p className="text-sm text-slate-400">Track negotiations, proof-of-funds, and next actions.</p>
          </div>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
            Update pipeline
          </button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 divide-y divide-white/5">
          {offers.length === 0 && (
            <div className="px-4 py-5 text-sm text-slate-400">No active offers recorded.</div>
          )}
          {offers.slice(0, 6).map((offer) => (
            <div key={offer.id} className="flex flex-wrap items-center gap-4 px-4 py-4 text-sm text-slate-200">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-white">{offer.listing?.title || "Listing"}</p>
                <p className="text-xs text-slate-400">{offer.buyerLabel}</p>
              </div>
              <div className="w-32 font-semibold text-white">{offer.amountDisplay}</div>
              <div className="w-40 min-w-[9rem]">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${badgeClassForStatus(offer.status)}`}>
                  {offer.status}
                </span>
              </div>
              <div className="flex-1 min-w-[200px] text-xs text-slate-500">{offer.notes}</div>
              <div className="w-28 text-[11px] uppercase tracking-[0.35em] text-white/40">
                {formatRelative(offer.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Board requests</h2>
              <p className="text-sm text-slate-400">Installations and preferences flowing in from seller portals.</p>
            </div>
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
              Manage logistics
            </button>
          </div>
          <div className="space-y-3">
            {boardRequests.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-5 text-sm text-slate-400">
                No outstanding board actions.
              </div>
            )}
            {boardRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      {request.seller?.contactName || deriveDisplayName(request.seller?.email)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {request.listing?.title || request.seller?.address || "Listing TBC"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-2 text-xs ${toneText(request.tone)}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${toneDot(request.tone)}`} />
                    {request.status}
                  </span>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-white/30">
                  {request.requestedAt ? formatRelative(request.requestedAt) : "New"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Compliance queue</h2>
              <p className="text-sm text-slate-400">Outstanding AML, ID, and EPC checks.</p>
            </div>
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
              Open compliance hub
            </button>
          </div>
          <div className="space-y-3">
            {docChecks.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-5 text-sm text-slate-400">
                All compliance items are up to date.
              </div>
            )}
            {docChecks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      {item.seller?.contactName || deriveDisplayName(item.seller?.email)}
                    </p>
                    <p className="text-xs text-slate-400">{item.seller?.address || "Address pending"}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 text-xs ${toneText(item.tone)}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${toneDot(item.tone)}`} />
                    {item.missing.length} outstanding
                  </span>
                </div>
                <ul className="mt-2 text-xs text-slate-400 list-disc list-inside">
                  {item.missing.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Activity feed</h2>
            <p className="text-sm text-slate-400">Latest moves across listings, buyers, and operations.</p>
          </div>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
            Export activity
          </button>
        </div>
        <div className="space-y-4">
          {activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 text-sm text-slate-200">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${toneDot(entry.tone)}`} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{entry.title}</p>
                </div>
                {entry.detail && <p className="mt-1 text-xs text-slate-400">{entry.detail}</p>}
                <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-white/30">
                  {formatShortDateTime(entry.timestamp)} • {formatRelative(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CrmContactsPage() {
  const { contacts } = useCrmData();
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");

  const typeOptions = ["All", "Seller", "Buyer", "Buyer & Seller", "Legal", "Agent", "Site member"];

  const countsByType = contacts.reduce((acc, contact) => {
    acc[contact.type] = (acc[contact.type] || 0) + 1;
    return acc;
  }, {});

  const filtered = contacts.filter((contact) => {
    const matchesType = typeFilter === "All" || contact.type === typeFilter;
    if (!matchesType) return false;
    if (!search.trim()) return true;
    const haystack = [contact.name, contact.email, contact.company, contact.notes, contact.type]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const grouped = filtered.reduce((acc, contact) => {
    acc[contact.type] = acc[contact.type] || [];
    acc[contact.type].push(contact);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-white">Clients & contacts</h1>
        <p className="text-sm text-slate-400">
          Central directory for sellers, buyers, legal partners, and site members.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {countsByType["Seller"] || 0} sellers
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {countsByType["Buyer"] || 0} buyers
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {countsByType["Legal"] || 0} legal
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {countsByType["Agent"] || 0} agents
            </span>
          </div>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">
            Import contacts
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
            <span className="text-sm text-white/40">🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, company..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTypeFilter(option)}
                className={
                  "rounded-xl border px-3 py-2 text-xs transition " +
                  (typeFilter === option
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20")
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      {typeOptions
        .filter((type) => type === "All" ? false : grouped[type]?.length)
        .map((type) => (
          <section key={type} className="rounded-3xl border border-white/10 bg-white/5">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{type}</h2>
                <p className="text-xs uppercase tracking-[0.32em] text-white/30">
                  {grouped[type].length} contact{grouped[type].length === 1 ? "" : "s"}
                </p>
              </div>
              <button className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 transition">
                Export segment
              </button>
            </header>
            <div className="divide-y divide-white/10">
              {grouped[type].map((contact) => (
                <div key={contact.email} className="grid gap-3 px-5 py-4 md:grid-cols-[2fr,2fr,1fr] text-sm text-slate-200">
                  <div>
                    <p className="text-white font-medium">{contact.name}</p>
                    <p className="text-xs text-slate-400">{contact.email}</p>
                    {contact.phone && <p className="text-xs text-slate-400">{contact.phone}</p>}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">Linked listings</p>
                    <p className="text-sm">
                      {contact.relatedListings.length
                        ? contact.relatedListings.join(" • ")
                        : "None yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">Notes</p>
                    <p className="text-xs text-slate-400">
                      {contact.notes || "No notes captured."}
                    </p>
                    {contact.lastInteraction && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/30">
                        Last activity {formatRelative(contact.lastInteraction)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-sm text-slate-400">
          No contacts match your filters. Adjust the type or search keywords.
        </div>
      )}
    </div>
  );
}

export function CrmListingsPage() {
  const { sellers, viewings, offers } = useCrmData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => readSessionValue("crm:listingsFilter", "all"));

  useEffect(() => {
    const stored = readSessionValue("crm:listingsFilter");
    if (stored) {
      setStatusFilter(stored);
      removeSessionValue("crm:listingsFilter");
    }
  }, []);

  const listingsData = useMemo(() => {
    return LISTINGS.map((listing) => {
      const sellerRecord =
        sellers.find((seller) => seller.activeListingId === listing.id) ||
        sellers.find((seller) =>
          Array.isArray(seller.properties) && seller.properties.some((property) => property.listingId === listing.id)
        );
      const status =
        sellerRecord?.status === "active"
          ? "active"
          : sellerRecord?.status === "checkout"
          ? "onboarding"
          : "prospect";
      const listingViewings = viewings.filter((viewing) => viewing.listingId === listing.id);
      const listingOffers = offers.filter((offer) => offer.listingId === listing.id);
      const interestedBuyers = Array.from(
        new Set(listingViewings.map((viewing) => viewing.buyerLabel).concat(listingOffers.map((offer) => offer.buyerLabel)))
      ).filter(Boolean);

      return {
        id: listing.id,
        hero: listing.hero || listing.photos?.[0] || "",
        title: listing.title,
        address: listing.address,
        area: listing.area,
        postcode: listing.postcode,
        price: listing.price,
        status,
        seller: sellerRecord?.contactName || deriveDisplayName(sellerRecord?.email),
        sellerEmail: sellerRecord?.email,
        offers: listingOffers,
        viewings: listingViewings,
        interestedBuyers,
        plan: sellerRecord?.planKey,
        portalStatus: sellerRecord?.status === "active" ? "Live on portals" : "Draft"
      };
    });
  }, [offers, sellers, viewings]);

  const statusOptions = [
    { label: "All listings", value: "all" },
    { label: "Active", value: "active" },
    { label: "Onboarding", value: "onboarding" },
    { label: "Prospect", value: "prospect" }
  ];

  const filteredListings = listingsData.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const haystack = [item.title, item.address, item.postcode, item.area, item.seller]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-white">Listings</h1>
        <p className="text-sm text-slate-400">
          Visual overview of every instruction with quick access to seller and buyer activity.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
            <span className="text-sm text-white/40">🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search address, postcode, seller..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              alert("Listing creation will connect to the API form — wire this button once backend is ready.")
            }
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            New listing
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {filteredListings.map((listing) => (
          <div
            key={listing.id}
            className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <div className="h-48 w-full overflow-hidden bg-black/20">
              {listing.hero ? (
                <img src={listing.hero} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/40">
                  No media yet
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{listing.title}</h2>
                  <p className="text-xs text-slate-400">
                    {listing.address || listing.area} • {listing.postcode}
                  </p>
                </div>
                <span
                  className={
                    "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.3em] " +
                    (listing.status === "active"
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                      : listing.status === "onboarding"
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                      : "border-slate-400/40 bg-slate-500/10 text-slate-200")
                  }
                >
                  {listing.status}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Price guide</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(listing.price)}</p>
              </div>
              <div className="grid gap-2 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/45">Seller</span>
                  <span>{listing.seller || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/45">Activity</span>
                  <span>
                    {listing.viewings.length} viewing{listing.viewings.length === 1 ? "" : "s"} •{" "}
                    {listing.offers.length} offer{listing.offers.length === 1 ? "" : "s"} • {listing.interestedBuyers.length} buyer lead{listing.interestedBuyers.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/45">Portals</span>
                  <span>{listing.portalStatus}</span>
                </div>
              </div>
              {listing.interestedBuyers.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Interested buyers</p>
                  <p className="text-sm text-slate-300">
                    {listing.interestedBuyers.slice(0, 3).join(" • ")}
                    {listing.interestedBuyers.length > 3 && (
                      <span className="text-white/40">
                        {" "}
                        +{listing.interestedBuyers.length - 3} more
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div className="mt-auto flex items-center justify-between text-sm">
                <button
                  onClick={() => navigate("/crm/offers")}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 transition"
                >
                  View offers
                </button>
                <button
                  onClick={() => window.open(listing.hero || listing.photos?.[0] || "#", "_blank")}
                  className="text-xs text-white/60 hover:text-white/90"
                >
                  Open assets →
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {filteredListings.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-sm text-slate-400">
          No listings match your filters.
        </div>
      )}
    </div>
  );
}

export function CrmViewingsPage() {
  const { viewings } = useCrmData();
  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);

  useEffect(() => {
    const storedFocus = readSessionValue("crm:focusViewing");
    if (storedFocus) {
      setSelectedId(storedFocus);
      setFocusId(storedFocus);
      removeSessionValue("crm:focusViewing");
    } else if (viewings.length) {
      setSelectedId(viewings[0].id);
    }
    if (readSessionValue("crm:viewingsFocus")) {
      removeSessionValue("crm:viewingsFocus");
    }
  }, []);

  useEffect(() => {
    if (!viewings.length) {
      setSelectedId(null);
      return;
    }
    if (selectedId && viewings.some((viewing) => viewing.id === selectedId)) return;
    setSelectedId(viewings[0].id);
  }, [viewings, selectedId]);

  useEffect(() => {
    if (!focusId) return undefined;
    const timer = setTimeout(() => setFocusId(null), 4000);
    return () => clearTimeout(timer);
  }, [focusId]);

  const selectedViewing = viewings.find((viewing) => viewing.id === selectedId) || null;

  const calendarDays = useMemo(() => {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        date,
        label: date.toLocaleDateString("en-GB", { weekday: "short" }),
        display: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      };
    });
  }, []);

  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const slots = calendarDays.map((day) => {
    const dayKey = day.date.toDateString();
    const dailyViewings = viewings.filter(
      (viewing) => viewing.occursAt && viewing.occursAt.toDateString() === dayKey
    );
    return hours.map((hour) =>
      dailyViewings.filter((viewing) => viewing.occursAt && viewing.occursAt.getHours() === hour)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Viewings calendar</h1>
          <p className="text-sm text-slate-400">
            Weekly overview with quick links to confirm, reschedule, or capture feedback.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              alert("Google Calendar sync coming soon — OAuth hook will be wired to Google Workspace.")
            }
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            Connect Google Calendar
          </button>
          <button
            onClick={() => alert("ICS export placeholder — integrate with backend to download schedule.")}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            Export (.ics)
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-2 text-sm">
            <thead>
              <tr>
                <th className="w-24 px-2 py-3 text-left text-xs uppercase tracking-[0.3em] text-white/40">Time</th>
                {calendarDays.map((day) => (
                  <th
                    key={day.date.toISOString()}
                    className="min-w-[150px] px-2 py-3 text-left text-xs uppercase tracking-[0.3em] text-white/40"
                  >
                    <div className="text-white text-base font-semibold">{day.label}</div>
                    <div className="text-xs text-slate-400">{day.display}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour, rowIndex) => (
                <tr key={hour}>
                  <td className="px-2 py-3 text-xs text-slate-500">{`${hour}:00`}</td>
                  {calendarDays.map((day, colIndex) => {
                    const cellViewings = slots[colIndex][rowIndex];
                    return (
                      <td key={day.date.toISOString() + hour} className="align-top">
                        {cellViewings.map((viewing) => {
                          const isFocused = viewing.id === focusId;
                          return (
                            <button
                              key={viewing.id}
                              type="button"
                              onClick={() => setSelectedId(viewing.id)}
                              className={
                                "mb-2 w-full rounded-2xl border px-3 py-2 text-left transition " +
                                (viewing.id === selectedId
                                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                                  : "border-white/10 bg-white/5 text-white hover:border-white/20")
                              }
                            >
                              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                {formatShortTime(viewing.occursAt)}
                              </p>
                              <p className="text-sm font-medium text-white">
                                {viewing.listing?.title || "Listing"}
                              </p>
                              <p className="text-xs text-slate-300">{viewing.buyerLabel || "Buyer"}</p>
                              {isFocused && (
                                <span className="mt-2 inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.35em] text-emerald-200">
                                  From search
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {!selectedViewing ? (
          <div className="text-sm text-slate-400">Select a viewing to see the full brief.</div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Viewing brief</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {selectedViewing.listing?.title || "Viewing"}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {formatShortDateTime(selectedViewing.occursAt)} • {selectedViewing.listing?.area || "Area TBC"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Buyer</p>
                <p className="text-white font-medium">{selectedViewing.buyerLabel || "Buyer"}</p>
                <p className="text-xs text-slate-400">{selectedViewing.buyerEmail || "Email pending"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Seller</p>
                <p className="text-white font-medium">
                  {selectedViewing.seller?.contactName || deriveDisplayName(selectedViewing.seller?.email)}
                </p>
                <p className="text-xs text-slate-400">{selectedViewing.seller?.email || "Email pending"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs " +
                    badgeClassForStatus(selectedViewing.status)
                  }
                >
                  {selectedViewing.status}
                </span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                  {selectedViewing.agent || "Agent TBC"}
                </span>
              </div>
              <p className="text-sm text-slate-200">
                {selectedViewing.notes || "No internal notes captured yet."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Address</p>
                <p>{selectedViewing.listing?.address || selectedViewing.seller?.address || "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Next action</p>
                <p>
                  {selectedViewing.status?.toLowerCase().includes("await")
                    ? "Confirm availability with seller."
                    : "Collect feedback and share summary with seller."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function CrmOffersPage() {
  const data = useCrmData();
  const offers = data.offers || [];
  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [stageFilter, setStageFilter] = useState(() => readSessionValue("crm:offersFilter", "active"));
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const stored = readSessionValue("crm:focusOffer");
    if (stored) {
      setSelectedId(stored);
      setFocusId(stored);
      removeSessionValue("crm:focusOffer");
    }
    const storedStage = readSessionValue("crm:offersFilter");
    if (storedStage) {
      setStageFilter(storedStage);
      removeSessionValue("crm:offersFilter");
    }
  }, []);

  useEffect(() => {
    if (!focusId) return undefined;
    const timer = setTimeout(() => setFocusId(null), 4000);
    return () => clearTimeout(timer);
  }, [focusId]);

  const stageOptions = [
    { label: "Active pipeline", value: "active" },
    { label: "Awaiting proof", value: "await" },
    { label: "Counter", value: "counter" },
    { label: "Accepted", value: "accept" },
    { label: "Completed", value: "complete" },
    { label: "Withdrawn", value: "withdraw" },
    { label: "All stages", value: "all" }
  ];

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const status = (offer.status || "").toLowerCase();
      const isArchived =
        status.includes("complete") || status.includes("withdraw") || status.includes("declin");
      if (!showArchived && isArchived) return stageFilter === "complete" || stageFilter === "withdraw" ? status.includes(stageFilter) : false;
      if (stageFilter === "active") {
        return !isArchived;
      }
      if (stageFilter === "all") return showArchived || !isArchived ? true : false;
      return status.includes(stageFilter);
    });
  }, [offers, showArchived, stageFilter]);

  useEffect(() => {
    if (!filteredOffers.length) {
      setSelectedId(null);
      return;
    }
    if (selectedId && filteredOffers.some((offer) => offer.id === selectedId)) return;
    setSelectedId(filteredOffers[0].id);
  }, [filteredOffers, selectedId]);

  const selectedOffer = offers.find((offer) => offer.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-white">Offers</h1>
        <p className="text-sm text-slate-400">
          Track negotiations, proof-of-funds, and seller updates in real time.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[2fr,3fr] xl:grid-cols-[5fr,6fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-sm text-slate-300">
            <span>
              {filteredOffers.length} offer{filteredOffers.length === 1 ? "" : "s"} in view
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {stageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStageFilter(option.value)}
                  className={
                    "rounded-full border px-3 py-1 transition " +
                    (stageFilter === option.value
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20")
                  }
                >
                  {option.label}
                </button>
              ))}
              <label className="ml-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border-white/20 bg-transparent"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                />
                Archived
              </label>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {filteredOffers.length === 0 ? (
              <div className="px-5 py-12 text-sm text-slate-400">
                No offers match your filters. Adjust the stage or archived toggle.
              </div>
            ) : (
              filteredOffers.map((offer) => {
                const isSelected = offer.id === selectedId;
                const isFocused = offer.id === focusId;
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setSelectedId(offer.id)}
                    className={
                      "w-full px-5 py-4 text-left transition " +
                      (isSelected ? "bg-white/10" : "hover:bg-white/5")
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {offer.listing?.title || "Listing"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {offer.buyerLabel || "Buyer"} • {offer.amountDisplay}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div className="font-semibold text-white">{formatRelative(offer.updatedAt)}</div>
                        <div>{offer.updatedAt ? formatShortDate(offer.updatedAt) : "—"}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-3 py-1 " +
                          badgeClassForStatus(offer.status)
                        }
                      >
                        {offer.status}
                      </span>
                      {isFocused && (
                        <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.35em] text-sky-200">
                          Jumped from search
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          {!selectedOffer ? (
            <div className="text-sm text-slate-400">
              Select an offer to see the negotiation context and outstanding tasks.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Offer detail</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {selectedOffer.listing?.title || "Offer"}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedOffer.buyerLabel || "Buyer"} • {selectedOffer.amountDisplay}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Status</p>
                  <p className="text-white font-medium">{selectedOffer.status}</p>
                  <p className="text-xs text-slate-400">
                    Updated {selectedOffer.updatedAt ? formatShortDateTime(selectedOffer.updatedAt) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Seller</p>
                  <p className="text-white font-medium">
                    {selectedOffer.seller?.contactName || deriveDisplayName(selectedOffer.seller?.email)}
                  </p>
                  <p className="text-xs text-slate-400">{selectedOffer.seller?.email || "—"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Notes & actions</p>
                <p className="text-sm text-slate-200">
                  {selectedOffer.notes || "No notes yet. Log calls, proof-of-funds updates, or solicitor responses here."}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Proof: {selectedOffer.status.toLowerCase().includes("proof") ? "Awaiting" : "Received"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Terms: {selectedOffer.status.toLowerCase().includes("counter") ? "Counter issued" : "Standard"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200 space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Linked listing</p>
                <p>{selectedOffer.listing?.address || selectedOffer.listing?.area || "Address pending"}</p>
                <p className="text-xs text-slate-400">
                  Asking {selectedOffer.listing ? formatCurrency(selectedOffer.listing.price) : "—"}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function CrmSalesPage() {
  return (
    <CrmPlaceholder
      title="Sales Progression"
      description="Stage-based pipeline with SLA alerts, milestones, and conveyancer collaboration."
    />
  );
}

export function CrmLettersPage() {
  return (
    <CrmPlaceholder
      title="Letters & Emails"
      description="MJML templates, Gmail sending, PDF generation, and entity-linked history."
    />
  );
}

export function CrmSettingsPage() {
  return (
    <CrmPlaceholder
      title="Settings"
      description="Organisation profile, team management, template libraries, and API keys."
    />
  );
}
