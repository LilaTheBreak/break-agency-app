import { generateNegotiationStrategy } from '../engines/negotiationStrategyEngine';

export default {
  name: "evaluateOffer",
  async run({ deal, llm, policy }) {
    const strategy = await generateNegotiationStrategy({ deal, llm, policy });
    return { strategy };
  }
};
