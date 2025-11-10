import { ContactType } from "@prisma/client";
import { Router } from "express";

import { addInterest, listInterest } from "../lib/interest-store.js";
import { authenticate } from "../middlewares/auth.js";
import { prisma } from "../db/client.js";

export const interestRouter: Router = Router();

async function ensureContactRecord(email: string, name?: string) {
  try {
    const existing = await prisma.contact.findFirst({
      where: { emails: { has: email } },
      select: { id: true, tags: true }
    });
    if (existing) {
      const tags = existing.tags ?? [];
      if (!tags.includes("interest")) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: { tags: [...tags, "interest"] }
        });
      }
      return existing.id;
    }

    const fallbackName = name?.trim() || email.split("@")[0];
    const created = await prisma.contact.create({
      data: {
        type: ContactType.BUYER,
        name: fallbackName,
        emails: [email],
        phones: [],
        tags: ["interest"],
        source: "Website Interest Form"
      },
      select: { id: true }
    });
    return created.id;
  } catch (error) {
    console.error("[interest] failed to ensure contact:", error);
    return null;
  }
}

interestRouter.post("/", async (req, res) => {
  try {
    const { email, name } = req.body ?? {};
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "email required" });
    }
    const entry = await addInterest(normalizedEmail, typeof name === "string" ? name : null);
    const contactId = await ensureContactRecord(normalizedEmail, name);
    res
      .status(201)
      .json({
        id: entry.id,
        email: entry.email,
        name: name ?? null,
        createdAt: entry.createdAt,
        contactId
      });
  } catch (error) {
    console.error("[interest] failed:", error);
    res.status(500).json({ error: "internal_error" });
  }
});

interestRouter.get("/", authenticate(true), async (_req, res, next) => {
  try {
    const entries = await listInterest();
    res.json(entries);
  } catch (error) {
    next(error);
  }
});
