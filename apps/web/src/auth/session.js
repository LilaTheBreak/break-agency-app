const SESSION_KEY = "break_agency_session_v1";
export const SESSION_CHANGED_EVENT = "break-agency-session-changed";

export const Roles = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
  BRAND: "BRAND",
  CREATOR: "CREATOR",
  EXCLUSIVE_TALENT: "EXCLUSIVE_TALENT",
  UGC_TALENT: "UGC_TALENT",
  UGC: "UGC_TALENT",
  FOUNDER: "FOUNDER",
  TALENT_MANAGER: "TALENT_MANAGER"
};

const rolePriority = [
  Roles.ADMIN,
  Roles.FOUNDER,
  Roles.AGENT,
  Roles.TALENT_MANAGER,
  Roles.EXCLUSIVE_TALENT,
  Roles.BRAND,
  Roles.CREATOR,
  Roles.UGC_TALENT
];

function derivePrimaryRole(roles = []) {
  for (const role of rolePriority) {
    if (roles.includes(role)) return role;
  }
  return roles[0] || "visitor";
}

function emitSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  }
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem("role", "visitor");
  } else {
    const payload = { ...session, roles: Array.from(new Set(session.roles || [])) };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    localStorage.setItem("role", derivePrimaryRole(payload.roles));
  }
  emitSessionChanged();
}

export function clearSession() {
  setSession(null);
}

export function signInSession(data) {
  const session = {
    email: data.email,
    name: data.name || data.email,
    avatar: data.avatar || null,
    roles: data.roles ? Array.from(new Set(data.roles)) : [],
    provider: data.provider || "manual",
    signedInAt: Date.now()
  };
  setSession(session);
  return session;
}

export function hasRole(role) {
  return !!getSession()?.roles?.includes(role);
}

export function hasAnyRole(roles) {
  const session = getSession();
  if (!session?.roles) return false;
  return roles.some((role) => session.roles.includes(role));
}
