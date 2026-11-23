"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {PLANNING_STORAGE_KEY,appendPlanningLine,isPlanningUnit,safePlanningList} from "@/modules/catalog/planning-list";
import { ProductArtwork } from "@/components/product-artwork";
import { CatalogMaterialImage } from "@/components/catalog-material-image";
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

export function ProductGallery({ product }: { product: DemoProduct }) {
  const [active, setActive] = useState(0);
  const scenes = ["catalog", "detail", "alternate", "use"] as const;
  const labels = ["Product profile", "Specification view", "Alternate view", "Material context"];
  return (
    <div className="product-gallery">
      <div className="product-gallery-stage">
        {product.images?.[active] ? <Image className="catalog-real-image" src={product.images[active]} alt={`${product.name} product image ${active + 1}`} fill sizes="(max-width: 680px) 100vw, 50vw" unoptimized /> : active === 0 ? <CatalogMaterialImage category={product.category} name={product.name} /> : <ProductArtwork category={product.category} scene={scenes[active]} />}
        <span className="gallery-disclaimer">Illustrative profile / actual product packaging may vary</span>
      </div>
      <div className="product-gallery-thumbs" aria-label="Product illustration views">
        {scenes.map((scene, index) => (
          <button type="button" className={active === index ? "active" : ""} aria-label={labels[index]} aria-pressed={active === index} key={scene} onClick={() => setActive(index)}>
            {product.images?.[index] ? <Image className="catalog-real-image" src={product.images[index]} alt="" fill sizes="120px" unoptimized /> : index === 0 ? <CatalogMaterialImage category={product.category} name={product.name} /> : <ProductArtwork category={product.category} scene={scene} />}<span>{labels[index]}</span>
          </button>
        ))}
      </div>
    </div>
  );
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
