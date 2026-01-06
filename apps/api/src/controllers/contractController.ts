import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as contractService from "../services/contractService.js";
import prisma from "../lib/prisma.js";

const ContractCreateSchema = z.object({
  dealId: z.string().cuid().optional(),
  title: z.string().min(1)
});

export async function listContracts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const where: any = {};
    
    // Map common status values
    if (status === "pending") {
      where.signedAt = null;
    } else if (status === "signed") {
      where.signedAt = { not: null };
    }
    
    const contracts = await prisma.contract.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        Deal: {
          select: {
            brandName: true,
            value: true,
            currency: true
          }
        }
      }
    });
    
    res.json(contracts || []);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.json([]); // Graceful fallback
  }
}

export async function createContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ContractCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const contract = await contractService.create(parsed.data);
    res.status(201).json(contract);
  } catch (error) {
    next(error);
  }
}

export async function getContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const contract = await contractService.get(id);
    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
}

const ContractUpdateSchema = z.object({
  title: z.string().min(1).optional()
});

export async function updateContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = ContractUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const contract = await contractService.update(id, parsed.data);
    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
}

export async function deleteContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await contractService.remove(id);
    // Always return 200 with JSON - never 204 No Content
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function uploadContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const enabled = process.env.CONTRACT_UPLOAD_ENABLED === "true";
    if (!enabled) {
      return res.status(503).json({
        error: "Contract upload feature is disabled",
        message: "This feature is currently disabled. Contact an administrator to enable it.",
        code: "FEATURE_DISABLED"
      });
    }

    const { id } = req.params;
    const { fileUrl, fileKey } = req.body;

    if (!fileUrl && !fileKey) {
      return res.status(400).json({ 
        error: "fileUrl or fileKey is required" 
      });
    }

    // Verify contract exists
    const contract = await prisma.contract.findUnique({
      where: { id }
    });

    if (!contract) {
      return res.status(404).json({ 
        error: "Contract not found" 
      });
    }

    // If fileKey provided, construct URL from S3/R2
    let finalFileUrl = fileUrl;
    if (fileKey && !fileUrl) {
      // Use fileService to build URL
      const fileService = await import("../services/fileService.js");
      // Note: buildFileUrl is not exported, use getDownloadUrl or construct manually
      const endpoint = process.env.S3_ENDPOINT;
      const bucket = process.env.S3_BUCKET;
      const region = process.env.S3_REGION || "us-east-1";
      const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
      
      if (endpoint && forcePathStyle) {
        finalFileUrl = `${endpoint}/${bucket}/${fileKey}`;
      } else if (endpoint) {
        finalFileUrl = `${endpoint}/${fileKey}`;
      } else {
        finalFileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
      }
    }

    // Update contract with file URL
    const updated = await contractService.upload(id, finalFileUrl);

    res.json({ contract: updated });
  } catch (error) {
    next(error);
  }
}

export async function sendContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await contractService.send(id);
    res.json({ message: "Contract sent" });
  } catch (error) {
    next(error);
  }
}

export async function signContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { signer } = req.params; // "talent" or "brand"
    await contractService.sign(id, signer);
    res.json({ message: `${signer} signed contract` });
  } catch (error) {
    next(error);
  }
}

export async function finaliseContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await contractService.finalise(id);
    res.json({ message: "Contract finalized" });
  } catch (error) {
    next(error);
  }
}

export async function analyseContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || "system";
    const analysis = await contractService.analyse(id, userId);
    res.json({ 
      ok: true,
      message: "Contract analysis complete",
      data: analysis
    });
  } catch (error) {
    next(error);
  }
}

export async function listByDeal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dealId } = req.params;
    const contracts = await contractService.listForDeal(dealId);
    res.json(contracts);
  } catch (error) {
    next(error);
  }
}

export async function createFromDeal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dealId } = req.params;
    const contract = await contractService.createFromDeal(dealId);
    res.status(201).json(contract);
  } catch (error) {
    next(error);
  }
}

export async function generatePDF(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const contract = await contractService.generatePDF(id);
    res.json(contract);
  } catch (error) {
    next(error);
  }
}
