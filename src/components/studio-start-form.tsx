"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {depthFromGaj,gajFromFeet} from "@/modules/studio/plot-area";
import {parseSiteShape,shapeErrors,siteAreaSqFt} from "@/modules/studio/site-shape";
export function StudioStartForm(){
 const router=useRouter();
 const [width,setWidth]=useState("18"),[depth,setDepth]=useState("50"),[gaj,setGaj]=useState("");
 const [road,setRoad]=useState("N"),[bedrooms,setBedrooms]=useState("3"),[floors,setFloors]=useState("2");
 const [shape,setShape]=useState("rectangle"),[notchWidth,setNotchWidth]=useState("2"),[notchDepth,setNotchDepth]=useState("10");
 const [parking,setParking]=useState("true"),[error,setError]=useState("");
 const siteShape=parseSiteShape(shape,notchWidth,notchDepth);
 function applyGaj(value:string){
  if(shape!=="rectangle"){setError("Area alone cannot calculate an L-shaped boundary. Enter the measured outer dimensions and missing corner.");return;}
  const computed=depthFromGaj(Number(value),Number(width));
  if(computed===null){setError("Enter an area in square gaj and a frontage that produces 15–250 ft depth.");return;}
  setGaj(value);setDepth(String(computed));setError("");
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
  <div className="nstudio-start-grid">
   <label>Plot width (feet)<input inputMode="decimal" type="number" min="10" max="200" step="any" required value={width} onChange={e=>{setWidth(e.target.value);setError("")}}/></label>
   <label>Plot depth (feet)<input inputMode="decimal" type="number" min="15" max="250" step="any" required value={depth} onChange={e=>{setDepth(e.target.value);setError("")}}/></label>
   <label>Plot shape<select value={shape} onChange={e=>{setShape(e.target.value);setError("");}}><option value="rectangle">Rectangle / square</option><option value="rear-left-notch">L-shaped · rear-left missing corner</option><option value="rear-right-notch">L-shaped · rear-right missing corner</option></select></label>
   {shape!=="rectangle"&&<><label>Missing corner width (ft)<input type="number" min="1" step="any" required value={notchWidth} onChange={e=>setNotchWidth(e.target.value)}/></label><label>Missing corner depth (ft)<input type="number" min="1" step="any" required value={notchDepth} onChange={e=>setNotchDepth(e.target.value)}/></label></>}
   <label>Plot area (gaj / sq yd, optional)<input type="number" inputMode="decimal" min="1" step="any" value={gaj} onChange={e=>{setGaj(e.target.value);setError("")}} placeholder="e.g. 120, 130, 140, 150"/></label>
   <button type="button" className="nstudio-area-apply" disabled={shape!=="rectangle"} onClick={()=>applyGaj(gaj)}>Calculate depth from gaj</button>
   <label>Road on which side?<select value={road} onChange={e=>setRoad(e.target.value)}><option value="N">North</option><option value="E">East</option><option value="S">South</option><option value="W">West</option></select></label>
   <label>Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(e.target.value)}>{[1,2,3,4,5,6].map(x=><option key={x} value={x}>{x} BHK</option>)}</select></label>
   <label>Floors<select value={floors} onChange={e=>setFloors(e.target.value)}><option value="1">Ground</option><option value="2">Ground + first</option><option value="3">Ground + two floors</option></select></label>
   <label>Car parking<select value={parking} onChange={e=>setParking(e.target.value)}><option value="true">Needed</option><option value="false">No car parking</option></select></label>
  </div>
  <p className="nstudio-area-note">Current dimensions: {siteShape&&shapeErrors(Number(width),Number(depth),siteShape).length===0&&gajFromFeet(Number(width),Number(depth))!==null?Math.round(siteAreaSqFt(Number(width),Number(depth),siteShape)/9*100)/100:"—"} gaj (sq yd). Area alone cannot determine the width and depth; enter your actual road-facing frontage. 1 gaj = 9 sq ft.</p>
  {error&&<p role="alert" className="nstudio-error">{error}</p>}
  <button type="submit">Create room layouts for my plot →</button>
  <small>Draft concepts, not construction drawings. The system shows only layouts that pass its current geometry and circulation checks. Small or unusual plots may have no valid layouts.</small>
 </form>;
}


