import { sendSlackAlert } from '../../integrations/slack/slackClient';
import { performInboxReply, performDealNegotiation, performOutreach } from './aiAgentActions';
import { loadAIContext } from './aiContextService';

export async function runAIAgentTask(task: {
  type: string;
  userId: string;
  emailId?: string;
  dealId?: string;
  targetBrand?: string;
}) {
  const { type, userId } = task;
  const context = await loadAIContext(userId);

  try {
    switch (type) {
      case "INBOX_REPLY":
        if (task.emailId) {
          await performInboxReply({ userId, emailId: task.emailId, context });
        }
        break;
      case "NEGOTIATE_DEAL":
        if (task.dealId) {
          await performDealNegotiation({ userId, dealId: task.dealId, context });
        }
        break;
      case "OUTREACH":
        await performOutreach({ userId, targetBrand: task.targetBrand, context });
        break;
      default:
        console.warn("Unknown AI Agent task:", task);
        await sendSlackAlert("Unknown AI Agent task", task);
    }
  } catch (err) {
    console.error("AI Agent Task Error:", err);
    await sendSlackAlert("AI Agent Task Error", {
      type,
      err: `${err}`
    });
    throw err;
  }
}
