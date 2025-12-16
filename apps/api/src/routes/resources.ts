import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Create a new resource (admin only)
router.post("/", async (req, res) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { roles: true },
    });

    const isAdmin = user?.roles?.some(
      (role) => role.name === "ADMIN" || role.name === "SUPER_ADMIN"
    );

    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { title, description, type, audience, protected: isProtected } = req.body;

    // Validate required fields
    if (!title || !description || !type || !audience) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type,
        audience,
        protected: isProtected || false,
        createdById: req.session.userId,
      },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

// Update a resource (admin only)
router.patch("/:id", async (req, res) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { roles: true },
    });

    const isAdmin = user?.roles?.some(
      (role) => role.name === "ADMIN" || role.name === "SUPER_ADMIN"
    );

    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { id } = req.params;
    const { title, description, type, audience, protected: isProtected } = req.body;

    const resource = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(audience && { audience }),
        ...(typeof isProtected === "boolean" && { protected: isProtected }),
      },
    });

    res.json(resource);
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

// Delete a resource (admin only)
router.delete("/:id", async (req, res) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { roles: true },
    });

    const isAdmin = user?.roles?.some(
      (role) => role.name === "ADMIN" || role.name === "SUPER_ADMIN"
    );

    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { id } = req.params;

    await prisma.resource.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
