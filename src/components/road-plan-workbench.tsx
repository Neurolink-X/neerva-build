"use client";
import {useEffect,useMemo,useState} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {generateRoadPlans} from "@/modules/studio/road-generator";
import {planMetrics,type PlanBrief,type PlanModel,type RoadSide} from "@/modules/studio/plan-model";
import {studioDesignFromPlan} from "@/modules/studio/plan-model-adapter";
import {RoadElevation} from "./road-plan-diagram";
import {OrientedPlanDrawing} from "./oriented-plan-drawing";
const Building3D=dynamic(()=>import("./studio-building-3d").then(m=>m.StudioBuilding3D),{
 ssr:false,loading:()=> <p role="status" className="nroad-loading">Loading plan-matched 3D viewer… The 2D plan is available immediately.</p>
});
const initial:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
const colours=[
 {id:"ivory",en:"Ivory + walnut",hi:"आइवरी + वॉलनट",main:"#e9e2d4",accent:"#8d694c"},
 {id:"sage",en:"Sage + sandstone",hi:"सेज + सैंडस्टोन",main:"#bec9b6",accent:"#a78f72"},
 {id:"slate",en:"Slate + cream",hi:"स्लेट + क्रीम",main:"#bdc5c4",accent:"#ddd5c4"}
] as const;
export function RoadPlanWorkbench(){
 const [brief,setBrief]=useState<PlanBrief>(initial),[chosen,setChosen]=useState(0);
 const [floor,setFloor]=useState(0),[hindi,setHindi]=useState(false),[palette,setPalette]=useState<(typeof colours)[number]["id"]>("ivory");
 const [threeReady,setThreeReady]=useState(false);
 useEffect(()=>{const frame=window.requestAnimationFrame(()=>setThreeReady(true));return()=>window.cancelAnimationFrame(frame)},[]);
 const result=useMemo(()=>generateRoadPlans(brief),[brief]);
 const draft=result.plans[chosen]??result.plans[0]??null;
 const shade=colours.find(c=>c.id===palette)??colours[0];
 const plan=useMemo<PlanModel|null>(()=>draft?{...draft,facade:{...draft.facade,main:shade.main,accent:shade.accent}}:null,[draft,shade]);
 const design=useMemo(()=>plan?studioDesignFromPlan(plan):null,[plan]);
 const metrics=useMemo(()=>plan?planMetrics(plan):null,[plan]);
 function update<K extends keyof PlanBrief>(key:K,value:PlanBrief[K]){setBrief(v=>({...v,[key]:value}));setChosen(0);setFloor(0)}
 function changeSetback(side:keyof PlanBrief["setbacks"],value:number){setBrief(v=>({...v,setbacks:{...v.setbacks,[side]:value}}));setChosen(0);setFloor(0)}
 const str=(en:string,hi:string)=>hindi?hi:en;
 return <main className="nroad">
  <nav className="nroad-nav" aria-label="House planner navigation"><Link href="/design-studio/workbench">← {str("Previous workbench","पुराना प्लानर")}</Link>
   <span>NEERVA BUILD · PLANMODEL</span><button type="button" onClick={()=>setHindi(x=>!x)}>{hindi?"English":"हिन्दी"}</button></nav>
  <header className="nroad-hero">
   <span className="nroad-kicker">ROAD-FIRST · DRAFT CONCEPT GENERATOR</span>
   <h1>{str("A house plan that starts at your road.","सड़क के अनुसार घर का नक्शा।")}</h1>
   <p>{str("Enter your plot frontage, road direction and household requirements. See the same rooms in 2D, 3D and an approximate quantity view.",
    "प्लॉट की चौड़ाई, सड़क और कमरों की जानकारी भरें। एक ही प्लान को 2D, 3D और सामग्री अनुमान में देखें।")}</p>
  </header>
  <div className="nroad-main">
   <aside className="nroad-controls">
    <div className="nroad-head"><h2>{str("Your plot","आपका प्लॉट")}</h2><span>18 × 50 ft benchmark</span></div>
    <form onSubmit={e=>e.preventDefault()} className="nroad-form">
     <label>{str("Frontage / width (ft)","चौड़ाई (फीट)")}<input type="number" min="10" max="200" step=".5" value={brief.widthFt} onChange={e=>update("widthFt",Number(e.target.value))}/></label>
     <label>{str("Plot depth (ft)","लंबाई (फीट)")}<input type="number" min="15" max="250" step=".5" value={brief.depthFt} onChange={e=>update("depthFt",Number(e.target.value))}/></label>
     <label>{str("Road along which edge?","सड़क किस दिशा में है?")}<select value={brief.roadSide} onChange={e=>update("roadSide",e.target.value as RoadSide)}>
      {(["N","E","S","W"] as const).map(side=><option key={side} value={side}>{({N:"North",E:"East",S:"South",W:"West"} as const)[side]}</option>)}
     </select></label>
     <label>{str("Levels","मंज़िलें")}<select value={brief.floors} onChange={e=>update("floors",Number(e.target.value) as 1|2)}>
      <option value={1}>G · Ground</option><option value={2}>G+1 · Two levels</option></select></label>
     <label>{str("Total bedrooms","कुल बेडरूम")}<select value={brief.bedrooms} onChange={e=>update("bedrooms",Number(e.target.value))}>
      {[1,2,3].map(n=><option key={n} value={n}>{n} BHK</option>)}</select></label>
     <label>{str("Car parking","कार पार्किंग")}<select value={String(brief.parking)} onChange={e=>update("parking",e.target.value==="true")}>
      <option value="true">Yes · minimum 8 × 16 ft</option><option value="false">No parking</option></select></label>
     <details className="nroad-advanced"><summary>{str("Setbacks (unverified)","सेटबैक (सत्यापित नहीं)")}</summary><p>{str("Only enter setbacks confirmed for your own plot. The engine will refuse layouts that cannot accommodate them.","अपने प्लॉट के सत्यापित सेटबैक ही भरें। जगह कम होने पर प्लान नहीं बनेगा।")}</p>
      {(["frontFt","rearFt","leftFt","rightFt"] as const).map(side=><label key={side}>{side.replace("Ft","")} (ft)
       <input min="0" max="20" step=".5" type="number" value={brief.setbacks[side]} onChange={e=>changeSetback(side,Number(e.target.value))}/></label>)}
     </details>
    </form>
    <p className="nroad-disclaimer">0 ft setbacks are an input placeholder, NOT confirmed legal permission to build to a boundary. Verify all local regulations and car access.</p>
    <Link className="nroad-secondary-link" href="/design-studio/fit">{str("Check other plot sizes and browse existing concepts →","दूसरे प्लॉट आकार देखें →")}</Link>
   </aside>
   <div className="nroad-results">
    {!plan?<section className="nroad-error" role="alert">
     <h2>{str("No circulation-safe plan for this brief","इस मांग के अनुसार सुरक्षित रास्ते वाला प्लान नहीं है")}</h2>
     <ul>{result.blockers.map(msg=><li key={msg}>{msg}</li>)}</ul>
     <p>{str("Try G+1, fewer bedrooms, or review parking and setbacks. We do not shrink rooms below minimums to fabricate a fit.",
       "G+1, कम बेडरूम या पार्किंग/सेटबैक बदलें। गलत नाप वाला नक्शा नहीं दिखाएंगे।")}</p>
    </section>:<>
     <div className="nroad-head nroad-choices"><h2>{str("Geometry-checked draft options","ज्यामिति जाँचे गए ड्राफ्ट")}</h2><span>{result.plans.length} mirrored entry arrangements</span></div>
     <div className="nroad-variants" role="group" aria-label="Choose plan layout">{result.plans.map((v,i)=><button key={v.id} type="button" aria-pressed={v.id===plan.id}
       onClick={()=>{setChosen(i);setFloor(0)}}><strong>{i+1}. {v.variant==="parking-left"?"Parking left":"Parking right"}</strong>
       <span>{v.score.toFixed(0)}/90 concept score</span></button>)}</div>
     {result.plans.length<3&&<p className="nroad-small" role="status">These {result.plans.length} options are mirror arrangements, not independently different architectural topologies. A third unverified layout is not shown.</p>}
     <div className="nroad-head"><h2>{str("Plan & room dimensions","प्लान और कमरों का नाप")}</h2><span>Road · {plan.plot.roadSide}</span></div>
     <div className="nroad-floor-tabs" role="group" aria-label="Select floor">
      {Array.from({length:plan.floors},(_,i)=><button key={i} aria-pressed={floor===i} onClick={()=>setFloor(i)}>{i===0?"Ground floor":"First floor"}</button>)}
     </div>
     <OrientedPlanDrawing plan={plan} floor={floor}/>
     <div className="nroad-head"><h2>{str("Plan-matched 3D","इसी प्लान का 3D")}</h2><span>Touch orbit · concept-only</span></div>
     {design&&(threeReady?<Building3D key={plan.id} design={design} colour={shade.main} planModel={plan}/>:<p role="status" className="nroad-loading">Preparing plan-matched 3D geometry…</p>)}
     <p className="nroad-small">3D derives room footprints, doors and windows from the selected PlanModel. The legacy viewer simplifies wall thickness and stair construction; it is not verified CAD/BIM.</p>
     <div className="nroad-head"><h2>{str("Roadside exterior concept","सड़क की तरफ घर का रूप")}</h2><span>Same front gate geometry</span></div>
     <RoadElevation plan={plan} main={shade.main} accent={shade.accent}/>
     <div className="nroad-palette"><h2>{str("House colour mood","घर की रंग योजना")}</h2>
      <div role="group" aria-label="Choose a named exterior colour palette">{colours.map(x=><button key={x.id} type="button" aria-pressed={palette===x.id} onClick={()=>setPalette(x.id)}>
       <i style={{background:x.main}}/><span>{hindi?x.hi:x.en}</span></button>)}</div>
      <p className="nroad-small">Digital colours are approximate; check an actual shade card. Finishes and room paint are not physically simulated here.</p>
     </div>
     {metrics&&<section className="nroad-metrics"><h2>{str("Preliminary quantities — not a BOQ","प्रारंभिक अनुमान — अंतिम BOQ नहीं")}</h2>
      <div><span><strong>{metrics.roomFloorSqFt.toFixed(0)} ft²</strong><small>Room-floor rectangles, all levels</small></span>
       <span><strong>{metrics.parkingSqFt.toFixed(0)} ft²</strong><small>Car bay rectangle</small></span>
       <span><strong>{metrics.netPaintSqM.toFixed(1)} m²</strong><small>Room-facing painted area</small></span>
       <span><strong>{metrics.paintLitres} L</strong><small>Illustrative 2 coats, 10 m²/L</small></span></div>
      <p className="nroad-small">{metrics.note}</p>
      <Link href="/basket" className="nroad-quote">{str("Build my material list →","सामग्री सूची बनाएं →")}</Link>
      <p className="nroad-small">Estimate is not automatically transferred into the quote. Dealer pricing and RFQ intake are currently disabled.</p></section>}
     <section className="nroad-notes"><h2>{str("What still needs a professional?","क्या-क्या जाँचना बाकी है?")}</h2>
      <ul>{plan.notes.map(x=><li key={x}>{x}</li>)}</ul></section>
    </>}
   </div>
  </div>
 </main>;
}
