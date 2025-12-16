import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const router = Router();

const requireAdmin = (req: Request, res: Response, next: Function) => {
  console.log("USERS.TS REQUIRE ADMIN FIRED", req.user);
  console.log("requireAdmin → roles:", req.user?.roles);
  const userRoles = req.user?.roles || [];
  if (!userRoles.includes("ADMIN") && !userRoles.includes("SUPER_ADMIN")) {
    console.log("❌ Access denied - user roles:", userRoles);
    return res.status(403).json({ error: "Forbidden: Access is restricted to administrators." });
  }
  console.log("✅ Admin access granted");
  next();
};

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

router.use("/api/users", requireAuth, requireAdmin);

const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
});

const UserCreateSchema = z.object({
  email: z.string().email(),
  roles: z.array(z.string()).min(1),
});

router.get("/api/users", async (req: Request, res: Response) => {
  try {
    console.log("📋 Fetching users list...");
    const limit = parseInt(req.query.limit as string) || 25;
    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { roles: { include: { role: true } } },
    });
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("❌ Error loading users:", error);
    res.status(500).json({ error: "Could not load users." });
  }
});

router.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Could not load user." });
  }
});

router.put("/api/users/:id", async (req: Request, res: Response) => {
  const parsed = UserUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

router.put("/api/users/:id/roles", async (req: Request, res: Response) => {
  const { roles } = req.body;
  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: "Invalid payload: 'roles' must be an array of strings." });
  }

  try {
    const rolesInDb = await prisma.role.findMany({ where: { name: { in: roles } } });
    const roleIds = rolesInDb.map(r => r.id);

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: req.params.id } }),
      prisma.userRole.createMany({ data: roleIds.map(roleId => ({ userId: req.params.id, roleId })) }),
    ]);

    res.status(200).json({ success: true, message: "User roles updated." });
  } catch (error) {
    console.error("Failed to update user roles:", error);
    res.status(500).json({ error: "Failed to update user roles." });
  }
});

router.post("/api/users", async (req: Request, res: Response) => {
  const parsed = UserCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const { email, roles } = parsed.data;
    const rolesInDb = await prisma.role.findMany({ where: { name: { in: roles } } });
    if (rolesInDb.length !== roles.length) {
      return res.status(400).json({ error: "One or more specified roles do not exist." });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        onboardingComplete: false,
        roles: {
          create: rolesInDb.map(role => ({ roleId: role.id })),
        },
      },
      include: { roles: { include: { role: true } } },
    });
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "A user with this email already exists." });
    }
    res.status(500).json({ error: "Could not create user." });
  }
});

router.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete user." });
  }
});

export default router;
