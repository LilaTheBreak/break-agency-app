import { refreshSocialAnalytics } from "../../services/socialService.js";

export default async function socialRefreshProcessor(job: any) {
  const { userId, platforms } = job.data || {};
  if (!userId) return;
  await refreshSocialAnalytics({ userId, platforms });
}
