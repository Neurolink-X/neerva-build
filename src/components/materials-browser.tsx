"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {CatalogMaterialImage} from "@/components/catalog-material-image";
import {BrandMark} from "@/components/brand-mark";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import type {CatalogCategory} from "@/modules/catalog/catalog";
import {filterCatalog,productFacetValues} from "@/modules/catalog/discovery";
export function MaterialsBrowser({products,categories,initialQuery=""}:{
 products:DemoProduct[];categories:CatalogCategory[];initialQuery?:string
}){
 const [category,setCategory]=useState("all");
 const [brand,setBrand]=useState("all");
 const [gradeOrSize,setGradeOrSize]=useState("all");
 const [query,setQuery]=useState(initialQuery);
 const facets=useMemo(()=>productFacetValues(products,category),[products,category]);
 const visible=useMemo(()=>filterCatalog(products,{category,brand,gradeOrSize,query}),[products,category,brand,gradeOrSize,query]);
 function chooseCategory(c:string){setCategory(c);setBrand("all");setGradeOrSize("all")}
 function clear(){setCategory("all");setBrand("all");setGradeOrSize("all");setQuery("")}
 return <section className="catalog-discovery" aria-label="Find materials by brand and technical specification">
  <form className="catalog-toolbar" role="search" onSubmit={e=>e.preventDefault()}>
   <label className="catalog-search">Search by product, brand, grade or application
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. 550SD, 50 kg PPC, CPVC" maxLength={100}/></label>
   <label>Category<select value={category} onChange={e=>chooseCategory(e.target.value)}>
    <option value="all">All categories</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.title}</option>)}</select></label>
   <label>Manufacturer / brand<select value={brand} onChange={e=>setBrand(e.target.value)}>
    <option value="all">All brands and references</option>{facets.brands.map(b=><option key={b} value={b}>{b}</option>)}</select></label>
   <label>Size / grade / pack<select value={gradeOrSize} onChange={e=>setGradeOrSize(e.target.value)}>
    <option value="all">All sizes and grades</option>{facets.gradesAndSizes.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  </form>
  <div className="catalog-results-meta"><p aria-live="polite"><strong>{visible.length}</strong> reference profiles · <strong>0</strong> confirmed selling offers</p>
   <button type="button" onClick={clear}>Reset filters</button></div>
  <p className="catalog-demo-note"><strong>Product identity first.</strong> Brand/range examples and material photographs help choose specifications. Exact SKU, manufacturer-authorized packaging, local stock, prices and delivery are pending supplier verification. Unverified products are not buyable.</p>
  {visible.length?<div className="product-grid">{visible.map(p=><article className="product-card" key={p.category+":"+p.slug}>
   <div className="product-card-art"><CatalogMaterialImage category={p.category} name={p.name} product={p}/></div>
   <div className="product-card-copy">
    <div className="product-brand-identity"><BrandMark name={p.brand} small/><small>Brand reference · no authorised dealer claim</small></div>
    <h2><Link href={`/materials/${p.category}/${p.slug}`}>{p.name}</Link></h2>
    <p>{p.description}</p>
    <div className="catalog-spec-chips">{p.specifications.slice(0,3).map(s=><span key={s.label}><b>{s.label}:</b> {s.value}</span>)}</div>
    <div className="catalog-sku-status"><span>SKU: awaiting seller confirmation</span><span>Stock: not verified</span></div>
    <div className="product-card-foot"><span>{p.quoteOnly?"Location-based quote only":"Price upon verified offer"}</span>
     <Link href={`/materials/${p.category}/${p.slug}`}>View details →</Link></div>
   </div>
  </article>)}</div>:<div className="catalog-empty">
   <strong>No matching material reference found.</strong><p>Try another brand, grade, size or category. This is not proof a product is unavailable nationwide.</p>
   <button className="button button-dark button-small" type="button" onClick={clear}>Clear all filters</button>
  </div>}
 </section>;
}
