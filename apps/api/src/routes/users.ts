import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../services/emailService.js";
import { isSuperAdmin, isAdmin } from "../lib/roleHelpers.js";

const router = Router();

const requireAdmin = (req: Request, res: Response, next: Function) => {
  console.log("USERS.TS REQUIRE ADMIN FIRED");
  console.log("req.user:", JSON.stringify(req.user, null, 2));
  console.log("requireAdmin → role:", req.user?.role);
  
  if (!req.user) {
    console.log("❌ Access denied - no user found in request");
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // CRITICAL: Superadmin bypasses admin check
  if (isSuperAdmin(req.user)) {
    console.log("✅ Superadmin access granted");
    return next();
  }
  
  if (!isAdmin(req.user)) {
    console.log("❌ Access denied - user role:", req.user.role);
    return res.status(403).json({ error: "Forbidden: Access is restricted to administrators." });
  }
  console.log("✅ Admin access granted");
  next();
};

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

// Apply middleware to all routes below
router.use(requireAuth, requireAdmin);

const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  password: z.string().min(6).optional(),
});

const UserCreateSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
  name: z.string().optional(),
  password: z.string().min(6).optional(),
});

router.get("/pending", async (req: Request, res: Response) => {
  try {
    console.log("📋 Fetching pending users...");
    const pendingUsers = await prisma.user.findMany({
      where: {
        onboarding_status: "pending_review"
      },
      orderBy: { createdAt: "desc" }
    });
    console.log(`✅ Found ${pendingUsers.length} pending users`);
    res.json(pendingUsers);
  } catch (error) {
    console.error("❌ Error loading pending users:", error);
    res.status(500).json({ error: "Could not load pending users." });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("📋 Fetching users list...");
    const limit = parseInt(req.query.limit as string) || 25;
    const users = await prisma.user.findMany({
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });
    console.log(`✅ Found ${users.length} users`);
    res.json({ users });
  } catch (error) {
    console.error("❌ Error loading users:", error);
    res.status(500).json({ error: "Could not load users." });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Could not load user." });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const parsed = UserUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const { password, ...otherData } = parsed.data;
    const updateData: any = { ...otherData };
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

router.put("/:id/role", async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role || typeof role !== 'string') {
    return res.status(400).json({ error: "Invalid payload: 'role' must be a string." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });

    res.status(200).json({ success: true, message: "User role updated.", user: updatedUser });
  } catch (error) {
    console.error("Failed to update user role:", error);
    res.status(500).json({ error: "Failed to update user role." });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = UserCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const { email, role, name, password } = parsed.data;
    
    // Generate secure setup token (valid for 7 days)
    const setupToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const userData: any = {
      email,
      name: name || email.split("@")[0],
      role: role,
      onboardingComplete: false,
      onboarding_status: "invited",
      // Store setup token temporarily in admin_notes as JSON until we add proper token field
      admin_notes: JSON.stringify({
        setupToken,
        tokenExpiry: tokenExpiry.toISOString(),
        invitedBy: req.user?.email || "admin"
      })
    };
    
    // Hash password if provided
    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }
    
    const newUser = await prisma.user.create({
      data: userData,
    });
    
    // Send account setup email
    const webUrl = process.env.WEB_URL || "http://localhost:5173";
    const setupUrl = `${webUrl}/setup?token=${setupToken}&email=${encodeURIComponent(email)}`;
    
    try {
      await sendEmail({
        to: email,
        template: "account-setup",
        userId: newUser.id,
        data: {
          name: newUser.name || email.split("@")[0],
          role: role,
          setupUrl,
          inviterName: req.user?.name || req.user?.email || "The Break team"
        }
      });
      console.log(`✅ Setup email sent to ${email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send setup email:", emailError);
      // Don't fail user creation if email fails
    }
    
    res.status(201).json(newUser);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "A user with this email already exists." });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Could not create user." });
  }
});

router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        onboarding_status: "approved",
        onboardingComplete: true,
        updatedAt: new Date()
      }
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

router.post("/:id/reject", async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        onboarding_status: "rejected",
        admin_notes: reason || "Application rejected",
        updatedAt: new Date()
      }
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete user." });
  }
});

export default router;
