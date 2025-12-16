import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  createAiBrief,
  createBriefFromTemplate,
  getBriefById,
  updateBrief,
} from '../controllers/briefs/briefsController';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
} from '../controllers/briefs/templatesController';

const router = Router();

// Brief generation and management routes for brands
router.use(protect, requireRole(['BRAND_FREE', 'BRAND_PREMIUM']));

router.post('/ai-generate', createAiBrief);
router.post('/template-generate', createBriefFromTemplate);
router.get('/templates', getTemplates);
router.route('/:id').get(getBriefById).put(updateBrief);

// PDF and Send routes would be here
// router.post('/:id/export-pdf', exportBriefToPdf);
// router.post('/:id/send-to-creators', sendBriefToCreators);

// --- Admin-only routes for template management ---
const adminRouter = Router();
adminRouter.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

adminRouter.route('/templates').post(createTemplate);
adminRouter.route('/templates/:id').put(updateTemplate);

router.use('/admin', adminRouter);

export default router;