import { z } from "zod";
import { catalogCategories } from "../catalog/catalog.ts";

const categorySlugs = catalogCategories.map((category) => category.slug) as [string, ...string[]];

const baseRfqSchema = z.object({
  idempotencyKey: z.string().uuid(),
  categorySlug: z.enum(categorySlugs),
  materialDescription: z.string().trim().min(3).max(240),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.enum(["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle"]),
  city: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  requestedDate: z.string().date().optional(),
  contactName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
}).strict();

const allowedUnits: Record<string, readonly string[]> = {
  steel: ["kg", "quintal", "tonne", "piece", "bundle"],
  cement: ["bag", "tonne"],
  "bricks-blocks": ["piece", "bundle", "truck"],
  plumbing: ["piece", "bundle"],
  electrical: ["piece", "bundle", "kg"],
  aggregates: ["cubic_metre", "truck", "tonne"],
};

export const rfqSchema = baseRfqSchema.superRefine((value, context) => {
  if (!allowedUnits[value.categorySlug]?.includes(value.unit)) {
    context.addIssue({ code: "custom", path: ["unit"], message: "Choose a unit suitable for this material category." });
  }
});

export type RfqInput = z.infer<typeof rfqSchema>;
