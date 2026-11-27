import {wallBoxes,type Rect} from "./plan-model.ts";
import {commercialPortals} from "./commercial-detail.ts";
import type {BuildingConcept} from "./building-purpose.ts";
export type ConceptWall={id:string;floor:number;axis:"x"|"y";plane:number;start:number;end:number;bottom:number;top:number;thickness:number};
export type ConceptSlab=Rect&{id:string;floor:number;bottom:number;top:number};
const EPS=1e-5,HEIGHT=13;
export function commercialElements(plan:BuildingConcept){
 const walls:ConceptWall[]=[],slabs:ConceptSlab[]=[],portals=commercialPortals(plan);
 const groups=new Map<string,{floor:number;axis:"x"|"y";plane:number;spans:{a:number;b:number}[]}>();
 for(const z of plan.zones.filter(z=>!["open","parking"].includes(z.kind))){
  slabs.push({id:z.id+"-floor",floor:z.floor,x:z.x,y:z.y,w:z.w,d:z.d,bottom:0,top:.35});
  if(z.floor===plan.brief.floors-1)slabs.push({id:z.id+"-roof",floor:z.floor,x:z.x,y:z.y,w:z.w,d:z.d,bottom:12.5,top:13});
  for(const [axis,plane,a,b] of [["x",z.y,z.x,z.x+z.w],["x",z.y+z.d,z.x,z.x+z.w],["y",z.x,z.y,z.y+z.d],["y",z.x+z.w,z.y,z.y+z.d]] as const){
   const key=[z.floor,axis,Math.round(plane/EPS)].join(":");
   const g=groups.get(key)??{floor:z.floor,axis,plane,spans:[]};g.spans.push({a,b});groups.set(key,g);
  }
 }
 for(const g of groups.values()){
  const holes=portals.filter(p=>p.floor===g.floor&&p.axis===g.axis&&Math.abs((p.axis==="x"?p.y:p.x)-g.plane)<EPS);
  const cuts=[...new Set([...g.spans.flatMap(s=>[s.a,s.b]),...holes.flatMap(p=>{const a=p.axis==="x"?p.x:p.y;return [a,a+p.length]})])].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
   const start=cuts[i],end=cuts[i+1],mid=(start+end)/2;
   if(end-start<EPS||!g.spans.some(s=>mid>s.a-EPS&&mid<s.b+EPS))continue;
   const p=holes.find(p=>{const a=p.axis==="x"?p.x:p.y;return mid>a-EPS&&mid<a+p.length+EPS});
   const parts=wallBoxes(end-start,HEIGHT,p?[{atFt:0,widthFt:end-start,sillFt:p.kind==="access"?0:3,heightFt:p.kind==="access"?8:5}]:[]);
   for(const q of parts)walls.push({id:"wall-"+walls.length,floor:g.floor,axis:g.axis,plane:g.plane,start:start+q.x0,end:start+q.x1,bottom:q.y0,top:q.y1,thickness:.5});
  }
 }
 return {walls,slabs,portals,conceptOnly:true as const};
}
