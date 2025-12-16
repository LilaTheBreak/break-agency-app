import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Outreach Templates API placeholder active" });
});

export default router;
