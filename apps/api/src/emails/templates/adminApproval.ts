import type { EmailTemplate } from './types';

export const adminApprovalTemplate: EmailTemplate = {
  subject: () => "New approval requires attention",
  render: (data) => {
    const approvalType = data.approvalType ?? "Creator onboarding";
    const link = data.link ?? "https://thebreak.co/admin/approvals";
    return {
      subject: `Approval needed: ${approvalType}`,
      html: `
        <h1>Approval needed</h1>
        <p>${approvalType} is awaiting your review.</p>
        <p><a href="${link}">Open approval queue</a></p>
      `,
      text: `${approvalType} needs approval. Queue: ${link}`
    };
  }
};
