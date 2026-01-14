import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  connect,
  disconnect,
  getAccounts,
  metrics,
  refresh
} from '../controllers/socialController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const limiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

router.use(limiter);

router.get("/", requireAuth, getAccounts);
router.post("/connect", requireAuth, connect);
router.post("/disconnect", requireAuth, disconnect);
router.post("/refresh", requireAuth, refresh);
router.get("/metrics/:platform", requireAuth, metrics);

export default router;
