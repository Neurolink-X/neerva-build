import { z } from "zod";

export const rfqSchema = z.object({
  idempotencyKey: z.string().uuid(),
  categorySlug: z.string().min(1).max(80),
  materialDescription: z.string().trim().min(3).max(240),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.enum(["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle"]),
  city: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  requestedDate: z.string().date().optional(),
  contactName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
  turnstileToken: z.string().min(1).max(2048),
}).strict();

export type RfqInput = z.infer<typeof rfqSchema>;
