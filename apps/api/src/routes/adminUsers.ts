import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.use(requireRole(["admin", "ADMIN"]));

router.delete("/admin/users/:email", async (req, res) => {
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

router.post("/admin/users", async (req, res) => {
  const email = (req.body?.email || "").toLowerCase();
  const roleNameRaw = req.body?.role;
  if (!email || !roleNameRaw) {
    return res.status(400).json({ error: "email and role are required" });
  }
  const normalizedRole = String(roleNameRaw).toUpperCase();
  try {
    const role = await prisma.role.upsert({
      where: { name: normalizedRole },
      update: {},
      create: { name: normalizedRole }
    });
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id }
    });
    res.status(201).json({ user: { email: user.email, role: role.name } });
  } catch (error) {
    console.error("Create user failed", error);
    res.status(500).json({ error: "Unable to create user" });
  }
});

export default router;
