"use client";
import {useMemo,useState} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {PlanSheet} from "./plan-sheet";
import {RoomFinishes} from "./room-finishes";
import {RoomCutaway} from "./room-cutaway";
import {baseline,defaultFinish,paintAreas,type Shade,type Finish,type Exterior,initialExterior} from "@/modules/studio/room";
import type {Brief,Rules,generate} from "@/modules/studio/layout";
import type {Design} from "@/modules/studio/share";
const RoomOrbit=dynamic(()=>import("./room-orbit"),{ssr:false,loading:()=> <p>Loading 3D room preview…</p>});
type Plan=NonNullable<ReturnType<typeof generate>>;
type Props={p:Plan;b:Brief;rules:Rules;f:number;hindi:boolean;mode:string;shades:Shade[];saved:Design|null};
export function PlanPreview({p,b,rules,f,hindi,mode,shades=baseline,saved}:Props){
 const plate=p.plates[f]??p.plates[0],floor=p.plates.indexOf(plate);
 const [selected,setSelected]=useState<number|null>(0),[finishes,setFinishes]=useState<Record<string,Finish>>(saved?.finishes??{});
 const [exterior]=useState<Exterior>(saved?.exterior??initialExterior);
 const [coats,setCoats]=useState(saved?.coats??2),[coverage,setCoverage]=useState(saved?.coverage??10);
 const [threeD,setThreeD]=useState(false),[status,setStatus]=useState("");
 const index=selected!=null&&selected>=0&&selected<plate.rooms.length?selected:0;
 const room=plate.rooms[index],key=floor+"-"+index;
 const finish=finishes[key]??defaultFinish;
 const areas=useMemo(()=>plate.rooms.map(r=>Object.values(paintAreas(r,shades)).reduce((a,v)=>a+v,0)),[plate,shades]);
 const litres=Math.ceil(areas.reduce((a,v)=>a+v,0)*coats/coverage*10)/10;
 function save(){
   const design:Design={version:1,brief:b,rules,finishes,exterior,coats,coverage};
   try{localStorage.setItem("neerva-studio-workbench-v1",JSON.stringify(design));setStatus("Concept saved on this device. No account or construction approval is implied.");}
   catch{setStatus("Browser storage unavailable. Try sharing the concept link.")}
 }
 async function share(){
   const design:Design={version:1,brief:b,rules,finishes,exterior,coats,coverage};
   const url=window.location.href.split("#")[0]+"#design="+encodeURIComponent(JSON.stringify(design));
   try{await navigator.clipboard.writeText(url);setStatus("Concept URL copied. It does not include any customer personal data.")}
   catch{setStatus("Copy the page address after saving your concept; clipboard permission may be restricted.")}
 }
 return <section className="neerva-studio-tools" aria-label="Interactive concept planner">
  <div><h2 style={{fontSize:24,margin:"0 0 12px"}}>{hindi?"घर का नक्शा":"Home concept plan"} — floor {floor+1}</h2>
   <PlanSheet plan={p} floor={floor} selected={index} onSelect={setSelected}/>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"16px 0"}}>
    <button className="button button-outline" type="button" onClick={save}>Save on this device</button>
    <button className="button button-outline" type="button" onClick={()=>void share()}>Copy share link</button>
    <Link className="button button-outline" href="/quotes?category=paint">Prepare material quote</Link>
   </div>
   {status&&<p role="status">{status}</p>}
   <p>Estimated built-up area: <strong>{p.builtAreaSqM.toFixed(1)} m²</strong>. Concept cost ranges require administrator verification; no current selling rate is assumed.</p>
   <p style={{fontSize:13,color:"#5b675e"}}>{p.notice}</p>
  </div>
  <aside className="neerva-studio-palette"><h2 style={{fontSize:23}}>Room colours & paint</h2>
   <label>Selected room<select value={index} onChange={e=>setSelected(Number(e.target.value))}>{plate.rooms.map((r,i)=><option key={i} value={i}>{r.name} {i+1}</option>)}</select></label>
   <RoomFinishes room={room} finish={finish} onChange={next=>setFinishes(prev=>({...prev,[key]:next}))} shades={shades}/>
   <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"12px 0"}}>
    <button className="button button-outline" type="button" aria-pressed={!threeD} onClick={()=>setThreeD(false)}>2D cutaway</button>
    <button className="button button-outline" type="button" aria-pressed={threeD} onClick={()=>setThreeD(true)}>3D orbit</button>
   </div>
   {threeD?<RoomOrbit room={room} finish={finish} shades={shades} split={0.5}/>:<RoomCutaway room={room} finish={finish} shades={shades} split={0.5}/>}
   <h3 style={{fontSize:18}}>Paint quantity</h3>
   <label>Number of coats<select value={coats} onChange={e=>setCoats(Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   <label>Coverage per litre (m²)<input type="number" min="1" max="30" value={coverage} onChange={e=>setCoverage(Math.max(1,Math.min(30,Number(e.target.value)||10)))}/></label>
   <strong>{litres.toFixed(1)} L approximate for selected floor</strong>
   <p style={{fontSize:12,lineHeight:1.6}}>Quantity excludes modeled doors and windows and includes ceiling where appropriate. Confirm product coverage, primer, wastage and dimensions on site.</p>
   {mode==="exterior"&&<Link href="/design-studio/visualizer">Open exterior colour studio →</Link>}
  </aside>
 </section>;
}
