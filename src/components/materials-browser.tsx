"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AddToMaterialList } from "@/components/material-basket";
import { ProductArtwork } from "@/components/product-artwork";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import type { CatalogCategory } from "@/modules/catalog/catalog";

const defaultUnit: Record<string, string> = { steel: "kg", cement: "bag", "bricks-blocks": "piece", plumbing: "length", electrical: "coil", aggregates: "truck" };

export function MaterialsBrowser({ products, categories, initialQuery = "", initialCategory = "all" }: { products: DemoProduct[]; categories: CatalogCategory[]; initialQuery?: string; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState("relevance");
  const brands = useMemo(() => [...new Set(products.filter((item) => category === "all" || item.category === category).map((item) => item.brand))].sort(), [products, category]);
  const visible = useMemo(() => {
    const matched = products.filter((item) => (category === "all" || item.category === category) && (brand === "all" || item.brand === brand) && `${item.name} ${item.brand} ${item.description} ${item.specifications.map((spec) => `${spec.label} ${spec.value}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
    return matched.sort((a, b) => sort === "brand" ? a.brand.localeCompare(b.brand) : sort === "name" ? a.name.localeCompare(b.name) : 0);
  }, [products, category, brand, query, sort]);
  function chooseCategory(value: string) { setCategory(value); setBrand("all"); }
  return <div className="materials-showcase">
    <div className="catalog-category-tabs" aria-label="Filter by material category"><button type="button" className={category === "all" ? "active" : ""} onClick={() => chooseCategory("all")}>All materials <span>{products.length}</span></button>{categories.map((item) => <button type="button" key={item.slug} className={category === item.slug ? "active" : ""} onClick={() => chooseCategory(item.slug)}>{item.title}<span>{products.filter((product) => product.category === item.slug).length}</span></button>)}</div>
    <div className="catalog-toolbar"><label className="catalog-search">Search products<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, grade, size or use…" /></label><label>Brand<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">All listed brands</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Recommended</option><option value="name">Name A–Z</option><option value="brand">Brand A–Z</option></select></label></div>
    <div className="catalog-results-row"><span><strong>{visible.length}</strong> catalog examples</span><span>Live stock and rates appear only from verified dealer data</span></div>
    <p className="catalog-demo-note"><strong>Availability and rates are confirmed per dealer and location.</strong> Illustrative profiles are marked; a brand listing does not itself verify dealer authorization or certification.</p>
    {visible.length ? <div className="product-grid">{visible.map((item) => {
      const parent = categories.find((categoryItem) => categoryItem.slug === item.category);
      const href = `/materials/${item.category}/${item.slug}`;
      return <article className="showcase-product-card" key={item.slug}>
        <Link className="showcase-product-media" href={href} aria-label={`View ${item.name}`}>{item.images?.[0] ? <Image className="catalog-real-image" src={item.images[0]} alt={`${item.name}, ${item.brand}`} fill sizes="(max-width: 680px) 100vw, 45vw" unoptimized /> : <ProductArtwork category={item.category} />}<span className="product-image-count">{item.images?.length ? `${item.images.length} product image${item.images.length === 1 ? "" : "s"}` : "Illustrative profile"}</span></Link>
        <div className="showcase-product-copy"><div className="showcase-product-meta"><span>{parent?.title ?? "Material"}</span><span>{item.publishedListing ? "Published product" : "Illustrative example"}</span></div><h2><Link href={href}>{item.name}</Link></h2><p className="showcase-brand">{item.brand}</p><div className="spec-chip-row">{item.specifications.slice(0, 2).map((spec) => <span key={spec.label}><b>{spec.label}</b> {spec.value}</span>)}</div><div className="showcase-stock-note"><span aria-hidden="true">⌖</span> Enter your site pincode on quote request to confirm serviceability</div><div className="showcase-product-actions">{item.quoteOnly ? <Link className="button button-orange" href={`/quotes?category=${item.category}&material=${encodeURIComponent(item.name)}`}>Request private quote</Link> : <AddToMaterialList product={item} option={item.name} unit={defaultUnit[item.category] ?? "piece"} className="button button-outline" />}<Link className="product-detail-link" href={href}>Specifications & options →</Link></div></div>
      </article>;
    })}</div> : <div className="catalog-empty"><strong>No matching catalog examples.</strong><p>Try another brand, product name or specification.</p><button className="button button-dark button-small" onClick={() => { setCategory("all"); setBrand("all"); setQuery(""); setSort("relevance"); }}>Reset filters</button></div>}
  </div>;
}
