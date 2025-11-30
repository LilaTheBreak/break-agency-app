import { generateCreatorBundle } from "../../services/creatorBundleService.js";

export default async function creatorBundleProcessor(job: any) {
  return generateCreatorBundle(job.data);
}
