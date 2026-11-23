"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {PLANNING_STORAGE_KEY,appendPlanningLine,isPlanningUnit,safePlanningList} from "@/modules/catalog/planning-list";
import { CatalogMaterialImage, isApprovedSkuPhoto } from "@/components/catalog-material-image";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import {categoryUnits,quantityUnitLabels} from "@/modules/catalog/category-units";

export function ProductGallery({product}:{product:DemoProduct}){
 const [selected,setSelected]=useState(0);
 const photos=product.imageVerified&&product.verification==="merchant_verified"?(product.images??[]).filter(isApprovedSkuPhoto):[];
 const shown=photos[selected];
 return <figure className="product-gallery">
  <div className="product-gallery-stage">
   {shown?<Image src={shown} alt={product.name} fill sizes="(max-width:850px) 94vw, 48vw" className="catalog-real-image"/>:
    <CatalogMaterialImage product={product} category={product.category} name={product.name}/>}
  </div>
  {photos.length>1&&<div className="product-gallery-thumbs">{photos.map((src,i)=><button type="button" key={src} aria-pressed={selected===i} onClick={()=>setSelected(i)}>Photo {i+1}</button>)}</div>}
  {product.referenceSource&&<figcaption><a href={product.referenceSource} target="_blank" rel="noreferrer">View reference listing ↗</a></figcaption>}
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
