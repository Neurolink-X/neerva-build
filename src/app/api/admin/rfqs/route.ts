import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await requirePlatformAdmin(request);
  if (!result.ok) return result.response;
  const [{ data: requests, error: requestError }, { data: tenants, error: tenantError }] = await Promise.all([
    result.auth.client.from("quote_requests").select("id,status,category_slug,material_description,quantity,unit,city,pincode,requested_date,created_at,site:quote_request_delivery_sites(address),items:quote_request_items(line_number,product_name_snapshot,brand_snapshot,option_snapshot,quantity,unit),invites:quote_invites(tenant_id,status)").in("status", ["open", "quoted"]).order("created_at", { ascending: true }).limit(250),
    result.auth.client.from("tenants").select("id,business_name,merchant_branches!inner(city,pincode,approved)").eq("status", "active").eq("merchant_branches.approved", true).order("business_name").limit(500),
  ]);
  if (requestError || tenantError) return NextResponse.json({ error: "The open requests or eligible dealers could not be loaded." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ requests: requests ?? [], dealers: tenants ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const result = await requirePlatformAd¶»§q«^