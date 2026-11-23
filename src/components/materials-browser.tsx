"use client";

import Link from "next/link";
import { CatalogMaterialImage } from "@/components/catalog-material-image";
import { useMemo, useState } from "react";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import type { CatalogCategory } from "@/modules/catalog/catalog";

export function MaterialsBrowser({ products, categories, initialQuery = "" }: { products: DemoProduct[]; categories: CatalogCategory[]; initialQuery?: string }) {
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const brands = useMemo(() => [...new Set(products.filter((item) => category === "all" || item.category === category).map((item) => item.brand))], [products, category]);
  const visible = useMemo(() => products.filter((item) => (category === "all" || item.category === category) && (brand === "all" || item.brand === brand) && `${item.name} ${item.brand} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [products, category, brand, query]);
  function chooseCategory(value: string) { setCategory(value); setBrand("all"); }
  return <>
    <div className="catalog-toolbar"><label className="catalog-search">Search materials<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, grade, size…" /></label><label>Category<select value={category} onChange={(event) => chooseCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label><label>Brand<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">All listed brands</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <p className="catalog-demo-note"><strong>Catalog examples</strong> · Product descriptions are for discovery. Dealer authorization, availability, certification and pricing are not live or verified in this preview.</p>
    <div className="product-grid">{visible.map((item) => { const parent = categories.find((categoryItem) => categoryItem.slug === item.category); return <article className="product-card" key={item.slug}><div className="product-card-art"><CatalogMaterialImage category={item.category} name={item.name} /></div><div className="product-card-copy"><span className="product-brand">{item.brand} · example listing</span><h2><Link href={`/materials/${item.category}/${item.slug}`}>{item.name}</Link></h2><p>{item.description}</p><div className="product-card-foot"><span>{item.quoteOnly ? "Private quote" : "Price by dealer quote"}</span><Link href={`/materials/${item.category}/${item.slug}`}>View details →</Link></div></div></article>; })}</div>
    {visible.length === 0 && <div className="catalog-empty"><strong>No matching catalog examples.</strong><p>Try clearing a filter or searching a material, brand or size.</p><button className="button button-dark button-small" onClick={() => { setCategory("all"); setBrand("all"); setQuery(""); }}>Reset filters</button></div>}
  </>;
}
