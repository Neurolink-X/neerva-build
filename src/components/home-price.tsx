"use client";
import {useEffect,useRef,useState} from "react";
import dynamic from "next/dynamic";
const ProductPrice=dynamic(()=>import("./product-price").then(m=>m.ProductPrice),{loading:()=> <span>Check local price</span>});
const CatalogOffer=dynamic(()=>import("./catalog-offer").then(m=>m.CatalogOffer),{loading:()=>null});
export function HomePrice({category,slug,quoteOnly}:{category:string;slug:string;quoteOnly?:boolean}){
 const ref=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  if(!("IntersectionObserver" in window)){const frame=requestAnimationFrame(()=>setVisible(true));return()=>cancelAnimationFrame(frame);}
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"100px"});
  observer.observe(node);return()=>observer.disconnect();
 },[]);
 return <div ref={ref} className="nbh-shop-price">{visible?<><ProductPrice category={category} slug={slug} quoteOnly={quoteOnly}/><CatalogOffer category={category} slug={slug} compact/></>:<span>Check local price</span>}</div>;
}
