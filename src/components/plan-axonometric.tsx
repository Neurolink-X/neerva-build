import {visibleWallCells,CUTAWAY_WALL_RATIO} from "@/modules/studio/geometry";
import type {StudioDesign} from "@/modules/studio/library";
import {isOtsRoom,type PlanModel} from "@/modules/studio/plan-model";
import {modeledWindowGeometry} from "@/modules/studio/ventilation-geometry";
import {otsGrilleBars} from "@/modules/studio/ots-ventilation";
import {roadRect,roadPoint,siteDimensions} from "@/modules/studio/plan-coordinate";
import {residentialStairStudies,stairFloorPatches} from "@/modules/studio/stair-study";
import {siteOutline} from "@/modules/studio/site-shape";

export function PlanAxonometric({plan,design,floor,cutaway=floor!==undefined,showVentilation=false}:{plan:PlanModel;design:StudioDesign;floor?:number;cutaway?:boolean;showVentilation?:boolean}){
 const {widthFt:w,depthFt:d,roadSide}=plan.plot;
 const size=siteDimensions(w,d,roadSide);
 const height=plan.walls.heightFt;
 const project=(x:number,y:number,z:number)=>[(x-y)*.86,(x+y)*.5-z].join(",");
 const stairs=residentialStairStudies(plan);
 const plates=plan.rooms.filter(r=>(floor===undefined||r.floor===floor)&&(!isOtsRoom(r)||r.floor===0)).flatMap(room=>stairFloorPatches(room,stairs.studies).map((patch,index)=>{
  const r=roadRect(patch,w,d,roadSide),z=(floor===undefined?room.floor:0)*height;
  const points=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>project(x,y,z)).join(" ");
  return {key:room.id+"-"+index,depth:r.x+r.y+r.w/2+r.d/2,level:room.floor,points,fill:room.kind==="bath"?"#bbd6dd":room.kind==="bedroom"?"#dccfbf":"#dfdfce",label:room.label};
 }));
 const stairFaces=stairs.studies.filter(s=>floor===undefined||s.floor===floor).flatMap(s=>[...s.steps,...s.landings.filter(l=>l.topFt>0)].map((step,i)=>{
  const r=roadRect(step,w,d,roadSide),z=(floor===undefined?s.floor:0)*height+step.topFt;
  return {key:s.roomId+"-step-"+i,depth:r.x+r.y+r.w/2+r.d/2,level:s.floor,points:[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>project(x,y,z)).join(" "),fill:"#d3b998",label:"Concept stair walking surface"};
 }));
 const walls=visibleWallCells(design,floor,cutaway).map((c,i)=>{
  const endpoint=(v:number)=>roadPoint(c.axis==="x"?{x:c.planeFt,y:v}:{x:v,y:c.planeFt},w,d,roadSide);
  const a=endpoint(c.startFt),b=endpoint(c.endFt),base=(floor===undefined?c.floorIndex:0)*height;
  const low=base+c.bottomFt,top=base+c.topFt;
  return {key:"wall-"+i,depth:(a.x+b.x+a.y+b.y)/2,level:c.floorIndex,points:[project(a.x,a.y,low),project(b.x,b.y,low),project(b.x,b.y,top),project(a.x,a.y,top)].join(" "),fill:a.x===b.x?"#d0bda4":"#f4eada",label:"Wall"};
 });
 const top=(floor===undefined?plan.floors:1)*height;
 const windows=modeledWindowGeometry(plan,floor,cutaway?height*CUTAWAY_WALL_RATIO:height).map(o=>{const a=roadPoint(o.vertical?{x:o.plane,y:o.start}:{x:o.start,y:o.plane},w,d,roadSide),b=roadPoint(o.vertical?{x:o.plane,y:o.end}:{x:o.end,y:o.plane},w,d,roadSide),z=(floor===undefined?o.floor:0)*height;return {key:"window-"+o.id,depth:(a.x+b.x+a.y+b.y)/2+.001,level:o.floor,points:[project(a.x,a.y,z+o.bottom),project(b.x,b.y,z+o.bottom),project(b.x,b.y,z+o.top),project(a.x,a.y,z+o.top)].join(" "),fill:showVentilation?(o.exposure==="review"?"#b47825":"#16865d"):"#9ebdc5",label:"Modeled window · "+o.exposure};});
 const grilles=floor===undefined?otsGrilleBars(plan).map((bar,i)=>{const r=roadRect(bar,w,d,roadSide);return {key:"roof-jaal-"+i,depth:r.x+r.y,level:plan.floors,points:[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>project(x,y,top+.06)).join(" "),fill:showVentilation?"#16865d":"#33453f",label:"Concept roof-jaal grille"};}):[];
 const bounds=[-size.d*.86-2,-top-2,(size.w+size.d)*.86+4,(size.w+size.d)*.5+top+4];
 return <svg viewBox={bounds.join(" ")} style={{width:"100%",maxHeight:460}} role="img" aria-label={"Axonometric view of "+(floor===undefined?"all floors":"floor "+(floor+1))}>
  {(floor===undefined||floor===0)&&<polygon points={siteOutline(w,d,plan.plot.siteShape??{kind:"rectangle"}).map(p=>roadPoint(p,w,d,roadSide)).map(p=>project(p.x,p.y,-.2)).join(" ")} fill="#ede8d8" stroke="#526954" strokeWidth=".25"><title>Measured plot boundary</title></polygon>}
  {[...plates,...stairFaces,...walls,...windows,...grilles].sort((a,b)=>a.level-b.level||a.depth-b.depth).map(face=><polygon key={face.key} points={face.points} fill={face.fill} stroke="#605e52" strokeWidth=".12"><title>{face.label}</title></polygon>)}
 </svg>;
}
