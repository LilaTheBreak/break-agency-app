import { Request, Response, NextFunction } from 'express';
import { Feature, hasPermission } from '../config/permissions.js';
import { logPermissionDenial } from '../services/logging/permissionLog.js';

/**
 * Middleware to check if the authenticated user has access to a specific feature.
 * It uses the permission matrix to verify access based on the user's role.
 * @param feature The feature being accessed.
 */
export const requireFeature = (feature: Feature) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(403).json({ error: 'Access denied. User role not found.' });
    }

    if (!hasPermission(req.user.role, feature)) {
      // Log the failed access attempt
      logPermissionDenial(req.user, feature, req.originalUrl);
      
      return res.status(403).json({ error: `Access denied. Your role does not have permission for the '${feature}' feature.` });
    }

    next();
  };
};