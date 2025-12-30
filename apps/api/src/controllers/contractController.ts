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
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function uploadContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // REMOVED: Contract upload endpoint not implemented
  res.status(410).json({ 
    error: "Contract upload endpoint removed",
    message: "This endpoint is not yet implemented and has been removed.",
    alternative: "Use /api/files/upload for file uploads, then link to contracts manually"
  });
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
    await contractService.analyse(id);
    res.json({ message: "Contract analysis initiated" });
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
