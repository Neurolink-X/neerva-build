import { z } from "zod";
import { catalogCategories } from "../catalog/catalog.ts";
import {allMaterialUnits,isAllowedCategoryUnit,validUnitQuantity} from "../catalog/category-units.ts";

const categorySlugs = catalogCategories.map((category) => category.slug) as [string, ...string[]];

const baseRfqSchema = z.object({
  idempotencyKey: z.string().uuid(),
  categorySlug: z.enum(categorySlugs),
  materialDescription: z.string().trim().min(3).max(240),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.enum(allMaterialUnits as [string,...string[]]),
  city: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  requestedDate: z.string().date().optional(),
  contactName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
  privacyAccepted: z.literal(true),
}).strict();

export const rfqSchema = baseRfqSchema.superRefine((value, context) => {
  if (!isAllowedCategoryUnit(value.categorySlug,value.unit)) {
    context.addIssue({ code: "custom", path: ["unit"], message: "Choose a unit suitable for this material category." });
  }
  if (!validUnitQuantity(value.unit,value.quantity)) context.addIssue({code:"custom",path:["quantity"],message:"Enter a valid quantity for the selected unit; pieces and packs must be whole numbers."});
});

export type RfqInput = z.infer<typeof rfqSchema>;
