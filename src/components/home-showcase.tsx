"use client";
import Image from "next/image";
import {useEffect, useRef, useState} from "react";
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
  const direction = useRef(1);
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
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setReveal(previous => Math.max(12,Math.min(88,previous + 2*direction.current)));
    },170);
    return () => clearInterval(timer);
  },[playing]);
  useEffect(() => {
    if (reveal >= 88) direction.current = -1;
    if (reveal <= 12) direction.current = 1;
  },[reveal]);
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
    <figure className="home-stage-comparison"><div className="nbh-compare-frame">
      <Image src="/images/studio/finished.webp" fill sizes="(max-width:760px) 95vw, 46vw" loading="lazy" fetchPriority="low" alt="Finished house concept"/>
      <Image src="/images/studio/shell.webp" fill sizes="(max-width:760px) 95vw, 46vw" loading="lazy" fetchPriority="low" alt="Unfinished house concept" style={{clipPath:`inset(0 ${100-reveal}% 0 0)`}}/>
      <span aria-hidden="true" style={{left:reveal+"%"}}/>
      <input type="range" min={0} max={100} value={reveal} aria-label={hindi?"निर्माण के चरणों की तुलना":"Compare construction-stage views"} onFocus={()=>setPaused(true)} onPointerDown={()=>setPaused(true)} onChange={e=>{setPaused(true);setReveal(Number(e.target.value));}}/>
    </div><figcaption>{hindi?"निर्माणाधीन और तैयार घर · खींचकर तुलना करें":"Construction and finished concepts · Drag to compare"}</figcaption></figure>
  </div>;
}
