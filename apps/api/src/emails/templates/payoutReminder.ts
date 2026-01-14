import type { EmailTemplate } from './types';

export const payoutReminderTemplate: EmailTemplate = {
  subject: () => "Payout reminder",
  render: (data) => {
    const amount = data.amount ?? "£0";
    const dueDate = data.dueDate ?? "this week";
    return {
      subject: `Payout due ${dueDate}`,
      html: `<h1>Payout reminder</h1><p>${amount} is scheduled for ${dueDate}. Ensure bank details are current.</p>`,
      text: `${amount} scheduled for ${dueDate}. Ensure bank details are current.`
    };
  }
};
