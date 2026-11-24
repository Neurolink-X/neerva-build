"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {PLANNING_STORAGE_KEY,appendPlanningLine,isPlanningUnit,safePlanningList} from "@/modules/catalog/planning-list";
import {catalogPhotos} from "@/modules/catalog/catalog-photos";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import {categoryUnits,quantityUnitLabels} from "@/modules/catalog/category-units";

export function ProductGallery({product}:{product:DemoProduct}){
 const [selected,setSelected]=useState<string|null>(null);
 const [failed,setFailed]=useState<string[]>([]);
 const photos=catalogPhotos(product).filter(media=>!failed.includes(media.src));
 const current=photos.find(media=>media.src===selected)??photos[0];
 const [zoom,setZoom]=useState(false);
 const start=useRef<{x:number;y:number}|null>(null);
 const index=photos.findIndex(p=>p.src===current?.src);
 function move(delta:number){if(photos.length<2)return;setSelected(photos[(index+delta+photos.length)%photos.length].src);setZoom(false);}
 return <figure className="product-gallery" aria-label={"Photos of "+product.name}>
  <div className="product-gallery-stage" style={{overflow:"hidden",touchAction:"pan-y"}} onTouchStart={e=>{start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{const s=start.current;start.current=null;if(!s||zoom)return;const t=e.changedTouches[0];const dx=t.clientX-s.x,dy=t.clientY-s.y;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);}}>
   {current?<Image key={current.src} src={current.src} alt={current.alt} fill sizes="(max-width:850px) 94vw, 48vw"
     quality={82} unoptimized={current.src.startsWith("https://")} referrerPolicy="no-referrer" style={{objectFit:current.kind==="listing"||current.kind==="manufacturer"?"contain":undefined,transform:zoom?"scale(1.65)":"none"}} className="catalog-real-image" onError={()=>setFailed(old=>old.includes(current.src)?old:[...old,current.src])}/>:
    <div className="catalog-image-awaiting" role="img" aria-label="Material photograph unavailable"><strong>Awaiting accurate product photos</strong><small>We will not substitute another brand&apos;s packaging.</small></div>}
  </div>
  {current&&<div role="group" aria-label="Gallery controls" style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:8,margin:"10px 0"}}>{photos.length>1&&<button className="button button-outline" type="button" aria-label="Previous photo" onClick={()=>move(-1)}>←</button>}<span aria-live="polite">{index+1} / {photos.length}</span>{photos.length>1&&<button className="button button-outline" type="button" aria-label="Next photo" onClick={()=>move(1)}>→</button>}<button className="button button-outline" type="button" aria-pressed={zoom} onClick={()=>setZoom(z=>!z)}>{zoom?"Reset zoom":"Zoom photo"}</button></div>}
  <figcaption className="product-gallery-caption"><strong>{current?.label??"Photograph not verified"}</strong>
    <span>{current?.kind==="sku"?"Uploaded and reviewed seller image.":"Photo is a reference, not proof of the quoted manufacturer SKU, size or availability."}</span></figcaption>
  {photos.length>1&&<div className="product-gallery-thumbs" role="group" aria-label="Choose material photographs">
   {photos.slice(0,5).map((media,i)=><button type="button" key={media.src} aria-label={"Show photo "+(i+1)+": "+media.label}
     aria-pressed={current?.src===media.src} onClick={()=>{setSelected(media.src);setZoom(false);}}>
     <span className="product-gallery-thumb-image"><Image src={media.src} alt="" fill sizes="90px" quality={60} unoptimized={media.src.startsWith("https://")} referrerPolicy="no-referrer" onError={()=>setFailed(old=>old.includes(media.src)?old:[...old,media.src])}/></span>
     <span>{media.kind==="sku"?"Seller photo":media.kind==="listing"?"Product photo":media.kind==="editorial"?"Material photo":media.kind==="manufacturer"?media.label:"Category view"}</span>
    </button>)}
  </div>}
 </figure>;
}
export function ProductDetailTools({ product }: { product: DemoProduct }) {
  const units=categoryUnits(product.category);
  const [unit,setUnit]=useState<string>(units[0]??"piece");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState("");
  function saveMaterial() {
    try {
      if(!Number.isFinite(quantity)||quantity<=0||quantity>1000000){setNotice("Enter a quantity above zero and up to 1,000,000.");return;}
      const previous = safePlanningList(JSON.parse(window.localStorage.getItem(PLANNING_STORAGE_KEY) ?? "[]"));
      const next = appendPlanningLine(previous, { id: crypto.randomUUID(), name: `${product.name} · ${product.brand}`.slice(0,160), unit: isPlanningUnit(unit) ? unit : "piece", quantity });
      if (next.length === previous.length) { setNotice("List is full. Review the 25 existing items before adding another."); return; }
      window.localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(next));
      setAdded(true); setNotice("Saved locally. Open your material list to review or prepare a quote.");
    } catch { setNotice("Browser storage is unavailable. Please enter this item manually on the material list page."); }
  }
  return (
    <div className="product-request-config">
      <div className="product-choice-grid">
        <label>Quantity unit
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            {units.map((choice) => <option key={choice} value={choice}>{quantityUnitLabels[choice]}</option>)}
          </select>
        </label>
        <label>Quantity
          <input type="number" min="0.001" max="1000000" step="0.001" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </label>
      </div>
      <p className="option-confirmation-note">Options describe your requirement; the dealer will confirm whether this brand supplies that exact variant, its current stock and the final rate.</p>
      <button type="button" className="button button-orange product-add-button" onClick={saveMaterial}>{added ? "Add another to material list" : "Add to material list"}</button>{added && <Link href="/basket" className="button button-outline" style={{marginLeft:10}}>Review material list →</Link>}{notice && <p role="status" className="option-confirmation-note">{notice}</p>}
    </div>
  );
}

