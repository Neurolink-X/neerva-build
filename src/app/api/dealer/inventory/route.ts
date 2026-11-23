import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAuth } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await getRequestAuth(request);
  if (!result.ok) return result.response;
  const [{ data: rawMemberships, error: membershipError }, { data: rawBranches, error: branchError }, { data: rawVariants, error: variantError }] = await Promise.all([
    result.auth.client.from("tenant_memberships").select("tenant_id,role,tenants!inner(id,business_name,status)").eq("user_id", result.auth.userId).eq("active", true),
    result.auth.client.from("merchant_branches").select("id,tenant_id,name,city,pincode,approved").eq("approved", true).order("name"),
    result.auth.client.from("product_variants").select("id,sku,unit,attributes,product:products!inner(id,slug,name,status,category:categories!inner(slug,name_en,pricing_mode),brand:brands(name))").eq("status", "published").order("sku").limit(500),
  ]);
  if (membershipError || branchError || variantError) return NextResponse.json({ error: "Dealer inventory data could not be loaded. Check database migrations and membership access." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const memberships = (rawMemberships ?? []) as unknown as InventoryMembership[];
  const branches = (rawBranches ?? []) as unknown as InventoryBranch[];
  const variants = (rawVariants ?? []) as unknown as InventoryVa¶»§q«^