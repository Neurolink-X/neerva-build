import {validateBuildingConcept,type BuildingConcept} from "./building-purpose.ts";
import {commercialInternalSpaces} from "./commercial-internal.ts";
import {commercialPortals} from "./commercial-detail.ts";
const EPS=1e-5;
export type Reservation={id:string;kind:"stair"|"lift"|"escalator"|"service";widthFt:number;depthFt:number;count:number};
export type CorePlacement={id:string;kind:Reservation["kind"];coreId:string;floor:number;x:number;y:number;w:number;d:number};
const valid=(n:number,min:number,max:number)=>Number.isFinite(n)&&n>=min&&n<=max;
/** User-supplied rectangular equipment envelopes including required clearances.
 * A conservative shelf pack in the actual common stacked core footprints.
 * Never infers equipment capacity, egress compliance or structural feasibility. */
export function fitVerticalReservations(plan:BuildingConcept,items:Reservation[]){
 if(validateBuildingConcept(plan).length||items.length>4||new Set(items.map(i=>i.id)).size!==items.length||items.some(i=>!["stair","lift","escalator","service"].includes(i.kind)||!valid(i.widthFt,.1,100)||!valid(i.depthFt,.1,100)||!Number.isInteger(i.count)||!valid(i.count,0,8)))return null;
 const ground=plan.zones.filter(z=>z.kind==="core"&&z.floor===0);
 const stacks=ground.map(c=>({c,levels:Array.from({length:plan.brief.floors},(_,floor)=>plan.zones.find(z=>z.kind==="core"&&z.floor===floor&&Math.abs(z.x-c.x)<EPS&&Math.abs(z.y-c.y)<EPS&&Math.abs(z.w-c.w)<EPS&&Math.abs(z.d-c.d)<EPS))})).filter(s=>s.levels.every(Boolean));
 const states=stacks.map(s=>({...s,x:0,y:0,row:0}));
 const units=items.flatMap(i=>Array.from({length:i.count},(_,n)=>({...i,id:i.id+"-"+(n+1)}))).sort((a,b)=>b.depthFt-a.depthFt||b.widthFt-a.widthFt||a.id.localeCompare(b.id));
 const placed:CorePlacement[]=[],unplaced:string[]=[];
 for(const i of units){
  let found=false;
  for(const s of states){
   let x=s.x,y=s.y,row=s.row;
   if(x+i.widthFt>s.c.w+EPS){x=0;y+=row;row=0;}
   if(i.widthFt>s.c.w+EPS||y+i.depthFt>s.c.d+EPS)continue;
   for(const level of s.levels){if(level)placed.push({id:i.id+"-"+level.floor,kind:i.kind,coreId:level.id,floor:level.floor,x:level.x+x,y:level.y+y,w:i.widthFt,d:i.depthFt});}
   s.x=x+i.widthFt;s.y=y;s.row=Math.max(row,i.depthFt);found=true;break;
  }
  if(!found)unplaced.push(i.id);
 }
 return {placed,unplaced,stackCount:stacks.length,conceptOnly:true as const};
}
/** Portal connectivity audit, not an evacuation route calculation. Only actual
 * candidate access portals and a common corridor count as graph edges. */
export function auditCandidateAccess(plan:BuildingConcept,floor:number){
 if(validateBuildingConcept(plan).length||!Number.isInteger(floor)||floor<0||floor>=plan.brief.floors)return null;
 const zones=plan.zones.filter(z=>z.floor===floor),hall=zones.find(z=>z.kind==="circulation");
 const portals=commercialPortals(plan).filter(p=>p.floor===floor&&p.kind==="access");
 const connected=new Set<string>();
 if(hall){connected.add(hall.id);for(const z of zones){
  const edgeX=Math.abs(z.x+z.w-hall.x)<EPS||Math.abs(z.x-hall.x-hall.w)<EPS;
  const sharedMin=Math.max(z.y,hall.y),sharedMax=Math.min(z.y+z.d,hall.y+hall.d);
  if(edgeX&&portals.some(p=>(p.zoneId===z.id||commercialInternalSpaces(plan).some(r=>r.id===p.zoneId&&r.parentId===z.id))&&p.axis==="y"&&(Math.abs(p.x-hall.x)<EPS||Math.abs(p.x-hall.x-hall.w)<EPS)&&p.y>=sharedMin-EPS&&p.y+p.length<=sharedMax+EPS))connected.add(z.id);
 }}
 return {unconnected:zones.filter(z=>["primary","support","toilet","core","service"].includes(z.kind)&&!connected.has(z.id)).map(z=>({id:z.id,label:z.label})),connectedCoreCount:zones.filter(z=>z.kind==="core"&&connected.has(z.id)).length,groundEntryCandidate:floor===0&&!!hall&&portals.some(p=>p.zoneId===hall.id&&p.axis==="x"&&Math.abs(p.y-hall.y)<EPS),approval:"NOT_VERIFIED" as const};
}
/** Arithmetic from explicit engineer-provided assumptions, no default loads or
 * statutory design values. Each discipline is independently evaluable. */
export function conceptServiceLoads(input:{areaSqFt:number;people:number;powerWPerM2:number;waterLPerPersonDay:number;airLpsPerPerson:number;coolingWPerM2:number;reserveHours:number}){
 const {areaSqFt,people,powerWPerM2,waterLPerPersonDay,airLpsPerPerson,coolingWPerM2,reserveHours}=input;
 const a=valid(areaSqFt,.01,2000000)?areaSqFt*.09290304:null,p=Number.isInteger(people)&&valid(people,0,1000000)?people:null;
 const water=p!==null&&valid(waterLPerPersonDay,0,10000)?p*waterLPerPersonDay:null;
 return {electricalKw:a!==null&&valid(powerWPerM2,0,10000)?a*powerWPerM2/1000:null,waterLPerDay:water,waterReserveL:water!==null&&valid(reserveHours,0,168)?water*reserveHours/24:null,outdoorAirLps:p!==null&&valid(airLpsPerPerson,0,1000)?p*airLpsPerPerson:null,coolingKw:a!==null&&valid(coolingWPerM2,0,10000)?a*coolingWPerM2/1000:null};
}
