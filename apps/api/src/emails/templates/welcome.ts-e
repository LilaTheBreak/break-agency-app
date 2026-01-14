import type { EmailTemplate } from './types';

export const welcomeTemplate: EmailTemplate = {
  subject: (data) => `Welcome to The Break Co, ${data.firstName ?? "creator"}!`,
  render: (data) => {
    const name = data.firstName ?? "creator";
    const intro = data.intro ?? "We’re excited to build with you.";
    const ctaUrl = data.ctaUrl ?? "https://thebreak.co/login";
    return {
      subject: `Welcome to The Break Co, ${name}!`,
      html: `
        <h1>Welcome, ${name}</h1>
        <p>${intro}</p>
        <p><a href="${ctaUrl}">Open the console</a></p>
        <p>— The Break Co. team</p>
      `,
      text: `Welcome, ${name}\n${intro}\nOpen the console: ${ctaUrl}\n— The Break Co. team`
    };
  }
};
