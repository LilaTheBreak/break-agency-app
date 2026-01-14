import { emailQueue } from '../../worker/queues.js';
import { recordThreadMessage } from '../negotiation/recordMessage.js';

export default {
  name: "sendCounterOffer",
  async run({ counter, email, policy, user, thread }) {
    if (!counter) return { sent: false, reason: "no_counter" };

    if (!policy?.autoSendNegotiation) {
      return { sent: false, reason: "sandbox_mode" };
    }

    await emailQueue.add("send-email", {
      to: email?.from,
      subject: `Re: ${email?.subject || "Proposal"}`,
      template: "negotiationCounter",
      data: {
        message: counter.message,
        counterAmount: counter.amount
      },
      userId: user?.id
    });

    if (thread?.id) {
      await recordThreadMessage(thread.id, {
        direction: "ai-counter",
        amount: counter.amount,
        body: counter.message
      });
    }

    return { sent: true };
  }
};
