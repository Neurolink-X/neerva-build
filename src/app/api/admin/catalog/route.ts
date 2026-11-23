import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  categorySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  brand: z.string().trim().min(2).max(100),
  name: z.string().trim().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  description: z.string().trim().max(2000),
  unit: z.enum(["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle", "length", "coil", "metre"]),
  sku: z.string().regex(/^[A-Za-z0-9._/-]{2,80}$/),
  specifications: z.array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(240) }).strict()).max(30),
  mediaUrls: z.array(z.string().url().refine((value) => value.startsWith("https://"), "HTTPS image URL required")).max(8).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
}).strict();

export async function GET(request: Request) {
  const result = await requirePlatformAdmin(request);
  if (!result.ok) return result.response;
  const [{ data: categories, error: categoriesError }, { data: brands, error: brandsError }, { data: products, error: productsError }] = await Promise.all([
    result.auth.client.from("categories").select("id,slug,name_en,name_hi,pricing_mode,status").order("name_en"),
    result.auth.client.from("brands").select("id,name,status").order("¶»§q«^