import { z } from "zod";

export const ListingStatus = z.enum([
  "COMING_SOON",
  "ACTIVE",
  "UNDER_OFFER",
  "SOLD",
  "WITHDRAWN"
]);

export const ListingSchema = z.object({
  refCode: z.string().min(3),
  status: ListingStatus,
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postcode: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional()
  }),
  priceGuide: z.number().int().positive(),
  tenure: z.string().optional(),
  beds: z.number().int().nonnegative(),
  baths: z.number().int().nonnegative(),
  sqft: z.number().int().nonnegative().optional(),
  features: z.array(z.string()).default([]),
  description: z.string().optional()
});

export type ListingInput = z.infer<typeof ListingSchema>;
