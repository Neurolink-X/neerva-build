import {overlapArea,type Rect} from "./plan-model.ts";
import type {BuildingConcept,BuildingZone} from "./building-purpose.ts";
export type CommercialFixture=Rect&{id:string;zoneId:string;floor:number;label:string;kind:"desk"|"table"|"display"|"counter"};
export type ConceptPortal={id:string;zoneId:string;floor:number;axis:"x"|"y";x:number;y:number;length:number;kind:"access"|"exterior-glazing";reviewRequired:true};
const EPS=1e-5;
export function commercialPortals(plan:BuildingConcept):ConceptPortal[]{
 const result:ConceptPortal[]=[];
 for(const z of plan.zones.filter(z=>!["parking","open","circulation"].includes(z.kind))){
  const hall=plan.zones.find(h=>h.floor===z.floor&&h.kind==="circulation");if(!hall)continue;
  const right=Math.abs(z.x+z.w-hall.x)<EPS,left=Math.abs(z.x-hall.x-hall.w)<EPS;
  const lo=Math.max(z.y,hall.y),hi=Math.min(z.y+z.d,hall.y+hall.d);
  if((right||left)&&hi-lo>=4)result.push({id:z.id+"-access",zoneId:z.id,floor:z.floor,axis:"y",x:right?z.x+z.w:z.x,y:(lo+hi)/2-1.5,length:3,kind:"access",reviewRequired:true});
  if(z.kind!=="primary"||plan.brief.purpose==="rental"||plan.brief.sideFt<3||z.d<8)continue;
  const x=right?z.x:z.x+z.w;
  const occupied=plan.zones.some(a=>a.id!==z.id&&a.floor===z.floor&&!["open","parking"].includes(a.kind)&&Math.abs((right?a.x+a.w:a.x)-x)<EPS&&Math.min(a.y+a.d,z.y+z.d)-Math.max(a.y,z.y)>EPS);
  if(!occupied)result.push({id:z.id+"-glazing",zoneId:z.id,floor:z.floor,axis:"y",x,y:z.y+z.d/2-2,length:4,kind:"exterior-glazing",reviewRequired:true});
 }
 return result;
}
/** Indicative loose furniture, not seat capacity or compliant aisle design. */
export function commercialFixtures(plan:BuildingConcept):CommercialFixture[]{
 if(plan.brief.purpose==="rental")return [];
 const result:CommercialFixture[]=[],portals=commercialPortals(plan);
 for(const z of plan.zones.filter(z=>z.kind==="primary")){
  const school=plan.brief.purpose==="school",restaurant=plan.brief.purpose==="restaurant";
  const kind=school?"desk":restaurant?"table":"display",label=school?"Desk group":restaurant?"Table group":"Display island";
  const w=school?4:restaurant?3:4,d=school?2:restaurant?3:2;
  const reserved:Rect[]=portals.filter(p=>p.zoneId===z.id).map(p=>({x:p.x-4,y:p.y-2,w:8,d:p.length+4}));
  let n=0;
  for(let y=z.y+5;y+d<=z.y+z.d-4&&n<48;y+=d+4)for(let x=z.x+5;x+w<=z.x+z.w-4&&n<48;x+=w+4){
   const r={x,y,w,d};
   if(reserved.some(a=>overlapArea(a,r)>EPS))continue;
   result.push({...r,id:z.id+"-fixture-"+n++,zoneId:z.id,floor:z.floor,label,kind});
  }
 }
 return result;
}
export function commercialGeometryIssues(plan:BuildingConcept):string[]{
 const fixtures=commercialFixtures(plan),portals=commercialPortals(plan),issues:string[]=[];
 for(const f of fixtures){const z=plan.zones.find(z=>z.id===f.zoneId);if(!z||f.floor!==z.floor||Math.abs(overlapArea(f,z)-f.w*f.d)>EPS)issues.push("Fixture outside parent "+f.id);}
 for(let i=0;i<fixtures.length;i++)for(let j=i+1;j<fixtures.length;j++)if(fixtures[i].floor===fixtures[j].floor&&overlapArea(fixtures[i],fixtures[j])>EPS)issues.push("Fixture overlap "+fixtures[i].id);
 for(const p of portals){const z=plan.zones.find(z=>z.id===p.zoneId);if(!z||p.floor!==z.floor||p.y<z.y-EPS||p.y+p.length>z.y+z.d+EPS||Math.min(Math.abs(p.x-z.x),Math.abs(p.x-z.x-z.w))>EPS)issues.push("Portal outside wall "+p.id);}
 return issues;
}
