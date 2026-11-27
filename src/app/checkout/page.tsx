import "../account/account-hub.css";
import {DirectCartPanel} from "@/components/direct-cart-panel";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {DirectCheckout} from "@/components/direct-checkout";
import {getProduct} from "@/modules/catalog/marketplace";
export const metadata={title:"Place material order",robots:{index:false,follow:false}};
export default async function Checkout({searchParams}:{searchParams:Promise<{category?:string;product?:string;cart?:string;seller?:string;qty?:string;unit?:string;pin?:string}>}){const q=await searchParams;const p=typeof q.category==="string"&&typeof q.product==="string"?getProduct(q.category,q.product):undefined;return <main className="catalog-page"><SiteHeader/><section className="section ops-content" style={{maxWidth:760,margin:"0 auto",padding:"24px 16px"}}><h1>Place a material order</h1>{q.cart==="1"?<DirectCartPanel/>:p&&(p.quoteOnly||p.category==="aggregates")?<p>This material needs a private quotation. <Link href={"/quotes?"+new URLSearchParams({category:p.category,material:p.name})}>Prepare a quote →</Link></p>:p?<DirectCheckout category={p.category} slug={p.slug} name={p.name} preferredSeller={typeof q.seller==="string"?q.seller:undefined} initialQuantity={typeof q.qty==="string"?q.qty:undefined} initialUnit={typeof q.unit==="string"?q.unit:undefined} initialPin={typeof q.pin==="string"?q.pin:undefined}/>:<p>Choose a material first. <Link href="/materials">Browse catalog →</Link></p>}</section><SiteFooter/></main>;}
