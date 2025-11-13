const KEY = "home_saved_searches_v1";

export function getSearches() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveSearch(criteria) {
  const all = getSearches();
  const item = { id: Date.now().toString(), createdAt: Date.now(), ...criteria };
  all.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 25))); // keep last 25
  return item;
}

export function latestSearch() {
  const all = getSearches();
  return all[0] || null;
}

/** Simple matcher for West London use case */
export function listingMatches(criteria, listing) {
  if (!criteria || !listing) return false;
  const price = Number(listing.price || 0);
  const budgetMax = Number(criteria.budgetMax || 0);
  if (budgetMax && price > budgetMax) return false;
  const budgetMin = Number(criteria.budgetMin || 0);
  if (budgetMin && price && price < budgetMin) return false;

  const beds = Number(listing.beds || 0);
  const bedsMin = Number(criteria.bedsMin || 0);
  if (bedsMin && beds < bedsMin) return false;
  const bedsMax = Number(criteria.bedsMax || 0);
  if (bedsMax && beds && beds > bedsMax) return false;

  if (criteria.type && criteria.type !== "Any") {
    if (!listing.type || listing.type.toLowerCase() !== criteria.type.toLowerCase()) {
      return false;
    }
  }

  if (Array.isArray(criteria.features) && criteria.features.length) {
    const listingFeatures = (listing.features || []).map((f) => f.toLowerCase());
    const missing = criteria.features.some(
      (feature) => !listingFeatures.includes(feature.toLowerCase())
    );
    if (missing) return false;
  }

  const tokens = String(criteria.area || criteria.areas || "")
    .toUpperCase()
    .split(/[,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length) {
    const hay = (listing.area + " " + listing.postcode).toUpperCase();
    const ok = tokens.some((t) => hay.includes(t));
    if (!ok) return false;
  }

  return true;
}
