"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {conceptRules,generate,type Brief,type Side} from "@/modules/studio/layout";
import {baseline} from "@/modules/studio/room";
import {readDesign,type Design} from "@/modules/studio/share";
import {PlanPreview} from "./plan-preview";
const initial:Brief={width:6096,depth:12192,beds:2,floors:1,road:"N",facing:"N",parking:true};
const faces=["N","E","S","W"] as const;
const feet=(mm:number)=>Math.round(mm/304.8);
export function PlanWorkbench(){
 const [brief,setBrief]=useState<Brief>(initial),[floor,setFloor]=useState(0),[hindi,setHindi]=useState(false),[saved,setSaved]=useState<Design|null>(null);
 useEffect(()=>{const found=readDesign(window.location.hash);if(found){setBrief(found.brief);setSaved(found)}},[]);
 const plan=useMemo(()=>generate(brief,conceptRules),[brief]);
 function update(key:keyof Brief,value:number|string|boolean){setBrief(prev=>({...prev,[key]:value}));setFloor(0);setSaved(null)}
 return <div className="catalog-page" style={{maxWidth:1450,margin:"auto",padding:"18px clamp(14px,3vw,46px) 80px"}}>
  <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
   <Link href="/design-studio">← Design Studio</Link><button type="button" className="button button-outline" onClick={()=>setHindi(x=>!x)}>{hindi?"English":"हिंदी"}</button>
  </nav>
  <header style={{margin:"30px 0"}}><span className="eyebrow">ORIGINAL PLAN-BASED CONCEPT</span><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,46px)"}}>{hindi?"प्लॉट से घर का नक्शा":"Design a concept for your plot."}</h1>
   <p>{hindi?"प्लॉट, कमरे, मंजिल चुनें। निर्माण से पहले वास्तुकार से पुष्टि करें।":"Choose dimensions, bedrooms and floors. Structural safety requires a licensed architect or engineer."}</p></header>
  <form className="neerva-workbench-inputs" onSubmit={e=>e.preventDefault()} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:12,marginBottom:28}}>
   <label>Plot width (ft)<input type="number" min="15" max="180" required value={feet(brief.width)} onChange={e=>update("width",Math.round(Number(e.target.value)*304.8))}/></label>
   <label>Plot depth (ft)<input type="number" min="27" max="180" required value={feet(brief.depth)} onChange={e=>update("depth",Math.round(Number(e.target.value)*304.8))}/></label>
   <label>Bedrooms<select value={brief.beds} onChange={e=>update("beds",Number(e.target.value))}>{[1,2,3,4,5,6].map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Floors<select value={brief.floors} onChange={e=>update("floors",Number(e.target.value))}>{[1,2,3].map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Road side<select value={brief.road} onChange={e=>update("road",e.target.value as Side)}>{faces.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Facing<select value={brief.facing} onChange={e=>update("facing",e.target.value as Side)}>{faces.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Parking<select value={String(brief.parking)} onChange={e=>update("parking",e.target.value==="true")}><option value="true">Yes</option><option value="false">No</option></select></label>
  </form>
  {!plan?<div role="alert" style={{padding:20,background:"#fff0e5",borderRadius:12}}>This plot is too small for the current conceptual room rules. Choose a larger size or fewer floors. No invalid plan will be generated.</div>:<>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:22}}>
    {plan.plates.map((_,i)=><button type="button" key={i} className="button button-outline" aria-pressed={floor===i} onClick={()=>setFloor(i)}>Floor {i+1}</button>)}
   </div>
   <PlanPreview p={plan} b={brief} rules={conceptRules} f={floor} hindi={hindi} mode="exterior" shades={baseline} saved={saved}/>
  </>}
 </div>;
}
