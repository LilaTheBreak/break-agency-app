import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as bundleGenerator from "../services/bundleGeneratorService.js";
import * as bundleService from "../services/bundleService.js"; // For basic CRUD

export async function listBundles(req: Request, res: Response, next: NextFunction) {
  try {
    const bundles = await bundleService.listAll();
    return res.json({ ok: true, bundles });
  } catch (error) {
    next(error);
  }
}

export async function getBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const bundle = await bundleService.getById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ ok: false, error: "Bundle not found" });
    }
    return res.json({ ok: true, bundle });
  } catch (error) {
    next(error);
  }
}

const BundleCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  deliverables: z.unknown().optional(),
});

export async function createBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = BundleCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }
    const bundle = await bundleService.create({
      ...parsed.data,
      createdBy: req.user?.id || "unknown"
    });
    res.status(201).json({ ok: true, bundle });
  } catch (error) {
    next(error);
  }
}

export async function updateBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const enabled = process.env.BUNDLES_ENABLED === "true";
    if (!enabled) {
      return res.status(503).json({
        ok: false,
        error: "Bundles feature is disabled",
        message: "This feature is currently disabled. Contact an administrator to enable it.",
        code: "FEATURE_DISABLED"
      });
    }

    const { id } = req.params;
    const BundleUpdateSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      deliverables: z.unknown().optional(),
      status: z.string().optional()
    });

    const parsed = BundleUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    const bundle = await bundleService.update(id, parsed.data);
    if (!bundle) {
      return res.status(404).json({ ok: false, error: "Bundle not found" });
    }

    return res.json({ ok: true, bundle });
  } catch (error) {
    next(error);
  }
}

export async function deleteBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const enabled = process.env.BUNDLES_ENABLED === "true";
    if (!enabled) {
      return res.status(503).json({
        ok: false,
        error: "Bundles feature is disabled",
        message: "This feature is currently disabled. Contact an administrator to enable it.",
        code: "FEATURE_DISABLED"
      });
    }

    const { id } = req.params;
    const deleted = await bundleService.deleteBundle(id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Bundle not found" });
    }

    return res.json({ ok: true, message: "Bundle deleted" });
  } catch (error) {
    next(error);
  }
}

const GenerateAIBundleSchema = z.object({
  briefId: z.string().cuid(),
  talentId: z.string().cuid(),
});

export async function generateAIBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = GenerateAIBundleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }
    const result = await bundleGenerator.generateTieredBundles(parsed.data);
    return res.json({ ok: true, recommendations: result });
  } catch (error) {
    next(error);
  }
}

// Other controller methods (recommend, estimate price) would go here