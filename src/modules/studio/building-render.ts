import type {RenderBox,RenderSnapshot,Vec3} from "../../../public/studio-render-v1";
import {shadeRgb,finishSpaces,wallFaceOwners,wallShade,type FinishScheme} from "./finish-model.ts";
import {finishRoughness} from "./commercial-interior-render.ts";
import {commercialStairStudies,commercialInternalSpaces} from "./commercial-internal.ts";
import {stairStepDepthFt} from "./stair-study.ts";
import {commercialFrontPanels,commercialFacadeProfile} from "./commercial-detail.ts";
import {commercialElements} from "./commercial-elements.ts";
import type {BuildingConcept} from "./building-purpose.ts";
import {FEET_TO_METRES as ft,normalize,cross} from "./core/geometry-primitives.ts";
const finishes={limestone:[.72,.67,.56],concrete:[.49,.52,.52],terracotta:[.58,.29,.18]} as const;
export type BuildingFinish=keyof typeof finishes;
/** Render concept walls, openings and slabs from the shared element model. */
export function buildingRenderSnapshot(plan:BuildingConcept,finish:BuildingFinish="limestone",evening=false,view:"front"|"rear"="front",scheme?:FinishScheme):RenderSnapshot{
 const {widthFt,depthFt,floors}=plan.brief,boxes:RenderBox[]=[];
 const x=(v:number)=>(v-widthFt/2)*ft,z=(v:number)=>(v-depthFt/2)*ft;
 const push=(lo:Vec3,hi:Vec3,color:Vec3,rough=.8,material?:FinishScheme['cladding'])=>boxes.push({lo,hi,color,rough,metal:0,opacity:1,finish:material});
 const selected=scheme?.planId===plan.id?scheme:undefined;
 const wall:Vec3=selected?shadeRgb(selected.exterior):[...finishes[finish]];
 const margin=Math.max(1.2,Math.min(3.2,Math.min(widthFt,depthFt)*ft*.08));
 push([x(0)-margin,-.4,z(0)-margin-2],[x(widthFt)+margin,-.23,z(depthFt)+margin],[.24,.32,.21]);
 push([x(0),-.23,z(0)],[x(widthFt),0,z(depthFt)],[.40,.43,.38]);
 push([x(0)-margin,-.22,z(0)-margin-2],[x(widthFt)+margin,-.02,z(0)],[.16,.18,.19]);
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
 const profile=commercialFacadeProfile(plan.brief.purpose),accent:Vec3=selected?shadeRgb(selected.accent):[.25,.29,.28],frame:Vec3=profile.frame;
 for(const p of commercialFrontPanels(plan)){
  const top=(p.floor*13+12.5)*ft,plane=z(p.y),left=x(p.x),right=x(p.x+p.w);
  if(right-left<.6)continue;
  const band=profile.bandFt*ft;
  push([left,top-band,plane-.11],[right,top,plane-.03],accent,.65,selected?.cladding);
  // Shallow, presentation-only trim, above existing 8 ft openings.
  const trim=Math.min(.045,band*.18);
  push([left,top-band,plane-.14],[right,top-band+trim,plane-.11],frame,.48);
 }
 for(const p of elements.portals.filter(p=>p.kind==="exterior-glazing")){
  // Frame stays strictly inside the aperture and leaves the existing opening intact.
  const bottom=(p.floor*13+3)*ft,top=(p.floor*13+8)*ft,len=p.length*ft,thick=Math.min(.055,len*.06),start=p.axis==="x"?x(p.x):z(p.y),plane=p.axis==="x"?z(p.y):x(p.x);
  const add=(a:number,b:number,low:number,high:number)=>{if(b<=a||high<=low)return;const lo:Vec3=p.axis==="x"?[a,low,plane-.045]:[plane-.045,low,a],hi:Vec3=p.axis==="x"?[b,high,plane+.045]:[plane+.045,high,b];push(lo,hi,frame,.35);};
  add(start,start+len,bottom,bottom+thick);add(start,start+len,top-thick,top);
  const count=Math.max(1,Math.ceil(len/1.35));
  for(let i=0;i<=count;i++){const a=Math.min(start+len-thick,Math.max(start,start+len*i/count-thick/2));add(a,a+thick,bottom+thick,top-thick);}
 }
 // Model only verified walking surfaces; no invented steps in unresolved bays.
 for(const study of commercialStairStudies(plan).studies){
  const level=study.floor*13;
  for(const r of study.steps)push([x(r.x),(level+r.topFt-stairStepDepthFt(study,r.topFt))*ft,z(r.y)],[x(r.x+r.w),(level+r.topFt)*ft,z(r.y+r.d)],[.56,.54,.49]);
  for(const r of study.landings.filter(l=>l.topFt>0))push([x(r.x),(level+r.topFt-.46)*ft,z(r.y)],[x(r.x+r.w),(level+r.topFt)*ft,z(r.y+r.d)],[.56,.54,.49]);
 }
 // Lift shaft stays unobstructed; represent closed landing doors at the
 // actual lobby opening, not an invented elevator cabin or certified lift.
 const liftIds=new Set(commercialInternalSpaces(plan).filter(r=>r.kind==="lift").map(r=>r.id));
 for(const p of elements.portals.filter(p=>p.kind==="access"&&liftIds.has(p.zoneId)&&p.axis==="y")){
  const low=(p.floor*13+.35)*ft,high=(p.floor*13+8)*ft,plane=x(p.x),start=z(p.y),end=z(p.y+p.length),mid=(start+end)/2;
  for(const [a,b] of [[start,mid-.01],[mid+.01,end]])if(b>a)boxes.push({lo:[plane-.025,low,a],hi:[plane+.025,high,b],color:[.52,.56,.58],rough:.3,metal:.72,opacity:1});
 }
 const distance=Math.max(widthFt,depthFt,floors*13)*ft;
 const origin:Vec3=[distance*.85,distance*.7,(view==="front"?-1:1)*distance*1.45];
 const forward=normalize([-origin[0],floors*13*ft*.35-origin[1],-origin[2]]),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
 return {boxes,camera:{origin,forward,right,up,fov:45,aspect:1.5},evening};
}

/** Selected floor preview: keep the actual opening-aware wall/slab model, not the roof or adjacent storeys. */
export function buildingFloorSnapshot(plan:BuildingConcept,floor:number,scheme:FinishScheme,fullHeight=false):RenderSnapshot{
 const {widthFt,depthFt}=plan.brief,boxes:RenderBox[]=[];
 const x=(v:number)=>(v-widthFt/2)*ft,z=(v:number)=>(v-depthFt/2)*ft;
 const add=(lo:Vec3,hi:Vec3,color:Vec3,rough=.82,opacity=1,finish?:FinishScheme["cladding"])=>{if(hi.every((v,i)=>Number.isFinite(v)&&Number.isFinite(lo[i])&&v>lo[i]))boxes.push({lo,hi,color,rough,metal:0,opacity,finish});};
 const elements=commercialElements(plan),cut=fullHeight?13:7;
 const rooms=finishSpaces({kind:"commercial",plan}).filter(r=>r.floor===floor);
 const selected=scheme.planId===plan.id?scheme:undefined;
 for(const s of elements.slabs.filter(s=>s.floor===floor&&s.bottom===0)){
  add([x(s.x),0,z(s.y)],[x(s.x+s.w),s.top*ft,z(s.y+s.d)],shadeRgb("#d5cabc"));
  // Apply finishes only over existing slab intersections, never fill stair or shaft voids.
  for(const r of rooms){
   const a=Math.max(r.x,s.x),b=Math.min(r.x+r.w,s.x+s.w),d=Math.max(r.y,s.y),e=Math.min(r.y+r.d,s.y+s.d);
   if(b-a>1e-5&&e-d>1e-5)add([x(a),s.top*ft,z(d)],[x(b),s.top*ft+.003,z(e)],shadeRgb(selected?.rooms[r.id]?.floor??"#d5cabc"),finishRoughness(selected?.rooms[r.id]?.materials?.floor),1,selected?.rooms[r.id]?.materials?.floor);
  }
 }
 for(const w of elements.walls.filter(w=>w.floor===floor&&w.bottom<cut)){
  const t=w.thickness/2,lo=w.bottom*ft,hi=Math.min(w.top,cut)*ft;
  const owners=wallFaceOwners(rooms,{axis:w.axis==="x"?"z":"x",floorIndex:floor,planeFt:w.plane,startFt:w.start,endFt:w.end});
  // Unfinished walls need one solid box, not two coincident internal faces.
  if(!owners.length){const tone=shadeRgb(selected?.exterior??"#ddd7c9");if(w.axis==="x")add([x(w.start),lo,z(w.plane-t)],[x(w.end),hi,z(w.plane+t)],tone);else add([x(w.plane-t),lo,z(w.start)],[x(w.plane+t),hi,z(w.end)],tone);continue;}
  // Two half-thickness faces share the original exact wall volume.
  for(const inward of [-1,1] as const){
   const owner=owners.find(o=>o.inward===inward),f=owner?selected?.rooms[owner.id]:undefined;
   const tone=shadeRgb(owner?wallShade(f,owner.side,selected?.exterior??"#ddd7c9"):selected?.exterior??"#ddd7c9");
   const a=w.plane+(inward===-1?-t:0),b=w.plane+(inward===-1?0:t);
   if(w.axis==="x")add([x(w.start),lo,z(a)],[x(w.end),hi,z(b)],tone,finishRoughness(f?.materials?.wall),1,f?.materials?.wall);
   else add([x(a),lo,z(w.start)],[x(b),hi,z(w.end)],tone,finishRoughness(f?.materials?.wall),1,f?.materials?.wall);
  }
 }
 // Real aperture frames fit inside existing openings; no extra opening or solid doorway.
 for(const p of elements.portals.filter(p=>p.floor===floor)){
  const glass=p.kind==="exterior-glazing",bottom=(glass?3:0)*ft,top=Math.min(8,cut)*ft;
  if(top<=bottom)continue;
  const start=p.axis==="x"?x(p.x):z(p.y),end=start+p.length*ft,plane=p.axis==="x"?z(p.y):x(p.x),t=.035,bar=Math.min(.05,(end-start)/8);
  const frame=(a:number,b:number,l:number,h:number,colour:Vec3,rough=.4,opacity=1)=>{
   if(p.axis==="x")add([a,l,plane-t],[b,h,plane+t],colour,rough,opacity);
   else add([plane-t,l,a],[plane+t,h,b],colour,rough,opacity);
  };
  const frameTone:Vec3=glass?commercialFacadeProfile(plan.brief.purpose).frame:[.42,.35,.28];
  frame(start,start+bar,bottom,top,frameTone);frame(end-bar,end,bottom,top,frameTone);
  // A cutaway must not invent a header across a doorway/window below its real head.
  if(cut>=8)frame(start+bar,end-bar,top-bar,top,frameTone);
  if(glass){
   frame(start+bar,end-bar,bottom,bottom+bar,frameTone);
   frame(start+bar,end-bar,bottom+bar,cut>=8?top-bar:top,shadeRgb(selected?.glass??"#9bbac7"),.18,.32);
   const n=Math.max(1,Math.ceil((end-start)/1.35));
   for(let i=1;i<n;i++){const a=start+(end-start)*i/n;frame(a-bar/2,a+bar/2,bottom+bar,cut>=8?top-bar:top,frameTone);}
  }
 }
 for(const z0 of plan.zones.filter(r=>r.floor===floor&&["open","parking"].includes(r.kind)))add([x(z0.x),0,z(z0.y)],[x(z0.x+z0.w),.08,z(z0.y+z0.d)],shadeRgb(z0.kind==="open"?"#bdcdb1":"#b8bcb9"));
 for(const s of commercialStairStudies(plan).studies.filter(s=>s.floor===floor))for(const r of [...s.steps,...s.landings.filter(l=>l.topFt>0)]){
  if(r.topFt<=cut)add([x(r.x),Math.max(0,r.topFt-.45)*ft,z(r.y)],[x(r.x+r.w),r.topFt*ft,z(r.y+r.d)],shadeRgb("#b4a48d"));
 }
 const distance=Math.max(widthFt,depthFt)*ft,origin:Vec3=[distance*.8,distance*1.4,-distance*1.2];
 const forward=normalize([-origin[0],1-origin[1],-origin[2]]),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
 return {boxes,camera:{origin,forward,right,up,fov:45,aspect:1.5},evening:false};
}
