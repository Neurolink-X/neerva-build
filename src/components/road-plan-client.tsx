"use client";
import dynamic from "next/dynamic";
import type {PlanBrief} from "@/modules/studio/plan-model";
/** This spatial editor relies on WebGL and client-side geometry state. The route
 * itself is a noindex preview; render a stable SSR shell and hydrate the
 * editor only on the browser to avoid mixed server/browser 3D markup.
 */
const Planner=dynamic(()=>import("./road-plan-workbench").then(m=>m.RoadPlanWorkbench),{
 ssr:false,
 loading:()=> <main className="nroad" role="status" aria-label="Loading road-first home planning tool">
  <div className="nroad-hero"><span className="nroad-kicker">NEERVA BUILD · PLANMODEL</span>
   <h1>Plan a house that fits your plot.</h1><p>Loading the road-first concept planner and verified geometry controls…</p></div>
  <div className="nroad-loading" style={{margin:"15px",minHeight:420}}>Preparing 2D rooms and 3D previews…</div>
 </main>
});
export function RoadPlanClient({initialBrief,initialOption=-1}:{initialBrief?:PlanBrief;initialOption?:number}={}){return <><Planner key={JSON.stringify([initialBrief,initialOption])} initialBrief={initialBrief} initialOption={initialOption}/></>;}

