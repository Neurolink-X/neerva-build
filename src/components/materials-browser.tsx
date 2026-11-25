"use client";
import {CatalogOffer} from "@/components/catalog-offer";
import {ProductPrice} from "@/components/product-price";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useMemo,useState,useRef} from "react";
import {referencePage} from "@/modules/catalog/reference-page";
import {CatalogMaterialImage} from "@/components/catalog-material-image";
import {BrandMark} from "@/components/brand-mark";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import type {CatalogCategory} from "@/modules/catalog/catalog";
import {filterCatalog,productFacetValues} from "@/modules/catalog/discovery";
import {groupCatalogByPhoto,rangeVariantLabel} from "@/modules/catalog/media-usage";
export function MaterialsBrowser({products,categories,initialQuery="",initialBrand="all",initialCategory="all",scopedCategory}:{
 products:DemoProduct[];categories:CatalogCategory[];initialQuery?:string;initialBrand?:string;initialCategory?:string;scopedCategory?:string
}){
 const router=useRouter();
 const [category,setCategory]=useState(initialCategory);
 const [brand,setBrand]=useState(initialBrand);
 const [gradeOrSize,setGradeOrSize]=useState("all");
 const [query,setQuery]=useState(initialQuery);
 const [page,setPage]=useState(0);
 const resultsRef=useRef<HTMLDivElement>(null);
 const facets=useMemo(()=>productFacetValues(products,category),[products,category]);
 const visible=useMemo(()=>filterCatalog(products,{category,brand,gradeOrSize,query}),[products,category,brand,gradeOrSize,query]);
 const groups=useMemo(()=>groupCatalogByPhoto(visible),[visible]);
 const paged=useMemo(()=>referencePage(groups,page),[groups,page]);
 function chooseCategory(c:string){if(scopedCategory&&c!==scopedCategory){window.dispatchEvent(new Event("neerva:navigation-start"));router.push("/materials?"+new URLSearchParams({category:c,search:query})+"#catalog-results");return}setCategory(c);setBrand("all");setGradeOrSize("all");setPage(0)}
 function clear(){if(scopedCategory){window.dispatchEvent(new Event("neerva:navigation-start"));router.push("/materials#catalog-results");return}setCategory("all");setBrand("all");setGradeOrSize("all");setQuery("");setPage(0)}
 function move(next:number){setPage(next);resultsRef.current?.scrollIntoView({block:"start"});resultsRef.current?.focus({preventScroll:true});}
 return <section id="catalog-results" className="catalog-discovery" aria-label="Find materials by brand and technical specification">
  <form className="catalog-toolbar" role="search" onSubmit={e=>e.preventDefault()}>
   <label className="catalog-search">Search by product, brand, grade or application
    <input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}} placeholder="e.g. 550SD, 50 kg PPC, CPVC" maxLength={100}/></label>
   <label>Category<select value={category} onChange={e=>chooseCategory(e.target.value)}>
    <option value="all">All categories</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.title}</option>)}</select></label>
   <label>Manufacturer / brand<select value={brand} onChange={e=>{setBrand(e.target.value);setPage(0)}}>
    <option value="all">All brands and references</option>{facets.brands.map(b=><option key={b} value={b}>{b}</option>)}</select></label>
   <label>Size / grade / pack<select value={gradeOrSize} onChange={e=>{setGradeOrSize(e.target.value);setPage(0)}}>
    <option value="all">All sizes and grades</option>{facets.gradesAndSizes.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  </form>
  <div ref={resultsRef} tabIndex={-1} className="catalog-results-meta"><p aria-live="polite"><strong>{visible.length}</strong> references in {groups.length} distinct product/photo cards{groups.length>0&&<> · Showing {paged.start+1}–{paged.end}</>}</p>
   <button type="button" onClick={clear}>Reset filters</button></div>
  <p className="catalog-demo-note"><strong>Product identity first.</strong> Brand/range examples and material photographs help choose specifications. Exact SKU, manufacturer-authorized packaging, local stock, prices and delivery are pending supplier verification. You may send an order request for these references; stock and final price require confirmation.</p>
  {groups.length?<div className="product-grid">{paged.items.map(({primary:p,variants})=><article className="product-card" key={p.category+":"+p.slug}>
   <div className="product-card-art"><CatalogMaterialImage category={p.category} name={p.name} product={p}/></div>
   <div className="product-card-copy">
    <div className="product-brand-identity"><BrandMark name={p.brand} small/><small>Brand reference · no authorised dealer claim</small></div>
    <h2><Link href={`/materials/${p.category}/${p.slug}`} prefetch={false} data-intent-prefetch="">{variants.length>1?p.name.replace(/\s*[·-]\s*\d+(?:\.\d+)?\s*mm\s*$/i,"")+" · size options":p.name}</Link></h2>
    <p>{variants.length>1?"Choose a size below to see its specifications and request the matching variant.":p.description}</p>
    {variants.length>1&&<><p className="catalog-range-note">{variants.length} size options</p>
     <div className="catalog-variant-links" aria-label={"Available "+p.brand+" reference sizes"}>
      {variants.map(item=><Link key={item.slug} href={`/materials/${item.category}/${item.slug}`} prefetch={false} data-intent-prefetch="">{rangeVariantLabel(item)}</Link>)}
     </div></>}
    <div className="catalog-spec-chips">{(variants.length>1?p.specifications.filter(s=>!/diameter|thickness|nominal mass/i.test(s.label)):p.specifications).slice(0,3).map(s=><span key={s.label}><b>{s.label}:</b> {s.value}</span>)}</div>
    <div className="catalog-sku-status"><span>Availability by pincode</span></div>
    <div className="product-card-foot"><ProductPrice category={p.category} slug={p.slug} quoteOnly={p.quoteOnly}/>
     <Link href={`/materials/${p.category}/${p.slug}`}>{variants.length>1?"Review range →":"View details →"}</Link></div>
    <CatalogOffer category={p.category} slug={p.slug}/>
   </div>
  </article>)}</div>:<div className="catalog-empty">
   <strong>No matching material reference found.</strong><p>Try another brand, grade, size or category. This is not proof a product is unavailable nationwide.</p>
   <button className="button button-dark button-small" type="button" onClick={clear}>Clear all filters</button>
  </div>}
  {paged.pages>1&&<nav className="catalog-page-nav" aria-label="Material catalog pages"><button type="button" disabled={paged.page===0} onClick={()=>move(paged.page-1)}>← Previous</button><span>Page {paged.page+1} of {paged.pages}</span><button type="button" disabled={paged.page===paged.pages-1} onClick={()=>move(paged.page+1)}>Next →</button></nav>}
 </section>;
}

