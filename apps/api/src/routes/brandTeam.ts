/**
 * Brand Team Routes
 */

import { Router } from "express";
import {
  inviteUserHandler,
  getTeamMembersHandler,
  updateMemberRoleHandler,
  removeTeamMemberHandler,
} from '../controllers/brandTeamController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/brand-team/:brandId/invite - Invite user to brand
router.post("/:brandId/invite", requireAuth, inviteUserHandler);

// GET /api/brand-team/:brandId/members - Get brand team members
router.get("/:brandId/members", requireAuth, getTeamMembersHandler);

// PUT /api/brand-team/:brandId/members/:memberId/role - Update member role
router.put(
  "/:brandId/members/:memberId/role",
  requireAuth,
  updateMemberRoleHandler
);

// DELETE /api/brand-team/:brandId/members/:memberId - Remove team member
router.delete(
  "/:brandId/members/:memberId",
  requireAuth,
  removeTeamMemberHandler
);

export default router;
