import type { EmailTemplate } from './types';

export const newBriefNotificationTemplate: EmailTemplate = {
  subject: (data) => `New brief: ${data.briefName ?? "Unnamed"}`,
  render: (data) => {
    const briefName = data.briefName ?? "New brief";
    const brand = data.brand ?? "Break brand";
    const dueDate = data.dueDate ?? "soon";
    const link = data.link ?? "https://console.thebreak.co/campaigns";
    return {
      subject: `New brief: ${briefName}`,
      html: `
        <h1>${briefName}</h1>
        <p>${brand} submitted a new brief. Deliverables due ${dueDate}.</p>
        <p><a href="${link}">View brief</a></p>
      `,
      text: `${briefName} from ${brand}. Due ${dueDate}. Link: ${link}`
    };
  }
};
