import { Router } from "express";

const router = Router();

/**
 * Placeholder router for Outreach Leads
 * Prevents server crashes until the real service is implemented.
 */
router.get("/", async (_req, res) => {
  res.json({
    ok: true,
    message: "Outreach Leads route is not implemented yet",
    data: [],
  });
});

export default router;
