"use client";

import { useCallback, useEffect, useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type PendingPrice = { id: string; amount_paise: number; city: string; minimum_quantity: number; unit: string; valid_from: string; valid_to: string | null; created_at: string; branch: { name: string; city: string; pincode: string }; variant: { sku: string; unit: string; product: { name: string; category: { slug: string; pricing_mode: string } } } };
const client = createNeervaBrowserClient();

async function request(path: string, init?: RequestInit) {
  const session = await client?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in with an approved platform admin account to review prices.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; prices?: PendingPrice[] };
  if (!response.ok) throw new Error(body.error ?? "Price review could not be completed.");
  return body;
}

export function PricingReviewPanel() {
  const [prices, setPrices] = useState<PendingPrice[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const loa¶»§q«^