import { z } from "zod";

export const ContactType = z.enum(["SELLER", "BUYER", "MEMBER", "OTHER"]);

export const ContactSchema = z.object({
  type: ContactType,
  name: z.string().min(1),
  emails: z.array(z.string().email()).default([]),
  phones: z.array(
    z
      .string()
      .min(5)
      .regex(/^[\d+()\-\s]+$/, "Invalid phone format")
  ).default([]),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional()
    })
    .optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional()
});

export type ContactInput = z.infer<typeof ContactSchema>;
