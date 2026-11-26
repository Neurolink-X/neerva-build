"use client";
import {addShopItem,ShopCartLink} from "@/components/shop-cart";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {PLANNING_STORAGE_KEY,appendPlanningLine,isPlanningUnit,safePlanningList} from "@/modules/catalog/planning-list";
import {catalogVisuals} from "@/modules/catalog/catalog-visuals";
import {MaterialIdentity} from "./material-identity";
import {manufacturerPhotoSource} from "@/modules/catalog/manufacturer-photo-sources";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import {categoryUnits,quantityUnitLabels} from "@/modules/catalog/category-units";

export function ProductGallery({product}:{product:DemoProduct}){
 const [selected,setSelected]=useState<string|null>(null);
 const [failed,setFailed]=useState<string[]>([]);
 const photos=catalogVisuals(product).filter(media=>!failed.includes(media.src));
 const current=photos.find(media=>media.src===selected)??photos[0];
 const officialSource=manufacturerPhotoSource(product.category,product.slug);
 const [zoom,setZoom]=useState(false);
 const [viewerOpen,setViewerOpen]=useState(false);
 const viewer=useRef<HTMLDialogElement>(null);
 function openViewer(){const dialog=viewer.current;if(!dialog||dialog.open)return;dialog.showModal();setViewerOpen(true);}
 function closeViewer(){viewer.current?.close();}
 const start=useRef<{x:number;y:number}|null>(null);
 const index=photos.findIndex(p=>p.src===current?.src);
 function move(delta:number){if(photos.length<2)return;setSelected(photos[(index+delta+photos.length)%photos.length].src);setZoom(false);}
 return <figure className="product-gallery" aria-label={"Photos of "+product.name}>
  <div className={"product-gallery-stage"+(!current?" awaiting-photo":"")} style={{overflow:"hidden",touchAction:"pan-y"}} onTouchStart={e=>{start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{const s=start.current;start.current=null;if(!s||zoom)return;const t=e.changedTouches[0];const dx=t.clientX-s.x,dy=t.clientY-s.y;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);}}>
   {current?<Image key={current.src} src={current.src} alt={current.alt} fill sizes="(max-width:850px) 94vw, 48vw"
     quality={75} unoptimized={current.kind==="generated"} referrerPolicy="no-referrer" style={{objectFit:"contain",transform:zoom?"scale(1.65)":"none"}} className="catalog-real-image" onError={()=>setFailed(old=>old.includes(current.src)?old:[...old,current.src])}/>:
    <MaterialIdentity name={product.name} brand={product.brand} category={product.category} product={product}/>}
  </div>
  {current&&<div className="product-gallery-controls" role="group" aria-label="Gallery controls">{photos.length>1&&<button className="button button-outline" type="button" aria-label="Previous photo" onClick={()=>move(-1)}>←</button>}<span aria-live="polite">{index+1} / {photos.length}</span>{photos.length>1&&<button className="button button-outline" type="button" aria-label="Next photo" onClick={()=>move(1)}>→</button>}<button className="button button-outline" type="button" aria-pressed={zoom} onClick={()=>setZoom(z=>!z)}>{zoom?"Reset zoom":"Zoom photo"}</button><button type="button" className="button button-outline" onClick={openViewer}>View large photo</button></div>}
  <figcaption className="product-gallery-caption"><strong>{current?.label??"Product specifications"}</strong>
    <span>{!current?"Confirm exact model, dimensions and finish with your supplier.":current.kind==="sku"?"Uploaded and reviewed seller image.":current.kind==="generated"?"AI-generated illustration, not an actual manufacturer or seller photograph. Confirm exact model, finish and dimensions before ordering.":"Photo is a reference, not proof of the quoted manufacturer SKU, size or availability."}</span>{!current&&officialSource&&<a className="product-manufacturer-source" href={officialSource} target="_blank" rel="noopener noreferrer">View manufacturer product photo and specifications ↗</a>}{current?.sourceUrl&&<small>Photo: <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer">{current.credit}</a> · <a href={current.licenseUrl} target="_blank" rel="noopener noreferrer">{current.license}</a> · resized and encoded as WebP.</small>}</figcaption>
  {photos.length>1&&<div className="product-gallery-thumbs" role="group" aria-label="Choose material photographs">
   {photos.map((media,i)=><button type="button" key={media.src} aria-label={"Show photo "+(i+1)+": "+media.label}
     aria-pressed={current?.src===media.src} onClick={()=>{setSelected(media.src);setZoom(false);}}>
     <span className="product-gallery-thumb-image"><Image src={media.src} alt="" fill sizes="90px" quality={75} unoptimized={media.kind==="generated"} referrerPolicy="no-referrer" onError={()=>setFailed(old=>old.includes(media.src)?old:[...old,media.src])}/></span>
     <span>{media.kind==="generated"?"AI reference":media.kind==="sku"?"Seller photo":media.kind==="listing"?"Product photo":media.kind==="editorial"?"Material photo":media.kind==="manufacturer"?media.label:"Category view"}</span>
    </button>)}
  </div>}
  <dialog ref={viewer} className="product-photo-dialog" aria-label={"Large photo of "+product.name} onClose={()=>setViewerOpen(false)}
   onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1);}}}>
   <div className="product-photo-dialog-head"><strong>{product.name}</strong><button type="button" className="button button-outline" onClick={closeViewer} aria-label="Close large photo">Close</button></div>
   {viewerOpen&&current&&<><div className="product-photo-dialog-stage"><Image src={current.src} alt={current.alt} fill sizes="(max-width:680px) 90vw, (max-width:1200px) 85vw, 1000px" quality={75} unoptimized={current.kind==="generated"} onError={()=>setFailed(old=>old.includes(current.src)?old:[...old,current.src])}/></div>
    <div className="product-photo-dialog-foot"><p>{current.label}</p><div role="group" aria-label="Large photo controls">{photos.length>1&&<><button type="button" className="button button-outline" onClick={()=>move(-1)} aria-label="Previous large photo">←</button><span aria-live="polite">{index+1} / {photos.length}</span><button type="button" className="button button-outline" onClick={()=>move(1)} aria-label="Next large photo">→</button></>}</div></div></>}
   {viewerOpen&&!current&&<p role="status">Photo could not be loaded. Product specifications remain available.</p>}
  </dialog>
 </figure>;
}
export function ProductDetailTools({ product,quoteHref }: { product: DemoProduct;quoteHref?:string }) {
  const units=categoryUnits(product.category);
  const [unit,setUnit]=useState<string>(units[0]??"piece");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState("");
  const [planningOpen,setPlanningOpen]=useState(false);
  const validQuantity=Number.isFinite(quantity)&&quantity>=.001&&quantity<=1000000&&Math.abs(quantity*1000-Math.round(quantity*1000))<.00001;
  function addToOrderCart(){try{if(!validQuantity){setNotice('Enter a valid quantity.');return;}if(!addShopItem({category:product.category,productSlug:product.slug,productName:product.name,unit,quantity})){setNotice('Cart limit reached or storage unavailable.');return;}setNotice('Added to cart.');}catch{setNotice('Cart storage unavailable; use direct order instead.');}}
  function saveMaterial() {
    try {
      if(!validQuantity){setNotice("Enter a quantity from 0.001 to 1,000,000, with at most three decimal places.");return;}
      const previous = safePlanningList(JSON.parse(window.localStorage.getItem(PLANNING_STORAGE_KEY) ?? "[]"));
      const next = appendPlanningLine(previous, { id: crypto.randomUUID(), name: `${product.name} · ${product.brand}`.slice(0,160), unit: isPlanningUnit(unit) ? unit : "piece", quantity });
      if (next.length === previous.length) { setNotice("List is full. Review the 25 existing items before adding another."); return; }
      window.localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(next));
      setAdded(true); setNotice("Saved locally. Open your material list to review or prepare a quote.");
    } catch { setNotice("Browser storage is unavailable. Please enter this item manually on the material list page."); }
  }
  return (
    <div className="product-request-config">
      <h2>Choose quantity / मात्रा चुनें</h2><p className="option-confirmation-note">Choose quantity and unit, then request your order. No payment now; approve the final delivered price first.</p><div className="product-choice-grid">
        <label>Quantity unit
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            {units.map((choice) => <option key={choice} value={choice}>{quantityUnitLabels[choice]}</option>)}
          </select>
        </label>
        <label>Quantity
          <input type="number" min="0.001" max="1000000" step="0.001" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </label>
      </div>
      <p className="option-confirmation-note">Neerva confirms your exact size, stock and delivery price before fulfilment.</p>
      <div className="order-actions">{validQuantity?<Link className="button button-dark" prefetch={false} href={"/checkout?"+new URLSearchParams({category:product.category,product:product.slug,qty:String(quantity),unit})}>Request order →</Link>:<button type="button" className="button button-dark" disabled>Enter a valid quantity to order</button>} <button type="button" className="button button-outline" onClick={addToOrderCart} disabled={!validQuantity}>Add to cart</button></div><div className="order-secondary"><Link href="/checkout?cart=1" prefetch={false} className="order-cart-link">View cart →</Link>{quoteHref&&<Link href={quoteHref} className="order-quote-link">Request quote →</Link>}</div><details open={planningOpen} onToggle={e=>setPlanningOpen(e.currentTarget.open)}><summary>Planning a project? Save to material list</summary><p>For estimates and dealer quotes, not an order cart.</p><button type="button" className="button button-orange product-add-button" onClick={saveMaterial} disabled={!validQuantity}>{added ? "Add another to material list" : "Add to material list"}</button>{added && <Link href="/basket?view=planner" className="button button-outline" style={{marginLeft:10}}>Review material list →</Link>}</details>{notice && <p role="status" className="option-confirmation-note">{notice}</p>}<ShopCartLink floating/>
    </div>
  );
}

