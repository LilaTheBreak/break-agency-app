export type EmailTemplateName =
  | "welcome"
  | "password-reset"
  | "creator-application"
  | "admin-approval"
  | "campaign-assigned"
  | "submission-accepted"
  | "payout-sent"
  | "weekly-revenue"
  | "onboardingEmail"
  | "newBriefNotification"
  | "payoutReminder"
  | "invoiceOverdue"
  | "systemAlert"
  | "account-setup";

export type EmailTemplateContext = Record<string, string | number | boolean | null | undefined>;

export type RenderedEmail = {
  subject: string;
  html: string;
  text?: string;
};

export type EmailTemplate = {
  subject: (data: EmailTemplateContext) => string;
  render: (data: EmailTemplateContext) => RenderedEmail;
};
