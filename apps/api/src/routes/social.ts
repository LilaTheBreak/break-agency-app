import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  connect,
  disconnect,
  getAccounts,
  metrics,
  refresh
} from "../controllers/socialController.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

router.use(limiter);

router.get("/", getAccounts);
router.post("/connect", connect);
router.post("/disconnect", disconnect);
router.post("/refresh", refresh);
router.get("/metrics/:platform", metrics);

export default router;
