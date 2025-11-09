import { Router } from "express";

import { addInterest, listInterest } from "../lib/interest-store.js";
import { authenticate } from "../middlewares/auth.js";

export const interestRouter: Router = Router();

interestRouter.post("/", async (req, res) => {
  try {
    const { email, name } = req.body ?? {};
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "email required" });
    }
    const entry = await addInterest(normalizedEmail);
    res
      .status(201)
      .json({ id: entry.id, email: entry.email, name: name ?? null, createdAt: entry.createdAt });
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
