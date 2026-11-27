"use client";
import Image from "next/image";
import Link from "@/components/intent-link";
import {useEffect, useRef, useState} from "react";
import {houseJourney} from "@/modules/studio/house-journey";
import {heroGalleryPhotos} from "@/modules/home/assets";
import {allowSpeculativeNetwork,type NetworkHint} from "@/modules/navigation/intent";

export function HomeShowcase({hindi}:{hindi:boolean}) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [visible,setVisible] = useState(false);
  const [motion,setMotion] = useState(false);
  const [paused,setPaused] = useState(false);
  const [index,setIndex] = useState(0);
  const [reveal,setReveal] = useState(50);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const connection=(navigator as Navigator&{connection?:NetworkHint&EventTarget}).connection;
    const update=()=>setMotion(!preference.matches&&allowSpeculativeNetwork(connection,navigator.onLine));
    const start=window.setTimeout(update,1500);
    preference.addEventListener("change",update);
    connection?.addEventListener?.("change",update);window.addEventListener("online",update);window.addEventListener("offline",update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => {clearTimeout(start);observer.disconnect(); preference.removeEventListener("change",update);connection?.removeEventListener?.("change",update);window.removeEventListener("online",update);window.removeEventListener("offline",update);};
  },[]);
  const playing = visible && motion && !paused;
  function slide(number:number,smooth:boolean) {
    const el = strip.current;
    if (el) el.scrollTo({left:el.clientWidth * number,behavior:smooth?"smooth":"instant"});
  }
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) slide((index+1)%heroGalleryPhotos.length,true);
    },5500);
    return () => clearInterval(timer);
  },[playing,index]);
  return <div ref={root} className="nbh-showcase">
    <div className="nbh-showcase-title"><strong>{hindi?"घरों की गैलरी":"House inspiration"}</strong>
      <button type="button" onClick={() => {setPaused(motion && !paused);setMotion(true);}}>
        {motion && !paused ? (hindi?"रोकें":"Pause motion") : (hindi?"चलाएँ":"Play motion")}
      </button></div>
    <div className="nbh-house-strip" ref={strip} onPointerDown={()=>setPaused(true)} onScroll={e=>{
      const el=e.currentTarget;
      if(el.clientWidth) setIndex(Math.round(el.scrollLeft/el.clientWidth));
    }}>{heroGalleryPhotos.map((photo,i)=><div key={photo.src}><Image src={photo.src} fill sizes="(max-width:760px) 95vw, 46vw" loading={i===0?"eager":"lazy"} fetchPriority={i===0?"high":"low"} alt={photo.name}/></div>)}</div>
    <div className="nbh-house-controls">{heroGalleryPhotos.map((photo,i)=><button type="button" key={photo.src} aria-current={i===index?"true":undefined} aria-label={(hindi?"घर ":"House ")+(i+1)} onClick={()=>{setPaused(true);slide(i,motion);}}>{i+1}</button>)}</div>
    <figure className="home-stage-comparison" data-journey="premium" aria-label={hindi?"निर्माण सामग्री से तैयार घर तक":"From construction materials to finished home"}>
      <figcaption className="nbh-stage-heading"><strong>{hindi?"निर्माण सामग्री से तैयार घर तक":"From materials to a finished home"}</strong><small>{hindi?"एक ही घर, दो चरण · खींचकर तुलना करें":"Same house, two stages · Drag to compare"}</small></figcaption>
      <div className="nbh-compare-frame">
      <Image src={houseJourney.finished.src} fill sizes="(max-width:760px) 95vw, 46vw" loading="lazy" fetchPriority="low" alt={hindi?"तैयार घर: पेंट, खिड़कियाँ, रेलिंग और फिनिश":"Finished family home with exterior paint, windows, railing and finishes"}/>
      <Image src={houseJourney.shell.src} fill sizes="(max-width:760px) 95vw, 46vw" loading="lazy" fetchPriority="low" alt={hindi?"निर्माणाधीन घर: खुली ईंट की दीवारें, कंक्रीट बीम और स्लैब":"Same family home under construction, showing exposed brick masonry, concrete beams and slabs"} style={{clipPath:`inset(0 ${100-reveal}% 0 0)`}}/>
      <span aria-hidden="true" style={{left:reveal+"%"}}/>
      <input type="range" min={0} max={100} value={reveal} aria-valuetext={`${reveal}% ${hindi?"निर्माणाधीन":"under construction"}`} aria-label={hindi?"निर्माण के चरणों की तुलना":"Compare construction-stage views"} onFocus={()=>setPaused(true)} onPointerDown={()=>setPaused(true)} onChange={e=>{setPaused(true);setReveal(Number(e.target.value));}}/>
    </div>
      <div className="nbh-stage-switch" role="group" aria-label={hindi?"निर्माण चरण":"Construction stages"}>
        <button type="button" aria-pressed={reveal===100} onClick={()=>{setPaused(true);setReveal(100)}}>{hindi?"निर्माणाधीन":"Under construction"}</button>
        <button type="button" aria-pressed={reveal===50} onClick={()=>{setPaused(true);setReveal(50)}}>{hindi?"तुलना":"Compare"}</button>
        <button type="button" aria-pressed={reveal===0} onClick={()=>{setPaused(true);setReveal(0)}}>{hindi?"तैयार घर":"Finished home"}</button>
      </div>
      <div className="nbh-stage-materials">
        <div><strong>{hindi?"मजबूत ढांचा":"Structure & masonry"}</strong><div><Link href="/materials/cement">{hindi?"सीमेंट":"Cement"}</Link><Link href="/materials/steel">{hindi?"सरिया":"TMT steel"}</Link><Link href="/materials/bricks-blocks">{hindi?"ईंट":"Bricks"}</Link><Link href="/materials/aggregates">{hindi?"बालू / गिट्टी":"Sand & aggregates"}</Link></div></div>
        <div><strong>{hindi?"फिनिशिंग":"Finishing touches"}</strong><div><Link href="/materials/paint">{hindi?"पेंट":"Paint"}</Link><Link href="/materials/tiles">{hindi?"टाइल्स":"Tiles"}</Link><Link href="/materials/hardware">{hindi?"हार्डवेयर":"Hardware"}</Link></div></div>
      </div>
      <small className="nbh-stage-note">{hindi?"चित्र केवल समझाने के लिए हैं; किसी वास्तविक परियोजना की प्रगति या सामग्री की मात्रा का प्रमाण नहीं।":"Illustrative construction stages, not a record of a real project or a material quantity estimate."}</small>
    </figure>
  </div>;
}
