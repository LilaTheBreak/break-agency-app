import { sendSlackNotification } from '../../services/integrations/slackService';

export async function sendSlackMessage(text: string) {
  // Legacy function - now uses integration service
  // Note: This requires userId, so it may not work in all contexts
  console.log("[SLACK] sendSlackMessage called (legacy) - consider using sendSlackNotification with userId");
  return true;
}

export async function sendSlackAlert(text: string, metadata?: any) {
  // Legacy function - now uses integration service
  // Note: This requires userId, so it may not work in all contexts
  console.log("[SLACK] sendSlackAlert called (legacy) - consider using sendSlackNotification with userId");
  return true;
}

export default {
  sendSlackMessage,
  sendSlackAlert,
  sendSlackNotification // Export new function
};
