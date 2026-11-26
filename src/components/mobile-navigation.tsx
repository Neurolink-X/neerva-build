"use client";
import {useEffect,useId,useRef,type ReactNode} from "react";
import {usePathname} from "next/navigation";
export function MobileNavigation({className,children,language="en"}:{className:string;children:ReactNode;language?:"en"|"hi"}){
 const ref=useRef<HTMLDetailsElement>(null),trigger=useRef<HTMLElement>(null),id=useId(),path=usePathname();
 const hi=language==="hi";
 useEffect(()=>{if(ref.current)ref.current.open=false;},[path]);
 useEffect(()=>{
  const close=(restore=false)=>{const menu=ref.current;if(menu?.open){menu.open=false;if(restore)trigger.current?.focus();}};
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!ref.current?.contains(event.target))close();};
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"&&ref.current?.open){event.preventDefault();close(true);}};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape)};
 },[]);
 return <details ref={ref} className={className+" neerva-mobile-navigation"} onClick={event=>{
  if(event.target instanceof Element&&event.target.closest("a[href]")&&ref.current){ref.current.open=false;}
 }}>
  <summary ref={node=>{trigger.current=node}} aria-label={hi?"नेविगेशन मेन्यू":"Open navigation menu"} aria-controls={id}>
   <svg className="neerva-menu-open" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
   <svg className="neerva-menu-close" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
  </summary>
  <nav id={id} aria-label={hi?"मोबाइल नेविगेशन":"Mobile navigation"}>{children}</nav>
 </details>;
}
