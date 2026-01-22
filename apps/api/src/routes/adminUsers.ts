import { Router } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { generateId } from '../lib/utils.js';

const router = Router();

router.use(requireAuth, requireRole(["ADMIN"]));

router.delete("/users/:email", async (req, res) => {
  const email = (req.params.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    await prisma.user.delete({ where: { email } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user failed", error);
    res.status(404).json({ error: "User not found" });
  }
});

router.post("/users", async (req, res) => {
  const email = (req.body?.email || "").toLowerCase();
  const roleNameRaw = req.body?.role;
  if (!email || !roleNameRaw) {
    return res.status(400).json({ error: "email and role are required" });
  }
  const normalizedRole = String(roleNameRaw).toUpperCase();
  try {
    // User model has a direct role field, no separate role table
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: String(normalizedRole) },
      create: { 
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: String(email),
        name: String(email).split("@")[0], // Use email prefix as default name
        password: null,
        role: String(normalizedRole),
        updatedAt: new Date()
      }
    });
    res.status(201).json({ user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error("Create user failed", error);
    res.status(500).json({ error: "Unable to create user" });
  }
});

/**
 * GET /api/admin/users/pending
 * Get all users pending approval
 */
router.get("/users/pending", async (req, res) => {
  try {
    console.log("[ADMIN USERS PENDING] Fetching pending users...");
    const pendingUsers = await prisma.user.findMany({
      where: {
        onboarding_status: "pending_review"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        onboarding_responses: true,
        admin_notes: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log("[ADMIN USERS PENDING] Found", pendingUsers.length, "pending users");
    res.json({ users: pendingUsers });
  } catch (error) {
    console.error("[ADMIN USERS PENDING] Error:", error);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

/**
 * POST /api/admin/users/:id/approve
 * Approve a user - Only ONE super admin approval required
 */
router.post("/users/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    console.log("[USER APPROVAL] Admin user approval requested", {
      userId: id,
      approverAdminId: req.user?.id || "unknown",
      approverRole: req.user?.role || "unknown",
      hasNotes: !!notes,
      timestamp: new Date().toISOString()
    });

    // Single admin approval is sufficient - approve immediately
    const user = await prisma.user.update({
      where: { id },
      data: {
        onboarding_status: "approved",
        admin_notes: notes || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true
      }
    });
    
    console.log("[USER APPROVAL] User approved successfully", {
      userId: user.id,
      email: user.email,
      role: user.role,
      approverAdminId: req.user?.id || "unknown",
      timestamp: new Date().toISOString()
    });

    // TODO: Send approval email notification

    res.json({
      success: true,
      message: "User approved successfully",
      user
    });
  } catch (error) {
    console.error("[USER APPROVAL] User approval failed", error);
    console.error("[USER APPROVAL] Details", {
      userId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Failed to approve user" });
  }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject a user
 */
router.post("/users/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log("[INTEGRATION] Admin user rejection requested", {
      userId: id,
      adminId: req.user?.id || "unknown",
      hasReason: !!reason,
      timestamp: new Date().toISOString()
    });

    const user = await prisma.user.update({
      where: { id },
      data: {
        onboarding_status: "rejected",
        admin_notes: reason || "Application rejected",
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true
      }
    });
    
    console.log("[INTEGRATION] User rejection completed", {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // TODO: Send rejection email notification

    res.json({
      success: true,
      message: "User rejected",
      user
    });
  } catch (error) {
    console.error("[ADMIN USER REJECT]", error);
    console.error("[INTEGRATION] User rejection failed", {
      userId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Failed to reject user" });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
router.get("/users", async (req, res) => {
  try {
    const { status, role, search } = req.query;

    const where: any = {};

    if (status) {
      where.onboarding_status = status;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100 // Pagination TODO
    });

    res.json({ users });
  } catch (error) {
    console.error("[ADMIN USERS LIST]", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details (role, status, notes)
 * 
 * CRITICAL: When changing role to EXCLUSIVE_TALENT:
 * - Check if user has a linked Talent record
 * - If not, create one automatically
 * - This ensures the user appears in admin talent section
 */
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, onboarding_status, admin_notes } = req.body;
    const adminUserId = (req as any).user?.id || "system";

    // Get current user state for audit logging
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, name: true, email: true }
    });

    const updateData: any = { updatedAt: new Date() };

    if (role) updateData.role = role;
    if (onboarding_status) updateData.onboarding_status = onboarding_status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true,
        admin_notes: true
      }
    });

    // CRITICAL FIX: When role changes to EXCLUSIVE_TALENT, auto-create Talent record if needed
    if (role === "EXCLUSIVE_TALENT" && currentUser?.role !== "EXCLUSIVE_TALENT") {
      try {
        console.log(`[ADMIN USER UPDATE] User ${user.id} promoted to EXCLUSIVE_TALENT, checking for Talent record...`);
        
        // Check if user already has a linked Talent record
        const existingTalent = await prisma.talent.findUnique({
          where: { userId: user.id }
        });

        if (!existingTalent) {
          console.log(`[ADMIN USER UPDATE] No Talent record found, creating one for user ${user.id}`);
          
          // Create Talent record for the newly promoted exclusive talent
          await prisma.talent.create({
            data: {
              id: `talent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: user.id,
              name: user.name || user.email.split("@")[0],
              displayName: user.name,
              primaryEmail: user.email,
              representationType: "EXCLUSIVE",  // Set as EXCLUSIVE since user role is now EXCLUSIVE_TALENT
              status: "ACTIVE",
              categories: [],
              stage: "ACTIVE"
            }
          });
          
          console.log(`[ADMIN USER UPDATE] Talent record created successfully for user ${user.id}`);
        } else {
          console.log(`[ADMIN USER UPDATE] Talent record already exists for user ${user.id}, updating representationType to EXCLUSIVE`);
          
          // Update existing talent's representation type to EXCLUSIVE
          await prisma.talent.update({
            where: { id: existingTalent.id },
            data: { representationType: "EXCLUSIVE" }
          });
        }
      } catch (talentError) {
        console.error("[ADMIN USER UPDATE] Error creating/updating Talent record:", talentError);
        // Don't fail the user update if talent creation fails - just log the error
      }
    }

    // Audit log role changes
    if (role && currentUser?.role && currentUser.role !== role) {
      try {
        await prisma.auditLog.create({
          data: {
            id: generateId(),
            userId: adminUserId,
            action: "USER_ROLE_CHANGED",
            entityType: "USER",
            entityId: user.id,
            metadata: {
              previousRole: currentUser.role,
              newRole: role,
              targetUserId: user.id,
              targetUserEmail: user.email
            },
            createdAt: new Date()
          }
        });
      } catch (error) {
        console.error("[Audit] Failed to log role change:", error);
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("[ADMIN USER UPDATE]", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * POST /api/admin/users/:id/link-brand
 * Link a BRAND role user to a brand
 * Body: { brandId }
 */
router.post("/users/:id/link-brand", async (req, res) => {
  try {
    const { id } = req.params;
    const { brandId } = req.body;

    if (!id || !brandId) {
      return res.status(400).json({ error: "User ID and Brand ID are required" });
    }

    // Verify user exists and has BRAND role
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "BRAND") {
      return res.status(400).json({ error: "Only BRAND role users can be linked to brands" });
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Create or update BrandUser entry
    const brandUser = await prisma.brandUser.upsert({
      where: {
        brandId_userId: {
          brandId,
          userId: id
        }
      },
      create: {
        id: `branduser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandId,
        userId: id,
        role: "ADMIN", // Default to ADMIN role for brand users
        status: "ACTIVE"
      },
      update: {
        status: "ACTIVE",
        role: "ADMIN"
      }
    });

    console.log(`[ADMIN] Linked user ${id} to brand ${brandId}`);
    res.json({ 
      success: true, 
      message: `User linked to brand successfully`,
      brandUser 
    });
  } catch (error) {
    console.error("[ADMIN LINK BRAND]", error);
    res.status(500).json({ error: "Failed to link user to brand" });
  }
});

/**
 * POST /api/admin/users/:userId/link-talent/:talentId
 * Link a user to a talent (admin only)
 * This creates or updates the Talent record with the user's ID
 */
router.post("/users/:userId/link-talent/:talentId", async (req, res) => {
  try {
    const { userId, talentId } = req.params;

    if (!userId || !talentId) {
      return res.status(400).json({ error: "userId and talentId are required" });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId }
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Update the talent to link it to the user
    const updatedTalent = await prisma.talent.update({
      where: { id: talentId },
      data: { userId }
    });

    // Update the user to set their role to EXCLUSIVE_TALENT if not already set
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: user.role === "CREATOR" ? user.role : "EXCLUSIVE_TALENT"
      }
    });

    console.log(`[ADMIN] Linked user ${userId} (${user.email}) to talent ${talentId} (${talent.name})`);
    
    res.json({ 
      success: true, 
      message: `User linked to talent successfully`,
      talent: {
        id: updatedTalent.id,
        name: updatedTalent.name,
        userId: updatedTalent.userId
      },
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("[ADMIN LINK TALENT]", error);
    res.status(500).json({ error: "Failed to link user to talent" });
  }
});

/**
 * POST /api/admin/talents/:talentId/add-email
 * Add an additional email to a talent (admin only)
 * Talents can have multiple emails linked
 */
router.post("/talents/:talentId/add-email", async (req, res) => {
  try {
    const { talentId } = req.params;
    const { email, label, isPrimary } = req.body;

    if (!talentId || !email) {
      return res.status(400).json({ error: "talentId and email are required" });
    }

    // Verify the talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId }
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Check if email already exists for this talent
    const existingEmail = await prisma.talentEmail.findUnique({
      where: {
        talentId_email: { talentId, email: email.toLowerCase() }
      }
    });

    if (existingEmail) {
      return res.status(409).json({ error: "Email already linked to this talent" });
    }

    // If this should be primary, unset primary on other emails
    if (isPrimary) {
      await prisma.talentEmail.updateMany({
        where: { talentId, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    // Create the new email record
    const talentEmail = await prisma.talentEmail.create({
      data: {
        talentId,
        email: email.toLowerCase(),
        label: label || null,
        isPrimary: isPrimary || false
      }
    });

    console.log(`[ADMIN] Added email ${email} to talent ${talentId} (${talent.name})`);

    res.json({ 
      success: true, 
      message: `Email added to talent successfully`,
      talentEmail
    });
  } catch (error) {
    console.error("[ADMIN ADD TALENT EMAIL]", error);
    res.status(500).json({ error: "Failed to add email to talent" });
  }
});

/**
 * GET /api/admin/talents/:talentId/emails
 * Get all emails linked to a talent (admin only)
 */
router.get("/talents/:talentId/emails", async (req, res) => {
  try {
    const { talentId } = req.params;

    // Verify the talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      include: { TalentEmail: true }
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    res.json({
      talentId,
      talentName: talent.name,
      emails: talent.TalentEmail || []
    });
  } catch (error) {
    console.error("[ADMIN GET TALENT EMAILS]", error);
    res.status(500).json({ error: "Failed to fetch talent emails" });
  }
});

/**
 * GET /api/admin/talents/search
 * Search talents by name or email (admin only)
 */
router.get("/talents/search", async (req, res) => {
  try {
    const query = (req.query.q as string || "").toLowerCase();

    if (!query || query.length < 2) {
      return res.json({ talents: [] });
    }

    const talents = await prisma.talent.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { primaryEmail: { contains: query, mode: "insensitive" } },
          { TalentEmail: { some: { email: { contains: query, mode: "insensitive" } } } }
        ]
      },
      select: {
        id: true,
        name: true,
        primaryEmail: true,
        representationType: true,
        status: true,
        userId: true
      },
      take: 20
    });

    res.json({ talents });
  } catch (error) {
    console.error("[ADMIN SEARCH TALENTS]", error);
    res.status(500).json({ error: "Failed to search talents" });
  }
});

/**
 * GET /api/admin/talents
 * Get all talents (admin only)
 */
router.get("/talents", async (req, res) => {
  try {
    const talents = await prisma.talent.findMany({
      select: {
        id: true,
        name: true,
        primaryEmail: true,
        representationType: true,
        status: true,
        userId: true
      },
      orderBy: { name: "asc" },
      take: 100
    });

    res.json({ talents });
  } catch (error) {
    console.error("[ADMIN GET TALENTS]", error);
    res.status(500).json({ error: "Failed to fetch talents" });
  }
});

export default router;
