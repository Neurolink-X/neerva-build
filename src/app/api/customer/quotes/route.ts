import {springOrders} from "@/modules/orders/backend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAuth } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await getRequestAuth(request);
  if (!result.ok) return result.response;
  const { data, error } = await result.auth.client.from("quote_requests")
    .select("id,status,category_slug,material_description,quantity,unit,city,pincode,requested_date,created_at,accepted_offer_id,items:quote_request_items(line_number,product_name_snapshot,brand_snapshot,option_snapshot,quantity,unit),offers:quote_offers!quote_offers_quote_request_id_fkey(id,tenant_id,revision,line_items,subtotal_paise,tax_paise,freight_paise,unloading_paise,total_paise,terms,valid_until,created_at,dealer:tenants!inner(business_name))")
    .eq("requester_id", result.auth.userId).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Your quote history could not be loaded. Refresh and retry." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ quotes: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The quote choice could not be read." }, { status: 400 }); }
  const pars¶»§q«^