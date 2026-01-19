import { Router } from 'express';
import campaignsRouter from './campaigns.js';
import shortlistRouter from './shortlist.js';

const router = Router();

// Mount campaign routes
router.use('/campaigns', campaignsRouter);

// Mount shortlist routes
router.use('/shortlist', shortlistRouter);

export default router;
