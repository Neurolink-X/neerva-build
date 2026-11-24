import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {DirectCheckout} from "@/components/direct-checkout";
import {getProduct} from "@/modules/catalog/marketplace";
export const metadata={title:"Place material order",robots:{index:false,follow:false}};
export default async function Checkout({searchParams}:{searchParams:Promise<{category?:string;product?:string}>}){const q=await searchParams;const p=typeof q.category==="string"&&typeof q.product==="string"?getProduct(q.category,q.product):undefined;return <main className="catalog-page"><SiteHeader/><section className="section ops-content" style={{maxWidth:760,margin:"0 auto",padding:"24px 16px"}}><h1>Place a material order</h1>{p?<DirectCheckout category={p.category} slug={p.slug} name={p.name}/>:<p>Choose a material first. <Link href="/materials">Browse catalog →</Link></p>}</section><SiteFooter/></main>;}
