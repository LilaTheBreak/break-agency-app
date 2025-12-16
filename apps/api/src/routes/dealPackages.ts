import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const NOT_IMPLEMENTED_RESPONSE = {
  ok: false,
  error: "Not implemented — deal packages removed from schema"
};

router.post("/generate", requireAuth, (_req, res) => {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
});

router.get("/:id", requireAuth, (_req, res) => {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
});

export default router;
