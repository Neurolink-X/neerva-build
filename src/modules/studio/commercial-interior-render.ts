import type {RenderBox,RenderSnapshot,Vec3} from "../../../public/studio-render-v1";
import {commercialFixtures,commercialPortals} from "./commercial-detail.ts";
import {finishSpaces,shadeRgb,wallShade,type FinishScheme,type FinishMaterial} from "./finish-model.ts";
import {wallBoxes,type Side} from "./plan-model.ts";
import type {BuildingConcept} from "./building-purpose.ts";
const FT=.3048;
const normalize=(v:Vec3):Vec3=>{const n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n]};
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function finishRoughness(m:FinishMaterial|undefined){return m==="marble"?.25:m==="tile"?.38:m==="acp"?.35:m==="wood"?.6:.83;}
export function commercialInteriorSnapshot(plan:BuildingConcept,scheme:FinishScheme,roomId:string,evening=false):RenderSnapshot|null{
 if(scheme.planId!==plan.id)return null;
 const r=finishSpaces({kind:"commercial",plan}).find(z=>z.id===roomId),f=scheme.rooms[roomId];if(!r||!f||r.w<5||r.d<5)return null;
 const w=r.w*FT,d=r.d*FT,h=13*FT,boxes:RenderBox[]=[];
 const push=(lo:Vec3,hi:Vec3,color:Vec3,rough=.8,opacity=1,finish?:FinishMaterial)=>boxes.push({lo,hi,color,rough,metal:0,opacity,finish});
 push([0,-.12,0],[w,0,d],shadeRgb(f.floor),finishRoughness(f.materials?.floor),1,f.materials?.floor);
 push([0,h,0],[w,h+.12,d],shadeRgb(f.ceiling),finishRoughness(f.materials?.ceiling),1,f.materials?.ceiling);
 const portals=commercialPortals(plan).filter(p=>p.zoneId===r.id);
 for(const side of ["front","rear","left","right"] as Side[]){
  const vertical:boolean=side==="left"||side==="right";
  const plane:number=vertical?(side==="left"?r.x:r.x+r.w):(side==="front"?r.y:r.y+r.d);
  const start:number=vertical?r.y:r.x,length:number=vertical?r.d:r.w;
  const openings:{atFt:number;widthFt:number;sillFt:number;heightFt:number;kind:"access"|"exterior-glazing"}[]=portals.filter(p=>p.axis===(vertical?"y":"x")&&Math.abs((vertical?p.x:p.y)-plane)<1e-5).map(p=>({atFt:(vertical?p.y:p.x)-start,widthFt:p.length,sillFt:p.kind==="access"?0:3,heightFt:p.kind==="access"?8:5,kind:p.kind})).filter(p=>p.atFt>=-1e-6&&p.atFt+p.widthFt<=length+1e-6).sort((a,b)=>a.atFt-b.atFt);
  const accepted: {atFt:number;widthFt:number;sillFt:number;heightFt:number;kind:"access"|"exterior-glazing"}[]=[];for(const p of openings)if(!accepted.length||p.atFt>=accepted[accepted.length-1].atFt+accepted[accepted.length-1].widthFt-1e-6){const atFt=Math.max(0,p.atFt),widthFt=Math.min(p.widthFt,length-atFt);if(widthFt>1e-6)accepted.push({...p,atFt,widthFt});}
  const coords=(a:number,b:number,low:number,high:number,t:number):[Vec3,Vec3]=>vertical?[[side==="left"?-t:w,low*FT,a*FT],[side==="left"?0:w+t,high*FT,b*FT]]:[[a*FT,low*FT,side==="front"?-t:d],[b*FT,high*FT,side==="front"?0:d+t]];
  for(const cell of wallBoxes(length,13,accepted)){const [lo,hi]=coords(cell.x0,cell.x1,cell.y0,cell.y1,.12);push(lo,hi,shadeRgb(wallShade(f,side,f.wall)),finishRoughness(f.materials?.wall),1,f.materials?.wall);}
  for(const p of accepted.filter(p=>p.kind==="exterior-glazing")){const [lo,hi]=coords(p.atFt,p.atFt+p.widthFt,3,8,.03);push(lo,hi,shadeRgb(scheme.glass),.15,.3);}
 }
 for(const item of commercialFixtures(plan).filter(z=>z.zoneId===r.id)){
  const x=(item.x-r.x)*FT,z=(item.y-r.y)*FT,fw=item.w*FT,fd=item.d*FT;
  // Distinct tabletop and support geometry, kept within the existing furniture footprint.
  if(fw<.25||fd<.25){push([x,0,z],[x+fw,.76,z+fd],[.45,.32,.21],.65);continue;}
  if(item.kind==="table"&&fw>=.8&&fd>=.8){
   // Table and two compact seats share the reserved furniture footprint.
   const top=.76,seat=.43,tw=fw*.8,td=fd*.43,tx=x+(fw-tw)/2,tz=z+(fd-td)/2;
   push([tx,top-.045,tz],[tx+tw,top,tz+td],[.52,.37,.24],.48,1,"wood");
   for(const lx of [tx+.035,tx+tw-.085])for(const lz of [tz+.035,tz+td-.085])push([lx,0,lz],[lx+.05,top-.045,lz+.05],[.20,.22,.23],.38);
   const sw=fw*.55,sd=fd*.22,sx=x+(fw-sw)/2;
   for(const side of [0,1]){const sz=side===0?z:z+fd-sd;push([sx,seat-.05,sz],[sx+sw,seat,sz+sd],[.28,.38,.33],.7);
    const back=side===0?sz:sz+sd-.045;push([sx,seat,back],[sx+sw,.83,back+.045],[.28,.38,.33],.7);
    for(const lx of [sx+.025,sx+sw-.065])for(const lz of [sz+.025,sz+sd-.065])push([lx,0,lz],[lx+.04,seat-.05,lz+.04],[.20,.22,.23],.4);
   }continue;
  }
  const top=item.kind==="display"?.95:.76,leg=Math.min(.065,fw*.14,fd*.14),inset=leg*.6;
  push([x,top-.045,z],[x+fw,top,z+fd],[.52,.37,.24],.48,1,"wood");
  for(const lx of [x+inset,x+fw-leg-inset])for(const lz of [z+inset,z+fd-leg-inset])push([lx,0,lz],[lx+leg,top-.045,lz+leg],[.20,.22,.23],.38);
  if(item.kind==="display")push([x+inset,.26,z+inset],[x+fw-inset,.30,z+fd-inset],[.52,.37,.24],.55,1,"wood");
 }
 const origin:Vec3=[Math.min(.7,w*.18),1.6,Math.min(.7,d*.16)],forward=normalize([w*.64,0,d*.68]),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
 return {boxes,camera:{origin,forward,right,up,fov:65,aspect:1.5},evening,lights:[{position:[w*.32,h-.2,d*.33],color:evening?[1,.78,.55]:[1,.94,.83],power:Math.min(100,w*d*.8)},{position:[w*.68,h-.2,d*.67],color:evening?[1,.78,.55]:[1,.94,.83],power:Math.min(100,w*d*.8)}]};
}
