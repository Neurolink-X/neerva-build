"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {SiteFooter} from "@/components/site-chrome";
import {StudioPremiumTools} from "./studio-premium-tools";
import {generateSpatialPortfolio} from "@/modules/studio/road-generator";
import {planMetrics,planGeometryDigest,type PlanBrief,type PlanModel,type RoadSide} from "@/modules/studio/plan-model";
import {studioDesignFromPlan} from "@/modules/studio/plan-model-adapter";
import {oppositeRoadSide,roadPoint,roadRect,roadSegment,siteDimensions} from "@/modules/studio/plan-coordinate";
import {siteOutline} from "@/modules/studio/site-shape";
import {RoadElevation} from "./road-plan-diagram";
import {OrientedPlanDrawing} from "./oriented-plan-drawing";
import {PlanShortlist} from "./plan-shortlist";
import {briefKey} from "@/modules/studio/plan-shortlist";
import {allowStudioWarmup,studioWarmupDelay,type NetworkHint} from "@/modules/navigation/intent";
const Building3D=dynamic(()=>import("./studio-building-3d").then(m=>m.StudioBuilding3D),{
 ssr:false,loading:()=> <p role="status" className="nroad-loading">Loading plan-matched 3D viewer… The 2D plan is available immediately.</p>
});
const initial:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
const colours=[
 {id:"ivory",en:"Ivory + walnut",hi:"आइवरी + वॉलनट",main:"#e9e2d4",accent:"#8d694c"},
 {id:"sage",en:"Sage + sandstone",hi:"सेज + सैंडस्टोन",main:"#bec9b6",accent:"#a78f72"},
 {id:"slate",en:"Slate + cream",hi:"स्लेट + क्रीम",main:"#bdc5c4",accent:"#ddd5c4"}
] as const;
export function RoadPlanWorkbench({initialBrief,initialOption=0}:{initialBrief?:PlanBrief;initialOption?:number}={}){
 const [brief,setBrief]=useState<PlanBrief>(()=>initialBrief??initial),[chosen,setChosen]=useState(Number.isInteger(initialOption)&&initialOption>=0&&initialOption<24?initialOption:0);
 const [floor,setFloor]=useState(0),[hindi,setHindi]=useState(false),[palette,setPalette]=useState<(typeof colours)[number]["id"]>("ivory");
 const [kitOverride,setKit]=useState<PlanModel["facade"]["kit"]|null>(null);
 const [threeReady,setThreeReady]=useState(false);
 const threeSection=useRef<HTMLDivElement>(null);
 const [saving,setSaving]=useState(false),[saveInfo,setSaveInfo]=useState("");
 async function saveDraft(){
  if(!draft||saving)return;
  setSaving(true);setSaveInfo("");
  try{const {createNeervaBrowserClient}=await import("@/modules/supabase/browser");
   const client=createNeervaBrowserClient();
   if(!client){setSaveInfo("Account service is not configured. Your concept is not saved.");return;}
   const session=await client.auth.getSession(),token=session.data.session?.access_token;
   if(!token){setSaveInfo("Sign in to save this concept privately. No plan was saved.");return;}
   const response=await fetch("/api/studio/projects",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({idempotencyKey:crypto.randomUUID(),title:`${brief.widthFt} × ${brief.depthFt} · ${brief.bedrooms} BHK`,brief,variant:draft.variant,planId:draft.id,geometryDigest:await planGeometryDigest(draft),finish:{kit,main:shade.main,accent:shade.accent}}),cache:"no-store"});
   const body=await response.json() as {project?:{id?:string};error?:string};
   setSaveInfo(response.ok&&body.project?.id?"Private concept saved. Not a construction-approved plan.":(body.error??"Project was not saved."));
  }catch{setSaveInfo("Network issue. Your concept was not confirmed saved.");}finally{setSaving(false)}
 }
 const result=useMemo(()=>generateSpatialPortfolio(brief,24),[brief]);
 const activeOption=result.plans[chosen]?chosen:0;
 const draft=result.plans[activeOption]??null;
 const kit=kitOverride??draft?.facade.kit??"simple-parapet";
 const shade=colours.find(c=>c.id===palette)??colours[0];
 const plan=useMemo<PlanModel|null>(()=>draft?{...draft,facade:{...draft.facade,kit,main:shade.main,accent:shade.accent}}:null,[draft,shade,kit]);
 const design=useMemo(()=>plan?studioDesignFromPlan(plan):null,[plan]);
 const metrics=useMemo(()=>plan?planMetrics(plan):null,[plan]);
 const hasPlan=!!plan;
 const fewerLevels=brief.bedrooms<brief.floors&&brief.bedrooms>=1&&brief.bedrooms<=3?brief.bedrooms as 1|2|3:null;
 const alternative=useMemo(()=>!hasPlan&&fewerLevels?generateSpatialPortfolio({...brief,floors:fewerLevels},1).plans[0]??null:null,[brief,hasPlan,fewerLevels]);
 // Download/parse the shared 3D chunk after useful content on capable devices.
 // Warming never mounts a canvas or allocates WebGL before it is needed.
 useEffect(()=>{
  const node=threeSection.current;if(!hasPlan||threeReady||!node)return;
  const nav=navigator as Navigator&{connection?:NetworkHint&EventTarget;deviceMemory?:number};
  const conn=nav.connection;let timer:ReturnType<typeof setTimeout>|undefined,idle:number|undefined,disposed=false,started=false;
  const eligible=()=>allowStudioWarmup(conn,{cores:nav.hardwareConcurrency,memory:nav.deviceMemory},nav.onLine,document.visibilityState==="visible");
  function cancel(){clearTimeout(timer);timer=undefined;if(idle!==undefined){window.cancelIdleCallback?.(idle);idle=undefined;}}
  function warm(){idle=undefined;if(disposed||started||!eligible())return;started=true;node!.dataset.warmState="loading";
   void import("./studio-building-3d").then(()=>{if(!disposed)node!.dataset.warmState="ready"}).catch(()=>{if(!disposed)node!.dataset.warmState="failed"});
  }
  function schedule(){cancel();if(disposed||started||!eligible()||document.readyState!=="complete")return;
   timer=setTimeout(()=>{timer=undefined;if(!eligible()||disposed)return;if(typeof window.requestIdleCallback==="function")idle=window.requestIdleCallback(warm);else warm()},studioWarmupDelay(conn??{}));
  }
  window.addEventListener("load",schedule);window.addEventListener("online",schedule);window.addEventListener("offline",schedule);document.addEventListener("visibilitychange",schedule);conn?.addEventListener?.("change",schedule);schedule();
  return()=>{disposed=true;cancel();window.removeEventListener("load",schedule);window.removeEventListener("online",schedule);window.removeEventListener("offline",schedule);document.removeEventListener("visibilitychange",schedule);conn?.removeEventListener?.("change",schedule)};
 },[hasPlan,threeReady]);
 // Keep Three.js and WebGL off the initial route critical path. Auto-load near
 // the viewer, or load immediately on explicit request; 2D remains independent.
 useEffect(()=>{const node=threeSection.current;if(!hasPlan||threeReady||!node||!("IntersectionObserver" in window))return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();setThreeReady(true)}},{rootMargin:"120px"});
  observer.observe(node);return()=>observer.disconnect();
 },[hasPlan,threeReady]);
 function update<K extends keyof PlanBrief>(key:K,value:PlanBrief[K]){setBrief(v=>({...v,[key]:value}));setChosen(0);setFloor(0)}
 function changeSetback(side:keyof PlanBrief["setbacks"],value:number){setBrief(v=>({...v,setbacks:{...v.setbacks,[side]:value}}));setChosen(0);setFloor(0)}
 const str=(en:string,hi:string)=>hindi?hi:en;
 return <main className="nroad">
  <nav className="nroad-nav" aria-label="House planner navigation"><Link href="/design-studio">← {str("Home Studio","होम स्टूडियो")}</Link>
   <span>NEERVA BUILD · PLANMODEL</span><button type="button" onClick={()=>setHindi(x=>!x)}>{hindi?"English":"हिन्दी"}</button></nav>
  <header className="nroad-hero">
   <span className="nroad-kicker">ROAD-FIRST · DRAFT CONCEPT GENERATOR</span>
   <h1>{str("A house plan that starts at your road.","सड़क के अनुसार घर का नक्शा।")}</h1>
   <p>{str("Enter your plot frontage, road direction and household requirements. See the same rooms in 2D, 3D and an approximate quantity view.",
    "प्लॉट की चौड़ाई, सड़क और कमरों की जानकारी भरें। एक ही प्लान को 2D, 3D और सामग्री अनुमान में देखें।")}</p>
  </header>
  <div className="nroad-main">
   <aside className="nroad-controls">
    <div className="nroad-head"><h2>{str("Your plot","आपका प्लॉट")}</h2><span>{brief.widthFt} × {brief.depthFt} ft · live geometry</span></div>
    <form onSubmit={e=>e.preventDefault()} className="nroad-form">
     <label>{str("Frontage / width (ft)","चौड़ाई (फीट)")}<input type="number" min="10" max="200" step="any" value={brief.widthFt} onChange={e=>update("widthFt",Number(e.target.value))}/></label>
     <label>{str("Plot depth (ft)","लंबाई (फीट)")}<input type="number" min="15" max="250" step="any" value={brief.depthFt} onChange={e=>update("depthFt",Number(e.target.value))}/></label>
     <label>{str("Road along which edge?","सड़क किस दिशा में है?")}<select name="roadSide" aria-label={str("Road along which edge?","सड़क किस दिशा में है?")} value={brief.roadSide} onChange={e=>update("roadSide",e.target.value as RoadSide)}>
      {(["N","E","S","W"] as const).map(side=><option key={side} value={side}>{({N:"North",E:"East",S:"South",W:"West"} as const)[side]}</option>)}
     </select></label>
     <div className="nroad-road-help" role="status">
       <strong>{str("Road on "+({N:"North",S:"South",E:"East",W:"West"} as const)[brief.roadSide]+" edge","सड़क "+({N:"उत्तर",S:"दक्षिण",E:"पूर्व",W:"पश्चिम"} as const)[brief.roadSide]+" दिशा में है")}</strong>
       <p>{!brief.parking?str("Pedestrian entry faces the selected road.","पैदल प्रवेश चुनी गई सड़क पर है।"):str("Car gate and house entry face the selected road edge. Changing sides rotates the whole 2D plan and 3D house; it never places parking at the back of a front-road plot.","मुख्य गेट और पार्किंग चुनी गई सड़क की तरफ हैं। दिशा बदलने पर 2D नक्शा और 3D घर दोनों घूमते हैं।")}</p>
       <button type="button" onClick={()=>update("roadSide",oppositeRoadSide(brief.roadSide))}>{str("Road actually on opposite side? Switch","सड़क दूसरी तरफ है? दिशा बदलें")}</button>
     </div>
     <details className="nroad-advanced nroad-site-shape"><summary>{str("Plot shape: rectangle or L-shaped land","प्लॉट का आकार: चौकोर या L शेप")}</summary>
      <p>{str("For an L-shaped plot, mark a missing rear corner. The model leaves an entire side strip unbuilt to avoid placing rooms outside your land. A surveyor must confirm boundaries.","L आकार के प्लॉट में पीछे का कटा हुआ कोना बताएं। नक्शा सुरक्षित जगह तक सीमित रहता है, जमीन की सही नाप सर्वेयर से जाँचें।")}</p>
      <label>{str("Site outline","प्लॉट का आकार")}<select name="siteShape" aria-label={str("Site outline","प्लॉट का आकार")} value={brief.siteShape?.kind??"rectangle"}
       onChange={e=>update("siteShape",e.target.value==="rectangle"?{kind:"rectangle"}:{kind:e.target.value as "rear-left-notch"|"rear-right-notch",notchWidthFt:2,notchDepthFt:10})}>
       <option value="rectangle">Rectangle · full frontage</option>
       <option value="rear-left-notch">L shape · rear-left missing corner</option>
       <option value="rear-right-notch">L shape · rear-right missing corner</option>
      </select></label>
      {brief.siteShape&&brief.siteShape.kind!=="rectangle"&&<>
       <label>{str("Missing rear-corner width (ft)","पीछे कटे कोने की चौड़ाई")}<input type="number" min="1" max="60" step="any" value={brief.siteShape.notchWidthFt}
        onChange={e=>update("siteShape",{...brief.siteShape!,notchWidthFt:Number(e.target.value)} as PlanBrief["siteShape"])}/></label>
       <label>{str("Missing rear-corner depth (ft)","पीछे कटे कोने की लंबाई")}<input type="number" min="1" max="100" step="any" value={brief.siteShape.notchDepthFt}
        onChange={e=>update("siteShape",{...brief.siteShape!,notchDepthFt:Number(e.target.value)} as PlanBrief["siteShape"])}/></label>
      </>}
      <p className="nroad-small">These are conservative concept constraints, not municipal setbacks, cadastral proof or licensed architecture.</p>
     </details>
     <label>{str("Levels","मंज़िलें")}<select name="floors" aria-label={str("Levels","मंज़िलें")} value={brief.floors} onChange={e=>update("floors",Number(e.target.value) as 1|2|3)}>
      <option value={1}>G · Ground</option><option value={2}>G+1 · Two levels</option><option value={3}>G+2 · Three levels</option></select></label>
     <label>{str("Total bedrooms","कुल बेडरूम")}<select name="bedrooms" aria-label={str("Total bedrooms","कुल बेडरूम")} value={brief.bedrooms} onChange={e=>update("bedrooms",Number(e.target.value))}>
      {[1,2,3].map(n=><option key={n} value={n}>{n} BHK</option>)}</select></label>
     <label>{str("Car parking","कार पार्किंग")}<select name="parking" aria-label={str("Car parking","कार पार्किंग")} value={String(brief.parking)} onChange={e=>update("parking",e.target.value==="true")}>
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
     {fewerLevels&&<><p>{str("No checked multi-level layout fits these plot constraints. Your bedroom count has not been changed.","इस प्लॉट में चुनी गई मंज़िलों का जाँचा हुआ नक्शा नहीं मिला। बेडरूम की संख्या बदली नहीं गई है।")}</p>{alternative&&<button className="nroad-recovery-action" type="button" onClick={()=>update("floors",fewerLevels)}>{fewerLevels===1?str("Show ground-floor 1 BHK plan","एक मंज़िल का 1 BHK नक्शा देखें"):str("Show validated "+fewerLevels+"-level plan",fewerLevels+" मंज़िल का नक्शा देखें")}</button>}</>}
     <ul>{result.blockers.map(msg=><li key={msg}>{msg}</li>)}</ul>
     {!fewerLevels&&<p>{str("Try G+1, fewer bedrooms, or review parking and setbacks. We do not shrink rooms below minimums to fabricate a fit.",
       "G+1, कम बेडरूम या पार्किंग/सेटबैक बदलें। गलत नाप वाला नक्शा नहीं दिखाएंगे।")}</p>}
    </section>:<>
     <p className="nroad-jump"><a href="#selected-plan-drawing">Jump to the selected exact 2D + 3D plan ↓</a></p>
     <div className="nroad-head nroad-choices"><h2>{str("Room-layout options checked for your plot","ज्यामिति जाँचे गए ड्राफ्ट")}</h2><span>{result.plans.length} room-layout options, same plot</span></div>
     <div className="nroad-variants" role="group" aria-label="Choose plan layout">{result.plans.map((v,i)=>{const {widthFt:w,depthFt:d,roadSide:side}=v.plot;const dim=siteDimensions(w,d,side),road=roadSegment(w,d,side);const boundary=siteOutline(w,d,v.plot.siteShape??{kind:"rectangle"}).map(p=>roadPoint(p,w,d,side));return <button key={v.id} type="button" aria-pressed={v.id===plan.id}
       onClick={()=>{setChosen(i);setKit(null)}}><svg className="nroad-mini-plan" viewBox={`-1 -1 ${dim.w+2} ${dim.d+2}`} role="img" aria-label={`Floor ${floor+1} layout preview ${i+1}: ${w} by ${d} feet, road ${side}`}>
       <polygon points={boundary.map(p=>p.x+","+p.y).join(" ")} fill="#f7f5ec" stroke="#55765a" strokeWidth=".45"/>
       {v.rooms.filter(r=>r.floor===floor).map(r=>{const box=roadRect(r,w,d,side);return <rect key={r.id} x={box.x} y={box.y} width={box.w} height={box.d}
        fill={({parking:"#d4e6e0",verandah:"#fff3d9",living:"#e0ead9",dining:"#e8ebd7",kitchen:"#f0dfcc",bedroom:"#dce2f1",bath:"#c7e3f0",stairs:"#d4d4d4",corridor:"#f4efd9",utility:"#e5d5c4",lounge:"#d9e8cd",terrace:"#dce8df"} as Record<string,string>)[r.kind]??"#e7e4da"} stroke="#496452" strokeWidth=".18"/>})}
       <line x1={road.start.x} x2={road.end.x} y1={road.start.y} y2={road.end.y} stroke="#be6740" strokeWidth="1.1"/>
      </svg><strong>{i+1}. {brief.bedrooms===1?`1 BHK · ${v.floors===1?"Ground":`G+${v.floors-1}`}`:v.rooms.find(r=>r.id==="stairs-g")?.y===v.setbacks.frontFt?"Staircase beside parking":v.rooms.find(r=>r.id==="bed-g")?.y===v.setbacks.frontFt?"Bedroom beside parking":!v.parking&&!v.stairs.roomIds.length?(v.notes[0]==="Spacious living and dining"?"Spacious living 1 BHK":v.notes[0]==="Spacious private bedroom"?"Spacious bedroom 1 BHK":"Balanced 1 BHK"):v.rooms.some(r=>r.id==="bed-g2")?"Two rear bedrooms":v.notes[0]?.includes("family-gallery")?"Gallery / family seating":v.notes[0]?.includes("rear-courtyard")?"Open rear courtyard":v.notes[0]?.includes("rear-baranda")?"Rear baranda / veranda":"Utility & wash"}</strong>
       <span>{brief.bedrooms===1&&v.floors>1?"1 bedroom total · ":""}{!v.parking?"Pedestrian entrance":v.variant==="parking-left"?"Car at left":"Car at right"} · {!v.parking&&!v.stairs.roomIds.length?"Living + dining":v.notes[0]?.includes("family hall")?"Family hall":v.notes[0]?.includes("lounge / drawing")?"Drawing lounge":"Dining + hall"}</span>
       <small>Kitchen {v.rooms.find(r=>r.id==="kitchen")!.x < v.plot.widthFt/2 ? "left" : "right"} · {v.plot.widthFt} × {v.plot.depthFt} ft · Floor {floor+1}</small></button>})}</div>
     <p className="nroad-small nroad-selection-feedback" role="status">{str("Layout "+(activeOption+1)+" of "+result.plans.length+" selected. Your matching 2D and 3D views are below.","नक्शा "+(activeOption+1)+" / "+result.plans.length+" चुना गया। नीचे इसी नक्शे के 2D और 3D व्यू हैं।")} <a href="#selected-plan-drawing">{str("View selected plan ↓","चुना नक्शा देखें ↓")}</a></p>
     {result.plans.length<24&&<p className="nroad-small">{brief.bedrooms===1?str("1 BHK options depend on usable space. Smaller plots may have fewer layouts; all shown options pass the concept geometry checks.","1 BHK विकल्प उपलब्ध जगह पर निर्भर हैं। सभी दिखाए गए नक्शों की ज्यामिति जाँची गई है।"):str("Only "+result.plans.length+" geometry-distinct concept layouts passed for this exact plot.","इस प्लॉट के लिए "+result.plans.length+" अलग नक्शे जाँचे गए हैं।")}</p>}
     <div className="nroad-save"><button type="button" disabled={saving} onClick={()=>void saveDraft()}>{saving?"Saving…":str("Save this plot-specific concept privately","अपना नक्शा सुरक्षित सेव करें")}</button>{saveInfo&&<p role="status">{saveInfo} {saveInfo.startsWith("Sign in")&&<Link href="/account">Sign in →</Link>}</p>}</div>
     <div className="nroad-head" id="selected-plan-drawing"><h2>{str("Plan & room dimensions","प्लान और कमरों का नाप")}</h2><span>Road · {plan.plot.roadSide}</span></div>
     <div className="nroad-floor-tabs" role="group" aria-label="Select floor">
      {Array.from({length:plan.floors},(_,i)=><button key={i} aria-pressed={floor===i} onClick={()=>setFloor(i)}>{["Ground floor","First floor","Second floor"][i]}</button>)}
     </div>
     <div className="nroad-plan-summary" aria-label="Selected layout summary"><span><strong>#{activeOption+1}</strong> Selected layout</span><span><strong>{plan.rooms.filter(r=>r.floor===floor).length}</strong> Spaces on this floor</span><span><strong>{plan.plot.widthFt} × {plan.plot.depthFt}</strong> Plot (ft)</span><span><strong>{plan.floors}</strong> Level(s)</span><span><strong>{plan.rooms.filter(r=>r.kind==="bedroom").length}</strong> Bedrooms total</span><span><strong>{plan.rooms.filter(r=>r.kind==="bedroom"&&r.floor===floor).length}</strong> Bedrooms on this floor</span></div>
     <OrientedPlanDrawing plan={plan} floor={floor}/>
     <PlanShortlist key={briefKey(brief)} brief={briefKey(brief)} plans={result.plans} selected={plan.id} floor={floor} onChoose={id=>{const i=result.plans.findIndex(p=>p.id===id);if(i>=0)setChosen(i)}}/>
     <div className="nroad-head"><h2>{str("Plan-matched 3D","इसी प्लान का 3D")}</h2><span>Follows selected 2D floor · full building is optional</span></div>
     <div ref={threeSection} className="nroad-3d-slot" data-warm-state="idle">{design&&(threeReady?<Building3D key={`${plan.id}-floor-${floor}`} design={design} colour={shade.main} planModel={plan} selectedFloor={floor}/>:<div className="nroad-loading"><p>{str("Your 2D plan is ready. The interactive 3D viewer loads when you reach this section.","2D नक्शा तैयार है। 3D व्यू इस भाग में आने पर लोड होगा।")}</p><button type="button" onClick={()=>setThreeReady(true)}>{str("Load interactive 3D","3D व्यू खोलें")}</button></div>)}</div>
     <p className="nroad-small">3D derives room footprints, doors and windows from the selected PlanModel. The selected floor uses the same room footprints and openings. Wall thickness, stairs and finishes remain conceptual, not verified CAD/BIM.</p>
     <StudioPremiumTools key={JSON.stringify([brief,plan.id])} product="home_studio" brief={brief} option={activeOption} planId={plan.id} selectedPlan={plan}/>
     <div className="nroad-head"><h2>{str("Roadside exterior concept","सड़क की तरफ घर का रूप")}</h2><span>Same front gate geometry</span></div>
     <div className="nroad-exterior-workspace">{plan.floors>1&&<label>{str("Balcony front style","बालकनी का डिज़ाइन")}<select name="facadeKit" aria-label={str("Balcony front style","बालकनी का डिज़ाइन")} value={kit} onChange={e=>setKit(e.target.value as typeof kit)}><option value="simple-parapet">Open glass front</option><option value="stepped-band">Stepped facade band</option><option value="jali-screen">Vertical screen</option><option value="pergola">Pergola shade</option></select></label>}
     <RoadElevation plan={plan} main={shade.main} accent={shade.accent}/>
     <div className="nroad-palette"><h2>{str("House colour mood","घर की रंग योजना")}</h2>
      <div role="group" aria-label="Choose a named exterior colour palette">{colours.map(x=><button key={x.id} type="button" aria-pressed={palette===x.id} onClick={()=>setPalette(x.id)}>
       <i style={{background:x.main}}/><span>{hindi?x.hi:x.en}</span></button>)}</div>
      <p className="nroad-small">Digital colours are approximate; check an actual shade card. Finishes and room paint are not physically simulated here.</p><Link href="/design-studio/visualizer" className="nroad-secondary-link">{str("Try paint on sample homes or your own photo →","सैंपल घर या अपनी फोटो पर रंग आज़माएँ →")}</Link>
     </div>
     </div>{metrics&&<section className="nroad-metrics"><h2>{str("Preliminary quantities — not a BOQ","प्रारंभिक अनुमान — अंतिम BOQ नहीं")}</h2>
      <div><span><strong>{metrics.roomFloorSqFt.toFixed(0)} ft²</strong><small>Room-floor rectangles, all levels</small></span>
       {plan.parking&&<span><strong>{metrics.parkingSqFt.toFixed(0)} ft²</strong><small>Car bay rectangle</small></span>}
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
 <SiteFooter/></main>;
}


