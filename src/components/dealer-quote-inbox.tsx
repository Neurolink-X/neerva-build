"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type RequestItem = { line_number: number; product_name_snapshot: string; brand_snapshot: string; option_snapshot: string; quantity: number | string; unit: string };
type QuoteRequest = { id: string; status: string; category_slug: string; material_description: string; quantity: number | string; unit: string; city: string; pincode: string; site: { address: string; unloading_floor:number|null } | null; requested_date: string | null; created_at: string; items: RequestItem[] };
type Invitation = { quote_request_id: string; tenant_id: string; status: string; invited_at: string; request: QuoteRequest };
const client = createNeervaBrowserClient();
async function api(init?: RequestInit) {
  const session = await client?.auth.getSession(); const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in with an active dealer account to view invitations.");
  const response = await fetch("/api/dealer/quotes", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string; requests?: Invitation[] };
  if (!response.ok) throw new Error(body.error ?? "Dealer quote requests could not be loaded."); return body;
}
const paise = (value: FormDataEntr¶»§q«^