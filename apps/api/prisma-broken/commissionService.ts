interface CommissionInput {
  totalAmount: number;
  // In a real app, talent and agentPolicy would have defined types
  talent: any;
  agentPolicy: any;
}

/**
 * Calculates the commission splits for a given deal amount.
 * Percentages could be dynamic based on talent or policy in a real app.
 */
export function calculateCommissions({ totalAmount }: CommissionInput) {
  const creatorRate = 0.8; // 80%
  const agencyRate = 0.15; // 15%
  const managerRate = 0.05; // 5%

  const creatorPortion = Math.floor(totalAmount * creatorRate);
  const agencyPortion = Math.floor(totalAmount * agencyRate);
  const managerPortion = totalAmount - creatorPortion - agencyPortion; // Remainder to manager

  return {
    creatorPortion,
    agencyPortion,
    managerPortion,
  };
}