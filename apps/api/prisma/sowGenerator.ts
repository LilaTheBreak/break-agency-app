/**
 * Generates a structured Statement of Work (SOW) from final deal terms.
 * This is a formatting service, not an AI service.
 * @param finalTerms - The structured final terms from the extractor.
 * @returns A JSON object representing the SOW.
 */
export function generateSOW(finalTerms: any) {
  console.log('[SOW GENERATOR] Creating SOW from final terms...');
  return {
    title: `Statement of Work for ${finalTerms.brandName || 'Campaign'}`,
    scope: {
      objective: 'To promote the brand through engaging creator content.',
      deliverables: finalTerms.finalDeliverables,
    },
    timeline: {
      keyDates: finalTerms.finalKeyDates, // Assuming this is extracted
    },
    commercials: {
      fee: finalTerms.finalBudget,
      currency: finalTerms.finalCurrency,
      paymentSchedule: 'Net-30 upon completion.',
    },
  };
}