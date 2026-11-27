import {overlapArea,area,type Rect,type RoadSide} from "./plan-model.ts";
export const buildingPurposes=["mall","school","restaurant","shops","rental"] as const;
export type BuildingPurpose=typeof buildingPurposes[number];
type ZoneKind="primary"|"support"|"toilet"|"circulation"|"core"|"service"|"parking"|"open";
export type BuildingZone=Rect&{id:string;label:string;kind:ZoneKind;floor:number};
export type BuildingBrief={purpose:BuildingPurpose;widthFt:number;depthFt:number;roadSide:RoadSide;floors:number;unitsPerFloor:number;parkingBays:number;frontFt:number;rearFt:number;sideFt:number};
export type BuildingConcept={id:string;brief:BuildingBrief;zones:BuildingZone[];layout:string;signature:string;conceptOnly:true};
const purpose={
 mall:{title:"Shopping mall",unit:"Retail unit",minW:12,minD:12,minArea:200,front:20,back:12,support:["Anchor retail / activity","Service & loading reserve"],checks:["Occupant load and exit capacity","Fire separation, smoke control and sprinklers","Accessible routes, lifts, loading, parking and traffic study"]},
 school:{title:"School",unit:"Classroom",minW:16,minD:18,minArea:360,front:10,back:20,support:["Administration / staff","Library / learning resource"],checks:["Education authority requirements and classroom capacity","Child-safe circulation, toilets and supervised pickup","Playground area, fire exits, accessibility and structural safety"]},
 restaurant:{title:"Restaurant",unit:"Dining zone",minW:12,minD:12,minArea:180,front:10,back:8,support:["Kitchen / preparation","Storage / dishwashing"],checks:["Food hygiene, separate clean/dirty flows and exhaust","LPG/fire safety, grease traps and waste handling","Seating capacity, accessible toilets and exit design"]},
 shops:{title:"Shops / retail complex",unit:"Shop unit",minW:9,minD:10,minArea:100,front:8,back:8,support:["Shared storage","Service / delivery reserve"],checks:["Shop frontage, individual shutters and safe access","Loading, parking, power and metering","Fire separation, accessible toilets and local land use"]},
 rental:{title:"Rental property",unit:"Rental unit envelope",minW:14,minD:18,minArea:300,front:8,back:8,support:["Shared utility / meters","Common maintenance / storage"],checks:["Each unit still needs its own verified kitchen, bath and daylight layout","Independent privacy, metering and stair access","Tenancy, parking, fire safety and local dwelling rules"]}
} as const;
export const purposeDetails=purpose;
const EPS=1e-6;
const finite=(n:number)=>Number.isFinite(n);
const fmt=(n:number)=>Math.round(n*1000)/1000;
export function validateBuildingBrief(b:BuildingBrief):string[]{
 const e:string[]=[];
 if(!buildingPurposes.includes(b.purpose))return ["Choose a supported building purpose."];
 if(![b.widthFt,b.depthFt,b.frontFt,b.rearFt,b.sideFt].every(finite)||b.widthFt<20||b.widthFt>500||b.depthFt<30||b.depthFt>600||Math.min(b.frontFt,b.rearFt,b.sideFt)<0)e.push("Enter supported plot dimensions (20–500 ft wide, 30–600 ft deep) and nonnegative margins.");
 if(!["N","E","S","W"].includes(b.roadSide))e.push("Choose a road direction.");
 if(!Number.isInteger(b.floors)||b.floors<1||b.floors>6||!Number.isInteger(b.unitsPerFloor)||b.unitsPerFloor<1||b.unitsPerFloor>24||!Number.isInteger(b.parkingBays)||b.parkingBays<0||b.parkingBays>40)e.push("Choose 1–6 floors, 1–24 primary zones per floor, and 0–40 parking reservations.");
 const p=purpose[b.purpose];
 if(b.frontFt<p.front||b.rearFt<p.back)e.push("Increase the front/rear open reservation to the concept minimum shown for this purpose; local legal requirements may be greater.");
 if(b.parkingBays>0&&(b.frontFt<36||b.parkingBays*9>b.widthFt-2*b.sideFt-12))e.push("Requested parking reserve does not fit: allow 36 ft front depth and 9 ft per reserved bay plus a 12 ft clear strip. Vehicle maneuvering still needs review.");
 return e;
}
export function validateBuildingConcept(c:BuildingConcept):string[]{
 const b=c.brief,p=purpose[b.purpose],e=validateBuildingBrief(b),ids=new Set<string>();
 for(const z of c.zones){
  if(ids.has(z.id))e.push("Duplicate zone ID");ids.add(z.id);
  if(![z.x,z.y,z.w,z.d].every(finite)||z.w<=0||z.d<=0||z.x<-EPS||z.y<-EPS||z.x+z.w>b.widthFt+EPS||z.y+z.d>b.depthFt+EPS||!Number.isInteger(z.floor)||z.floor<0||z.floor>=b.floors)e.push("Zone outside plot: "+z.id);
  if(z.kind!=="open"&&z.kind!=="parking"&&(z.x<b.sideFt-EPS||z.x+z.w>b.widthFt-b.sideFt+EPS||z.y<b.frontFt-EPS||z.y+z.d>b.depthFt-b.rearFt+EPS))e.push("Building zone outside selected margins: "+z.id);
  if(z.kind==="primary"&&(z.w<p.minW-EPS||z.d<p.minD-EPS||area(z)<p.minArea-EPS))e.push("Primary zone below concept size: "+z.id);
 }
 for(let i=0;i<c.zones.length;i++)for(let j=i+1;j<c.zones.length;j++)if(c.zones[i].floor===c.zones[j].floor&&overlapArea(c.zones[i],c.zones[j])>EPS)e.push("Overlapping zones");
 for(let f=0;f<b.floors;f++){
  const zs=c.zones.filter(z=>z.floor===f),hall=zs.find(z=>z.kind==="circulation");
  if(zs.filter(z=>z.kind==="primary").length!==b.unitsPerFloor||zs.filter(z=>z.kind==="core").length!==2||zs.filter(z=>z.kind==="toilet").length!==2||!hall)e.push("Incomplete floor programme: "+f);
  if(hall)for(const z of zs.filter(z=>!["open","parking","circulation"].includes(z.kind))){
   const edge=Math.min(z.y+z.d,hall.y+hall.d)-Math.max(z.y,hall.y);
   if(edge<3-EPS||!(Math.abs(z.x+z.w-hall.x)<EPS||Math.abs(z.x-hall.x-hall.w)<EPS))e.push("No circulation adjacency: "+z.id);
  }
 }
 if(c.zones.filter(z=>z.kind==="parking").length!==b.parkingBays)e.push("Parking reservation count mismatch");
 return [...new Set(e)];
}
export function generateBuildingConcepts(b:BuildingBrief,limit=24):{plans:BuildingConcept[];blockers:string[]}{
 const blockers=validateBuildingBrief(b);if(blockers.length)return {plans:[],blockers};
 const p=purpose[b.purpose],W=b.widthFt-2*b.sideFt,D=b.depthFt-b.frontFt-b.rearFt;
 const out:BuildingConcept[]=[],seen=new Set<string>(),max=Math.max(0,Math.min(24,Math.floor(limit)));
 // Different circulation widths, asymmetric wings, unit allocation and service
 // locations. A fixed order makes the first preview independent of requested limit.
 for(let step=0;step<144&&out.length<max;step++){
  const recipe=step*37%144,coreFront=recipe%2===0,swapServices=Math.floor(recipe/2)%2===1;
  const corridor=[8,10,12][Math.floor(recipe/4)%3];
  const ratio=[.5,.42,.58][Math.floor(recipe/12)%3];
  const leftUnits=Math.max(0,Math.min(b.unitsPerFloor,Math.floor(b.unitsPerFloor/2)+[-1,0,1,2][Math.floor(recipe/36)%4]));
  const rightUnits=b.unitsPerFloor-leftUnits, left=(W-corridor)*ratio,right=W-corridor-left;
  if(Math.min(left,right)<Math.max(10,p.minW)||D<30)continue;
  const zones:BuildingZone[]=[];
  const add=(floor:number,kind:ZoneKind,label:string,x:number,y:number,w:number,d:number)=>zones.push({id:floor+"-"+zones.length,kind,label,floor,x,y,w,d});
  for(let f=0;f<b.floors;f++){
   add(f,"circulation","Common access spine",b.sideFt+left,b.frontFt,corridor,D);
   for(const [bank,x,w,count] of [[0,b.sideFt,left,leftUnits],[1,b.sideFt+left+corridor,right,rightUnits]] as const){
    const coreDepth=10,toiletDepth=8,supportDepth=Math.max(10,D*.15),unitDepth=(D-coreDepth-toiletDepth-supportDepth)/Math.max(1,count);
    if(unitDepth<=0)continue;
    const primary=Array.from({length:count},(_,i)=>({kind:"primary" as const,label:p.unit+" "+(bank===0?i+1:leftUnits+i+1),d:unitDepth}));
    const support={kind:"support" as const,label:p.support[swapServices?1-bank:bank],d:supportDepth+(count===0?D-coreDepth-toiletDepth-supportDepth:0)};
    const core={kind:"core" as const,label:"Vertical access / exit core reserve "+(bank+1),d:coreDepth};
    const toilet={kind:"toilet" as const,label:"Toilet / accessible WC reserve "+(bank+1),d:toiletDepth};
    const front=(bank===0)===coreFront;
    const segments=front?[core,...primary,support,toilet]:[support,toilet,...primary,core];
    let y=b.frontFt;for(const s of segments){add(f,s.kind,s.label,x,y,w,s.d);y+=s.d;}
   }
  }
  if(b.parkingBays){for(let i=0;i<b.parkingBays;i++)add(0,"parking","Reserved bay "+(i+1),b.sideFt+i*9,0,9,18);}
  if(b.rearFt>0)add(0,"open",b.purpose==="school"?"Open play / assembly reserve":"Rear open / service reserve",b.sideFt,b.depthFt-b.rearFt,W,b.rearFt);
  const signature=JSON.stringify(zones.map(z=>[z.floor,z.kind,fmt(z.x),fmt(z.y),fmt(z.w),fmt(z.d)]).sort());
  if(seen.has(signature))continue;
  const c:BuildingConcept={id:b.purpose+"-"+recipe,brief:b,zones,signature,layout:(leftUnits===rightUnits?"Balanced":leftUnits>rightUnits?"Left-heavy":"Right-heavy")+" wings · "+corridor+" ft concept spine",conceptOnly:true};
  if(validateBuildingConcept(c).length)continue;
  seen.add(signature);out.push(c);
 }
 return {plans:out,blockers:out.length?[]:["No supported zoning arrangement fits these exact inputs. Increase usable dimensions, reduce primary zones, or ask a qualified architect to assess the site. No inputs were silently changed."]};
}
