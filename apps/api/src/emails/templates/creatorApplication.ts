import type { EmailTemplate } from "./types.js";

export const creatorApplicationTemplate: EmailTemplate = {
  subject: () => "We received your creator application",
  render: (data) => {
    const name = data.firstName ?? "creator";
    const timeline = data.timeline ?? "48 hours";
    return {
      subject: "We received your creator application",
      html: `
        <h1>Thanks, ${name}</h1>
        <p>Your application is in review. A talent manager will follow up within ${timeline}.</p>
        <p>Track progress anytime inside the Break Co. console.</p>
      `,
      text: `Thanks, ${name}. Your application is in review. We'll reply within ${timeline}.`
    };
  }
};
