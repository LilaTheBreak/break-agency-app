import { Router } from 'express';
import { createCheckoutSession, createBillingPortalSession } from '../../services/billing/subscriptionService.js';

const router = Router();

router.post('/checkout', async (req, res, next) => {
  try {
    const { userId } = req.body; // In real app, from req.user
    const session = await createCheckoutSession(userId, process.env.STRIPE_BRAND_PREMIUM_PRICE_ID!, 'http://localhost:3000/dashboard', 'http://localhost:3000/upgrade');
    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

router.get('/portal', async (req, res, next) => {
  try {
    const { customerId } = req.query; // In real app, from req.user
    const session = await createBillingPortalSession(customerId as string, 'http://localhost:3000/billing');
    res.redirect(session.url);
  } catch (error) {
    next(error);
  }
});

export default router;