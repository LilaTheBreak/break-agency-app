import type { EmailTemplateName, EmailTemplate } from './types';
import { welcomeTemplate } from './welcome';
import { passwordResetTemplate } from './passwordReset';
import { creatorApplicationTemplate } from './creatorApplication';
import { adminApprovalTemplate } from './adminApproval';
import { campaignAssignedTemplate } from './campaignAssigned';
import { submissionAcceptedTemplate } from './submissionAccepted';
import { payoutSentTemplate } from './payoutSent';
import { weeklyRevenueTemplate } from './weeklyRevenue';
import { onboardingEmailTemplate } from './onboardingEmail';
import { newBriefNotificationTemplate } from './newBriefNotification';
import { payoutReminderTemplate } from './payoutReminder';
import { invoiceOverdueTemplate } from './invoiceOverdue';
import { systemAlertTemplate } from './systemAlert';
import { accountSetupTemplate } from './accountSetup';

// Default template for new AI-generated templates
const defaultTemplate: EmailTemplate = {
  subject: (data?: any) => "Email from The Break Agency",
  render: (data?: any) => ({
    subject: "Email from The Break Agency",
    html: "<p>This is a default email template.</p>"
  })
};

const templateMap: Record<EmailTemplateName, EmailTemplate> = {
  welcome: welcomeTemplate,
  "password-reset": passwordResetTemplate,
  "creator-application": creatorApplicationTemplate,
  "admin-approval": adminApprovalTemplate,
  "campaign-assigned": campaignAssignedTemplate,
  "submission-accepted": submissionAcceptedTemplate,
  "payout-sent": payoutSentTemplate,
  "weekly-revenue": weeklyRevenueTemplate,
  onboardingEmail: onboardingEmailTemplate,
  newBriefNotification: newBriefNotificationTemplate,
  payoutReminder: payoutReminderTemplate,
  invoiceOverdue: invoiceOverdueTemplate,
  systemAlert: systemAlertTemplate,
  "account-setup": accountSetupTemplate,
  "ai-auto-reply": defaultTemplate,
  "ai-outreach": defaultTemplate,
  "contact": defaultTemplate
};

export const templates = templateMap;
export const EMAIL_TEMPLATE_NAMES = Object.keys(templateMap) as EmailTemplateName[];

export * from './types';
