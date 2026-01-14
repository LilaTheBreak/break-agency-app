import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import prisma from '../lib/prisma.js';
import { isAdmin, isSuperAdmin } from '../lib/roleHelpers.js';
import { logError } from '../lib/logger.js';

const router = Router();

// Phase 5: Global search across entities
// GET /api/search?q=query&types=brands,deals,campaigns&limit=10
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string)?.trim();
    const types = (req.query.types as string)?.split(",") || ["brands", "deals", "campaigns", "events", "contracts", "contacts"];
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const isAdminUser = isAdmin(req.user!) || isSuperAdmin(req.user!);

    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: "Query too short",
        message: "Search query must be at least 2 characters"
      });
    }

    const searchTerm = `%${query}%`;
    const results: Record<string, any[]> = {};

    // Phase 5: Role-based scoping - admins see all, others see only their data
    const whereClause = isAdminUser ? {} : { userId };

    // Search Brands
    if (types.includes("brands")) {
      try {
        const brands = await prisma.crmBrand.findMany({
          where: {
            ...whereClause,
            OR: [
              { brandName: { contains: query, mode: "insensitive" } },
              { website: { contains: query, mode: "insensitive" } },
              { industry: { contains: query, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            brandName: true,
            website: true,
            industry: true,
            status: true
          },
          take: limit
        });
        results.brands = brands;
      } catch (err) {
        logError("Error searching brands", err);
        results.brands = [];
      }
    }

    // Search Contacts
    if (types.includes("contacts")) {
      try {
        const contacts = await prisma.crmBrandContact.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { title: { contains: query, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            crmBrandId: true,
            CrmBrand: {
              select: {
                id: true,
                brandName: true
              }
            }
          },
          take: limit
        });
        results.contacts = contacts;
      } catch (err) {
        logError("Error searching contacts", err);
        results.contacts = [];
      }
    }

    // Search Deals
    if (types.includes("deals")) {
      try {
        const deals = await prisma.deal.findMany({
          where: {
            ...whereClause,
            OR: [
              { campaignName: { contains: query, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            campaignName: true,
            stage: true,
            value: true,
            brandId: true,
            Brand: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: limit
        });
        results.deals = deals;
      } catch (err) {
        logError("Error searching deals", err);
        results.deals = [];
      }
    }

    // Search Campaigns
    if (types.includes("campaigns")) {
      try {
        const campaigns = await prisma.crmCampaign.findMany({
          where: {
            ...whereClause,
            OR: [
              { campaignName: { contains: query, mode: "insensitive" } },
              { campaignType: { contains: query, mode: "insensitive" } },
              { status: { contains: query, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            campaignName: true,
            campaignType: true,
            status: true,
            brandId: true,
            Brand: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: limit
        });
        results.campaigns = campaigns;
      } catch (err) {
        logError("Error searching campaigns", err);
        results.campaigns = [];
      }
    }

    // Search Events (CrmTask)
    if (types.includes("events")) {
      try {
        const events = await prisma.crmTask.findMany({
          where: {
            ...whereClause,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { status: { contains: query, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            brandId: true
          },
          take: limit
        });
        results.events = events;
      } catch (err) {
        logError("Error searching events", err);
        results.events = [];
      }
    }

    // Search Contracts
    if (types.includes("contracts")) {
      try {
        const contracts = await prisma.contract.findMany({
          where: {
            ...whereClause,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { status: { contains: query, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            title: true,
            status: true,
            brandId: true
          },
          take: limit
        });
        results.contracts = contracts;
      } catch (err) {
        logError("Error searching contracts", err);
        results.contracts = [];
      }
    }

    // Calculate totals
    const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    return res.json({
      query,
      total,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError("Global search failed", error, { userId: req.user?.id });
    return res.status(500).json({ 
      error: "Search failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;

