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
  if (!response.ok) throw new Error(body.error ?? "The catalog service could not complete that action.");
  return body;
}

export function CatalogAdminPanel() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [specs, setSpecs] = useState([{ label: "Specification", value: "Confirm from manufacturer documentation" }]);
  const selectedCategory = useMemo(() => catalog?.categories.find((item) => item.slug === "cement")?.slug ?? catalog?.categories[0]?.slug ?? "", [catalog]);
  const load = useCallback(async () => {
    if (!supabase) return;
    try { setCatalog(await authorizedFetch("/api/admin/catalog") as unknown as CatalogData); setError(""); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Catalog data could not be loaded."); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const payload = { categorySlug: String(form.get("categorySlug")), brand: String(form.get("brand")), name: String(form.get("name")), slug: String(form.get("slug")), description: String(form.get("description")), unit: String(form.get("unit")), sku: String(form.get("sku")), specifications: specs.filter((item) => item.label.trim() && item.value.trim()), mediaUrls: imageUrls, status: String(form.get("status")) };
    try { const result = await authorizedFetch("/api/admin/catalog", { method: "POST", body: JSON.stringify(payload) }); setMessage(result.message ?? "Product saved."); formElement.reset(); setSpecs([{ label: "Specification", value: "Confirm from manufacturer documentation" }]); setImageUrls([]); await load(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Product could not be saved."); }
    finally { setBusy(false); }
  }

  async function uploadImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !supabase) return;
    if (files.length + imageUrls.length > 8) { setError("A product can have up to 8 images."); return; }
    if (files.some((file) => !["image/avif", "image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) { setError("Use AVIF, JPEG, PNG or WebP images up to 5 MB each."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign in with an approved administrator account to upload images.");
      const urls: string[] = [];
      for (const file of files) {
        const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const path = `products/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("neerva-catalog").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
        if (uploadError) throw new Error("Image upload failed. Confirm the catalog storage migration is applied.");
        urls.push(supabase.storage.from("neerva-catalog").getPublicUrl(path).data.publicUrl);
      }
      setImageUrls((current) => [...current, ...urls]); setMessage(`${urls.length} product image${urls.length === 1 ? "" : "s"} uploaded.`);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Product images could not be uploaded."); }
    finally { setBusy(false); }
  }

  async function setStatus(product: Product, status: string) {
    setBusy(true); setError(""); setMessage("");
    try { await authorizedFetch("/api/admin/catalog", { method: "PATCH", body: JSON.stringify({ productId: product.id, status }) }); setMessage(`${product.name} is now ${status}.`); await load(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Status could not be changed."); }
    finally { setBusy(false); }
  }

  if (!supabase) return <section className="catalog-admin-empty"><h2>Catalog tools are waiting for NEERVA authentication.</h2><p>Connect the separate NEERVA Supabase project and apply the listed migrations. This page does not collect admin credentials while backend setup is missing.</p></section>;
  return <div className="catalog-admin-panel">
    <section className="catalog-admin-card"><div className="section-kicker">PLATFORM CATALOG</div><h2>Add a product profile</h2><p>Only approved platform admins can create or publish catalog products. A brand name does not imply manufacturer authorization.</p>
      <form className="catalog-admin-form" onSubmit={createProduct}>
        <label>Category<select name="categorySlug" required defaultValue={selectedCategory}>{(catalog?.categories ?? []).map((item) => <option key={item.slug} value={item.slug}>{item.name_en}{item.pricing_mode === "quote_only" ? " · quote-only" : ""}</option>)}</select></label>
        <label>Brand / manufacturer name<input name="brand" required minLength={2} maxLength={100} placeholder="e.g. brand listed by dealer" /></label>
        <label>Product display name<input name="name" required minLength={3} maxLength={160} placeholder="Product type and defining size" /></label>
        <label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} placeholder="product-size-grade" /></label>
        <label>Variant / SKU<input name="sku" required minLength={2} maxLength={80} pattern="[A-Za-z0-9._/-]+" placeholder="Manufacturer or internal SKU" /></label>
        <label>Base unit<select name="unit">{units.map((unit) => <option key={unit} value={unit}>{unit.replaceAll("_", " ")}</option>)}</select></label>
        <label className="wide-field">Description<textarea name="description" maxLength={2000} rows={3} placeholder="Key product application and what buyers must verify" /></label>
        <fieldset className="catalog-spec-editor wide-field"><legend>Technical specifications</legend>{specs.map((spec, index) => <div className="catalog-spec-row" key={index}><input aria-label={`Specification ${index + 1} name`} value={spec.label} maxLength={60} onChange={(event) => setSpecs((current) => current.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} placeholder="e.g. Grade" /><input aria-label={`Specification ${index + 1} value`} value={spec.value} maxLength={240} onChange={(event) => setSpecs((current) => current.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} placeholder="e.g. Confirm the exact grade" /><button className="button button-outline button-small" type="button" onClick={() => setSpecs((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current)}>Remove</button></div>)}<button className="button button-outline button-small" type="button" disabled={specs.length >= 30} onClick={() => setSpecs((current) => [...current, { label: "", value: "" }])}>Add specification</button></fieldset>
        <div className="catalog-media-field wide-field"><label>Product photos (AVIF, JPEG, PNG or WebP · max 5 MB each)<input type="file" accept="image/avif,image/jpeg,image/png,image/webp" multiple onChange={(event) => void uploadImages(event)} disabled={busy || imageUrls.length >= 8} /></label><div className="catalog-media-list">{imageUrls.map((url) => <div key={url}><span>{new URL(url).pathname.split("/").at(-1)}</span><button type="button" onClick={() => setImageUrls((current) => current.filter((image) => image !== url))}>Remove</button></div>)}</div></div>
        <label>Initial publication state<select name="status" defaultValue="draft"><option value="draft">Draft · recommended</option><option value="published">Published</option></select></label>
        <p className="wide-field">Public selling prices are managed separately by dealer offers and approval. Quote-only material categories cannot be published with fixed public prices.</p>
        <button className="button button-dark wide-field" disabled={busy}>{busy ? "Saving securely…" : "Save product profile →"}</button>
      </form>
      {error && <p className="admin-feedback error" role="alert">{error}</p>}{message && <p className="admin-feedback success" role="status">{message}</p>}
    </section>
    <section className="catalog-admin-card"><div className="section-kicker">PRODUCT CONTROL</div><h2>Products and variants</h2><p>{catalog ? `${catalog.products.length} products loaded · new products start with one SKU variant.` : "Sign in to load the protected catalog."}</p>
      <div className="admin-products-list">{(catalog?.products ?? []).map((product) => <article className="admin-product-row" key={product.id}><div><strong>{product.name}</strong><span>{product.brand?.name ?? "No brand"} · {product.category.name_en} · {product.variants.length} variant(s)</span><small>{product.variants.map((variant) => `${variant.sku} (${variant.unit})`).join(" · ")}</small></div><div className="admin-product-actions"><span className={`status-pill ${product.status}`}>{product.status}</span><select aria-label={`Set ${product.name} status`} disabled={busy || product.category.pricing_mode === "quote_only"} value={product.status} onChange={(event) => void setStatus(product, event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div></article>)}</div>
    </section>
  </div>;
}
