"use client";
import {useEffect,useState} from "react";
import {ProductPrice} from "@/components/product-price";
import Link from "next/link";

type Product={id:string;slug:string;name:string;description:string;category:{slug:string}|null;brand:{name:string}|null;
 images?:{url:string;alt:string}[];
 variants:{id:string;sku:string;unit:string;status:string}[]};

export function PublishedMaterials({category}:{category?:string}){
 const [open,setOpen]=useState(false);
 const [products,setProducts]=useState<Product[]|null>(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  fetch("/api/catalog",{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw Error();
   const body=await response.json();
   if(body.source!=="published_database"||!Array.isArray(body.products))throw Error();
   setProducts(body.products);setFailed(false);
  }).catch(()=>{if(!controller.signal.aborted)setFailed(true)});
  return ()=>controller.abort();
 },[open]);
 const rows=(products??[]).filter(p=>(!category||p.category?.slug===category)&&p.category?.slug)
  .flatMap(p=>p.variants.filter(v=>v.status==="published").map(v=>({p,v})));
 return <details className="category-guidance" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>Check published Neerva products</summary>
  {open&&(failed?<p role="status">Published listings are temporarily unavailable. You can still request a quote.</p>:
   products===null?<p role="status">Checking published listings…</p>:
   rows.length?<ul>{rows.map(({p,v})=><li key={v.id}>{p.images?.[0]&&<a href={p.images[0].url} target="_blank" rel="noreferrer"><span className="published-product-photo" role="img" aria-label={p.images[0].alt} style={{display:"block",width:120,height:100,backgroundImage:"url("+JSON.stringify(p.images[0].url)+")",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}/></a>}<strong>{p.name}</strong> · {p.brand?.name} · {v.sku} · {v.unit} <ProductPrice category={p.category!.slug} slug={p.slug} sku={v.sku} quoteOnly={p.category!.slug==="aggregates"}/> {" "}
   <Link href={"/quotes?"+new URLSearchParams({category:p.category!.slug,material:p.name+" · "+v.sku})}>Check availability for my site →</Link></li>)}</ul>:
   <p>No published variants in this selection. The references below can be included in a quote request.</p>)}
 </details>;
}

