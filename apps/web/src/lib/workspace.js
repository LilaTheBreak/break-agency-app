const BUYER_VIEWING_FEEDBACK_KEY = "home_viewing_feedback_v1";
const BUYER_SUBMITTED_OFFERS_KEY = "home_submitted_offers_v1";
export const BUYER_FEEDBACK_EVENT = "home:viewing-feedback-updated";
export const BUYER_OFFERS_EVENT = "home:offers-updated";

const BUYER_VIEWING_BASELINE_MAP = {
  "buyer@test.com": [
    {
      id: "vw-buyer-1",
      buyerEmail: "buyer@test.com",
      buyerName: "Buyer Beta",
      listingId: "sw3-220",
      listingTitle: "Chelsea mews house with studio",
      date: "2025-11-18",
      time: "10:00",
      status: "Confirmed"
    },
    {
      id: "vw-buyer-2",
      buyerEmail: "buyer@test.com",
      buyerName: "Buyer Beta",
      listingId: "w8-123",
      listingTitle: "Elegant 3-bed in Kensington",
      date: "2025-11-22",
      time: "14:00",
      status: "Awaiting feedback"
    }
  ],
  "buyerseller@test.com": [
    {
      id: "vw-hybrid-1",
      buyerEmail: "buyerseller@test.com",
      buyerName: "Hybrid Hero",
      listingId: "w8-999",
      listingTitle: "Penthouse with Roof Terrace, Kensington",
      date: "2025-11-19",
      time: "12:30",
      status: "Awaiting feedback"
    }
  ],
  "priya.dan@buyers.com": [
    {
      id: "vw-priya-1",
      buyerEmail: "priya.dan@buyers.com",
      buyerName: "Priya & Dan",
      listingId: "w8-123",
      listingTitle: "Elegant 3-bed in Kensington",
      date: "2025-11-14",
      time: "15:00",
      status: "Awaiting feedback"
    }
  ],
  "corporate@relocators.com": [
    {
      id: "vw-corp-1",
      buyerEmail: "corporate@relocators.com",
      buyerName: "Corporate relocation",
      listingId: "w8-123",
      listingTitle: "Elegant 3-bed in Kensington",
      date: "2025-11-16",
      time: "11:30",
      status: "Awaiting feedback"
    }
  ],
  default: [
    {
      id: "vw-default-1",
      buyerEmail: "guest@home.ai",
      buyerName: "Guest",
      listingId: "w8-123",
      listingTitle: "Elegant 3-bed in Kensington",
      date: "2025-11-21",
      time: "16:00",
      status: "Proposed"
    }
  ]
};

export function getBuyerViewingsForEmail(email) {
  const key = String(email || "").toLowerCase();
  const seed = BUYER_VIEWING_BASELINE_MAP[key] || BUYER_VIEWING_BASELINE_MAP.default || [];
  return seed.map((entry) => ({ ...entry }));
}

const ensureObject = (key) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const ensureArray = (key) => {
  const value = ensureObject(key);
  return Array.isArray(value) ? value : null;
};

export function loadBuyerViewingFeedback() {
  return ensureObject(BUYER_VIEWING_FEEDBACK_KEY) || {};
}

export function saveBuyerViewingFeedback(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUYER_VIEWING_FEEDBACK_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(BUYER_FEEDBACK_EVENT));
}

export function loadBuyerSubmittedOffers() {
  return ensureArray(BUYER_SUBMITTED_OFFERS_KEY) || [];
}

export function saveBuyerSubmittedOffers(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUYER_SUBMITTED_OFFERS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(BUYER_OFFERS_EVENT));
}

export function appendBuyerOffer(entry) {
  const current = loadBuyerSubmittedOffers();
  saveBuyerSubmittedOffers([entry, ...current]);
  return entry;
}

export function updateBuyerOffer(id, patch) {
  const current = loadBuyerSubmittedOffers();
  const idx = current.findIndex((offer) => offer.id === id);
  if (idx === -1) return null;
  current[idx] = {
    ...current[idx],
    ...patch,
    updated: patch.updated || new Date().toISOString()
  };
  saveBuyerSubmittedOffers(current);
  return current[idx];
}

export { BUYER_VIEWING_FEEDBACK_KEY, BUYER_SUBMITTED_OFFERS_KEY };
