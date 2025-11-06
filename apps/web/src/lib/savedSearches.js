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
  // budget max filter
  const budgetMax = Number(criteria.budgetMax || 0);
  if (budgetMax && listing.price > budgetMax) return false;

  // area filter: match if any token appears in listing.area or listing.postcode (prefix)
  const tokens = String(criteria.areas || "").toUpperCase().split(/[, ]+/).filter(Boolean);
  if (tokens.length) {
    const hay = (listing.area + " " + listing.postcode).toUpperCase();
    const ok = tokens.some(t => hay.includes(t));
    if (!ok) return false;
  }

  return true;
}
