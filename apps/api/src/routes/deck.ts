import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import * as deckController from '../controllers/deckController';

const router = Router();

// All deck routes require authentication
router.use(requireAuth);

// POST /api/deck/generate - Generate branded PDF deck
router.post("/generate", deckController.generateDeck);

// POST /api/deck/summarize - AI summarization for deck text fields
router.post("/summarize", deckController.summarizeWithAI);

export default router;
