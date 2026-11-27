"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {solvePlotDimension,measuredPlotSummary,type PlotAreaUnit} from "@/modules/studio/plot-area";
import {parseSiteShape,shapeErrors,siteAreaSqFt} from "@/modules/studio/site-shape";
export function StudioStartForm(){
 const router=useRouter();
 const [width,setWidth]=useState("18"),[depth,setDepth]=useState("50"),[gaj,setGaj]=useState("");
 const [areaUnit,setAreaUnit]=useState<PlotAreaUnit>("gaj"),[solve,setSolve]=useState<"width"|"depth">("depth");
 const [road,setRoad]=useState("N"),[bedrooms,setBedrooms]=useState("3"),[floors,setFloors]=useState("2");
 const [shape,setShape]=useState("rectangle"),[notchWidth,setNotchWidth]=useState("2"),[notchDepth,setNotchDepth]=useState("10");
 const [parking,setParking]=useState("true"),[error,setError]=useState("");
 const siteShape=parseSiteShape(shape,notchWidth,notchDepth);
 const validShape=siteShape&&shapeErrors(Number(width),Number(depth),siteShape).length===0;
 const summary=validShape&&siteShape?measuredPlotSummary(Number(width),Number(depth),Number(width)*Number(depth)-siteAreaSqFt(Number(width),Number(depth),siteShape)):null;
 const derived=shape==="rectangle"&&gaj.trim()?solvePlotDimension(Number(gaj),areaUnit,Number(solve==="depth"?width:depth),solve):null;
 const fmt=(n:number)=>n.toLocaleString("en-IN",{maximumFractionDigits:2});
 function applyGaj(value:string){
  if(shape!=="rectangle"){setError("Area alone cannot calculate an L-shaped boundary. Enter the measured outer dimensions and missing corner.");return;}
  const computed=solvePlotDimension(Number(value),areaUnit,Number(solve==="depth"?width:depth),solve);
  if(computed===null){setError("Enter a positive area and one measured side. The resulting width must be 10–200 ft and depth 15–250 ft.");return;}
  setGaj(value);if(solve==="depth")setDepth(String(computed));else setWidth(String(computed));setError("");
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const w=Number(width),d=Number(depth);
  if(!Number.isFinite(w)||!Number.isFinite(d)||w<10||w>200||d<15||d>250){
   setError("Enter a plot width of 10–200 ft and depth of 15–250 ft.");return;
  }
  if(!siteShape||shapeErrors(w,d,siteShape).length){setError("Check the missing-corner dimensions. Unsupported outlines require professional survey.");return;}
  setError("");
  const p=new URLSearchParams({width:String(w),depth:String(d),road,bedrooms,floors,parking,shape});
  if(siteShape.kind!=="rectangle"){p.set("notchWidth",String(siteShape.notchWidthFt));p.set("notchDepth",String(siteShape.notchDepthFt));}
  router.push("/design-studio/portfolio?"+p.toString());
 }
 return <form className="nstudio-start-form" onSubmit={submit} aria-label="Start a plot-specific architectural concept">
  <div className="nstudio-form-presets" role="group" aria-label="Example plot dimensions">{[[15,30,50],[18,50,100],[27,50,150],[30,60,200]].map(([w,d,g])=><button key={g} type="button" aria-pressed={shape==="rectangle"&&Number(width)===w&&Number(depth)===d} onClick={()=>{setShape("rectangle");setWidth(String(w));setDepth(String(d));setGaj("");setError("")}}>{g} gaj</button>)}</div>
  <p className="nstudio-area-note">Examples only. Choose a preset or enter your actual measurements. Presets do not change bedrooms, road or parking.</p>
  <fieldset className="nstudio-form-group"><legend>01 · Site measurements</legend><div className="nstudio-start-grid">
   <label>Plot width (feet)<input inputMode="decimal" type="number" min="10" max="200" step="any" required value={width} onChange={e=>{setWidth(e.target.value);setError("")}}/></label>
   <label>Plot depth (feet)<input inputMode="decimal" type="number" min="15" max="250" step="any" required value={depth} onChange={e=>{setDepth(e.target.value);setError("")}}/></label>
   <label>Plot shape<select value={shape} onChange={e=>{setShape(e.target.value);setError("");}}><option value="rectangle">Rectangle / square</option><option value="rear-left-notch">L-shaped · rear-left missing corner</option><option value="rear-right-notch">L-shaped · rear-right missing corner</option></select></label>
   {shape!=="rectangle"&&<><label>Missing corner width (ft)<input type="number" min="1" step="any" required value={notchWidth} onChange={e=>setNotchWidth(e.target.value)}/></label><label>Missing corner depth (ft)<input type="number" min="1" step="any" required value={notchDepth} onChange={e=>setNotchDepth(e.target.value)}/></label></>}
  </div></fieldset><div className="nstudio-plot-summary" aria-label="Measured plot summary">{summary?<><strong>{fmt(summary.gaj)} gaj</strong><span>{fmt(summary.sqft)} sq ft · {fmt(summary.sqm)} m²</span><small>Boundary perimeter: {fmt(summary.perimeterFt)} ft{summary.excluded>0?` · Missing corner: ${fmt(summary.excluded)} sq ft`:""}</small></>:<span>Enter valid measured sides to see the plot area.</span>}</div>
  <details className="nstudio-advanced"><summary>Smart plot calculator · find a missing side</summary><p className="nstudio-area-note">Know the area and one measured side? Calculate the other side of a rectangular plot. This does not estimate setbacks or built-up area.</p><div className="nstudio-start-grid"><label>Area unit<select value={areaUnit} onChange={e=>{setAreaUnit(e.target.value as PlotAreaUnit);setGaj("");setError("")}}><option value="gaj">Gaj / square yard</option><option value="sqft">Square feet</option><option value="sqm">Square metre</option></select></label><label>Plot area<input type="number" inputMode="decimal" min="0.01" step="any" value={gaj} onChange={e=>{setGaj(e.target.value);setError("")}} placeholder="Enter area"/></label><label>Calculate<select value={solve} onChange={e=>{setSolve(e.target.value as "width"|"depth");setError("")}}><option value="depth">Depth from measured width</option><option value="width">Width from measured depth</option></select></label>
   <button type="button" className="nstudio-area-apply" disabled={derived===null} onClick={()=>applyGaj(gaj)}>Apply {solve}</button></div><p className="nstudio-area-note" aria-live="polite">{shape!=="rectangle"?"Use the measured outer dimensions and missing corner for L-shaped plots.":derived!==null?`Calculated ${solve}: ${fmt(derived)} ft. Select Apply to use this measurement.`:gaj.trim()?"Area or known side is outside supported planning dimensions.":"Enter an area and measured side above."}</p></details>
  <fieldset className="nstudio-form-group"><legend>02 · Your home requirements</legend><div className="nstudio-start-grid">
   <label>Road on which side?<select value={road} onChange={e=>setRoad(e.target.value)}><option value="N">North</option><option value="E">East</option><option value="S">South</option><option value="W">West</option></select></label>
   <label>Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(e.target.value)}>{[1,2,3,4,5,6].map(x=><option key={x} value={x}>{x} BHK</option>)}</select></label>
   <label>Floors<select value={floors} onChange={e=>setFloors(e.target.value)}><option value="1">Ground</option><option value="2">Ground + first</option><option value="3">Ground + two floors</option></select></label>
   <label>Car parking<select value={parking} onChange={e=>setParking(e.target.value)}><option value="true">Needed</option><option value="false">No car parking</option></select></label>
  </div></fieldset>
  <p className="nstudio-area-note" aria-live="polite">Area alone cannot determine the width and depth. Confirm actual road-facing frontage before generating a plan. 1 gaj = 9 sq ft.</p>
  {error&&<p role="alert" className="nstudio-error">{error}</p>}
  <button type="submit">Create room layouts for my plot →</button>
  <small>Draft concepts, not construction drawings. The system shows only layouts that pass its current geometry and circulation checks. Small or unusual plots may have no valid layouts.</small>
 </form>;
}


