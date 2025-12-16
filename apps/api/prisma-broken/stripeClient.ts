import Stripe from 'stripe';
import { Request } from 'express';
import { User } from '@prisma/client';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

/**
 * Creates a new Stripe Customer object for a user.
 * @param user The user object from the database.
 * @returns The created Stripe Customer object.
 */
export const createCustomer = async (user: Pick<User, 'id' | 'email' | 'name'>): Promise<Stripe.Customer> => {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
    },
  });
  return customer;
};

/**
 * Creates a Stripe Checkout Session for a subscription.
 * @param customerId The Stripe Customer ID.
 * @param priceId The Stripe Price ID for the subscription plan.
 * @returns The created Stripe Checkout Session object.
 */
export const createSubscriptionCheckoutSession = async (customerId: string, priceId: string) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.WEB_APP_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.WEB_APP_URL}/settings/billing`,
  });
  return session;
};

/**
 * Creates a Stripe Billing Portal session for a customer to manage their subscription.
 * @param customerId The Stripe Customer ID.
 * @returns The created Stripe Billing Portal Session object.
 */
export const createBillingPortalSession = async (customerId: string) => {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.WEB_APP_URL}/settings/billing`,
  });
  return portalSession;
};

/**
 * Cancels a subscription at the end of the current billing period.
 * @param subscriptionId The Stripe Subscription ID.
 * @returns The updated Stripe Subscription object.
 */
export const cancelSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
};

/**
 * Verifies the signature of an incoming Stripe webhook request.
 * @param req The Express request object.
 * @returns The verified Stripe Event object.
 * @throws An error if the signature is invalid or the webhook secret is not set.
 */
export const verifyWebhook = (req: Request): Stripe.Event => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    throw new Error('Webhook Error: No stripe-signature header found.');
  }

  if (!webhookSecret) {
    throw new Error('Webhook Error: STRIPE_WEBHOOK_SECRET is not set.');
  }

  return stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
};

/**
 * Retrieves a Stripe subscription by its ID.
 * @param subscriptionId The ID of the subscription to retrieve.
 * @returns The Stripe Subscription object.
 */
export const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

/**
 * Retrieves a Stripe customer by their ID.
 * @param customerId The ID of the customer to retrieve.
 * @returns The Stripe Customer object.
 */
export const getCustomer = async (customerId: string) => {
  return await stripe.customers.retrieve(customerId);
};