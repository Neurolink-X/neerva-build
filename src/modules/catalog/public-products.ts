import "server-only";
import { createClient } from "@supabase/supabase-js";
import { demoProducts, type DemoProduct } from "@/modules/catalog/marketplace";

type PublishedRow = {
  slug: string; name: string; description: string; attributes: unknown;
  category: { slug: string; pricing_mode: "public" | "quote_only" };
  brand: { name: string } | null;
  variants: { id: string; sku: string; unit: string; attributes: unknown }[];
};
type PublishedPrice = { variant_id: string; amount_paise: number | string; unit: string; city: string; minimum_quantity: number | string; branch: { name: string } | null };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readSpecifications(value: unknown): { label: string; value: string }[] {
  const candidate = asRecord(value).specifications;
  if (!Array.isArray(candidate)) return [];
  return candidate.flatMap((item) => {
    const row = asRecord(item);
    return typeof row.label === "string" && typeof row.value === "string" ? [{ label: row.label, value: row.value }] : [];
  }).slice(0, 30);
}

function readImageUrls(value: unknown): string[] {
  const candidate = asRecord(value).mediaUrls;
  if (!Array.isArray(candidate)) return [];
  return candidate.filter((item): item is string => typeof item === "string" && item.startsWith("https://")).slice(0, 8);
}

function slugPart(value: string) {
  return value.toLowe¶»§q«^