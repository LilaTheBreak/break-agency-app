/**
 * PERMISSION HOOKS
 * 
 * React hooks for checking user permissions in components.
 * 
 * @see PERMISSIONS_AUDIT_REPORT.md for usage examples
 */

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { can, canAny, canAll, getCapabilities } from '../lib/permissions.js';

/**
 * Hook for checking user permissions in components
 * 
 * @param {string|string[]} capability - Permission(s) to check
 * @param {Object} options - Configuration
 * @param {boolean} options.requireAll - If array, require ALL capabilities (default: false = ANY)
 * @returns {boolean} - True if user has permission
 * 
 * @example
 * // Single capability
 * const canEditFinance = usePermission("finance:write");
 * 
 * // Multiple capabilities (ANY)
 * const canViewAnyFinance = usePermission(["finance:read", "finance:write"]);
 * 
 * // Multiple capabilities (ALL)
 * const canManageFinance = usePermission(["finance:read", "finance:write"], { requireAll: true });
 */
export function usePermission(capability, options = {}) {
  const { user } = useAuth();
  const { requireAll = false } = options;

  return useMemo(() => {
    if (!user) return false;

    if (Array.isArray(capability)) {
      return requireAll 
        ? canAll(user, capability) 
        : canAny(user, capability);
    }

    return can(user, capability);
  }, [user, capability, requireAll]);
}

/**
 * Hook that returns ALL capabilities for current user
 * Useful for debugging or admin panels showing user permissions
 * 
 * @returns {string[]} - Array of all capabilities
 * 
 * @example
 * const capabilities = useCapabilities();
 * console.log("User can:", capabilities);
 */
export function useCapabilities() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return [];
    return getCapabilities(user);
  }, [user]);
}

/**
 * Hook that returns permission checker function
 * Useful when you need to check many permissions dynamically
 * 
 * @returns {Function} - can() function bound to current user
 * 
 * @example
 * const check = usePermissionCheck();
 * const buttons = [
 *   { label: "View", disabled: !check("finance:read") },
 *   { label: "Edit", disabled: !check("finance:write") },
 * ];
 */
export function usePermissionCheck() {
  const { user } = useAuth();

  return useMemo(() => {
    return (capability) => can(user, capability);
  }, [user]);
}
