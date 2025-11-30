import { processEmailQueue } from "../../services/emailService.js";

export default async function emailProcessor(job: any) {
  const max = job.data?.max || 20;
  await processEmailQueue(max);
}
