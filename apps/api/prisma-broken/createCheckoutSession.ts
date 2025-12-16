import { PrismaClient } from '@prisma/client';
import { stripe } from './stripeClient';

const prisma = new PrismaClient();

const getPriceIdForPlan = (plan: 'premium' | 'ugc_pro'): string => {
  const priceId = {
    premium: process.env.BRAND_PREMIUM_PRICE_ID,
    ugc_pro: process.env.UGC_SUBSCRIPTION_PRICE_ID,
  }[plan];

  if (!priceId) {
    throw new Error(`Price ID for plan "${plan}" is not configured.`);
  }
  return priceId;
};

export const createCheckoutSession = async (userId: string, plan: 'premium' | 'ugc_pro') => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');

  let stripeCustomerId = (await prisma.subscription.findFirst({ where: { userId } }))?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
  }

  const priceId = getPriceIdForPlan(plan);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.WEB_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.WEB_APP_URL}/subscribe/cancel`,
    metadata: {
      userId,
    },
  });

  return { url: session.url };
};