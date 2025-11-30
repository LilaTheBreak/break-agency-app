import prisma from '../../lib/prisma.js';
import { stripe } from './stripeClient.js';

/**
 * Creates a Stripe Checkout session for a user to subscribe.
 */
export async function createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');

  let customerId = user.subscription_customerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { subscription_customerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });

  return session;
}

/**
 * Creates a Stripe Billing Portal session for a user to manage their subscription.
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Handles incoming Stripe webhook events to keep subscription data in sync.
 */
export async function handleWebhookEvent(payload: any) {
  const { type, data } = payload;
  const object = data.object as any;

  switch (type) {
    case 'checkout.session.completed': {
      const userId = object.metadata.userId;
      const customerId = object.customer;
      const subscriptionId = object.subscription;

      await prisma.user.update({
        where: { id: userId },
        data: { subscription_customerId: customerId, subscription_id: subscriptionId },
      });
      break;
    }
    case 'invoice.payment_succeeded': {
      const subscriptionId = object.subscription;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata.userId;
      const priceId = subscription.items.data[0].price.id;

      const planMap: Record<string, string> = {
        [process.env.STRIPE_BRAND_PREMIUM_PRICE_ID!]: 'premium',
        [process.env.STRIPE_UGC_PRICE_ID!]: 'ugc_paid',
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscription_status: planMap[priceId] || 'inactive',
          subscription_plan: priceId,
          subscription_renewal: new Date(subscription.current_period_end * 1000),
        },
      });

      await prisma.stripeSubscription.upsert({
        where: { stripeSubscriptionId: subscriptionId },
        create: {
          userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: subscription.customer as string,
          priceId,
          status: subscription.status,
          renewalDate: new Date(subscription.current_period_end * 1000),
        },
        update: {
          status: subscription.status,
          renewalDate: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const subscriptionId = object.id || object.subscription;
      const subscription = await prisma.stripeSubscription.findUnique({ where: { stripeSubscriptionId: subscriptionId } });
      if (subscription) {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { subscription_status: 'inactive' },
        });
        await prisma.stripeSubscription.update({
          where: { id: subscription.id },
          data: { status: 'canceled', canceledAt: new Date() },
        });
      }
      break;
    }
    default:
      console.log(`[STRIPE WEBHOOK] Unhandled event type: ${type}`);
  }
}