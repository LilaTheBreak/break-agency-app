const CONTACTS_KEY = "break_crm_contacts_v1";

function readContacts() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CONTACTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeContacts(store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONTACTS_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function listContacts() {
  return Object.values(readContacts());
}

export function getContact(email) {
  if (!email) return null;
  return readContacts()[email.toLowerCase()] || null;
}

export function upsertContact(contact) {
  if (!contact?.email) return contact;
  const store = readContacts();
  const key = contact.email.toLowerCase();
  const next = {
    stage: "Onboarding",
    owner: "Admin",
    ...store[key],
    ...contact,
    email: key,
    updatedAt: new Date().toISOString()
  };
  store[key] = next;
  writeContacts(store);
  return next;
}

export function upsertContactFromOnboarding(email, role, responses = {}) {
  if (!email) return null;
  const goals = [];
  if (responses.primaryGoal) goals.push(responses.primaryGoal);
  if (responses.targetAmount) goals.push(`Target: ${responses.targetAmount}`);
  const blockers = Array.isArray(responses.blockers) ? responses.blockers : [];
  const timelineEntries = [];
  if (goals.length) timelineEntries.push({ title: "Goals captured", body: goals.join(" · "), ts: new Date().toISOString() });
  if (blockers.length) timelineEntries.push({ title: "Risks / blockers", body: blockers.join(", "), ts: new Date().toISOString() });

  return upsertContact({
    email,
    role,
    stage: "Onboarding",
    owner: "Admin",
    preferredName: responses.preferredName || "",
    context: responses.context || "",
    primaryGoal: responses.primaryGoal || "",
    revenueRange: responses.revenueRange || "",
    platforms: responses.platforms || [],
    niches: [responses.primaryNiche, ...(responses.secondaryNiches || [])].filter(Boolean),
    partnershipPreference: responses.partnershipPreference || "",
    goals,
    blockers,
    capacity: responses.capacity || responses.ugcCapacity || "",
    leadTime: responses.leadTime || "",
    updates: timelineEntries
  });
}
