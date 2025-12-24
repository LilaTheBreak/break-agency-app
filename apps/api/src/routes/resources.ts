import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import multer from "multer";
import { saveUploadedFile } from "../services/fileService.js";
import { isSuperAdmin, isAdmin } from "../lib/roleHelpers.js";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, Office documents, and ZIP files
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/zip",
      "application/x-zip-compressed",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images, ZIP."));
    }
  },
});

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  // CRITICAL: Superadmin bypasses admin check
  if (user && isSuperAdmin(user)) return next();
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// POST /upload - Upload file (admin only)
router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Save file using the file service
      const savedFile = await saveUploadedFile(user.id, file);

      res.status(201).json({
        success: true,
        url: savedFile.url,
        fileId: savedFile.id,
        filename: savedFile.filename,
        type: savedFile.type,
        size: savedFile.size,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  }
);

// GET /resources - Get all resources (public + protected based on auth)
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, type, visibility } = req.query;

    // Non-admins can only see published resources
    if (!user || !isAdmin(user)) {
      where.status = "PUBLISHED";
      
      // If not logged in, can only see public resources
      if (!user) {
        where.visibility = "PUBLIC";
      }
    } else {e.visibility = "PUBLIC";
      }
    } else {
      // Admins can filter by status
      if (status) where.status = status;
    }

    if (type) where.resourceType = type;
    if (visibility) where.visibility = visibility;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            ResourceRsvp: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if user has RSVP'd to any events
    let userRsvps: string[] = [];
    if (user) {
      const rsvps = await prisma.resourceRsvp.findMany({
        where: { userId: user.id },
        select: { resourceId: true },
      });
      userRsvps = rsvps.map((r) => r.resourceId);
    }

    const resourcesWithRsvp = resources.map((r) => ({
      ...r,
      rsvpCount: r._count.ResourceRsvp,
      userHasRsvp: userRsvps.includes(r.id),
      _count: undefined,
    }));

    res.json(resourcesWithRsvp);
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// GET /:id - Get single resource
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            ResourceRsvp: true,
          },
        },
      },
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Check access permissions
    const isUserAdmin = user && isAdmin(user);
    
    if (!isUserAdmin) {
      // Non-admins can only see published resources
      if (resource.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Resource not found" });
      }

      // Check visibility
      if (resource.visibility === "PROTECTED" && !user) {
        return res.status(401).json({ error: "Login required to view this resource" });
      }

      // Check audience restrictions
      if (resource.allowedAudiences.length > 0 && user) {
        if (!resource.allowedAudiences.includes(user.role)) {
          return res.status(403).json({ error: "You don't have access to this resource" });
        }
      }
    }

    // Increment view count
    await prisma.resource.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Check if user has RSVP'd
    let userHasRsvp = false;
    if (user) {
      const rsvp = await prisma.resourceRsvp.findUnique({
        where: {
          resourceId_userId: {
            resourceId: id,
            userId: user.id,
          },
        },
      });
      userHasRsvp = !!rsvp;
    }

    res.json({
      ...resource,
      rsvpCount: resource._count.ResourceRsvp,
      userHasRsvp,
      _count: undefined,
    });
  } catch (error: any) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

// POST / - Create new resource (admin only)
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      title,
      shortDescription,
      longDescription,
      resourceType,
      uploadUrl,
      externalUrl,
      thumbnailUrl,
      status,
      visibility,
      allowedAudiences,
      metadata,
      eventDate,
      eventTime,
      hasReplay,
      rsvpEnabled,
      rsvpOpen,
    } = req.body;

    // Validation
    if (!title || !shortDescription || !resourceType) {
      return res.status(400).json({
        error: "Missing required fields: title, shortDescription, resourceType",
      });
    }

    // Validate resource type
    const validTypes = ["TEMPLATE", "GUIDE", "ARTICLE", "WEBINAR", "EVENT"];
    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({
        error: `Invalid resource type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Note: uploadUrl and externalUrl are both optional
    // Resources can be created without files (e.g., event registrations)

    const resource = await prisma.resource.create({
      data: {
        title,
        shortDescription,
        longDescription,
        resourceType,
        uploadUrl,
        uploadFilename,
        uploadFileType,
        uploadFileSize,
        externalUrl,
        thumbnailUrl,
        status: status || "DRAFT",
        visibility: visibility || "PUBLIC",
        allowedAudiences: allowedAudiences || [],
        metadata,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventTime,
        hasReplay,
        rsvpEnabled: rsvpEnabled || false,
        rsvpOpen: rsvpOpen !== undefined ? rsvpOpen : true,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(resource);
  } catch (error: any) {
    console.error("Error creating resource:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

// PUT /:id - Update resource (admin only)
router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      shortDescription,
      longDescription,
      resourceType,
      uploadUrl,
      uploadFilename,
      uploadFileType,
      uploadFileSize,
      externalUrl,
      thumbnailUrl,
      status,
      visibility,
      allowedAudiences,
      metadata,
      eventDate,
      eventTime,
      hasReplay,
      rsvpEnabled,
      rsvpOpen,
    } = req.body;

    // Check if resource exists
    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (longDescription !== undefined) updateData.longDescription = longDescription;
    if (resourceType !== undefined) updateData.resourceType = resourceType;
    if (uploadUrl !== undefined) updateData.uploadUrl = uploadUrl;
    if (uploadFilename !== undefined) updateData.uploadFilename = uploadFilename;
    if (uploadFileType !== undefined) updateData.uploadFileType = uploadFileType;
    if (uploadFileSize !== undefined) updateData.uploadFileSize = uploadFileSize;
    if (externalUrl !== undefined) updateData.externalUrl = externalUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (status !== undefined) updateData.status = status;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (allowedAudiences !== undefined) updateData.allowedAudiences = allowedAudiences;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null;
    if (eventTime !== undefined) updateData.eventTime = eventTime;
    if (hasReplay !== undefined) updateData.hasReplay = hasReplay;
    if (rsvpEnabled !== undefined) updateData.rsvpEnabled = rsvpEnabled;
    if (rsvpOpen !== undefined) updateData.rsvpOpen = rsvpOpen;

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            ResourceRsvp: true,
          },
        },
      },
    });

    res.json(resource);
  } catch (error: any) {
    console.error("Error updating resource:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

// DELETE /:id - Delete resource (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Resource not found" });
    }

    await prisma.resource.delete({
      where: { id },
    });

    res.json({ success: true, message: "Resource deleted" });
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

// POST /:id/rsvp - RSVP to event (authenticated users)
router.post("/:id/rsvp", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (!resource.rsvpEnabled) {
      return res.status(400).json({ error: "RSVP is not enabled for this resource" });
    }

    if (!resource.rsvpOpen) {
      return res.status(400).json({ error: "RSVP is closed for this resource" });
    }

    // Check if already RSVP'd
    const existing = await prisma.resourceRsvp.findUnique({
      where: {
        resourceId_userId: {
          resourceId: id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "You have already RSVP'd to this resource" });
    }

    const rsvp = await prisma.resourceRsvp.create({
      data: {
        resourceId: id,
        userId: user.id,
        status: "confirmed",
      },
    });

    res.status(201).json({ success: true, rsvp });
  } catch (error: any) {
    console.error("Error creating RSVP:", error);
    res.status(500).json({ error: "Failed to create RSVP" });
  }
});

// DELETE /:id/rsvp - Cancel RSVP (authenticated users)
router.delete("/:id/rsvp", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const existing = await prisma.resourceRsvp.findUnique({
      where: {
        resourceId_userId: {
          resourceId: id,
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "RSVP not found" });
    }

    await prisma.resourceRsvp.delete({
      where: {
        resourceId_userId: {
          resourceId: id,
          userId: user.id,
        },
      },
    });

    res.json({ success: true, message: "RSVP cancelled" });
  } catch (error: any) {
    console.error("Error cancelling RSVP:", error);
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
});

// GET /:id/rsvps - Get all RSVPs for a resource (admin only)
router.get("/:id/rsvps", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rsvps = await prisma.resourceRsvp.findMany({
      where: { resourceId: id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(rsvps);
  } catch (error: any) {
    console.error("Error fetching RSVPs:", error);
    res.status(500).json({ error: "Failed to fetch RSVPs" });
  }
});

export default router;
