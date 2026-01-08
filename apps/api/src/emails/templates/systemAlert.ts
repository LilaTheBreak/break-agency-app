import type { EmailTemplate } from "./types.js";

export const systemAlertTemplate: EmailTemplate = {
  subject: (data) => String(data.subject || "System alert"),
  render: (data) => {
    const headline = String(data.headline || "Break console alert");
    const detail = String(data.detail || "An event requires your attention.");
    return {
      subject: String(data.subject || headline),
      html: `<h1>${headline}</h1><p>${detail}</p>`,
      text: `${headline}\n${detail}`
    };
  }
};
