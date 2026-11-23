"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import Image from "next/image";
import Link from "next/link";
import {homeVisuals} from "@/modules/home/assets";
import {studioDesigns} from "@/modules/studio/library";
import {rankStudioDesigns,type PlotBrief} from "@/modules/studio/fit";

type Language="en"|"hi";
const copy={
 en:{
 eyebrow:"PLAN · VISUALISE · SOURCE",
 title1:"From your plot.",title2:"To a home worth building.",subhead:"Explore home plans, visualise construction and prepare a clear material list.",
 design:"Design my home",designDesc:"Find concepts that fit your plot",visual:"Shape my house plan",visualDesc:"Explore rooms and building layout",quote:"Get material quote",quoteDesc:"Prepare an itemised request",
 search:"Search construction materials",searchHint:"Cement, TMT, bricks or pipes",searchGo:"Search",
 trust1:"Clear material specifications",trust2:"Dealer status shown honestly",trust3:"Review charges before accepting",
 category:"Explore materials",catDesc:"Choose a category to compare specifications. Dealer stock and prices appear only after verification.",options:"See options",paintLabel:"Explore finishes",
 designs:"A design for every plot",galleryDesc:"Explore 24 draft inspiration concepts. None are approved for building until geometry and city rules are verified.",gallery:"Browse 24 draft inspirations",plan:"View concept plan",concept:"Concept, not construction drawings",
 colour:"Make the exterior yours",colourDesc:"Experiment with shades and see how walls, gates and finishes could look.",colourLink:"Open colour studio",colourDisclaimer:"On-screen shade is approximate. Verify a physical sample.",
 works:"From your plot to materials",worksDesc:"One connected route, with clear limits wherever a service is not yet active.",
 step1:"Design",step1Desc:"Enter plot and room needs",step2:"Visualise",step2Desc:"Explore plans and colour ideas",step3:"Quote",step3Desc:"Prepare material requirements",step4:"Track",step4Desc:"Order tracking after service activation",
 offers:"Seasonal offers",offerEmpty:"No verified, scheduled offers are available right now. Prices are confirmed by dealers when the service is active.",
 pros:"Building professionally?",dealer:"For material dealers",dealerDesc:"Explore supplier participation. Applications open after identity verification is configured.",contractor:"For contractors",contractorDesc:"Plan repeat requirements and bulk material specifications.",learn:"See access status",prepare:"Prepare a quote",
 faq:"Questions, answered",faq1:"Are these ready-to-build plans?",ans1:"No. Concepts need licensed architect/engineer review and local approvals.",faq2:"Are material prices live?",ans2:"No verified dealer inventory or prices are connected yet. Avoid relying on example amounts.",faq3:"Can I submit or track an order?",ans3:"The account and order service is not configured. You can browse materials and prepare a request; do not expect a confirmed booking.",
 foot:"Concept designs only. No orders or dealer prices are presented as active until verified.",cityNote:"Coverage and delivery require dealer confirmation.",
 navDesign:"Home studio",navMaterials:"Materials",navQuote:"Quotes",navGuides:"Guides",
 recent:"Recent searches",noMatch:"No suggestions — see all materials",
 disclaimer:"Illustrative images, including original concept artwork and licensed photography. Not built NEERVA projects or exact selected floor plans.",
 compact:"Illustrative colour mood only — for wall-specific editing, open the colour studio.",
 langButton:"हिन्दी",location:"Service city",custom:"Enter your city",cityConfirm:"Set city",cityCancel:"Cancel",cityInfo:"Coverage will be confirmed before an order.",categories:"Popular categories",emptyCity:"Enter a city name to continue",
 },
 hi:{
 eyebrow:"प्लान · रंग · निर्माण सामग्री",
 title1:"अपने प्लॉट से शुरुआत।",title2:"सपनों का घर बनाइए।",subhead:"प्लान देखें, घर का निर्माण समझें और सामग्री की सूची तैयार करें।",
 design:"घर का डिज़ाइन बनाएं",designDesc:"अपने प्लॉट के लिए प्लान देखें",visual:"घर का लेआउट बनाएं",visualDesc:"कमरों और आकार के विकल्प देखें",quote:"सामग्री का कोटेशन",quoteDesc:"सामग्री की सूची तैयार करें",
 search:"निर्माण सामग्री खोजें",searchHint:"सीमेंट, सरिया, ईंट या पाइप",searchGo:"खोजें",
 trust1:"सामग्री की पूरी जानकारी",trust2:"डीलर की स्थिति स्पष्ट",trust3:"स्वीकार करने से पहले सभी शुल्क देखें",
 category:"निर्माण सामग्री देखें",catDesc:"सामग्री की जानकारी और विकल्प देखें। सत्यापित स्टॉक या रेट उपलब्ध होने पर ही दिखेंगे।",options:"विकल्प देखें",paintLabel:"रंग चुनें",
 designs:"हर प्लॉट के लिए डिज़ाइन",galleryDesc:"मौलिक कॉन्सेप्ट चुनें। तस्वीरें प्रेरणा के लिए हैं, उसी प्लान का रेंडर नहीं।",gallery:"24 ड्राफ्ट कॉन्सेप्ट देखें",plan:"प्लान देखें",concept:"कॉन्सेप्ट, निर्माण ड्रॉइंग नहीं",
 colour:"अपने घर के रंग चुनें",colourDesc:"दीवार, गेट और दूसरी सतहों पर अलग रंग आज़माएं।",colourLink:"कलर स्टूडियो खोलें",colourDisclaimer:"स्क्रीन पर रंग अनुमानित हैं। असली सैंपल जांचें।",
 works:"प्लॉट से सामग्री तक",worksDesc:"हर चरण स्पष्ट है; सेवा उपलब्ध न होने पर सही सूचना दी जाएगी।",
 step1:"प्लान",step1Desc:"प्लॉट और कमरों की जरूरत",step2:"रंग देखें",step2Desc:"प्लान और रंग चुनें",step3:"कोटेशन",step3Desc:"सामग्री की जरूरत बताएं",step4:"ट्रैक",step4Desc:"सेवा शुरू होने पर ऑर्डर ट्रैक करें",
 offers:"वर्तमान ऑफर",offerEmpty:"अभी कोई सत्यापित निर्धारित ऑफर उपलब्ध नहीं है। सेवा शुरू होने पर डीलर कीमत बताएंगे।",
 pros:"निर्माण से जुड़े हैं?",dealer:"सामग्री डीलरों के लिए",dealerDesc:"डीलर पंजीकरण पहचान सत्यापन सेवा सक्रिय होने पर खुलेगा।",contractor:"ठेकेदारों के लिए",contractorDesc:"बल्क सामग्री और दोबारा ऑर्डर की योजना बनाएं।",learn:"अकाउंट की स्थिति",prepare:"कोटेशन तैयार करें",
 faq:"आम सवाल",faq1:"क्या इन प्लानों से सीधे घर बन सकता है?",ans1:"नहीं। लाइसेंस प्राप्त आर्किटेक्ट/इंजीनियर और स्थानीय अनुमति जरूरी है।",faq2:"क्या सामग्री की कीमत अभी लाइव है?",ans2:"नहीं। डीलरों की सत्यापित कीमतें और स्टॉक अभी कनेक्ट नहीं हैं।",faq3:"क्या अभी ऑर्डर हो सकता है?",ans3:"अकाउंट और ऑर्डर सेवा अभी कॉन्फ़िगर नहीं है। फिलहाल सामग्री और कोटेशन विवरण तैयार करें।",
 foot:"ये केवल कॉन्सेप्ट डिज़ाइन हैं। सत्यापन के बिना डीलर कीमत या ऑर्डर सक्रिय नहीं बताए जाएंगे।",cityNote:"डिलीवरी डीलर से पुष्टि होने पर ही मिलेगी।",
 navDesign:"डिज़ाइन स्टूडियो",navMaterials:"सामग्री",navQuote:"कोटेशन",navGuides:"गाइड",
 recent:"पिछली खोज",noMatch:"सुझाव नहीं मिला — सभी सामग्री देखें",
 disclaimer:"ये मुफ्त लाइसेंस वाली प्रतीकात्मक तस्वीरें हैं, NEERVA के बनाए घर या चुने हुए प्लान के रेंडर नहीं।",
 compact:"ये केवल रंगों का उदाहरण है। दीवार के लिए कलर स्टूडियो खोलें।",
 langButton:"English",location:"शहर",custom:"अपने शहर का नाम",cityConfirm:"शहर चुनें",cityCancel:"रद्द करें",cityInfo:"डिलीवरी उपलब्धता की पहले पुष्टि होगी।",categories:"लोकप्रिय श्रेणियां",emptyCity:"शहर का नाम लिखें",
 },
} as const;

type IconName="home"|"palette"|"file"|"search"|"location"|"cart"|"arrow"|"check"|"shield"|"list"|"spark"|"building";
function Icon({name}:{name:IconName}){
 const common={fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 const paths:Record<IconName,React.ReactNode>={
 home:<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-8h6v8"/></>,
 palette:<><circle cx="12" cy="12" r="9"/><path d="M12 21a3 3 0 0 1-2.5-4.5c.7-1 1.7-1.5 3.2-1.5H16a2 2 0 0 0 2-2"/><path d="M7 10h.01M10 7h.01M15 7h.01M18 10h.01"/></>,
 file:<><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/></>,
 search:<><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
 location:<><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
 cart:<><path d="M3 4h2l2.2 11h11.6l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
 arrow:<><path d="M5 12h14m-6-6 6 6-6 6"/></>,
 check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
 shield:<><path d="M12 2 4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></>,
 list:<><path d="M5 6h14M5 12h14M5 18h14"/><circle cx="3" cy="6" r=".5"/></>,
 spark:<><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></>,
 building:<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M10 21v-5h4v5"/></>,
 };
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" {...common}>{paths[name]}</svg>;
}
const items=[
 {id:"steel",en:"TMT & steel",hi:"सरिया / TMT",description:"Grade, diameter and weight",descriptionHi:"ग्रेड, मोटाई और वजन",image:homeVisuals.steel,href:"/materials/steel"},
 {id:"cement",en:"Cement",hi:"सीमेंट",description:"Type, brand and bag size",descriptionHi:"प्रकार, ब्रांड और बैग",image:homeVisuals.cement,href:"/materials/cement"},
 {id:"bricks",en:"Bricks & blocks",hi:"ईंट और ब्लॉक",description:"Clay, fly ash and AAC",descriptionHi:"मिट्टी, फ्लाई ऐश, AAC",image:homeVisuals.bricks,href:"/materials/bricks-blocks"},
 {id:"pipes",en:"Pipes",hi:"पाइप",description:"Plumbing sizes and fittings",descriptionHi:"आकार और फिटिंग",image:homeVisuals.pipes,href:"/materials/plumbing"},
 {id:"paint",en:"Paint & finishes",hi:"पेंट और फिनिश",description:"Explore shades in the studio",descriptionHi:"रंग स्टूडियो में देखें",image:homeVisuals.paint,href:"/design-studio/visualizer"},
 {id:"electrical",en:"Electrical",hi:"इलेक्ट्रिकल",description:"Conduits and fittings",descriptionHi:"पाइप और फिटिंग",image:homeVisuals.electrical,href:"/materials/electrical"},
] as const;
const popular=[["cement","/materials/cement"],["TMT","/materials/steel"],["bricks","/materials/bricks-blocks"],["pipes","/materials/plumbing"]] as const;

export function PremiumHome(){
 const [lang,setLang]=useState<Language>("en");
 const [city,setCity]=useState("Kanpur");
 const [cityCustom,setCityCustom]=useState(false),[cityInput,setCityInput]=useState("");
 const [query,setQuery]=useState(""),[recent,setRecent]=useState<string[]>([]);
 const [split,setSplit]=useState(56),[manual,setManual]=useState(false);
 const [shade,setShade]=useState("#c3ac94");
 const [plot,setPlot]=useState("all"),[designStyle,setDesignStyle]=useState("all");
 const [customWidth,setCustomWidth]=useState(""),[customDepth,setCustomDepth]=useState("");
 const customPlotActive=customWidth.trim()!==""||customDepth.trim()!=="";
 const w=Number(customWidth),d=Number(customDepth);
 const customPlotValid=customWidth.trim()!==""&&customDepth.trim()!==""&&Number.isFinite(w)&&Number.isFinite(d)&&w>=10&&w<=200&&d>=15&&d<=250;
 const fitLink=customPlotValid?`/design-studio/fit?width=${encodeURIComponent(customWidth)}&depth=${encodeURIComponent(customDepth)}`:"/design-studio/fit";
 const t=copy[lang];
 const designs=useMemo(()=>{
  const styled=studioDesigns.filter(design=>designStyle==="all"||designStyle===design.style);
  if(customPlotActive){
   if(!customPlotValid)return [];
   const brief:PlotBrief={widthFt:w,depthFt:d,city:"Kanpur",facing:"North",roadSide:"North",bedrooms:2,floors:1,parking:false};
   return rankStudioDesigns(styled,brief).filter(result=>result.fit.plotDimensionsFit).slice(0,6).map(result=>result.design);
  }
  return styled.filter(design=>plot==="all"||plot===String(design.plot.widthFt)+"x"+design.plot.depthFt).slice(0,6);
 },[plot,designStyle,customPlotActive,customPlotValid,w,d]);
 const suggestions=useMemo(()=>query.trim()?items.filter(item=>(item.en+" "+item.hi+" "+item.description).toLowerCase().includes(query.toLowerCase())).slice(0,4):[],[query]);
 useEffect(()=>{const id=window.setTimeout(()=>{try{const l=localStorage.getItem("neerva-home-lang");if(l==="en"||l==="hi")setLang(l);const r=JSON.parse(localStorage.getItem("neerva-home-search-v1")||"[]");if(Array.isArray(r))setRecent(r.filter((x):x is string=>typeof x==="string"&&x.length<65).slice(0,4));}catch{/* Private browsing: state remains in memory. */}},0);return()=>clearTimeout(id)},[]);
 useEffect(()=>{if(manual)return;const m=window.matchMedia("(prefers-reduced-motion: reduce)");if(m.matches)return;const timer=window.setInterval(()=>setSplit(s=>s>60?38:68),4000);return()=>window.clearInterval(timer)},[manual]);
 function language(){const next=lang==="en"?"hi":"en";setLang(next);try{localStorage.setItem("neerva-home-lang",next)}catch{/* Language still changes for this session */}}
 function submitSearch(event:FormEvent<HTMLFormElement>){const trimmed=query.trim();if(!trimmed){event.preventDefault();return;}const next=[trimmed,...recent.filter(x=>x.toLowerCase()!==trimmed.toLowerCase())].slice(0,4);setRecent(next);try{localStorage.setItem("neerva-home-search-v1",JSON.stringify(next))}catch{/* Optional search history */}}
 function pickCity(value:string){if(value==="custom"){setCityCustom(true);return;}setCityCustom(false);setCity(value);}
 function setOtherCity(event:FormEvent<HTMLFormElement>){event.preventDefault();const cleaned=cityInput.trim().replace(/\s+/g," ").slice(0,60);if(cleaned.length>=2){setCity(cleaned);setCityCustom(false)}}
 return <main className="nbh" id="top">
  <div className="nbh-ribbon"><span>NEERVA BUILD / INDIA</span><span>{t.cityNote}</span></div>
  <header className="nbh-header">
   <Link className="nbh-logo" href="/" aria-label="NEERVA BUILD home"><span className="nbh-logomark">N</span><span>NEERVA <i>BUILD</i></span></Link>
   <nav className="nbh-nav" aria-label="Primary navigation"><Link href="/design-studio">{t.navDesign}</Link><Link href="/materials">{t.navMaterials}</Link><Link href="/quotes">{t.navQuote}</Link><Link href="/blog">{t.navGuides}</Link></nav>
   <div className="nbh-header-actions">
    <label className="nbh-city"><Icon name="location"/><span className="nbh-sr">{t.location}</span><select aria-label={t.location} value={["Kanpur","Noida"].includes(city)?city:"custom"} onChange={e=>pickCity(e.target.value)}><option value="Kanpur">Kanpur</option><option value="Noida">Noida</option><option value="custom">{["Kanpur","Noida"].includes(city)?"Other city":city}</option></select></label>
    <Link className="nbh-icon-link" href="/materials" aria-label={t.navMaterials}><Icon name="search"/></Link>
    <Link className="nbh-icon-link" href="/basket" aria-label={lang==="hi"?"सामग्री सूची":"Material list"}><Icon name="cart"/></Link>
    <button className="nbh-language" type="button" onClick={language}>{t.langButton}</button>
   </div>
  </header>
  {cityCustom&&<form className="nbh-city-form" onSubmit={setOtherCity}><label>{t.custom}<input autoFocus required minLength={2} maxLength={60} value={cityInput} onChange={e=>setCityInput(e.target.value)} placeholder="Lucknow" /></label><div><button type="submit">{t.cityConfirm}</button><button type="button" onClick={()=>setCityCustom(false)}>{t.cityCancel}</button></div><small>{t.cityInfo}</small></form>}
  <section className="nbh-hero" aria-labelledby="nbh-h1">
   <div className="nbh-hero-copy">
    <p className="nbh-eyebrow"><span className="nbh-dot"/> {t.eyebrow}</p>
    <h1 id="nbh-h1">{t.title1}<span>{t.title2}</span></h1>
    <p className="nbh-sub">{t.subhead}</p>
    <div className="nbh-journeys">
     <Link className="nbh-journey nbh-primary" href="/design-studio/fit"><span className="nbh-jicon"><Icon name="home"/></span><span><strong>{t.design}</strong><small>{t.designDesc}</small></span><Icon name="arrow"/></Link>
     <Link className="nbh-journey" href="/design-studio/workbench"><span className="nbh-jicon"><Icon name="building"/></span><span><strong>{t.visual}</strong><small>{t.visualDesc}</small></span><Icon name="arrow"/></Link>
     <Link className="nbh-journey" href="/quotes"><span className="nbh-jicon"><Icon name="file"/></span><span><strong>{t.quote}</strong><small>{t.quoteDesc}</small></span><Icon name="arrow"/></Link>
    </div>
    <form className="nbh-search" action="/materials" method="get" onSubmit={submitSearch} role="search"><Icon name="search"/><input aria-label={t.search} name="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchHint} maxLength={80}/><button type="submit">{t.searchGo}</button></form>
    {suggestions.length>0?<div className="nbh-suggestions" aria-label="Search suggestions">{suggestions.map(item=><Link key={item.id} href={item.href}>{lang==="hi"?item.hi:item.en}<Icon name="arrow"/></Link>)}</div>:null}
    <div className="nbh-chip-line"><span>{t.categories}</span>{popular.map(([name,href])=><Link key={name} href={href}>{name}</Link>)}</div>
    {recent.length>0&&<div className="nbh-recent"><small>{t.recent}</small>{recent.map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div>}
   </div>
   <div className="nbh-hero-visual">
    <div className="nbh-house-frame">
     <div className="nbh-house-link" aria-label="Illustrative construction site and completed home comparison"><Image src={homeVisuals.hero} fill priority sizes="(max-width: 720px) 100vw, 48vw" alt="Original NEERVA concept illustration showing a completed two-storey house" className="nbh-house-photo"/><span className="nbh-house-tone" style={{clipPath:"inset(0 "+(100-split)+"% 0 0)"}}><Image src={homeVisuals.construction} fill sizes="(max-width: 720px) 100vw, 48vw" alt="" aria-hidden="true" className="nbh-house-photo"/></span></div>
     <span className="nbh-house-chip">FROM CONSTRUCTION TO YOUR DREAM HOME <Icon name="spark"/></span>
     <span className="nbh-image-tag nbh-tag-before" style={{left:Math.min(90,Math.max(9,split-15))+"%"}}>UNDER CONSTRUCTION</span><span className="nbh-image-tag nbh-tag-after">FINISHED HOME</span>
     <label className="nbh-slider-label"><span>Construction stage <strong>← Drag to explore →</strong> Finished home</span><input type="range" min={5} max={95} step={1} value={split} onChange={e=>{setManual(true);setSplit(Number(e.target.value))}} aria-label="Compare illustrative construction-stage and completed homes"/></label>
    </div>
    <p className="nbh-image-note">Original matched architectural concept drawings, not photos or a completed NEERVA project. <Link href="/design-studio/fit">Find designs for your plot →</Link></p>
   </div>
  </section>
  <section className="nbh-trust" aria-label="Platform approach"><span><Icon name="list"/>{t.trust1}</span><span><Icon name="shield"/>{t.trust2}</span><span><Icon name="check"/>{t.trust3}</span></section>
  <section className="nbh-section nbh-materials" id="materials"><div className="nbh-section-head"><div><p className="nbh-eyebrow">01 / MATERIALS</p><h2>{t.category}</h2><p>{t.catDesc}</p></div><Link href="/materials" className="nbh-section-link">{t.navMaterials} <Icon name="arrow"/></Link></div>
   <div className="nbh-category-grid">{items.map(item=><Link href={item.href} className="nbh-material-card" key={item.id}><div className="nbh-material-image"><Image src={item.image} fill sizes="(max-width:600px) 48vw, (max-width:1000px) 30vw, 16vw" alt={"Illustrative construction and design photography for "+item.en} loading="lazy"/></div><div className="nbh-material-info"><h3>{lang==="hi"?item.hi:item.en}</h3><p>{lang==="hi"?item.descriptionHi:item.description}</p><span>{item.id==="paint"?t.paintLabel:t.options} <Icon name="arrow"/></span></div></Link>)}</div>
   <p className="nbh-fineprint">{t.disclaimer}</p>
  </section>
  <section className="nbh-section nbh-featured" id="designs"><div className="nbh-section-head"><div><p className="nbh-eyebrow">02 / HOME STUDIO</p><h2>{t.designs}</h2><p>{t.galleryDesc}</p></div><Link href="/design-studio/library" className="nbh-section-link">{t.gallery} <Icon name="arrow"/></Link></div>
   <div className="nbh-filter-row"><label>Preset <select value={plot} onChange={e=>{setPlot(e.target.value);setCustomWidth("");setCustomDepth("")}}><option value="all">All sizes</option>{["15x30","20x40","25x40","30x40","30x50","40x60"].map(v=><option key={v} value={v}>{v.replace("x"," × ")} ft</option>)}</select></label><label>Or your width (ft)<input type="number" inputMode="decimal" min="10" max="200" step="0.5" placeholder="e.g. 18" value={customWidth} onChange={e=>setCustomWidth(e.target.value)}/></label><label>Depth (ft)<input type="number" inputMode="decimal" min="15" max="250" step="0.5" placeholder="e.g. 50" value={customDepth} onChange={e=>setCustomDepth(e.target.value)}/></label><label>Style <select value={designStyle} onChange={e=>setDesignStyle(e.target.value)}><option value="all">All styles</option>{["warm-modern","sandstone-calm","urban-slate","terracotta-ivory"].map(s=><option key={s} value={s}>{s.replaceAll("-"," ")}</option>)}</select></label></div>
   {customPlotActive&&<p className="nbh-custom-fit" role="status">{customPlotValid?`Your ${w} × ${d} ft plot: showing concepts whose existing footprint fits the dimensions (not a custom-generated floor plan).`:"Enter both valid plot dimensions (width 10–200 ft; depth 15–250 ft)."} <Link href={fitLink}>Open detailed plot fit and room requirements →</Link></p>}
   {designs.length===0?<div className="nbh-empty"><p>{customPlotActive?"No existing concept fits the entered dimensions. Do not stretch a fixed plan and call it a custom design.":"No concept matches this filter."}</p><Link href={fitLink}>Review your custom plot →</Link><button onClick={()=>{setPlot("all");setDesignStyle("all");setCustomWidth("");setCustomDepth("")}}>Show all designs</button></div>:<div className="nbh-design-scroll">{designs.map((d,i)=><Link className="nbh-design-card" href={"/design-studio/library/"+d.slug} key={d.slug}><div className="nbh-design-image"><Image src={[homeVisuals.warm,homeVisuals.slate,homeVisuals.nature,homeVisuals.hero][i%4]} fill sizes="(max-width: 600px) 80vw, 350px" loading="lazy" alt={"Illustrative modern home exterior inspiration, not the rendered "+d.title+" plan"}/><span>{d.plot.widthFt} × {d.plot.depthFt} FT</span></div><div className="nbh-design-text"><h3>{lang==="hi"?d.titleHi:d.title}</h3><p>{d.bedrooms} BHK · {d.floors===1?"Ground":"G+1"} · {d.facing}</p><span>{t.plan} <Icon name="arrow"/></span></div></Link>)}</div>}
   <p className="nbh-fineprint">{t.concept}. {t.disclaimer}</p>
  </section>
  <section className="nbh-colour" id="colour"><div className="nbh-colour-preview"><div className="nbh-facade" style={{background:shade}}><span className="nbh-slab"/><span className="nbh-window"/><span className="nbh-wood"/><span className="nbh-gate"/></div><div className="nbh-swatches" aria-label="Try colour preview">{["#c3ac94","#d9ded7","#9daea3","#c07f61","#748484"].map(c=><button type="button" key={c} aria-label={"Preview shade "+c} aria-pressed={shade===c} onClick={()=>setShade(c)} style={{backgroundColor:c}}/>)}</div></div><div className="nbh-colour-copy"><p className="nbh-eyebrow">03 / COLOUR STUDIO</p><h2>{t.colour}</h2><p>{t.colourDesc}</p><p className="nbh-fineprint">{t.colourDisclaimer}</p><Link className="nbh-outline-link" href="/design-studio/visualizer">{t.colourLink} <Icon name="arrow"/></Link></div></section>
  <section className="nbh-section nbh-work"><div className="nbh-section-head"><div><p className="nbh-eyebrow">04 / A CLEARER JOURNEY</p><h2>{t.works}</h2><p>{t.worksDesc}</p></div></div><div className="nbh-steps">{([[t.step1,t.step1Desc],[t.step2,t.step2Desc],[t.step3,t.step3Desc],[t.step4,t.step4Desc]] as const).map(([title,description],i)=><div key={title}><span>{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
  <section className="nbh-section nbh-offers"><div className="nbh-section-head"><div><p className="nbh-eyebrow">05 / TRANSPARENT PRICING</p><h2>{t.offers}</h2><p>{t.offerEmpty}</p></div></div><Link className="nbh-section-link" href="/materials">{t.navMaterials} <Icon name="arrow"/></Link></section>
  <section className="nbh-section nbh-pros"><div className="nbh-section-head"><div><p className="nbh-eyebrow">06 / PROFESSIONALS</p><h2>{t.pros}</h2></div></div><div className="nbh-pro-grid"><div><Icon name="building"/><h3>{t.dealer}</h3><p>{t.dealerDesc}</p><Link href="/account">{t.learn} <Icon name="arrow"/></Link></div><div><Icon name="list"/><h3>{t.contractor}</h3><p>{t.contractorDesc}</p><Link href="/quotes">{t.prepare} <Icon name="arrow"/></Link></div></div></section>
  <section className="nbh-section nbh-faq"><h2>{t.faq}</h2>{([[t.faq1,t.ans1],[t.faq2,t.ans2],[t.faq3,t.ans3]] as const).map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
  <footer className="nbh-footer nbh-footer-expanded"><div className="nbh-footer-brand"><Link className="nbh-logo" href="/"><span className="nbh-logomark">N</span><span>NEERVA <i>BUILD</i></span></Link><p>Plan confidently. Compare materials. Build with clarity.</p><p className="nbh-fineprint">{t.foot}</p></div><nav aria-label="Footer design and planning"><strong>Plan a home</strong><Link href="/design-studio/fit">Custom plot fit</Link><Link href="/design-studio/library">Browse concepts</Link><Link href="/design-studio/workbench">Concept workbench</Link><Link href="/design-studio/visualizer">Exterior colour studio</Link></nav><nav aria-label="Footer marketplace"><strong>Materials & services</strong><Link href="/materials">Construction materials</Link><Link href="/basket">Material list</Link><Link href="/quotes">Prepare a quote</Link><Link href="/account">Dealer / professional access</Link></nav><nav aria-label="Footer resources"><strong>Resources</strong><Link href="/blog">Building guides</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms & limitations</Link><Link href="/returns">Returns & refunds</Link></nav><div className="nbh-footer-bottom"><small>© 2026 NEERVA BUILD · Made for builders in India</small><small>Concept plans require local engineering review and approvals. Stock and offers subject to dealer confirmation.</small></div></footer>
 </main>;
}
