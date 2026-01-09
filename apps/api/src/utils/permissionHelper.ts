/**
 * Brand Role-Based Access Control
 * 
 * Manages permissions for Brand team members based on role
 */

export type BrandRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface BrandPermissions {
  canEditBrand: boolean;
  canManageTeam: boolean;
  canCreateCampaign: boolean;
  canEditCampaign: boolean;
  canDeleteCampaign: boolean;
  canViewAnalytics: boolean;
  canManageAudit: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
}

const PERMISSIONS: Record<BrandRole, BrandPermissions> = {
  ADMIN: {
    canEditBrand: true,
    canManageTeam: true,
    canCreateCampaign: true,
    canEditCampaign: true,
    canDeleteCampaign: true,
    canViewAnalytics: true,
    canManageAudit: true,
    canInviteMembers: true,
    canRemoveMembers: true,
  },
  EDITOR: {
    canEditBrand: false,
    canManageTeam: false,
    canCreateCampaign: true,
    canEditCampaign: true,
    canDeleteCampaign: true,
    canViewAnalytics: true,
    canManageAudit: false,
    canInviteMembers: false,
    canRemoveMembers: false,
  },
  VIEWER: {
    canEditBrand: false,
    canManageTeam: false,
    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canViewAnalytics: true,
    canManageAudit: false,
    canInviteMembers: false,
    canRemoveMembers: false,
  },
};

/**
 * Get permissions for a brand role
 */
export function getPermissionsForRole(role: BrandRole): BrandPermissions {
  return PERMISSIONS[role] || PERMISSIONS.VIEWER;
}

/**
 * Check if user has permission
 */
export function hasPermission(
  role: BrandRole,
  action: keyof BrandPermissions
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions[action] || false;
}

/**
 * Check if user can perform action on brand
 */
export function canUserPerformAction(
  role: BrandRole,
  action: keyof BrandPermissions
): boolean {
  return hasPermission(role, action);
}

/**
 * Validate role is valid
 */
export function isValidBrandRole(role: string): role is BrandRole {
  return ['ADMIN', 'EDITOR', 'VIEWER'].includes(role);
}

/**
 * Get display name for role
 */
export function getRoleDisplayName(role: BrandRole): string {
  const names: Record<BrandRole, string> = {
    ADMIN: 'Admin',
    EDITOR: 'Editor',
    VIEWER: 'Viewer',
  };
  return names[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: BrandRole): string {
  const descriptions: Record<BrandRole, string> = {
    ADMIN: 'Full access to brand, team, and campaigns',
    EDITOR: 'Can create and manage campaigns, view analytics',
    VIEWER: 'Read-only access to brand and campaign data',
  };
  return descriptions[role] || '';
}
