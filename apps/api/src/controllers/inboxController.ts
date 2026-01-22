import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { buildAuthUrl } from "../services/gmail/oauthService.js";
import crypto from "crypto";

/**
 * Get all inboxes for the current user
 */
export async function getInboxes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const inboxes = await prisma.inbox.findMany({
      where: {
        userId,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      success: true,
      inboxes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single inbox by ID
 */
export async function getInboxById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { inboxId } = req.params;

    const inbox = await prisma.inbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox || inbox.userId !== userId) {
      res.status(404).json({
        error: "inbox_not_found",
        message: "Inbox not found or you don't have access to it",
      });
      return;
    }

    res.json({
      success: true,
      inbox,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new inbox
 * For Gmail: starts OAuth flow
 */
export async function createInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { provider, emailAddress, ownerType, ownerId } = req.body;

    // Validate input
    if (!provider || !emailAddress) {
      res.status(400).json({
        error: "invalid_input",
        message: "provider and emailAddress are required",
      });
      return;
    }

    // Check if inbox already exists
    const existingInbox = await prisma.inbox.findUnique({
      where: {
        userId_provider_emailAddress: {
          userId,
          provider,
          emailAddress,
        },
      },
    });

    if (existingInbox) {
      res.status(400).json({
        error: "inbox_exists",
        message: "This inbox is already connected",
      });
      return;
    }

    // For Gmail, return OAuth URL
    if (provider === "gmail") {
      // Generate a state token for OAuth security
      const state = crypto.randomBytes(32).toString("hex");
      
      // Store state in session or database for verification (optional but recommended)
      // For now, we'll just generate the auth URL
      const authUrl = buildAuthUrl(state);

      res.json({
        success: true,
        provider: "gmail",
        authUrl,
        state,
        message: "Redirect to this URL to authorize Gmail access",
      });
      return;
    }

    // For other providers (Outlook, etc.), return placeholder
    if (provider === "outlook") {
      res.status(501).json({
        error: "provider_not_implemented",
        message: "Outlook integration coming soon",
      });
      return;
    }

    res.status(400).json({
      error: "invalid_provider",
      message: `Provider "${provider}" is not supported`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an inbox (set as default, update sync status, etc.)
 */
export async function updateInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { inboxId } = req.params;
    const { isDefault, syncStatus } = req.body;

    // Verify ownership
    const inbox = await prisma.inbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox || inbox.userId !== userId) {
      res.status(404).json({
        error: "inbox_not_found",
        message: "Inbox not found or you don't have access to it",
      });
      return;
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.inbox.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: inboxId },
        },
        data: { isDefault: false },
      });
    }

    // Update the inbox
    const updatedInbox = await prisma.inbox.update({
      where: { id: inboxId },
      data: {
        ...(isDefault !== undefined && { isDefault }),
        ...(syncStatus !== undefined && { syncStatus }),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      inbox: updatedInbox,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an inbox
 * Prevents deletion of the last/default inbox
 */
export async function deleteInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { inboxId } = req.params;

    // Verify ownership
    const inbox = await prisma.inbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox || inbox.userId !== userId) {
      res.status(404).json({
        error: "inbox_not_found",
        message: "Inbox not found or you don't have access to it",
      });
      return;
    }

    // Check if this is the only inbox
    const inboxCount = await prisma.inbox.count({
      where: { userId },
    });

    if (inboxCount === 1) {
      res.status(400).json({
        error: "cannot_delete_only_inbox",
        message: "Cannot delete your only inbox. Please add another inbox first.",
      });
      return;
    }

    // If this is the default inbox, make another one default
    if (inbox.isDefault) {
      const nextInbox = await prisma.inbox.findFirst({
        where: {
          userId,
          id: { not: inboxId },
        },
        orderBy: { createdAt: "asc" },
      });

      if (nextInbox) {
        await prisma.inbox.update({
          where: { id: nextInbox.id },
          data: { isDefault: true },
        });
      }
    }

    // Delete the inbox
    await prisma.inbox.delete({
      where: { id: inboxId },
    });

    res.json({
      success: true,
      message: "Inbox deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get the default inbox for the user
 */
export async function getDefaultInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const inbox = await prisma.inbox.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!inbox) {
      res.status(404).json({
        error: "no_default_inbox",
        message: "No default inbox found",
      });
      return;
    }

    res.json({
      success: true,
      inbox,
    });
  } catch (error) {
    next(error);
  }
}
