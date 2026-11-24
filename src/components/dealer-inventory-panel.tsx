"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";
import Link from "next/link";

type Branch = { id: string; tenant_id: string; name: string; city: string; pincode: string; approved: boolean };
type Variant = { id: string; sku: string; unit: string; product: { id: string; slug: string; name: string; status: string; category: { slug: string; name_en: string; pricing_mode: string }; brand: { name: string } | null } };
type Stock = { branch_id:string;variant_id:string;available_quantity:number;unit:string;updated_at:string };
type InventoryData = { memberships: { tenant_id: string; role: string; tenants: { business_name: string; status: string } }[]; branches: Branch[]; variants: Variant[]; inventory:Stock[] };
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
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Dealer inventory could not be loaded." }); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function updateStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const form = new FormData(event.currentTarget);
    // Strict API contract: inventory has four fields; price offers are a separate approved workflow.
    const body = { branchId, variantId, quantity: Number(form.get("quantity")), unit: selectedVariant?.unit ?? "" };
    try { const result = await dealerFetch("/api/dealer/inventory", { method: "POST", body: JSON.stringify(body) }); setFeedback({ kind: "success", text: result.message ?? "Inventory saved. Updated stock is visible below." }); await load(); }
    catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Inventory update failed." }); }
    finally { setBusy(false); }
  }

  if (!supabase) return <section className="catalog-admin-empty"><h2>Dealer tools are waiting for NEERVA authentication.</h2><p>Separate Supabase auth, an approved dealer tenant and its branch are required. This page does not request or store dealer passwords.</p></section>;
  const selectedVariant = inventory?.variants.find((variant) => variant.id === variantId);
  const availableBranches = inventory?.branches ?? [];
   return <div className="catalog-admin-panel"><section className="catalog-admin-card"><div className="section-kicker">DEALER STOCK</div><h2>Update an approved branch.</h2><p>Stock changes are tenant-scoped and audited. Selling prices are not created by this form. Submit an itemised price offer only against an authorised <Link href="/dealer/quotes">dealer quotation invitation</Link>.</p>
    {!availableBranches.length && <div className="admin-feedback error">No approved branch is available to this account. Ask the platform team to finish dealer approval and branch setup.</div>}
    <form className="catalog-admin-form" onSubmit={updateStock}>
      <label>Store / branch<select required value={branchId} onChange={(event) => setBranchId(event.target.value)}>{availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.city} {branch.pincode}</option>)}</select></label>
      <label>Product variant<select required value={variantId} onChange={(event) => setVariantId(event.target.value)}>{(inventory?.variants ?? []).map((variant) => <option key={variant.id} value={variant.id}>{variant.product.brand?.name ?? "Brand"} · {variant.product.name} · {variant.sku}</option>)}</select></label>
      <label>Available quantity<input name="quantity" required type="number" min="0" max="1000000" step="0.001" defaultValue="0" /></label>
      <p className="wide-field">Unit: <strong>{selectedVariant?.unit?.replaceAll("_", " ") ?? "Choose a published variant"}</strong>. Branch city is taken from your approved branch; submitted stock does not publish a customer-facing rate.</p>
      <button className="button button-dark wide-field" disabled={busy || !branchId || !variantId}>{busy ? "Saving securely…" : "Save branch stock →"}</button>
    </form>
    {feedback && <p className={`admin-feedback ${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p>}
    <section className="catalog-admin-card" aria-label="Approved branch stock records">
     <h3>Saved stock at the selected branch</h3>
     {!inventory?.inventory.filter(row=>row.branch_id===branchId).length?<p>No stock is recorded for this approved branch.</p>:
      <ul>{inventory.inventory.filter(row=>row.branch_id===branchId).map(row=>{
       const variant=inventory.variants.find(v=>v.id===row.variant_id);
       return <li key={row.branch_id+":"+row.variant_id}><strong>{variant?.product.name??"Product variant"} · {variant?.sku??row.variant_id}</strong> — {row.available_quantity} {row.unit.replaceAll("_"," ")}</li>;
      })}</ul>}
    </section>
  </section></div>;
}
