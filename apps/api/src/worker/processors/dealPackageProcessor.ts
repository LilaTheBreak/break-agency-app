import { generateDealPackage } from "../../services/dealPackageService.js";

export default async function dealPackageProcessor(job: any) {
  return generateDealPackage(job.data);
}
