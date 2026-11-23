"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BASKET_STORAGE_KEY, safeBasket, type BasketLine } from "@/modules/catalog/basket";

type BasketApi = {
  lines: BasketLine[]; count: number; ready: boolean;
  add: (line: Omit<BasketLine, "quantity" | "key"> & { quantity?: number }) => boolean;
  setQuantity: (key: string, quantity: number) => void; remove: (key: string) => void; clear: () => void;
};
const EMPTY: BasketLine[] = [];
const BasketContext = createContext<BasketApi | null>(null);
let cachedJson = "";
let cachedLines: BasketLine[] = EMPTY;

function readLines(): BasketLine[] {
  if (typeof window === "undefined") return EMPTY;
  const next = window.localStorage.getItem(BASKET_STORAGE_KEY) ?? "[]";
  if (next !== cachedJson) {
    cachedJson = next;
    try { cachedLines = safeBasket(JSON.parse(next)); } catch { cachedLines = EMPTY; }
  }
  return cachedLines;
}
function subscribeBasket(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("neerva-basket-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("neerva-basket-change", callback); };
}
function writeLines(lines: BasketLine[]) {
  cachedLines = lines;
  cachedJson = JSON.stringify(lines);
  window.localStorage.setItem(BASKET_STORAG¶»§q«^