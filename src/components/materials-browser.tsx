"use client";
import {ProductPrice} from "@/components/product-price";
import Link from "next/link";
import {useMemo,useState} from "react";
import {CatalogMaterialImage} from "@/components/catalog-material-image";
import {BrandMark} from "@/components/brand-mark";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import type {CatalogCategory} from "@/modules/catalog/catalog";
import {filterCatalog,productFacetValues} from "@/modules/catalog/discovery";
import {groupCatalogByPhoto,rangeVariantLabel} from "@/modules/catalog/media-usage";
export function MaterialsBrowser({products,categories,initialQuery=""}:{
 products:DemoProduct[];categories:CatalogCategory[];initialQuery?:string
}){
 const [category,setCategory]=useState("all");
 const [brand,setBrand]=useState("all");
 const [gradeOrSize,setGradeOrSize]=useState("all");
 const [query,setQuery]=useState(initialQuery);
 const facets=useMemo(()=>productFacetValues(products,category),[products,category]);
 const visible=useMemo(()=>filterCatalog(products,{category,brand,gradeOrSize,query}),[products,category,brand,gradeOrSize,query]);
 const groups=useMemo(()=>groupCatalogByPhoto(visible),[visible]);
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
  <div className="catalog-results-meta"><p aria-live="polite"><strong>{visible.length}</strong> references in {groups.length} distinct product/photo cards</p>
   <button type="button" onClick={clear}>Reset filters</button></div>
  <p className="catalog-demo-note"><strong>Product identity first.</strong> Brand/range examples and material photographs help choose specifications. Exact SKU, manufacturer-authorized packaging, local stock, prices and delivery are pending supplier verification. Unverified products are not buyable.</p>
  {groups.length?<div className="product-grid">{groups.map(({primary:p,variants})=><article className="product-card" key={p.category+":"+p.slug}>
   <div className="product-card-art"><CatalogMaterialImage category={p.category} name={p.name} product={p}/></div>
   <div className="product-card-copy">
    <div className="product-brand-identity"><BrandMark name={p.brand} small/><small>Brand reference · no authorised dealer claim</small></div>
    <h2><Link href={`/materials/${p.category}/${p.slug}`}>{variants.length>1?p.name.replace(/\s*[·-]\s*\d+(?:\.\d+)?\s*mm\s*$/i,"")+" · size options":p.name}</Link></h2>
    <p>{variants.length>1?"One genuine product-family photograph is used for these separately specified sizes. Choose your size below and ask the dealer to verify the supplied physical product.":p.description}</p>
    {variants.length>1&&<><p className="catalog-range-note">{variants.length} size references · one range photo · no unverified SKU-specific images</p>
     <div className="catalog-variant-links" aria-label={"Available "+p.brand+" reference sizes"}>
      {variants.map(item=><Link key={item.slug} href={`/materials/${item.category}/${item.slug}`}>{rangeVariantLabel(item)}</Link>)}
     </div></>}
    <div className="catalog-spec-chips">{(variants.length>1?p.specifications.filter(s=>!/diameter|thickness|nominal mass/i.test(s.label)):p.specifications).slice(0,3).map(s=><span key={s.label}><b>{s.label}:</b> {s.value}</span>)}</div>
    <div className="catalog-sku-status"><span>Availability by pincode</span></div>
    <div className="product-card-foot"><ProductPrice category={p.category} slug={p.slug} quoteOnly={p.quoteOnly}/>
     <Link href={`/materials/${p.category}/${p.slug}`}>{variants.length>1?"Review range →":"View details →"}</Link></div>
   </div>
  </article>)}</div>:<div className="catalog-empty">
   <strong>No matching material reference found.</strong><p>Try another brand, grade, size or category. This is not proof a product is unavailable nationwide.</p>
   <button className="button button-dark button-small" type="button" onClick={clear}>Clear all filters</button>
  </div>}
 </section>;
}

