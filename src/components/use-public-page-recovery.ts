"use client";
import {useEffect} from "react";
import {safeRecoveryPage,recoveryAllowed,recoveryKey} from "@/modules/observability/recovery";
export function usePublicPageRecovery(reset:()=>void){
 useEffect(()=>{
  const path=window.location.pathname;
  if(!safeRecoveryPage(path,window.location.search)||navigator.onLine===false||document.visibilityState!=="visible")return;
  const timer=window.setTimeout(()=>{
   if(window.location.pathname!==path||window.location.search||navigator.onLine===false||document.visibilityState!=="visible")return;
   try{const key=recoveryKey(path),now=Date.now();if(!recoveryAllowed(sessionStorage.getItem(key),now))return;sessionStorage.setItem(key,String(now));}catch{return}
   reset();
  },900);
  return()=>window.clearTimeout(timer);
 },[reset]);
}
