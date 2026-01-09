import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({ message: "Outreach Templates API placeholder active" });
});

export default router;
