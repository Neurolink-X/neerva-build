"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BASKET_STORAGE_KEY, safeBasket, type BasketLine } from "@/modules/catalog/basket";

type BasketApi = {
  lines: BasketLine[]; count: number; ready: boolean;
  add: (line: Omit<BasketLine, "quantity" | "key"> & { quantity?: number }) => void;
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
  window.localStorage.setItem(BASKET_STORAGE_KEY, cachedJson);
  window.dispatchEvent(new Event("neerva-basket-change"));
}

export function MaterialBasketProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribeBasket, readLines, () => EMPTY);
  const ready = useSyncExternalStore(subscribeBasket, () => true, () => false);
  const add = useCallback((input: Omit<BasketLine, "quantity" | "key"> & { quantity?: number }) => {
    const key = `${input.category}:${input.productSlug}:${input.option}:${input.unit}`;
    const existing = readLines();
    const found = existing.find((line) => line.key === key);
    if (found) writeLines(existing.map((line) => line.key === key ? { ...line, quantity: Math.min(1_000_000, line.quantity + (input.quantity ?? 1)) } : line));
    else if (existing.length < 25) writeLines([...existing, { ...input, key, quantity: input.quantity ?? 1 }]);
  }, []);
  const setQuantity = useCallback((key: string, quantity: number) => {
    const existing = readLines();
    writeLines(existing.flatMap((line) => line.key === key ? quantity <= 0 ? [] : [{ ...line, quantity: Math.min(1_000_000, quantity) }] : [line]));
  }, []);
  const remove = useCallback((key: string) => writeLines(readLines().filter((line) => line.key !== key)), []);
  const clear = useCallback(() => writeLines([]), []);
  const value = useMemo(() => ({ lines, count: lines.reduce((sum, line) => sum + line.quantity, 0), ready, add, setQuantity, remove, clear }), [lines, ready, add, setQuantity, remove, clear]);
  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useMaterialBasket() {
  const value = useContext(BasketContext);
  if (!value) throw new Error("MaterialBasketProvider is missing from the application root.");
  return value;
}

export function BasketLink() {
  const { lines } = useMaterialBasket();
  return <Link className="basket-link" href="/basket" aria-label={`Material list, ${lines.length} ${lines.length === 1 ? "item" : "items"}`}><span aria-hidden="true">▤</span><span>My list</span><b>{lines.length}</b></Link>;
}

export function AddToMaterialList({ product, option, unit, quantity = 1, className = "button button-outline" }: {
  product: { slug: string; category: string; name: string; brand: string };
  option: string; unit: string; quantity?: number; className?: string;
}) {
  const { add } = useMaterialBasket();
  const [added, setAdded] = useState(false);
  return <button type="button" className={className} onClick={() => { add({ category: product.category, productSlug: product.slug, productName: product.name, brand: product.brand, option, unit, quantity }); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }}>
    {added ? "Added to material list ✓" : "Add to material list"}
  </button>;
}

export function CartReview() {
  const { lines, ready, setQuantity, remove } = useMaterialBasket();
  const router = useRouter();
  if (!ready) return <section className="basket-empty" aria-live="polite"><span className="eyebrow">YOUR MATERIAL LIST</span><h1>Loading your saved list…</h1><p>Your list is stored on this device until you submit a quote request.</p></section>;
  if (!lines.length) return <section className="basket-empty"><span className="eyebrow">YOUR MATERIAL LIST</span><h1>Start with what your site needs.</h1><p>Add products to compare and prepare one private, itemized dealer request. Prices are confirmed later by dealers.</p><Link className="button button-dark" href="/materials">Browse materials →</Link></section>;
  return <section className="basket-review">
    <div className="basket-summary-head"><div><span className="eyebrow">YOUR MATERIAL LIST</span><h1>Everything for this request.</h1><p>{lines.length} product {lines.length === 1 ? "line" : "lines"} · No price is assumed until a dealer confirms it.</p></div><Link className="text-link" href="/materials">Add another item <span>→</span></Link></div>
    <div className="basket-lines">{lines.map((line) => <article className="basket-line" key={line.key}><div className="basket-line-icon" aria-hidden="true">▤</div><div className="basket-line-copy"><strong>{line.productName}</strong><span>{line.brand} · {line.option} · {line.unit.replaceAll("_", " ")}</span><Link href={`/materials/${line.category}/${line.productSlug}`}>Edit product options</Link></div><label className="basket-quantity">Quantity<input type="number" min="0.001" max="1000000" step="0.001" value={line.quantity} onChange={(event) => setQuantity(line.key, Number(event.target.value))} /></label><button className="basket-remove" type="button" onClick={() => remove(line.key)} aria-label={`Remove ${line.productName}`}>Remove</button></article>)}</div>
    <aside className="basket-notice"><strong>How your quote works</strong><span>Dealers will confirm availability, current product price, tax, freight, unloading and delivery timing before you accept.</span></aside>
    <div className="basket-actions"><Link className="button button-outline" href="/materials">Continue browsing</Link><button className="button button-orange" type="button" onClick={() => router.push("/quotes?cart=1")}>Prepare a private quote request →</button></div>
  </section>;
}
