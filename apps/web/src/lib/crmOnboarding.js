const STORAGE_KEY = "break_crm_onboarding_payloads_v1";

function readStore() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage write errors
  }
}

export function saveCrmOnboarding(email, role, context, responses) {
  if (!email) return;
  const key = email.toLowerCase();
  const existing = readStore();
  const payload = {
    email: key,
    role,
    context,
    responses,
    updatedAt: new Date().toISOString()
  };
  writeStore({ ...existing, [key]: payload });
  return payload;
}

export function loadCrmOnboarding(email) {
  if (!email) return null;
  const store = readStore();
  return store[email.toLowerCase()] || null;
}

export function listCrmOnboarding() {
  return Object.values(readStore());
}
