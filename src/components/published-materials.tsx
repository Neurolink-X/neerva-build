"use client";
import {isPublicConstructionProduct} from "@/modules/catalog/discovery-policy";
import {useEffect,useMemo,useState} from "react";
import {ProductPrice} from "@/components/product-price";
import Link from "next/link";
import Image from "next/image";

type Product={id:string;slug:string;name:string;description:string;category:{slug:string}|null;brand:{name:string}|null;
 images?:{url:string;alt:string}[];
 variants:{id:string;sku:string;unit:string;status:string}[]};

type PublishedMaterialsProps={category?:string;initiallyOpen?:boolean};
export function PublishedMaterials(props:PublishedMaterialsProps){return <PublishedMaterialsPage key={props.category??"all"} {...props}/>;}
function PublishedMaterialsPage({category,initiallyOpen=false}:PublishedMaterialsProps){
 const [open,setOpen]=useState(initiallyOpen);
 const [attempt,setAttempt]=useState(0);
 const [products,setProducts]=useState<Product[]|null>(null);
 const [failed,setFailed]=useState(false);
 const [cursor,setCursor]=useState<string|null>(null);
 const [nextCursor,setNextCursor]=useState<string|null>(null);
 const [previous,setPrevious]=useState<(string|null)[]>([]);
 const move=(next:string|null)=>{setProducts(null);setFailed(false);setNextCursor(null);setCursor(next);};
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  let disposed=false;
  const timeout=setTimeout(()=>controller.abort(),10000);
  const params=new URLSearchParams({limit:"24"});
  if(category)params.set("category",category);
  if(cursor)params.set("after",cursor);
  fetch("/api/catalog?"+params,{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw Error();
   const body=await response.json();
   if(!["published_database","reference_only"].includes(body.source)||!Array.isArray(body.products))throw Error();
   if(!disposed&&!controller.signal.aborted){setProducts(body.products);setNextCursor(typeof body.nextCursor==="string"?body.nextCursor:null);setFailed(false);}
  }).catch(()=>{if(!disposed)setFailed(true)}).finally(()=>clearTimeout(timeout));
  return ()=>{disposed=true;clearTimeout(timeout);controller.abort();};
 },[open,category,attempt,cursor]);
 const rows=useMemo(()=>(products??[]).filter(p=>(!category||p.category?.slug===category)&&p.category?.slug&&isPublicConstructionProduct({category:p.category.slug,slug:p.slug}))
  .flatMap(p=>p.variants.filter(v=>v.status==="published").map(v=>({p,v}))),[products,category]);
 return <details open={open} className="category-guidance" onToggle={e=>{const next=e.currentTarget.open;setOpen(next);if(!next){setProducts(null);setFailed(false);setCursor(null);setNextCursor(null);setPrevious([])}}}>
  <summary>Check published Neerva products</summary>
  {open&&(failed?<p role="status">Published listings are temporarily unavailable. <button type="button" onClick={()=>{setProducts(null);setFailed(false);setAttempt(n=>n+1);}}>Retry listings</button></p>:
   products===null?<p role="status">Checking published listings…</p>:
   rows.length?<ul>{rows.map(({p,v})=><li key={v.id}>{p.images?.[0]&&<a href={p.images[0].url} target="_blank" rel="noreferrer"><Image unoptimized src={p.images[0].url} alt={p.images[0].alt} width={120} height={100} loading="lazy" decoding="async" style={{objectFit:"contain",maxWidth:"100%"}}/></a>}<strong>{p.name}</strong> · {p.brand?.name} · {v.sku} · {v.unit} <ProductPrice category={p.category!.slug} slug={p.slug} sku={v.sku} quoteOnly={p.category!.slug==="aggregates"}/> {" "}
   <Link href={"/quotes?"+new URLSearchParams({category:p.category!.slug,material:p.name+" · "+v.sku+" · "+v.unit,unit:v.unit})}>Check availability for my site →</Link></li>)}</ul>:
   <p>{nextCursor?"No published variants on this page. Continue to more listings.":"No published variants on this page."}  <Link href={category?"/quotes?category="+encodeURIComponent(category):"/quotes"}>Prepare a material enquiry →</Link></p>)}
 {open&&!failed&&products!==null&&(previous.length>0||nextCursor)&&<nav aria-label="Published materials pages" className="tile-filter-row"><button type="button" disabled={!previous.length} onClick={()=>{const prior=previous.at(-1)??null;setPrevious(previous.slice(0,-1));move(prior);}}>Previous listings</button><button type="button" disabled={!nextCursor} onClick={()=>{if(nextCursor){setPrevious([...previous,cursor]);move(nextCursor);}}}>Next listings</button></nav>}
 </details>;
}

