import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createCheckoutSession } from '../integrations/stripe/createCheckoutSession';
import { createPortalSession } from '../integrations/stripe/createPortalSession';
import { stripe, verifyWebhook } from '../integrations/stripe/stripeClient';
import { handleSubscriptionEvent, handleCheckoutSessionCompleted } from '../integrations/stripe/webhookHandler';

// @desc    Create a Stripe checkout session
// @route   POST /api/billing/checkout
export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body;
  const userId = req.user!.id;

  if (plan !== 'premium' && plan !== 'ugc_pro') {
    res.status(400);
    throw new Error('Invalid subscription plan specified.');
  }

  const { url } = await createCheckoutSession(userId, plan);
  res.status(200).json({ url });
});

// @desc    Create a Stripe customer portal session
// @route   POST /api/billing/portal
export const createPortal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { url } = await createPortalSession(userId);
  res.status(200).json({ url });
});

// @desc    Handle incoming Stripe webhooks
// @route   POST /api/billing/webhooks
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const event = verifyWebhook(req);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionEvent(event);
      break;
  }

  res.status(200).json({ received: true });
});