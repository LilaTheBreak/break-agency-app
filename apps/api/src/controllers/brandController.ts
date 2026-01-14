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
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const { brands, total } = await brandUserService.listBrands(limit, offset);

    res.json({
      brands,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[List Brands]", error);
    res.status(500).json({ error: "Failed to list brands" });
  }
}
