// apps/api/src/prompts/dealExtractionPrompt.ts

export interface DealExtractionPromptInput {
  emailBody: string;
  subject?: string;
}

export function buildDealExtractionPrompt(input: DealExtractionPromptInput) {
  const { emailBody, subject = "No subject provided" } = input;
  return `You are extracting deal details from an email.
Input subject: ${subject}
Email body: ${emailBody}
Please return a JSON object containing the fields: brand, deliverables, deadlines, usage rights, fees, negotiable points.`
    .replace(/\n/g, " ");
}
