import { z } from "zod";

export const dealExtractionSchema = z.object({
  brand: z.string().optional(),
  campaignName: z.string().optional(),
  compensation: z
    .object({
      type: z.enum(["paid", "gifted", "unknown"]).optional(),
      amount: z.string().optional(),
      currency: z.string().optional()
    })
    .optional(),
  deliverables: z.array(z.string()).optional(),
  usageRights: z.string().optional(),
  exclusivity: z.string().optional(),
  keyDates: z
    .object({
      due: z.string().optional(),
      shoot: z.string().optional(),
      posting: z.string().optional()
    })
    .optional(),
  contacts: z.array(z.string()).optional(),
  redFlags: z.array(z.string()).optional(),
  sentiment: z.string().optional(),
  summary: z.string(),
  confidence: z.number().min(0).max(1)
});
