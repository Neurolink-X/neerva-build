"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import Image from "next/image";
import Link from "next/link";
import {homeVisuals,homeReferencePhotos} from "@/modules/home/assets";
import {BrandMark} from "@/components/brand-mark";
import {studioDesigns} from "@/modules/studio/library";
import {rankStudioDesigns,type PlotBrief} from "@/modules/studio/fit";

type Language="en"|"hi";
const copy={
 en:{
 eyebrow:"BUILT FOR INDIA · BUILT FOR EVERY DREAM",
 title1:"Build your dream home.",title2:"Build a stronger India.",subhead:"Every great India begins with strong foundations. Explore materials, plan your plot and compare clear specifications—without hidden cost surprises or false stock promises.",
 design:"Plan my home",designDesc:"Floor plans and colours",visual:"Browse material brands",visualDesc:"Compare grades, sizes and packs",quote:"Prepare material quote",quoteDesc:"Final offer needs verification",
 search:"Search construction materials",searchHint:"Cement, TMT, bricks or pipes",searchGo:"Search",
 trust1:"Clear material specifications",trust2:"Dealer status shown honestly",trust3:"Review charges before accepting",
 category:"Explore materials",catDesc:"Choose a category to compare specifications. Dealer stock and prices appear only after verification.",options:"See options",paintLabel:"Explore finishes",
 designs:"A design for every plot",galleryDesc:"Generate up to 24 spatially different room layouts for your exact rectangular plot. Each matches the 2D and 3D model; all require professional approval.",gallery:"Create 24 plans for my plot",plan:"View concept plan",concept:"Concept, not construction drawings",
 colour:"Make the exterior yours",colourDesc:"Experiment with shades and see how walls, gates and finishes could look.",colourLink:"Open colour studio",colourDisclaimer:"On-screen shade is approximate. Verify a physical sample.",
 works:"From your plot to materials",worksDesc:"One connected route, with clear limits wherever a service is not yet active.",
 step1:"Design",step1Desc:"Enter plot and room needs",step2:"Visualise",step2Desc:"Explore plans and colour ideas",step3:"Quote",step3Desc:"Prepare material requirements",step4:"Track",step4Desc:"Order tracking after service activation",
 offers:"Seasonal offers",offerEmpty:"No verified, scheduled offers are available right now. Prices are confirmed by dealers when the service is active.",
 pros:"Building professionally?",dealer:"For material dealers",dealerDesc:"Explore supplier participation. Applications open after identity verification is configured.",contractor:"For contractors",contractorDesc:"Plan repeat requirements and bulk material specifications.",learn:"See access status",prepare:"Prepare a quote",
 faq:"Questions, answered",faq1:"Are these ready-to-build plans?",ans1:"No. The gallery contains draft ideas, not construction-approved drawings. A licensed architect or engineer must check your plot, soil, structure and city bylaws.",faq2:"Are material prices live?",ans2:"Not yet. There is no confirmed dealer inventory or price feed. Product cards explain grades and units, but a quote becomes binding only after a verified dealer confirms all costs.",faq3:"Why is Submit Quote disabled?",ans3:"Real quotation intake is paused until approved dealers, support, privacy and admin sourcing are operational. Filling the form does not save or create an order.",faq4:"How do I install the app?",ans4:"Use the visible Install NEERVA BUILD help. Chrome may offer Install app; on iPhone Safari use Share then Add to Home Screen. Availability depends on the browser.",faq5:"Can I try paint on my own house photo?",ans5:"Yes. Open Exterior colour studio, choose Use my home photo, upload a JPG/PNG/WebP, tap four wall corners, choose a shade and save the local preview. No image is uploaded.",faq6:"How accurate are 3D views and the 24 designs?",ans6:"They are concept visualisations with limited geometry. Different exterior finishes do not count as distinct architectural floor plans. Always verify setbacks, measurements and structural drawings professionally.",faq7:"Is stock shown on a product guaranteed?",ans7:"No. Until a dealer publishes verified inventory, stock must be labelled unverified. Bulk sand, morang and aggregates require private location-specific freight and unloading terms.",
 foot:"Concept designs only. No orders or dealer prices are presented as active until verified.",cityNote:"Coverage and delivery require dealer confirmation.",
 navDesign:"Home studio",navMaterials:"Materials",navQuote:"Quotes",navGuides:"Guides",
 recent:"Recent searches",noMatch:"No suggestions — see all materials",
 disclaimer:"Licensed real photographs are inspiration only. They are not NEERVA projects, the selected floor plan, or exact construction proposals.",
 compact:"Illustrative colour mood only — for wall-specific editing, open the colour studio.",
 langButton:"हिन्दी",location:"Service city",custom:"Enter your city",cityConfirm:"Set city",cityCancel:"Cancel",cityInfo:"Coverage will be confirmed before an order.",categories:"Popular categories",emptyCity:"Enter a city name to continue",
 },
 hi:{
 eyebrow:"मेरा घर · विकसित भारत का सपना",
 title1:"हर घर मजबूत बने।",title2:"भारत का कल बेहतर बने।",subhead:"अपने सपनों के घर के लिए सही नक्शा, सरिया, सीमेंट और अन्य सामग्री समझें। सभी शुल्क और सप्लायर की पुष्टि के बाद ही आगे बढ़ें।",
 design:"घर का प्लान बनाएं",designDesc:"प्लान और रंग की जानकारी",visual:"सामग्री और ब्रांड देखें",visualDesc:"ग्रेड, नाप और पैक",quote:"कोटेशन तैयार करें",quoteDesc:"ऑर्डर से पहले पुष्टि",
 search:"निर्माण सामग्री खोजें",searchHint:"सीमेंट, सरिया, ईंट या पाइप",searchGo:"खोजें",
 trust1:"सामग्री की पूरी जानकारी",trust2:"डीलर की स्थिति स्पष्ट",trust3:"स्वीकार करने से पहले सभी शुल्क देखें",
 category:"निर्माण सामग्री देखें",catDesc:"सामग्री की जानकारी और विकल्प देखें। सत्यापित स्टॉक या रेट उपलब्ध होने पर ही दिखेंगे।",options:"विकल्प देखें",paintLabel:"रंग चुनें",
 designs:"हर प्लॉट के लिए डिज़ाइन",galleryDesc:"अपने प्लॉट पर 24 तक अलग-अलग कमरों के नक्शे बनाएं। 2D और 3D एक ही डिज़ाइन के हैं। निर्माण से पहले विशेषज्ञ जाँच ज़रूरी है।",gallery:"मेरे प्लॉट पर 24 प्लान बनाएं",plan:"प्लान देखें",concept:"कॉन्सेप्ट, निर्माण ड्रॉइंग नहीं",
 colour:"अपने घर के रंग चुनें",colourDesc:"दीवार, गेट और दूसरी सतहों पर अलग रंग आज़माएं।",colourLink:"कलर स्टूडियो खोलें",colourDisclaimer:"स्क्रीन पर रंग अनुमानित हैं। असली सैंपल जांचें।",
 works:"प्लॉट से सामग्री तक",worksDesc:"हर चरण स्पष्ट है; सेवा उपलब्ध न होने पर सही सूचना दी जाएगी।",
 step1:"प्लान",step1Desc:"प्लॉट और कमरों की जरूरत",step2:"रंग देखें",step2Desc:"प्लान और रंग चुनें",step3:"कोटेशन",step3Desc:"सामग्री की जरूरत बताएं",step4:"ट्रैक",step4Desc:"सेवा शुरू होने पर ऑर्डर ट्रैक करें",
 offers:"वर्तमान ऑफर",offerEmpty:"अभी कोई सत्यापित निर्धारित ऑफर उपलब्ध नहीं है। सेवा शुरू होने पर डीलर कीमत बताएंगे।",
 pros:"निर्माण से जुड़े हैं?",dealer:"सामग्री डीलरों के लिए",dealerDesc:"डीलर पंजीकरण पहचान सत्यापन सेवा सक्रिय होने पर खुलेगा।",contractor:"ठेकेदारों के लिए",contractorDesc:"बल्क सामग्री और दोबारा ऑर्डर की योजना बनाएं।",learn:"अकाउंट की स्थिति",prepare:"कोटेशन तैयार करें",
 faq:"आम सवाल",faq1:"क्या इन प्लानों से सीधे घर बन सकता है?",ans1:"नहीं। ये ड्राफ्ट आइडिया हैं। साइट, संरचना और स्थानीय नियमों की जांच आर्किटेक्ट/इंजीनियर से जरूरी है।",faq2:"क्या सामग्री की कीमत अभी लाइव है?",ans2:"नहीं। ब्रांड/नाप समझ सकते हैं, पर स्टॉक और अंतिम रेट डीलर सत्यापन पर निर्भर हैं।",faq3:"कोटेशन Submit क्यों बंद है?",ans3:"वेरिफाइड डीलर, सपोर्ट और सुरक्षित ऑपरेशन तैयार होने तक रिक्वेस्ट सेव नहीं होगी। फॉर्म भरना ऑर्डर नहीं है।",faq4:"वेबसाइट को ऐप कैसे इंस्टॉल करें?",ans4:"Install NEERVA BUILD निर्देश देखें। Android Chrome में Install app, iPhone Safari में Share से Add to Home Screen चुनें।",faq5:"अपनी दीवार की फोटो पर रंग कैसे देखें?",ans5:"Colour Studio में अपनी फोटो चुनें, दीवार के चार कोने दबाएं, रंग बदलें और फोटो का प्रिव्यू सेव करें। फोटो अपलोड नहीं होती।",faq6:"क्या सभी 24 नक्शे और 3D अलग-अलग हैं?",ans6:"इनमें कई कॉन्सेप्ट और बाहरी फिनिश के विकल्प हैं। इन्हें 24 अलग आर्किटेक्ट-स्वीकृत नक्शे नहीं मानें।",faq7:"क्या प्रोडक्ट का स्टॉक पक्का है?",ans7:"नहीं। वेरिफाइड डीलर के स्टॉक डेटा के बिना उपलब्धता की पुष्टि नहीं की जा सकती।",
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
 {id:"paint",en:"Paint & waterproofing",hi:"पेंट व वॉटरप्रूफिंग",description:"Coatings and finish systems",descriptionHi:"पेंट, प्राइमर और कोटिंग",image:homeVisuals.paint,href:"/materials/paint"},
 {id:"electrical",en:"Electrical",hi:"इलेक्ट्रिकल",description:"Wiring, conduit and fittings",descriptionHi:"वायर और फिटिंग",image:homeVisuals.electrical,href:"/materials/electrical"},
 {id:"aggregates",en:"Sand & aggregates",hi:"बालू, मौरंग व गिट्टी",description:"Location-based bulk quotation",descriptionHi:"लोकेशन के अनुसार कोटेशन",image:homeVisuals.aggregates,href:"/materials/aggregates"},
 {id:"tiles",en:"Tiles & flooring",hi:"टाइल्स व फ्लोरिंग",description:"Size, finish and pack",descriptionHi:"नाप, फिनिश और पैक",image:homeVisuals.tiles,href:"/materials/tiles"},
 {id:"hardware",en:"Hardware & adhesives",hi:"हार्डवेयर व एडहेसिव",description:"Fittings and fixings",descriptionHi:"फिटिंग और सामान",image:homeVisuals.hardware,href:"/materials/hardware"},
] as const;
const popular=[["cement","/materials/cement"],["TMT","/materials/steel"],["bricks","/materials/bricks-blocks"],["pipes","/materials/plumbing"]] as const;

export function PremiumHome(){
 const [lang,setLang]=useState<Language>("en");
 const [query,setQuery]=useState(""),[recent,setRecent]=useState<string[]>([]);
 const [plot,setPlot]=useState("all"),[designStyle,setDesignStyle]=useState("all");
 const [customWidth,setCustomWidth]=useState(""),[customDepth,setCustomDepth]=useState("");
 const customPlotActive=customWidth.trim()!==""||customDepth.trim()!=="";
 const w=Number(customWidth),d=Number(customDepth);
 const customPlotValid=customWidth.trim()!==""&&customDepth.trim()!==""&&Number.isFinite(w)&&Number.isFinite(d)&&w>=10&&w<=200&&d>=15&&d<=250;
 const fitLink=customPlotValid?`/design-studio/fit?width=${encodeURIComponent(customWidth)}&depth=${encodeURIComponent(customDepth)}`:"/design-studio/fit";
 const portfolioDimensions=customPlotValid?{width:w,depth:d}:plot==="all"?{width:18,depth:50}:(()=>{const [width,depth]=plot.split("x").map(Number);return {width,depth};})();
 const portfolioHref=`/design-studio/portfolio?width=${encodeURIComponent(String(portfolioDimensions.width))}&depth=${encodeURIComponent(String(portfolioDimensions.depth))}`;
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
 function language(){const next=lang==="en"?"hi":"en";setLang(next);try{localStorage.setItem("neerva-home-lang",next)}catch{/* Language still changes for this session */}}
 function submitSearch(event:FormEvent<HTMLFormElement>){const trimmed=query.trim();if(!trimmed){event.preventDefault();return;}const next=[trimmed,...recent.filter(x=>x.toLowerCase()!==trimmed.toLowerCase())].slice(0,4);setRecent(next);try{localStorage.setItem("neerva-home-search-v1",JSON.stringify(next))}catch{/* Optional search history */}}
 return <main className="nbh" id="top">
  <div className="nbh-ribbon"><span>{lang==="hi"?"हर घर मजबूत · विकसित भारत का सपना":"ONE DREAM. MANY HOMES. STRONGER INDIA."}</span><span>{lang==="hi"?"देशभर के बिल्डर्स के लिए":"Made for India’s builders"}</span></div>
  <header className="nbh-header">
   <Link className="nbh-logo" href="/" aria-label="NEERVA BUILD home"><span className="nbh-logomark">N</span><span>NEERVA <i>BUILD</i></span></Link>
   <nav className="nbh-nav" aria-label="Primary navigation"><Link href="/materials">{t.navMaterials}</Link><Link href="/design-studio">{t.navDesign}</Link><Link href="/quotes">{t.navQuote}</Link><Link href="/blog">{t.navGuides}</Link></nav><details className="nbh-mobile-menu"><summary aria-label={lang==="hi"?"नेविगेशन मेन्यू":"Open navigation menu"}>{lang==="hi"?"मेन्यू":"Menu"}</summary><nav aria-label="Mobile navigation"><Link href="/materials">{t.navMaterials}</Link><Link href="/design-studio">{t.navDesign}</Link><Link href="/quotes">{t.navQuote}</Link><Link href="/brands">Brands</Link><Link href="/install">Install app</Link><Link href="/account">Account</Link><Link href="/basket">Material list</Link><Link href="/blog">{t.navGuides}</Link></nav></details>
   <div className="nbh-header-actions">
    <Link className="nbh-install-header" href="/install" aria-label={lang==="hi"?"ऐप इंस्टॉल कैसे करें":"How to install the NEERVA BUILD app"}>{lang==="hi"?"ऐप":"Install"}</Link><Link className="nbh-icon-link" href="/account" aria-label={lang==="hi"?"अकाउंट":"Account"}><Icon name="home"/></Link>
    <Link className="nbh-icon-link" href="/basket" aria-label={lang==="hi"?"सामग्री सूची":"Material list"}><Icon name="cart"/></Link>
    <button className="nbh-language" type="button" onClick={language}>{t.langButton}</button>
   </div>
  </header>
  <section className="nbh-hero" aria-labelledby="nbh-h1">
   <div className="nbh-hero-copy">
    <p className="nbh-eyebrow"><span className="nbh-dot"/> {t.eyebrow}</p>
    <h1 id="nbh-h1">{t.title1}<span>{t.title2}</span></h1>
    <p className="nbh-sub">{t.subhead}</p>
    <div className="nbh-journeys">
     <Link className="nbh-journey nbh-primary" href="/materials"><span className="nbh-jicon"><Icon name="cart"/></span><span><strong>{t.visual}</strong><small>{t.visualDesc}</small></span><Icon name="arrow"/></Link>
     <Link className="nbh-journey" href="/design-studio"><span className="nbh-jicon"><Icon name="home"/></span><span><strong>{t.design}</strong><small>{t.designDesc}</small></span><Icon name="arrow"/></Link>
     <Link className="nbh-journey" href="/quotes"><span className="nbh-jicon"><Icon name="file"/></span><span><strong>{t.quote}</strong><small>{t.quoteDesc}</small></span><Icon name="arrow"/></Link>
    </div>
    <form className="nbh-search" action="/materials" method="get" onSubmit={submitSearch} role="search"><Icon name="search"/><input aria-label={t.search} name="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchHint} maxLength={80}/><button type="submit">{t.searchGo}</button></form>
    <form className="nbh-quick-quote" action="/quotes" method="get">
 <strong>{lang==="hi"?"जल्दी कोटेशन ड्राफ्ट तैयार करें":"Prepare a material enquiry in under one minute"}</strong>
 <div className="nbh-quick-fields"><label className="nbh-quick-category">{lang==="hi"?"श्रेणी":"Category"}<select name="category" defaultValue="cement"><option value="cement">Cement</option><option value="steel">TMT / Steel</option><option value="bricks-blocks">Bricks / AAC</option><option value="plumbing">Pipes</option><option value="electrical">Electrical</option><option value="aggregates">Sand / aggregates</option><option value="paint">Paint</option><option value="tiles">Tiles</option><option value="hardware">Hardware</option></select></label>
  <label>{lang==="hi"?"सामग्री":"Material"}<input required minLength={3} maxLength={180} name="material" placeholder="e.g. UltraTech PPC 50 kg"/></label>
  <label>{lang==="hi"?"मात्रा":"Quantity"}<input required type="number" min=".001" max="1000000" step=".001" defaultValue="10" name="quantity"/></label>
  <label>{lang==="hi"?"पिनकोड":"Pincode"}<input required name="pincode" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} placeholder="208001"/></label>
  <label>{lang==="hi"?"डिलीवरी शहर":"Delivery city"}<input required minLength={2} maxLength={80} name="city" placeholder={lang==="hi"?"जैसे लखनऊ":"e.g. Lucknow"} autoComplete="address-level2"/></label><button type="submit">{lang==="hi"?"ड्राफ्ट तैयार करें →":"Prepare request →"}</button>
 </div>
 <small>Draft only. No stock, price, order or delivery is confirmed.</small>
</form>
{suggestions.length>0?<div className="nbh-suggestions" aria-label="Search suggestions">{suggestions.map(item=><Link key={item.id} href={item.href}>{lang==="hi"?item.hi:item.en}<Icon name="arrow"/></Link>)}</div>:null}
    <div className="nbh-chip-line"><span>{t.categories}</span>{popular.map(([name,href])=><Link key={name} href={href}>{name}</Link>)}</div>
    {recent.length>0&&<div className="nbh-recent"><small>{t.recent}</small>{recent.map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div>}
   </div>
   <div className="nbh-hero-visual">
    <div className="nbh-house-frame nbh-photo-hero">
     <Image src={homeVisuals.hero} fill priority sizes="(max-width:720px) 100vw, 48vw" alt="Real photograph of a premium contemporary residence, used as style inspiration, not a NEERVA-generated house or an exact plan render" className="nbh-house-photo"/>
     <span className="nbh-photo-veil" aria-hidden="true"/>
     <div className="nbh-photo-credit"><span className="nbh-photo-pill">REAL HOUSE PHOTOGRAPHY</span><strong>Contemporary homes. Build a plan for your own site.</strong><small>Exterior style inspiration · exact rooms, doors and gates appear in the matched 2D/3D studio</small></div>
    </div>
    <p className="nbh-image-note">Licensed residential photograph, not a NEERVA-built home or a visualisation of a selected floor plan. <Link href="/design-studio/fit">Find designs for your plot →</Link></p>
   </div>
  </section>
  <section className="nbh-trust" aria-label="Platform approach"><span><Icon name="list"/>{t.trust1}</span><span><Icon name="shield"/>{t.trust2}</span><span><Icon name="check"/>{t.trust3}</span></section>
  <section className="nbh-brands-strip" aria-label="Construction manufacturer reference directory">
   <div><strong>{lang==="hi"?"निर्माण सामग्री के ब्रांड":"Explore established material brands"}</strong><p>{lang==="hi"?"ब्रांड लोगो केवल पहचान के लिए हैं। स्टॉक और अधिकृत डीलर की पुष्टि अलग जरूरी है।":"Original brand marks where source-verified; names are references, not authorised dealership or product stock."}</p></div>
   <div className="nbh-brand-links">{(["ACC","UltraTech","Ambuja","Astral","Supreme","Polycab"] as const).map(name=><Link href="/brands" key={name} aria-label={name+" construction materials brand directory"}><BrandMark name={name} small/></Link>)}</div>
  </section>
  <section className="nbh-section nbh-materials" id="materials"><div className="nbh-section-head"><div><p className="nbh-eyebrow">01 / MATERIALS</p><h2>{t.category}</h2><p>{t.catDesc}</p></div><Link href="/materials" className="nbh-section-link">{t.navMaterials} <Icon name="arrow"/></Link></div>
   <div className="nbh-category-grid">{items.map(item=><Link href={item.href} className="nbh-material-card" key={item.id}><div className="nbh-material-image">{item.image?<Image src={item.image} fill sizes="(max-width:600px) 48vw, (max-width:1000px) 30vw, 16vw" alt={"Representative "+item.en+" category "+(item.image.endsWith(".svg")?"illustration":"material photo")+", not verified branded SKU"} loading="lazy"/>:<div className="nbh-photo-pending" role="img" aria-label="Representative category illustration pending">SKU photo pending review</div>}</div><div className="nbh-material-info"><h3>{lang==="hi"?item.hi:item.en}</h3><p>{lang==="hi"?item.descriptionHi:item.description}</p><span>{item.id==="paint"?t.paintLabel:t.options} <Icon name="arrow"/></span></div></Link>)}</div>
   <p className="nbh-fineprint">{t.disclaimer}</p>
  </section>
  <section className="nbh-section nbh-featured" id="designs"><div className="nbh-section-head"><div><p className="nbh-eyebrow">02 / HOME STUDIO</p><h2>{t.designs}</h2><p>{t.galleryDesc}</p></div><Link href={portfolioHref} className="nbh-section-link">{t.gallery} <Icon name="arrow"/></Link></div>
   <div className="nbh-filter-row"><label>Preset <select value={plot} onChange={e=>{setPlot(e.target.value);setCustomWidth("");setCustomDepth("")}}><option value="all">All sizes</option>{["15x30","20x40","25x40","30x40","30x50","40x60"].map(v=><option key={v} value={v}>{v.replace("x"," × ")} ft</option>)}</select></label><label>Or your width (ft)<input type="number" inputMode="decimal" min="10" max="200" step="0.5" placeholder="e.g. 18" value={customWidth} onChange={e=>setCustomWidth(e.target.value)}/></label><label>Depth (ft)<input type="number" inputMode="decimal" min="15" max="250" step="0.5" placeholder="e.g. 50" value={customDepth} onChange={e=>setCustomDepth(e.target.value)}/></label><label>Style <select value={designStyle} onChange={e=>setDesignStyle(e.target.value)}><option value="all">All styles</option>{["warm-modern","sandstone-calm","urban-slate","terracotta-ivory"].map(s=><option key={s} value={s}>{s.replaceAll("-"," ")}</option>)}</select></label></div>
   <p className="nbh-spatial-promo"><strong>{lang==="hi"?"अलग-अलग कमरों वाले 24 नक्शे":"24 actual room arrangements for one plot"}</strong> <span>{portfolioDimensions.width} × {portfolioDimensions.depth} ft · road-facing parking · shared 2D/3D geometry</span><Link href={portfolioHref}> {lang==="hi"?"नक्शे बनाएं →":"Generate my 24 spatial plans →"}</Link></p>
   {customPlotActive&&<p className="nbh-custom-fit" role="status">{customPlotValid?`Your ${w} × ${d} ft plot: showing concepts whose existing footprint fits the dimensions (not a custom-generated floor plan).`:"Enter both valid plot dimensions (width 10–200 ft; depth 15–250 ft)."} <Link href={fitLink}>Open detailed plot fit and room requirements →</Link></p>}
   {designs.length===0?<div className="nbh-empty"><p>{customPlotActive?"No existing concept fits the entered dimensions. Do not stretch a fixed plan and call it a custom design.":"No concept matches this filter."}</p><Link href={fitLink}>Review your custom plot →</Link><button onClick={()=>{setPlot("all");setDesignStyle("all");setCustomWidth("");setCustomDepth("")}}>Show all designs</button></div>:<div className="nbh-design-scroll">{designs.map((d,i)=><Link className="nbh-design-card" href={"/design-studio/library/"+d.slug} key={d.slug}><div className="nbh-design-image"><Image src={homeReferencePhotos[i%homeReferencePhotos.length].src} fill sizes="(max-width: 600px) 80vw, 350px" loading="lazy" alt={"Licensed architectural photograph for style reference only, not the exact 3D render of "+d.title}/><span>{d.plot.widthFt} × {d.plot.depthFt} FT</span><small className="nbh-photo-plan-note">REAL PHOTO · STYLE REFERENCE</small></div><div className="nbh-design-text"><h3>{lang==="hi"?d.titleHi:d.title}</h3><p>{d.bedrooms} BHK · {d.floors===1?"Ground":"G+1"} · {d.facing}</p><span>{t.plan} <Icon name="arrow"/></span></div></Link>)}</div>}
   <p className="nbh-fineprint">{t.concept}. {t.disclaimer}</p>
  </section>
  <section className="nbh-colour nbh-build-section" id="construction">
   <div className="nbh-build-visual nbh-construction-pair" aria-label="Two real photographs from different projects: construction work and a completed modern home">
    <div className="nbh-real-construction"><Image src={homeVisuals.construction} fill sizes="(max-width:760px) 100vw, 22vw" loading="lazy" alt="Real photograph of structural construction and building activity, an unrelated editorial reference"/><span>01 · STRUCTURE / WORK SITE</span></div>
    <div className="nbh-real-construction"><Image src={homeVisuals.hero} fill sizes="(max-width:760px) 100vw, 22vw" loading="lazy" alt="Real photograph of a completed contemporary home, a separate editorial reference"/><span>02 · COMPLETED HOME STYLE</span></div>
    <p className="nbh-photo-disclaimer">Real reference photos of different properties · not a time-lapse, not a before/after claim</p>
   </div>
   <div className="nbh-colour-copy">
    <p className="nbh-eyebrow">03 / FROM FOUNDATION TO FINISH</p>
    <h2>{lang==="hi"?"सामग्री से बनता घर":"See your construction stages"}</h2>
    <p>{lang==="hi"?"स्टील और सीमेंट से शुरुआत, फिर ईंट, पाइप और फिनिशिंग। हर चरण की सामग्री और नाप चुनें। अंतिम स्टॉक, कीमत और डिलीवरी की पुष्टि जरूरी है।":"From steel and cement to bricks, pipes and finishes: choose the right materials for each construction stage, then get a verified supplier quotation."}</p>
    <div className="nbh-build-steps"><span>01 · Structure</span><span>02 · Plumbing & masonry</span><span>03 · Finishes</span></div>
    <p className="nbh-fineprint">Concept only. Verify with a licensed architect/engineer and local authority approval. Editorial photographs show different properties, not a single Neerva construction project.</p>
    <div className="nbh-build-actions"><Link className="nbh-outline-link" href="/materials">Explore construction materials <Icon name="arrow"/></Link><Link href="/design-studio/visualizer">{t.colourLink} →</Link></div>
   </div>
  </section>
  <section className="nbh-section nbh-work"><div className="nbh-section-head"><div><p className="nbh-eyebrow">04 / A CLEARER JOURNEY</p><h2>{t.works}</h2><p>{t.worksDesc}</p></div></div><div className="nbh-steps">{([[t.step1,t.step1Desc],[t.step2,t.step2Desc],[t.step3,t.step3Desc],[t.step4,t.step4Desc]] as const).map(([title,description],i)=><div key={title}><span>{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
  <section className="nbh-section nbh-offers"><div className="nbh-section-head"><div><p className="nbh-eyebrow">05 / BUY SMARTER</p><h2>{lang==="hi"?"केवल बैग का रेट नहीं, पूरा खर्च देखें":"The cheapest bag isn't always the cheapest delivery."}</h2><p>{lang==="hi"?"डीलर से GST, फ्रेट, उतारने का खर्च, डिलीवरी और वैधता अलग-अलग पूछें।":"Check the total—not just the unit price. Compare GST, freight, unloading, delivery date and the offer's real validity."}</p></div><Link href="/quotes" className="nbh-section-link">{lang==="hi"?"पूरा कोटेशन बनाएं":"Prepare an itemised request"} <Icon name="arrow"/></Link></div><div className="nbh-cost-trust"><span>✓ {lang==="hi"?"सही ग्रेड व मात्रा":"Grade & quantity"}</span><span>✓ GST + freight + unloading</span><span>✓ {lang==="hi"?"डिलीवरी का समय":"Delivery commitment"}</span><span>✓ {lang==="hi"?"लिखित ऑफर वैधता":"Written offer validity"}</span></div><p className="nbh-fineprint">{t.offerEmpty} {lang==="hi"?"बिना सत्यापित ऑफर के नकली छूट या टाइमर नहीं दिखाते।":"No fake discount timer or invented limited-stock claim."}</p></section>
  <section className="nbh-section nbh-pros"><div className="nbh-section-head"><div><p className="nbh-eyebrow">06 / PROFESSIONALS</p><h2>{t.pros}</h2></div></div><div className="nbh-pro-grid"><div><Icon name="building"/><h3>{t.dealer}</h3><p>{t.dealerDesc}</p><Link href="/account">{t.learn} <Icon name="arrow"/></Link></div><div><Icon name="list"/><h3>{t.contractor}</h3><p>{t.contractorDesc}</p><Link href="/quotes">{t.prepare} <Icon name="arrow"/></Link></div></div></section>
  <section className="nbh-section nbh-faq"><h2>{t.faq}</h2>{([[t.faq1,t.ans1],[t.faq2,t.ans2],[t.faq3,t.ans3],[t.faq4,t.ans4],[t.faq5,t.ans5],[t.faq6,t.ans6],[t.faq7,t.ans7]] as const).map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
  <footer className="nbh-footer nbh-footer-expanded"><div className="nbh-footer-brand"><Link className="nbh-logo" href="/"><span className="nbh-logomark">N</span><span>NEERVA <i>BUILD</i></span></Link><p>Plan confidently. Compare materials. Build with clarity.</p><p className="nbh-fineprint">{t.foot}</p></div><nav aria-label="Footer design and planning"><strong>Plan a home</strong><Link href="/design-studio/fit">Custom plot fit</Link><Link href="/design-studio/library">Browse concepts</Link><Link href="/design-studio/workbench">Concept workbench</Link><Link href="/design-studio/visualizer">Exterior colour studio</Link></nav><nav aria-label="Footer marketplace"><strong>Materials & services</strong><Link href="/materials">Construction materials</Link><Link href="/basket">Material list</Link><Link href="/quotes">Prepare a quote</Link><Link href="/account">Dealer / professional access</Link></nav><nav aria-label="Footer resources"><strong>Resources</strong><Link href="/blog">Building guides</Link><Link href="/install">Install the app</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms & limitations</Link><Link href="/returns">Returns & refunds</Link><Link href="/account">Account and help</Link><Link href="/design-studio/visualizer">Paint my own photo</Link></nav><div className="nbh-footer-bottom"><small>© 2026 NEERVA BUILD · Made for builders in India</small><small>Concept plans require local engineering review and approvals. Stock and offers subject to dealer confirmation.</small></div></footer>
 </main>;
}
