export async function generateAgentPlan({ email, user, llm, policy, context }: any) {
  const prompt = `
You are The Break Autonomous Talent Agent.

Policy:
${JSON.stringify(policy, null, 2)}

Email:
${email?.snippet || ""}

Generate a JSON plan with:
{
  "steps": [
    {"action": "extractDeal"},
    {"action": "negotiateDeal"},
    {"action": "updateCRM"}
  ]
}
Return ONLY JSON.
`;

  if (llm?.promptJSON) {
    return llm.promptJSON(prompt);
  }

  return {
    steps: [
      ...(context?.threadState?.lastOffer ? [{ action: "evaluateOfferAgainstHistory" }] : []),
      { action: "extractDeal" },
      { action: "evaluateOffer" },
      { action: "generateCounterOffer" },
      { action: "validateCounterOffer" },
      { action: "sendCounterOffer" },
      { action: "logNegotiation" },
      ...(context?.threadState?.messages?.length > 1 ? [{ action: "checkIfReadyToClose" }] : []),
      { action: "generateContractTerms" },
      { action: "generateClosingEmail" },
      { action: "updateCRM" }
    ]
  };
}
