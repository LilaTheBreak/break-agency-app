import { z } from "zod";

export const ViewingStatus = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED"
]);

export const ViewingAttendeeSchema = z.object({
  contactId: z.string().optional(),
  userId: z.string().optional(),
  role: z.string().optional()
});

const viewingCoreSchema = z.object({
  listingId: z.string().min(1),
  start: z.coerce.date(),
  end: z.coerce.date(),
  status: ViewingStatus.default("REQUESTED"),
  notes: z.string().optional(),
  feedback: z.record(z.string(), z.any()).optional(),
  attendees: z.array(ViewingAttendeeSchema).default([])
});

const ensureValidViewingWindow = (
  values: Partial<z.infer<typeof viewingCoreSchema>>,
  ctx: z.RefinementCtx
) => {
  if (values.start && values.end && values.end <= values.start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["end"],
      message: "End time must be after start time"
    });
  }
};

export const ViewingSchemaBase = viewingCoreSchema;

export const ViewingSchema = viewingCoreSchema.superRefine((values, ctx) =>
  ensureValidViewingWindow(values, ctx)
);

export const withViewingTimeValidation = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((values, ctx) =>
    ensureValidViewingWindow(values as Partial<z.infer<typeof viewingCoreSchema>>, ctx)
  );

export type ViewingInput = z.infer<typeof ViewingSchema>;
export type ViewingAttendeeInput = z.infer<typeof ViewingAttendeeSchema>;
