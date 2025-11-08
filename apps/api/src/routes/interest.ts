import { Router } from "express";

import { addInterest, listInterest } from "../lib/interest-store.js";
import { authenticate } from "../middlewares/auth.js";

export const interestRouter: Router = Router();

interestRouter.post("/", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim();
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const entry = await addInterest(email);
    res.status(201).json({ id: entry.id, email: entry.email, createdAt: entry.createdAt });
  } catch (error) {
    next(error);
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
