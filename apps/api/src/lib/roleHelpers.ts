/**
 * Centralized role checking helpers
 * 
 * CRITICAL: All role checks should use these helpers to ensure consistent behavior,
 * especially for SUPERADMIN which must bypass ALL permission checks.
 */

import type { SessionUser } from "./session.js";

/**
 * Normalize role string to handle variations in casing and underscores
 * @param role - The role string to normalize
 * @returns Normalized role in UPPERCASE format
 */
export function normalizeRole(role: string | undefined | null): string {
  if (!role) return "";
  return role.toUpperCase().replace(/-/g, "_");
}

/**
 * Check if user is a SUPERADMIN
 * SUPERADMIN must bypass ALL permission checks throughout the application
 * 
 * Handles multiple variations: SUPERADMIN, SUPER_ADMIN, superadmin, etc.
 * 
 * @param user - The session user or user-like object
 * @returns true if user is superadmin, false otherwise
 */
export function isSuperAdmin(user: any): boolean {
  if (!user?.role) return false;
  const normalized = normalizeRole(user.role);
  return normalized === "SUPERADMIN" || normalized === "SUPER_ADMIN";
}

/**
 * Check if user is an ADMIN or SUPERADMIN
 * @param user - The session user or user-like object
 * @returns true if user is admin or superadmin
 */
export function isAdmin(user: any): boolean {
  if (isSuperAdmin(user)) return true;
  if (!user?.role) return false;
  const normalized = normalizeRole(user.role);
  return normalized === "ADMIN" || normalized === "AGENCY_ADMIN";
}

/**
 * Check if user is a manager-level role (can manage campaigns, etc.)
 * Manager roles: ADMIN, SUPERADMIN, AGENT, BRAND
 * 
 * @param user - The session user or user-like object
 * @returns true if user has manager-level permissions
 */
export function isManager(user: any): boolean {
  if (isSuperAdmin(user)) return true;
  if (!user?.role) return false;
  const normalized = normalizeRole(user.role);
  return ["ADMIN", "AGENCY_ADMIN", "AGENT", "BRAND"].includes(normalized);
}

/**
 * Check if user is a creator/talent
 * @param user - The session user or user-like object
 * @returns true if user is creator or talent
 */
export function isCreator(user: any): boolean {
  if (isSuperAdmin(user)) return true; // Superadmin can act as any role
  if (!user?.role) return false;
  const normalized = normalizeRole(user.role);
  return ["CREATOR", "TALENT", "EXCLUSIVE_TALENT", "UGC"].includes(normalized);
}

/**
 * Check if user has one of the specified roles
 * SUPERADMIN always passes this check
 * 
 * @param user - The session user or user-like object
 * @param allowedRoles - Array of allowed role strings
 * @returns true if user has one of the allowed roles or is superadmin
 */
export function hasRole(user: any, allowedRoles: string[]): boolean {
  if (isSuperAdmin(user)) return true;
  if (!user?.role) return false;
  
  const userRole = normalizeRole(user.role);
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
  
  return normalizedAllowed.includes(userRole);
}

/**
 * Check if user can access another user's data
 * Superadmin can access all data
 * Otherwise, user can only access their own data
 * 
 * @param currentUser - The current session user
 * @param targetUserId - The ID of the user whose data is being accessed
 * @returns true if access is allowed
 */
export function canAccessUserData(currentUser: any, targetUserId: string): boolean {
  if (isSuperAdmin(currentUser)) return true;
  if (!currentUser?.id) return false;
  return currentUser.id === targetUserId;
}

/**
 * DEPRECATED: Use hasRole() instead
 * Legacy helper for backward compatibility
 */
export function requireRole(user: any, role: string): boolean {
  return hasRole(user, [role]);
}
