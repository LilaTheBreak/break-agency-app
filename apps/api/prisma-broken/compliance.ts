import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { brandComplianceQueue } from '../worker/queues/brandComplianceQueue.js';
import { getPolicyForBrand, updatePolicyFromSource } from '../services/brand/policyManager.js';

const router = Router();

/**
 * GET /api/brand-policy/:brandId
 * Fetches the latest policy for a brand.
 */
router.get('/brand-policy/:brandId', async (req, res, next) => {
  try {
    const policy = await getPolicyForBrand(req.params.brandId);
    res.json(policy);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/check
 * Manually triggers a compliance check for a deliverable.
 */
router.post('/compliance/check', async (req, res) => {
  const { deliverableId } = req.body;
  await brandComplianceQueue.add('run-check', { deliverableId });
  res.status(202).json({ message: 'Compliance check has been queued.' });
});

/**
 * GET /api/compliance/:deliverableId/history
 * Fetches the history of compliance checks for a deliverable.
 */
router.get('/compliance/:deliverableId/history', async (req, res, next) => {
  const { deliverableId } = req.params;
  const history = await prisma.complianceCheck.findMany({ where: { deliverableId }, orderBy: { createdAt: 'desc' } });
  res.json(history);
});

export default router;