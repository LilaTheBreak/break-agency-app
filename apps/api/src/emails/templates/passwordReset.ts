import type { EmailTemplate } from './types.js';

export const passwordResetTemplate: EmailTemplate = {
  subject: () => "Reset your Break Co. password",
  render: (data) => {
    const resetUrl = data.resetUrl ?? "https://thebreak.co/reset";
    return {
      subject: "Reset your Break Co. password",
      html: `
        <h1>Password reset requested</h1>
        <p>Select the link below to set a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you didn't request this, ignore this email.</p>
      `,
      text: `Password reset requested.\nReset link: ${resetUrl}\nIf you didn't request this, ignore this email.`
    };
  }
};
