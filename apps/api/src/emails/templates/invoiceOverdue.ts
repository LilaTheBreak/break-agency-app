import type { EmailTemplate } from './types.js';

export const invoiceOverdueTemplate: EmailTemplate = {
  subject: () => "Invoice overdue",
  render: (data) => {
    const invoice = data.invoice ?? "Invoice";
    const days = data.daysOverdue ?? 3;
    return {
      subject: `${invoice} overdue ${days} days`,
      html: `<h1>${invoice} is overdue</h1><p>Please review and settle. Overdue by ${days} days.</p>`,
      text: `${invoice} overdue by ${days} days. Please settle.`
    };
  }
};
