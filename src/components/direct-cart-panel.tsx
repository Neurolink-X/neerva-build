"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {cartKey,type CartItem} from "@/modules/orders/direct-cart";
import {useShopCart,writeShopCart,setShopQuantity,QuantityStepper} from "./shop-cart";
import {ProductPrice} from "./product-price";
import {CartPricePreview} from "./cart-price-preview";
import {DirectCheckout} from "./direct-checkout";
import {quantityUnitLabels,type MaterialQuantityUnit} from "@/modules/catalog/category-units";
const subscribe=()=>()=>{};
export function DirectCartPanel(){
 const rows=useShopCart(),ready=useSyncExternalStore(subscribe,()=>true,()=>false);
 const [checkout,setCheckout]=useState<CartItem[]|null>(null),[notice,setNotice]=useState(""),[received,setReceived]=useState(false),[unload,setUnload]=useState(false),[pin,setPin]=useState(""),[city,setCity]=useState("");
 useEffect(()=>{const t=setTimeout(()=>{try{setUnload(sessionStorage.getItem("neerva-unloading")==="yes");setPin(sessionStorage.getItem("neerva-cart-pin")??"");setCity(sessionStorage.getItem("neerva-cart-city")??"")}catch{}},0);return()=>clearTimeout(t)},[]);
 if(!ready)return <p role="status">Loading cart…</p>;
 if(checkout)return <section className="nb-shop-cart"><p className="option-confirmation-note">Step 2 of 3 · Delivery details → Review final price</p>{!received&&<button type="button" className="button button-outline" onClick={()=>setCheckout(null)}>← Edit cart</button>}<DirectCheckout category={checkout[0].category} slug={checkout[0].productSlug} name={checkout[0].productName} cart={checkout} initialUnloading={unload} initialPin={pin} initialCity={city} onReceived={()=>setReceived(true)}/></section>;
 if(!rows.length)return <section className="nb-shop-cart-card"><h2>Your cart is empty</h2><p>Choose construction materials to get started.</p><Link className="button button-dark" href="/materials">Shop materials →</Link><Link href="/basket?view=planner">Open project material planner</Link></section>;
 function update(key:string,n:number){setNotice(setShopQuantity(key,n)?"":"Cart update failed. Check browser storage.")}
 return <section className="nb-shop-cart"><div className="nb-shop-cart-card"><div className="nb-shop-cart-head"><h2>My cart ({rows.length})</h2><button type="button" className="nb-shop-quiet" onClick={()=>{if(window.confirm("Remove all materials from your shopping cart?"))setNotice(writeShopCart([])?"":"Unable to clear cart.")}}>Clear cart</button></div>
 {notice&&<p role="alert">{notice}</p>}
 {rows.map(r=><article className="nb-shop-cart-line" key={cartKey(r)}><div><Link href={"/materials/"+r.category+"/"+r.productSlug}><strong>{r.productName}</strong></Link><small>{quantityUnitLabels[r.unit as MaterialQuantityUnit]??r.unit}</small><div><ProductPrice category={r.category} slug={r.productSlug} quoteOnly={r.category==="aggregates"}/></div></div><QuantityStepper item={r} onChange={n=>update(cartKey(r),n)}/><button type="button" className="nb-shop-quiet" onClick={()=>update(cartKey(r),0)} aria-label={"Remove "+r.productName}>Remove</button></article>)}
 <Link href="/materials" className="nb-shop-quiet">+ Add more materials</Link></div>
 <section className="nb-shop-cart-card"><h2>Delivery services</h2><label className="nb-shop-unloading"><input type="checkbox" checked={unload} onChange={e=>{setUnload(e.target.checked);try{sessionStorage.setItem("neerva-unloading",e.target.checked?"yes":"no")}catch{}}}/><span><strong>Request unloading assistance</strong><small>Ground-floor unloading; availability and charge confirmed before approval.</small></span></label></section>
 <CartPricePreview rows={rows} unload={unload} pin={pin} city={city} onLocation={(p,c)=>{setPin(p);setCity(c);try{sessionStorage.setItem("neerva-cart-pin",p);sessionStorage.setItem("neerva-cart-city",c)}catch{}}}/>
 <div className="nb-shop-checkout-bar"><div><strong>{rows.length} {rows.length===1?"material":"materials"}</strong><small>Step 1 of 3 · No payment now</small></div><button type="button" className="button button-dark" onClick={()=>{setCheckout(rows);window.scrollTo({top:0,behavior:"auto"})}}>Continue to delivery →</button></div>
 </section>
}
