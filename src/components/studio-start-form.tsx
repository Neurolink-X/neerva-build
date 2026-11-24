"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {depthFromGaj,gajFromFeet} from "@/modules/studio/plot-area";
export function StudioStartForm(){
 const router=useRouter();
 const [width,setWidth]=useState("18"),[depth,setDepth]=useState("50"),[gaj,setGaj]=useState("");
 const [road,setRoad]=useState("N"),[bedrooms,setBedrooms]=useState("3"),[floors,setFloors]=useState("2");
 const [parking,setParking]=useState("true"),[error,setError]=useState("");
 function applyGaj(value:string){
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
  setError("");
  const p=new URLSearchParams({width:String(w),depth:String(d),road,bedrooms,floors,parking});
  router.push("/design-studio/portfolio?"+p.toString());
 }
 return <form className="nstudio-start-form" onSubmit={submit} aria-label="Start a plot-specific architectural concept">
  <div className="nstudio-start-grid">
   <label>Plot width (feet)<input inputMode="decimal" type="number" min="10" max="200" step="any" required value={width} onChange={e=>setWidth(e.target.value)}/></label>
   <label>Plot depth (feet)<input inputMode="decimal" type="number" min="15" max="250" step="any" required value={depth} onChange={e=>setDepth(e.target.value)}/></label>
   <label>Plot area (gaj / sq yd, optional)<input type="number" inputMode="decimal" min="1" step="any" value={gaj} onChange={e=>setGaj(e.target.value)} placeholder="e.g. 120, 130, 140, 150"/></label>
   <button type="button" className="nstudio-area-apply" onClick={()=>applyGaj(gaj)}>Calculate depth from gaj</button>
   <label>Road on which side?<select value={road} onChange={e=>setRoad(e.target.value)}><option value="N">North</option><option value="E">East</option><option value="S">South</option><option value="W">West</option></select></label>
   <label>Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(e.target.value)}>{[1,2,3].map(x=><option key={x} value={x}>{x} BHK</option>)}</select></label>
   <label>Floors<select value={floors} onChange={e=>setFloors(e.target.value)}><option value="1">Ground</option><option value="2">Ground + first</option><option value="3">Ground + two floors</option></select></label>
   <label>Car parking<select value={parking} onChange={e=>setParking(e.target.value)}><option value="true">Needed</option><option value="false">No car parking</option></select></label>
  </div>
  <p className="nstudio-area-note">Current dimensions: {gajFromFeet(Number(width),Number(depth))??"—"} gaj (sq yd). Area alone cannot determine the width and depth; enter your actual road-facing frontage. 1 gaj = 9 sq ft.</p>
  {error&&<p role="alert" className="nstudio-error">{error}</p>}
  <button type="submit">Create room layouts for my plot →</button>
  <small>Draft concepts, not construction drawings. The system shows only layouts that pass its current circulation checks. Small or unusual plots may have no valid layouts.</small>
 </form>;
}


