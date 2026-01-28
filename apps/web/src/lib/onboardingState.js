/**
 * Onboarding State Management
 * 
 * PRINCIPLE: Backend is the single source of truth for onboarding status.
 * 
 * localStorage usage:
 * ✅ ALLOWED: Draft form data (autosave, resume incomplete forms)
 * ❌ FORBIDDEN: Status decisions, approval state, redirect logic
 * 
 * Backend decides:
 * - onboardingComplete (boolean)
 * - onboarding_status (not_started | in_progress | pending_review | approved)
 * 
 * Frontend must never:
 * - Fall back to localStorage for status
 * - Gate dashboards based on localStorage
 * - Make approval decisions locally
 */

import { Roles } from "../constants/roles.js";

const STORAGE_KEY = "break-onboarding-v2";

const DEFAULT_STATE = {
  status: "not_started",
  role: null,
  context: null,
  currentStep: 0,
  responses: {},
  completedAt: null
};

const ONBOARDING_ROLES = new Set([Roles.BRAND, Roles.CREATOR, Roles.FOUNDER]);

// UGC and AGENT have special flows (profile setup and CV upload respectively)
const SPECIAL_FLOW_ROLES = new Set([Roles.UGC, Roles.AGENT]);

function normalizeRole(role) {
  if (!role) return "";
  return role;
}

function readStore() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(next) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write errors in sandboxed environments
  }
}

export function loadOnboardingState(email) {
  const key = email?.toLowerCase() || "guest";
  const store = readStore();
  return { ...DEFAULT_STATE, ...(store[key] || {}), email: key };
}

export function persistOnboardingState(email, patch) {
  const key = email?.toLowerCase() || "guest";
  const store = readStore();
  const existing = store[key] || DEFAULT_STATE;
  const next = {
    ...DEFAULT_STATE,
    ...existing,
    ...patch,
    updatedAt: Date.now()
  };
  writeStore({ ...store, [key]: next });
  return next;
}

export function resetOnboardingState(email) {
  const key = email?.toLowerCase() || "guest";
  const store = readStore();
  delete store[key];
  writeStore(store);
}

export function markOnboardingStep(email, stepId, payload) {
  const current = loadOnboardingState(email);
  return persistOnboardingState(email, {
    status: current.status === "not_started" ? "in_progress" : current.status,
    currentStep: stepId,
    responses: { ...current.responses, ...payload }
  });
}

export function markOnboardingSubmitted(email, role, context) {
  const current = loadOnboardingState(email);
  return persistOnboardingState(email, {
    status: "pending_review",
    role: role || current.role,
    context: context || current.context,
    completedAt: Date.now(),
    currentStep: "complete"
  });
}

/**
 * Get onboarding status from backend ONLY.
 * Backend is the single source of truth.
 * localStorage is for draft data only, never for status decisions.
 */
export function deriveOnboardingStatus(user) {
  // Backend is the ONLY source of truth for onboarding status
  if (user?.onboardingStatus) {
    return user.onboardingStatus;
  }
  
  // If backend didn't provide status, assume approved for non-onboarding roles
  const normalizedRole = normalizeRole(user?.role);
  if (!user || !normalizedRole || !ONBOARDING_ROLES.has(normalizedRole)) {
    return "approved";
  }
  
  // If backend should have status but doesn't, this is a backend bug
  // Default to not_started rather than checking localStorage
  console.warn("[ONBOARDING] Backend missing onboarding_status for user:", user.email);
  return "not_started";
}

/**
 * Check if user should be routed to onboarding.
 * Uses backend state only - never localStorage.
 */
export function shouldRouteToOnboarding(user) {
  const normalizedRole = normalizeRole(user?.role);
  if (!user || !ONBOARDING_ROLES.has(normalizedRole)) return false;
  
  // Backend is source of truth
  const status = deriveOnboardingStatus(user);
  return status === "not_started" || status === "in_progress";
}

export function getDashboardPathForRole(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === Roles.ADMIN || normalizedRole === Roles.SUPERADMIN) {
    return "/admin/dashboard";
  }
  if (normalizedRole === Roles.BRAND || normalizedRole === Roles.FOUNDER) {
    return "/brand/dashboard";
  }
  if (normalizedRole === Roles.UGC) {
    return "/ugc/dashboard";
  }
  if (normalizedRole === Roles.AGENT) {
    return "/careers"; // Agents redirected to careers after CV upload
  }
  if (normalizedRole === Roles.CREATOR || normalizedRole === Roles.EXCLUSIVE_TALENT) {
    return "/creator/dashboard";
  }
  return "/dashboard";
}

/**
 * Check if user is awaiting approval.
 * Uses backend state only - never localStorage.
 */
export function isAwaitingApproval(user) {
  // Admins and superadmins should never see approval hold
  const normalizedRole = normalizeRole(user?.role);
  if (normalizedRole === Roles.ADMIN || normalizedRole === Roles.SUPERADMIN) {
    return false;
  }
  
  // Backend is source of truth
  const status = deriveOnboardingStatus(user);
  return status === "pending_review";
}

export function getActiveOnboardingRole(user, fallbackRole) {
  const stored = loadOnboardingState(user?.email);
  return stored.role || normalizeRole(user?.role) || normalizeRole(fallbackRole);
}

export function getOnboardingPathForRole(role) {
  const normalizedRole = normalizeRole(role);
  
  // UGC creators go to profile setup
  if (normalizedRole === Roles.UGC) {
    return "/ugc/setup";
  }
  
  // Agents go to CV upload
  if (normalizedRole === Roles.AGENT) {
    return "/agent/upload-cv";
  }
  
  // Exclusive talent has a separate onboarding flow
  if (normalizedRole === Roles.EXCLUSIVE_TALENT) {
    return "/admin/view/exclusive/goals";
  }
  
  // All other roles use the standard onboarding
  return "/onboarding";
}

export function needsSpecialSetup(user) {
  const normalizedRole = normalizeRole(user?.role);
  return SPECIAL_FLOW_ROLES.has(normalizedRole);
}

export function getSpecialSetupPath(user) {
  const normalizedRole = normalizeRole(user?.role);
  if (normalizedRole === Roles.UGC) {
    return "/ugc/setup";
  }
  if (normalizedRole === Roles.AGENT) {
    return "/agent/upload-cv";
  }
  return null;
}

/**
 * Clear local onboarding drafts for completed users.
 * Called on successful auth to prevent stale data.
 * localStorage is for drafts only - once backend says complete, clear drafts.
 */
export function clearLocalOnboardingDrafts(email) {
  if (!email) return;
  const key = email.toLowerCase();
  const store = readStore();
  if (store[key]) {
    console.log("[ONBOARDING] Clearing local drafts for completed user:", email);
    delete store[key];
    writeStore(store);
  }
}
