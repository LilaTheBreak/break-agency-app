/**
 * inboxTriageService.ts — Stub implementation.
 * Prevents module-not-found errors and provides
 * a safe placeholder for the real AI triage logic.
 */

export type TriageResult = {
  id: string;
  category: string | null;
  urgency: string | null;
  score: number;
  labels: string[];
};

/**
 * TEMP IMPLEMENTATION:
 * Returns a default low-priority triage classification.
 */
export async function triageEmail(email: {
  id: string;
  subject?: string | null;
  body?: string | null;
  from?: string | null;
}) : Promise<TriageResult> {
  console.log("📬 [triageEmail STUB] Triage requested for email:", email?.id);

  return {
    id: email.id,
    category: "general",
    urgency: "low",
    score: 5,
    labels: ["general"],
  };
}

/**
 * TEMP: Bulk triage stub for inboxPriorityService
 */
export async function triageEmails(emails: Array<{ id: string }>): Promise<TriageResult[]> {
  console.log("📬 [triageEmails STUB] Bulk triage requested:", emails.length);

  return emails.map((e) => ({
    id: e.id,
    category: "general",
    urgency: "low",
    score: 5,
    labels: ["general"],
  }));
}
