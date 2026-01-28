import { Router } from 'express';
import multer from 'multer';
// @ts-ignore
import { protect } from '../middleware/authMiddleware.js';
// @ts-ignore
import { requireRole } from '../middleware/requireRole.js';
// @ts-ignore
import { submitAgentApplication, getMyApplication } from '../controllers/agentTalent/applicationController.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Agent application routes
router.post('/application', protect, requireRole(['AGENT']), upload.single('cv'), submitAgentApplication);
router.get('/application/my', protect, requireRole(['AGENT']), getMyApplication);

export default router;
