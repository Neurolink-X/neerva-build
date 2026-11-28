"use client";
import {memo,useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {SiteFooter} from "@/components/site-chrome";
import {PlanFinishStudio} from "./plan-finish-studio";
import {ShadeReferenceCard} from "./shade-reference-card";
import {defaultFinishScheme,rememberFinish,type FinishScheme} from "@/modules/studio/finish-model";
import {StudioProjectExchange} from "./studio-project-exchange";
import {StudioPremiumTools} from "./studio-premium-tools";
import {generateSpatialPortfolio,generateStairReadyPortfolio,generateCoveredUpperPortfolio,generateEnclosedUpperPortfolio,generateUsableUpperPortfolio,physicalPlanSignature,kitchenZone} from "@/modules/studio/road-generator";
import {isOtsRoom,planMetrics,planSiteReview,planGeometryDigest,type PlanBrief,type PlanModel,type RoadSide} from "@/modules/studio/plan-model";
import {studioDesignFromPlan} from "@/modules/studio/plan-model-adapter";
import {oppositeRoadSide,roadPoint,roadRect,roadSegment,siteDimensions} from "@/modules/studio/plan-coordinate";
import {exposedRoofPatches} from "@/modules/studio/plan-surfaces";
import {siteOutline,siteAreaSqFt} from "@/modules/studio/site-shape";
import {entranceArrangement,architectureTopology,representativeIndices} from "@/modules/studio/architecture-profile";
import {RoadElevation} from "./road-plan-diagram";
const StreetRender=dynamic(()=>import("./street-architecture-render").then(m=>m.StreetArchitectureRender),{ssr:false,loading:()=> <p role="status">Preparing street render controls…</p>});
import {OrientedPlanDrawing} from "./oriented-plan-drawing";
import {ventilationReport} from "@/modules/studio/ventilation";
import {airOptimizedPlan,otsGrilleBars,otsGrilleLevel,otsPositions,otsPositionOf,type OtsPosition} from "@/modules/studio/ots-ventilation";
import {VentilationPanel} from "./ventilation-panel";
import {InteriorFitPanel} from "./interior-fit-panel";
import {PlanShortlist} from "./plan-shortlist";
import {briefKey} from "@/modules/studio/plan-shortlist";
import {allowStudioWarmup,studioWarmupDelay,preferLitePreview,preferLiteDevice,type NetworkHint} from "@/modules/navigation/intent";
const Building3D=dynamic(()=>import("./studio-building-3d").then(m=>m.StudioBuilding3D),{
 ssr:false,loading:()=> <p role="status" className="nroad-loading">Loading plan-matched 3D viewer… The 2D plan is available immediately.</p>
});
const initial:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
const colours=[
 {id:"ivory",en:"Ivory + walnut",hi:"आइवरी + वॉलनट",main:"#e9e2d4",accent:"#8d694c"},
 {id:"sage",en:"Sage + sandstone",hi:"सेज + सैंडस्टोन",main:"#bec9b6",accent:"#a78f72"},
 {id:"slate",en:"Slate + cream",hi:"स्लेट + क्रीम",main:"#bdc5c4",accent:"#ddd5c4"}
] as const;
// Stable mini drawings: changing floor, paint, or one selection does not rebuild every card SVG.
const PlanMiniPreview=memo(function PlanMiniPreview({v,i}:{v:PlanModel;i:number}){
 const {widthFt:w,depthFt:d,roadSide:side}=v.plot;const dim=siteDimensions(w,d,side),road=roadSegment(w,d,side);const boundary=siteOutline(w,d,v.plot.siteShape??{kind:"rectangle"}).map(p=>roadPoint(p,w,d,side));
 return <div className="nroad-mini-wrap">{Array.from({length:v.floors},(_,level)=><div key={level}><svg className="nroad-mini-plan" viewBox={`-1 -1 ${dim.w+2} ${dim.d+2}`} role="img" aria-label={`Floor ${level+1} layout preview ${i+1}: ${w} by ${d} feet, road ${side}`}>
       <polygon points={boundary.map(p=>p.x+","+p.y).join(" ")} fill="#f7f5ec" stroke="#55765a" strokeWidth=".45"/>
       {v.rooms.filter(r=>r.floor===level).map(r=>{const box=roadRect(r,w,d,side),label=({parking:"P",verandah:"V",living:"H",dining:"D",kitchen:"K",bedroom:"B",bath:"WC",stairs:"S",corridor:"",utility:"U",lounge:"L",terrace:"T",balcony:""} as Record<string,string>)[r.kind]??"";return <g key={r.id}><rect x={box.x} y={box.y} width={box.w} height={box.d} fill={({parking:"#d4e6e0",verandah:"#fff3d9",living:"#e0ead9",dining:"#e8ebd7",kitchen:"#f0dfcc",bedroom:"#dce2f1",bath:"#c7e3f0",stairs:"#d4d4d4",corridor:"#f4efd9",utility:"#e5d5c4",lounge:"#d9e8cd",terrace:"#dce8df"} as Record<string,string>)[r.kind]??"#e7e4da"} stroke="#496452" strokeWidth=".18"/>{label&&<text x={box.x+box.w/2} y={box.y+box.d/2} dominantBaseline="central" textAnchor="middle" fontSize={Math.min(2,box.w/(label.length*.85),box.d*.55)} fill="#263e35" fontWeight="700">{label}</text>}</g>})}
       <line x1={road.start.x} x2={road.end.x} y1={road.start.y} y2={road.end.y} stroke="#be6740" strokeWidth="1.1"/>
      </svg><small>{level===0?"G":`F${level}`} · {v.rooms.filter(r=>r.floor===level&&r.kind==="bedroom").length}B</small></div>)}</div>;
});
function RoofJaalPlan({plan}:{plan:PlanModel}){
 const {widthFt:w,depthFt:d,roadSide:side}=plan.plot,dim=siteDimensions(w,d,side);
 const rect=(r:{x:number;y:number;w:number;d:number})=>roadRect(r,w,d,side);
 const shaft=plan.rooms.find(r=>isOtsRoom(r)&&r.floor===plan.floors-1),level=otsGrilleLevel(plan);
 const boundary=siteOutline(w,d,plan.plot.siteShape??{kind:"rectangle"}).map(p=>roadPoint(p,w,d,side));
 return <section className="nroad-diagram" aria-label="Roof and ventilation plan" data-plan-id={plan.id} data-roof-jaal={shaft?"modeled":"not-modeled"}>
 <h3>Roof / ventilation plan</h3><p>{shaft?("Open-to-sky shaft · "+shaft.w.toFixed(1)+" × "+shaft.d.toFixed(1)+" ft · grille at "+(level===plan.floors?"roof":"terrace")+" level"):"No aligned roof shaft is modeled. Select a feasible ventilation layout below."}</p>
 <svg role="img" aria-label="Roof slabs, terraces and roof jaal" viewBox={`-1 -1 ${dim.w+2} ${dim.d+2}`} style={{width:"100%",maxHeight:460}}>
 <polygon points={boundary.map(p=>p.x+","+p.y).join(" ")} fill="#faf7ed" stroke="#536859" strokeWidth=".2"/>
 {exposedRoofPatches(plan).map((p,i)=>{const r=rect(p);return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.d} fill="#ded9cd" stroke="#8b877b" strokeWidth=".12"><title>{`Roof slab level ${p.floor}`}</title></rect>})}
 {plan.rooms.filter(r=>r.floor===plan.floors-1&&!["terrace","balcony","parking","verandah"].includes(r.kind)).map(p=>{const r=rect(p);return <rect key={p.id} x={r.x} y={r.y} width={r.w} height={r.d} fill="#ded9cd" stroke="#8b877b" strokeWidth=".12"/>})}
 {plan.rooms.filter(r=>r.floor===plan.floors-1&&(r.kind==="terrace"||r.kind==="balcony")&&!isOtsRoom(r)).map(p=>{const r=rect(p);return <rect key={p.id} x={r.x} y={r.y} width={r.w} height={r.d} fill="#f3e9cf" stroke="#8b877b" strokeWidth=".12"><title>{p.label}</title></rect>})}
 {shaft&&(()=>{const r=rect(shaft);return <rect x={r.x} y={r.y} width={r.w} height={r.d} fill="#b2e1d6" stroke="#08766c" strokeWidth=".24"/>})()}
 {otsGrilleBars(plan).map((p,i)=>{const r=rect(p);return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.d} fill="#126d5b"/>})}
 </svg><p className="nroad-small">Grey: slab · cream: open terrace / balcony · green grid: actual modeled shaft. Concept only; engineered grille and drainage require professional review.</p>
 </section>;
}
function terraceShare(p:PlanModel){let highest=0;for(let floor=1;floor<p.floors;floor++){const rooms=p.rooms.filter(r=>r.floor===floor&&!isOtsRoom(r)),total=rooms.reduce((n,r)=>n+r.w*r.d,0);if(total)highest=Math.max(highest,rooms.filter(r=>r.kind==="terrace").reduce((n,r)=>n+r.w*r.d,0)/total);}return highest;}
export function RoadPlanWorkbench({initialBrief,initialOption=-1}:{initialBrief?:PlanBrief;initialOption?:number}={}){
 const [brief,setBrief]=useState<PlanBrief>(()=>initialBrief??initial),[chosen,setChosen]=useState(Number.isInteger(initialOption)&&initialOption>=0&&initialOption<38?initialOption:-1);
 const [floor,setFloor]=useState(0),[roofView,setRoofView]=useState(false),[hindi,setHindi]=useState(false),[palette,setPalette]=useState<(typeof colours)[number]["id"]>("ivory");
 const [kitOverride,setKit]=useState<PlanModel["facade"]["kit"]|null>(null);
 const [threeReady,setThreeReady]=useState(false),[streetReady,setStreetReady]=useState(false);
 const threeSection=useRef<HTMLDivElement>(null);
 const [saving,setSaving]=useState(false),[saveInfo,setSaveInfo]=useState("");
 const saveLock=useRef(false),retryKey=useRef<{fingerprint:string;key:string}|null>(null);
 const [stairReady,setStairReady]=useState(false);
 const result=useMemo(()=>{
  if(stairReady)return generateStairReadyPortfolio(brief,24);
  const base=generateSpatialPortfolio(brief,24);
  const seen=new Set(base.plans.map(physicalPlanSignature));
  const specific=[...generateCoveredUpperPortfolio(brief),...generateEnclosedUpperPortfolio(brief)];
  const generic=generateUsableUpperPortfolio(brief,base.plans,14);
  const extra=[...specific,...generic].sort((a,b)=>terraceShare(a)-terraceShare(b)).filter(p=>{const signature=physicalPlanSignature(p);if(seen.has(signature))return false;seen.add(signature);return true;}).slice(0,14);
  return {...base,plans:[...base.plans,...extra]};
 },[brief,stairReady]);

 const [entranceFilter,setEntranceFilter]=useState<"all"|ReturnType<typeof entranceArrangement>>("all");
 const [representativesOnly,setRepresentativesOnly]=useState(false);
 const [kitchenFilter,setKitchenFilter]=useState<"all"|"front"|"middle"|"rear">("all");
 const [preferCovered,setPreferCovered]=useState(true);
 const [terracePreference,setTerracePreference]=useState<"recommended"|"all"|"compact"|"large">(initialOption>=0?"all":"recommended");
 
 const matching=useMemo(()=>result.plans.map((p,i)=>({p,i})).filter(({p})=>(entranceFilter==="all"||entranceArrangement(p)===entranceFilter)&&(kitchenFilter==="all"||kitchenZone(p)===kitchenFilter)),[result,entranceFilter,kitchenFilter]);
 const representativeSet=useMemo(()=>new Set(representativeIndices(matching,({p})=>architectureTopology(p))),[matching]);
 const filtered=useMemo(()=>{
  const candidates=matching.filter((_,i)=>!representativesOnly||representativeSet.has(i));
  const compact=candidates.filter(({p})=>terraceShare(p)<=.2);
  const choices=terracePreference==="recommended"?(compact.length?compact:candidates):terracePreference==="all"?candidates:terracePreference==="compact"?compact:candidates.filter(({p})=>terraceShare(p)>.2);
  const openArea=(p:PlanModel)=>p.rooms.filter(r=>r.floor>0&&r.kind==="terrace"&&!isOtsRoom(r)).reduce((n,r)=>n+r.w*r.d,0);
  return preferCovered?[...choices].sort((a,b)=>terraceShare(a.p)-terraceShare(b.p)||openArea(a.p)-openArea(b.p)||a.i-b.i):choices;
 },[matching,representativesOnly,representativeSet,preferCovered,terracePreference]);
 const attachedSite=brief.setbacks.leftFt<3&&brief.setbacks.rightFt<3;
 const [windowPreference,setEnhanceVentilation]=useState<boolean|null>(null),[shaftPreference,setIncludeOts]=useState<boolean|null>(null);
 const enhanceVentilation=windowPreference??attachedSite,includeOts=shaftPreference??attachedSite;
 const [shaftPosition,setShaftPosition]=useState<OtsPosition|"auto">("auto");
 const location=shaftPosition==="auto"?undefined:shaftPosition;
 // Pick the initial recommendation before publishing either preview. A bounded
 // deterministic search avoids a delayed automatic switch after a user starts
 // inspecting a floor. Exhaustive shaft search remains an explicit action.
 const activeOption=useMemo(()=>{
  if(filtered.some(({i})=>i===chosen))return chosen;
  const first=filtered[0]?.i??(result.plans[chosen]?chosen:0);
  if(chosen>=0||!attachedSite||!includeOts||!filtered.length)return first;
  // Prefer a shaft in the same compact-terrace category; do not trade a usable
  // upper floor for a large terrace just to manufacture a shaft recommendation.
  const compact=terraceShare(filtered[0].p)<=.2;
  for(const {p,i} of filtered.slice(0,4)){
   if(compact&&terraceShare(p)>.2)break;
   if(airOptimizedPlan(p,true,enhanceVentilation,location).rooms.some(isOtsRoom))return i;
  }
  return first;
 },[chosen,filtered,result.plans,attachedSite,includeOts,enhanceVentilation,location]);
 const baseDraft=result.plans[activeOption]??null;
 const [airFeedback,setAirFeedback]=useState<{scope:string;message:string}|null>(null),[airBusy,setAirBusy]=useState(false);
 const airLock=useRef(false),airScopeRef=useRef("");
 const airScope=JSON.stringify([briefKey(brief),stairReady,entranceFilter,kitchenFilter,representativesOnly,terracePreference,includeOts,enhanceVentilation,activeOption,shaftPosition]);
 useLayoutEffect(()=>{airScopeRef.current=airScope;return()=>{airScopeRef.current="";}},[airScope]);
 const draft=useMemo(()=>baseDraft?airOptimizedPlan(baseDraft,includeOts,enhanceVentilation,location):null,[baseDraft,includeOts,enhanceVentilation,location]);
 const addedWindows=draft?.openings.filter(o=>o.id.startsWith("vent-v1-")||o.id.startsWith("ots-v1-window-")).length??0;
 const shaftModeled=!!draft?.rooms.some(isOtsRoom);
 const shaftRoom=draft?.rooms.find(isOtsRoom);
 const shaftLabel=shaftRoom&&draft?otsPositionOf(draft,shaftRoom):null;
 function changeAir(option:"windows"|"shaft",value:boolean){setChosen(activeOption);if(option==="windows")setEnhanceVentilation(value);else setIncludeOts(value);setAirFeedback(null);setSaveInfo("");}
 async function bestAir(requireShaft=false){
  if(airLock.current)return;
  airLock.current=true;setAirBusy(true);setAirFeedback(null);const scope=airScope;
  try{
   const ranked:{i:number;shaft:boolean;score:number}[]=[];
   for(const {p,i} of filtered){
    // Yield between bounded geometry searches so input and scrolling stay responsive.
    await new Promise<void>(resolve=>window.setTimeout(resolve,0));
    if(airScopeRef.current!==scope)return;
    const candidate=airOptimizedPlan(p,requireShaft||includeOts,true,location),shaft=candidate.rooms.some(isOtsRoom);
    if(!requireShaft||shaft)ranked.push({i,shaft,score:ventilationReport(candidate).score});
   }
   if(airScopeRef.current!==scope)return;
   ranked.sort((a,b)=>Number(b.shaft)-Number(a.shaft)||b.score-a.score||terraceShare(result.plans[a.i])-terraceShare(result.plans[b.i])||a.i-b.i);
   if(!ranked.length){setAirFeedback({scope,message:requireShaft?"No feasible aligned roof-jaal reserve in the displayed layouts. Change filters, plot clearance or room requirements.":"No layout available to compare."});return;}
   const next=ranked[0];setEnhanceVentilation(true);if(requireShaft)setIncludeOts(true);setChosen(next.i);setKit(null);setSaveInfo("");
   setAirFeedback({scope:JSON.stringify([briefKey(brief),stairReady,entranceFilter,kitchenFilter,representativesOnly,terracePreference,requireShaft||includeOts,true,next.i,shaftPosition]),message:"Selected layout "+(next.i+1)+" with screened ventilation"+(next.shaft?" and modeled roof-jaal reserve.":"; shaft is not modeled.")});
  }finally{airLock.current=false;setAirBusy(false);}
 }

 const kit=kitOverride??draft?.facade.kit??"simple-parapet";
 const shade=colours.find(c=>c.id===palette)??colours[0];
 const plan=useMemo<PlanModel|null>(()=>draft?{...draft,facade:{...draft.facade,kit,main:shade.main,accent:shade.accent}}:null,[draft,shade,kit]);
 const [finishHistory,setFinishHistory]=useState<Record<string,FinishScheme>>({});
 const finishKey=plan?JSON.stringify([briefKey(brief),plan.id]):"";
 const baseFinishKey=baseDraft?JSON.stringify([briefKey(brief),baseDraft.id]):"";
 const scheme=useMemo(()=>{if(!plan)return null;const defaults=defaultFinishScheme({kind:"residential",plan}),previous=finishHistory[finishKey]??finishHistory[baseFinishKey];
  return {...defaults,...(previous?{glass:previous.glass,cladding:previous.cladding,rooms:Object.fromEntries(Object.entries(defaults.rooms).map(([id,value])=>[id,previous.rooms[id]??value]))}:{}),planId:plan.id,exterior:plan.facade.main,accent:plan.facade.accent};
 },[plan,finishHistory,finishKey,baseFinishKey]);
 const design=useMemo(()=>plan?studioDesignFromPlan(plan):null,[plan]);
 const metrics=useMemo(()=>plan?planMetrics(plan):null,[plan]);
 const siteReview=useMemo(()=>plan?planSiteReview(plan):null,[plan]);
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
  const nav=navigator as Navigator&{connection?:NetworkHint;deviceMemory?:number};
  const observer=new IntersectionObserver(entries=>{
   // Scrolling must not download the large WebGL chunk on a constrained link.
   // The explicit Load interactive 3D button stays available on every network.
   if(entries.some(entry=>entry.isIntersecting)&&!preferLitePreview(nav.connection,nav.onLine)&&!preferLiteDevice({cores:nav.hardwareConcurrency,memory:nav.deviceMemory})){observer.disconnect();setThreeReady(true)}
  },{rootMargin:"120px"});
  observer.observe(node);return()=>observer.disconnect();
 },[hasPlan,threeReady]);
 function update<K extends keyof PlanBrief>(key:K,value:PlanBrief[K]){setEntranceFilter("all");setKitchenFilter("all");setBrief(v=>({...v,[key]:value}));if(key==="floors"&&value===1)setStairReady(false);setChosen(-1);setTerracePreference("recommended");setFloor(0);setRoofView(false);setKit(null);setSaveInfo("")}
 function changeSetback(side:keyof PlanBrief["setbacks"],value:number){setEntranceFilter("all");setKitchenFilter("all");setBrief(v=>({...v,setbacks:{...v.setbacks,[side]:value}}));setChosen(-1);setFloor(0);setRoofView(false);setKit(null)}
 async function saveDraft(){
  if(!draft||saveLock.current)return;
  saveLock.current=true;setSaving(true);setSaveInfo("");
  try{const {createNeervaBrowserClient}=await import("@/modules/supabase/browser");
   const client=createNeervaBrowserClient();
   if(!client){setSaveInfo("Account service is not configured. Your concept is not saved.");return;}
   const session=await client.auth.getSession(),token=session.data.session?.access_token;
   if(!token){setSaveInfo("Sign in to save this concept privately. No plan was saved.");return;}
   const digest=await planGeometryDigest(draft),fingerprint=JSON.stringify([session.data.session?.user.id,brief,draft.id,digest,kit,shade.main,shade.accent,scheme]);
   if(retryKey.current?.fingerprint!==fingerprint)retryKey.current={fingerprint,key:crypto.randomUUID()};
   const response=await fetch("/api/studio/projects",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({idempotencyKey:retryKey.current.key,title:`${brief.widthFt} × ${brief.depthFt} · ${brief.bedrooms} BHK`,brief,variant:draft.variant,planId:draft.id,geometryDigest:digest,finishScheme:scheme??undefined,finish:{kit,main:shade.main,accent:shade.accent}}),cache:"no-store",signal:AbortSignal.timeout(20000)});
   const body=await response.json() as {project?:{id?:string};error?:string};
   setSaveInfo(response.ok&&body.project?.id?"Private concept saved. Not a construction-approved plan.":(body.error??"Project was not saved."));
  }catch{setSaveInfo("Network issue. Your concept was not confirmed saved.");}finally{saveLock.current=false;setSaving(false)}
 }
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
    <div className="nroad-head"><h2>{str("Your plot","आपका प्लॉट")}</h2><span>{brief.widthFt} × {brief.depthFt} ft · {(siteAreaSqFt(brief.widthFt,brief.depthFt,brief.siteShape??{kind:"rectangle"})/9).toFixed(1)} gaj</span></div>
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
      {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} BHK</option>)}</select></label>
     <label>{str("Car parking","कार पार्किंग")}<select name="parking" aria-label={str("Car parking","कार पार्किंग")} value={String(brief.parking)} onChange={e=>update("parking",e.target.value==="true")}>
      <option value="true">Yes · minimum 8 × 16 ft</option><option value="false">No parking</option></select></label>
     <details className="nroad-advanced"><summary>{str("Setbacks (unverified)","सेटबैक (सत्यापित नहीं)")}</summary><p>{str("Only enter setbacks confirmed for your own plot. The engine will refuse layouts that cannot accommodate them.","अपने प्लॉट के सत्यापित सेटबैक ही भरें। जगह कम होने पर प्लान नहीं बनेगा।")}</p>
      {(["frontFt","rearFt","leftFt","rightFt"] as const).map(side=><label key={side}>{side.replace("Ft","")} (ft)
       <input min="0" max="20" step=".5" type="number" value={brief.setbacks[side]} onChange={e=>changeSetback(side,Number(e.target.value))}/></label>)}
     </details>
    </form>
    <fieldset className="nroad-advanced nroad-air-controls"><legend>{str("Ventilation & roof jaal","हवादारी और छत का जाल")}</legend><label className="nroad-air-choice"><input type="checkbox" checked={enhanceVentilation} onChange={e=>changeAir("windows",e.target.checked)}/><span><strong>{str("Add feasible ventilation windows","संभव हवादार खिड़कियाँ जोड़ें")}</strong><small>{str("Recommended · checks actual open space","अनुशंसित · वास्तविक खुली जगह जाँचे")}</small></span></label><label className="nroad-air-choice"><input type="checkbox" checked={includeOts} onChange={e=>changeAir("shaft",e.target.checked)}/><span><strong>{str("Open-to-sky shaft / roof jaal","खुला वेंटिलेशन शाफ्ट / छत का जाल")}</strong><small>{str("Recommended for attached houses; continuous reserve from ground to roof where feasible","जगह होने पर सभी मंज़िलों में खुला शाफ्ट")}</small></span></label><label>Roof-jaal position <select aria-label="Roof-jaal position" disabled={!includeOts} value={shaftPosition} onChange={e=>{setChosen(activeOption);setShaftPosition(e.target.value as typeof shaftPosition);setAirFeedback(null);setSaveInfo("")}}><option value="auto">Automatic · feasible location</option>{otsPositions.map(pos=><option key={pos} value={pos}>{pos.replaceAll("-"," ")}</option>)}</select></label><p className="nroad-air-status" role="status" data-shaft-state={!includeOts?"off":shaftModeled?"modeled":"unavailable"}>{enhanceVentilation?(addedWindows?addedWindows+" additional windows modeled.":"No additional screened window fits this layout."):"Extra windows are off; existing modeled windows remain."} {includeOts?(shaftModeled?"Roof jaal modeled · "+shaftLabel+".":"No aligned roof-jaal reserve fits this layout at the selected position."):"Roof jaal is optional; recommended when both side clearances are restricted."}</p>{includeOts&&<button type="button" className="nroad-recovery-action" disabled={!filtered.length||airBusy} onClick={()=>void bestAir(true)}>Find a layout with roof jaal</button>}<small>{str("Existing room access and required programme are protected. No unsafe opening is forced.","कमरों की आवश्यक जगह और रास्ते सुरक्षित रखे जाते हैं।")}</small>{airBusy?<p role="status">Checking displayed layouts for actual open exposure…</p>:airFeedback?.scope===airScope&&<p role="status">{airFeedback.message}</p>}</fieldset>
    {brief.floors>=2&&<label><input type="checkbox" checked={stairReady} onChange={e=>{setEntranceFilter("all");setKitchenFilter("all");setStairReady(e.target.checked);setChosen(-1);setFloor(0);setRoofView(false);setKit(null);setSaveInfo("")}}/> {str("Show dog-leg stair footprint options","मुड़ने वाली सीढ़ी के विकल्प")}</label>}
    {stairReady&&<p className="nroad-small">These concepts check flight footprints and door landings. Three-level studies also check modeled overhead separation; full headroom, railing and structural review remain required.</p>}
    <p className="nroad-disclaimer">0 ft setbacks are an input placeholder, NOT confirmed legal permission to build to a boundary. Verify all local regulations and car access.</p>
    <Link className="nroad-secondary-link" href="/design-studio/fit">{str("Check other plot sizes and browse existing concepts →","दूसरे प्लॉट आकार देखें →")}</Link>
   </aside>
   <div className="nroad-results">
    {!plan?<section className="nroad-error" role="alert">
     <h2>{str("No circulation-safe plan for this brief","इस मांग के अनुसार सुरक्षित रास्ते वाला प्लान नहीं है")}</h2>
     {fewerLevels&&<><p>{str("No checked multi-level layout fits these plot constraints. Your bedroom count has not been changed.","इस प्लॉट में चुनी गई मंज़िलों का जाँचा हुआ नक्शा नहीं मिला। बेडरूम की संख्या बदली नहीं गई है।")}</p>{alternative&&<button className="nroad-recovery-action" type="button" onClick={()=>update("floors",fewerLevels)}>{fewerLevels===1?str("Show ground-floor 1 BHK plan","एक मंज़िल का 1 BHK नक्शा देखें"):str("Show validated "+fewerLevels+"-level plan",fewerLevels+" मंज़िल का नक्शा देखें")}</button>}</>}
     <ul>{result.blockers.map(msg=><li key={msg}>{msg}</li>)}</ul>
     {!fewerLevels&&<p>{str("Try more usable space, another floor, fewer bedrooms, or review parking and setbacks. Your selected inputs have not been changed. We never shrink rooms below the geometry checks to fabricate a fit.",
       "G+1, कम बेडरूम या पार्किंग/सेटबैक बदलें। गलत नाप वाला नक्शा नहीं दिखाएंगे।")}</p>}
    </section>:<>
     
     <div className="nroad-head nroad-choices"><h2>{str("House layouts matching your requirements","ज्यामिति जाँचे गए ड्राफ्ट")}</h2><span>{filtered.length} of {result.plans.length} layouts · {brief.bedrooms} BHK · {brief.floors} level(s)</span></div>
     <p className="nroad-small nroad-bhk-explanation">{str("BHK = bedrooms, hall and kitchen. Bedrooms are counted across all floors.","BHK = बेडरूम, हॉल और किचन। बेडरूम सभी मंज़िलों के मिलाकर गिने जाते हैं।")}</p>
     <details className="nroad-advanced nroad-filter-panel"><summary>{str("Filter layouts","नक्शे फ़िल्टर करें")}</summary><div className="nroad-layout-filters"><label>Entrance arrangement <select aria-label="Filter entrance arrangement" value={entranceFilter} onChange={e=>{setEntranceFilter(e.target.value as typeof entranceFilter);setKit(null);setSaveInfo("")}}><option value="all">All layouts ({result.plans.length})</option>{(["front-stair","front-bedroom","front-verandah","pedestrian"] as const).map(k=>{const count=result.plans.filter(p=>entranceArrangement(p)===k).length;return <option key={k} value={k} disabled={!count}>{({ "front-stair":"Stairs beside parking","front-bedroom":"Street-facing bedroom","front-verandah":"Verandah / other entry","pedestrian":"Pedestrian only"} as const)[k]} ({count})</option>})}</select></label><label>Kitchen position <select aria-label="Filter kitchen position" value={kitchenFilter} onChange={e=>{setKitchenFilter(e.target.value as typeof kitchenFilter);setKit(null);setSaveInfo("")}}><option value="all">All positions</option>{(["front","middle","rear"] as const).map(zone=>{const count=result.plans.filter(p=>kitchenZone(p)===zone).length;return <option key={zone} value={zone} disabled={!count}>{zone==="rear"?"Rear kitchen":zone==="front"?"Front kitchen":"Middle kitchen"} ({count})</option>})}</select></label><label className="nroad-representative-toggle"><input type="checkbox" checked={representativesOnly} onChange={e=>{setRepresentativesOnly(e.target.checked);setKit(null);setSaveInfo("")}}/> Show different room programmes only ({representativeSet.size})</label></div></details>{filtered.length===0&&<p role="status">No layout matches these filters. Change entrance or kitchen position.</p>}
     {brief.floors>1&&<div className="nroad-advanced"><label><input type="checkbox" checked={preferCovered} onChange={e=>{const enabled=e.target.checked;setPreferCovered(enabled);if(enabled&&filtered.length){const openArea=(p:PlanModel)=>p.rooms.filter(r=>r.floor>0&&r.kind==="terrace"&&!isOtsRoom(r)).reduce((n,r)=>n+r.w*r.d,0);const best=[...filtered].sort((a,b)=>openArea(a.p)-openArea(b.p)||a.i-b.i)[0];setChosen(best.i);setKit(null);setSaveInfo("");}}}/> Prefer more enclosed upper-floor space (less terrace)</label><label>Upper-floor open space <select aria-label="Terrace preference" value={terracePreference} onChange={e=>{setTerracePreference(e.target.value as typeof terracePreference);setChosen(-1);setKit(null);setSaveInfo("");}}><option value="recommended">Recommended · full / compact upper floor</option><option value="all">All valid options · including large terrace</option><option value="compact">Covered / compact terrace (up to 20%)</option><option value="large">Larger terrace (over 20%)</option></select></label><p className="nroad-small">Recommended shows full-covered and compact-terrace layouts when feasible. Larger terraces are available separately; when no compact layout fits, all feasible alternatives remain available. Requested bedroom count stays fixed; necessary open space and roof ventilation are not converted into rooms automatically.</p></div>}
     <div className="nroad-variants" role="group" aria-label="Choose plan layout">{filtered.map(({p:v,i})=>{return <button key={v.id} type="button" aria-pressed={i===activeOption} data-plan-id={v.id}
       onClick={()=>{setChosen(i);if(i!==activeOption){setKit(null);setSaveInfo("")}}}><PlanMiniPreview v={v} i={i}/>
      <strong>{i+1}. {v.rooms.filter(r=>r.kind==="bedroom").length} BHK · {v.floors===1?"Ground":`G+${v.floors-1}`}</strong>
      <span>{!v.parking?str("No car parking","बिना पार्किंग"):v.variant==="parking-left"?str("Parking left","बाईं पार्किंग"):str("Parking right","दाईं पार्किंग")} · {v.rooms.some(r=>r.kind==="stairs"&&r.floor===0&&Math.abs(r.y-v.setbacks.frontFt)<.01)?str("Front stairs","सामने सीढ़ी"):v.rooms.some(r=>r.kind==="bedroom"&&r.floor===0&&Math.abs(r.y-v.setbacks.frontFt)<.01)?str("Front bedroom","सामने बेडरूम"):str("Shared home entry","घर का प्रवेश")}</span>
      {v.floors>1&&<small>{terraceShare(v)>.2?"Large terrace":"Covered / compact"} · {Math.round(terraceShare(v)*100)}% max-floor terrace · {Math.round(v.rooms.filter(r=>r.floor>0&&r.kind==="terrace"&&!isOtsRoom(r)).reduce((n,r)=>n+r.w*r.d,0))} sq ft</small>}
      <small>{str("Kitchen","किचन")} · {kitchenZone(v)} · {v.rooms.some(r=>r.kind==="kitchen"&&r.floor===0&&r.x+r.w/2<v.plot.widthFt/2)?str("left","बाएँ"):str("right","दाएँ")}</small></button>})}</div>
     <p className="nroad-small nroad-selection-feedback" role="status">{str("Layout "+(activeOption+1)+" of "+result.plans.length+" selected. Your matching 2D and 3D views are below.","नक्शा "+(activeOption+1)+" / "+result.plans.length+" चुना गया। नीचे इसी नक्शे के 2D और 3D व्यू हैं।")} <a href="#selected-plan-drawing">{str("View selected plan ↓","चुना नक्शा देखें ↓")}</a></p>
     {result.plans.length<24&&<p className="nroad-small">{str("Only "+result.plans.length+" of the target 24 distinct concepts fit this exact request. We will not duplicate a plan or change your bedroom count to fill the gallery.","इस प्लॉट के लिए 24 के लक्ष्य में से "+result.plans.length+" अलग नक्शे मिले। संख्या पूरी करने के लिए नक्शे दोहराए नहीं जाएंगे।")}</p>}
     <div className="nroad-save"><button type="button" disabled={saving} onClick={()=>void saveDraft()}>{saving?"Saving…":str("Save this plot-specific concept privately","अपना नक्शा सुरक्षित सेव करें")}</button>{saveInfo&&<p role="status">{saveInfo} {saveInfo.startsWith("Sign in")&&<Link href="/account">Sign in →</Link>}</p>}</div>
     <div className="nroad-head" id="selected-plan-drawing"><h2>{str("Plan & room dimensions","प्लान और कमरों का नाप")}</h2><span>Road · {plan.plot.roadSide}</span></div>
     <div className="nroad-floor-tabs" role="group" aria-label="Select floor">
      {Array.from({length:plan.floors},(_,i)=><button key={i} aria-pressed={!roofView&&floor===i} onClick={()=>{setChosen(activeOption);setFloor(i);setRoofView(false)}}>{["Ground floor","First floor","Second floor"][i]}</button>)}
      <button type="button" aria-pressed={roofView} onClick={()=>{setChosen(activeOption);setRoofView(true)}}>Roof / jaal plan</button>
     </div>
     <div className="nroad-plan-summary" data-plan-id={plan.id} data-selected-floor={floor} aria-label="Selected layout summary"><span><strong>#{activeOption+1}</strong> Selected layout</span><span><strong>{plan.rooms.filter(r=>r.kind==="bedroom").length}</strong> Bedrooms total</span><span><strong>{plan.rooms.filter(r=>r.kind==="bedroom"&&r.floor===floor).length}</strong> Bedrooms on this floor</span></div>
     {roofView?<RoofJaalPlan plan={plan}/>:<OrientedPlanDrawing plan={plan} floor={floor} scheme={scheme??undefined}/>}

     <div className="nroad-head"><h2>{str("Plan-matched 3D","इसी प्लान का 3D")}</h2><span>Exterior: all floors · cutaway: selected floor</span></div>
     <div ref={threeSection} className="nroad-3d-slot" data-warm-state="idle">{design&&(threeReady?<Building3D key={plan.id} design={design} colour={shade.main} planModel={plan} selectedFloor={floor} scheme={scheme??undefined}/>:<div className="nroad-loading"><p>{str("Open interactive 3D when needed.","ज़रूरत होने पर 3D व्यू खोलें।")}</p><button type="button" onClick={()=>setThreeReady(true)}>{str("Load interactive 3D","3D व्यू खोलें")}</button></div>)}</div>
     <VentilationPanel plan={plan} floor={floor} enhanced={enhanceVentilation} ots={includeOts} onOts={v=>changeAir("shaft",v)} onEnhance={v=>changeAir("windows",v)} onBest={()=>void bestAir()} onFindShaft={()=>void bestAir(true)} searching={airBusy} addedWindows={addedWindows}/>
     <details className="nroad-advanced nroad-shortlist-panel"><summary>{str("Compare or shortlist layouts","नक्शों की तुलना करें")}</summary>
     <PlanShortlist key={briefKey(brief)} brief={briefKey(brief)} plans={result.plans} selected={baseDraft?.id??plan.id} floor={floor} onChoose={id=>{const i=result.plans.findIndex(p=>p.id===id);if(i>=0){setEntranceFilter("all");setKitchenFilter("all");setRepresentativesOnly(false);setTerracePreference("all");setChosen(i);setKit(null)}}}/>
     </details>

     <div className="nroad-head"><h2>{str("Roadside exterior concept","सड़क की तरफ घर का रूप")}</h2><span>Same front gate geometry</span></div>
     <div className="nroad-exterior-workspace"><label>{str("Exterior finish style","बाहरी डिज़ाइन")}<select name="facadeKit" aria-label={str("Balcony front style","बालकनी का डिज़ाइन")} value={kit} onChange={e=>setKit(e.target.value as typeof kit)}><option value="simple-parapet">Minimal trim</option><option value="cladding-band">Broad cladding band</option><option value="stepped-band">Stepped facade band</option><option value="jali-screen">Vertical accents</option>{plan.rooms.some(r=>r.kind==="balcony")&&<option value="pergola">Pergola shade</option>}{kit==="cantilever"&&<option value="cantilever">Concept finish</option>}</select></label>
     <div className="nroad-street-render"><RoadElevation plan={plan} main={shade.main} accent={shade.accent} glass={scheme?.glass}/>{streetReady?<StreetRender key={JSON.stringify([plan.id,plan.facade,scheme?.glass])} plan={plan} glass={scheme?.glass}/>:<button type="button" className="nroad-recovery-action" onClick={()=>setStreetReady(true)}>Open realistic street render</button>}</div>
     <div className="nroad-palette"><h2>{str("House colour mood","घर की रंग योजना")}</h2>
      <div role="group" aria-label="Choose a named exterior colour palette">{colours.map(x=><button key={x.id} type="button" aria-pressed={palette===x.id} onClick={()=>{setPalette(x.id);setSaveInfo("")}}>
       <i style={{background:x.main}}/><span>{hindi?x.hi:x.en}</span></button>)}</div>
      <ShadeReferenceCard entries={[{label:"Exterior main",value:shade.main},{label:"Exterior accent",value:shade.accent}]} compact/><p className="nroad-small">Digital colours are approximate; check an actual shade card. Finishes and room paint are not physically simulated here.</p><Link href="/design-studio/visualizer" className="nroad-secondary-link">{str("Try paint on sample homes or your own photo →","सैंपल घर या अपनी फोटो पर रंग आज़माएँ →")}</Link>
     </div>
     </div>{metrics&&<details className="nroad-advanced nroad-metrics"><summary>{str("Quick material estimate","प्रारंभिक सामग्री अनुमान")}</summary>
      <div><span><strong>{metrics.roomFloorSqFt.toFixed(0)} ft²</strong><small>Room-floor rectangles, all levels</small></span>
       {plan.parking&&<span><strong>{metrics.parkingSqFt.toFixed(0)} ft²</strong><small>Car bay rectangle</small></span>}
       <span><strong>{metrics.netPaintSqM.toFixed(1)} m²</strong><small>Room-facing painted area</small></span>
       <span><strong>{metrics.paintLitres} L</strong><small>Illustrative 2 coats, 10 m²/L</small></span></div>
      <p className="nroad-small">{metrics.note}</p><Link href="/basket" className="nroad-secondary-link">{str("Open material list →","सामग्री सूची खोलें →")}</Link></details>}
     <InteriorFitPanel plan={plan} floor={floor}/>
     {scheme&&<PlanFinishStudio key={plan.id+":"+floor} source={{kind:"residential",plan}} floor={floor} scheme={scheme} onChange={next=>{setFinishHistory(h=>rememberFinish(h,finishKey,next));setSaveInfo("")}} showExterior={false}/>}
     <StudioProjectExchange key={plan.id} source={{kind:"residential",plan}} scheme={scheme??undefined}/>
     <details className="nroad-advanced nroad-notes"><summary>{str("Professional review & safety","पेशेवर जाँच और सुरक्षा")}</summary>
      {siteReview&&<p className="nroad-small">{siteReview.parking}</p>}
      <ul>{plan.notes.map(x=><li key={x}>{x}</li>)}</ul></details>
     <details className="nroad-advanced"><summary>{str("Detailed Studio report","विस्तृत स्टूडियो रिपोर्ट")}</summary><StudioPremiumTools key={JSON.stringify([brief,plan.id])} product="home_studio" brief={brief} option={activeOption} planId={plan.id} selectedPlan={plan}/></details>
    </>}
   </div>
  </div>
 <SiteFooter/></main>;
}


