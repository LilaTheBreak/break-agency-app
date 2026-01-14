import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import {
  createSignatureRequest,
  getSignatureRequest,
  submitSignature,
  downloadSignedDocument,
} from '../../controllers/contracts/signatureController';

const router = Router();

// Route for creating a request is protected
router.post('/contracts/:id/signature/create', protect, createSignatureRequest);

// Publicly accessible routes for the person signing
router.get('/signature/:id', getSignatureRequest);
router.post('/signature/:id/sign', submitSignature);

// Protected route to download the final document
router.get('/signature/:id/download', protect, downloadSignedDocument);

export default router;