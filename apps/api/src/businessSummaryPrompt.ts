/**
 * Builds a prompt for generating a high-level business summary.
 * @param insightsData - Aggregated data about revenue, deals, and inbox performance.
 * @returns A string prompt for the LLM.
 */
export function buildBusinessSummaryPrompt(insightsData: any): string {
  return `
    You are a business analyst for a top-tier talent agency. Your task is to analyze the following performance data and provide a concise, insightful summary.

    **Data Snapshot:**
    ${JSON.stringify(insightsData, null, 2)}

    **Instructions:**
    Generate a JSON object that includes a 'healthScore' (0-100, where 100 is excellent), a list of key 'risks' to watch out for, 'opportunities' to capitalize on, actionable 'recommendations' for the team, and a concise 'summary' of the overall business performance.

    **Return JSON with this exact structure:**
    {
      "healthScore": "number (0-100)",
      "risks": ["string (e.g., 'High dependency on a single talent for revenue')"],
      "opportunities": ["string (e.g., 'Untapped potential in the gaming niche')"],
      "recommendations": ["string (e.g., 'Focus outreach on brands in the tech sector')"],
      "summary": "string (A 2-3 sentence executive summary)"
    }
  `;
}