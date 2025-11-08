import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { addInterest } from "../lib/interest-store.js";
import { listingsRouter } from "./listings.js";
import { contactsRouter } from "./contacts.js";
import { viewingsRouter } from "./viewings.js";

export const apiRouter: Router = Router();

/** Public: capture interest (no auth) */
apiRouter.post("/interest", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email required" });
    const entry = await addInterest(email);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

/** Everything below this line requires auth */
apiRouter.use(authenticate(true));

apiRouter.use("/listings", listingsRouter);
apiRouter.use("/contacts", contactsRouter);
apiRouter.use("/viewings", viewingsRouter);
