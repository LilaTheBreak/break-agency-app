import prisma from "../lib/prisma.js";
import { parseBrandBrief } from "./ai/briefParser.js";
import { matchCreatorsToBrief } from "./ai/briefMatcher.js";

export async function ingestBrief({
  rawText,
  brandName,
  contactEmail,
  submittedBy
}: {
  rawText: string;
  brandName: string;
  contactEmail?: string;
  submittedBy?: string;
}) {
  // REMOVED: BrandBrief and BriefMatch models do not exist in schema.prisma
  // This service cannot function without the required database models
  throw new Error(
    "Brief ingestion not available: BrandBrief and BriefMatch models do not exist in database schema. " +
    "Please add these models to schema.prisma before using this feature."
  );
}
