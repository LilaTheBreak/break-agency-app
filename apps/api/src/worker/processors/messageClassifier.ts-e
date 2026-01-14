import { classifyMessage } from '../../services/ai/messageClassifier';

export default async function messageClassifier(job: any) {
  const data = job?.data ?? {};
  const text = data.text || data.message || "";
  const platform = data.platform || "unknown";
  if (!text) return null;
  return classifyMessage({ text, platform });
}
