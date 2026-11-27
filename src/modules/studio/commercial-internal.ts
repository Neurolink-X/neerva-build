import {dogLegStairStudy,stackedStairClearance,type StairStudy} from "./stair-study.ts";
import {overlapArea,type Rect,type Room,type Opening} from "./plan-model.ts";
import type {BuildingConcept,BuildingZone} from "./building-purpose.ts";
import {internalVariant,rentalLayouts} from "./rental-layout.ts";
const EPS=1e-5;
export type InternalSpace=Rect&{id:string;parentId:string;floor:number;kind:string;label:string};
export type InternalOpening={id:string;zoneId:string;floor:number;axis:"x"|"y";x:number;y:number;length:number;kind:"access"|"exterior-glazing";reviewRequired:true;connectsTo?:string};
export function sharedOpening(a:Rect,b:Rect,width=3){
 for(const axis of ["x","y"] as const){
  const vertical=axis==="y",a0=vertical?a.x:a.y,a1=a0+(vertical?a.w:a.d),b0=vertical?b.x:b.y,b1=b0+(vertical?b.w:b.d);
  const plane=Math.abs(a1-b0)<EPS?a1:Math.abs(b1-a0)<EPS?a0:null;
  if(plane===null)continue;
  const lo=Math.max(vertical?a.y:a.x,vertical?b.y:b.x),hi=Math.min(vertical?a.y+a.d:a.x+a.w,vertical?b.y+b.d:b.x+b.w);
  if(hi-lo<width+1-EPS)continue;
  const start=(lo+hi-width)/2;
  return {axis,x:vertical?plane:start,y:vertical?start:plane,length:width};
 }
 return null;
}
function coreRooms(z:BuildingZone,hall:BuildingZone,primary:boolean,multi:boolean,includeLift:boolean):InternalSpace[]{
 if(!multi)return [];
 // Orient from the shared gallery toward the exterior. These are deliberately
 // reservations, not engineered stair flights, elevator products or egress approvals.
 const lobby=5,lift=7,stair=12;
 const withLift=primary&&includeLift;
 if(z.d<8||z.w<lobby+stair+(withLift?lift:0))return [];
 const right=Math.abs(z.x+z.w-hall.x)<EPS;
 const add=(kind:string,label:string,offset:number,w:number):InternalSpace=>({id:z.id+"-"+kind,parentId:z.id,floor:z.floor,kind,label,x:right?z.x+z.w-offset-w:z.x+offset,y:z.y,w,d:z.d});
 const out=[add("lobby","Shared lobby",0,lobby)];
 if(withLift){
  // Split the strip adjoining the lobby into separate side-by-side entry bays
  // in depth, so both destinations have direct lobby access.
  const depth=z.d/2;if(depth<6||z.w-lobby<stair)return [];
  const shaft=add("lift","Lift reserve",lobby,lift);shaft.d=depth;
  const steps=add("stairs","Stair reserve",lobby,z.w-lobby);steps.y+=depth;steps.d=depth;
  if(steps.d<6)return [];
  out.push(shaft,steps);
  if(z.w-lobby-lift>EPS){const service=add("shaft","Service reserve",lobby+lift,z.w-lobby-lift);service.d=depth;out.push(service);}
 }else {
  const service=primary&&z.w-lobby>=27?4:0;
  out.push(add("stairs",primary?"Stair reserve":"Second stair reserve",lobby,z.w-lobby-service));
  if(service)out.push(add("shaft","Service reserve",z.w-service,service));
 }
 return out;
}
function supportRooms(z:BuildingZone,hall:BuildingZone,purpose:BuildingConcept["brief"]["purpose"],variant:number):InternalSpace[]{
 if(z.d<10||z.w<10)return [];
 const labels:Record<BuildingConcept["brief"]["purpose"],[string,string]>={
  restaurant:z.label.startsWith("Kitchen")?["Food preparation","Cooking reserve"]:["Dry storage","Dishwashing reserve"],
  school:z.label.startsWith("Administration")?["Administration","Staff room"]:["Reading room","Learning resources"],
  mall:z.label.startsWith("Anchor")?["Activity area","Support room"]:["Receiving","Storage"],
  shops:["Stock room","Packing / service"],rental:["Meter / utility reserve","Maintenance store"]};
 const right=Math.abs(z.x+z.w-hall.x)<EPS,access=variant>=2?4:0,depth=z.d/2;
 const add=(kind:string,label:string,x:number,y:number,w:number,d:number):InternalSpace=>({id:z.id+"-"+kind,parentId:z.id,floor:z.floor,kind,label,x:right?z.x+z.w-x-w:z.x+x,y:z.y+y,w,d});
 const names=labels[purpose],out=[add("service-a",names[0],access,0,z.w-access,depth),add("service-b",names[1],access,depth,z.w-access,z.d-depth)];
 if(access)out.push(add("lobby","Service passage",0,0,access,z.d));
 return out;
}
export function commercialInternalSpaces(plan:BuildingConcept):InternalSpace[]{
 const variant=internalVariant(plan.id);if(variant===null)return [];
 const out:InternalSpace[]=rentalLayouts(plan).flatMap(u=>u.rooms.map(r=>({...r,parentId:u.unitId})));
 for(let floor=0;floor<plan.brief.floors;floor++){
  const hall=plan.zones.find(z=>z.floor===floor&&z.kind==="circulation");if(!hall)continue;
  const cores=plan.zones.filter(z=>z.floor===floor&&z.kind==="core").sort((a,b)=>a.x-b.x||a.y-b.y);
  cores.forEach((z,i)=>out.push(...coreRooms(z,hall,i===0,plan.brief.floors>1,plan.brief.reserveLift!==false)));
  for(const z of plan.zones.filter(z=>z.floor===floor&&z.kind==="support"))out.push(...supportRooms(z,hall,plan.brief.purpose,variant));
 }
 return out;
}
export function commercialInternalOpenings(plan:BuildingConcept):InternalOpening[]{
 const spaces=commercialInternalSpaces(plan),out:InternalOpening[]=[];
 const connect=(a:InternalSpace,b:InternalSpace|BuildingZone)=>{
  const opening=sharedOpening(a,b);if(opening)out.push({id:a.id+"-to-"+b.id,zoneId:a.id,connectsTo:b.id,floor:a.floor,...opening,kind:"access",reviewRequired:true});
 };
 for(const parent of plan.zones){
  const rooms=spaces.filter(r=>r.parentId===parent.id);if(!rooms.length)continue;
  const hall=plan.zones.find(z=>z.floor===parent.floor&&z.kind==="circulation");if(!hall)continue;
  const entry=rooms.find(r=>r.kind==="living"||r.kind==="lobby"),passage=rooms.find(r=>r.kind==="passage");
  if(entry)connect(entry,hall);
  if(entry&&passage)connect(passage,entry);
  for(const r of rooms.filter(r=>r!==entry&&r!==passage&&r.kind!=="shaft")){
   const target=passage??entry??hall;
   if(r.kind==="stairs"&&entry&&stairDoorPair(r,entry,plan.brief.floors)){
    const pair=stairDoorPair(r,entry,plan.brief.floors)!;
    for(const p of pair)out.push(p);
   }else connect(r,target);
  }
  if(parent.kind!=="primary"||plan.brief.sideFt<3)continue;
  const outer=Math.abs(parent.x+parent.w-hall.x)<EPS?parent.x:parent.x+parent.w;
  for(const r of rooms.filter(r=>["bedroom","kitchen","living"].includes(r.kind)&&r.d>=6&&(Math.abs(r.x-outer)<EPS||Math.abs(r.x+r.w-outer)<EPS))){
   const blocked=plan.zones.some(z=>z.id!==parent.id&&z.floor===r.floor&&!["parking","open"].includes(z.kind)&&Math.min(Math.abs(z.x-outer),Math.abs(z.x+z.w-outer))<EPS&&Math.min(z.y+z.d,r.y+r.d)-Math.max(z.y,r.y)>EPS);
   if(!blocked)out.push({id:r.id+"-window",zoneId:r.id,floor:r.floor,axis:"y",x:outer,y:r.y+r.d/2-2,length:4,kind:"exterior-glazing",reviewRequired:true});
  }
 }
 return out;
}
export function internalGeometryIssues(plan:BuildingConcept){
 if(internalVariant(plan.id)===null)return [];
 const spaces=commercialInternalSpaces(plan),doors=commercialInternalOpenings(plan),issues:string[]=[];
 for(let floor=0;floor<plan.brief.floors;floor++){
  const here=spaces.filter(s=>s.floor===floor);
  if(plan.brief.floors>1&&here.filter(s=>s.kind==="stairs").length!==2)issues.push("Stair reserves must be maintained on each level");
  const expected=plan.brief.floors>1&&plan.brief.reserveLift!==false?1:0;
  if(here.filter(s=>s.kind==="lift").length!==expected)issues.push("Lift preference not met");
 }
 for(const parent of plan.zones.filter(z=>(z.kind==="primary"&&plan.brief.purpose==="rental")||(z.kind==="core"&&plan.brief.floors>1)||z.kind==="support")){
  const rooms=spaces.filter(r=>r.parentId===parent.id);
  if(!rooms.length){issues.push("Internal spaces do not fit");continue;}
  for(const [i,r] of rooms.entries()){
   if(r.w<=0||r.d<=0||Math.abs(overlapArea(r,parent)-r.w*r.d)>EPS||rooms.slice(i+1).some(s=>overlapArea(r,s)>EPS))issues.push("Invalid internal partition");
   if(r.kind!=="shaft"&&!doors.some(d=>d.kind==="access"&&(d.zoneId===r.id||d.connectsTo===r.id)))issues.push("Missing room access");
  }
  if(Math.abs(rooms.reduce((n,r)=>n+r.w*r.d,0)-parent.w*parent.d)>EPS)issues.push("Incomplete internal partition");
  const hall=plan.zones.find(z=>z.floor===parent.floor&&z.kind==="circulation");const reached=new Set([hall?.id??""]);
  for(let i=0;i<=rooms.length;i++)for(const d of doors.filter(d=>d.floor===parent.floor&&d.kind==="access")){if(d.connectsTo&&reached.has(d.connectsTo))reached.add(d.zoneId);if(d.connectsTo&&reached.has(d.zoneId))reached.add(d.connectsTo);}
  if(rooms.some(r=>r.kind!=="shaft"&&!reached.has(r.id)))issues.push("Disconnected internal room");
 }
 for(const r of spaces.filter(r=>["lift","stairs","shaft"].includes(r.kind)&&r.floor>0))if(!spaces.some(a=>a.floor===r.floor-1&&a.kind===r.kind&&Math.abs(a.x-r.x)<EPS&&Math.abs(a.y-r.y)<EPS&&Math.abs(a.w-r.w)<EPS&&Math.abs(a.d-r.d)<EPS))issues.push("Vertical service alignment unresolved");
 return [...new Set(issues)];
}

/** Advisory dog-leg study: only the deeper stair bay can support both
 * distinct lobby landings. Do not draw a flight in the smaller reserve. */
const commercialStairDimensions={width:4,tread:11/12,landing:4};
function stairDoorPair(r:InternalSpace,lobby:InternalSpace,floors:number):InternalOpening[]|null{
 const side=Math.abs(r.x-lobby.x-lobby.w)<EPS?"left":Math.abs(r.x+r.w-lobby.x)<EPS?"right":null;
 if(!side||r.d<8.75||r.w<18||Math.abs(r.y-lobby.y)>lobby.d)return null;
 const x=side==="left"?r.x:r.x+r.w;
 const start=.25+(r.d-8.75)/2;
 const make=(offset:number,tag:string):InternalOpening=>({id:r.id+"-"+tag,zoneId:r.id,connectsTo:lobby.id,floor:r.floor,axis:"y",x,y:r.y+offset,length:4,kind:"access",reviewRequired:true});
 const result:InternalOpening[]=[];
 if(r.floor<floors-1)result.push(make(start,"departure"));
 if(r.floor>0)result.push(make(start+4.25,"arrival"));
 return result;
}
export function commercialStairStudies(plan:BuildingConcept){
 const rooms=commercialInternalSpaces(plan),openings=commercialInternalOpenings(plan),studies:StairStudy[]=[],unresolved:string[]=[];
 const asRoom=(s:InternalSpace):Room=>({id:s.id,kind:"stairs",label:s.label,floor:s.floor,x:s.x,y:s.y,w:s.w,d:s.d,minClearWidthFt:4});
 for(const r of rooms.filter(r=>r.kind==="stairs"&&r.floor<plan.brief.floors-1)){
  const upper=rooms.find(a=>a.kind==="stairs"&&a.floor===r.floor+1&&Math.abs(a.x-r.x)<EPS&&Math.abs(a.y-r.y)<EPS&&Math.abs(a.w-r.w)<EPS&&Math.abs(a.d-r.d)<EPS);
  const doors:Opening[]=openings.filter(p=>p.kind==="access"&&((p.zoneId===r.id&&p.id.endsWith("-departure"))||(p.zoneId===upper?.id&&p.id.endsWith("-arrival")))).flatMap(p=>{
   const a=rooms.find(s=>s.id===p.zoneId);if(!a)return [];
   return [{id:p.id,roomId:a.id,kind:"door" as const,side:Math.abs(p.x-a.x)<EPS?"left" as const:"right" as const,atFt:p.y-a.y,widthFt:p.length,sillFt:0,heightFt:8,connectsTo:p.connectsTo}];
  });
  const study=upper?dogLegStairStudy(asRoom(r),asRoom(upper),13,doors,commercialStairDimensions):null;
  if(study)studies.push(study);else unresolved.push(r.id);
 }
 const conflicts=new Set<string>();
 for(const a of studies)for(const b of studies)if(b.roomId===a.upperRoomId&&!stackedStairClearance(a,b,13)){conflicts.add(a.roomId);conflicts.add(b.roomId);}
 return {studies:studies.filter(s=>!conflicts.has(s.roomId)),unresolved:[...unresolved,...conflicts]};
}
