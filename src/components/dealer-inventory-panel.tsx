"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type Branch = { id: string; tenant_id: string; name: string; city: string; pincode: string; approved: boolean };
type Variant = { id: string; sku: string; unit: string; product: { id: string; slug: string; name: string; status: string; category: { slug: string; name_en: string; pricing_mode: string }; brand: { name: string } | null } };
type InventoryData = { memberships: { tenant_id: string; role: string; tenants: { business_name: string; status: string } }[]; branches: Branch[]; variants: Variant[] };
const supabase = createNeervaBrowserClient();

async function dealerFetch(path: string, init?: RequestInit) {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in with an approved dealer account first.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) throw new Error(body.error ?? "Dealer inventory could not be updated.");
  return body;
}

export function DealerInventoryPanel() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [variant¶»§q«^