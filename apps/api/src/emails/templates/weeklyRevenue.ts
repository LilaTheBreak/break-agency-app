import type { EmailTemplate } from './types.js';

export const weeklyRevenueTemplate: EmailTemplate = {
  subject: () => "The Break Co. weekly revenue report",
  render: (data) => {
    const total = data.total ?? "£0";
    const projected = data.projected ?? "£0";
    const highlights = Array.isArray(data.highlights) ? data.highlights : ["No highlights provided."];
    return {
      subject: "Your weekly revenue snapshot",
      html: `
        <h1>Weekly revenue report</h1>
        <p>Total booked: ${total}</p>
        <p>Projected next 30d: ${projected}</p>
        <ul>
          ${highlights.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      `,
      text: `Total: ${total}\nProjected: ${projected}\nHighlights:\n${highlights.join("\n")}`
    };
  }
};
