import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/requireRole';
import {
  runContentAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from '../../controllers/creator/contentAnalysisController';

const router = Router();

// Protect all routes, accessible by creators
router.use(protect, requireRole(['EXCLUSIVE_TALENT', 'TALENT', 'UGC_CREATOR', 'FOUNDER']));

router.post('/analyze', runContentAnalysis);
router.get('/history', getAnalysisHistory);
router.route('/:id').get(getAnalysisById).delete(deleteAnalysis);

export default router;