import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as bundleGenerator from "../services/bundleGeneratorService.js";
import * as bundleService from "../services/bundleService.js"; // For basic CRUD

export async function listBundles(req: Request, res: Response, next: NextFunction) {
  try {
    const bundles = await bundleService.listAll();
    res.json({ ok: true, bundles });
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
    res.json({ ok: true, bundle });
  } catch (error) {
    next(error);
  }
}

const BundleCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  deliverables: z.any().optional(),
});

export async function createBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = BundleCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }
    const bundle = await bundleService.create(parsed.data);
    res.status(201).json({ ok: true, bundle });
  } catch (error) {
    next(error);
  }
}

export async function updateBundle(req: Request, res: Response, next: NextFunction) {
  // Implementation for updating a bundle
  res.status(501).json({ ok: false, error: "Not implemented" });
}

export async function deleteBundle(req: Request, res: Response, next: NextFunction) {
  // Implementation for deleting a bundle
  res.status(501).json({ ok: false, error: "Not implemented" });
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
    res.json({ ok: true, recommendations: result });
  } catch (error) {
    next(error);
  }
}

// Other controller methods (recommend, estimate price) would go here