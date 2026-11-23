"use client";
import {useEffect,useMemo,useState} from "react";
import {PlotMassingPreview} from "@/components/plot-massing-preview";
import Link from "next/link";
import {studioDesigns,formatLevels} from "@/modules/studio/library";
import {DESIGN_CITIES,designCityStatus,rankStudioDesigns,sqFtToGaj,toFeet,type PlotBrief,type PlotUnit,type Facing,validatePlotBrief} from "@/modules/studio/fit";
const dirs:Facing[]=["North","East","South","West"];
const initial:PlotBrief={widthFt:20,depthFt:40,city:"Kanpur",facing:"North",roadSide:"North",bedrooms:2,floors:1,parking:true};
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
 const t=lang==="hi"?{
   heading:"आपके प्लॉट के लिए सही विकल्प",sub:"प्लॉट बताएं। सही आकार और सीमाएं जांचें, फिर डिज़ाइन चुनें।",
   city:"योजना शहर",width:"चौड़ाई",depth:"लंबाई",units:"माप",facing:"मुख दिशा",road:"सड़क की तरफ",
   bedrooms:"बेडरूम",floors:"मंज़िलें",parking:"कार पार्किंग",yes:"चाहिए",no:"नहीं चाहिए",
   showing:"मिलते-जुलते कॉन्सेप्ट",more:"सभी 24 देखें",less:"कम दिखाएं",view:"डिज़ाइन और रंग देखें",
   hint:"केवल शुरुआती योजना। स्थानीय अनुमति की पुष्टि अभी नहीं हुई है।",
   missing:"आपकी शर्तों के लिए परिणाम नहीं मिले। प्लॉट का आकार जांचें।"
  }:{
   heading:"Find a home that fits.",sub:"Enter your plot and needs. Compare real dimensions before choosing a concept.",
   city:"Planning city",width:"Plot width",depth:"Plot depth",units:"Units",facing:"Home facing",road:"Road side",
   bedrooms:"Bedrooms",floors:"Floors",parking:"Car parking",yes:"Needed",no:"Not needed",
   showing:"Closest concept matches",more:"See all 24 concepts",less:"Show fewer",view:"Explore plan & colours",
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
    <label>{t.facing}<select value={brief.facing} onChange={e=>update("facing",e.target.value as Facing)}>{dirs.map(d=><option key={d}>{d}</option>)}</select></label>
    <label>{t.road}<select value={brief.roadSide} onChange={e=>update("roadSide",e.target.value as Facing)}>{dirs.map(d=><option key={d}>{d}</option>)}</select></label>
    <label>{t.bedrooms}<select value={brief.bedrooms} onChange={e=>update("bedrooms",Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label>{t.floors}<select value={brief.floors} onChange={e=>update("floors",Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label>{t.parking}<select value={brief.parking?"yes":"no"} onChange={e=>update("parking",e.target.value==="yes")}><option value="yes">{t.yes}</option><option value="no">{t.no}</option></select></label>
   </div>
   {errors.length>0?<div role="alert" className="nfit-error">{errors.join(" ")}</div>:<p className="nfit-area">{brief.widthFt.toFixed(1)} × {brief.depthFt.toFixed(1)} ft · {Math.round(brief.widthFt*brief.depthFt)} sq ft · {sqFtToGaj(brief.widthFt*brief.depthFt).toFixed(1)} square gaj</p>}
   <PlotMassingPreview widthFt={brief.widthFt} depthFt={brief.depthFt} floors={brief.floors} parking={brief.parking}/>
   <p className="nfit-caution">{designCityStatus}</p><p className="nfit-footnote">Gaj is an area unit (9 sq ft), not a linear dimension. Site setbacks, FAR and vehicle turning must be reviewed separately.</p>
   <Link href="/design-studio/workbench" className="nfit-alt">Need to experiment with room sizes? Open concept workbench →</Link>
  </div>
  <section className="nfit-results" aria-live="polite"><div className="nfit-heading"><div><span className="nfit-kicker">2. REVIEW FIT</span><h2>{t.showing}</h2></div><span>{ranked.length} concepts</span></div>
   {errors.length>0?<div className="nfit-empty">{t.missing}</div>:<div className="nfit-list">{candidates.map(({design,fit})=><article key={design.slug} className="nfit-card">
    <div className="nfit-card-top"><div><span className="nfit-tag">{design.plot.widthFt}×{design.plot.depthFt} ft · {formatLevels(design.floors)}</span><h3>{lang==="hi"?design.titleHi:design.title}</h3><p>{design.bedrooms} BHK · {design.facing} facing · {design.parking?"Parking concept":"No parking"}</p></div><div className="nfit-score"><strong>{fit.score}<small>/94</small></strong><span>Concept fit</span></div></div>
    <p className={fit.plotDimensionsFit?"nfit-result-status":"nfit-result-status nfit-blocked"}>{fit.plotDimensionsFit?"Dimensions may fit — approval pending":"Plot is too small for this concept"}</p>
    <ul>{[...fit.blockers,...fit.notes].slice(0,3).map((line,i)=><li key={i}>{line}</li>)}</ul>
    <Link href={"/design-studio/library/"+design.slug} className="nfit-view">{t.view} →</Link>
   </article>)}</div>}
   {ranked.length>6&&<button type="button" className="nfit-more" onClick={()=>setShowAll(v=>!v)}>{showAll?t.less:t.more}</button>}
   <p className="nfit-footnote">{t.hint} Scores rank concepts only; they are not a structural or legal compliance rating. Realistic render assets are not yet approved.</p>
  </section></section>
  <footer className="nfit-footer"><Link href="/design-studio/visualizer">Already have a house? Try its colours →</Link><Link href="/materials">Explore construction materials →</Link></footer>
 </div>
}
