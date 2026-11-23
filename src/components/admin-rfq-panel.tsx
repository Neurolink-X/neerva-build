"use client";

import { useCallback, useEffect, useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type Dealer = { id: string; business_name: string; merchant_branches: { city: string; pincode: string; approved: boolean }[] };
type RequestItem = { line_number: number; product_name_snapshot: string; brand_snapshot: string; option_snapshot: string; quantity: number | string; unit: string };
type QuoteRequest = { id: string; status: string; material_description: string; category_slug: string; quantity: number | string; unit: string; city: string; pincode: string; site: { address: string } | null; requested_date: string | null; created_at: string; items: RequestItem[]; invites: { tenant_id: string; status: string }[] };
const client = createNeervaBrowserClient();
async function api(init?: RequestInit) { const session = await client?.auth.getSession(); const token = session?.data.session?.access_token; if (!token) throw new Error("Sign in with an administrator account to triage material requests."); const response = await fetch("/api/admin/rfqs", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" }); const body = await response.json().catch(() => ({})) as { error?: string; message?: string; requests?: QuoteRequest[]; dealers?: Dealer[] }; if (!response.ok) throw new Error(body.error ?? "Admin RFQ queue could not be loaded."); return body; }

export function¶»§q«^