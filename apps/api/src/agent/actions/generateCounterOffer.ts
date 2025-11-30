export default {
  name: "generateCounterOffer",
  async run({ strategy }) {
    if (!strategy?.shouldNegotiate) return { counter: null };
    return { counter: strategy.recommendedCounter };
  }
};
