import type {RenderBox,Vec3} from "../../../public/studio-render-v1";
import type {CommercialFixture} from "./commercial-detail.ts";
import {FEET_TO_METRES as ft} from "./core/geometry-primitives.ts";
/** Overview-level furniture, bounded to its real 2D footprint. No extra walls,
 * seating-capacity certification, fabricated room areas or structural changes. */
export function commercialFixtureBoxes(item:CommercialFixture,offsetX=0,offsetY=0):RenderBox[]{
 const x=(item.x-offsetX)*ft,z=(item.y-offsetY)*ft,w=item.w*ft,d=item.d*ft,base=.35*ft+.003,boxes:RenderBox[]=[];
 const add=(lo:Vec3,hi:Vec3,color:Vec3,rough=.75,finish?:RenderBox["finish"])=>{if(hi.every((v,i)=>Number.isFinite(v)&&Number.isFinite(lo[i])&&v>lo[i]))boxes.push({lo,hi,color,rough,metal:0,opacity:1,finish});};
 const wood:Vec3=[.52,.37,.24],fabric:Vec3=[.35,.43,.38],metal:Vec3=[.20,.23,.24];
 const block=(a:number,b:number,c:number,e:number,l:number,h:number,color:Vec3,finish?:RenderBox["finish"])=>add([x+a*w,base+l,z+b*d],[x+c*w,base+h,z+e*d],color,.72,finish);
 switch(item.kind){
  case "bed":block(0,0,1,1,0,.30,wood,"wood");block(.025,.025,.975,.975,.30,.53,[.89,.86,.79]);block(0,0,1,.06,.30,.94,wood,"wood");break;
  case "sofa":block(0,0,1,1,0,.43,fabric);block(0,0,1,.20,.43,.90,fabric);block(0,.20,.09,1,.43,.64,fabric);block(.91,.20,1,1,.43,.64,fabric);break;
  case "counter":block(0,0,1,1,0,.85,wood,"wood");block(0,0,1,1,.85,.90,[.34,.36,.35],"marble");break;
  case "table":block(.12,.31,.88,.69,.71,.76,wood,"wood");block(.45,.45,.55,.55,0,.71,metal);for(const b of [0,.79])block(.25,b,.75,b+.21,0,.44,fabric);break;
  case "display":block(.03,.03,.97,.97,0,.12,metal);block(.03,.03,.97,.97,.25,.30,wood,"wood");block(.03,.03,.97,.97,.90,.95,wood,"wood");block(.46,.12,.54,.88,.12,.90,metal);break;
  case "desk":block(0,0,1,1,.70,.75,wood,"wood");block(.06,.08,.13,.92,0,.70,metal);block(.87,.08,.94,.92,0,.70,metal);break;
 }
 return boxes;
}
