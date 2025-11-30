import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { performInboxReply, performDealNegotiation, performOutreach } from "./aiAgentActions.js";
import { loadAIContext } from "./aiContextService.js";

export async function runAIAgentTask(task: {
  type: string;
  userId: string;
  emailId?: string;
  dealId?: string;
  targetBrand?: string;
}) {
  const { type } = task;
  const context = await loadAIContext(task.userId);

  try {
    switch (type) {
      case "INBOX_REPLY":
        await performInboxReply({ ...task, context });
        break;
      case "NEGOTIATE_DEAL":
        await performDealNegotiation({ ...task, context });
        break;
      case "OUTREACH":
        await performOutreach({ ...task, context });
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
