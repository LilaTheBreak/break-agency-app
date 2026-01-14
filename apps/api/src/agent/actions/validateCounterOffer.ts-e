export default {
  name: "validateCounterOffer",
  async run({ counter, deal, policy }) {
    if (!counter) return { approved: false };

    const dealAmount = deal?.amount ?? deal?.price ?? 0;
    const increasePct =
      dealAmount > 0 ? ((counter.amount - dealAmount) / dealAmount) * 100 : 0;

    const approved = increasePct <= (policy?.negotiationCeilingPct ?? 25);

    return {
      approved,
      increasePct,
      counter
    };
  }
};
