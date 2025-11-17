import type { EmailTemplate } from "./types.js";

export const submissionAcceptedTemplate: EmailTemplate = {
  subject: () => "Submission approved",
  render: (data) => {
    const submissionName = data.submissionName ?? "Latest deliverable";
    const payoutDate = data.payoutDate ?? "your next cycle";
    return {
      subject: `${submissionName} approved`,
      html: `
        <h1>${submissionName} is approved</h1>
        <p>Thanks for the fast turnaround. Payout is queued for ${payoutDate}.</p>
      `,
      text: `${submissionName} approved. Payout queued for ${payoutDate}.`
    };
  }
};
