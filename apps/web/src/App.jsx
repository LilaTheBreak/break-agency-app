import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import GoogleSignIn from "./auth/GoogleSignIn.jsx";
import { saveSearch, latestSearch, listingMatches } from "./lib/savedSearches";
import { LISTINGS } from "./data/listings";
import { normalisePostcode, verifyPostcode } from "./lib/postcodes";
import { isEmail, isNumber, notEmpty, isUKPostcode } from "./lib/validators";
import { saveSection, getSection } from "./lib/store";
import { Roles, getSession, clearSession, signInSession, SESSION_CHANGED_EVENT } from "./auth/session.js";
import { MOCK_ACCOUNTS } from "./auth/mockAccounts.js";
import ComingSoon from "./pages/ComingSoon.jsx";
import CrmLayout, {
  CrmDashboardPage,
  CrmContactsPage,
  CrmViewingsPage,
  CrmOffersPage,
  CrmSalesPage,
  CrmLettersPage,
  CrmSettingsPage,
  CrmListingsPage
} from "./crm/CrmLayout.jsx";

/* ----------------------- auth helpers ----------------------- */
function useCurrentSession() {
  const [session, setSession] = useState(() => getSession());
  useEffect(() => {
    const update = () => setSession(getSession());
    window.addEventListener(SESSION_CHANGED_EVENT, update);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, update);
  }, []);
  return session;
}

/* ----------------------- CRM Portals ----------------------- */
function PortalShell({ session, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-16 space-y-8">
        <div className="flex flex-col items-center text-center gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <h1 className="text-3xl font-semibold text-white">
            Welcome back, {session?.name || session?.email || "member"}
          </h1>
          {subtitle && <p className="text-sm text-slate-300 max-w-2xl">{subtitle}</p>}
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
            {deriveSessionLabel(session)}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function BuyerOverviewCards({ search, upcoming }) {
  const budget = search?.budgetMax ? formatAmount(Number(search.budgetMax)) : "Set a budget";
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active search</p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {search?.area || "Add target area"}
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          Budget up to <span className="font-medium text-white">{budget}</span>
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Bedrooms: {search?.bedsMin ?? "n/a"} – {search?.bedsMax ?? "∞"} • Type: {search?.type || "Any"}
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-emerald-500/10 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Next viewing</p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {upcoming[0]?.listing?.title || "No viewing booked"}
        </h3>
        <p className="mt-1 text-sm text-emerald-100">
          {upcoming[0]
            ? `${upcoming[0].date} • ${upcoming[0].listing?.area || ""}`
            : "Book or request a viewing to see it here"}
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Mortgage in principle</h3>
        <p className="mt-1 text-sm text-slate-300">Upload documentation to accelerate offer approval.</p>
      </div>
    </div>
  );
}

function BuyerCardsGrid({ title, listings, emptyCopy }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {emptyCopy && listings.length === 0 && (
            <p className="text-sm text-slate-400">{emptyCopy}</p>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.slice(0, 6).map((listing) => (
          <div key={listing.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="h-36">
              <img
                src={listing.hero || listing.photos?.[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-base font-medium text-white line-clamp-2 min-h-[44px]">{listing.title}</h3>
              <p className="text-sm text-slate-300">{listing.area} • {listing.postcode}</p>
              <div className="text-lg font-semibold text-white">{formatAmount(listing.price)}</div>
              <p className="text-xs text-slate-500">
                {listing.beds} beds • {listing.baths ?? "—"} baths • {listing.type || "Property"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BuyerPortal({ session }) {
  const search = useMemo(() => latestSearch(), []);
  const recommendations = useMemo(() => {
    if (!search) return LISTINGS.slice(0, 6);
    const matches = LISTINGS.filter((listing) => listingMatches(search, listing));
    return matches.length ? matches.slice(0, 6) : LISTINGS.slice(0, 6);
  }, [search]);

  const favourites = useMemo(() => {
    const favs = loadJSON(KEYS.FAVS, {});
    return LISTINGS.filter((listing) => favs[listing.id]);
  }, []);

  const upcoming = useMemo(() => {
    return recommendations.slice(0, 2).map((listing, idx) => ({
      id: `upcoming-${idx}`,
      date: idx === 0 ? "Thu 14 Nov • 15:00" : "Sat 16 Nov • 11:30",
      listing,
      status: idx === 0 ? "Confirmed" : "Pending"
    }));
  }, [recommendations]);

  return (
    <PortalShell
      session={session}
      title="Buyer workspace"
      subtitle="Track viewings, shortlist homes, and monitor offer progress in one place."
    >
      <BuyerOverviewCards search={search} upcoming={upcoming} />
      <BuyerCardsGrid
        title="Recommended for you"
        listings={recommendations}
        emptyCopy="Add filters or favourite homes to personalise this feed."
      />
      <BuyerCardsGrid
        title="Saved homes"
        listings={favourites}
        emptyCopy="No favourites yet. Tap the heart on listings to save them."
      />
    </PortalShell>
  );
}

function SellerValuationPanel({ insights }) {
  const { subject, comparables, valuation, matched } = insights;
  const mapSrc =
    matched?.lat && matched?.lng
      ? `https://maps.google.com/maps?q=${matched.lat},${matched.lng}&z=16&output=embed`
      : subject?.postcode
      ? `https://maps.google.com/maps?q=${encodeURIComponent(`${subject.address || ""} ${subject.postcode}`)}&z=15&output=embed`
      : "https://maps.google.com/maps?q=London&z=11&output=embed";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] items-start">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Estimated range</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">
            {formatAmount(valuation?.lower)} – {formatAmount(valuation?.upper)}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Midpoint {formatAmount(valuation?.midpoint)} • confidence {valuation?.confidence ?? 82}%
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Address</p>
            <p className="mt-2 text-white">{subject?.address || matched?.address || "Awaiting details"}</p>
            <p className="text-xs text-slate-500 mt-1">{subject?.postcode || matched?.postcode || "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Property</p>
            <p className="mt-2 text-white">{matched?.type || "TBC"}</p>
            <p className="text-xs text-slate-500 mt-1">
              {subject?.beds ?? matched?.beds ?? "—"} beds • {subject?.baths ?? matched?.baths ?? "—"} baths
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Last refreshed</p>
            <p className="mt-2 text-white">
              {subject?._updatedAt
                ? new Date(subject._updatedAt).toLocaleString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "numeric",
                    month: "short"
                  })
                : "Moments ago"}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <iframe
          title="Property map"
          src={mapSrc}
          className="w-full h-64 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="p-5 space-y-2 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Snapshot</p>
          <p>
            Tenure: {matched?.tenure || "TBC"} • Internal area:{" "}
            {matched?.internal_sqft
              ? `${matched.internal_sqft.toLocaleString()} sq ft`
              : matched?.internal_m2
              ? `${matched.internal_m2} m²`
              : "Awaiting data"}
          </p>
          {matched?.epc_link ? (
            <a href={matched.epc_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100">
              View EPC certificate →
            </a>
          ) : (
            <p className="text-xs text-slate-500">Upload EPC to complete the record.</p>
          )}
        </div>
      </div>
      <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Comparable sales</h3>
            <p className="text-sm text-slate-300">
              {comparables.length} results used to inform the valuation. Toggle any to exclude.
            </p>
          </div>
          <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
            Manage data
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {comparables.slice(0, 6).map((comp) => (
            <div key={comp.id} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
              <div className="h-32">
                <img
                  src={comp.hero || comp.photos?.[0]}
                  alt={comp.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1 text-sm text-slate-200">
                <div className="font-medium text-white line-clamp-2">{comp.title}</div>
                <div className="text-slate-400">{comp.area} • {comp.postcode}</div>
                <div className="font-semibold text-white">{formatAmount(comp.price)}</div>
                <div className="text-xs text-slate-500">
                  {comp.beds} beds • {comp.baths ?? "—"} baths
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SellerPortal({ session }) {
  const navigate = useNavigate();
  const [sellerProfile, setSellerProfile] = useState(() => getSellerProfile());
  const [userProfile, setUserProfile] = useState(() => getUserProfile());
  const [photographyForm, setPhotographyForm] = useState({ date: "", time: "" });
  const [viewingSlotForm, setViewingSlotForm] = useState({ date: "", time: "" });
  const [solicitorEmail, setSolicitorEmail] = useState("");
  const [stageNotes, setStageNotes] = useState(() => ({ ...(sellerProfile?.salesNotes || {}) }));
  const [openStage, setOpenStage] = useState(0);

  useEffect(() => {
    setSellerProfile(getSellerProfile());
    setUserProfile(getUserProfile());
  }, [session]);

  useEffect(() => {
    setStageNotes({ ...(sellerProfile?.salesNotes || {}) });
  }, [sellerProfile]);

  const insights = useMemo(() => computeSellerInsights(sellerProfile), [sellerProfile]);
  const status = sellerProfile?.status || SellerStatus.PROSPECT;
  const sellerPlanLabel =
    sellerProfile?.planKey === "premier"
      ? "Premier marketing package"
      : sellerProfile?.planKey === "core"
      ? "Core marketing package"
      : null;

  const baseListing =
    sellerProfile?.activeListingId
      ? LISTINGS.find((listing) => listing.id === sellerProfile.activeListingId)
      : insights.matched;

  const fallbackProperties = baseListing
    ? [
        {
          id: baseListing.id || "primary",
          label: baseListing.title || sellerProfile?.address || "Primary listing",
          address: baseListing.address || sellerProfile?.address || "Address pending",
          status: status === SellerStatus.ACTIVE ? "Live" : "Draft",
          portals: status === SellerStatus.ACTIVE ? ["HOME AI", "Rightmove", "Zoopla"] : ["Not yet syndicated"],
          issues: sellerProfile?.uploadIssues || [],
          listing: baseListing,
          isLive: status === SellerStatus.ACTIVE
        }
      ]
    : [];

  const propertyOptions = (sellerProfile?.properties && sellerProfile.properties.length
    ? sellerProfile.properties
    : fallbackProperties
  ).map((property, index) => {
    const listing =
      property.listing ||
      (property.listingId ? LISTINGS.find((item) => item.id === property.listingId) : null) ||
      baseListing;
    const address =
      property.address ||
      listing?.address ||
      sellerProfile?.address ||
      "Address pending";
    return {
      id: property.id || `property-${index}`,
      label: property.label || listing?.title || `Property ${index + 1}`,
      address,
      status: property.status || (property.isLive ? "Live" : "Draft"),
      portals: property.portals || (property.isLive ? ["HOME AI"] : []),
      issues: property.issues || [],
      listing,
      isLive:
        property.isLive ??
        (!!property.status && property.status.toLowerCase().includes("live")),
      icon:
        property.icon ||
        (address ? address.trim().charAt(0).toUpperCase() : `${index + 1}`)
    };
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyOptions[0]?.id);

  useEffect(() => {
    if (!propertyOptions.find((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(propertyOptions[0]?.id);
    }
  }, [propertyOptions, selectedPropertyId]);

  const selectedProperty =
    propertyOptions.find((property) => property.id === selectedPropertyId) ||
    propertyOptions[0] ||
    null;

  const activeListing = selectedProperty?.listing || baseListing;

  const adjustments = insights.valuation?.adjustments || {};
  const adjustmentFeaturesSummary = adjustments.features?.length
    ? adjustments.features.map((key) => FEATURE_LABELS[key] || key).join(", ")
    : "None declared";
  const adjustmentConditionLabel =
    CONDITION_LABELS[adjustments.condition || "average"] || CONDITION_LABELS.average;
  const adjustmentFloorArea = adjustments.floorArea;
  const adjustmentRenovationYear = adjustments.renovationYear;

  const photographySlots = sellerProfile?.photographySlots || [];
  const viewingSlots = sellerProfile?.viewingSlots || [];
  const boardPreference =
    sellerProfile?.boardPreference || userProfile.boardPreference || "undecided";
  const boardUpdatedAt = sellerProfile?.boardRequestUpdatedAt;
  const solicitorInvite = sellerProfile?.solicitorInvite;
  const chain =
    sellerProfile?.chain || [
      {
        role: "Your buyer",
        status: "Mortgage offer issued",
        notes: "Bank of London valuation booked for 18 Nov."
      },
      {
        role: "Seller onward purchase",
        status: "Offer accepted subject to survey",
        notes: "Survey scheduled 22 Nov."
      }
    ];

  const viewings = [
    {
      id: "vw-1",
      date: "2025-11-14",
      time: "15:00",
      viewerEmail: "luca@buyers.com",
      status: "Confirmed",
      feedback: "Loved the terrace.",
      offerId: "of-101"
    },
    {
      id: "vw-2",
      date: "2025-11-16",
      time: "11:30",
      viewerEmail: "priya.dan@buyers.com",
      status: "Awaiting feedback",
      feedback: null,
      offerId: null
    },
    {
      id: "vw-3",
      date: "2025-11-18",
      time: "13:00",
      viewerEmail: "corporate@relocators.com",
      status: "Proposed",
      feedback: null,
      offerId: null
    }
  ];

  const offers = [
    {
      id: "of-101",
      buyerEmail: "luca@buyers.com",
      amount: 1825000,
      stage: "Heads of terms",
      status: "Negotiating",
      updated: "2025-11-12T14:20:00Z",
      outstanding: ["Awaiting proof of funds"],
      actions: ["Prepare draft heads", "Confirm solicitor details"]
    },
    {
      id: "of-099",
      buyerEmail: "priya.dan@buyers.com",
      amount: 1790000,
      stage: "Declined",
      status: "Rejected",
      updated: "2025-11-10T09:15:00Z",
      outstanding: ["Send polite decline follow-up"],
      actions: ["Provide feedback to buyers"]
    }
  ];

  const buyerProofs = [
    {
      buyerEmail: "luca@buyers.com",
      status: "Verified",
      documents: ["Proof of funds (11 Nov)", "Mortgage in principle"],
      score: "A",
      lastUpdated: "2025-11-12T10:10:00Z"
    },
    {
      buyerEmail: "priya.dan@buyers.com",
      status: "In review",
      documents: ["Mortgage in principle uploaded"],
      score: "B",
      lastUpdated: "2025-11-11T15:00:00Z"
    },
    {
      buyerEmail: "corporate@relocators.com",
      status: "Pending",
      documents: ["Awaiting proof of funds"],
      score: "B-",
      lastUpdated: "2025-11-10T09:00:00Z"
    }
  ];

  const notifications = [
    { id: "nt-1", title: "New enquiry from HOME AI buyer", time: "2 hours ago" },
    { id: "nt-2", title: "Viewing feedback pending from Priya & Dan", time: "6 hours ago" },
    { id: "nt-3", title: "Drone shoot scheduled for 19 Nov 10:00", time: "Yesterday" }
  ];

  const aiThread = [
    { sender: "AI", message: "Reminder: upload proof of ownership to release marketing spend.", time: "09:10" },
    { sender: "You", message: "Docs uploaded this morning – please confirm received.", time: "09:12" },
    { sender: "AI", message: "Confirmed. Analyst reviewing now – expect update within 1 hour.", time: "09:13" }
  ];

  const pipeline = [
    {
      key: "instruction",
      title: "Instruction",
      complete: true,
      description: "Agreement signed & onboarding complete.",
      tasks: [
        { label: "Agency agreement signed", done: true },
        { label: "AML checks approved", done: true }
      ],
      outstanding: []
    },
    {
      key: "marketing",
      title: "Marketing live",
      complete: true,
      description: "Listing syndicated to portals 4 days ago.",
      tasks: [
        { label: "Photography assets uploaded", done: Boolean(activeListing?.photos?.length) },
        { label: "Portal descriptions complete", done: true }
      ],
      outstanding: activeListing?.photos?.length ? [] : ["Confirm photography slot"]
    },
    {
      key: "viewings",
      title: "Viewings",
      complete: false,
      description: "3 viewings booked this week.",
      tasks: [
        { label: "Send viewing confirmations", done: true },
        { label: "Collect feedback same-day", done: false }
      ],
      outstanding: ["Feedback from Priya & Dan"]
    },
    {
      key: "offers",
      title: "Offer accepted",
      complete: false,
      description: "Awaiting best & final by 18 Nov.",
      tasks: [
        { label: "Prepare heads of terms template", done: false },
        { label: "Confirm buyer financing status", done: false }
      ],
      outstanding: ["Proof of funds from lead buyer"]
    },
    {
      key: "exchange",
      title: "Exchange",
      complete: false,
      description: "Conveyancers not yet instructed.",
      tasks: [
        { label: "Solicitor invitation sent", done: Boolean(solicitorInvite) },
        { label: "Draft contracts issued", done: false }
      ],
      outstanding: ["Invite solicitor", "Supply management pack"]
    }
  ];

  const firstIncomplete = pipeline.findIndex((stage) => !stage.complete);
  useEffect(() => {
    setOpenStage(firstIncomplete === -1 ? 0 : firstIncomplete);
  }, [sellerProfile, firstIncomplete]);

  const calendarDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const combinedViewingSlots = [
    ...viewingSlots,
    ...(userProfile.viewingAvailability || [])
  ];

  const slotsByDate = combinedViewingSlots.reduce((acc, slot) => {
    if (!slot.date) return acc;
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const handleAddPhotographySlot = () => {
    if (!photographyForm.date || !photographyForm.time) return;
    const slot = {
      id: crypto.randomUUID(),
      date: photographyForm.date,
      time: photographyForm.time
    };
    const updated = updateSellerProfile({
      photographySlots: [...photographySlots, slot]
    });
    setSellerProfile(updated);
    setPhotographyForm({ date: "", time: "" });
  };

  const handleMarkPhotographyBooked = (slot) => {
    const updated = updateSellerProfile({
      photographyBookedAt: { ...slot, confirmedAt: Date.now() },
      photographySlots: photographySlots.filter((s) => s.id !== slot.id)
    });
    setSellerProfile(updated);
  };

  const handleBoardPreferenceChange = (value) => {
    const updated = updateSellerProfile({
      boardPreference: value,
      boardRequestUpdatedAt: Date.now()
    });
    setSellerProfile(updated);
    setUserProfile((prev) => ({ ...prev, boardPreference: value }));
  };

  const handleInviteSolicitor = () => {
    if (!solicitorEmail.trim()) return;
    const updated = updateSellerProfile({
      solicitorInvite: {
        email: solicitorEmail.trim(),
        sentAt: Date.now(),
        status: "Invitation sent"
      }
    });
    setSellerProfile(updated);
    setSolicitorEmail("");
  };

  const handleAddViewingSlot = () => {
    if (!viewingSlotForm.date || !viewingSlotForm.time) return;
    const slot = {
      id: crypto.randomUUID(),
      date: viewingSlotForm.date,
      time: viewingSlotForm.time
    };
    const updated = updateSellerProfile({
      viewingSlots: [...viewingSlots, slot]
    });
    setSellerProfile(updated);
    setViewingSlotForm({ date: "", time: "" });
  };

  const handleRemoveViewingSlot = (id) => {
    const updated = updateSellerProfile({
      viewingSlots: viewingSlots.filter((slot) => slot.id !== id)
    });
    setSellerProfile(updated);
  };

  const handleNotificationToggle = (field) => {
    const updated = updateUserProfile({ [field]: !userProfile[field] });
    setUserProfile(updated);
  };

  const handleChannelTogglePortal = (channel) => {
    const updated = updateUserProfile({
      notificationChannels: {
        ...(userProfile.notificationChannels || {}),
        [channel]: !userProfile.notificationChannels?.[channel]
      }
    });
    setUserProfile(updated);
  };

  const handleOpenHouseToggle = () => {
    const updated = updateUserProfile({
      openHouseOnly: !userProfile.openHouseOnly
    });
    setUserProfile(updated);
  };

  const handleStageNoteChange = (key, value) => {
    setStageNotes((prev) => ({ ...prev, [key]: value }));
  };

  const handleStageNoteSave = (key) => {
    const updated = updateSellerProfile({
      salesNotes: {
        ...(sellerProfile?.salesNotes || {}),
        [key]: stageNotes[key] || ""
      }
    });
    setSellerProfile(updated);
  };

  const listingMedia =
    activeListing && (activeListing.photos?.length || activeListing.video)
      ? [
          ...(activeListing.video ? [{ kind: "video", src: activeListing.video }] : []),
          ...(activeListing.photos || []).map((src) => ({ kind: "img", src }))
        ]
      : [];

  return (
    <PortalShell
      session={session}
      title="Seller workspace"
      subtitle="Monitor valuation updates, marketing activity, and offer momentum."
    >
      {status === SellerStatus.ACTIVE ? (
        <div className="space-y-6">
          {selectedProperty && (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2 text-left">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Selected property</p>
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedProperty.address}
                  </h2>
                  <p className="text-sm text-white/70">
                    Status:{" "}
                    <span className={selectedProperty.isLive ? "text-emerald-300" : "text-amber-200"}>
                      {selectedProperty.status || (selectedProperty.isLive ? "Live" : "Draft")}
                    </span>
                    {selectedProperty.portals?.length ? (
                      <> • Live on {selectedProperty.portals.join(", ")} </>
                    ) : (
                      <span className="text-white/40"> • Not yet syndicated</span>
                    )}
                  </p>
                  {selectedProperty.issues?.length ? (
                    <p className="text-xs text-amber-200">
                      Issues: {selectedProperty.issues.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-white/40">No upload issues reported.</p>
                  )}
                </div>
                {propertyOptions.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {propertyOptions.map((property) => (
                      <button
                        key={property.id}
                        onClick={() => setSelectedPropertyId(property.id)}
                        className={
                          "flex flex-col items-center justify-center rounded-2xl border px-4 py-3 text-xs transition w-24 " +
                          (property.id === selectedPropertyId
                            ? "border-emerald-400/60 bg-emerald-500/10 text-white"
                            : "border-white/10 bg-black/30 text-white/70 hover:border-white/30")
                        }
                      >
                        <span className="text-[11px] text-center leading-tight">
                          {property.label}
                        </span>
                        <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
                          {property.isLive ? "Live" : "Draft"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (selectedProperty?.listing?.id) {
                      navigate("/buyer/discover", { state: { focusListingId: selectedProperty.listing.id } });
                    } else {
                      navigate("/buyer/discover");
                    }
                  }}
                  className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition"
                >
                  View listing
                </button>
                <button
                  onClick={() => alert("Multi-property management coming soon. Your agent can add additional instructions in the meantime.")}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                >
                  Manage another sale
                </button>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Marketing assets</h2>
                <p className="text-sm text-white/70">
                  Keep photography, video, and signage on track. Updates sync with the agent dashboard.
                </p>
              </div>
              {sellerPlanLabel && (
                <span className="rounded-full border border-white/10 bg-black/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                  {sellerPlanLabel}
                </span>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr] items-start">
              <div className="space-y-4">
                {listingMedia.length ? (
                  <MediaCarousel
                    photos={activeListing?.photos || []}
                    video={activeListing?.video}
                    onOpenFloor={() => alert("Floorplan viewer coming soon.")}
                    onOpenMap={() => navigate("/seller/valuation")}
                    onOpenGallery={() =>
                      window.open(activeListing?.hero || activeListing?.photos?.[0] || "#", "_blank")
                    }
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center text-sm text-white/60">
                    Photography not uploaded yet. Propose photography slots below to help the media team schedule.
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">Photography scheduling</p>
                  {sellerProfile?.photographyBookedAt ? (
                    <p className="text-xs text-emerald-200">
                      Booked for {sellerProfile.photographyBookedAt.date} at {sellerProfile.photographyBookedAt.time}
                    </p>
                  ) : (
                    <p className="text-xs text-white/60">
                      Suggest multiple slots and the media team will confirm the best fit.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="date"
                      className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                      value={photographyForm.date}
                      onChange={(e) => setPhotographyForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                    <input
                      type="time"
                      className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                      value={photographyForm.time}
                      onChange={(e) => setPhotographyForm((prev) => ({ ...prev, time: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotographySlot}
                      className="rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                    >
                      Save slot
                    </button>
                  </div>
                  <ul className="space-y-2 text-xs text-white/70">
                    {photographySlots.length === 0 && (
                      <li className="text-white/40">No availability saved yet.</li>
                    )}
                    {photographySlots.map((slot) => (
                      <li
                        key={slot.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                      >
                        <span>
                          {slot.date} • {slot.time}
                        </span>
                        <button
                          onClick={() => handleMarkPhotographyBooked(slot)}
                          className="text-xs text-emerald-300 hover:text-emerald-200"
                        >
                          Confirm
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3 text-sm text-white/80">
                  <p className="font-semibold text-white">For sale board preference</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "yes", label: "Yes, install board" },
                      { value: "no", label: "No board" },
                      { value: "undecided", label: "Undecided" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleBoardPreferenceChange(option.value)}
                        className={
                          "rounded-xl border px-3 py-2 text-xs transition " +
                          (boardPreference === option.value
                            ? "border-emerald-400/60 bg-emerald-500/10 text-white"
                            : "border-white/15 bg-black/30 text-white/70 hover:border-white/30")
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/60">
                    Request automatically routes to your agent dashboard. Current preference: {boardPreference}.
                    {boardUpdatedAt && (
                      <> {" "}
                        <span className="text-white/40">
                          Updated {new Date(boardUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70 space-y-2">
                  <p className="font-semibold text-white/80">Valuation assumptions</p>
                  <ul className="space-y-1">
                    <li>Condition: {adjustmentConditionLabel}</li>
                    <li>Features: {adjustmentFeaturesSummary}</li>
                    {adjustmentFloorArea ? (
                      <li>
                        Floor area: {adjustmentFloorArea.value}
                        {adjustmentFloorArea.unit === "sqm" ? " m²" : " sq ft"}
                      </li>
                    ) : null}
                    {adjustmentRenovationYear ? (
                      <li>Renovated: {adjustmentRenovationYear}</li>
                    ) : null}
                    <li>Valuation multiplier: ×{(adjustments.multiplier || 1).toFixed(3)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Contracts & Legal</h2>
                <p className="text-sm text-white/70">
                  Keep agency agreements, terms, and compliance docs at your fingertips.
                </p>
              </div>
              <button
                onClick={() => {
                  if (sellerProfile?.contractUrl) {
                    window.open(sellerProfile.contractUrl, "_blank", "noopener");
                  } else {
                    alert("Contract viewer coming soon. Your signed agreement is stored securely with HOME AI.");
                  }
                }}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                View signed contract
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Agreement</p>
                <p className="text-white font-semibold">
                  {sellerProfile?.contractSignedAt
                    ? `Signed ${new Date(sellerProfile.contractSignedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}`
                    : "Awaiting signature"}
                </p>
                <p className="text-xs text-white/60">
                  Reference: {sellerProfile?.paymentReference || "Pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Terms & obligations</p>
                <ul className="text-xs text-white/70 space-y-1 list-disc pl-5">
                  <li>1% success fee due on exchange, payable via completion statement.</li>
                  <li>Upfront marketing package includes photography, floorplans, and portal syndication.</li>
                  <li>Seller to disclose material facts and provide AML documentation within 5 working days.</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2 text-xs text-white/70">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Compliance checklist</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>EPC document on file ({sellerProfile?.epcDocument ? "Yes" : "Pending"})</li>
                <li>Proof of ownership received {sellerProfile?.ownershipDocReceived ? "✔︎" : "✗"}</li>
                <li>Client money protection and anti-money-laundering policy acknowledged.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Sales progression</h2>
                <p className="text-sm text-white/70">
                  Expand each stage to see outstanding tasks, notes, and collaborator access.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                <input
                  type="email"
                  placeholder="Invite solicitor (email)"
                  className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                  value={solicitorEmail}
                  onChange={(e) => setSolicitorEmail(e.target.value)}
                />
                <button
                  onClick={handleInviteSolicitor}
                  className="rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                >
                  Invite
                </button>
                {solicitorInvite && (
                  <span className="text-emerald-200">
                    Invitation sent to {solicitorInvite.email}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {pipeline.map((stage, idx) => (
                <div
                  key={stage.key}
                  className="rounded-2xl border border-white/10 bg-black/30"
                >
                  <button
                    onClick={() => setOpenStage(idx === openStage ? -1 : idx)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{stage.title}</p>
                      <p className="text-xs text-white/60">{stage.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          stage.complete ? "bg-emerald-400" : idx === openStage ? "bg-amber-400" : "bg-slate-600"
                        }`}
                      />
                      <span className="text-xs text-white/50">{openStage === idx ? "−" : "+"}</span>
                    </div>
                  </button>
                  {openStage === idx && (
                    <div className="px-4 pb-4 space-y-3 text-sm text-white/80">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Tasks</p>
                        <ul className="mt-2 space-y-1 text-xs">
                          {stage.tasks.map((task, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  task.done ? "bg-emerald-400" : "bg-slate-500"
                                }`}
                              />
                              {task.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {stage.outstanding.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Outstanding</p>
                          <ul className="mt-2 space-y-1 text-xs text-amber-200">
                            {stage.outstanding.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                          Notes for this stage
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                          rows={3}
                          value={stageNotes[stage.key] || ""}
                          onChange={(e) => handleStageNoteChange(stage.key, e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleStageNoteSave(stage.key)}
                            className="rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                          >
                            Save notes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70 space-y-2">
              <p className="font-semibold text-white/80">Chain summary</p>
              <ul className="space-y-2">
                {chain.map((link, idx) => (
                  <li key={idx}>
                    <span className="text-white">{link.role}:</span> {link.status}{" "}
                    <span className="text-white/50">— {link.notes}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Viewings & availability</h2>
                  <p className="text-sm text-white/70">
                    Keep availability current, switch on open-house mode, and review upcoming guests.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={userProfile.openHouseOnly}
                    onChange={handleOpenHouseToggle}
                  />
                  Open-house only
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Availability (next 7 days)</p>
                <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs text-white/80">
                  {calendarDays.map((day) => {
                    const key = day.toISOString().slice(0, 10);
                    const slots = slotsByDate[key] || [];
                    return (
                      <div key={key} className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                        <p className="font-semibold text-white">
                          {day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        {slots.length === 0 ? (
                          <p className="text-white/40">No slots</p>
                        ) : (
                          slots.map((slot) => (
                            <p key={slot.id || `${slot.date}-${slot.time}`}>{slot.time}</p>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="date"
                    className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                    value={viewingSlotForm.date}
                    onChange={(e) => setViewingSlotForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                    value={viewingSlotForm.time}
                    onChange={(e) => setViewingSlotForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                  <button
                    onClick={handleAddViewingSlot}
                    className="rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                  >
                    Save availability
                  </button>
                </div>
                {viewingSlots.length > 0 && (
                  <ul className="mt-3 space-y-2 text-xs text-white/70">
                    {viewingSlots.map((slot) => (
                      <li
                        key={slot.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                      >
                        <span>
                          {slot.date} • {slot.time}
                        </span>
                        <button
                          onClick={() => handleRemoveViewingSlot(slot.id)}
                          className="text-red-300 hover:text-red-200"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Upcoming viewings</p>
                {viewings.map((viewing) => {
                  const viewer = MOCK_MEMBER_PROFILES[viewing.viewerEmail];
                  const start = new Date(`${viewing.date}T${viewing.time}`);
                  return (
                    <div
                      key={viewing.id}
                      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 flex flex-wrap items-center gap-4 justify-between text-sm text-white/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10">
                          {viewer?.avatar ? (
                            <img src={viewer.avatar} alt={viewer?.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {viewer?.name?.[0] || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {start.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short"
                            })}
                            {" • "}
                            {start.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                          <p className="text-xs text-white/60">
                            {viewer?.name || "Buyer"} • {viewing.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[160px] text-xs text-white/60">
                        {viewer?.bio || "Buyer profile forthcoming."}
                      </div>
                      <div className="text-xs text-white/70">
                        {viewing.feedback ? `Feedback: “${viewing.feedback}”` : "Awaiting feedback"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Offers</h2>
                    <p className="text-sm text-white/70">Stage tracking and outstanding actions.</p>
                  </div>
                  <div className="text-xs uppercase tracking-[0.3em] text-emerald-200">Live</div>
                </div>
                <div className="space-y-3 text-sm text-white/80">
                  {offers.map((offer) => {
                    const viewer = MOCK_MEMBER_PROFILES[offer.buyerEmail];
                    return (
                      <div key={offer.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {viewer?.name || offer.buyerEmail}
                            </p>
                            <p className="text-xs text-white/60">
                              {new Date(offer.updated).toLocaleString("en-GB", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-white">{formatAmount(offer.amount)}</p>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{offer.status}</p>
                          </div>
                        </div>
                        <p className="text-xs text-white/60">Stage: {offer.stage}</p>
                        {offer.outstanding.length > 0 && (
                          <div className="text-xs text-amber-200">
                            Outstanding: {offer.outstanding.join(", " )}
                          </div>
                        )}
                        <ul className="text-xs text-white/60 list-disc pl-5">
                          {offer.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Buyer verification</h2>
                    <p className="text-sm text-white/70">Proof of funds and finance checks synced with the CRM.</p>
                  </div>
                  <button
                    onClick={() => navigate("/profile")}
                    className="rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
                  >
                    Request update
                  </button>
                </div>
                <div className="space-y-3 text-sm text-white/80">
                  {buyerProofs.map((proof) => {
                    const viewer = MOCK_MEMBER_PROFILES[proof.buyerEmail];
                    return (
                      <div key={proof.buyerEmail} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-white font-semibold">
                            {viewer?.name || proof.buyerEmail}
                          </p>
                          <span
                            className={
                              "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] " +
                              (proof.status === "Verified"
                                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40"
                                : proof.status === "In review"
                                ? "bg-amber-500/20 text-amber-200 border border-amber-400/40"
                                : "bg-white/10 text-white/60 border border-white/20")
                            }
                          >
                            {proof.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/60">
                          Score: {proof.score} • Updated{" "}
                          {new Date(proof.lastUpdated).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                        <ul className="text-xs text-white/70 list-disc pl-5">
                          {proof.documents.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Notification settings</h2>
                <div className="space-y-3 text-sm text-white/80">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userProfile.emailNotifications}
                      onChange={() => handleNotificationToggle("emailNotifications")}
                    />
                    Email updates on important milestones
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userProfile.platformNotifications}
                      onChange={() => handleNotificationToggle("platformNotifications")}
                    />
                    In-app alerts
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userProfile.notificationChannels?.sms || false}
                      onChange={() => handleChannelTogglePortal("sms")}
                    />
                    SMS summaries
                  </label>
                </div>
                <p className="text-xs text-white/50">
                  Fine-grained controls live in your profile. Email notifications can be disabled here but transactional emails (e.g. onboarding confirmations) will still send.
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">AI assistant</h2>
                  <button
                    onClick={() => alert("Live messaging coming soon.")}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10 transition"
                  >
                    Open thread
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {aiThread.map((msg, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{msg.sender}</p>
                      <p className="text-white mt-1">{msg.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{msg.time}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Latest notifications</h2>
                <ul className="space-y-3 text-sm text-slate-200">
                  {notifications.map((note) => (
                    <li key={note.id} className="flex items-center justify-between gap-3">
                      <span>{note.title}</span>
                      <span className="text-xs text-slate-500">{note.time}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Marketing summary</h2>
            <p className="text-sm text-white/70">
              Performance snapshots pulled from HOME AI analytics.
            </p>
            <div className="grid gap-4 md:grid-cols-4 text-sm text-white">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Portal views</p>
                <p className="mt-2 text-2xl font-semibold">4,182</p>
                <p className="text-xs text-emerald-300 mt-1">+18% vs last week</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Enquiries</p>
                <p className="mt-2 text-2xl font-semibold">27</p>
                <p className="text-xs text-slate-400 mt-1">3 qualified buyers pending</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">AI match score</p>
                <p className="mt-2 text-2xl font-semibold">91%</p>
                <p className="text-xs text-slate-400 mt-1">Top decile in W8 segment</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Next milestone</p>
                <p className="mt-2 text-2xl font-semibold">Best & final</p>
                <p className="text-xs text-slate-400 mt-1">Due 18 Nov 17:00</p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <>
          <SellerValuationPanel insights={insights} />
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Marketing status",
                value: "Pre-launch",
                note: "Photography booked for 18 Nov."
              },
              {
                label: "Viewings scheduled",
                value: "3 this week",
                note: "Latest feedback pending."
              },
              {
                label: "Offer readiness",
                value: "Proof of funds outstanding",
                note: "Remind buyer #2846 to upload documents."
              }
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-sm text-slate-300">{item.note}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </PortalShell>
  );
}


function BuyerSellerPortal({ session }) {
  const search = useMemo(() => latestSearch(), []);
  const recommendations = useMemo(() => {
    if (!search) return LISTINGS.slice(0, 4);
    const matches = LISTINGS.filter((listing) => listingMatches(search, listing));
    return matches.length ? matches.slice(0, 4) : LISTINGS.slice(0, 4);
  }, [search]);

  const favourites = useMemo(() => {
    const favs = loadJSON(KEYS.FAVS, {});
    return LISTINGS.filter((listing) => favs[listing.id]).slice(0, 4);
  }, []);

  const sellerDetails = getSellerProfile();
  const insights = useMemo(() => computeSellerInsights(sellerDetails), [sellerDetails]);

  const upcoming = useMemo(
    () =>
      recommendations.slice(0, 2).map((listing, idx) => ({
        id: `duo-${idx}`,
        date: idx === 0 ? "Fri 15 Nov • 14:00" : "Sun 17 Nov • 12:30",
        listing,
        status: idx === 0 ? "Confirmed" : "Draft"
      })),
    [recommendations]
  );

  return (
    <PortalShell
      session={session}
      title="Buyer & seller workspace"
      subtitle="Track your onward purchase and sale pipeline together."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <BuyerOverviewCards search={search} upcoming={upcoming} />
          <BuyerCardsGrid title="Buyer matches" listings={recommendations} />
          <BuyerCardsGrid title="Saved shortlist" listings={favourites} />
        </div>
        <div className="space-y-6">
          <SellerValuationPanel insights={insights} />
        </div>
      </div>
    </PortalShell>
  );
}

/* ----------------------- Profile Page ----------------------- */
function ProfilePage() {
  const session = useCurrentSession();
  const [profile, setProfile] = useState(() => getUserProfile());
  const [docForm, setDocForm] = useState({ name: "", type: "Contract", isPrivate: true });
  const [availabilityForm, setAvailabilityForm] = useState({ date: "", time: "" });
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    setProfile(getUserProfile());
  }, [session]);

  if (!session) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-6">
        <HomeButton />
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-semibold">Sign in to manage your profile</h1>
          <p className="text-sm text-white/70">
            Your profile controls how other members and agents see you across HOME AI. Please sign in using the button on the landing page.
          </p>
        </div>
      </main>
    );
  }

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleChannelToggle = (channel) => {
    setProfile((prev) => ({
      ...prev,
      notificationChannels: {
        ...prev.notificationChannels,
        [channel]: !prev.notificationChannels?.[channel]
      }
    }));
  };

  const handleAddDocument = () => {
    if (!docForm.name.trim()) return;
    const doc = {
      id: crypto.randomUUID(),
      name: docForm.name.trim(),
      type: docForm.type,
      isPrivate: docForm.isPrivate,
      addedAt: Date.now()
    };
    setProfile((prev) => ({
      ...prev,
      uploadedDocs: [...(prev.uploadedDocs || []), doc]
    }));
    setDocForm({ name: "", type: docForm.type, isPrivate: docForm.isPrivate });
  };

  const handleRemoveDocument = (id) => {
    setProfile((prev) => ({
      ...prev,
      uploadedDocs: prev.uploadedDocs.filter((doc) => doc.id !== id)
    }));
  };

  const handleAddAvailability = () => {
    if (!availabilityForm.date || !availabilityForm.time) return;
    const entry = {
      id: crypto.randomUUID(),
      date: availabilityForm.date,
      time: availabilityForm.time
    };
    setProfile((prev) => ({
      ...prev,
      viewingAvailability: [...(prev.viewingAvailability || []), entry]
    }));
    setAvailabilityForm({ date: "", time: "" });
  };

  const handleRemoveAvailability = (id) => {
    setProfile((prev) => ({
      ...prev,
      viewingAvailability: prev.viewingAvailability.filter((slot) => slot.id !== id)
    }));
  };

  const handleSaveProfile = () => {
    const updated = updateUserProfile(profile);
    setProfile(updated);
    setSaved(Date.now());
  };

  const financeDocs = (profile.uploadedDocs || []).filter((doc) => {
    const text = `${doc.type} ${doc.name}`.toLowerCase();
    return text.includes("proof") || text.includes("fund") || text.includes("mortgage") || text.includes("finance");
  });
  const financeStatus = financeDocs.length >= 2 ? "Ready" : financeDocs.length === 1 ? "Partial" : "Missing";
  const lastFinanceUpdate = financeDocs.length
    ? new Date(financeDocs[financeDocs.length - 1].addedAt)
    : null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-16">
      <HomeButton />
      <div className="max-w-5xl mx-auto px-6 pt-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-white/50">Profile</p>
          <h1 className="text-3xl font-semibold">Your HOME identity</h1>
          <p className="text-sm text-white/60 max-w-2xl">
            Manage how you appear to buyers, sellers, agents, and collaborators. Sensitive data stays private by default—only agents you authorise can see confidential documents or contact details.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Basics</h2>
          <div className="grid md:grid-cols-[160px,1fr] gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-32 rounded-full border border-white/15 bg-black/40 overflow-hidden flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white/40 text-sm text-center px-2">
                    Add image URL to personalise
                  </span>
                )}
              </div>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none"
                placeholder="Image URL"
                value={profile.avatar}
                onChange={(e) => handleProfileChange("avatar", e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">Display name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  placeholder="How should we address you?"
                  value={profile.displayName}
                  onChange={(e) => handleProfileChange("displayName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">About you</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  rows={4}
                  placeholder="Share a short bio so agents understand your goals."
                  value={profile.summary}
                  onChange={(e) => handleProfileChange("summary", e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Phone number</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                    placeholder="+44 7..."
                    value={profile.phone}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={profile.shareContactDetails}
                      onChange={(e) => handleProfileChange("shareContactDetails", e.target.checked)}
                    />
                    Allow my assigned agent to see my phone number
                  </label>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
                  <p className="font-semibold text-white/80">Confidentiality</p>
                  <p className="mt-1">
                    Uploaded documents stay private to your HOME team unless you explicitly share them. Contact details are only visible to agents you authorise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.emailNotifications}
                onChange={(e) => handleProfileChange("emailNotifications", e.target.checked)}
              />
              Email updates on important activity
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.platformNotifications}
                onChange={(e) => handleProfileChange("platformNotifications", e.target.checked)}
              />
              In-app notifications
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.notificationChannels?.sms || false}
                onChange={() => handleChannelToggle("sms")}
              />
              SMS summaries
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.notificationChannels?.email ?? true}
                onChange={() => handleChannelToggle("email")}
              />
              Transactional emails (cannot be fully disabled)
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Finance readiness</h2>
          <p className="text-sm text-white/70">
            Upload proof of funds, mortgage agreements, or lender letters to help agents assess buying power.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Status</p>
              <p className="text-white font-semibold">{financeStatus}</p>
              <p className="text-xs text-white/60">
                {financeDocs.length || "No"} finance document{financeDocs.length === 1 ? "" : "s"} on file.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Last update</p>
              <p className="text-white font-semibold">
                {lastFinanceUpdate
                  ? lastFinanceUpdate.toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Pending"}
              </p>
              <p className="text-xs text-white/60">Agents see the latest timestamp automatically.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                  onClick={() => setDocForm((prev) => ({ ...prev, type: "Proof of funds" }))}
                >
                  Add proof of funds
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 transition"
                  onClick={() => setDocForm((prev) => ({ ...prev, type: "Mortgage in principle" }))}
                >
                  Add mortgage doc
                </button>
              </div>
              <p className="text-xs text-white/60">
                Verified buyers are highlighted for sellers inside HOME AI.
              </p>
            </div>
          </div>
          {financeDocs.length > 0 && (
            <ul className="text-xs text-white/70 space-y-1 list-disc pl-5">
              {financeDocs.map((doc) => (
                <li key={doc.id || doc.name}>
                  {doc.name} • {doc.type} • Added{" "}
                  {new Date(doc.addedAt).toLocaleDateString("en-GB")}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Documents</h2>
          <div className="grid md:grid-cols-[1fr,200px] gap-4 text-sm">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">Document name</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                value={docForm.name}
                onChange={(e) => setDocForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">Type</label>
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                value={docForm.type}
                onChange={(e) => setDocForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option>Contract</option>
                <option>ID</option>
                <option>Proof of address</option>
                <option>Proof of funds</option>
                <option>Mortgage in principle</option>
                <option>Land Registry</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={docForm.isPrivate}
              onChange={(e) => setDocForm((prev) => ({ ...prev, isPrivate: e.target.checked }))}
            />
            Keep private (only visible to authorised agents)
          </label>
          <button
            type="button"
            onClick={handleAddDocument}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
          >
            Add document record
          </button>
          <ul className="space-y-2 text-sm text-white/80">
            {(profile.uploadedDocs || []).length === 0 && (
              <li className="text-white/50 text-xs">No documents logged yet.</li>
            )}
            {(profile.uploadedDocs || []).map((doc) => (
              <li
                key={doc.id}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-white">{doc.name}</p>
                  <p className="text-xs text-white/60">
                    {doc.type} • {doc.isPrivate ? "Private" : "Shared"} •{" "}
                    {new Date(doc.addedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveDocument(doc.id)}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Viewing preferences</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={profile.openHouseOnly}
                onChange={(e) => handleProfileChange("openHouseOnly", e.target.checked)}
              />
              Prefer open-house format only
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Availability slots</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="date"
                  className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={availabilityForm.date}
                  onChange={(e) => setAvailabilityForm((prev) => ({ ...prev, date: e.target.value }))}
                />
                <input
                  type="time"
                  className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={availabilityForm.time}
                  onChange={(e) => setAvailabilityForm((prev) => ({ ...prev, time: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={handleAddAvailability}
                  className="rounded-xl bg-white text-black px-3 py-2 text-sm font-medium hover:bg-white/90"
                >
                  Save slot
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {(profile.viewingAvailability || []).length === 0 && (
                  <li className="text-xs text-white/50">No times saved yet.</li>
                )}
                {(profile.viewingAvailability || []).map((slot) => (
                  <li
                    key={slot.id}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <span>
                      {slot.date} • {slot.time}
                    </span>
                    <button
                      className="text-xs text-red-300 hover:text-red-200"
                      onClick={() => handleRemoveAvailability(slot.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={handleSaveProfile}
            className="rounded-xl bg-white text-black px-5 h-12 text-sm font-medium hover:bg-white/90"
          >
            Save profile
          </button>
          {saved && (
            <span className="text-xs text-white/50 self-center">
              Last saved {new Date(saved).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

function sessionHasRole(session, role) {
  return !!session?.roles?.includes(role);
}

function deriveSessionLabel(session) {
  if (!session) return "guest";
  if (sessionHasRole(session, Roles.ADMIN)) return "admin";
  if (sessionHasRole(session, Roles.AGENT)) return "agent";
  if (sessionHasRole(session, Roles.SELLER) && sessionHasRole(session, Roles.BUYER)) return "buyer & seller";
  if (sessionHasRole(session, Roles.SELLER)) return "seller";
  if (sessionHasRole(session, Roles.BUYER)) return "buyer";
  return "member";
}

function RequireRoles({ allowed = [], children }) {
  const session = useCurrentSession();
  if (!session) return <Navigate to="/" replace />;
  if (allowed.length && !allowed.some((role) => sessionHasRole(session, role))) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const SellerStatus = {
  PROSPECT: "prospect",
  CHECKOUT: "checkout",
  ACTIVE: "active"
};

function TopNav() {
  const navigate = useNavigate();
  const session = useCurrentSession();

  const handleSignOut = () => {
    clearSession();
    window.location.href = "/";
  };

  if (!session) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-[70] bg-neutral-950/90 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 text-sm text-white/80">
        <button
          onClick={() => navigate("/")}
          className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10 transition"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10 transition"
        >
          Profile
        </button>
        <button
          onClick={() => navigate("/seller")}
          className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10 transition hidden sm:inline-flex"
        >
          Sell
        </button>
        <button
          onClick={() => navigate("/buyer")}
          className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10 transition hidden sm:inline-flex"
        >
          Buy
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10 transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

const SELLER_PREMIUM_THRESHOLD = 1_500_000;

const SELLER_PROFILES_KEY = "home_seller_profiles_v1";

const MOCK_SELLER_PROFILES = {
  "valuation@test.com": {
    status: SellerStatus.PROSPECT,
    address: "45 Brookfield Avenue, London N1",
    postcode: "N1 3AB",
    beds: 3,
    baths: 2,
    email: "valuation@test.com",
    phone: "+44 7000 000111",
    _updatedAt: Date.parse("2025-01-05T09:30:00Z")
  },
  "seller@test.com": {
    status: SellerStatus.ACTIVE,
    address: "123 Kensington High St, London W8",
    postcode: "W8 5TT",
    beds: 3,
    baths: 2,
    email: "seller@test.com",
    phone: "+44 7000 000222",
    activeListingId: "w8-123",
    planKey: "premier",
    valuationRange: { lower: 1800000, upper: 1900000, midpoint: 1850000 },
    onboardedAt: Date.parse("2025-01-02T10:00:00Z"),
    contractSignedAt: Date.parse("2025-01-02T09:45:00Z"),
    paymentReference: "HOME-AB38F2",
    _updatedAt: Date.parse("2025-01-08T14:20:00Z")
  }
};

const FEATURE_OPTIONS = [
  {
    key: "premiumFinish",
    label: "High-spec interiors",
    description: "Designer kitchen, premium bathrooms, bespoke joinery",
    adjustment: 0.04
  },
  {
    key: "extendedOrLoft",
    label: "Extended / loft converted",
    description: "Recent extension or loft conversion adding usable space",
    adjustment: 0.035
  },
  {
    key: "gardenOrTerrace",
    label: "Private garden or terrace",
    description: "Significant exclusive outdoor space",
    adjustment: 0.025
  },
  {
    key: "secureParking",
    label: "Secure parking",
    description: "Allocated off-street parking or private garage",
    adjustment: 0.02
  },
  {
    key: "chainFree",
    label: "Chain-free sale",
    description: "No onward purchase required",
    adjustment: 0.01
  },
  {
    key: "highEnergyRating",
    label: "High energy efficiency",
    description: "EPC A/B or recent eco upgrades",
    adjustment: 0.015
  }
];

const FEATURE_ADJUSTMENTS = Object.fromEntries(
  FEATURE_OPTIONS.map(({ key, adjustment }) => [key, adjustment])
);
const FEATURE_LABELS = Object.fromEntries(
  FEATURE_OPTIONS.map(({ key, label }) => [key, label])
);

const CONDITION_OPTIONS = [
  {
    key: "needs_work",
    label: "Needs modernisation",
    description: "Requires refurbishment",
    adjustment: -0.05,
    spread: 0.015
  },
  {
    key: "average",
    label: "Good / average",
    description: "Well-maintained, typical condition",
    adjustment: 0,
    spread: 0
  },
  {
    key: "excellent",
    label: "Turn-key / recently refurbished",
    description: "Move-in ready with recent upgrades",
    adjustment: 0.03,
    spread: -0.01
  }
];

const CONDITION_ADJUSTMENTS = Object.fromEntries(
  CONDITION_OPTIONS.map(({ key, adjustment }) => [key, adjustment])
);
const CONDITION_LABELS = Object.fromEntries(
  CONDITION_OPTIONS.map(({ key, label }) => [key, label])
);
const CONDITION_SPREAD_ADJUSTMENTS = Object.fromEntries(
  CONDITION_OPTIONS.map(({ key, spread }) => [key, spread])
);

const SQM_TO_SQFT = 10.7639;

function createRefinementState(profile, subject = {}) {
  return {
    condition: profile?.condition || subject?.condition || "average",
    features: Array.isArray(profile?.valuationFeatures) ? profile.valuationFeatures : [],
    floorArea: profile?.floorArea ? String(profile.floorArea) : "",
    floorAreaUnit: profile?.floorAreaUnit || subject?.floorAreaUnit || "sqft",
    renovationYear: profile?.renovationYear ? String(profile.renovationYear) : "",
    specialFeatureNotes: profile?.specialFeatureNotes || ""
  };
}

function determineSellerPlan(valuation, fallbackPrice) {
  const anchor = valuation?.midpoint ?? valuation?.baseline ?? fallbackPrice ?? 0;
  const premium = anchor >= SELLER_PREMIUM_THRESHOLD;
  if (premium) {
    return {
      key: "premier",
      label: "Premier marketing package",
      description: "For homes £1.5m+ including enhanced cinematography and international reach.",
      upfrontFee: 3000,
      successFeePercent: 1,
      benefits: [
        "Full photography & videography inc. drone capture",
        "Bespoke brochure & floorplans",
        "Rightmove, Zoopla, HOME AI & global syndication",
        "Dedicated sales progression concierge",
        "AI-assisted reporting & weekly strategy clinics"
      ]
    };
  }
  return {
    key: "core",
    label: "Core marketing package",
    description: "For homes under £1.5m with turn-key marketing and AI support.",
    upfrontFee: 1000,
    successFeePercent: 1,
    benefits: [
        "Professional photography & floorplans",
        "For sale board & portal syndication",
        "Buyer qualification & offer handling",
        "AI progress assistant & milestone alerts",
        "Weekly performance reporting"
    ]
  };
}

/* ----------------------- tiny store helpers ----------------------- */
const KEYS = {
  FAVS: "home_favs_v1",
  ALERTS: "home_alerts_v1",
  VIEWS: "home_views_v1"
};
const loadJSON = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function loadSellerProfiles() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SELLER_PROFILES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSellerProfiles(profiles) {
  if (typeof window === "undefined") return;
  saveJSON(SELLER_PROFILES_KEY, profiles);
}

function getCurrentUserEmail() {
  const session = getSession();
  return session?.email ? session.email.toLowerCase() : null;
}

function getSellerProfile() {
  const email = getCurrentUserEmail();
  if (email) {
    const profiles = loadSellerProfiles();
    if (profiles[email]) return profiles[email];
    if (MOCK_SELLER_PROFILES[email]) return { ...MOCK_SELLER_PROFILES[email] };
  }
  return getSection("seller");
}

function updateSellerProfile(patch) {
  const email = getCurrentUserEmail();
  const mergePatch = { ...patch };
  if (!Object.prototype.hasOwnProperty.call(patch, "_updatedAt")) {
    mergePatch._updatedAt = Date.now();
  }

  if (email) {
    const profiles = loadSellerProfiles();
    const base = profiles[email] || MOCK_SELLER_PROFILES[email] || {};
    const updated = { ...base, ...mergePatch };
    profiles[email] = updated;
    saveSellerProfiles(profiles);
    return updated;
  }

  return saveSection("seller", mergePatch);
}

const USER_PROFILES_KEY = "home_user_profiles_v1";

const DEFAULT_USER_PROFILE = {
  avatar: "",
  displayName: "",
  summary: "",
  phone: "",
  shareContactDetails: false,
  emailNotifications: true,
  platformNotifications: true,
  docVisibility: "private",
  uploadedDocs: [],
  viewingAvailability: [],
  boardPreference: "undecided",
  openHouseOnly: false,
  notificationChannels: {
    email: true,
    sms: false,
    inApp: true
  },
  updatedAt: null
};

const MOCK_MEMBER_PROFILES = {
  "luca@buyers.com": {
    name: "Luca P.",
    avatar: "https://i.pravatar.cc/120?img=34",
    bio: "First-time buyer working in fintech, prefers south-facing terraces.",
    budget: "£1.85m",
    preferences: ["Kensington", "3 beds", "Outdoor space"]
  },
  "priya.dan@buyers.com": {
    name: "Priya & Dan",
    avatar: "https://i.pravatar.cc/120?img=12",
    bio: "Move-up buyers relocating from Notting Hill, chain agreed.",
    budget: "£1.9m",
    preferences: ["Schools", "Parking", "Modern finish"]
  },
  "corporate@relocators.com": {
    name: "Corporate Relocation",
    avatar: "https://i.pravatar.cc/120?img=21",
    bio: "Relocation agent representing international client, quick completion preferred.",
    budget: "£2.0m",
    preferences: ["Furnished option", "Flexible completion"]
  }
};

function loadUserProfiles() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USER_PROFILES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUserProfiles(profiles) {
  if (typeof window === "undefined") return;
  saveJSON(USER_PROFILES_KEY, profiles);
}

function getUserProfile() {
  const email = getCurrentUserEmail();
  if (!email) return { ...DEFAULT_USER_PROFILE };

  const profiles = loadUserProfiles();
  if (profiles[email]) {
    return { ...DEFAULT_USER_PROFILE, ...profiles[email] };
  }

  const session = getSession();
  return {
    ...DEFAULT_USER_PROFILE,
    displayName: session?.name || email
  };
}

function updateUserProfile(patch) {
  const email = getCurrentUserEmail();
  if (!email) return { ...DEFAULT_USER_PROFILE, ...patch };

  const profiles = loadUserProfiles();
  const existing = profiles[email] || getUserProfile();
  const updated = {
    ...existing,
    ...patch,
    updatedAt: Date.now()
  };
  profiles[email] = updated;
  saveUserProfiles(profiles);
  return updated;
}

/* ---------- currency helpers ---------- */
const CURRENCY_KEY = "home_currency_v1";
const DEFAULT_CCY = "GBP";

// Demo rates (1 GBP = X). Replace with live rates later.
const FX = { GBP: 1, USD: 1.27, EUR: 1.17, AED: 4.66 };

function convertAmount(amount, from = "GBP", to = "GBP") {
  if (!amount || from === to) return amount || 0;
  const fr = FX[from] ?? 1;
  const tr = FX[to] ?? 1;
  return Math.round((amount / fr) * tr);
}

function formatAmount(amount, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/** Returns { amount, currency, text } for display */
function displayPrice(listing, prefCurrency) {
  const src = (listing && listing.currency) || "GBP";
  const out = prefCurrency || DEFAULT_CCY;
  const amt = convertAmount(listing?.price || 0, src, out);
  return { amount: amt, currency: out, text: formatAmount(amt, out) };
}

function useCurrency() {
  const [ccy, setCcy] = useState(localStorage.getItem(CURRENCY_KEY) || DEFAULT_CCY);
  useEffect(() => localStorage.setItem(CURRENCY_KEY, ccy), [ccy]);
  return [ccy, setCcy];
}

/* ----------------------- shared UI bits ----------------------- */
function HomeButton() {
  const nav = useNavigate();
  return (
    <button
      aria-label="Go home"
      onClick={() => nav("/")}
      className="fixed left-4 top-4 z-[60] rounded-full bg-black/70 backdrop-blur text-white p-2 border border-white/15 hover:bg-black/85"
      title="Home"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 11.5L12 4l9 7.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10.5V20h5v-5h4v5h5v-9.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function GlowWord({ children }) {
  return (
    <span className="relative inline-block">
      <span className="text-white font-semibold">{children}</span>
      <span className="absolute inset-0 blur-[6px] opacity-70 bg-white/60 rounded pointer-events-none" />
    </span>
  );
}

function TalkToHomeAIButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-xl px-5 h-12 text-sm font-medium bg-black text-white " +
        "hover:bg-black/90 transition inline-flex items-center justify-center " +
        className
      }
    >
      Talk to <span className="mx-1 font-semibold shine-text">home</span> AI
    </button>
  );
}

function CurrencySwitcher({ value, onChange }) {
  const options = ["GBP", "USD", "EUR", "AED"];
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Currency</span>
      <div className="flex rounded-xl border border-neutral-300 overflow-hidden">
        {options.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={
              "px-3 py-1.5 text-sm " + (value === c ? "bg-black text-white" : "bg-white hover:bg-neutral-100")
            }
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* minimalist system icon (stroke only) */
function Icon({ path, size = 18, className = "text-neutral-900" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
const IBed = <path d="M3 18v-6a2 2 0 0 1 2-2h7a3 3 0 0 1 3 3v5H3zm0-7h16a2 2 0 0 1 2 2v5H3" />;
const IBath = (
  <>
    <path d="M7 10V6a3 3 0 0 1 6 0v4" />
    <path d="M5 10h12v3a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-3" />
  </>
);
const IArea = <path d="M4 4h16v16H4z M9 4v16 M4 9h16" />;
const IMapPin = (
  <>
    <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z" />
    <circle cx="12" cy="11" r="2.5" />
  </>
);
const IPrice = <path d="M12 2v20M17 5H9a3 3 0 0 0 0 6h6a3 3 0 1 1 0 6H7" />;
const IShare = (
  <>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 16V4" />
    <path d="M8 8l4-4 4 4" />
  </>
);
const IHeart = <path d="M20.8 7.6a5.5 5.5 0 0 0-9.8-3.6A5.5 5.5 0 1 0 4 16l8 6 8-6a5.5 5.5 0 0 0 .8-8.4z" />;

/* ----------------------- Landing ----------------------- */
function Landing() {
  const [showLogo, setShowLogo] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setShowLogo(true), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <motion.h1
          className="mt-6 text-4xl md:text-6xl font-light tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="font-extralight">welcome</span>{" "}
          <span className="font-semibold shine-text">home</span>
        </motion.h1>

        <motion.div
          className="mt-12 grid grid-cols-2 gap-4 w-full max-w-xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button
            onClick={() => navigate("/seller")}
            className="group w-full border border-white/20 rounded-2xl px-6 py-4 backdrop-blur hover:border-white/40 transition flex items-center justify-between"
          >
            <span className="text-lg">
              I am a property <strong>SELLER</strong>
            </span>
            <span className="transition group-hover:translate-x-1">→</span>
          </button>

          <button
            onClick={() => navigate("/buyer")}
            className="group w-full border border-white/20 rounded-2xl px-6 py-4 backdrop-blur hover:border-white/40 transition flex items-center justify-between"
          >
            <span className="text-lg">
              I am a property <strong>BUYER</strong>
            </span>
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
        </motion.div>

        <button
          onClick={() => setOpenSignIn(true)}
          className="mt-6 underline underline-offset-4 text-white/70 hover:text-white/90"
        >
          Existing members: click here
        </button>
        <GoogleSignIn
          open={openSignIn}
          onClose={() => setOpenSignIn(false)}
          onSignedIn={(session) => {
            if (session?.roles?.length) {
              window.location.href = "/crm";
            }
          }}
        />

        <div className="mt-10 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Home. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Seller ----------------------- */
function SellerStart() {
  const [form, setForm] = useState({
    postcode: "",
    address: "",
    beds: "",
    baths: "",
    email: "",
    phone: ""
  });
  const [pcStatus, setPcStatus] = useState({ checked: false, ok: false, note: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  async function onPostcodeBlur() {
    const pc = normalisePostcode(form.postcode);
    if (!pc) return;
    update("postcode", pc);
    const res = await verifyPostcode(pc);
    if (res.ok) setPcStatus({ checked: true, ok: true, note: `${res.admin_district || "Verified"} ✓` });
    else setPcStatus({ checked: true, ok: false, note: res.error || "Invalid postcode" });
  }

  const validate = () => {
    const e = {};
    if (!isUKPostcode(form.postcode)) e.postcode = "Enter a valid UK postcode (e.g., W8 5TT).";
    if (!notEmpty(form.address)) e.address = "Address is required.";
    if (!isNumber(form.beds)) e.beds = "Beds must be a number.";
    if (!isNumber(form.baths)) e.baths = "Baths must be a number.";
    if (!isEmail(form.email)) e.email = "Enter a valid email.";
    if (!notEmpty(form.phone)) e.phone = "Phone is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!pcStatus.checked) await onPostcodeBlur();
    if (!pcStatus.ok) {
      setErrors((p) => ({ ...p, postcode: "Please enter a valid UK postcode." }));
      return;
    }
    if (!validate()) return;
    updateSellerProfile({ ...form, status: SellerStatus.PROSPECT });
    navigate("/seller/valuation");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 flex items-center justify-center">
      <HomeButton />
      <form onSubmit={onSubmit} className="w-full max-w-2xl space-y-4">
        <h2 className="text-3xl font-semibold">Sell your home</h2>
        <p className="text-white/70">
          Start with a quick snapshot and we’ll follow up to book your appraisal.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-white/70">Postcode</label>
            <input
              className="mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3"
              placeholder="W8 5TT"
              value={form.postcode}
              onChange={(e) => update("postcode", e.target.value)}
              onBlur={onPostcodeBlur}
            />
            {pcStatus.checked && (
              <p className={`mt-1 text-sm ${pcStatus.ok ? "text-emerald-400" : "text-red-400"}`}>
                {pcStatus.ok ? pcStatus.note : `Postcode error: ${pcStatus.note}`}
              </p>
            )}
            {errors.postcode && <p className="text-red-400 text-sm mt-1">{errors.postcode}</p>}
          </div>

          <div>
            <label className="text-sm text-white/70">Address</label>
            <input
              className="mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3"
              placeholder="123 Kensington High St"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
            {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="text-sm text-white/70">Beds</label>
            <input
              className="mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3"
              placeholder="3"
              value={form.beds}
              onChange={(e) => update("beds", e.target.value)}
            />
            {errors.beds && <p className="text-red-400 text-sm mt-1">{errors.beds}</p>}
          </div>

          <div>
            <label className="text-sm text-white/70">Baths</label>
            <input
              className="mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3"
              placeholder="2"
              value={form.baths}
              onChange={(e) => update("baths", e.target.value)}
            />
            {errors.baths && <p className="text-red-400 text-sm mt-1">{errors.baths}</p>}
          </div>

          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              className="mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm text-white/70">Phone</label>
            <input
              className="mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3"
              placeholder="+44 7..."
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>

        <button className="mt-2 bg-white text-black rounded-xl px-5 py-3 font-medium hover:bg-white/90">
          Next
        </button>
      </form>
    </main>
  );
}

function computeSellerInsights(raw) {
  if (!raw) {
    return {
      subject: null,
      matched: null,
      comparables: [],
      valuation: null
    };
  }

  const normalisedPostcode = normalisePostcode(raw.postcode || "");
  const comparablePool = LISTINGS.filter(
    (listing) => normalisePostcode(listing.postcode) === normalisedPostcode
  );

  const fallbackPool = comparablePool.length >= 3
    ? comparablePool
    : LISTINGS.filter((listing) => listing.postcode?.slice(0, 2) === (raw.postcode || "").slice(0, 2));

  const comparables = (comparablePool.length ? comparablePool : fallbackPool.length ? fallbackPool : LISTINGS).slice(0, 6);

  const addressToken = (raw.address || "").split(" ")[0]?.toLowerCase();
  const matched =
    comparablePool.find(
      (listing) =>
        addressToken && listing.address?.toLowerCase().includes(addressToken)
    ) || comparablePool[0] || comparables[0] || null;

  const parsedBeds = Number.parseInt(raw.beds, 10);
  const parsedBaths = Number.parseInt(raw.baths, 10);

  const subjectBeds = Number.isFinite(parsedBeds) ? parsedBeds : matched?.beds ?? 3;
  const subjectBaths = Number.isFinite(parsedBaths) ? parsedBaths : matched?.baths ?? 2;

  const features = Array.isArray(raw?.valuationFeatures)
    ? raw.valuationFeatures.filter((key) => Object.prototype.hasOwnProperty.call(FEATURE_ADJUSTMENTS, key))
    : [];
  const conditionKey = Object.prototype.hasOwnProperty.call(CONDITION_ADJUSTMENTS, raw?.condition)
    ? raw?.condition
    : "average";
  const specialFeatureNotes = raw?.specialFeatureNotes || "";
  const renovationYear = Number.parseInt(raw?.renovationYear, 10);
  const yearsSinceRenovation = Number.isFinite(renovationYear)
    ? new Date().getFullYear() - renovationYear
    : null;
  const floorAreaValue = Number.parseFloat(raw?.floorArea);
  const hasFloorArea = Number.isFinite(floorAreaValue) && floorAreaValue > 0;
  const floorAreaUnit = raw?.floorAreaUnit === "sqm" ? "sqm" : "sqft";
  const floorAreaSqft = hasFloorArea
    ? floorAreaUnit === "sqm"
      ? floorAreaValue * SQM_TO_SQFT
      : floorAreaValue
    : null;

  const pricePool = comparables.map((l) => l.price).filter(Boolean);
  const baseline = pricePool.length
    ? pricePool.reduce((acc, price) => acc + price, 0) / pricePool.length
    : 850000;

  const averageBeds = comparables.length
    ? comparables.reduce((acc, listing) => acc + (listing.beds || subjectBeds), 0) / comparables.length
    : subjectBeds;

  const bedVariance = subjectBeds - averageBeds;
  const adjustedBaseline = baseline + baseline * 0.045 * bedVariance;
  const spread = comparables.length > 2 ? 0.06 : 0.1;

  let featureMultiplier = 1;
  features.forEach((key) => {
    featureMultiplier += FEATURE_ADJUSTMENTS[key] || 0;
  });
  featureMultiplier += CONDITION_ADJUSTMENTS[conditionKey] || 0;
  if (Number.isFinite(yearsSinceRenovation)) {
    if (yearsSinceRenovation <= 5) featureMultiplier += 0.025;
    else if (yearsSinceRenovation <= 10) featureMultiplier += 0.015;
    else if (yearsSinceRenovation > 25) featureMultiplier -= 0.02;
  }

  let sizeMultiplier = 1;
  const matchedAreaSqft =
    matched?.internal_sqft || (matched?.internal_m2 ? matched.internal_m2 * SQM_TO_SQFT : null);
  if (floorAreaSqft && matchedAreaSqft) {
    const ratio = floorAreaSqft / matchedAreaSqft;
    if (Number.isFinite(ratio) && ratio > 0) {
      sizeMultiplier = Math.min(Math.max(ratio, 0.8), 1.3);
    }
  } else if (floorAreaSqft) {
    const reference = 1200;
    const delta = (floorAreaSqft - reference) / reference;
    sizeMultiplier = Math.min(Math.max(1 + delta * 0.4, 0.85), 1.25);
  }

  const totalMultiplier = Math.max(0.7, featureMultiplier * sizeMultiplier);
  const refinedBaseline = adjustedBaseline * totalMultiplier;

  let effectiveSpread =
    spread + (CONDITION_SPREAD_ADJUSTMENTS[conditionKey] || 0) - Math.min(features.length, 3) * 0.008;
  if (Number.isFinite(yearsSinceRenovation) && yearsSinceRenovation <= 5) effectiveSpread -= 0.005;
  if (floorAreaSqft) effectiveSpread -= 0.004;
  effectiveSpread = Math.min(Math.max(effectiveSpread, 0.02), 0.12);

  const midpoint = Math.round(refinedBaseline);
  const lower = Math.round(midpoint * (1 - effectiveSpread));
  const upper = Math.round(midpoint * (1 + effectiveSpread));

  return {
    subject: {
      ...raw,
      postcode: normalisedPostcode || raw.postcode,
      beds: subjectBeds,
      baths: subjectBaths,
      valuationFeatures: features,
      condition: conditionKey,
      renovationYear: Number.isFinite(renovationYear) ? renovationYear : raw?.renovationYear || null,
      floorArea: hasFloorArea ? Number(floorAreaValue.toFixed(2)) : raw?.floorArea || null,
      floorAreaUnit,
      specialFeatureNotes
    },
    matched,
    comparables,
    valuation: {
      baseline: midpoint,
      lower,
      upper,
      midpoint,
      spread: effectiveSpread,
      confidence: Math.max(60, Math.min(90, Math.round(82 - effectiveSpread * 120))),
      adjustments: {
        features,
        condition: conditionKey,
        renovationYear: Number.isFinite(renovationYear) ? renovationYear : null,
        floorArea: hasFloorArea
          ? { value: Number(floorAreaValue.toFixed(2)), unit: floorAreaUnit }
          : null,
        multiplier: Number(totalMultiplier.toFixed(3))
      }
    }
  };
}

function SellerValuation() {
  const navigate = useNavigate();
  const [activeListing, setActiveListing] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [sellerDetails, setSellerDetails] = useState(() =>
    typeof window !== "undefined" ? getSellerProfile() : null
  );

  useEffect(() => {
    if (!sellerDetails) navigate("/seller", { replace: true });
  }, [sellerDetails, navigate]);

  const insights = useMemo(() => computeSellerInsights(sellerDetails), [sellerDetails]);

  if (!sellerDetails) return null;

  const { subject, matched, comparables, valuation } = insights;
  const mapQuery =
    matched?.lat && matched?.lng
      ? `${matched.lat},${matched.lng}`
      : `${subject?.address || ""} ${subject?.postcode || ""}`.trim();
  const mapSrc =
    matched?.lat && matched?.lng
      ? `https://maps.google.com/maps?q=${matched.lat},${matched.lng}&z=16&output=embed`
      : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery || "London")}&z=15&output=embed`;

  const currentProfile = sellerDetails || {};
  const featureSummary =
    currentProfile?.valuationFeatures?.length
      ? currentProfile.valuationFeatures
          .map((key) => FEATURE_LABELS[key] || key)
          .join(", ")
      : null;
  const conditionLabel =
    CONDITION_LABELS[currentProfile?.condition || subject?.condition || "average"] ||
    CONDITION_LABELS.average;
  const floorAreaDisplay = subject?.floorArea
    ? `${subject.floorArea}${subject.floorAreaUnit === "sqm" ? " m²" : " sq ft"}`
    : matched?.internal_sqft
    ? `${matched.internal_sqft.toLocaleString()} sq ft`
    : matched?.internal_m2
    ? `${matched.internal_m2} m²`
    : null;

  const propertyFacts = [
    { label: "Address", value: subject?.address || "Awaiting address" },
    { label: "Postcode", value: subject?.postcode || "—" },
    { label: "Bedrooms", value: subject?.beds ? `${subject.beds}` : "—" },
    { label: "Bathrooms", value: subject?.baths ? `${subject.baths}` : "—" },
    { label: "Property type", value: matched?.type || "To be confirmed" },
    {
      label: "Floor area",
      value: floorAreaDisplay || "Add floor area to tighten the estimate"
    },
    { label: "Tenure", value: matched?.tenure || "Unknown" },
    {
      label: "Property condition",
      value: conditionLabel
    },
    {
      label: "Feature highlights",
      value: featureSummary || "Add special features to refine value"
    },
    {
      label: "EPC certificate",
      value: matched?.epc_link ? (
        <a
          href={matched.epc_link}
          target="_blank"
          rel="noreferrer"
          className="underline text-white/80 hover:text-white"
        >
          View EPC
        </a>
      ) : (
        "No EPC located"
      )
    },
    {
      label: "Seller notes",
      value: currentProfile?.specialFeatureNotes || "No additional notes yet"
    }
  ];

  const soldNotes = matched?.sold_nearby || [];
  const plan = determineSellerPlan(valuation, matched?.price);
  const isActiveSeller = currentProfile?.status === SellerStatus.ACTIVE;
  const adjustments = valuation?.adjustments || {};
  const adjustmentFeaturesSummary = adjustments.features?.length
    ? adjustments.features.map((key) => FEATURE_LABELS[key] || key).join(", ")
    : "None declared";
  const adjustmentConditionLabel =
    CONDITION_LABELS[adjustments.condition || "average"] || CONDITION_LABELS.average;
  const adjustmentFloorArea = adjustments.floorArea;
  const adjustmentRenovationYear = adjustments.renovationYear;
  const hasExistingRefinements = Boolean(
    (currentProfile?.valuationFeatures?.length ?? 0) ||
      (currentProfile?.condition && currentProfile.condition !== "average") ||
      currentProfile?.floorArea ||
      currentProfile?.specialFeatureNotes
  );
  const [refineOpen, setRefineOpen] = useState(hasExistingRefinements);
  const [refinement, setRefinement] = useState(() =>
    createRefinementState(currentProfile, subject)
  );
  const [refinementSavedAt, setRefinementSavedAt] = useState(null);

  useEffect(() => {
    setRefinement(createRefinementState(currentProfile, subject));
    if (hasExistingRefinements) setRefineOpen(true);
  }, [currentProfile, subject, hasExistingRefinements]);

  const toggleFeature = (key) => {
    setRefinement((prev) => {
      const exists = prev.features.includes(key);
      const next = exists ? prev.features.filter((f) => f !== key) : [...prev.features, key];
      return { ...prev, features: next };
    });
  };

  const handleRefinementChange = (field, value) => {
    setRefinement((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefinementSubmit = (event) => {
    event.preventDefault();
    const uniqueFeatures = Array.from(
      new Set(
        refinement.features.filter((key) =>
          Object.prototype.hasOwnProperty.call(FEATURE_ADJUSTMENTS, key)
        )
      )
    ).sort();
    const conditionValue = Object.prototype.hasOwnProperty.call(
      CONDITION_ADJUSTMENTS,
      refinement.condition
    )
      ? refinement.condition
      : "average";
    const parsedArea = Number.parseFloat(refinement.floorArea);
    const hasArea = Number.isFinite(parsedArea) && parsedArea > 0;
    const parsedRenovation = Number.parseInt(refinement.renovationYear, 10);
    const hasRenovation = Number.isFinite(parsedRenovation) && refinement.renovationYear.length === 4;
    const floorAreaUnit = refinement.floorAreaUnit === "sqm" ? "sqm" : "sqft";

    const updated = updateSellerProfile({
      valuationFeatures: uniqueFeatures,
      condition: conditionValue,
      renovationYear: hasRenovation ? parsedRenovation : null,
      floorArea: hasArea ? Number(parsedArea.toFixed(2)) : null,
      floorAreaUnit: hasArea ? floorAreaUnit : null,
      specialFeatureNotes: refinement.specialFeatureNotes
        ? refinement.specialFeatureNotes.trim()
        : null
    });

    setSellerDetails(updated);
    setRefinementSavedAt(Date.now());
  };

  const handleRefinementReset = () => {
    const updated = updateSellerProfile({
      valuationFeatures: [],
      condition: "average",
      renovationYear: null,
      floorArea: null,
      floorAreaUnit: "sqft",
      specialFeatureNotes: null
    });
    setSellerDetails(updated);
    setRefinement(createRefinementState(updated, subject));
    setRefinementSavedAt(Date.now());
  };

  const handleProceed = () => {
    const updated = updateSellerProfile({
      status: SellerStatus.CHECKOUT,
      planKey: plan.key,
      valuationRange: {
        lower: valuation?.lower,
        upper: valuation?.upper,
        midpoint: valuation?.midpoint
      },
      suggestedListingId: matched?.id || null
    });
    setSellerDetails(updated);
    navigate("/seller/checkout");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-20">
      <HomeButton />
      <div className="max-w-6xl mx-auto px-6 pt-20 space-y-10">
        <button
          onClick={() => navigate("/seller")}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
        >
          <span className="text-lg">←</span>
          Update your property details
        </button>

        <section className="grid gap-6 md:grid-cols-[1.1fr,1fr] items-start">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8 space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Estimated valuation</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
                {subject?.address || "Your home"}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Powered by comparable sales, local supply signals, and HOME AI heuristics.
              </p>
            </div>

            {isActiveSeller && (
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-100 p-4 text-sm">
                Your property is live with HOME AI. Head to your seller workspace to monitor activity and offers.
              </div>
            )}

            {valuation && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Likely range</p>
                  <div className="mt-2 text-4xl md:text-5xl font-semibold">
                    {formatAmount(valuation.lower)} – {formatAmount(valuation.upper)}
                  </div>
                  <p className="mt-2 text-sm text-white/65">
                    Median expectation {formatAmount(valuation.midpoint)} • confidence{" "}
                    {valuation.confidence}%
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/50">Recommended package</p>
                      <p className="mt-1 text-lg font-semibold text-white">{plan.label}</p>
                      <p className="text-sm text-white/70 max-w-md">{plan.description}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.28em] text-white/45">Commercials</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        £{plan.upfrontFee.toLocaleString()} upfront
                      </p>
                      <p className="text-sm text-white/70">+ {plan.successFeePercent}% on exchange</p>
                    </div>
                  </div>
                  <ul className="grid gap-2 text-sm sm:grid-cols-2">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-white/80">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
                    <p className="font-semibold text-white/80">Current assumptions</p>
                    <ul className="mt-2 space-y-1">
                      <li>Condition: {adjustmentConditionLabel}</li>
                      <li>Features: {adjustmentFeaturesSummary}</li>
                      {adjustmentFloorArea ? (
                        <li>
                          Floor area: {adjustmentFloorArea.value}
                          {adjustmentFloorArea.unit === "sqm" ? " m²" : " sq ft"}
                        </li>
                      ) : null}
                      {adjustmentRenovationYear ? (
                        <li>Renovation year: {adjustmentRenovationYear}</li>
                      ) : null}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Refine valuation inputs</p>
                      <p className="text-xs text-white/60">
                        Tell us more about upgrades, size, and condition to tighten the range.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRefineOpen((v) => !v)}
                      className="rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
                    >
                      {refineOpen ? "Hide details" : "Add details"}
                    </button>
                  </div>
                  {refineOpen && (
                    <form className="px-5 pb-5 space-y-4" onSubmit={handleRefinementSubmit}>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Overall condition</p>
                        <div className="mt-2 grid sm:grid-cols-3 gap-2">
                          {CONDITION_OPTIONS.map((option) => {
                            const checked = refinement.condition === option.key;
                            return (
                              <label
                                key={option.key}
                                className={
                                  "rounded-xl border px-3 py-2 text-sm transition " +
                                  (checked
                                    ? "border-emerald-400/60 bg-emerald-500/10 text-white"
                                    : "border-white/15 bg-black/30 text-white/70 hover:border-white/30")
                                }
                              >
                                <input
                                  type="radio"
                                  name="valuation-condition"
                                  value={option.key}
                                  checked={checked}
                                  onChange={() => handleRefinementChange("condition", option.key)}
                                  className="hidden"
                                />
                                <span className="font-medium">{option.label}</span>
                                <span className="block text-xs text-white/60 mt-1">
                                  {option.description}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Special features</p>
                        <div className="mt-2 grid sm:grid-cols-2 gap-2">
                          {FEATURE_OPTIONS.map((option) => {
                            const checked = refinement.features.includes(option.key);
                            return (
                              <label
                                key={option.key}
                                className={
                                  "flex gap-2 rounded-xl border px-3 py-2 text-sm transition " +
                                  (checked
                                    ? "border-emerald-400/60 bg-emerald-500/10 text-white"
                                    : "border-white/15 bg-black/30 text-white/70 hover:border-white/30")
                                }
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={checked}
                                  onChange={() => toggleFeature(option.key)}
                                />
                                <span>
                                  <span className="font-medium">{option.label}</span>
                                  <span className="block text-xs text-white/60">
                                    {option.description}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                            Internal floor area
                          </label>
                          <div className="mt-1 flex gap-2">
                            <input
                              type="number"
                              min={0}
                              step="0.1"
                              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                              placeholder="e.g. 1450"
                              value={refinement.floorArea}
                              onChange={(e) => handleRefinementChange("floorArea", e.target.value)}
                            />
                            <select
                              className="rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                              value={refinement.floorAreaUnit}
                              onChange={(e) => handleRefinementChange("floorAreaUnit", e.target.value)}
                            >
                              <option value="sqft">sq ft</option>
                              <option value="sqm">m²</option>
                            </select>
                          </div>
                          <p className="mt-1 text-xs text-white/50">
                            Enter the measured internal area for the best accuracy.
                          </p>
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                            Last major renovation
                          </label>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                            placeholder="2022"
                            value={refinement.renovationYear}
                            onChange={(e) => handleRefinementChange("renovationYear", e.target.value)}
                          />
                          <p className="mt-1 text-xs text-white/50">
                            Year of the most recent substantial refurbishment (leave blank if unsure).
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                          Additional notes
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                          rows={3}
                          placeholder="South-facing garden, bespoke joinery, underfloor heating, etc."
                          value={refinement.specialFeatureNotes}
                          onChange={(e) =>
                            handleRefinementChange("specialFeatureNotes", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex flex-wrap justify-end gap-3">
                        <button
                          type="submit"
                          className="rounded-xl bg-white text-black px-5 h-11 text-sm font-medium hover:bg-white/90"
                        >
                          Save details
                        </button>
                        <button
                          type="button"
                          onClick={handleRefinementReset}
                          className="rounded-xl border border-white/20 bg-white/5 px-5 h-11 text-sm font-medium text-white hover:bg-white/10 transition"
                        >
                          Reset
                        </button>
                      </div>
                      <p className="text-xs text-white/50">
                        Saved inputs adjust HOME AI heuristics. Connect a valuation partner to replace
                        this with live market data.
                      </p>
                      {refinementSavedAt && (
                        <p className="text-xs text-emerald-300">
                          Saved {new Date(refinementSavedAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      )}
                    </form>
                  )}
                </div>

                <div className="rounded-2xl bg-black/40 border border-white/10 p-4 flex flex-wrap gap-4 text-sm text-white/70">
                  <div>
                    <span className="block text-white/40 text-xs uppercase tracking-wide">Comparables analysed</span>
                    <span className="text-white text-base font-medium">{comparables.length || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-xs uppercase tracking-wide">Bedrooms factored</span>
                    <span className="text-white text-base font-medium">{subject?.beds ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-xs uppercase tracking-wide">Last updated</span>
                    <span className="text-white text-base font-medium">
                      {subject?._updatedAt
                        ? new Date(subject._updatedAt).toLocaleString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short"
                          })
                        : "Just now"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleProceed}
                className="rounded-xl bg-white text-black px-5 h-11 text-sm font-medium hover:bg-white/90"
              >
                I'm ready to list with HOME AI
              </button>
              <button
                onClick={() => navigate("/seller/how-home-ai-works")}
                className="rounded-xl border border-white/20 bg-white/5 px-5 h-11 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                How HOME AI works
              </button>
              <TalkToHomeAIButton
                onClick={() => alert("AI concierge coming soon — the team will follow up manually.")}
                className="h-11 px-5"
              />
              <button
                onClick={() => navigate("/seller/consultation")}
                className="rounded-xl border border-white/20 bg-white/5 px-5 h-11 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                Talk to an agent
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/30">
              <iframe
                title="Seller property map"
                src={mapSrc}
                className="w-full h-64 md:h-[320px] border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 space-y-4">
              <h3 className="text-lg font-semibold">Property snapshot</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-white/70">
                {propertyFacts.map((fact) => (
                  <div key={fact.label} className="space-y-1">
                    <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.2em]">
                      {fact.label}
                    </p>
                    <div className="text-white">{fact.value}</div>
                  </div>
                ))}
              </div>
              {soldNotes.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs uppercase tracking-wide text-white/45">Notable local completions</p>
                  <ul className="mt-2 space-y-1 text-sm text-white/70 list-disc list-inside">
                    {soldNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold">Comparable sales nearby</h2>
              <p className="text-sm text-white/60">
                Recent transactions that informed the valuation. Tap to open full details.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {comparables.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setActiveListing(comp)}
                className="min-w-[260px] text-left"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/30 transition">
                  <div className="h-40 relative">
                    <img
                      src={comp.hero || comp.photos?.[0]}
                      alt={comp.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs">
                      {comp.postcode}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-base font-medium line-clamp-2 min-h-[44px]">{comp.title}</h3>
                    <div className="text-sm text-white/70">
                      {comp.beds} beds • {comp.baths ?? "—"} baths
                    </div>
                    <div className="text-lg font-semibold">{formatAmount(comp.price)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-white/10 p-8 md:p-10">
          <div className="md:flex md:items-center md:justify-between gap-6 space-y-6 md:space-y-0">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Next steps</p>
              <h3 className="text-3xl font-semibold">Sell my home with HOME AI</h3>
              <p className="text-white/70 text-sm">
                Book a valuation visit, sync your data with the HOME CRM, and unlock automation for viewings,
                offers, and legal progression.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/seller/consultation")}
                className="rounded-xl bg-white text-black px-5 h-12 text-sm font-medium hover:bg-white/90"
              >
                Book an online consultation
              </button>
              <TalkToHomeAIButton
                onClick={() => alert("AI concierge coming soon — the team will follow up manually.")}
              />
            </div>
          </div>
        </section>
      </div>

      <ListingModal
        open={!!activeListing}
        onClose={() => setActiveListing(null)}
        listing={activeListing}
        onBook={() => setShowSignIn(true)}
        currency="GBP"
      />

      <GoogleSignIn
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignedIn={(session) => {
          if (session?.roles?.length) {
            window.location.href = "/crm";
          } else {
            setShowSignIn(false);
          }
        }}
      />
    </main>
  );
}

function SellerHowItWorks() {
  const navigate = useNavigate();
  const sellerProfile = useMemo(() => getSellerProfile(), []);
  const insights = useMemo(() => computeSellerInsights(sellerProfile), [sellerProfile]);
  const plan = determineSellerPlan(insights.valuation, insights.matched?.price);

  const steps = [
    {
      title: "1. Remote valuation",
      detail:
        "HOME AI analyses sold comparables, supply, and buyer demand to give you a guided range. Agents sanity-check before launch."
    },
    {
      title: "2. Compliance & onboarding",
      detail:
        "Upload proof of ownership and AML ID. Sign the agency agreement digitally and select your marketing package."
    },
    {
      title: "3. Launch & marketing",
      detail:
        "Our media partners capture photography, floorplans, and video. Listings syndicate to HOME AI, Rightmove, Zoopla, and partner networks."
    },
    {
      title: "4. AI + agent collaboration",
      detail:
        "Buyers book via the portal while AI surfaces hot leads, nudges feedback, and manages documents. Your agent stays in control."
    },
    {
      title: "5. Offers & progression",
      detail:
        "Offers are compared in one workspace with proof-of-funds, timelines, and solicitor details. AI remembers tasks; your agent negotiates."
    },
    {
      title: "6. Exchange & completion",
      detail:
        "We track conveyancing milestones, flag risks, and hand over to completion with weekly accountability updates."
    }
  ];

  const inclusions = plan.key === "premier"
    ? [
        "Full drone cinematography",
        "Overseas buyer syndication",
        "Premium portal positioning",
        "Weekly strategy reviews with lead partner"
      ]
    : [
        "Professional photography & floorplans",
        "Rightmove, Zoopla & HOME AI syndication",
        "Portable virtual viewings",
        "Dedicated sales progression assistant"
      ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-16">
      <HomeButton />
      <div className="max-w-5xl mx-auto px-6 pt-16 space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Seller playbook</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">How HOME AI sells your property</h1>
          <p className="mt-3 text-white/70 text-sm md:text-base max-w-3xl">
            Human expertise with machine intelligence: from valuation to exchange, every step blends personal agency oversight with AI-driven execution.
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Your recommended package</p>
              <h2 className="mt-1 text-2xl font-semibold">{plan.label}</h2>
              <p className="text-sm text-white/70 max-w-xl">{plan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Fees</p>
              <p className="mt-1 text-xl font-semibold text-white">
                £{plan.upfrontFee.toLocaleString()} upfront
              </p>
              <p className="text-sm text-white/70">+ {plan.successFeePercent}% on exchange</p>
            </div>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {inclusions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <div key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-white/70">{step.detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-white/10 p-8 space-y-4">
          <h2 className="text-2xl font-semibold">What you can expect</h2>
          <ul className="grid gap-3 md:grid-cols-2 text-sm text-white/75">
            <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-medium text-white">AI-assisted monitoring</p>
              <p className="mt-1 text-xs text-white/60">
                Real-time alerts on buyer activity, document requests, and conveyancing milestones.
              </p>
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-medium text-white">Agent expertise</p>
              <p className="mt-1 text-xs text-white/60">
                Senior agents strategise pricing, negotiate offers, and manage stakeholder relationships.
              </p>
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-medium text-white">Transparent reporting</p>
              <p className="mt-1 text-xs text-white/60">
                Dashboards synced with your seller workspace and weekly AI summaries to your inbox.
              </p>
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-medium text-white">Concierge-level marketing</p>
              <p className="mt-1 text-xs text-white/60">
                Media, styling, signage, and portal distribution managed end-to-end by our in-house studio.
              </p>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/seller/checkout")}
            className="rounded-xl bg-white text-black px-5 h-12 text-sm font-medium hover:bg-white/90"
          >
            Proceed to onboarding
          </button>
          <button
            onClick={() => navigate("/seller/valuation")}
            className="rounded-xl border border-white/20 bg-white/5 px-5 h-12 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            Back to valuation
          </button>
          <TalkToHomeAIButton
            onClick={() => navigate("/seller/consultation")}
            className="h-12 px-5"
          />
        </div>
      </div>
    </main>
  );
}

function SellerCheckout() {
  const navigate = useNavigate();
  const [sellerProfile, setSellerProfile] = useState(() => getSellerProfile());
  const insights = useMemo(() => computeSellerInsights(sellerProfile), [sellerProfile]);
  const plan = determineSellerPlan(insights.valuation, insights.matched?.price);

  useEffect(() => {
    if (!sellerProfile) navigate("/seller", { replace: true });
  }, [sellerProfile, navigate]);

  const [form, setForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    ownershipDoc: null,
    idDoc: null,
    confirmMatch: false,
    confirmAML: false,
    agreeTerms: false,
    signContract: false
  });
  const [errors, setErrors] = useState({});

  if (!sellerProfile) return null;

  const onFileChange = (key, file) => {
    setForm((prev) => ({ ...prev, [key]: file }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.cardName) e.cardName = "Enter name on card.";
    if (!form.cardNumber || form.cardNumber.replace(/\s+/g, "").length < 15) e.cardNumber = "Enter a valid card number.";
    if (!form.expiry) e.expiry = "Expiry required.";
    if (!form.cvc || form.cvc.length < 3) e.cvc = "CVC required.";
    if (!form.ownershipDoc) e.ownershipDoc = "Upload proof of ownership (Land Registry).";
    if (!form.idDoc) e.idDoc = "Upload photo ID for AML.";
    if (!form.confirmMatch) e.confirmMatch = "Confirm that ownership and ID details align.";
    if (!form.confirmAML) e.confirmAML = "Confirm AML documents are provided.";
    if (!form.agreeTerms) e.agreeTerms = "You must agree to the agency terms.";
    if (!form.signContract) e.signContract = "Electronically sign the agency agreement.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    const updated = updateSellerProfile({
      status: SellerStatus.ACTIVE,
      planKey: plan.key,
      onboardedAt: Date.now(),
      activeListingId: insights.matched?.id || null,
      contractSignedAt: Date.now(),
      paymentReference: `HOME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    });
    setSellerProfile(updated);
    navigate("/seller/checkout/success");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-16">
      <HomeButton />
      <div className="max-w-5xl mx-auto px-6 pt-16">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Seller onboarding</p>
            <h1 className="mt-2 text-3xl font-semibold">Secure your HOME AI marketing package</h1>
            <p className="mt-3 text-sm text-white/70 max-w-xl">
              Complete payment, e-sign the agency agreement, and upload AML documents to progress to launch.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Summary</p>
            <p className="mt-1 font-medium text-white">{plan.label}</p>
            <p>£{plan.upfrontFee.toLocaleString()} upfront • {plan.successFeePercent}% on exchange</p>
            <p className="mt-1 text-xs text-white/60">
              Listing: {insights.matched?.title || sellerProfile?.address || "TBC"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Payment details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Name on card</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.cardName}
                  onChange={(e) => setForm((prev) => ({ ...prev, cardName: e.target.value }))}
                  placeholder="Alex Taylor"
                />
                {errors.cardName && <p className="mt-1 text-xs text-red-400">{errors.cardName}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Card number</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.cardNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="4242 4242 4242 4242"
                />
                {errors.cardNumber && <p className="mt-1 text-xs text-red-400">{errors.cardNumber}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Expiry</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.expiry}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiry: e.target.value }))}
                  placeholder="MM/YY"
                />
                {errors.expiry && <p className="mt-1 text-xs text-red-400">{errors.expiry}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">CVC</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.cvc}
                  onChange={(e) => setForm((prev) => ({ ...prev, cvc: e.target.value }))}
                  placeholder="123"
                />
                {errors.cvc && <p className="mt-1 text-xs text-red-400">{errors.cvc}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Compliance documents</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Proof of ownership</label>
                <input
                  type="file"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  onChange={(e) => onFileChange("ownershipDoc", e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.png"
                />
                <p className="mt-1 text-xs text-white/60">Land Registry title deed or completion statement.</p>
                {errors.ownershipDoc && <p className="mt-1 text-xs text-red-400">{errors.ownershipDoc}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Photo ID (AML)</label>
                <input
                  type="file"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  onChange={(e) => onFileChange("idDoc", e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.png"
                />
                <p className="mt-1 text-xs text-white/60">Passport or driving licence for each beneficiary.</p>
                {errors.idDoc && <p className="mt-1 text-xs text-red-400">{errors.idDoc}</p>}
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/75">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmMatch}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmMatch: e.target.checked }))}
                />
                <span>
                  I confirm the ownership document matches the ID information provided and authorise HOME AI to run AML checks.
                </span>
              </label>
              {errors.confirmMatch && <p className="text-xs text-red-400 pl-6">{errors.confirmMatch}</p>}
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmAML}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmAML: e.target.checked }))}
                />
                <span>I have uploaded ID for all legal owners and confirm beneficial ownership.</span>
              </label>
              {errors.confirmAML && <p className="text-xs text-red-400 pl-6">{errors.confirmAML}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Agency agreement</h2>
            <div className="space-y-2 text-sm text-white/75">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
                />
                <span>
                  I have read and agree to the HOME AI agency terms including the {plan.successFeePercent}% success fee on exchange of contracts.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-400 pl-6">{errors.agreeTerms}</p>}
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.signContract}
                  onChange={(e) => setForm((prev) => ({ ...prev, signContract: e.target.checked }))}
                />
                <span>
                  I electronically sign the sole-agency agreement and authorise HOME AI to commence marketing immediately.
                </span>
              </label>
              {errors.signContract && <p className="text-xs text-red-400 pl-6">{errors.signContract}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h2 className="text-xl font-semibold text-white">Order summary</h2>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
              <span>Today&rsquo;s onboarding fee</span>
              <span className="text-2xl font-semibold text-white">
                £{plan.upfrontFee.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-white/60">
              Success fee of {plan.successFeePercent}% becomes payable on exchange of contracts and is deducted on completion.
            </div>
          </section>

          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="submit"
              className="rounded-xl bg-white text-black px-6 h-12 text-sm font-medium hover:bg-white/90"
            >
              Pay £{plan.upfrontFee.toLocaleString()} &amp; sign agreement
            </button>
            <button
              type="button"
              onClick={() => navigate("/seller/consultation")}
              className="rounded-xl border border-white/20 bg-white/5 px-6 h-12 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              Need help? Talk to an agent
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-xs text-white/60 space-y-2">
          <p>Payments are processed securely and a VAT receipt will be emailed immediately.</p>
          <p>Documents are stored with encrypted access. Your agent will review uploads within 1 business hour.</p>
        </div>
      </div>
    </main>
  );
}

function SellerCheckoutSuccess() {
  const navigate = useNavigate();
  const sellerProfile = useMemo(() => getSellerProfile(), []);
  const insights = useMemo(() => computeSellerInsights(sellerProfile), [sellerProfile]);

  if (!sellerProfile) return <Navigate to="/seller" replace />;

  const plan = determineSellerPlan(insights.valuation, insights.matched?.price);

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-16">
      <HomeButton />
      <div className="max-w-4xl mx-auto px-6 pt-20 space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">You're onboarded</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Welcome to the HOME AI seller network</h1>
          <p className="text-sm text-white/70">
            Our team has been notified. We&rsquo;ll finalise compliance checks and schedule media within the next business day.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-100 space-y-2">
          <p className="text-lg font-semibold text-white">Package confirmed: {plan.label}</p>
          <p>Payment reference: {sellerProfile.paymentReference || "Pending confirmation"}</p>
          <p>
            Upfront fee received: £{plan.upfrontFee.toLocaleString()} • Success fee: {plan.successFeePercent}% on exchange.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm text-white/70">
          {[
            "Media partner will contact you within 24 hours to arrange photography (and drone where applicable).",
            "Your seller workspace now shows marketing, viewings, offers, and AI companion chat.",
            "Upload any remaining property documents (EPC, warranties) via the workspace for faster progression."
          ].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate("/crm")}
            className="rounded-xl bg-white text-black px-6 h-12 text-sm font-medium hover:bg-white/90"
          >
            Open seller workspace
          </button>
          <button
            onClick={() => navigate("/seller/how-home-ai-works")}
            className="rounded-xl border border-white/20 bg-white/5 px-6 h-12 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            Review HOME AI playbook
          </button>
          <button
            onClick={() => navigate("/seller/consultation")}
            className="rounded-xl border border-white/20 bg-white/5 px-6 h-12 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            Schedule launch call
          </button>
        </div>
      </div>
    </main>
  );
}

function SellerConsultation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: ""
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Enter your name.";
    if (!isEmail(form.email)) e.email = "Enter a valid email.";
    if (!form.date) e.date = "Pick a preferred date.";
    if (!form.time) e.time = "Select a time slot.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-16">
      <HomeButton />
      <div className="max-w-3xl mx-auto px-6 pt-16 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Developer & seller support</p>
          <h1 className="mt-2 text-3xl font-semibold">Book a strategy call with a HOME agent</h1>
          <p className="mt-2 text-sm text-white/70">
            Choose a slot and we&rsquo;ll confirm a 30-minute video consultation to review your sale and marketing plan.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-100 text-sm">
            <p className="text-lg font-semibold text-white">Consultation requested</p>
            <p className="mt-2">
              We&rsquo;ll send a calendar invite to {form.email} with the meeting link. Need to update something?{" "}
              <button
                className="underline decoration-emerald-200"
                onClick={() => setSubmitted(false)}
              >
                Edit details
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Phone (optional)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Preferred date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
                {errors.date && <p className="mt-1 text-xs text-red-400">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Time (UK)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  value={form.time}
                  onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                >
                  <option value="">Select slot</option>
                  <option>09:00</option>
                  <option>11:30</option>
                  <option>14:00</option>
                  <option>17:00</option>
                </select>
                {errors.time && <p className="mt-1 text-xs text-red-400">{errors.time}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-white/50">Agenda / notes</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Tell us about your development, timelines, or anything you want to cover."
              />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="submit"
                className="rounded-xl bg-white text-black px-6 h-12 text-sm font-medium hover:bg-white/90"
              >
                Request consultation
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-white/20 bg-white/5 px-6 h-12 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

/* ----------------------- Media carousel (swipe + arrows, peek) ----------------------- */
function useSwipe(onLeft, onRight) {
  const startX = useRef(0);
  const endX = useRef(0);
  const onTouchStart = (e) => {
    startX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e) => {
    endX.current = e.changedTouches[0].clientX;
    const dx = endX.current - startX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) onLeft?.();
      else onRight?.();
    }
  };
  return { onTouchStart, onTouchEnd };
}

function MediaCarousel({ photos = [], video, onOpenFloor, onOpenMap, onOpenGallery }) {
  const slides = [
    ...(video ? [{ kind: "video", src: video }] : []),
    ...photos.map((p) => ({ kind: "img", src: p }))
  ];
  const [i, setI] = useState(0);
  if (!slides.length) return null;

  const next = () => setI((n) => (n + 1) % slides.length);
  const prev = () => setI((n) => (n - 1 + slides.length) % slides.length);
  const swipe = useSwipe(next, prev);

  const peekIdx = (i + 1) % slides.length;
  const peekSrc = slides[peekIdx]?.src;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden">
      <div className="relative h-[48vw] max-h-[460px] w-full" {...swipe}>
        {slides[i].kind === "video" ? (
          <video src={slides[i].src} controls className="h-full w-full object-cover" />
        ) : (
          <img src={slides[i].src} className="h-full w-full object-cover" alt="" />
        )}

        {peekSrc && (
          <div className="hidden sm:block absolute right-0 top-0 h-full w-20 opacity-70 pointer-events-none">
            <img src={peekSrc} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-white/80 to-transparent" />
          </div>
        )}

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
          aria-label="Previous media"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
          aria-label="Next media"
        >
          ›
        </button>

        <div className="absolute bottom-3 left-3 flex gap-2">
          <button onClick={onOpenGallery} className="px-2 py-1 text-xs rounded bg-white/90 hover:bg-white">
            Gallery
          </button>
          <button onClick={onOpenFloor} className="px-2 py-1 text-xs rounded bg-white/90 hover:bg-white">
            Floorplans
          </button>
          <button onClick={onOpenMap} className="px-2 py-1 text-xs rounded bg-white/90 hover:bg-white">
            Map
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Viewing form modal ----------------------- */
function ViewingFormModal({ open, onClose, listing }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", date: "", msg: "" });
  const [sent, setSent] = useState(false);
  const update = (k, v) => setF((s) => ({ ...s, [k]: v }));
  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!f.name || !isEmail(f.email)) return alert("Enter name and a valid email.");
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Book a viewing</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
            ✕
          </button>
        </div>
        {!sent ? (
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <div className="text-sm text-neutral-600">
              for <b>{listing?.title}</b>
            </div>
            <input
              className="border border-neutral-300 rounded-xl px-3 py-2"
              placeholder="Your name"
              value={f.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <input
              className="border border-neutral-300 rounded-xl px-3 py-2"
              placeholder="Email"
              value={f.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <input
              className="border border-neutral-300 rounded-xl px-3 py-2"
              placeholder="Phone"
              value={f.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <input
              className="border border-neutral-300 rounded-xl px-3 py-2"
              type="date"
              value={f.date}
              onChange={(e) => update("date", e.target.value)}
            />
            <textarea
              className="border border-neutral-300 rounded-xl px-3 py-2"
              rows={3}
              placeholder="Any preferences?"
              value={f.msg}
              onChange={(e) => update("msg", e.target.value)}
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-2xl bg-black text-white hover:bg-black/90">Submit</button>
              <TalkToHomeAIButton
                onClick={() => alert("Chat UI placeholder — connect your AI later")}
              />
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 p-4">
            Thanks! Your viewing request was sent. A confirmation will be emailed to you.
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------- Listing card ----------------------- */
function ListingCard({ l, onOpen, onBook, className = "", currency = "GBP" }) {
  const price = displayPrice(l, currency);
  return (
    <article
      className={
        "w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:shadow-sm flex flex-col " +
        className
      }
      style={{ minHeight: 380 }}
    >
      <div className="relative h-40 cursor-pointer" onClick={() => onOpen(l)}>
        <img src={l.hero || l.photos?.[0]} alt={l.title} className="w-full h-full object-cover" />
        {l.featured && (
          <span className="absolute top-2 left-2 rounded bg-black/70 text-white text-xs px-2 py-1">
            Featured
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-base font-medium line-clamp-2 min-h-[44px]">{l.title}</h3>
        <div className="text-neutral-600 text-sm">
          {l.area} • {l.postcode}
        </div>

        <div className="mt-1 font-semibold">
          <span>{price.text}</span>
        </div>

        <div className="text-neutral-600 text-sm flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Icon path={IBed} />
            {l.beds}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon path={IBath} />
            {l.baths}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpen(l)}
            className="border border-neutral-300 rounded-xl h-9 px-3 text-sm whitespace-nowrap hover:bg-neutral-100"
          >
            View details
          </button>
          <button
            onClick={() => onBook(l)}
            className="bg-black text-white rounded-xl h-9 px-3 text-sm whitespace-nowrap hover:bg-black/90"
          >
            Book viewing
          </button>
        </div>
      </div>
    </article>
  );
}

function FavButton({ listing }) {
  const [saved, setSaved] = useState(!!loadJSON(KEYS.FAVS, {})[listing.id]);
  const toggle = () => {
    const favs = loadJSON(KEYS.FAVS, {});
    if (favs[listing.id]) {
      delete favs[listing.id];
      setSaved(false);
    } else {
      favs[listing.id] = true;
      setSaved(true);
    }
    saveJSON(KEYS.FAVS, favs);
  };
  return (
    <button
      onClick={toggle}
      className={
        "px-3 py-2 rounded-xl border flex items-center gap-1 " +
        (saved ? "bg-black text-white border-black" : "border-neutral-300 hover:bg-neutral-100")
      }
    >
      <Icon path={IHeart} /> {saved ? "Saved" : "Save"}
    </button>
  );
}
function AlertButton({ listing }) {
  const [a, setA] = useState(!!loadJSON(KEYS.ALERTS, {})[listing.id]);
  const toggle = () => {
    const alerts = loadJSON(KEYS.ALERTS, {});
    if (alerts[listing.id]) {
      delete alerts[listing.id];
      setA(false);
    } else {
      alerts[listing.id] = true;
      setA(true);
    }
    saveJSON(KEYS.ALERTS, alerts);
  };
  return (
    <button
      onClick={toggle}
      className={
        "px-3 py-2 rounded-xl border " +
        (a ? "bg-black text-white border-black" : "border-neutral-300 hover:bg-neutral-100")
      }
    >
      {a ? "Alert on" : "Price-drop alert"}
    </button>
  );
}
function ShareButton({ listing, currency = DEFAULT_CCY }) {
  const share = async () => {
    const price = displayPrice(listing, currency);
    const text = `${listing.title} — ${price.text}`;
    const url = window.location.origin + "/buyer/discover";
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link copied!");
  };
  return (
    <button
      onClick={share}
      className="px-3 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 flex items-center gap-1"
    >
      <Icon path={IShare} /> Share
    </button>
  );
}
function AskAIButton({ listing }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TalkToHomeAIButton onClick={() => setOpen(true)} />
      {open && <AIChatModal onClose={() => setOpen(false)} listing={listing} />}
    </>
  );
}

/* ----------------------- AI Chat modal (preloaded Qs) ----------------------- */
function AIChatModal({ onClose, listing }) {
  const starter = [
    "Is the property still available and when is the earliest viewing?",
    "Are pets allowed / what’s the lease policy?",
    "What are the typical monthly costs (service charge, council tax, utilities)?",
    "Has there been a recent price change or offers?"
  ];
  const sample = [
    {
      role: "assistant",
      text: `Hi! I’m Home AI. Happy to answer anything about ${
        listing?.title || "this property"
      } or the buying journey.`
    },
    {
      role: "user",
      text: "Can I arrange a viewing for next Tuesday evening?"
    },
    {
      role: "assistant",
      text: "Absolutely — I’ll share your preferred time with the team and email you a confirmation shortly."
    }
  ];
  return (
    <div
      className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-white/60">Home AI</div>
            <div className="mt-1 text-lg font-semibold">
              Ask about <span className="text-white/90">{listing?.title || "your property search"}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 transition px-3 py-1 text-sm">
            Close
          </button>
        </div>
        <div className="bg-white p-5 grid gap-5 md:grid-cols-[minmax(0,1fr),260px]">
          <div className="flex h-[380px] flex-col rounded-2xl bg-neutral-950 text-white shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-white/70">
              <span>Property assistant • beta</span>
              <span className="inline-flex items-center gap-1 text-white/60 text-xs bg-white/5 px-2 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
              {sample.map((m, i) => (
                <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={
                      "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                      (m.role === "assistant" ? "bg-white/10 text-white" : "bg-emerald-500/90 text-white shadow-lg")
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 px-3 py-3">
              <form className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm placeholder-white/40 text-white focus:outline-none focus:border-emerald-400"
                    placeholder="Type a message…"
                    disabled
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">demo</span>
                </div>
                <button
                  type="button"
                  disabled
                  className="rounded-2xl bg-emerald-500/90 text-white px-4 py-3 text-sm font-medium opacity-70 cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-sm font-medium mb-2 text-neutral-900">Quick questions</div>
            <ul className="space-y-2 text-sm text-neutral-700">
              {starter.map((q, i) => (
                <li
                  key={i}
                  className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition cursor-pointer"
                >
                  {q}
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-neutral-500">
              This chat is a visual prototype — wire it to your AI service to go live.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Listing modal (media scrolls with page) ----------------------- */
function ListingModal({ open, onClose, listing, onBook, currency = DEFAULT_CCY }) {
  const [saved, setSaved] = useState(false);
  const [alerted, setAlerted] = useState(false);

  const galleryRef = useRef(null);
  const floorRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!open || !listing?.id) return;
    const views = loadJSON(KEYS.VIEWS, {});
    const arr = views[listing.id] || [];
    arr.push(Date.now());
    views[listing.id] = arr;
    saveJSON(KEYS.VIEWS, views);

    const favs = loadJSON(KEYS.FAVS, {});
    const alerts = loadJSON(KEYS.ALERTS, {});
    setSaved(!!favs[listing.id]);
    setAlerted(!!alerts[listing.id]);
  }, [open, listing?.id]);

  if (!open || !listing) return null;

  const price = displayPrice(listing, currency);

  const toggleFav = () => {
    const favs = loadJSON(KEYS.FAVS, {});
    if (favs[listing.id]) {
      delete favs[listing.id];
      setSaved(false);
    } else {
      favs[listing.id] = true;
      setSaved(true);
    }
    saveJSON(KEYS.FAVS, favs);
  };
  const toggleAlert = () => {
    const alerts = loadJSON(KEYS.ALERTS, {});
    if (alerts[listing.id]) {
      delete alerts[listing.id];
      setAlerted(false);
    } else {
      alerts[listing.id] = true;
      setAlerted(true);
    }
    saveJSON(KEYS.ALERTS, alerts);
  };
  const share = async () => {
    const text = `${listing.title} — ${price.text}`;
    const url = window.location.origin + "/buyer/discover";
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link copied!");
  };
  const scrollInto = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const internal =
    listing.internal_m2 ? `${listing.internal_m2} m²` : listing.internal_sqft ? `${listing.internal_sqft} sqft` : null;
  const external =
    listing.external_m2 ? `${listing.external_m2} m²` : listing.external_sqft ? `${listing.external_sqft} sqft` : null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="p-4 bg-white border-b border-neutral-200">
          <h3 className="text-xl font-semibold">{listing.title}</h3>
          <div className="text-neutral-600">
            {listing.area} • {listing.postcode}
          </div>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <Icon path={IPrice} />
            <span>{price.text}</span>
          </div>
        </div>

        {/* media scrolls with content */}
        <div className="p-4">
          <MediaCarousel
            photos={listing.photos || (listing.hero ? [listing.hero] : [])}
            video={listing.video}
            onOpenGallery={() => scrollInto(galleryRef)}
            onOpenFloor={() => scrollInto(floorRef)}
            onOpenMap={() => scrollInto(mapRef)}
          />
        </div>

        {/* actions row */}
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          <button
            onClick={toggleFav}
            className={
              "px-3 py-2 rounded-xl border flex items-center gap-1 " +
              (saved ? "bg-black text-white border-black" : "border-neutral-300 hover:bg-neutral-100")
            }
          >
            <Icon path={IHeart} />
            <span>{saved ? "Saved ✓" : "Save favourite"}</span>
          </button>
          <button
            onClick={toggleAlert}
            className={
              "px-3 py-2 rounded-xl border flex items-center gap-1 " +
              (alerted ? "bg-black text-white border-black" : "border-neutral-300 hover:bg-neutral-100")
            }
          >
            <Icon path={IPrice} />
            <span>{alerted ? "Alert active ✓" : "Alert me if price drops"}</span>
          </button>
          <button onClick={share} className="px-3 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100">
            Share
          </button>
          <AskAIButton listing={listing} />
          <div className="ml-auto">
            <button onClick={() => onBook(listing)} className="px-4 py-2 rounded-2xl bg-black text-white hover:bg-black/90">
              Book a viewing
            </button>
          </div>
        </div>

        {/* details box */}
        <div className="p-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h4 className="font-medium mb-3">Details</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              {listing.type && (
                <div className="flex items-center gap-2">
                  <Icon path={<path d="M4 10h16v10H4z M8 10V6h8v4" />} /> <b>Type:</b> {listing.type}
                </div>
              )}
              {listing.tenure && (
                <div className="flex items-center gap-2">
                  <Icon path={<path d="M6 20h12M12 4v12M8 8h8" />} /> <b>Tenure:</b> {listing.tenure}
                </div>
              )}
              {listing.leaseYearsRemaining != null && <div><b>Lease remaining:</b> {listing.leaseYearsRemaining} years</div>}
              {listing.beds != null && (
                <div className="flex items-center gap-2">
                  <Icon path={IBed} /> <b>Bedrooms:</b> {listing.beds}
                </div>
              )}
              {listing.baths != null && (
                <div className="flex items-center gap-2">
                  <Icon path={IBath} /> <b>Bathrooms:</b> {listing.baths}
                </div>
              )}
              {internal && (
                <div className="flex items-center gap-2">
                  <Icon path={IArea} /> <b>Internal:</b> {internal}
                </div>
              )}
              {external && (
                <div className="flex items-center gap-2">
                  <Icon path={IArea} /> <b>External:</b> {external}
                </div>
              )}
              {listing.council_tax_band && <div><b>Council tax band:</b> {listing.council_tax_band}</div>}
              {listing.parking && <div><b>Parking:</b> {listing.parking}</div>}
              {listing.broadband_mbps && <div><b>Broadband:</b> {listing.broadband_mbps} Mbps</div>}
              {listing.garden && <div><b>Outside space:</b> {listing.garden}</div>}
              {listing.epc_link && (
                <div>
                  <a href={listing.epc_link} target="_blank" className="underline underline-offset-2">
                    View EPC
                  </a>
                </div>
              )}
              {listing.brochure && (
                <div>
                  <a href={listing.brochure} target="_blank" className="underline underline-offset-2">
                    Download brochure
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* description */}
          {listing.description && (
            <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
              <h4 className="font-medium mb-3">Description</h4>
              <p className="leading-relaxed">{listing.description}</p>
            </section>
          )}

          {/* features */}
          {listing.features?.length ? (
            <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
              <h4 className="font-medium mb-3">Key features</h4>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm list-disc pl-5">
                {listing.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* gallery */}
          {(listing.photos?.length || listing.hero) && (
            <section ref={galleryRef} className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4" id="gallery">
              <h4 className="font-medium mb-3">Gallery</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {(listing.photos?.length ? listing.photos : [listing.hero]).map((p, i) => (
                  <img key={i} src={p} alt="" className="h-40 w-64 object-cover rounded-xl snap-start" />
                ))}
              </div>
            </section>
          )}

          {/* floorplans */}
          {listing.floorplans?.length ? (
            <section ref={floorRef} className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4" id="floorplans">
              <h4 className="font-medium mb-3">Floorplans</h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {listing.floorplans.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt="Floorplan"
                    className="h-72 object-contain rounded-xl border border-neutral-200 bg-white"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* nearby */}
          {(listing.nearest_stations?.length ||
            listing.nearest_schools?.length ||
            listing.sold_nearby?.length) && (
            <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
              <h4 className="font-medium mb-3">Nearby</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {listing.nearest_stations?.length ? (
                  <div>
                    <div className="font-medium mb-1">Stations</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {listing.nearest_stations.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {listing.nearest_schools?.length ? (
                  <div>
                    <div className="font-medium mb-1">Schools</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {listing.nearest_schools.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {listing.sold_nearby?.length ? (
                  <div>
                    <div className="font-medium mb-1">Sold nearby</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {listing.sold_nearby.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {/* map */}
          {listing.lat && listing.lng ? (
            <section ref={mapRef} className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4" id="map">
              <h4 className="font-medium mb-3">Map</h4>
              <div className="rounded-xl overflow-hidden border border-neutral-200 relative">
                <iframe
                  title="map"
                  width="100%"
                  height="320"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.lng - 0.01}%2C${
                    listing.lat - 0.01
                  }%2C${listing.lng + 0.01}%2C${listing.lat + 0.01}&layer=mapnik&marker=${listing.lat}%2C${
                    listing.lng
                  }`}
                />
              </div>
            </section>
          ) : null}
        </div>

        <button onClick={onClose} className="absolute right-3 top-3 bg-black/70 text-white rounded-full p-2">
          ✕
        </button>
      </div>
    </div>
  );
}

/* ----------------------- Buyer (search hero) ----------------------- */
function BuyerStart() {
  const [openAI, setOpenAI] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [form, setForm] = useState({ budgetMax: "", areas: "", email: "" });
  const [errors, setErrors] = useState({});
  const [more, setMore] = useState(false);
  const [mapBrowse, setMapBrowse] = useState(false);
  const [draw, setDraw] = useState(false);
  const navigate = useNavigate();
  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.budgetMax && !isNumber(form.budgetMax)) e.budgetMax = "Budget must be a number (e.g., 1500000).";
    if (!isEmail(form.email)) e.email = "Enter a valid email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    saveSection("buyer", form);
    saveSearch(form);
    navigate("/buyer/discover");
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6 relative">
      <HomeButton />
      <div className="absolute right-6 top-6">
        <button
          onClick={() => setOpenLogin(true)}
          className="rounded-xl px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-100"
        >
          Login
        </button>
      </div>

      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-3xl mt-20 md:mt-28">
          <h2 className="text-center text-3xl font-semibold">Find your next home</h2>
          <p className="text-center text-neutral-600 mt-1">Know your requirements? Select from the following.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <input
                className="bg-white border border-neutral-200 rounded-xl px-4 py-3"
                placeholder="Budget max (£)"
                value={form.budgetMax}
                onChange={(e) => update("budgetMax", e.target.value)}
              />
              <input
                className="bg-white border border-neutral-200 rounded-xl px-4 py-3"
                placeholder="Areas (e.g., W8, SW3, Manchester)"
                value={form.areas}
                onChange={(e) => update("areas", e.target.value)}
              />
              <input
                className="bg-white border border-neutral-200 rounded-xl px-4 py-3"
                placeholder="Email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            {Object.values(errors).length > 0 && (
              <div className="text-red-600 text-sm">{Object.values(errors)[0]}</div>
            )}

            {/* additional filters */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Additional filters</div>
                <button type="button" onClick={() => setMore((v) => !v)} className="text-sm underline">
                  {more ? "Hide" : "See more"}
                </button>
              </div>
              {more && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                  <select className="border border-neutral-300 rounded-xl px-3 py-2">
                    <option value="">Property type</option>
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Mews</option>
                    <option>Penthouse</option>
                    <option>Bungalow</option>
                  </select>
                  <select className="border border-neutral-300 rounded-xl px-3 py-2">
                    <option value="">Bedrooms</option>
                    <option>1+</option>
                    <option>2+</option>
                    <option>3+</option>
                    <option>4+</option>
                    <option>5+</option>
                  </select>
                  <select className="border border-neutral-300 rounded-xl px-3 py-2">
                    <option value="">Bathrooms</option>
                    <option>1+</option>
                    <option>2+</option>
                    <option>3+</option>
                    <option>4+</option>
                  </select>
                  <select className="border border-neutral-300 rounded-xl px-3 py-2">
                    <option value="">Outside space</option>
                    <option>Balcony/Terrace</option>
                    <option>Garden</option>
                    <option>Roof terrace</option>
                  </select>
                  <select className="border border-neutral-300 rounded-xl px-3 py-2">
                    <option value="">Tenure</option>
                    <option>Freehold</option>
                    <option>Leasehold</option>
                    <option>Share of Freehold</option>
                  </select>
                  <select className="border border-neutral-300 rounded-xl px-3 py-2">
                    <option value="">Parking</option>
                    <option>On-street</option>
                    <option>Off-street</option>
                    <option>Garage</option>
                    <option>Permit</option>
                  </select>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> New build
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> Lift / step-free
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> Concierge
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> Pets allowed
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-center">
              <button className="bg-black text-white rounded-xl px-5 h-12 min-w-[150px] font-medium hover:bg-black/90 flex items-center justify-center">
                Next
              </button>
              <TalkToHomeAIButton onClick={() => setOpenAI(true)} className="min-w-[150px]" />
              <button
                type="button"
                onClick={() => setMapBrowse((v) => !v)}
                className="rounded-xl px-5 h-12 min-w-[150px] border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center"
              >
                {mapBrowse ? "Hide Map view" : "Map view (beta)"}
              </button>
            </div>
          </form>

          {/* feature cards w/ icons */}
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {[
              { title: "Save favourites", desc: "Keep track of homes you love and revisit anytime.", icon: "♥" },
              { title: "Price-drop alerts", desc: "We’ll notify you if a saved home reduces in price.", icon: "£" },
              { title: "Shortlist", desc: "Build a shortlist to compare and share.", icon: <path d="M6 9l4 4 8-8M4 19h16" /> },
              { title: "Share easily", desc: "Send a link to family or your buying agent.", icon: IShare },
              { title: "Map browse", desc: "See homes in areas you care about.", icon: IMapPin }
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  {typeof f.icon === "string" ? (
                    <span className="text-xl font-semibold text-neutral-900">{f.icon}</span>
                  ) : (
                    <Icon path={f.icon} />
                  )}
                  <div className="font-medium">{f.title}</div>
                </div>
                <div className="text-neutral-600 text-sm mt-1">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* map browse + draw overlay */}
          {mapBrowse && <DrawMap draw={draw} setDraw={setDraw} />}
        </div>
      </div>

      {openAI && <AIChatModal onClose={() => setOpenAI(false)} listing={{ title: "General search" }} />}
      <GoogleSignIn
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        onSignedIn={(session) => {
          if (session?.roles?.length) {
            window.location.href = "/crm";
          }
        }}
      />
    </main>
  );
}

/* simple OSM iframe with canvas overlay to draw (beta) */
function DrawMap({ draw, setDraw }) {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    if (points.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points.current[0].x, points.current[0].y);
      for (let i = 1; i < points.current.length; i++) ctx.lineTo(points.current[i].x, points.current[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });

  const start = (x, y) => {
    drawing.current = true;
    points.current = [{ x, y }];
  };
  const move = (x, y) => {
    if (!drawing.current) return;
    points.current.push({ x, y });
  };
  const stop = () => {
    drawing.current = false;
  };

  return (
    <div className="mt-8 rounded-2xl border border-neutral-200 overflow-hidden relative">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="text-sm">Map view (beta)</div>
        <div className="flex gap-2">
          <button
            onClick={() => setDraw((v) => !v)}
            className={
              "rounded-xl px-3 py-1 border " +
              (draw ? "bg-black text-white border-black" : "border-neutral-300 bg-white hover:bg-neutral-100")
            }
          >
            {draw ? "Finish drawing" : "Draw area (beta)"}
          </button>
          <button
            onClick={() => {
              points.current = [];
            }}
            className="rounded-xl px-3 py-1 border border-neutral-300 bg-white hover:bg-neutral-100"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="relative w-full h-[380px]">
        <iframe title="UK Map" src="https://www.openstreetmap.org/export/embed.html" className="w-full h-full" />
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="absolute inset-0 w-full h-full"
          onMouseDown={(e) => draw && start(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onMouseMove={(e) => draw && move(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={(e) => {
            if (!draw) return;
            const t = e.changedTouches[0];
            const r = e.currentTarget.getBoundingClientRect();
            start(t.clientX - r.left, t.clientY - r.top);
          }}
          onTouchMove={(e) => {
            if (!draw) return;
            const t = e.changedTouches[0];
            const r = e.currentTarget.getBoundingClientRect();
            move(t.clientX - r.left, t.clientY - r.top);
          }}
          onTouchEnd={stop}
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}


/* ----------------------- Buyer Discover ----------------------- */
function BuyerDiscover() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookListing, setBookListing] = useState(null);
  const [openLogin, setOpenLogin] = useState(false);
  const [showCount, setShowCount] = useState(16);
  const [currency, setCurrency] = useCurrency();

  const search = latestSearch();
  const budgetMaxValue = Number(search?.budgetMax || 0);
  const displayBudget = formatAmount(
    convertAmount(Number.isFinite(budgetMaxValue) ? budgetMaxValue : 0, "GBP", currency),
    currency
  );

  const matches = useMemo(() => {
    if (!search) return LISTINGS;
    return LISTINGS.filter((l) => listingMatches(search, l));
  }, [search]);

  const featured = useMemo(() => LISTINGS.filter((l) => l.featured), []);

  const mostViewed = useMemo(() => {
    const views = loadJSON(KEYS.VIEWS, {});
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const scores = Object.entries(views).map(([id, arr]) => [id, arr.filter((t) => t >= since).length]);
    const sorted = scores.sort((a, b) => b[1] - a[1]).slice(0, 8);
    const byId = Object.fromEntries(LISTINGS.map((l) => [String(l.id), l]));
    return sorted.map(([id]) => byId[String(id)]).filter(Boolean);
  }, []);

  const openListing = (l) => {
    setActive(l);
    setOpen(true);
  };
  const closeListing = () => {
    setOpen(false);
    setActive(null);
  };

  const openBooking = (l) => {
    setBookListing(l);
    setBookOpen(true);
  };
  const closeBooking = () => {
    setBookOpen(false);
    setBookListing(null);
  };

  const collections = [
    { name: "Airbnb-friendly", filter: (l) => /apartment|penthouse|mews/i.test(l.type || "") },
    { name: "Waterfront", filter: (l) => /harbour|marina|dock|quay|sea/i.test((l.title || "") + " " + (l.area || "")) },
    { name: "New build", filter: (l) => l.features?.some((f) => /new build/i.test(f)) },
    { name: "Family homes", filter: (l) => (l.beds || 0) >= 3 && /house|mews/i.test(l.type || "") }
  ];
  const collectionPicks = collections
    .map((c) => ({
      name: c.name,
      items: LISTINGS.filter(c.filter).slice(0, 4)
    }))
    .filter((c) => c.items.length);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <HomeButton />
      <div className="max-w-6xl mx-auto mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[220px]">
            <h2 className="text-3xl font-semibold">Discover</h2>
            <p className="text-neutral-600 mt-1">
              {search ? (
                <>
                  Showing matches for <b>{displayBudget}</b> max in <b>{search.areas || "All areas"}</b>
                </>
              ) : (
                <>No saved search yet — set one up to personalise your feed.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <CurrencySwitcher value={currency} onChange={setCurrency} />
            <button
              onClick={() => navigate("/buyer")}
              className="border border-neutral-300 rounded-xl px-4 py-2 hover:bg-neutral-100"
            >
              Edit search
            </button>
            <button
              onClick={() => setOpenLogin(true)}
              className="rounded-xl px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-100"
            >
              Login
            </button>
            <TalkToHomeAIButton onClick={() => alert("Chat UI placeholder — wire to your AI later")} />
          </div>
        </div>

        {featured.length > 0 && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-semibold">Featured listings</h3>
              <span className="text-sm text-neutral-500">Swipe →</span>
            </div>
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {featured.map((l) => (
                <div key={l.id} className="min-w-[260px] max-w-[260px] snap-start">
                  <ListingCard l={l} onOpen={openListing} onBook={openBooking} currency={currency} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h3 className="text-lg font-medium">All listings</h3>
          {matches.length === 0 && (
            <div className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-700">
              <div className="text-base font-medium">No matches yet</div>
              <div className="text-sm mt-1">
                Try broadening your areas or budget — meanwhile, here’s everything on the market:
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {matches.slice(0, showCount).map((l) => (
                  <ListingCard key={l.id} l={l} onOpen={openListing} onBook={openBooking} currency={currency} />
                ))}
              </div>
              {matches.length > showCount && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowCount((n) => n + 16)}
                    className="rounded-xl px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-100"
                  >
                    Show more
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {matches.length === 0 && (
          <section className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {LISTINGS.map((l) => (
                <ListingCard key={l.id} l={l} onOpen={openListing} onBook={openBooking} currency={currency} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h3 className="text-lg font-medium">Most viewed in the last 7 days</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(mostViewed.length ? mostViewed : LISTINGS.slice(0, 8)).map((l) => (
              <ListingCard key={l.id} l={l} onOpen={openListing} onBook={openBooking} currency={currency} />
            ))}
          </div>
        </section>

        {collectionPicks.length > 0 && (
          <section className="mt-10">
            <h3 className="text-lg font-medium">Collections</h3>
            {collectionPicks.map((c, idx) => (
              <div key={idx} className="mt-4">
                <div className="text-sm text-neutral-600 mb-2">{c.name}</div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {c.items.map((l) => (
                    <ListingCard key={l.id} l={l} onOpen={openListing} onBook={openBooking} currency={currency} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      <ListingModal open={open} onClose={closeListing} listing={active} onBook={openBooking} currency={currency} />
      <ViewingFormModal open={bookOpen} onClose={closeBooking} listing={bookListing} />
      <GoogleSignIn
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        onSignedIn={(session) => {
          if (session?.roles?.length) {
            window.location.href = "/crm";
          }
        }}
      />
    </main>
  );
}

/* ----------------------- Thanks + Admin ----------------------- */
function SellerThanks() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 grid place-items-center">
      <HomeButton />
      <div className="text-center max-w-md">
        <h2 className="text-3xl font-semibold">Thanks — we’ve got it</h2>
        <p className="mt-2 text-white/70">We’ll review your details and contact you to book an appraisal.</p>
        <a href="/" className="inline-block mt-6 border border-white/20 rounded-xl px-5 py-3 hover:border-white/40">
          Back to home
        </a>
      </div>
    </main>
  );
}

function BuyerThanks() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6 grid place-items-center">
      <HomeButton />
      <div className="text-center max-w-md">
        <h2 className="text-3xl font-semibold">You’re on the list</h2>
        <p className="mt-2 text-neutral-600">We’ll send matches in your areas and budget.</p>
        <a href="/" className="inline-block mt-6 border border-neutral-300 rounded-xl px-5 py-3 hover:bg-neutral-100">
          Back to home
        </a>
      </div>
    </main>
  );
}

function AdminCrmApp({ session }) {
  const navItems = [
    { to: "/crm/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/crm/listings", label: "Listings", icon: "📋" },
    { to: "/crm/contacts", label: "Contacts", icon: "👥" },
    { to: "/crm/viewings", label: "Viewings", icon: "🗓️" },
    { to: "/crm/offers", label: "Offers", icon: "💬" },
    { to: "/crm/sales", label: "Sales", icon: "🔁" },
    { to: "/crm/letters", label: "Letters", icon: "✉️" },
    { to: "/crm/settings", label: "Settings", icon: "⚙️" }
  ];

  const title = sessionHasRole(session, Roles.ADMIN) ? "Admin control centre" : "Agent workspace";

  return (
    <Routes>
      <Route element={<CrmLayout session={session} navItems={navItems} title={title} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CrmDashboardPage />} />
        <Route path="listings" element={<CrmListingsPage />} />
        <Route path="contacts" element={<CrmContactsPage />} />
        <Route path="viewings" element={<CrmViewingsPage />} />
        <Route path="offers" element={<CrmOffersPage />} />
        <Route path="sales" element={<CrmSalesPage />} />
        <Route path="letters" element={<CrmLettersPage />} />
        <Route path="settings" element={<CrmSettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function CrmRouter() {
  const session = useCurrentSession();
  if (!session) return <Navigate to="/" replace />;

  if (sessionHasRole(session, Roles.ADMIN) || sessionHasRole(session, Roles.AGENT)) {
    return <AdminCrmApp session={session} />;
  }

  if (sessionHasRole(session, Roles.SELLER) && sessionHasRole(session, Roles.BUYER)) {
    return <BuyerSellerPortal session={session} />;
  }

  if (sessionHasRole(session, Roles.SELLER)) {
    return <SellerPortal session={session} />;
  }

  if (sessionHasRole(session, Roles.BUYER)) {
    return <BuyerPortal session={session} />;
  }

  return <Navigate to="/" replace />;
}

function AdminConsole() {
  const mockUsers = [
    {
      email: "seller@test.com",
      name: "Seller Summit",
      role: "Seller",
      status: "Active",
      listings: ["w8-123"]
    },
    {
      email: "valuation@test.com",
      name: "Valuation Preview",
      role: "Seller",
      status: "Prospect",
      listings: []
    },
    {
      email: "buyer@test.com",
      name: "Buyer Beta",
      role: "Buyer",
      status: "Engaged",
      listings: []
    },
    {
      email: "buyerseller@test.com",
      name: "Hybrid Hero",
      role: "Buyer & Seller",
      status: "Active",
      listings: ["w8-123"]
    },
    {
      email: "agent@test.com",
      name: "Agent Apex",
      role: "Agent",
      status: "Team",
      listings: LISTINGS.slice(0, 2).map((l) => l.id)
    }
  ];

  const listingById = useMemo(
    () => Object.fromEntries(LISTINGS.map((listing) => [listing.id, listing])),
    []
  );

  const [assignForm, setAssignForm] = useState({
    userEmail: mockUsers[0]?.email || "",
    listingId: LISTINGS[0]?.id || ""
  });
  const [assignmentLog, setAssignmentLog] = useState([]);
  const [newListingForm, setNewListingForm] = useState({
    title: "",
    price: "",
    ownerEmail: mockUsers.find((user) => user.role.includes("Seller"))?.email || ""
  });
  const [listingLog, setListingLog] = useState([]);

  const handleAssignListing = () => {
    if (!assignForm.userEmail || !assignForm.listingId) return;
    const entry = {
      userEmail: assignForm.userEmail,
      listingId: assignForm.listingId,
      timestamp: Date.now()
    };
    setAssignmentLog((prev) => [entry, ...prev.slice(0, 9)]);
    alert("Linked listing to user (demo only).");
  };

  const handleMockUpload = () => {
    if (!newListingForm.title.trim()) return;
    const entry = {
      title: newListingForm.title.trim(),
      price: newListingForm.price.trim(),
      ownerEmail: newListingForm.ownerEmail,
      timestamp: Date.now()
    };
    setListingLog((prev) => [entry, ...prev.slice(0, 9)]);
    setNewListingForm((prev) => ({ ...prev, title: "", price: "" }));
    alert("Stored draft listing details for agent review (demo only).");
  };

  const userAssignments = useMemo(() => {
    const base = mockUsers.map((user) => ({
      ...user,
      assignedListings: [...(user.listings || [])]
    }));
    assignmentLog.forEach((entry) => {
      const user = base.find((candidate) => candidate.email === entry.userEmail);
      if (user && !user.assignedListings.includes(entry.listingId)) {
        user.assignedListings.push(entry.listingId);
      }
    });
    return base;
  }, [mockUsers, assignmentLog]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <HomeButton />
      <div className="max-w-6xl mx-auto">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Home / The Break Co.</p>
          <h1 className="text-3xl font-semibold text-white">Internal CRM Blueprint</h1>
          <p className="text-slate-400 max-w-3xl">
            You are a senior full-stack engineer. Build an end-to-end real-estate CRM inspired by Street/Rex
            that powers agent, seller, and buyer workflows for the HOME collective. This brief outlines the full
            product surface area to plan against.
          </p>
        </header>
        <div className="mt-8 space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-3">1) High-level App Goals</h2>
            <p className="text-slate-200 text-sm mb-3">
              Deliver a connected CRM experience with portals tailored per persona and bi-directional data links
              across listings, contacts, viewings, offers, sales progression, documents, and activity.
            </p>
            <ul className="text-slate-200 text-sm space-y-2 list-disc pl-6">
              <li>Agents: full-funnel control — listings, viewings, offers, sales progression, comms, reporting.</li>
              <li>Sellers: transparent portal with documents, feedback, offers, milestones, availability controls.</li>
              <li>Buyers: discovery portal with search, save/share, viewings, offers, updates.</li>
              <li>Ensure every entity is linkable (e.g., viewing ↔ attendees, offers ↔ sales progression).
              </li>
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              Tech stack: React, React Router, Tailwind, shadcn/ui, Framer Motion · Node.js (Express + TypeScript) ·
              PostgreSQL with Prisma · Google OAuth → JWT sessions · S3-compatible storage · Gmail API · Google Calendar sync ·
              Xero (phase 2) · Monorepo via pnpm workspaces · Docker · Render deploy · CI with GitHub Actions.
            </p>
          </section>

          {/* Additional blueprint sections preserved as in original design */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">User directory</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Internal use
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-200">
                <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Linked listings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {userAssignments.map((user) => (
                    <tr key={user.email}>
                      <td className="py-2 pr-4 text-white">{user.name}</td>
                      <td className="py-2 pr-4 text-white/70">{user.email}</td>
                      <td className="py-2 pr-4">{user.role}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] " +
                            (user.status === "Active"
                              ? "bg-emerald-500/15 text-emerald-200"
                              : user.status === "Prospect"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-white/10 text-white/60")
                          }
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-white/70">
                        {user.assignedListings.length
                          ? user.assignedListings
                              .map((id) => listingById[id]?.title || id)
                              .join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">Link listings to users</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Agent tools
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm text-white/80">
              <select
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 focus:border-white/40 focus:outline-none"
                value={assignForm.userEmail}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, userEmail: e.target.value }))}
              >
                {mockUsers.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.name} — {user.role}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 focus:border-white/40 focus:outline-none"
                value={assignForm.listingId}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, listingId: e.target.value }))}
              >
                {LISTINGS.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} ({listing.postcode})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignListing}
                className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition"
              >
                Link listing
              </button>
            </div>
            {assignmentLog.length > 0 && (
              <ul className="text-xs text-slate-400 space-y-1">
                {assignmentLog.map((entry, idx) => (
                  <li key={`${entry.userEmail}-${entry.listingId}-${idx}`}>
                    {new Date(entry.timestamp).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}{" "}
                    — Linked {listingById[entry.listingId]?.title || entry.listingId} to{" "}
                    {entry.userEmail}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">Upload new listing draft</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Internal draft</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm text-white/80">
              <input
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 focus:border-white/40 focus:outline-none"
                placeholder="Listing headline"
                value={newListingForm.title}
                onChange={(e) => setNewListingForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 focus:border-white/40 focus:outline-none"
                placeholder="Guide price (£)"
                value={newListingForm.price}
                onChange={(e) => setNewListingForm((prev) => ({ ...prev, price: e.target.value }))}
              />
              <select
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 focus:border-white/40 focus:outline-none"
                value={newListingForm.ownerEmail}
                onChange={(e) => setNewListingForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
              >
                {mockUsers
                  .filter((user) => user.role.toLowerCase().includes("seller"))
                  .map((user) => (
                    <option key={user.email} value={user.email}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleMockUpload}
              className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition"
            >
              Save draft listing
            </button>
            {listingLog.length > 0 && (
              <ul className="text-xs text-slate-400 space-y-1">
                {listingLog.map((entry, idx) => (
                  <li key={idx}>
                    {new Date(entry.timestamp).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}{" "}
                    — Draft “{entry.title}” recorded for {entry.ownerEmail || "unassigned"} at {entry.price || "£TBC"}
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function DevRoleToggle() {
  const session = useCurrentSession();
  const [_, force] = useState(0);

  const setMockSession = (email) => {
    const account = MOCK_ACCOUNTS.find((acc) => acc.email === email);
    if (account) {
      signInSession({
        email: account.email,
        name: account.name,
        avatar: account.avatar,
        roles: account.roles,
        provider: "dev"
      });
      force((n) => n + 1);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80]">
      <div className="text-[10px] text-white/60 mb-1">
        dev session: {deriveSessionLabel(session)}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => {
            clearSession();
            force((n) => n + 1);
          }}
        >
          guest
        </button>
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => {
            signInSession({
              email: "dev-admin@home.local",
              name: "Dev Admin",
              roles: [Roles.ADMIN, Roles.AGENT],
              provider: "dev"
            });
            force((n) => n + 1);
          }}
        >
          admin
        </button>
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => setMockSession("buyer@test.com")}
        >
          buyer
        </button>
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => setMockSession("seller@test.com")}
        >
          seller
        </button>
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => setMockSession("buyerseller@test.com")}
        >
          dual
        </button>
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => setMockSession("agent@test.com")}
        >
          agent
        </button>
        <button
          className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
          onClick={() => setMockSession("valuation@test.com")}
        >
          valuation
        </button>
      </div>
    </div>
  );
}

function AppInner() {
  const location = useLocation();
  const hideNav = location.pathname === "/";

  return (
    <>
      {!hideNav && <TopNav />}
      <Routes>
        <Route path="/" element={<ComingSoon />} />
        <Route path="/login" element={<Landing />} />
        <Route path="/seller" element={<SellerStart />} />
        <Route path="/seller/valuation" element={<SellerValuation />} />
        <Route path="/seller/how-home-ai-works" element={<SellerHowItWorks />} />
        <Route path="/seller/checkout" element={<SellerCheckout />} />
        <Route path="/seller/checkout/success" element={<SellerCheckoutSuccess />} />
        <Route path="/seller/consultation" element={<SellerConsultation />} />
        <Route path="/seller/thanks" element={<SellerThanks />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/buyer" element={<BuyerStart />} />
        <Route path="/buyer/discover" element={<BuyerDiscover />} />
        <Route path="/buyer/thanks" element={<BuyerThanks />} />
        <Route
          path="/console"
          element={
            <RequireRoles allowed={[Roles.ADMIN, Roles.AGENT]}>
              <AdminConsole />
            </RequireRoles>
          }
        />
        <Route path="/crm/*" element={<CrmRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevRoleToggle />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
