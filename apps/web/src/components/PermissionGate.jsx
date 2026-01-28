/**
 * PERMISSION GATE COMPONENT
 * 
 * Component-level permission gate using capability-based access control.
 * This is the new preferred way to gate content by permissions.
 * 
 * @see PERMISSIONS_AUDIT_REPORT.md for migration guide from RoleGate
 */

import React from "react";
import { NoAccessCard } from "./NoAccessCard.jsx";
import { usePermission } from "../hooks/usePermission.js";

/**
 * Component-level permission gate using capabilities
 * 
 * @param {Object} props
 * @param {string|string[]} props.require - Capability or capabilities required
 * @param {boolean} props.requireAll - If array, require ALL capabilities (default: false = ANY)
 * @param {string} props.fallback - Custom fallback message
 * @param {React.ReactNode} props.children - Content to render if permitted
 * 
 * @example
 * // Single capability
 * <PermissionGate require="finance:read">
 *   <FinanceChart />
 * </PermissionGate>
 * 
 * @example
 * // Multiple capabilities (ANY)
 * <PermissionGate require={["deals:read", "deals:write"]}>
 *   <DealsTable />
 * </PermissionGate>
 * 
 * @example
 * // Multiple capabilities (ALL)
 * <PermissionGate require={["users:read", "users:write"]} requireAll>
 *   <UserEditForm />
 * </PermissionGate>
 * 
 * @example
 * // Custom fallback message
 * <PermissionGate require="finance:write" fallback="You need finance write access">
 *   <CreateInvoiceButton />
 * </PermissionGate>
 */
export function PermissionGate({ 
  require: capability, 
  requireAll = false,
  fallback,
  children 
}) {
  const hasPermission = usePermission(capability, { requireAll });

  if (!hasPermission) {
    if (fallback) {
      return <NoAccessCard description={fallback} />;
    }
    return null; // Silent fail (no access UI shown)
  }

  return children;
}
