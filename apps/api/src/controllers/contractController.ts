import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as contractService from "../services/contractService.js";

const ContractCreateSchema = z.object({
  dealId: z.string().cuid().optional(),
  title: z.string().min(1)
});

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
  try {
    // Implement file upload logic here, potentially using multer
    // and call contractService.upload(id, file)
    res.status(501).json({ error: "Not implemented" });
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