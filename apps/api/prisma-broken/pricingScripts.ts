/**
 * Generates negotiation scripts related to pricing.
 * @param context - Information about the price difference and justification.
 * @returns An object containing different script variants.
 */
export function generatePricingScripts(context: { ourPrice: number; theirOffer: number; justification: string }) {
  const { ourPrice, theirOffer, justification } = context;
  const difference = ourPrice - theirOffer;

  return {
    anchor: `Thanks for the offer! Our rate for this package is typically £${ourPrice}, based on ${justification}. Happy to discuss how we can get closer to that.`,
    counter: `We appreciate the offer of £${theirOffer}. To make this work, we would need to meet in the middle at £${theirOffer + difference / 2}.`,
    premium: `For the value and engagement we bring, our premium rate for this scope is £${ourPrice}. This reflects the high-quality production and audience trust we've built.`,
  };
}