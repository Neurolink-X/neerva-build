import type {RenderBox,RenderSnapshot,Vec3} from "../../../public/studio-render-v1";
import {shadeRgb,type FinishScheme} from "./finish-model.ts";
import {finishRoughness} from "./commercial-interior-render.ts";
import {commercialFrontPanels} from "./commercial-detail.ts";
import {commercialElements} from "./commercial-elements.ts";
import type {BuildingConcept} from "./building-purpose.ts";
const ft=.3048;
const normalize=(v:Vec3):Vec3=>{const n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n]};
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const finishes={limestone:[.72,.67,.56],concrete:[.49,.52,.52],terracotta:[.58,.29,.18]} as const;
export type BuildingFinish=keyof typeof finishes;
/** Render concept walls, openings and slabs from the shared element model. */
export function buildingRenderSnapshot(plan:BuildingConcept,finish:BuildingFinish="limestone",evening=false,view:"front"|"rear"="front",scheme?:FinishScheme):RenderSnapshot{
 const {widthFt,depthFt,floors}=plan.brief,boxes:RenderBox[]=[];
 const x=(v:number)=>(v-widthFt/2)*ft,z=(v:number)=>(v-depthFt/2)*ft;
 const push=(lo:Vec3,hi:Vec3,color:Vec3,rough=.8,material?:FinishScheme['cladding'])=>boxes.push({lo,hi,color,rough,metal:0,opacity:1,finish:material});
 const selected=scheme?.planId===plan.id?scheme:undefined;
 const wall:Vec3=selected?shadeRgb(selected.exterior):[...finishes[finish]];
 push([x(0)-8,-.4,z(0)-8],[x(widthFt)+8,-.23,z(depthFt)+8],[.24,.32,.21]);
 push([x(0),-.23,z(0)],[x(widthFt),0,z(depthFt)],[.40,.43,.38]);
 push([x(0)-6,-.22,z(0)-5],[x(widthFt)+6,-.02,z(0)],[.16,.18,.19]);
 const elements=commercialElements(plan);
 for(const r of plan.zones.filter(z=>z.kind==="open"||z.kind==="parking"))push([x(r.x),0,z(r.y)],[x(r.x+r.w),.12*ft,z(r.y+r.d)],r.kind==="open"?[.30,.43,.24]:[.33,.35,.35]);
 for(const s of elements.slabs)push([x(s.x),(s.floor*13+s.bottom)*ft,z(s.y)],[x(s.x+s.w),(s.floor*13+s.top)*ft,z(s.y+s.d)],[.46,.48,.45]);
 for(const a of elements.walls){
  const low=(a.floor*13+a.bottom)*ft,high=(a.floor*13+a.top)*ft,t=a.thickness/2;
  const core=plan.zones.some(r=>r.floor===a.floor&&r.kind==="core"&&(a.axis==="x"?(Math.abs(r.y-a.plane)<1e-5||Math.abs(r.y+r.d-a.plane)<1e-5)&&a.start>=r.x-1e-5&&a.end<=r.x+r.w+1e-5:(Math.abs(r.x-a.plane)<1e-5||Math.abs(r.x+r.w-a.plane)<1e-5)&&a.start>=r.y-1e-5&&a.end<=r.y+r.d+1e-5));
  const tone=selected&&core?shadeRgb(selected.accent):wall;
  if(a.axis==="x")push([x(a.start),low,z(a.plane-t)],[x(a.end),high,z(a.plane+t)],tone,finishRoughness(selected?.cladding),selected?.cladding);
  else push([x(a.plane-t),low,z(a.start)],[x(a.plane+t),high,z(a.end)],tone,finishRoughness(selected?.cladding),selected?.cladding);
 }
 for(const p of elements.portals.filter(p=>p.kind==="exterior-glazing")){
  const low=(p.floor*13+3)*ft,high=(p.floor*13+8)*ft,t=.035;
  boxes.push({lo:[x(p.x-(p.axis==="y"?t:0)),low,z(p.y-(p.axis==="x"?t:0))],hi:[x(p.x+(p.axis==="x"?p.length:t)),high,z(p.y+(p.axis==="y"?p.length:t))],color:selected?shadeRgb(selected.glass):[.36,.56,.65],opacity:.25,metal:0,rough:.15});
 }
 // Finish details follow actual facade intervals and existing window holes.
 // No invented windows, cantilevers or additional floor area.
 const accent:Vec3=selected?shadeRgb(selected.accent):[.25,.29,.28],frame:Vec3=[.16,.20,.21];
 for(const p of commercialFrontPanels(plan)){
  const top=(p.floor*13+12.5)*ft,plane=z(p.y),left=x(p.x),right=x(p.x+p.w);
  if(right-left<.6)continue;
  const band=plan.brief.purpose==="school"?.16:plan.brief.purpose==="restaurant"?.32:.24;
  push([left,top-band,plane-.11],[right,top,plane-.03],accent,.65,selected?.cladding);
 }
 for(const p of elements.portals.filter(p=>p.kind==="exterior-glazing")){
  // Frame stays strictly inside the aperture and leaves the existing opening intact.
  const bottom=(p.floor*13+3)*ft,top=(p.floor*13+8)*ft,len=p.length*ft,thick=Math.min(.055,len*.06),start=p.axis==="x"?x(p.x):z(p.y),plane=p.axis==="x"?z(p.y):x(p.x);
  const add=(a:number,b:number,low:number,high:number)=>{if(b<=a||high<=low)return;const lo:Vec3=p.axis==="x"?[a,low,plane-.045]:[plane-.045,low,a],hi:Vec3=p.axis==="x"?[b,high,plane+.045]:[plane+.045,high,b];push(lo,hi,frame,.35);};
  add(start,start+len,bottom,bottom+thick);add(start,start+len,top-thick,top);
  const count=Math.max(1,Math.ceil(len/1.35));
  for(let i=0;i<=count;i++){const a=Math.min(start+len-thick,Math.max(start,start+len*i/count-thick/2));add(a,a+thick,bottom+thick,top-thick);}
 }
 const distance=Math.max(widthFt,depthFt,floors*13)*ft;
 const origin:Vec3=[distance*.85,distance*.7,(view==="front"?-1:1)*distance*1.45];
 const forward=normalize([-origin[0],floors*13*ft*.35-origin[1],-origin[2]]),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
 return {boxes,camera:{origin,forward,right,up,fov:45,aspect:1.5},evening};
}
