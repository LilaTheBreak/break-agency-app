import type { EmailTemplate } from './types';

export const payoutSentTemplate: EmailTemplate = {
  subject: () => "Payout sent",
  render: (data) => {
    const amount = data.amount ?? "your payment";
    const reference = data.reference ?? "Break payout";
    return {
      subject: "Your payout is on the way",
      html: `
        <h1>Payout sent</h1>
        <p>${amount} was sent to your bank account.</p>
        <p>Reference: ${reference}</p>
      `,
      text: `${amount} sent. Reference: ${reference}`
    };
  }
};
