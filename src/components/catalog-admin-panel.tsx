"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type Category = { id: string; slug: string; name_en: string; pricing_mode: "public" | "quote_only"; status: string };
type Variant = { id: string; sku: string; unit: string; status: string };
type Product = { id: string; slug: string; name: string; description: string; status: string; category: { slug: string; name_en: string; pricing_mode: "public" | "quote_only" }; brand: { name: string } | null; variants: Variant[] };
type CatalogData = { categories: Category[]; brands: { id: string; name: string; status: string }[]; products: Product[] };
type ApiError = { error?: string; message?: string };
const supabase = createNeervaBrowserClient();
const units = ["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle", "length", "coil", "metre"];

async function authorizedFetch(path: string, init?: RequestInit) {
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in with an approved platform admin account first.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as ApiError & Partial<CatalogData>;
  if (!response.ok) throw new Error(¶»§q«^