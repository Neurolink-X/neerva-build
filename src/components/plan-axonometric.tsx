import {buildingWallCells} from "@/modules/studio/geometry";
import type {StudioDesign} from "@/modules/studio/library";
import type {PlanModel} from "@/modules/studio/plan-model";
import {roadRect,roadPoint,siteDimensions} from "@/modules/studio/plan-coordinate";

export function PlanAxonometric({plan,design,floor}:{plan:PlanModel;design:StudioDesign;floor?:number}){
 const {widthFt:w,depthFt:d,roadSide}=plan.plot;
 const size=siteDimensions(w,d,roadSide);
 const height=plan.walls.heightFt;
 const project=(x:number,y:number,z:number)=>[(x-y)*.86,(x+y)*.5-z].join(",");
 const plates=plan.rooms.filter(r=>floor===undefined||r.floor===floor).map(room=>{
  const r=roadRect(room,w,d,roadSide),z=(floor===undefined?room.floor:0)*height;
  const points=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>project(x,y,z)).join(" ");
  return {key:room.id,depth:r.x+r.y+r.w/2+r.d/2,level:room.floor,points,fill:room.kind==="bath"?"#bbd6dd":room.kind==="bedroom"?"#dccfbf":"#dfdfce",label:room.label};
 });
 const walls=buildingWallCells(design).filter(c=>floor===undefined||floor===c.floorIndex).map((c,i)=>{
  const endpoint=(v:number)=>roadPoint(c.axis==="x"?{x:c.planeFt,y:v}:{x:v,y:c.planeFt},w,d,roadSide);
  const a=endpoint(c.startFt),b=endpoint(c.endFt),base=(floor===undefined?c.floorIndex:0)*height;
  const cut=floor===undefined?height:height*.46;
  const low=base+Math.min(c.bottomFt,cut),top=base+Math.min(c.topFt,cut);
  return {key:"wall-"+i,depth:(a.x+b.x+a.y+b.y)/2,level:c.floorIndex,points:[project(a.x,a.y,low),project(b.x,b.y,low),project(b.x,b.y,top),project(a.x,a.y,top)].join(" "),fill:a.x===b.x?"#d0bda4":"#f4eada",label:"Wall"};
 });
 const top=(floor===undefined?plan.floors:1)*height;
 const bounds=[-size.d*.86-2,-top-2,(size.w+size.d)*.86+4,(size.w+size.d)*.5+top+4];
 return <svg viewBox={bounds.join(" ")} style={{width:"100%",maxHeight:460}} role="img" aria-label={"Axonometric view of "+(floor===undefined?"all floors":"floor "+(floor+1))}>
  {[...plates,...walls].sort((a,b)=>a.level-b.level||a.depth-b.depth).map(face=><polygon key={face.key} points={face.points} fill={face.fill} stroke="#605e52" strokeWidth=".12"><title>{face.label}</title></polygon>)}
 </svg>;
}
