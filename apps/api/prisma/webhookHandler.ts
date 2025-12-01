import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handleSubscriptionEvent = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { subscriptions: { some: { stripeCustomerId: customerId } } },
  });

  if (!user) {
    console.error(`Webhook Error: No user found for Stripe customer ID ${customerId}`);
    return;
  }

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
  };

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      stripeCustomerId: customerId,
      ...subscriptionData,
    },
    update: subscriptionData,
  });

  // Update the denormalized status on the User model for quick access
  await updateUserSubscriptionStatus(user.id);
};

export const handleCheckoutSessionCompleted = async (event: Stripe.Event) => {
  const session = event.data.object as Stripe.Checkout.Session;
  const stripeSubscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;

  if (!stripeSubscriptionId || !userId) {
    console.error('Webhook Error: Missing subscription ID or user ID in checkout session.');
    return;
  }

  // The `customer.subscription.created` event will handle the creation,
  // but we can pre-emptively update the user status here.
  await updateUserSubscriptionStatus(userId);
};

const updateUserSubscriptionStatus = async (userId: string) => {
  const activeSub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
  });

  const newStatus = activeSub ? 'premium' : 'free'; // Add logic for 'ugc_pro' based on priceId

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: newStatus },
  });
};