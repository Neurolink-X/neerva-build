"use client";
import {useEffect,useMemo,useState} from "react";
import dynamic from "next/dynamic";
import {OrientedPlanDrawing} from "./oriented-plan-drawing";
import {generateSpatialPortfolio} from "@/modules/studio/road-generator";
import {studioDesignFromPlan} from "@/modules/studio/plan-model-adapter";
const Building=dynamic(()=>import("./studio-building-3d").then(m=>m.StudioBuilding3D),{ssr:false});
import Link from "next/link";
import {SiteFooter} from "@/components/site-chrome";
import {studioDesigns,formatLevels} from "@/modules/studio/library";
import {DESIGN_CITIES,designCityStatus,rankStudioDesigns,sqFtToGaj,toFeet,type PlotBrief,type PlotUnit,type Facing,validatePlotBrief} from "@/modules/studio/fit";
const dirs:Facing[]=["North","East","South","West"];
const initial:PlotBrief={widthFt:20,depthFt:40,city:"Kanpur",facing:"North",roadSide:"North",bedrooms:2,floors:2,parking:true};
export function StudioPlotFitFinder(){
 const [brief,setBrief]=useState<PlotBrief>(initial),[unit,setUnit]=useState<PlotUnit>("ft"),[width,setWidth]=useState("20"),[depth,setDepth]=useState("40"),[lang,setLang]=useState<"en"|"hi">("en"),[showAll,setShowAll]=useState(false);
 useEffect(()=>{
  // URL prefill is a browser-only preference; preserve server/client hydration parity.
  const timer=window.setTimeout(()=>{
   const params=new URLSearchParams(window.location.search);
   const w=Number(params.get("width")),d=Number(params.get("depth"));
   if(!params.has("width")||!params.has("depth")||!Number.isFinite(w)||!Number.isFinite(d)||w<10||w>200||d<15||d>250)return;
   setWidth(String(w));setDepth(String(d));
   setBrief(current=>({...current,widthFt:w,depthFt:d}));
  },0);
  return()=>window.clearTimeout(timer);
 },[]);

 const update=<K extends keyof PlotBrief>(field:K,value:PlotBrief[K])=>{setBrief(p=>({...p,[field]:value}));setShowAll(false)};
 function updateDimension(field:"widthFt"|"depthFt",raw:string){if(field==="widthFt")setWidth(raw);else setDepth(raw);const n=Number(raw);update(field,raw.trim()===""?NaN:toFeet(n,unit));}
 function changeUnit(next:PlotUnit){setUnit(next);const w=Number.isFinite(brief.widthFt)?brief.widthFt*(next==="m"?.3048:1):NaN;const d=Number.isFinite(brief.depthFt)?brief.depthFt*(next==="m"?.3048:1):NaN;setWidth(Number.isFinite(w)?String(Number(w.toFixed(2))):"");setDepth(Number.isFinite(d)?String(Number(d.toFixed(2))):"");}
 const errors=useMemo(()=>validatePlotBrief(brief),[brief]);
 const ranked=useMemo(()=>errors.length?[]:rankStudioDesigns(studioDesigns,brief),[brief,errors.length]);
 const candidates=showAll?ranked:ranked.slice(0,6);
 const roadCode=({North:"N",East:"E",South:"S",West:"W"} as const)[brief.roadSide];
 const portfolioParams=new URLSearchParams({width:String(brief.widthFt),depth:String(brief.depthFt),
  road:roadCode,floors:String(brief.floors),bedrooms:String(brief.bedrooms),parking:String(brief.parking)});
 const portfolioHref="/design-studio/portfolio?"+portfolioParams.toString();
 const [showModel,setShowModel]=useState(false);
 const [selectedFloor,setSelectedFloor]=useState(0);
 const preview=useMemo(()=>errors.length?null:generateSpatialPortfolio({
  widthFt:brief.widthFt,depthFt:brief.depthFt,roadSide:roadCode,floors:brief.floors as 1|2|3,
  bedrooms:brief.bedrooms,parking:brief.parking,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}
 },1),[brief,roadCode,errors.length]);
 const plan=preview?.plans[0];
 const design=useMemo(()=>plan?studioDesignFromPlan(plan):null,[plan]);
 const floor=plan?Math.min(selectedFloor,plan.floors-1):0;
 const t=lang==="hi"?{
   heading:"पहले अपना प्लॉट समझें",sub:"चौड़ाई, लंबाई और सड़क की दिशा बताएं। आपके नाप से कमरों का नक्शा और उसी घर का 3D रूप बनता है।",
   city:"योजना शहर",width:"चौड़ाई",depth:"लंबाई",units:"माप",facing:"मुख दिशा",road:"सड़क की तरफ",
   bedrooms:"बेडरूम",floors:"मंज़िलें",parking:"कार पार्किंग",yes:"चाहिए",no:"नहीं चाहिए",
   showing:"पुराने डिज़ाइन की प्रेरणा",more:"सभी पुराने कॉन्सेप्ट",less:"कम दिखाएं",view:"प्रेरणा देखें",
   hint:"केवल शुरुआती योजना। स्थानीय अनुमति की पुष्टि अभी नहीं हुई है।",
   missing:"आपकी शर्तों के लिए परिणाम नहीं मिले। प्लॉट का आकार जांचें।"
  }:{
   heading:"Start with your actual plot.",sub:"Check land width, depth and road direction here. See room dimensions and a matching 3D concept as you change your plot.",
   city:"Planning city",width:"Plot width",depth:"Plot depth",units:"Units",facing:"Home facing",road:"Road side",
   bedrooms:"Bedrooms",floors:"Floors",parking:"Car parking",yes:"Needed",no:"Not needed",
   showing:"Inspiration from existing designs",more:"See all older concepts",less:"Show fewer",view:"Explore inspiration",
   hint:"Planning guidance only. Local regulations and approvals are not verified.",
   missing:"No concepts match this brief. Review your plot dimensions."
  };
 return <div className="nfit">
  <header className="nfit-nav"><Link href="/">NEERVA BUILD</Link><div><Link href="/design-studio/library">24 concepts</Link><button type="button" onClick={()=>setLang(x=>x==="en"?"hi":"en")}>{lang==="en"?"हिन्दी":"English"}</button></div></header>
  <section className="nfit-hero"><span className="nfit-kicker">PLOT FIRST · NO APPROVED BUILDING CLAIMS</span><h1>{t.heading}</h1><p>{t.sub}</p><p className="nfit-notice">Concept only. Verify with a licensed architect/engineer and local authority approval.</p></section>
  <section className="nfit-layout"><div className="nfit-form">
   <h2>1. {lang==="hi"?"प्लॉट व ज़रूरत":"Your plot & needs"}</h2>
   <div className="nfit-fields">
    <label>{t.city}<select value={brief.city} onChange={e=>update("city",e.target.value)}>{DESIGN_CITIES.map(c=><option key={c}>{c}</option>)}</select></label>
    <label>{t.units}<select value={unit} onChange={e=>changeUnit(e.target.value as PlotUnit)}><option value="ft">Feet</option><option value="m">Metres</option></select></label>
    <label>{t.width} ({unit})<input type="number" value={width} min="0" step="any" inputMode="decimal" onChange={e=>updateDimension("widthFt",e.target.value)}/></label>
    <label>{t.depth} ({unit})<input type="number" value={depth} min="0" step="any" inputMode="decimal" onChange={e=>updateDimension("depthFt",e.target.value)}/></label>
    
    <label>{t.road}<select value={brief.roadSide} onChange={e=>{const road=e.target.value as Facing;setBrief(previous=>({...previous,roadSide:road,facing:road}));setShowAll(false)}}>{dirs.map(d=><option key={d}>{d}</option>)}</select></label>
    <label>{t.bedrooms}<select value={brief.bedrooms} onChange={e=>update("bedrooms",Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label htmlFor="nfit-floors">{t.floors}<select id="nfit-floors" value={brief.floors} onChange={e=>update("floors",Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label>{t.parking}<select value={brief.parking?"yes":"no"} onChange={e=>update("parking",e.target.value==="yes")}><option value="yes">{t.yes}</option><option value="no">{t.no}</option></select></label>
   </div>
   {errors.length>0?<div role="alert" className="nfit-error">{errors.join(" ")}</div>:<p className="nfit-area">{brief.widthFt.toFixed(1)} × {brief.depthFt.toFixed(1)} ft · {Math.round(brief.widthFt*brief.depthFt)} sq ft · {sqFtToGaj(brief.widthFt*brief.depthFt).toFixed(1)} square gaj</p>}
   {plan&&design?<section className="nfit-primary-next">
    <h3>{lang==="hi"?"आपका प्लॉट-विशिष्ट नक्शा":"Your plot-specific plan"} · {plan.rooms.filter(r=>r.kind==="bedroom").length} BHK</h3>
    <div className="nfit-floor-tabs" role="group" aria-label="Select floor">{Array.from({length:plan.floors},(_,i)=><button type="button" key={i} aria-pressed={floor===i} onClick={()=>setSelectedFloor(i)}>{(lang==="hi"?["भूतल","पहली मंज़िल","दूसरी मंज़िल"]:["Ground floor","First floor","Second floor"])[i]}</button>)}</div>
    <p>{plan.rooms.filter(r=>r.kind==="bedroom"&&r.floor===floor).length} bedrooms on this floor · {plan.rooms.filter(r=>r.kind==="bedroom").length} total</p>
    <OrientedPlanDrawing plan={plan} floor={floor}/>
    <button type="button" aria-expanded={showModel} onClick={()=>setShowModel(v=>!v)}>{lang==="hi"?"3D घर देखें / बंद करें":"Show / hide matching 3D house"}</button>
    {showModel&&<Building key={`${plan.id}-${floor}`} design={design} planModel={plan} colour={plan.facade.main} selectedFloor={floor}/>}
    <Link href={portfolioHref}>{lang==="hi"?"सभी मंज़िलें और विकल्प देखें →":"Explore floors, front elevation and layout options →"}</Link>
   </section>:preview&&<p role="status">{preview.blockers.join(" ")}</p>}
   <p className="nfit-caution">{designCityStatus}</p><p className="nfit-footnote">Gaj is an area unit (9 sq ft), not a linear dimension. Site setbacks, FAR and vehicle turning must be reviewed separately.</p>
   <Link href="/design-studio/workbench" className="nfit-alt">Need to experiment with room sizes? Open concept workbench →</Link>
  </div>
  <section className="nfit-results" aria-live="polite"><div className="nfit-heading"><div><span className="nfit-kicker">OPTIONAL · ARCHIVED DESIGN INSPIRATION</span><h2>{t.showing}</h2></div><span>{ranked.length} concepts</span></div>
   {errors.length>0?<div className="nfit-empty">{t.missing}</div>:<div className="nfit-list">{candidates.map(({design,fit})=><article key={design.slug} className="nfit-card">
    <div className="nfit-card-top"><div><span className="nfit-tag">{design.plot.widthFt}×{design.plot.depthFt} ft · {formatLevels(design.floors)}</span><h3>{lang==="hi"?design.titleHi:design.title}</h3><p>{design.bedrooms} BHK · {design.facing} facing · {design.parking?"Parking concept":"No parking"}</p></div><div className="nfit-score"><strong>{fit.score}<small>/94</small></strong><span>Concept fit</span></div></div>
    <p className={fit.plotDimensionsFit?"nfit-result-status":"nfit-result-status nfit-blocked"}>{fit.plotDimensionsFit?"Dimensions may fit — approval pending":"Plot is too small for this concept"}</p>
    <ul>{[...fit.blockers,...fit.notes].slice(0,3).map((line,i)=><li key={i}>{line}</li>)}</ul>
    <Link href={"/design-studio/library/"+design.slug} className="nfit-view">{t.view} →</Link>
   </article>)}</div>}
   {ranked.length>6&&<button type="button" className="nfit-more" onClick={()=>setShowAll(v=>!v)}>{showAll?t.less:t.more}</button>}
   <p className="nfit-footnote">{t.hint} These cards are fixed legacy concepts from other plots, not newly drawn plans for your exact plot. Scores do not validate safety or bylaws. Use the direct generator above for spatial layouts.</p>
  </section></section>
  <SiteFooter/>
 </div>
}

