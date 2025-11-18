import { Prisma } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { requireRole } from "../middleware/requireRole.js";
import { createContract, sendForSignature, getSignatureStatus } from "../services/contracts/contractService.js";

const router = Router();

router.get("/contracts", ensureUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
  const isPrivileged = hasRole(user, ["admin", "agent"]);
  const filtered = isPrivileged ? contracts : contracts.filter((contract) => isParty(contract.parties, user.id));
  res.json({ contracts: filtered });
});

router.post("/contracts/create", requireRole(["admin", "agent"]), async (req: Request, res: Response) => {
  const { title, parties, variables, templateId } = req.body ?? {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!Array.isArray(parties) || !parties.length) {
    return res.status(400).json({ error: "At least one party is required" });
  }
  const normalizedParties = parties.map((party) => ({
    email: String(party.email || "").toLowerCase(),
    name: party.name || party.email,
    role: party.role || "signer"
  }));
  try {
    const external = await createContract({
      title,
      parties: normalizedParties,
      variables: variables || {},
      templateId
    });
    const contract = await prisma.contract.create({
      data: {
        title,
        parties: normalizedParties as Prisma.JsonValue,
        status: external.status || "draft",
        fileUrl: external.fileUrl || "",
        externalId: external.externalId || null
      }
    });
    res.status(201).json({ contract });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create contract" });
  }
});

router.post("/contracts/send", requireRole(["admin", "agent"]), async (req: Request, res: Response) => {
  const { contractId, recipients } = req.body ?? {};
  if (!contractId) {
    return res.status(400).json({ error: "contractId is required" });
  }
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }
  if (!contract.externalId) {
    return res.status(400).json({ error: "Contract missing external reference" });
  }
  const normalizedParties = Array.isArray(recipients) && recipients.length ? recipients : contract.parties;
  try {
    await sendForSignature(contract.externalId, normalizedParties);
    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: { status: "sent" }
    });
    res.json({ contract: updated });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send contract" });
  }
});

router.get("/contracts/:id/status", ensureUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }
  const isPrivileged = hasRole(user, ["admin", "agent"]);
  if (!isPrivileged && !isParty(contract.parties, user.id)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  if (!contract.externalId) {
    return res.json({ contract });
  }
  try {
    const status = await getSignatureStatus(contract.externalId);
    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: status.status || contract.status,
        fileUrl: status.fileUrl || contract.fileUrl
      }
    });
    res.json({ contract: updated });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch status" });
  }
});

function ensureUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function hasRole(user: { roles?: string[] }, allowed: string[]) {
  return Boolean(user.roles?.some((role) => allowed.includes(role)));
}

function isParty(parties: any, email: string | undefined) {
  if (!email) return false;
  if (!Array.isArray(parties)) return false;
  return parties.some((party) => {
    if (!party) return false;
    const candidate = typeof party === "string" ? party : party.email;
    return typeof candidate === "string" && candidate.toLowerCase() === email.toLowerCase();
  });
}

export default router;
