"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {PLANNING_STORAGE_KEY,appendPlanningLine,isPlanningUnit,safePlanningList} from "@/modules/catalog/planning-list";
import { ProductArtwork } from "@/components/product-artwork";
import { CatalogMaterialImage, isApprovedSkuPhoto } from "@/components/catalog-material-image";
import {brandMediaFor} from "@/modules/catalog/brand-media";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import {categoryUnits,quantityUnitLabels} from "@/modules/catalog/category-units";

const specsByCategory: Record<string, string[]> = {
  steel: ["8 mm", "10 mm", "12 mm", "16 mm", "20 mm", "25 mm", "Other diameter"],
  cement: ["PPC / 50 kg bag", "OPC 43 / 50 kg bag", "OPC 53 / 50 kg bag", "PSC / confirm pack", "Other cement type"],
  "bricks-blocks": ["Red clay brick", "Fly ash brick", "AAC block", "Concrete block", "Other format"],
  plumbing: ["CPVC / 20 mm", "CPVC / 25 mm", "uPVC / 110 mm", "PVC / 75 mm", "HDPE / confirm size", "Other size"],
  electrical: ["FRLS wire / 1.5 sq mm", "FRLS wire / 2.5 sq mm", "Conduit / 20 mm", "Conduit / 25 mm", "Other specification"],
  aggregates: ["River sand / balu", "M-sand", "Morang / coarse sand", "20 mm aggregate", "40 mm aggregate", "Other material"],
  paint: ["Interior emulsion", "Exterior emulsion", "Primer", "Putty", "Waterproofing", "Other finish"],
  tiles: ["600 × 600 mm", "300 × 600 mm", "600 × 1200 mm", "Ceramic", "Vitrified", "Other tile size"],
  hardware: ["Tile adhesive", "Door hardware", "Fasteners", "Fittings", "Sealant", "Other hardware"]
};

/** Never repeat the same generic pipe/pack image as four claimed camera angles. */
export function ProductGallery({ product }: { product: DemoProduct }) {
  const [active,setActive]=useState(0);
  const actual=(product.verification==="merchant_verified"&&product.imageVerified===true)
    ? [...new Set((product.images??[]).filter(isApprovedSkuPhoto))] : [];
  const hasDiagram=["steel","cement","bricks-blocks","plumbing","electrical","aggregates"].includes(product.category);
  const brand=brandMediaFor(product.brand);
  const pressPhoto=product.category==="cement"&&brand&&"pressPhoto" in brand?brand.pressPhoto:null;
  const pressPhotoSource=product.category==="cement"&&brand&&"pressPhotoSource" in brand?brand.pressPhotoSource:null;
  type View={kind:"verified"|"press";source:string;label:string}|{kind:"sample"|"diagram";label:string};
  const views:View[]=actual.length
    ? actual.map((source,index)=>({kind:"verified" as const,source,label:index===0?"Approved product photo":`Approved view ${index+1}`}))
    : [...(pressPhoto?[{kind:"press" as const,source:pressPhoto,label:"Official manufacturer pack image"}]:[]),
       {kind:"sample" as const,label:"Generic material reference"},
       ...(hasDiagram?[{kind:"diagram" as const,label:"Technical illustration"}]:[])];
  const selected=Math.min(active,views.length-1);
  const view=views[selected];
  function display(item:View,thumb=false){
    if(item.kind==="verified"||item.kind==="press")return <Image className="catalog-real-image" src={item.source}
      alt={thumb?"":item.kind==="press"?`Manufacturer press-kit cement bag image for ${product.brand}, not confirmed as exact ${product.name} SKU`:`Reviewed photo of ${product.name}`} fill sizes={thumb?"130px":"(max-width:680px) 100vw, 50vw"} unoptimized/>;
    if(item.kind==="sample")return <CatalogMaterialImage category={product.category} name={product.name} compact={thumb}/>;
    return <ProductArtwork category={product.category} scene="detail"/>;
  }
  return <div className="product-gallery">
    <div className="product-gallery-stage">{display(view)}
      <span className="gallery-disclaimer">{view.kind==="verified"?"Approved local SKU photograph · confirm batch with dealer":view.kind==="press"?"Official manufacturer media-kit bag reference · not the verified SKU or seller stock":"Illustrative material view, not an actual branded product photo"}</span>
    </div>
    {views.length>1&&<div className="product-gallery-thumbs" aria-label="Distinct product views">
      {views.map((item,index)=><button key={item.kind==="verified"?item.source:item.kind} type="button" className={selected===index?"active":""}
        aria-pressed={selected===index} aria-label={item.label} onClick={()=>setActive(index)}>
         {display(item,true)}<span>{item.label}</span>
        </button>)}
    </div>}
    {pressPhoto&&!actual.length&&pressPhotoSource&&<p className="option-confirmation-note"><a href={pressPhotoSource} target="_blank" rel="noreferrer noopener">Official manufacturer press-kit source ↗</a> · Visual brand reference only. Exact SKU and dealership status need independent verification.</p>}
    {!actual.length&&<p className="option-confirmation-note">Additional front, side and package photos will appear only after an authorized seller submits and verifies those exact product images.</p>}
   </div>;
}

export function ProductDetailTools({ product }: { product: DemoProduct }) {
  const choices = { specs: specsByCategory[product.category] ?? ["Specify item"], units: categoryUnits(product.category) };
  const initialSpec = product.specifications.find((item) => ["Diameter", "Type", "Format", "Nominal size", "Conductor size"].includes(item.label))?.value;
  const startingChoice = choices.specs.find((choice) => initialSpec && choice.toLowerCase().includes(initialSpec.toLowerCase())) ?? choices.specs[0];
  const [specification, setSpecification] = useState(startingChoice);
  const [unit, setUnit] = useState<string>(choices.units[0]??"piece");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState("");
  function saveMaterial() {
    try {
      const previous = safePlanningList(JSON.parse(window.localStorage.getItem(PLANNING_STORAGE_KEY) ?? "[]"));
      const next = appendPlanningLine(previous, { id: crypto.randomUUID(), name: `${product.name} · ${product.brand} · ${specification}`.slice(0,160), unit: isPlanningUnit(unit) ? unit : "piece", quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 });
      if (next.length === previous.length) { setNotice("List is full. Review the 25 existing items before adding another."); return; }
      window.localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(next));
      setAdded(true); setNotice("Saved locally. Open your material list to review or prepare a quote.");
    } catch { setNotice("Browser storage is unavailable. Please enter this item manually on the material list page."); }
  }
  return (
    <div className="product-request-config">
      <div className="product-choice-grid">
        <label>Specification to request
          <select value={specification} onChange={(event) => setSpecification(event.target.value)}>
            {choices.specs.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>
        </label>
        <label>Quantity unit
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            {choices.units.map((choice) => <option key={choice} value={choice}>{quantityUnitLabels[choice]}</option>)}
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
