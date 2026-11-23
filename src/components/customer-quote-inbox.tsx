"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type Offer = { id: string; revision: number; tenant_id:string; line_items: { productName: string; brand: string; option: string; quantity: number; unit: string; unitPricePaise: number; lineTotalPaise: number }[]; subtotal_paise: number; tax_paise: number; freight_paise: number; unloading_paise: number; total_paise: number; terms: string; valid_until: string; created_at: string; dealer: { business_name: string } };
type Quote = { id: string; status: string; material_description: string; city: string; pincode: string; requested_date: string | null; created_at: string; accepted_offer_id: string | null; items: { line_number: number; product_name_snapshot: string; brand_snapshot: string; option_snapshot: string; quantity: number; unit: string }[]; offers: Offer[] };
const client = createNeervaBrowserClient();

async function api(path: string, init?: RequestInit) {
  const session = await client?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in with the customer account used to send the request.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; message¶»§q«^