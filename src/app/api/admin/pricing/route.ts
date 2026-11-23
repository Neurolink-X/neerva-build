import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await requirePlatformAdmin(request);
  if (!result.ok) return result.response;
  const { data, error } = await result.auth.client.from("pricing_rules")
    .select("id,tenant_id,branch_id,variant_id,city,minimum_quantity,unit,amount_paise,valid_from,valid_to,created_at,branch:merchant_branches!inner(name,city,pincode),variant:product_variants!inner(sku,unit,product:products!inner(name,category:categories!inner(slug,pricing_mode)))")
    .eq("status", "pending_approval").order("created_at", { ascending: true }).limit(250);
  if (error) return NextResponse.json({ error: "Pending dealer prices could not be loaded. Confirm the pricing migration and admin role." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ prices: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const result = await requirePlatformAdmin(request);
  if (!result.ok) return result.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The price review could not be read." }, { status: 400 }); }
  const parsed = z.object({ ruleId: z.string().uuid(), decision: z.enum(["publish", "reject"]), reason: z.str¶»§q«^