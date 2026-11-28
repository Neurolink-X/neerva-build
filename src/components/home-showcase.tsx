"use client";
import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import {houseJourney,houseJourneyImageUrl} from "@/modules/studio/house-journey";
import {heroGalleryPhotos} from "@/modules/home/assets";
import {allowSpeculativeNetwork,type NetworkHint} from "@/modules/navigation/intent";

export function HomeShowcase({hindi}:{hindi:boolean}) {
  const root=useRef<HTMLDivElement>(null),strip=useRef<HTMLDivElement>(null);
  const figure=useRef<HTMLElement>(null),slider=useRef<HTMLInputElement>(null);
  const [playing,setPlaying]=useState(false),[index,setIndex]=useState(0);
  function slide(number:number,smooth:boolean){
    const el=strip.current;
    if(el)el.scrollTo({left:el.clientWidth*number,behavior:smooth&&!matchMedia("(prefers-reduced-motion: reduce)").matches?"smooth":"instant"});
  }
  // Opt-in autoplay only; no idle timer, observer or network listener on first load.
  useEffect(()=>{
    if(!playing)return;
    const tick=()=>{
      const rect=root.current?.getBoundingClientRect(),connection=(navigator as Navigator&{connection?:NetworkHint}).connection;
      if(!rect||rect.bottom<=0||rect.top>=innerHeight||document.hidden||matchMedia("(prefers-reduced-motion: reduce)").matches||!allowSpeculativeNetwork(connection,navigator.onLine))return;
      const el=strip.current;if(!el?.clientWidth)return;
      const next=(Math.round(el.scrollLeft/el.clientWidth)+1)%heroGalleryPhotos.length;
      el.scrollTo({left:el.clientWidth*next,behavior:"smooth"});
    };
    const timer=window.setInterval(tick,5500);
    return()=>clearInterval(timer);
  },[playing]);
  // Native range input and a CSS property; no React state update per drag event.
  function revealStage(value:number){
    const el=figure.current,input=slider.current;if(!el||!input||!Number.isFinite(value))return;
    const percent=Math.min(100,Math.max(0,value));
    el.style.setProperty("--reveal",percent+"%");
    input.value=String(percent);
    input.setAttribute("aria-valuetext",percent+"% "+(hindi?"निर्माणाधीन":"under construction"));
    for(const button of el.querySelectorAll<HTMLButtonElement>("[data-stage]"))button.setAttribute("aria-pressed",String(Number(button.dataset.stage)===percent));
    if(playing)setPlaying(false);
  }
  return <div ref={root} className="nbh-showcase">
    <div className="nbh-showcase-title"><strong>{hindi?"घरों की गैलरी":"House inspiration"}</strong>
      <button type="button" onClick={()=>setPlaying(v=>!v)}>
        {playing ? (hindi?"रोकें":"Pause motion") : (hindi?"चलाएँ":"Play motion")}
      </button></div>
    <div className="nbh-house-strip" ref={strip} onPointerDown={()=>setPlaying(false)} onScroll={e=>{
      const el=e.currentTarget;
      if(el.clientWidth){const next=Math.round(el.scrollLeft/el.clientWidth);if(next!==index)setIndex(next);}
    }}>{heroGalleryPhotos.map((photo,i)=><div key={photo.src}><Image src={photo.src} fill sizes="(max-width:760px) 95vw, 46vw" loading={i===0?"eager":"lazy"} fetchPriority={i===0?"high":"low"} alt={photo.name}/></div>)}</div>
    <div className="nbh-house-controls">{heroGalleryPhotos.map((photo,i)=><button type="button" key={photo.src} aria-current={i===index?"true":undefined} aria-label={(hindi?"घर ":"House ")+(i+1)} onClick={()=>{setPlaying(false);slide(i,true);}}>{i+1}</button>)}</div>
    <figure ref={figure} className="home-stage-comparison" data-journey="premium" aria-label={hindi?"निर्माण सामग्री से तैयार घर तक":"From construction materials to finished home"}>
      <figcaption className="nbh-stage-heading"><strong>{hindi?"निर्माण सामग्री से तैयार घर तक":"From materials to a finished home"}</strong><small>{hindi?"घर का उदाहरण · खींचकर तुलना करें":"Illustrative home · Drag to compare"}</small></figcaption>
      <div className="nbh-compare-frame">
      <Image src={houseJourneyImageUrl(houseJourney.finished.src)} fill sizes="(max-width:760px) 95vw, 46vw" loading="lazy" fetchPriority="low" alt={hindi?"तैयार घर: पेंट, खिड़कियाँ, रेलिंग और फिनिश":"Finished family home with exterior paint, windows, railing and finishes"}/>
      <Image src={houseJourneyImageUrl(houseJourney.shell.src)} fill sizes="(max-width:760px) 95vw, 46vw" loading="lazy" fetchPriority="low" alt={hindi?"निर्माणाधीन घर: खुली ईंट की दीवारें, कंक्रीट बीम और स्लैब":"Illustrative matching home under construction, showing brick masonry, concrete beams, reinforcing steel, sand and cement bags"} className="nbh-construction-layer"/>
      <span aria-hidden="true"/>
      <input ref={slider} type="range" min={0} max={100} defaultValue={50} aria-label={hindi?"निर्माण के चरणों की तुलना":"Compare construction-stage views"} onInput={e=>revealStage(e.currentTarget.valueAsNumber)}/>
    </div>
      <div className="nbh-stage-switch" role="group" aria-label={hindi?"निर्माण चरण":"Construction stages"}>
        <button type="button" data-stage="100" aria-pressed={false} onClick={()=>revealStage(100)}>{hindi?"निर्माणाधीन":"Under construction"}</button>
        <button type="button" data-stage="50" aria-pressed={true} onClick={()=>revealStage(50)}>{hindi?"तुलना":"Compare"}</button>
        <button type="button" data-stage="0" aria-pressed={false} onClick={()=>revealStage(0)}>{hindi?"तैयार घर":"Finished home"}</button>
      </div>

    </figure>
  </div>;
}
