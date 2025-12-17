import type { EmailTemplate } from "./types.js";

export const accountSetupTemplate: EmailTemplate = {
  subject: (data) => `Welcome to Break - Complete Your Account Setup`,
  render: (data) => {
    const name = data.name ?? "there";
    const setupUrl = data.setupUrl ?? "https://console.thebreak.co/setup";
    const role = data.role ?? "team member";
    const inviterName = data.inviterName ?? "The Break team";
    
    return {
      subject: `Welcome to Break - Complete Your Account Setup`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { text-align: center; margin-bottom: 40px; }
              .logo { font-size: 24px; font-weight: bold; letter-spacing: 0.3em; }
              .content { background: #fafaf6; padding: 40px; border-radius: 16px; }
              .button { display: inline-block; background: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
              .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #666; }
              .role-badge { background: #a70f0c; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">THE BREAK</div>
              </div>
              <div class="content">
                <h1 style="margin-top: 0;">Welcome to Break, ${name}!</h1>
                <p>${inviterName} has invited you to join Break as a <span class="role-badge">${role}</span>.</p>
                <p>To get started, click the button below to complete your account setup:</p>
                <div style="text-align: center;">
                  <a href="${setupUrl}" class="button">Complete Your Setup</a>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 32px;">
                  This link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>Break Co. - Premium Console for Creators, Brands, and Culture Teams</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Welcome to Break, ${name}!\n\n${inviterName} has invited you to join Break as a ${role}.\n\nTo get started, visit this link to complete your account setup:\n${setupUrl}\n\nThis link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.\n\n---\nBreak Co. - Premium Console for Creators, Brands, and Culture Teams`
    };
  }
};
