import type { EmailTemplate } from './types.js';

export const campaignAssignedTemplate: EmailTemplate = {
  subject: (data) => `New campaign: ${data.campaignName ?? "Break activation"}`,
  render: (data) => {
    const campaignName = data.campaignName ?? "Break activation";
    const dueDate = data.dueDate ?? "soon";
    const dashboard = data.dashboardUrl ?? "https://thebreak.co/campaigns";
    return {
      subject: `New campaign: ${campaignName}`,
      html: `
        <h1>${campaignName}</h1>
        <p>You’ve been assigned deliverables due ${dueDate}.</p>
        <p><a href="${dashboard}">View campaign brief</a></p>
      `,
      text: `You’re on ${campaignName}. Deliverables due ${dueDate}. Dashboard: ${dashboard}`
    };
  }
};
