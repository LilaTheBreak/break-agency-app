import type { EmailTemplate } from "./types.js";

export const systemAlertTemplate: EmailTemplate = {
  subject: (data) => data.subject || "System alert",
  render: (data) => {
    const headline = data.headline || "Break console alert";
    const detail = data.detail || "An event requires your attention.";
    return {
      subject: data.subject || headline,
      html: `<h1>${headline}</h1><p>${detail}</p>`,
      text: `${headline}\n${detail}`
    };
  }
};
