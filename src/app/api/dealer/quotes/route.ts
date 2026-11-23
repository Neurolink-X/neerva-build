import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAuth } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await getRequestAuth(request);
  if (!result.ok) return result.response;
  const { data: memberships, error: membershipError } = await result.auth.client.from("tenant_memberships").select("tenant_id,role,tenants!inner(business_name)").eq("user_id", result.auth.userId).eq("active", true).in("role", ["owner", "manager", "sales"]);
  if (membershipError) return NextResponse.json({ error: "Dealer membership could not be checked." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const tenantIds = ((memberships ?? []) as unknown as { tenant_id: string }[]).map((item) => item.tenant_id);
  if (!tenantIds.length) return NextResponse.json({ requests: [] }, { headers: { "Cache-Control": "no-store" } });
  const { data, error } = await result.auth.client.from("quote_invites")
    .select("quote_request_id,tenant_id,status,invited_at,request:quote_requests!inner(id,status,category_slug,material_description,quantity,unit,city,pincode,requested_date,created_at,site:quote_request_delivery_sites(address,unloading_floor),items:quote_request_items(line_number,product_name_snapshot,brand_snapshot,option_snapshot,quantity,unit))")
    .in("tenant_id", tenantIds).in("status", ["invited", "viewed", "responded"]).order("invited_at", { ascending: fa¶»§q«^