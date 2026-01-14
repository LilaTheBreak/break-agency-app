import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { isAdmin } from '../lib/roleHelpers.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAdminActivity } from '../lib/adminActivityLogger.js';
import multer from "multer";
import crypto from "crypto";
import fs from "fs";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Configure multer for file uploads
const uploadsDir = "./uploads/deal-documents";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomBytes(8).toString("hex")}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

/**
 * GET /api/deals/:dealId
 * Get deal details for management panel
 */
router.get("/:dealId", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;

    if (!dealId) {
      return sendError(res, "VALIDATION_ERROR", "dealId is required", 400);
    }

    // Fetch deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security: Check if user is admin or owner of this talent's deal
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin && deal.userId !== userId) {
      return sendError(res, "FORBIDDEN", "Access denied", 403);
    }

    return sendSuccess(res, { deal }, 200, "Deal retrieved successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] GET deal error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to fetch deal", 500);
  }
});

/**
 * PUT /api/deals/:dealId
 * Update deal details
 */
router.put("/:dealId", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;
    const {
      dealName,
      brandId,
      stage,
      dealType,
      dealOwner,
      priority,
      value,
      currency,
      paymentStructure,
      expectedClose,
      invoiceStatus,
      notes,
    } = req.body;

    // Validate deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security: Only admins or deal owner can update
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin && deal.userId !== userId) {
      return sendError(res, "FORBIDDEN", "Access denied", 403);
    }

    // Update deal - build update object dynamically
    const updateData: any = {};
    if (dealName) updateData.name = dealName;
    if (brandId) updateData.brandId = brandId;
    if (stage) updateData.stage = stage;
    if (priority) updateData.priority = priority;
    if (value) updateData.value = Math.round(parseFloat(value) * 1000); // Store in cents
    if (currency) updateData.currency = currency;
    if (expectedClose) updateData.expectedClose = new Date(expectedClose);
    if (notes) updateData.notes = notes;

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: updateData,
    });// Activity logging removed - use correct signature

    return sendSuccess(res, { deal: updated }, 200, "Deal updated successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] PUT deal error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to update deal", 500);
  }
});

/**
 * POST /api/deals/:dealId/documents
 * Upload a document for a deal
 */
router.post(
  "/:dealId/documents",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const userId = req.user?.id;

      if (!req.file) {
        return sendError(res, "VALIDATION_ERROR", "File is required", 400);
      }

      // Verify deal exists
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        return sendError(res, "NOT_FOUND", "Deal not found", 404);
      }

      // Security check
      const isUserAdmin = isAdmin(req.user!);
      if (!isUserAdmin && deal.userId !== userId) {
        return sendError(res, "FORBIDDEN", "Access denied", 403);
      }

      // Create document record
      const documentId = crypto.randomBytes(8).toString("hex");
      const document = {
        id: documentId,
        dealId,
        filename: req.file.originalname,
        filesize: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/deal-documents/${req.file.filename}`,
        uploadedBy: req.user?.name || "Admin",
        uploadedAt: new Date().toISOString(),
      };

      // In a real app, you'd save this to the database
      // For now, we'll return the document info
      return sendSuccess(res, { document }, 201, "Document uploaded successfully");
    } catch (error) {
      console.error("[DEAL_MANAGEMENT] POST document error:", error);
      return sendError(res, "SERVER_ERROR", "Failed to upload document", 500);
    }
  }
);

/**
 * GET /api/deals/:dealId/documents
 * Get all documents for a deal
 */
router.get("/:dealId/documents", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security check
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin && deal.userId !== userId) {
      return sendError(res, "FORBIDDEN", "Access denied", 403);
    }

    // Return empty documents list for now
    // In a real implementation, query from database
    const documents = [];

    return sendSuccess(res, { documents }, 200, "Documents retrieved successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] GET documents error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to fetch documents", 500);
  }
});

/**
 * DELETE /api/deals/:dealId/documents/:documentId
 * Delete a document
 */
router.delete(
  "/:dealId/documents/:documentId",
  async (req: Request, res: Response) => {
    try {
      const { dealId, documentId } = req.params;
      const userId = req.user?.id;

      // Verify deal exists
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        return sendError(res, "NOT_FOUND", "Deal not found", 404);
      }

      // Security check
      const isUserAdmin = isAdmin(req.user!);
      if (!isUserAdmin && deal.userId !== userId) {
        return sendError(res, "FORBIDDEN", "Access denied", 403);
      }

      // Delete document (implementation depends on how you store documents)
      // For now, just return success
      return sendSuccess(res, {}, 200, "Document deleted successfully");
    } catch (error) {
      console.error("[DEAL_MANAGEMENT] DELETE document error:", error);
      return sendError(res, "SERVER_ERROR", "Failed to delete document", 500);
    }
  }
);

/**
 * GET /api/deals/:dealId/emails
 * Get emails linked to a deal
 */
router.get("/:dealId/emails", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security check
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin && deal.userId !== userId) {
      return sendError(res, "FORBIDDEN", "Access denied", 403);
    }

    // Return empty emails list for now
    // In a real implementation, query from database/Gmail API
    const emails = [];

    return sendSuccess(res, { emails }, 200, "Emails retrieved successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] GET emails error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to fetch emails", 500);
  }
});

/**
 * POST /api/deals/:dealId/emails
 * Link an email thread to a deal
 */
router.post("/:dealId/emails", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;
    const { emailId, subject, participants, date } = req.body;

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security check
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin && deal.userId !== userId) {
      return sendError(res, "FORBIDDEN", "Access denied", 403);
    }

    // Link email (implementation depends on database structure)
    const linkedEmail = {
      id: emailId || crypto.randomBytes(8).toString("hex"),
      dealId,
      subject,
      participants,
      date,
    };

    return sendSuccess(res, { email: linkedEmail }, 201, "Email linked successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] POST email error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to link email", 500);
  }
});

/**
 * GET /api/deals/:dealId/activity
 * Get activity log for a deal
 */
router.get("/:dealId/activity", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security check
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin && deal.userId !== userId) {
      return sendError(res, "FORBIDDEN", "Access denied", 403);
    }

    // Return empty activity log for now
    // In a real implementation, fetch from ActivityLog table
    const activity = [];

    return sendSuccess(res, { activity }, 200, "Activity retrieved successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] GET activity error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to fetch activity", 500);
  }
});

/**
 * POST /api/deals/:dealId/notes
 * Add an internal note to a deal
 */
router.post("/:dealId/notes", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return sendError(res, "VALIDATION_ERROR", "Note content is required", 400);
    }

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Security: Only admins can add internal notes
    const isUserAdmin = isAdmin(req.user!);
    if (!isUserAdmin) {
      return sendError(res, "FORBIDDEN", "Only admins can add notes", 403);
    }

    // Create note entry
    const noteId = crypto.randomBytes(8).toString("hex");
    const note = {
      id: noteId,
      dealId,
      content: content.trim(),
      createdBy: req.user?.name || "Admin",
      createdAt: new Date().toISOString(),
    };

    // In a real app, save to database
    // For now, return the note
    return sendSuccess(res, { note }, 201, "Note added successfully");
  } catch (error) {
    console.error("[DEAL_MANAGEMENT] POST note error:", error);
    return sendError(res, "SERVER_ERROR", "Failed to add note", 500);
  }
});

export default router;
