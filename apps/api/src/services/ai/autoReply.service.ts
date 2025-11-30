export async function handleAutoReply({
  talent,
  platform,
  executeReply
}: {
  talent: any;
  platform: string;
  executeReply?: () => Promise<any>;
}) {
  const settings = talent?.aiSettings;
  if (!settings) return null;

  if (platform === "instagram" && !settings.autoReply) {
    return null;
  }

  if (platform === "whatsapp" && !settings.outreachEnabled) {
    return null;
  }

  if (typeof executeReply === "function") {
    return executeReply();
  }

  return null;
}
