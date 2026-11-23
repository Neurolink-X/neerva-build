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
  const [variantId, setVariantId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      const data = await dealerFetch("/api/dealer/inventory") as unknown as InventoryData;
      setInventory(data);
      setBranchId((current) => data.branches.some((branch) => branch.id === current) ? current : data.branches[0]?.id ?? "");
      setVariantId((current) => data.variants.some((variant) => variant.id === current) ? current : data.variants[0]?.id ?? "");
      setFeedback(null);
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Dealer inventory could not be loaded." }); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function updateStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const form = new FormData(event.currentTarget);
    const body = { branchId, variantId, quantity: Number(form.get("quantity")), unit: String(form.get("unit")), priceRupees: String(form.get("priceRupees") ?? ""), city: String(form.get("city")), quoteOnly: form.get("quoteOnly") === "on" };
    try { const result = await dealerFetch("/api/dealer/inventory", { method: "POST", body: JSON.stringify(body) }); setFeedback({ kind: "success", text: result.message ?? "Inventory saved." }); await load(); }
    catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Inventory update failed." }); }
    finally { setBusy(false); }
  }

  if (!supabase) return <section className="catalog-admin-empty"><h2>Dealer tools are waiting for NEERVA authentication.</h2><p>Separate Supabase auth, an approved dealer tenant and its branch are required. This page does not request or store dealer passwords.</p></section>;
  const selectedVariant = inventory?.variants.find((variant) => variant.id === variantId);
  const availableBranches = inventory?.branches ?? [];
  const membership = inventory?.memberships.find((item) => item.tenant_id === availableBranches.find((branch) => branch.id === branchId)?.tenant_id);
  const canPrice = membership?.role === "owner" || membership?.role === "manager";
  return <div className="catalog-admin-panel"><section className="catalog-admin-card"><div className="section-kicker">DEALER STOCK AND OFFER</div><h2>Update an approved branch.</h2><p>Stock changes are tenant-scoped and audited. Public prices remain hidden until platform approval; quote-only categories never publish fixed rates.</p>
    {!availableBranches.length && <div className="admin-feedback error">No approved branch is available to this account. Ask the platform team to finish dealer approval and branch setup.</div>}
    <form className="catalog-admin-form" onSubmit={updateStock}>
      <label>Store / branch<select required value={branchId} onChange={(event) => setBranchId(event.target.value)}>{availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.city} {branch.pincode}</option>)}</select></label>
      <label>Product variant<select required value={variantId} onChange={(event) => setVariantId(event.target.value)}>{(inventory?.variants ?? []).map((variant) => <option key={variant.id} value={variant.id}>{variant.product.brand?.name ?? "Brand"} · {variant.product.name} · {variant.sku}</option>)}</select></label>
      <label>Available quantity<input name="quantity" required type="number" min="0" max="1000000" step="0.001" defaultValue="0" /></label>
      <label>Unit<select name="unit" defaultValue={selectedVariant?.unit ?? "piece"}>{["piece", "bag", "kg", "quintal", "tonne", "cubic_metre", "truck", "bundle", "length", "coil", "metre"].map((unit) => <option key={unit} value={unit}>{unit.replaceAll("_", " ")}</option>)}</select></label>
      <label>City for offer<input name="city" required minLength={2} maxLength={80} defaultValue={availableBranches.find((branch) => branch.id === branchId)?.city ?? ""} /></label>
      <label>Proposed unit rate (₹)<input name="priceRupees" inputMode="decimal" pattern="[0-9]{1,8}(\.[0-9]{1,2})?" placeholder={canPrice ? "Leave blank for quote-only" : "Owner / manager only"} disabled={!canPrice || selectedVariant?.product.category.pricing_mode === "quote_only"} /></label>
      <label className="catalog-check-row wide-field"><input type="checkbox" name="quoteOnly" defaultChecked={selectedVariant?.product.category.pricing_mode === "quote_only"} disabled={selectedVariant?.product.category.pricing_mode === "quote_only"} /> Keep this listing quote-only (no public fixed selling price)</label>
      <p className="wide-field">A submitted rate is not public immediately. Platform review checks its product, region, effective period, taxes and customer display before publication.</p>
      <button className="button button-dark wide-field" disabled={busy || !branchId || !variantId}>{busy ? "Saving securely…" : "Save stock and submit rate →"}</button>
    </form>
    {feedback && <p className={`admin-feedback ${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p>}
  </section></div>;
}
