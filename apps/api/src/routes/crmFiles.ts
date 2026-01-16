import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin as checkIsAdmin } from '../lib/roleHelpers.js';
import {
  uploadFile as uploadFileToGCS,
  deleteFile as deleteFileFromGCS,
  buildObjectKey
} from '../services/storage/googleCloudStorage.js';
import { logAuditEvent } from '../lib/auditLogger.js';

/**
 * CRM File Management Routes
 * 
 * Handles file uploads for:
 * - Talent profile images, social proofs, media kits
 * - Deal documents, contracts, proposals
 * - Content deliverables, briefings
 * - Meeting recordings, notes
 */

const router = Router();

// ============================================================================
// TALENT FILES
// ============================================================================

/**
 * Upload talent profile image
 * POST /api/crm/files/talent/:talentId/profile-image
 */
router.post("/talent/:talentId/profile-image", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user!;
    const talentId = req.params.talentId;
    const { filename, content, type } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "filename and content required" });
    }

    // Check permissions
    const talent = await prisma.talent.findUnique({ where: { id: talentId } });
    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Parse base64 content
    const base64Data = content.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const contentType = type || "image/jpeg";

    // Upload to GCS
    const uploadResult = await uploadFileToGCS(
      buffer,
      filename,
      contentType,
      `talent-profiles/${talentId}`,
      currentUser.id
    );

    // Update talent profile image
    const updated = await prisma.talent.update({
      where: { id: talentId },
      data: {
        profileImage: uploadResult.signedUrl,
        profileImageKey: uploadResult.key,
      },
    } as any);

    // Log audit event
    await logAuditEvent(req, {
      action: "talent.profile_image_uploaded",
      entityType: "Talent",
      entityId: talentId,
      metadata: { filename, size: buffer.length, key: uploadResult.key },
    }).catch(() => null);

    res.json({
      success: true,
      url: uploadResult.signedUrl,
      talent: updated,
    });
  } catch (error) {
    console.error("[TALENT_IMAGE_UPLOAD]", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * Upload talent media kit or document
 * POST /api/crm/files/talent/:talentId/documents
 */
router.post("/talent/:talentId/documents", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user!;
    const talentId = req.params.talentId;
    const { filename, content, type, docType } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "filename and content required" });
    }

    // Parse base64
    const base64Data = content.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const contentType = type || "application/pdf";

    // Upload to GCS
    const uploadResult = await uploadFileToGCS(
      buffer,
      filename,
      contentType,
      `talent-documents/${talentId}`,
      currentUser.id
    );

    // Create file record
    const file = await prisma.talentFile.create({
      data: {
        id: `tf_${Date.now()}`,
        talentId,
        fileName: filename,
        fileType: docType || "document",
        mimeType: contentType,
        fileSize: buffer.length,
        category: docType || "Other",
        storageProvider: "gcs",
        storagePath: uploadResult.key,
        storageUrl: uploadResult.signedUrl,
        uploadedBy: currentUser.id,
      },
    });

    // Log audit
    await logAuditEvent(req, {
      action: "talent.document_uploaded",
      entityType: "TalentFile",
      entityId: file.id,
      metadata: { talentId, filename, docType, size: buffer.length },
    }).catch(() => null);

    res.json({ success: true, file });
  } catch (error) {
    console.error("[TALENT_DOC_UPLOAD]", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * List talent documents
 * GET /api/crm/files/talent/:talentId/documents
 */
router.get("/talent/:talentId/documents", requireAuth, async (req: Request, res: Response) => {
  try {
    const talentId = req.params.talentId;

    const files = await prisma.talentFile.findMany({
      where: { talentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        mimeType: true,
        fileSize: true,
        category: true,
        storageUrl: true,
        uploadedBy: true,
        createdAt: true,
      },
    });

    res.json({ files });
  } catch (error) {
    console.error("[LIST_TALENT_DOCS]", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

/**
 * Delete talent document
 * DELETE /api/crm/files/talent/:talentId/documents/:fileId
 */
router.delete("/talent/:talentId/documents/:fileId", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user!;
    const { talentId, fileId } = req.params;

    const file = await prisma.talentFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.talentId !== talentId) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check permissions
    const isAdmin = checkIsAdmin(currentUser);
    if (file.uploadedBy !== currentUser.id && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete from GCS
    await deleteFileFromGCS(file.storagePath).catch(() => null);

    // Delete record
    await prisma.talentFile.delete({ where: { id: fileId } });

    // Log audit
    await logAuditEvent(req, {
      action: "talent.document_deleted",
      entityType: "TalentFile",
      entityId: fileId,
    }).catch(() => null);

    res.json({ success: true });
  } catch (error) {
    console.error("[DELETE_TALENT_DOC]", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ============================================================================
// DEAL FILES (Contracts, Proposals, Deliverables)
// ============================================================================

/**
 * Upload deal document (contract, proposal, etc)
 * POST /api/crm/files/deal/:dealId/documents
 */
router.post("/deal/:dealId/documents", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user!;
    const dealId = req.params.dealId;
    const { filename, content, type, docType } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "filename and content required" });
    }

    // Verify deal exists
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Parse base64
    const base64Data = content.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const contentType = type || "application/pdf";

    // Upload to GCS
    const uploadResult = await uploadFileToGCS(
      buffer,
      filename,
      contentType,
      `deal-documents/${dealId}`,
      currentUser.id
    );

    // Create file record using generic File model
    const file = await prisma.file.create({
      data: {
        id: `df_${Date.now()}`,
        userId: currentUser.id,
        filename,
        type: contentType,
        key: uploadResult.key,
        url: uploadResult.signedUrl,
        size: buffer.length,
        folder: `deal-documents/${dealId}`,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await logAuditEvent(req, {
      action: "deal.document_uploaded",
      entityType: "File",
      entityId: file.id,
      metadata: { dealId, filename, docType, size: buffer.length },
    }).catch(() => null);

    res.json({ success: true, file });
  } catch (error) {
    console.error("[DEAL_DOC_UPLOAD]", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * List deal documents
 * GET /api/crm/files/deal/:dealId/documents
 */
router.get("/deal/:dealId/documents", requireAuth, async (req: Request, res: Response) => {
  try {
    const dealId = req.params.dealId;

    const files = await prisma.file.findMany({
      where: { folder: `deal-documents/${dealId}` },
      orderBy: { createdAt: "desc" },
    });

    res.json({ files });
  } catch (error) {
    console.error("[LIST_DEAL_DOCS]", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

/**
 * Delete deal document
 * DELETE /api/crm/files/deal/:dealId/documents/:fileId
 */
router.delete("/deal/:dealId/documents/:fileId", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user!;
    const { dealId, fileId } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.folder !== `deal-documents/${dealId}`) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check permissions
    const isAdmin = checkIsAdmin(currentUser);
    if (file.userId !== currentUser.id && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete from GCS
    await deleteFileFromGCS(file.key).catch(() => null);

    // Delete record
    await prisma.file.delete({ where: { id: fileId } });

    // Log audit
    await logAuditEvent(req, {
      action: "deal.document_deleted",
      entityType: "File",
      entityId: fileId,
    }).catch(() => null);

    res.json({ success: true });
  } catch (error) {
    console.error("[DELETE_DEAL_DOC]", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ============================================================================
// CAMPAIGN/BRAND DELIVERABLES
// ============================================================================

/**
 * Upload content deliverable
 * POST /api/crm/files/campaign/:campaignId/deliverables
 */
router.post("/campaign/:campaignId/deliverables", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user!;
    const campaignId = req.params.campaignId;
    const { filename, content, type, deliverableType, talentId } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "filename and content required" });
    }

    // Parse base64
    const base64Data = content.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const contentType = type || "application/octet-stream";

    // Upload to GCS
    const uploadResult = await uploadFileToGCS(
      buffer,
      filename,
      contentType,
      `deliverables/${campaignId}/${talentId || "unknown"}`,
      currentUser.id
    );

    // Create file record (use generic File model for deliverables)
    const deliverable = await prisma.file.create({
      data: {
        id: `del_${Date.now()}`,
        userId: currentUser.id,
        filename,
        type: contentType,
        key: uploadResult.key,
        url: uploadResult.signedUrl,
        size: buffer.length,
        folder: `deliverables/${campaignId}/${talentId || "unknown"}`,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await logAuditEvent(req, {
      action: "deliverable.uploaded",
      entityType: "File",
      entityId: deliverable.id,
      metadata: { campaignId, talentId, filename, size: buffer.length },
    }).catch(() => null);

    res.json({ success: true, deliverable });
  } catch (error) {
    console.error("[DELIVERABLE_UPLOAD]", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * List campaign deliverables
 * GET /api/crm/files/campaign/:campaignId/deliverables
 */
router.get("/campaign/:campaignId/deliverables", requireAuth, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId;

    const deliverables = await prisma.file.findMany({
      where: {
        folder: { startsWith: `deliverables/${campaignId}` },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ deliverables });
  } catch (error) {
    console.error("[LIST_DELIVERABLES]", error);
    res.status(500).json({ error: "Failed to list deliverables" });
  }
});

export default router;
