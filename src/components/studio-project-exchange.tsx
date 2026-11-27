"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {conceptTakeoff,createProjectExchange,reviewedQuoteHref,projectErrors,type ProjectSource} from "@/modules/studio/project-exchange";
import {categoryUnits,categoryMaterialHints,defaultCategoryUnit,quantityPrecision,quantityUnitLabels,type MaterialCategory,type MaterialQuantityUnit} from "@/modules/catalog/category-units";
const categories=Object.keys(categoryMaterialHints) as MaterialCategory[];
export function StudioProjectExchange({source}:{source:ProjectSource}){
 const rows=useMemo(()=>conceptTakeoff(source),[source]),errors=useMemo(()=>projectErrors(source),[source]);
 const [category,setCategory]=useState<MaterialCategory>("paint"),[unit,setUnit]=useState<MaterialQuantityUnit>("litre"),[amount,setAmount]=useState(""),[material,setMaterial]=useState(""),[reviewed,setReviewed]=useState(false),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const href=reviewed?reviewedQuoteHref(category,unit,Number(amount),material):null;
 function changeCategory(c:MaterialCategory){setCategory(c);setUnit(defaultCategoryUnit(c));setReviewed(false);setAmount("");setMaterial("");}
 async function exportModel(){setBusy(true);setNotice("");try{const model=await createProjectExchange(source);const url=URL.createObjectURL(new Blob([JSON.stringify(model,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="neerva-spatial-concept-v1.json";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice("Concept data exported. Not a certified IFC file.");}catch{setNotice("Model export failed. Review the selected concept and retry.");}finally{setBusy(false)}}
 return <section className="purpose-engineering studio-project-exchange" aria-label="Project exchange and material planning" data-plan-id={source.plan.id}>
 <h2>Plan your materials</h2><p>Review estimated quantities before requesting a quote.</p>
 {errors.length?<p role="alert">Model validation failed; export and quote handoff disabled.</p>:<>
 <details><summary>Estimated quantities and model data</summary><div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"left"}}><thead><tr><th>Quantity basis</th><th>Measured value</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.label}<small style={{display:"block"}}>{r.basis}</small></td><td>{r.quantity.toLocaleString("en-IN",{maximumFractionDigits:2})} {quantityUnitLabels[r.unit]}{r.category==="paint"&&<button type="button" onClick={()=>{setCategory("paint");setUnit("litre");setAmount(String(r.quantity));setMaterial("Interior wall paint – verify product and coverage");setReviewed(false)}}>Use as draft</button>}</td></tr>)}</tbody></table></div>
 <p>Concrete, steel, masonry, electrical, plumbing and HVAC quantities require an engineered model and approved specifications; no automatic quantities are invented.</p>
 <button type="button" className="button button-outline" disabled={busy} onClick={()=>void exportModel()}>{busy?"Preparing…":"Export versioned spatial model (JSON)"}</button>{notice&&<p role="status">{notice}</p>}
 </details>
 <details><summary>Prepare a material quote</summary><p>Enter the material specification and quantity you need.</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,180px),1fr))",gap:12,marginBlock:12}}>
 <label>Category <select value={category} onChange={e=>changeCategory(e.target.value as MaterialCategory)}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
 <label>Unit <select value={unit} onChange={e=>{setUnit(e.target.value as MaterialQuantityUnit);setReviewed(false);setAmount("")}}>{categoryUnits(category).map(u=><option key={u} value={u}>{quantityUnitLabels[u]}</option>)}</select></label>
 <label>Quantity <input type="number" min={quantityPrecision(unit)} max={1000000} step={quantityPrecision(unit)} value={amount} onChange={e=>{setAmount(e.target.value);setReviewed(false)}}/></label>
 <label>Material specification <input maxLength={240} value={material} placeholder={categoryMaterialHints[category]} onChange={e=>{setMaterial(e.target.value);setReviewed(false)}}/></label></div>
 <label><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> I reviewed the quantity, unit and specification. No stock, price or order is confirmed.</label>
 <p>{href?<Link className="button button-dark" href={href}>Open material quote draft →</Link>:<span>Review the quantity to continue.</span>} · <Link href="/materials">Browse material catalogue</Link></p>
 </details></>}
 </section>
}
