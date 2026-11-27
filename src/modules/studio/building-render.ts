import type {RenderBox,RenderSnapshot,Vec3} from "../../../public/studio-render-v1";
import type {BuildingConcept} from "./building-purpose.ts";
const ft=.3048;
const normalize=(v:Vec3):Vec3=>{const n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n]};
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const finishes={limestone:[.72,.67,.56],concrete:[.49,.52,.52],terracotta:[.58,.29,.18]} as const;
export type BuildingFinish=keyof typeof finishes;
/** Render the exact site-local volumetric geometry. Exterior openings, cladding
 * engineering and stairs are deliberately absent until actual designs exist. */
export function buildingRenderSnapshot(plan:BuildingConcept,finish:BuildingFinish="limestone",evening=false,view:"front"|"rear"="front"):RenderSnapshot{
 const {widthFt,depthFt,floors}=plan.brief,boxes:RenderBox[]=[];
 const x=(v:number)=>(v-widthFt/2)*ft,z=(v:number)=>(v-depthFt/2)*ft;
 const push=(lo:Vec3,hi:Vec3,color:Vec3,rough=.8)=>boxes.push({lo,hi,color,rough,metal:0,opacity:1});
 const wall:Vec3=[...finishes[finish]];
 push([x(0)-8,-.4,z(0)-8],[x(widthFt)+8,-.23,z(depthFt)+8],[.24,.32,.21]);
 push([x(0),-.23,z(0)],[x(widthFt),0,z(depthFt)],[.40,.43,.38]);
 push([x(0)-6,-.22,z(0)-5],[x(widthFt)+6,-.02,z(0)],[.16,.18,.19]);
 for(const r of plan.zones){
  const open=r.kind==="open"||r.kind==="parking",base=r.floor*13*ft,top=base+(open?.12:13)*ft;
  const c:Vec3=r.kind==="open"?[.30,.43,.24]:r.kind==="parking"?[.33,.35,.35]:r.kind==="core"?[.46,.48,.45]:wall;
  push([x(r.x),base,z(r.y)],[x(r.x+r.w),top,z(r.y+r.d)],c);
 }
 const distance=Math.max(widthFt,depthFt,floors*13)*ft;
 const origin:Vec3=[distance*.85,distance*.7,(view==="front"?-1:1)*distance*1.45];
 const forward=normalize([-origin[0],floors*13*ft*.35-origin[1],-origin[2]]),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
 return {boxes,camera:{origin,forward,right,up,fov:45,aspect:1.5},evening};
}
