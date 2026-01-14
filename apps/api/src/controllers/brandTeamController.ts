/**
 * Brand Team Controller
 * 
 * Handles team member invites, role management, and permissions
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as brandUserService from '../services/brandUserService.js';
import { isValidBrandRole } from '../utils/permissionHelper.js';

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
});

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

/**
 * Invite user to brand
 */
export async function inviteUserHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res
        .status(403)
        .json({ error: "Only brand admins can invite team members" });
      return;
    }

    const validation = inviteUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { email, role } = validation.data;

    try {
      const brandUser = await brandUserService.inviteUserToBrand(
        brandId,
        email,
        role
      );

      res.status(201).json({
        message: "User invited successfully",
        brandUser,
      });
    } catch (inviteError) {
      if (
        (inviteError as Error).message === "User not found. User must sign up first."
      ) {
        res.status(404).json({ error: (inviteError as Error).message });
        return;
      } else {
        throw inviteError;
      }
    }
  } catch (error) {
    console.error("[Invite User]", error);
    res.status(500).json({ error: "Failed to invite user" });
  }
}

/**
 * Get brand team members
 */
export async function getTeamMembersHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is member of brand
    const isMember = await brandUserService.isBrandMember(brandId, user.id);
    if (!isMember) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const teamMembers = await brandUserService.getBrandUsers(brandId);

    res.json({
      teamMembers,
    });
  } catch (error) {
    console.error("[Get Team Members]", error);
    res.status(500).json({ error: "Failed to get team members" });
  }
}

/**
 * Update team member role
 */
export async function updateMemberRoleHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId, memberId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res.status(403).json({ error: "Only brand admins can update roles" });
      return;
    }

    // Prevent self-demotion
    if (user.id === memberId) {
      res.status(400).json({ error: "Cannot change your own role" });
      return;
    }

    const validation = updateRoleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { role } = validation.data;

    try {
      const updatedMember = await brandUserService.updateBrandUserRole(
        brandId,
        memberId,
        role
      );

      res.json({
        message: "Role updated successfully",
        member: updatedMember,
      });
    } catch (updateError) {
      if (
        (updateError as Error).message.includes("Cannot demote the last admin")
      ) {
        res.status(400).json({ error: (updateError as Error).message });
        return;
      } else {
        throw updateError;
      }
    }
  } catch (error) {
    console.error("[Update Member Role]", error);
    res.status(500).json({ error: "Failed to update member role" });
  }
}

/**
 * Remove team member
 */
export async function removeTeamMemberHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId, memberId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res.status(403).json({ error: "Only brand admins can remove members" });
      return;
    }

    // Prevent self-removal
    if (user.id === memberId) {
      res.status(400).json({ error: "Cannot remove yourself from brand" });
      return;
    }

    try {
      await brandUserService.removeUserFromBrand(brandId, memberId);

      res.json({
        message: "Team member removed successfully",
      });
    } catch (removeError) {
      if (
        (removeError as Error).message.includes("Cannot remove the last admin")
      ) {
        res.status(400).json({ error: (removeError as Error).message });
        return;
      } else {
        throw removeError;
      }
    }
  } catch (error) {
    console.error("[Remove Team Member]", error);
    res.status(500).json({ error: "Failed to remove team member" });
  }
}
