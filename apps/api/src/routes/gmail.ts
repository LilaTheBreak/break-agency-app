import { Router } from "express";
import { ingest, getAuthUrl, handleCallback } from "../controllers/gmailController.js";

const router = Router();

router.get("/auth/url", getAuthUrl);
router.get("/auth/callback", handleCallback);
router.post("/ingest", ingest);

export default router;
