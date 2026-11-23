"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
export function StudioStartForm(){
 const router=useRouter();
 const [width,setWidth]=useState("18"),[depth,setDepth]=useState("50");
 const [road,setRoad]=useState("N"),[bedrooms,setBedrooms]=useState("3"),[floors,setFloors]=useState("2");
 const [parking,setParking]=useState("true"),[error,setError]=useState("");
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
   <label>Plot width (feet)<input inputMode="decimal" type="number" min="10" max="200" step=".5" required value={width} onChange={e=>setWidth(e.target.value)}/></label>
   <label>Plot depth (feet)<input inputMode="decimal" type="number" min="15" max="250" step=".5" required value={depth} onChange={e=>setDepth(e.target.value)}/></label>
   <label>Road on which side?<select value={road} onChange={e=>setRoad(e.target.value)}><option value="N">North</option><option value="E">East</option><option value="S">South</option><option value="W">West</option></select></label>
   <label>Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(e.target.value)}>{[1,2,3].map(x=><option key={x} value={x}>{x} BHK</option>)}</select></label>
   <label>Floors<select value={floors} onChange={e=>setFloors(e.target.value)}><option value="1">Ground</option><option value="2">Ground + first</option></select></label>
   <label>Car parking<select value={parking} onChange={e=>setParking(e.target.value)}><option value="true">Needed</option><option value="false">Not needed (limited support)</option></select></label>
  </div>
  {error&&<p role="alert" className="nstudio-error">{error}</p>}
  <button type="submit">Create room layouts for my plot →</button>
  <small>Draft concepts, not construction drawings. The system shows only layouts that pass its current circulation checks. Small or unusual plots may have no valid layouts.</small>
 </form>;
}
