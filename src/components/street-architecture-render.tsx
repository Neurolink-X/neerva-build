"use client";
import {useState} from "react";
import {BrowserArchitectureRender} from "./browser-architecture-render";
import {streetRenderSnapshot} from "@/modules/studio/street-render";
import type {PlanModel} from "@/modules/studio/plan-model";
export function StreetArchitectureRender({plan,glass}:{plan:PlanModel;glass?:string}){
 const [view,setView]=useState<"front"|"corner">("corner"),[evening,setEvening]=useState(false);
 return <section aria-label="Plan-matched realistic street preview" data-plan-id={plan.id}>
  <div className="nbd-buttons" role="group" aria-label="Street camera">
   <button type="button" aria-pressed={view==="front"} onClick={()=>setView("front")}>Straight front</button>
   <button type="button" aria-pressed={view==="corner"} onClick={()=>setView("corner")}>Street corner</button>
   <button type="button" aria-pressed={!evening} onClick={()=>setEvening(false)}>Daylight</button>
   <button type="button" aria-pressed={evening} onClick={()=>setEvening(true)}>Evening</button>
  </div>
  <BrowserArchitectureRender key={view+":"+evening} title="Render this house from the street" description="Create a local ray-traced concept from your current rooms, openings, gate positions, facade finish and road-facing geometry. No stock picture or WebGL requirement." capture={()=>streetRenderSnapshot(plan,glass,view,evening)}/>
  <p className="nroad-small">Concept only: context pavement and street are illustrative; structural details, neighbouring buildings and actual site lighting are unverified.</p>
 </section>;
}
