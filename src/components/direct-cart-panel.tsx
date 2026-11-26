"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {cartKey,type CartItem} from "@/modules/orders/direct-cart";
import {useShopCart,writeShopCart,setShopQuantity,QuantityStepper} from "./shop-cart";
import {DirectCheckout} from "./direct-checkout";
import {quantityUnitLabels,type MaterialQuantityUnit} from "@/modules/catalog/category-units";
const subscribe=()=>()=>{};
export function DirectCartPanel(){
 const rows=useShopCart(),ready=useSyncExternalStore(subscribe,()=>true,()=>false);
 const [checkout,setCheckout]=useState<CartItem[]|null>(null),[notice,setNotice]=useState(""),[received,setReceived]=useState(false),[unload,setUnload]=useState(false);
 useEffect(()=>{const t=setTimeout(()=>{try{setUnload(sessionStorage.getItem("neerva-unloading")==="yes")}catch{}},0);return()=>clearTimeout(t)},[]);
 if(!ready)return <p role="status">Loading cart…</p>;
 if(checkout)return <>{!received&&<button type="button" className="button button-outline" onClick={()=>setCheckout(null)}>← Edit cart</button>}<DirectCheckout category={checkout[0].category} slug={checkout[0].productSlug} name={checkout[0].productName} cart={checkout} initialUnloading={unload} onReceived={()=>setReceived(true)}/></>;
 if(!rows.length)return <section className="nb-shop-cart-card"><h2>Your cart is empty</h2><p>Choose construction materials to get started.</p><Link className="button button-dark" href="/materials">Shop materials →</Link><Link href="/basket?view=planner">Open project material planner</Link></section>;
 function update(key:string,n:number){setNotice(setShopQuantity(key,n)?"":"Cart update failed. Check browser storage.")}
 return <section className="nb-shop-cart"><div className="nb-shop-cart-card"><div className="nb-shop-cart-head"><h2>My cart ({rows.length})</h2><button type="button" className="nb-shop-quiet" onClick={()=>{if(window.confirm("Remove all materials from your shopping cart?"))setNotice(writeShopCart([])?"":"Unable to clear cart.")}}>Clear cart</button></div>
 {notice&&<p role="alert">{notice}</p>}
 {rows.map(r=><article className="nb-shop-cart-line" key={cartKey(r)}><div><Link href={"/materials/"+r.category+"/"+r.productSlug}><strong>{r.productName}</strong></Link><small>{quantityUnitLabels[r.unit as MaterialQuantityUnit]??r.unit} · Price to be confirmed</small></div><QuantityStepper item={r} onChange={n=>update(cartKey(r),n)}/><button type="button" className="nb-shop-quiet" onClick={()=>update(cartKey(r),0)} aria-label={"Remove "+r.productName}>Remove</button></article>)}
 <Link href="/materials" className="nb-shop-quiet">+ Add more materials</Link></div>
 <section className="nb-shop-cart-card"><h2>Delivery services</h2><label className="nb-shop-unloading"><input type="checkbox" checked={unload} onChange={e=>{setUnload(e.target.checked);try{sessionStorage.setItem("neerva-unloading",e.target.checked?"yes":"no")}catch{}}}/><span><strong>Request unloading assistance</strong><small>Ground-floor unloading; availability and charge confirmed before approval.</small></span></label></section>
 <section className="nb-shop-cart-card"><h2>Bill details</h2><dl className="nb-shop-bill">{["Materials","GST","Delivery","Handling",...(unload?["Unloading"]:[])].map(label=><div key={label}><dt>{label}</dt><dd>To be confirmed</dd></div>)}<div className="nb-shop-total"><dt>Final total</dt><dd>Awaiting price</dd></div></dl><p>No payment now. Review and approve the itemised delivered price before supply.</p></section>
 <div className="nb-shop-checkout-bar"><div><strong>{rows.length} {rows.length===1?"material":"materials"}</strong><small>Final price requires approval</small></div><button type="button" className="button button-dark" onClick={()=>setCheckout(rows)}>Continue →</button></div>
 </section>
}
