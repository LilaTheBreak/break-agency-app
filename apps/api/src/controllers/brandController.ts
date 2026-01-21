/**
 * Brand Controller
 * 
 * Handles brand creation, onboarding, and management endpoints
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as brandUserService from '../services/brandUserService.js';
import * as auditSourceService from '../services/auditSourceService.js';
import {
  validateBrandOnboarding,
  normalizeUrl,
  extractDomain,
} from '../utils/domainValidator.js';

// Validation schemas
const brandOnboardingSchema = z.object({
  websiteUrl: z.string().min(1, "Website URL is required"),
  email: z.string().email(),
  role: z.enum([
    "Founder",
    "Marketing",
    "Brand Partnerships",
    "Community",
    "Product",
    "Other",
  ]),
  brandName: z.string().optional(),
});

const createBrandSchema = z.object({
  name: z.string().min(1),
  websiteUrl: z.string().url(),
  industry: z.string().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
});

/**
 * Brand onboarding endpoint
 * Step 1-4: URL, Email, Role, Create Brand
 */
export async function onboardBrandHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const validation = brandOnboardingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { websiteUrl, email, role, brandName } = validation.data;

    // Validate onboarding inputs
    const onboardingValidation = validateBrandOnboarding({
      websiteUrl,
      email,
      role,
    });

    if (!onboardingValidation.valid) {
      res.status(400).json({ errors: onboardingValidation.errors });
      return;
    }

    // Extract domain from URL
    const domain = extractDomain(websiteUrl);
    if (!domain) {
      res.status(400).json({ error: "Could not extract domain from URL" });
      return;
    }

    const normalizedUrl = normalizeUrl(websiteUrl);

    // Check if brand already exists with this domain
    const existingBrand = await brandUserService.getBrandByDomain(domain);
    if (existingBrand) {
      res.status(400).json({ error: "Brand with this domain already exists" });
      return;
    }

    try {
      // Create brand
      const brand = await brandUserService.createBrand({
        name: brandName || domain,
        websiteUrl: normalizedUrl,
        domain,
      });

      // Create first admin user
      await brandUserService.createBrandAdminUser(brand.id, user.id, "ADMIN");

      // Initialize audit sources
      await auditSourceService.initializeBrandAuditSources(
        brand.id,
        normalizedUrl
      );

      res.status(201).json({
        message: "Brand created successfully",
        brand: {
          id: brand.id,
          name: brand.name,
          // @ts-ignore - Properties exist on brand but TypeScript cache is stale
          domain: brand.domain,
          // @ts-ignore - Properties exist on brand but TypeScript cache is stale
          websiteUrl: brand.websiteUrl,
        },
      });
    } catch (createError: any) {
      // Handle unique constraint violation (P2002) - race condition where another request created the brand
      if (createError.code === 'P2002' && createError.meta?.target?.includes('domain')) {
        res.status(409).json({ error: "Brand with this domain already exists" });
        return;
      }
      throw createError;
    }
  } catch (error) {
    console.error("[Brand Onboarding]", error);
    res.status(500).json({ error: "Failed to onboard brand" });
  }
}

/**
 * Get brand by ID
 */
export async function getBrandHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is member of brand
    const isMember = await brandUserService.isBrandMember(brandId, user.id);
    if (!isMember) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const brand = await brandUserService.getBrand(brandId);
    if (!brand) {
      res.status(404).json({ error: "Brand not found" });
      return;
    }

    res.json(brand);
  } catch (error) {
    console.error("[Get Brand]", error);
    res.status(500).json({ error: "Failed to get brand" });
  }
}

/**
 * Get user's brands
 */
export async function getUserBrandsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const brands = await brandUserService.getUserBrands(user.id);

    res.json({
      brands: brands.map((bu) => ({
        ...bu.brand,
        role: bu.role,
      })),
    });
  } catch (error) {
    console.error("[Get User Brands]", error);
    res.status(500).json({ error: "Failed to get brands" });
  }
}

/**
 * Update brand info
 */
export async function updateBrandHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res.status(403).json({ error: "Only brand admins can update brand info" });
      return;
    }

    const validation = createBrandSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { name, websiteUrl, industry } = validation.data;
    const normalizedUrl = normalizeUrl(websiteUrl);

    const brand = await require("../lib/prisma.js").default.brand.update({
      where: { id: brandId },
      data: {
        name,
        websiteUrl: normalizedUrl,
        industry,
      },
    });

    res.json({
      message: "Brand updated successfully",
      brand,
    });
  } catch (error) {
    console.error("[Update Brand]", error);
    res.status(500).json({ error: "Failed to update brand" });
  }
}

/**
 * List all brands (for admin)
 */
export async function listBrandsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`[List Brands] Fetching all brands for user ${user.id}`);
    
    // Return all brands in the CRM (for dropdowns in modals)
    // SINGLE SOURCE OF TRUTH: Returns ALL brands from database, no filtering
    const prisma = (await import("../lib/prisma.js")).default;
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        industry: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },  // Sort by name for consistency
    });
    
    console.log(`[List Brands] Successfully fetched ${brands?.length || 0} brands from CRM`);

    res.json({
      brands: brands,
      total: brands.length,
    });
  } catch (error) {
    console.error("[List Brands] Error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: "Failed to list brands" });
  }
}

/**
 * Create brand quickly (inline for deals/contacts)
 * 
 * Used when user types a new brand name in deal/contact form
 * Returns the created brand immediately
 * Prevents duplicate brands (case-insensitive)
 */
export async function createQuickBrandHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate request
    const { name } = req.body;
    
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Brand name is required" });
      return;
    }

    const brandName = name.trim();
    
    if (brandName.length === 0) {
      res.status(400).json({ error: "Brand name cannot be empty" });
      return;
    }

    if (brandName.length > 255) {
      res.status(400).json({ error: "Brand name too long (max 255 characters)" });
      return;
    }

    // Check if brand already exists (case-insensitive)
    const existingBrands = await brandUserService.listBrands(1000, 0);
    
    // Ensure brands is an array
    const brandsList = Array.isArray(existingBrands?.brands) ? existingBrands.brands : [];
    const duplicate = brandsList.find(
      b => b?.name?.toLowerCase() === brandName.toLowerCase()
    );

    if (duplicate) {
      // Brand already exists, return it
      res.status(200).json({
        id: duplicate.id,
        name: duplicate.name,
        message: "Brand already exists"
      });
      return;
    }

    // Create new brand
    try {
      const domainName = brandName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const newBrand = await brandUserService.createBrand({
        name: brandName,
        domain: domainName,
        websiteUrl: `https://${domainName}.example.com`,
      });

      res.status(201).json({
        id: newBrand.id,
        name: newBrand.name,
        message: "Brand created successfully"
      });
    } catch (createError: any) {
      // Handle race condition where another request created same brand
      if (createError.code === 'P2002' && createError.meta?.target?.includes('name')) {
        // Retry lookup
        const retryBrands = await brandUserService.listBrands(1000, 0);
        const retryList = Array.isArray(retryBrands?.brands) ? retryBrands.brands : [];
        const newlyCreated = retryList.find(
          b => b?.name?.toLowerCase() === brandName.toLowerCase()
        );
        if (newlyCreated) {
          res.status(200).json({
            id: newlyCreated.id,
            name: newlyCreated.name,
            message: "Brand already exists (created by another request)"
          });
          return;
        }
      }
      // Log the error and throw to outer handler
      console.error("[Create Quick Brand - Inner Catch]", createError);
      throw createError;
    }
  } catch (error) {
    console.error("[Create Quick Brand - Outer Catch]", error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : "Failed to create brand";
    res.status(500).json({ error: errorMessage });
  }
}
