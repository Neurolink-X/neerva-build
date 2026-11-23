import { z } from "zod";
import { catalogCategories } from "../catalog/catalog.ts";

const categorySlugs = catalogCategories.map((category) => category.slug) as [string, ...string[]];
categorySlugs.push("paint");

const baseRfqSchema = z.object({
  idempotencyKey: z.string().uuid(),
  categorySlug: z.enum(categorySlugs),
  materialDescription: z.string().trim().min(3).max(240),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.enum(["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle", "length", "coil", "metre","litre","job"]),
  lineItems: z.array(z.object({
    categorySlug: z.enum(categorySlugs),
    productSlug: z.string().trim().min(1).max(100),
    productName: z.string().trim().min(1).max(160),
    brand: z.string().trim().min(1).max(100),
    option: z.string().trim().min(1).max(80),
    quantity: z.number().finite().positive().max(1_000_000),
    unit: z.enum(["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle", "length", "coil", "metre","litre","job"]),
  }).strict()).max(25).optional(),
  city: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  deliveryAddress: z.string().trim().min(5).max(300),
  shareAddressConsent: z.literal(true),
  unloadingFloor: z.number().int().min(-3).max(120).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/).optional(),
  requestedDate: z.string().date().optional(),
  contactName: z.string().trim().min(2¶»§q«^