import { z } from "zod";

/** Format check only, not a GSTN verification. Never show a verified badge from this result. */
export const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
const unique = (items: string[]) => new Set(items).size === items.length;

export const dealerApplicationSchema = z.strictObject({
  legalBusinessName: z.string().trim().min(3).max(160),
  gstin: z.string().trim().toUpperCase().regex(gstinPattern, "Enter a valid GSTIN format."),
  shopCity: z.string().trim().min(2).max(80),
  servicePincodes: z.array(z.string().regex(/^[1-9][0-9]{5}$/))
    .min(1).max(20).refine(unique, "Duplicate service pincodes are not allowed."),
  categoryIds: z.array(z.string().uuid()).min(1).max(20)
    .refine(unique, "Duplicate categories are not allowed."),
});

export const dealerPhotoSchema = z.strictObject({
  applicationId: z.string().uuid(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
});

export type DealerApplicationInput = z.infer<typeof dealerApplicationSchema>;
