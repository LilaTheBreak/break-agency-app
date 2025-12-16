import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/authMiddleware';
import {
  createCustomer,
  createSubscriptionCheckoutSession,
  createBillingPortalSession,
  verifyWebhook,
  getSubscription,
} from '../integrations/stripe/stripeClient';

const prisma = new PrismaClient();
const router = Router();

// Middleware to parse raw body for webhook verification
router.use('/webhook', (req, res, next) => {
    if (req.originalUrl === '/api/billing/webhook') {
        Router.raw({ type: 'application/json' })(req, res, next);
    } else {
        next();
    }
});

const getPriceIdForPlan = (plan: string): string => {
  switch (plan) {
    case 'brand_premium':
      if (!process.env.BRAND_PREMIUM_PRICE_ID) throw new Error('BRAND_PREMIUM_PRICE_ID not set');
      return process.env.BRAND_PREMIUM_PRICE_ID;
    case 'ugc_paid':
      if (!process.env.UGC_SUBSCRIPTION_PRICE_ID) throw new Error('UGC_SUBSCRIPTION_PRICE_ID not set');
      return process.env.UGC_SUBSCRIPTION_PRICE_ID;
    default:
      throw new Error(`Invalid plan specified: ${plan}`);
  }
};

router.post(
  '/create-checkout-session',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { plan } = req.body;
    const userId = req.user!.id;

    const priceId = getPriceIdForPlan(plan);

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripeCustomer = await createCustomer(user);
      stripeCustomerId = stripeCustomer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const session = await createSubscriptionCheckoutSession(stripeCustomerId, priceId);
    res.json({ url: session.url });
  })
);

router.get(
  '/portal',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.stripeCustomerId) {
      res.status(400);
      throw new Error('User does not have a Stripe customer ID.');
    }

    const portalSession = await createBillingPortalSession(user.stripeCustomerId);
    res.json({ url: portalSession.url });
  })
);

router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    let event;
    try {
      event = verifyWebhook(req);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object as any;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = data;
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription;
          const customerId = session.customer;

          const subscription = await getSubscription(subscriptionId);

          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: {
              stripeSubscriptionId: subscription.id,
              subscription_status: 'PREMIUM', // Or derive from plan
            },
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.created': {
        const subscription = data;
        const customerId = subscription.customer;
        const status = subscription.status; // e.g., 'active', 'canceled', 'past_due'

        let newStatus: 'FREE' | 'PREMIUM' | 'INACTIVE' = 'INACTIVE';
        if (status === 'active' || status === 'trialing') {
          newStatus = 'PREMIUM';
        } else if (subscription.cancel_at_period_end) {
          // Still active until period end, but we can note it.
          // For simplicity, we'll keep it as PREMIUM until it's truly inactive.
          newStatus = 'PREMIUM';
        } else {
          newStatus = 'FREE'; // Or INACTIVE depending on your logic
        }

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscription_status: newStatus,
          },
        });
        break;
      }
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Log the event
    await prisma.webhookLog.create({
      data: {
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: event,
      },
    });

    res.status(200).json({ received: true });
  })
);

export default router;