/**
 * Example API Endpoints with Truth Layer
 * 
 * This file demonstrates how to implement standardized API responses
 * using the truth layer utilities. Copy these patterns to other endpoints.
 */

import express from "express";
import {
  apiResponse,
  emptyResponse,
  syncingResponse,
  limitedResponse,
  notImplementedResponse,
  featureDisabledResponse,
  errorResponse,
  withTruthLayer
} from "../utils/apiTruthLayer.js";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

/**
 * Example 1: Standard data endpoint with empty state handling
 */
router.get("/tasks", requireAuth, withTruthLayer(async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await prisma.creatorTask.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" }
    });

    // Return empty response with context if no data
    if (tasks.length === 0) {
      return req.emptyResponse("tasks", "no-data", {
        action: {
          label: "Create Your First Task",
          endpoint: "POST /api/tasks",
          description: "Start organizing your work with tasks"
        }
      });
    }

    // Return data with standard metadata
    req.apiResponse(tasks, {
      dataState: "ready",
      count: tasks.length,
      source: "database"
    });
  } catch (error) {
    req.errorResponse(error.message, { endpoint: "/tasks" });
  }
}));

/**
 * Example 2: Endpoint with syncing state (Gmail messages)
 */
router.get("/messages", requireAuth, withTruthLayer(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check last Gmail sync status
    const gmailToken = await prisma.gmailToken.findUnique({
      where: { userId },
      select: { lastSync: true, syncStatus: true }
    });

    const messages = await prisma.inboxMessage.findMany({
      where: { userId },
      orderBy: { receivedAt: "desc" },
      take: 50
    });

    // If sync is in progress, return syncing response
    if (gmailToken?.syncStatus === "syncing") {
      return req.syncingResponse("messages", {
        partialData: messages,
        lastSync: gmailToken.lastSync,
        status: "in-progress",
        estimatedCompletion: "1-2 minutes"
      });
    }

    // If no messages and no Gmail connection
    if (messages.length === 0 && !gmailToken) {
      return req.emptyResponse("messages", "not-configured", {
        action: {
          label: "Connect Gmail",
          link: "/settings/integrations",
          description: "Connect your Gmail account to see messages"
        }
      });
    }

    // Return messages with sync metadata
    req.apiResponse(messages, {
      dataState: "ready",
      count: messages.length,
      syncStatus: {
        lastSync: gmailToken?.lastSync,
        status: gmailToken?.syncStatus || "idle"
      }
    });
  } catch (error) {
    req.errorResponse(error.message, { endpoint: "/messages" });
  }
}));

/**
 * Example 3: Limited data endpoint (Stripe integration incomplete)
 */
router.get("/invoices", requireAuth, withTruthLayer(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if Stripe is configured
    const hasStripeConfig = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_");
    
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    // If Stripe not configured, return limited response
    if (!hasStripeConfig) {
      return req.limitedResponse(invoices, [
        "Payment provider not fully connected",
        "Only manually created invoices are visible",
        "Automatic invoice generation unavailable"
      ]);
    }

    if (invoices.length === 0) {
      return req.emptyResponse("invoices", "no-data", {
        message: "No invoices yet. Invoices will appear here once deals are finalized."
      });
    }

    req.apiResponse(invoices, {
      dataState: "ready",
      count: invoices.length,
      paymentProvider: "stripe"
    });
  } catch (error) {
    req.errorResponse(error.message, { endpoint: "/invoices" });
  }
}));

/**
 * Example 4: Not implemented endpoint (Social analytics)
 */
router.get("/analytics/socials", requireAuth, (req, res) => {
  res.status(501).json(notImplementedResponse(
    "Social Analytics",
    [
      "Instagram OAuth integration",
      "TikTok OAuth integration", 
      "YouTube OAuth integration",
      "Social post database models",
      "Analytics aggregation service",
      "Follower/engagement tracking"
    ]
  ));
});

/**
 * Example 5: Feature disabled endpoint
 */
router.get("/creator/suggested-tasks", requireAuth, (req, res) => {
  res.status(403).json(featureDisabledResponse(
    "AI Task Suggestions",
    [
      "OpenAI API integration configured",
      "Deal analysis prompt templates created",
      "Task suggestion algorithm implemented",
      "User preference settings added"
    ]
  ));
});

/**
 * Example 6: Opportunities with backend ready state
 */
router.get("/opportunities", requireAuth, withTruthLayer(async (req, res) => {
  try {
    const userRole = req.user.role;
    
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: "ACTIVE",
        // Filter by role
        ...(userRole === "CREATOR" && {
          OR: [
            { visibility: "PUBLIC" },
            { invitedCreators: { some: { id: req.user.id } } }
          ]
        })
      },
      include: {
        brand: {
          select: { name: true, logoUrl: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (opportunities.length === 0) {
      return req.emptyResponse("opportunities", "no-data", {
        message: userRole === "CREATOR" 
          ? "No opportunities available right now. Check back soon for new opportunities."
          : "No opportunities posted yet. Create your first opportunity to find creators.",
        action: userRole === "BRAND" ? {
          label: "Post Opportunity",
          endpoint: "POST /api/opportunities"
        } : null
      });
    }

    req.apiResponse(opportunities, {
      dataState: "ready",
      count: opportunities.length,
      userRole
    });
  } catch (error) {
    req.errorResponse(error.message, { endpoint: "/opportunities" });
  }
}));

/**
 * Example 7: Create endpoint with validation
 */
router.post("/tasks", requireAuth, withTruthLayer(async (req, res) => {
  try {
    const { title, description, dueDate, dealId } = req.body;

    if (!title) {
      return res.status(400).json(errorResponse("Title is required", {
        field: "title",
        validation: "required"
      }));
    }

    const task = await prisma.creatorTask.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: req.user.id,
        dealId: dealId || null,
        status: "NOT_STARTED"
      }
    });

    res.status(201).json(apiResponse(task, {
      dataState: "ready",
      created: true,
      message: "Task created successfully"
    }));
  } catch (error) {
    req.errorResponse(error.message, { endpoint: "POST /tasks" });
  }
}));

export default router;
