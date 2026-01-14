import type { EmailTemplate } from './types';

export const onboardingEmailTemplate: EmailTemplate = {
  subject: (data) => `Welcome to Break, ${data.firstName ?? "there"}`,
  render: (data) => {
    const name = data.firstName ?? "there";
    const checklist = Array.isArray(data.checklist) ? data.checklist : ["Complete your profile", "Connect socials"];
    const dashboardUrl = data.dashboardUrl ?? "https://console.thebreak.co";
    return {
      subject: `Welcome to Break, ${name}`,
      html: `
        <h1>You're in, ${name}</h1>
        <p>Here are your next steps:</p>
        <ul>${checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
        <p><a href="${dashboardUrl}">Open the console</a></p>
      `,
      text: `You're in, ${name}\nNext steps:\n${checklist.map((item) => `- ${item}`).join("\n")}\nDashboard: ${dashboardUrl}`
    };
  }
};
