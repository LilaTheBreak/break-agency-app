export async function sendSlackMessage(text: string) {
  console.log("[SLACK STUB] sendSlackMessage:", text);
  return true;
}

export async function sendSlackAlert(text: string, metadata?: any) {
  console.log("[SLACK STUB] sendSlackAlert:", text, metadata);
  return true;
}

export default {
  sendSlackMessage,
  sendSlackAlert
};
