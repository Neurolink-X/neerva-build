"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";
import { useMaterialBasket } from "./material-basket";
import type { BasketLine } from "@/modules/catalog/basket";
import { OrderInvoice } from "./order-invoice";
const steps = [
  "Placed",
  "Dealer confirmed",
  "Packed",
  "Dispatched",
  "Delivered",
];
const money = (p: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    p / 100,
  );
type Order = {
  id: string;
  buying: boolean;
  business_name: string;
  status: string;
  code: string | null;
  created_at: string;
  city: string;
  pincode: string;
  address: string;
  unloading_floor: number | null;
  gstin: string | null;
  total_paise: number;
  tax_paise: number;
  freight_paise: number;
  unloading_paise: number;
  line_items: {
    productName: string;
    quantity: number;
    unit: string;
    lineTotalPaise: number;
  }[];
  materials: BasketLine[];
};
async function query(body?: unknown) {
  const token = (await createNeervaBrowserClient()?.auth.getSession())?.data
    .session?.access_token;
  if (!token) throw Error("Sign in to see your orders.");
  const res = await fetch("/api/orders", {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no¶»§q«^