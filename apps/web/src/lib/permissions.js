/**
 * CENTRAL PERMISSION SYSTEM
 * 
 * This module provides capability-based access control for the Break platform.
 * 
 * IMPORTANT: Backend is still the source of truth for enforcement.
 * This map is for UI decisions only (show/hide buttons, enable/disable features).
 * 
 * @see PERMISSIONS_AUDIT_REPORT.md for full documentation
 */

/**
 * CENTRAL PERMISSION MAP
 * 
 * Maps capabilities (what) → roles (who)
 * Format: "resource:action" → [Roles...]
 */
export const PERMISSIONS = {
  // ========== Admin Capabilities ==========
  "finance:read": ["ADMIN", "SUPERADMIN"],
  "finance:write": ["ADMIN", "SUPERADMIN"],
  
  "users:read": ["ADMIN", "SUPERADMIN"],
  "users:write": ["ADMIN", "SUPERADMIN"],
  "users:impersonate": ["SUPERADMIN"], // SUPERADMIN only
  "users:delete": ["SUPERADMIN"], // SUPERADMIN only
  "users:change_role": ["SUPERADMIN"], // SUPERADMIN only
  
  "onboarding:approve": ["ADMIN", "SUPERADMIN"],
  
  "talent:read": ["ADMIN", "SUPERADMIN"],
  "talent:write": ["ADMIN", "SUPERADMIN"],
  "talent:link_users": ["ADMIN", "SUPERADMIN"],
  
  "deals:read": ["ADMIN", "SUPERADMIN"],
  "deals:write": ["ADMIN", "SUPERADMIN"],
  
  "brands:read": ["ADMIN", "SUPERADMIN"],
  "brands:write": ["ADMIN", "SUPERADMIN"],
  "brands:delete": ["SUPERADMIN"], // SUPERADMIN only
  
  "tasks:read": ["ADMIN", "SUPERADMIN"],
  "tasks:write": ["ADMIN", "SUPERADMIN"],
  
  "content:read": ["ADMIN", "SUPERADMIN"],
  "content:write": ["ADMIN", "SUPERADMIN"],
  
  "analytics:read": ["ADMIN", "SUPERADMIN"],
  "activity:read": ["ADMIN", "SUPERADMIN"],
  
  "settings:read": ["ADMIN", "SUPERADMIN"],
  "settings:write": ["SUPERADMIN"], // SUPERADMIN only
  
  // ========== Creator Capabilities ==========
  "profile:read": ["CREATOR", "EXCLUSIVE_TALENT", "UGC", "ADMIN", "SUPERADMIN"],
  "profile:write": ["CREATOR", "EXCLUSIVE_TALENT", "UGC", "ADMIN", "SUPERADMIN"],
  
  "campaigns:read": ["CREATOR", "EXCLUSIVE_TALENT", "UGC", "ADMIN", "SUPERADMIN"],
  "campaigns:submit": ["CREATOR", "EXCLUSIVE_TALENT", "UGC"],
  
  "opportunities:read": ["CREATOR", "EXCLUSIVE_TALENT", "UGC"],
  "opportunities:apply": ["CREATOR", "EXCLUSIVE_TALENT", "UGC"],
  
  "meetings:read": ["CREATOR", "EXCLUSIVE_TALENT", "ADMIN", "SUPERADMIN"],
  
  "socials:read": ["CREATOR", "EXCLUSIVE_TALENT", "UGC", "ADMIN", "SUPERADMIN"],
  "socials:write": ["CREATOR", "EXCLUSIVE_TALENT", "UGC", "ADMIN", "SUPERADMIN"],
  
  // ========== Brand Capabilities ==========
  "brand_campaigns:read": ["BRAND", "FOUNDER", "ADMIN", "SUPERADMIN"],
  "brand_campaigns:create": ["BRAND", "FOUNDER", "ADMIN", "SUPERADMIN"],
  
  "creators:read": ["BRAND", "FOUNDER", "ADMIN", "SUPERADMIN"],
  
  "briefs:read": ["BRAND", "FOUNDER", "ADMIN", "SUPERADMIN"],
  "briefs:write": ["BRAND", "FOUNDER", "ADMIN", "SUPERADMIN"],
  
  // ========== Special Capabilities ==========
  "admin_nav:access": ["ADMIN", "SUPERADMIN"],
  "superadmin_only:access": ["SUPERADMIN"],
};

/**
 * Check if user has permission for a capability
 * 
 * @param {Object} user - User object with role property
 * @param {string} capability - Permission to check (e.g., "finance:read")
 * @returns {boolean} - True if user has permission
 * 
 * @example
 * can(user, "finance:read") // true for ADMIN/SUPERADMIN
 * can(user, "users:delete") // true only for SUPERADMIN
 */
export function can(user, capability) {
  // Null-safe: Handle missing user or role gracefully
  if (!user || !user.role) {
    return false;
  }

  // SUPERADMIN always has access (god mode)
  if (user.role === "SUPERADMIN" || user.role === "SUPER_ADMIN") {
    return true;
  }

  // Check permission map
  const allowedRoles = PERMISSIONS[capability];
  
  if (!allowedRoles) {
    console.warn(`[Permissions] Unknown capability: "${capability}"`);
    return false;
  }

  return allowedRoles.includes(user.role);
}

/**
 * Check if user has ANY of the capabilities
 * 
 * @param {Object} user - User object
 * @param {string[]} capabilities - Array of capabilities
 * @returns {boolean} - True if user has at least one capability
 * 
 * @example
 * canAny(user, ["finance:read", "finance:write"])
 */
export function canAny(user, capabilities) {
  return capabilities.some(cap => can(user, cap));
}

/**
 * Check if user has ALL capabilities
 * 
 * @param {Object} user - User object
 * @param {string[]} capabilities - Array of capabilities
 * @returns {boolean} - True if user has all capabilities
 * 
 * @example
 * canAll(user, ["users:read", "users:write"])
 */
export function canAll(user, capabilities) {
  return capabilities.every(cap => can(user, cap));
}

/**
 * Get all capabilities for a user
 * 
 * @param {Object} user - User object
 * @returns {string[]} - Array of all capabilities user has
 * 
 * @example
 * getCapabilities(adminUser)
 * // ["finance:read", "finance:write", "users:read", ...]
 */
export function getCapabilities(user) {
  if (!user || !user.role) {
    return [];
  }

  // SUPERADMIN has all capabilities
  if (user.role === "SUPERADMIN" || user.role === "SUPER_ADMIN") {
    return Object.keys(PERMISSIONS);
  }

  return Object.entries(PERMISSIONS)
    .filter(([_, roles]) => roles.includes(user.role))
    .map(([capability, _]) => capability);
}
