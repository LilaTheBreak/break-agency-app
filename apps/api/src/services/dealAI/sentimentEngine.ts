// Placeholder sentiment engine so backend starts without errors.

export async function analyzeSentiment(text: string) {
  return {
    sentiment: "neutral",
    score: 0,
    explanation: "Placeholder sentiment engine. Real AI model not yet implemented.",
    input: text
  };
}
