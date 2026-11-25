"use client";
import {useEffect,useRef} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {navigationPath,prefetchPath,takePrefetch} from "@/modules/navigation/intent";
type Connection={saveData?:boolean;effectiveType?:string};
export function NavigationFeedback(){
 const router=useRouter(),pathname=usePathname(),search=useSearchParams().toString();
 const bar=useRef<HTMLDivElement>(null),deadline=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),recent=useRef(new Map<string,number>());
 useEffect(()=>{clearTimeout(deadline.current);bar.current?.removeAttribute("data-active")},[pathname,search]);
 useEffect(()=>{
  let hover:ReturnType<typeof setTimeout>|undefined;
  function stop(){clearTimeout(deadline.current);bar.current?.removeAttribute("data-active")}
  function start(){if(document.visibilityState==="hidden")return;bar.current?.setAttribute("data-active","true");clearTimeout(deadline.current);deadline.current=setTimeout(stop,15000)}
  function anchor(target:EventTarget|null){return target instanceof Element?target.closest<HTMLAnchorElement>("a[href]"):null}
  function ordinary(a:HTMLAnchorElement){return (!a.target||a.target==="_self")&&!a.hasAttribute("download")&&a.getAttribute("aria-disabled")!=="true"}
  function click(e:MouseEvent){const a=anchor(e.target);if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!a||!ordinary(a)||!navigationPath(a.href,location.href))return;start()}
  function intent(a:HTMLAnchorElement){const conn=(navigator as Navigator&{connection?:Connection}).connection;if(document.visibilityState!=="visible"||navigator.onLine===false||conn?.saveData||["slow-2g","2g"].includes(conn?.effectiveType??""))return;const path=prefetchPath(a.href,location.href);if(path&&takePrefetch(recent.current,path,Date.now())){try{router.prefetch(path)}catch{recent.current.delete(path)}}}
  function hoverStart(e:PointerEvent){const a=anchor(e.target);if(e.pointerType==="touch"||!a||!ordinary(a)||!a.hasAttribute("data-intent-prefetch")||e.relatedTarget instanceof Node&&a.contains(e.relatedTarget))return;clearTimeout(hover);hover=setTimeout(()=>intent(a),100)}
  function hoverEnd(e:PointerEvent){const a=anchor(e.target);if(a&&e.relatedTarget instanceof Node&&a.contains(e.relatedTarget))return;clearTimeout(hover)}
  function focus(e:FocusEvent){const a=anchor(e.target);if(a&&ordinary(a)&&a.hasAttribute("data-intent-prefetch"))intent(a)}
  function pending(){start()}
  function visibility(){if(document.visibilityState==="hidden"){stop();clearTimeout(hover)}}
  document.addEventListener("click",click,true);document.addEventListener("pointerover",hoverStart,{passive:true});document.addEventListener("pointerout",hoverEnd,{passive:true});document.addEventListener("focusin",focus);window.addEventListener("neerva:navigation-start",pending);window.addEventListener("pageshow",stop);window.addEventListener("popstate",stop);document.addEventListener("visibilitychange",visibility);
  return()=>{stop();clearTimeout(hover);document.removeEventListener("click",click,true);document.removeEventListener("pointerover",hoverStart);document.removeEventListener("pointerout",hoverEnd);document.removeEventListener("focusin",focus);window.removeEventListener("neerva:navigation-start",pending);window.removeEventListener("pageshow",stop);window.removeEventListener("popstate",stop);document.removeEventListener("visibilitychange",visibility)}
 },[router]);
 return <div ref={bar} className="neerva-navigation-feedback" role="status" aria-live="polite"><span>Opening page…</span></div>
}
