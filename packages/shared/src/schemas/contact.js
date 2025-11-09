import { z } from "zod";
/**
 * Keep this enum IN SYNC with your Prisma schema:
 * enum ContactType { SELLER BUYER MEMBER OTHER }
 *
 * If your Prisma schema differs, change BOTH places.
 */
export const ContactType = z.enum(["SELLER", "BUYER", "MEMBER", "OTHER"]);
/** Basic validators */
const Email = z.string().email().transform(v => v.trim().toLowerCase());
const Phone = z
    .string()
    .min(5)
    .regex(/^[\d+()\-\s]+$/, "Invalid phone format")
    .transform(v => v.trim());
/** Address block (all optional) */
export const ContactAddressSchema = z
    .object({
    line1: z.string().trim().optional(),
    line2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postcode: z.string().trim().optional(),
    country: z.string().trim().optional(),
})
    .partial()
    .optional();
/** Create payload */
export const ContactCreateSchema = z.object({
    type: ContactType,
    name: z.string().min(1).transform(v => v.trim()),
    emails: z.array(Email).default([]),
    phones: z.array(Phone).default([]),
    address: ContactAddressSchema,
    notes: z.string().trim().optional(),
    tags: z.array(z.string().trim()).default([]),
    source: z.string().trim().optional(),
});
/** Update payload (id required somewhere higher; fields optional) */
export const ContactUpdateSchema = z.object({
    type: ContactType.optional(),
    name: z.string().min(1).transform(v => v.trim()).optional(),
    emails: z.array(Email).optional(),
    phones: z.array(Phone).optional(),
    address: ContactAddressSchema,
    notes: z.string().trim().optional(),
    tags: z.array(z.string().trim()).optional(),
    source: z.string().trim().optional(),
});
/** Query params incl. pagination (fixes the `unknown` errors) */
export const ContactQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    type: ContactType.optional(),
    tag: z.string().trim().optional(),
});
