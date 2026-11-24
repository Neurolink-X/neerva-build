import {PublishedMaterials} from "@/components/published-materials";
import type { Metadata } from "next";
import Link from "next/link";
import { MaterialsBrowser } from "@/components/materials-browser";
import { CatalogMaterialImage } from "@/components/catalog-material-image";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { catalogCategories } from "@/modules/catalog/catalog";
import { demoProducts } from "@/modules/catalog/marketplace";

export const metadata: Metadata = { title: "Construction Materials & Brands", description: "Browse construction material categories, example specifications and brand options. Request dealer pricing after availability is confirmed.", alternates: { canonical: "/materials" } };

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ search?: string; brand?:string; category?:string }> }) {
  const params = await searchParams;
  const search = typeof params.search==="string"?params.search.slice(0,100):"";
  const category = catalogCategories.some(c=>c.slug===params.category)?params.category!:"all";
  const brand = demoProducts.some(p=>p.brand===params.brand && (category==="all"||p.category===category))?params.brand!:"all";
  return <main className="catalog-page"><SiteHeader /><section className="page-hero"><span className="eyebrow">MATERIALS CATALOG</span><h1>Find the right material.<br /><em>Compare the details.</em></h1><p>Explore product examples by material, brand, grade and size. Current dealer stock and prices will show only when verified data is connected.</p><Link className="button button-orange" href="/quotes">Request a private quote →</Link></section><section className="catalog-quote-cta" aria-label="Verified price and offer information"><div><h2>Compare the real delivered cost.</h2><p>Use your quantity and pincode to prepare a material quote. Only admin-reviewed, active, lower-priced offers display genuine savings and expiry dates. Stock, freight and delivery still need dealer confirmation.</p></div><Link href="/quotes">Prepare my itemised quote →</Link></section><section className="section catalog-content"><div className="catalog-categories"><h2>Shop by category</h2><div className="category-grid">{catalogCategories.map((item, index) => <Link href={`/materials/${item.slug}`} className="category-card" key={item.slug}><div className="category-top"><span className="category-icon">{String(index + 1).padStart(2,"0")}</span><span className="category-number">{item.quoteOnly ? "QUOTE" : "VIEW"}</span></div><CatalogMaterialImage category={item.slug} name={item.title} compact /><h3>{item.title}</h3><p>{item.description}</p><div className="category-bottom"><span>{item.quoteOnly ? "Private quotation" : "Browse examples"}</span><span className="arrow">↗</span></div></Link>)}</div></div><div className="catalog-products-title"><span className="eyebrow">DISCOVERY CATALOG</span><h2>Brands, specs and variants</h2><p>Browse brand references, product grades, sizes and dimensions. Exact manufacturer SKUs and product photos appear only after verification; no imaginary prices, discounts or dealer stock.</p></div><PublishedMaterials/><MaterialsBrowser key={JSON.stringify([search,brand,category])} initialBrand={brand} initialCategory={category} products={demoProducts} categories={catalogCategories} initialQuery={search.slice(0,100)} /></section><SiteFooter /></main>;
}
