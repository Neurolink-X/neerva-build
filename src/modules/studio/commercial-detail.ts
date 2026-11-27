import {overlapArea,type Rect} from "./plan-model.ts";
import {commercialInternalSpaces,commercialInternalOpenings} from "./commercial-internal.ts";
import {rentalLayouts} from "./rental-layout.ts";
import type {BuildingConcept} from "./building-purpose.ts";
export type CommercialFixture=Rect&{id:string;zoneId:string;floor:number;label:string;kind:"desk"|"table"|"display"|"counter"|"bed"|"sofa"};
export type ConceptPortal={id:string;zoneId:string;floor:number;axis:"x"|"y";x:number;y:number;length:number;kind:"access"|"exterior-glazing";reviewRequired:true;connectsTo?:string};
const EPS=1e-5;
export function commercialPortals(plan:BuildingConcept):ConceptPortal[]{
 const result:ConceptPortal[]=[],rentals=rentalLayouts(plan),inside=commercialInternalSpaces(plan),partitioned=new Set(inside.map(r=>r.parentId));
 for(const z of plan.zones.filter(z=>!["parking","open","circulation"].includes(z.kind))){
  if(partitioned.has(z.id))continue;
  const hall=plan.zones.find(h=>h.floor===z.floor&&h.kind==="circulation");if(!hall)continue;
  const right=Math.abs(z.x+z.w-hall.x)<EPS,left=Math.abs(z.x-hall.x-hall.w)<EPS;
  const lo=Math.max(z.y,hall.y),hi=Math.min(z.y+z.d,hall.y+hall.d);
  if((right||left)&&hi-lo>=4){
   const living=rentals.find(u=>u.unitId===z.id)?.rooms.find(r=>r.kind==="living");
   const center=living?living.y+living.d/2:(lo+hi)/2;
   result.push({id:z.id+"-access",zoneId:z.id,floor:z.floor,axis:"y",x:right?z.x+z.w:z.x,y:center-1.5,length:3,kind:"access",reviewRequired:true});
  }
  if(z.kind!=="primary"||plan.brief.purpose==="rental"||plan.brief.sideFt<3||z.d<8)continue;
  const x=right?z.x:z.x+z.w;
  const occupied=plan.zones.some(a=>a.id!==z.id&&a.floor===z.floor&&!["open","parking"].includes(a.kind)&&Math.abs((right?a.x+a.w:a.x)-x)<EPS&&Math.min(a.y+a.d,z.y+z.d)-Math.max(a.y,z.y)>EPS);
  if(!occupied)result.push({id:z.id+"-glazing",zoneId:z.id,floor:z.floor,axis:"y",x,y:z.y+z.d/2-2,length:4,kind:"exterior-glazing",reviewRequired:true});
 }
 for(const p of commercialFrontPanels(plan)){
  if(p.w<8||p.y>plan.brief.frontFt+.01)continue;
  const entry=p.kind==="circulation"&&p.floor===0;
  if(!entry&&(p.kind!=="primary"&&p.kind!=="circulation"))continue;
  if(partitioned.has(p.zoneId)||plan.brief.purpose==="rental"&&!entry)continue;
  const length=entry?Math.min(6,p.w-2):Math.min(8,p.w-2);
  result.push({id:p.zoneId+"-front-"+p.x,zoneId:p.zoneId,floor:p.floor,axis:"x",x:p.x+(p.w-length)/2,y:p.y,length,kind:entry?"access":"exterior-glazing",reviewRequired:true});
 }
 return [...result,...commercialInternalOpenings(plan)];
}
 /** Indicative loose furniture, not seat capacity or compliant aisle design. */
export function commercialFixtures(plan:BuildingConcept):CommercialFixture[]{
 if(plan.brief.purpose==="rental"){
  const portals=commercialPortals(plan),out:CommercialFixture[]=[];
  for(const r of commercialInternalSpaces(plan)){
   const kind=r.kind==="bedroom"?"bed":r.kind==="living"?"sofa":r.kind==="kitchen"?"counter":null;
   if(!kind)continue;
   const w=kind==="bed"?5:kind==="sofa"?6:5,d=kind==="bed"?6.5:kind==="sofa"?2.5:2;
   if(r.w<w+4||r.d<d+4)continue;
   const blocked=portals.filter(p=>p.zoneId===r.id||p.connectsTo===r.id).map(portalClearance);
   const candidates=[{x:r.x+2,y:r.y+2,w,d},{x:r.x+r.w-w-2,y:r.y+2,w,d},{x:r.x+2,y:r.y+r.d-d-2,w,d},{x:r.x+r.w-w-2,y:r.y+r.d-d-2,w,d}];
   const fit=candidates.find(c=>blocked.every(b=>overlapArea(c,b)<EPS));if(fit)out.push({...fit,id:r.id+"-furniture",zoneId:r.id,floor:r.floor,kind,label:kind==="bed"?"Bed":kind==="sofa"?"Sofa":"Kitchen counter"});
  }
  return out;
 }
 const result:CommercialFixture[]=[],portals=commercialPortals(plan);
 for(const z of plan.zones.filter(z=>z.kind==="primary")){
  const school=plan.brief.purpose==="school",restaurant=plan.brief.purpose==="restaurant";
  const kind=school?"desk":restaurant?"table":"display",label=school?"Desk group":restaurant?"Table group":"Display island";
  const w=school?4:restaurant?3:4,d=school?2:restaurant?3:2;
  const reserved:Rect[]=portals.filter(p=>p.zoneId===z.id).map(portalClearance);
  let n=0;
  for(let y=z.y+5;y+d<=z.y+z.d-4&&n<48;y+=d+4)for(let x=z.x+5;x+w<=z.x+z.w-4&&n<48;x+=w+4){
   const r={x,y,w,d};
   if(reserved.some(a=>overlapArea(a,r)>EPS))continue;
   result.push({...r,id:z.id+"-fixture-"+n++,zoneId:z.id,floor:z.floor,label,kind});
  }
 }
 return result;
}
export function portalClearance(p:ConceptPortal):Rect{
 return p.axis==="y"?{x:p.x-4,y:p.y-2,w:8,d:p.length+4}:{x:p.x-2,y:p.y-4,w:p.length+4,d:8};
}
export function commercialGeometryIssues(plan:BuildingConcept):string[]{
 const fixtures=commercialFixtures(plan),portals=commercialPortals(plan),issues:string[]=[],spaces=[...plan.zones,...commercialInternalSpaces(plan)];
 for(const f of fixtures){const z=spaces.find(z=>z.id===f.zoneId);if(!z||f.floor!==z.floor||Math.abs(overlapArea(f,z)-f.w*f.d)>EPS)issues.push("Fixture outside parent "+f.id);}
 const byZone=new Map<string,CommercialFixture[]>();for(const f of fixtures){const group=byZone.get(f.zoneId)??[];group.push(f);byZone.set(f.zoneId,group)}
 for(const group of byZone.values())for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)if(overlapArea(group[i],group[j])>EPS)issues.push("Fixture overlap "+group[i].id);
 for(const p of portals){const z=spaces.find(z=>z.id===p.zoneId);if(!z||p.floor!==z.floor||(p.axis==="y"?p.y<z.y-EPS||p.y+p.length>z.y+z.d+EPS||Math.min(Math.abs(p.x-z.x),Math.abs(p.x-z.x-z.w))>EPS:p.x<z.x-EPS||p.x+p.length>z.x+z.w+EPS||Math.min(Math.abs(p.y-z.y),Math.abs(p.y-z.y-z.d))>EPS))issues.push("Portal outside wall "+p.id);}
 return issues;
}

/** Street-facing surfaces selected by nearest covered zone along each x interval. */
export function commercialFrontPanels(plan:BuildingConcept){
 const panels:{floor:number;zoneId:string;x:number;w:number;y:number;kind:string}[]=[];
 for(let floor=0;floor<plan.brief.floors;floor++){
  const zones=plan.zones.filter(z=>z.floor===floor&&!["open","parking"].includes(z.kind));
  const cuts=[...new Set(zones.flatMap(z=>[z.x,z.x+z.w]))].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
   const x=cuts[i],w=cuts[i+1]-x;if(w<EPS)continue;
   const z=zones.filter(z=>z.x<=x+EPS&&z.x+z.w>=x+w-EPS).sort((a,b)=>a.y-b.y)[0];if(z)panels.push({floor,zoneId:z.id,x,w,y:z.y,kind:z.kind});
  }
 }
 return panels;
}

/** Presentation-only facade profile; no invented openings or floor area. Feet.
 * Shared by the elevation and full-building render. */
export function commercialFacadeProfile(purpose:BuildingConcept["brief"]["purpose"]){
 return ({shops:{bandFt:.8,frame:[.19,.23,.24]},mall:{bandFt:.9,frame:[.15,.19,.22]},restaurant:{bandFt:1.05,frame:[.32,.25,.20]},school:{bandFt:.53,frame:[.23,.29,.27]},rental:{bandFt:.65,frame:[.25,.26,.25]}} satisfies Record<BuildingConcept["brief"]["purpose"],{bandFt:number;frame:[number,number,number]}>)[purpose];
}
