import { Router } from 'express';
import { stripe } from '../../services/billing/stripeClient.js';
import { handleWebhookEvent } from '../../services/billing/subscriptionService.js';

const router = Router();

// Use express.raw for this specific route to get the raw body for signature verification
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await handleWebhookEvent(event);
  res.json({ received: true });
});

export default router;