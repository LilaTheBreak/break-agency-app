import { performOutreachTask } from "../../services/aiAgent/outreachRunner.js";

export default async function outreachProcessor(job: any) {
  await performOutreachTask(job.data);
}
