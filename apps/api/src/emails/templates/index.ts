import type { EmailTemplateName, EmailTemplate } from "./types.js";
import { welcomeTemplate } from "./welcome.js";
import { passwordResetTemplate } from "./passwordReset.js";
import { creatorApplicationTemplate } from "./creatorApplication.js";
import { adminApprovalTemplate } from "./adminApproval.js";
import { campaignAssignedTemplate } from "./campaignAssigned.js";
import { submissionAcceptedTemplate } from "./submissionAccepted.js";
import { payoutSentTemplate } from "./payoutSent.js";
import { weeklyRevenueTemplate } from "./weeklyRevenue.js";
import { onboardingEmailTemplate } from "./onboardingEmail.js";
import { newBriefNotificationTemplate } from "./newBriefNotification.js";
import { payoutReminderTemplate } from "./payoutReminder.js";
import { invoiceOverdueTemplate } from "./invoiceOverdue.js";
import { systemAlertTemplate } from "./systemAlert.js";

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
  systemAlert: systemAlertTemplate
};

export const templates = templateMap;
export const EMAIL_TEMPLATE_NAMES = Object.keys(templateMap) as EmailTemplateName[];

export * from "./types.js";
