/**
 * Builds a prompt for extracting structured deal information from an email.
 * @param emailBody - The cleaned text content of the email.
 * @returns A string prompt for the LLM.
 */
export function buildDealExtractionPrompt(emailBody: string): string {
  return `
    You are an AI assistant for a talent agency. Your task is to analyze the following email content and extract structured deal offer terms.

    **Email Content:**
    "${emailBody.substring(0, 8000)}"

    **Instructions:**
    Carefully parse the text and return a JSON object with the following structure. If a value is not found, use null or an empty array.

    **Return JSON with this exact structure:**
    {
      "brandName": "string (The name of the brand making the offer)",
      "contactPerson": "string (The name of the person from the brand, if mentioned)",
      "price": "number (e.g., 1500, not '$1,500')",
      "currency": "string (e.g., 'USD', 'GBP', 'EUR')",
      "deliverables": ["string (e.g., '1x Instagram Reel', '3x Stories')"],
      "platforms": ["string (e.g., 'Instagram', 'TikTok')"],
      "usageRights": "string (e.g., '6 months paid social and website usage')",
      "paymentTerms": "string (e.g., 'Net 30 upon completion')",
      "deadlines": ["string (e.g., 'Drafts due by Oct 26th', 'All content live by Nov 5th')"]
    }
  `;
}