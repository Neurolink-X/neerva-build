import {overlapArea,area,type Rect,type RoadSide} from "./plan-model.ts";
import {rentalLayouts} from "./rental-layout.ts";
export const buildingPurposes=["mall","school","restaurant","shops","rental"] as const;
export type BuildingPurpose=typeof buildingPurposes[number];
type ZoneKind="primary"|"support"|"toilet"|"circulation"|"core"|"service"|"parking"|"open";
export type BuildingZone=Rect&{id:string;label:string;kind:ZoneKind;floor:number};
export type BuildingBrief={purpose:BuildingPurpose;widthFt:number;depthFt:number;roadSide:RoadSide;floors:number;unitsPerFloor:number;parkingBays:number;frontFt:number;rearFt:number;sideFt:number;rentalBedrooms?:number};
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
/** Necessary lower bounds for the supported two-wing generator, not legal
 * minima. Actual feasibility is still checked against every candidate. */
export function buildingInputRequirements(b:BuildingBrief){
 const p=purpose[b.purpose];
 if(!p)return null;
 const count=Math.max(1,Math.ceil(b.unitsPerFloor/2)),front=Math.max(p.front,b.parkingBays>0?36:0);
 const rental=b.purpose==="rental",minUnitW=rental?22:p.minW,minUnitD=rental?Math.max(20,(b.rentalBedrooms??1)*10+8):p.minD;
 const usableWidth=2*Math.max(10,minUnitW)+8;
 const usableDepth=Math.max(30,28+count*minUnitD,(18+count*minUnitD)/.85);
 return {front,rear:p.back,usableWidth,usableDepth,minWidthFt:Math.ceil(Math.max(20,usableWidth+2*b.sideFt,b.parkingBays>0?b.parkingBays*9+12+2*b.sideFt:0)),minDepthFt:Math.ceil(Math.max(30,usableDepth+Math.max(b.frontFt,front)+Math.max(b.rearFt,p.back))),unitAreaSqFt:p.minArea,unitWidthFt:minUnitW,unitDepthFt:minUnitD};
}
/** Explicit example inputs, not plot recommendations or approved design. */
export function buildingStarter(purpose:BuildingPurpose):BuildingBrief{
 const dimensions={mall:[180,240,3,8,40,25,10],school:[150,200,2,4,40,35,10],restaurant:[80,120,1,2,10,12,5],shops:[80,100,1,4,10,10,5],rental:[90,130,2,2,10,10,5]} as const;
 const [widthFt,depthFt,floors,unitsPerFloor,frontFt,rearFt,sideFt]=dimensions[purpose];
 return {purpose,widthFt,depthFt,floors,unitsPerFloor,frontFt,rearFt,sideFt,roadSide:"N",parkingBays:0,...(purpose==="rental"?{rentalBedrooms:1}:{})};
}
export function validateBuildingBrief(b:BuildingBrief):string[]{
 const e:string[]=[];
 if(!buildingPurposes.includes(b.purpose))return ["Choose a supported building purpose."];
 if(![b.widthFt,b.depthFt,b.frontFt,b.rearFt,b.sideFt].every(finite)||b.widthFt<20||b.widthFt>500||b.depthFt<30||b.depthFt>600||Math.min(b.frontFt,b.rearFt,b.sideFt)<0)e.push("Enter supported plot dimensions (20–500 ft wide, 30–600 ft deep) and nonnegative margins.");
 if(!["N","E","S","W"].includes(b.roadSide))e.push("Choose a road direction.");
 if(!Number.isInteger(b.floors)||b.floors<1||b.floors>6||!Number.isInteger(b.unitsPerFloor)||b.unitsPerFloor<1||b.unitsPerFloor>24||!Number.isInteger(b.parkingBays)||b.parkingBays<0||b.parkingBays>40)e.push("Choose 1–6 floors, 1–24 primary zones per floor, and 0–40 parking reservations.");
 if(b.purpose==="rental"&&(!Number.isInteger(b.rentalBedrooms??1)||(b.rentalBedrooms??1)<1||(b.rentalBedrooms??1)>3))e.push("Choose 1–3 bedrooms per rental unit.");
 const p=purpose[b.purpose];
 if(b.frontFt<p.front||b.rearFt<p.back)e.push("Allow at least "+p.front+" ft front and "+p.back+" ft rear open reservation for this concept family; legal requirements may be greater.");
 if(b.parkingBays>0&&(b.frontFt<36||b.parkingBays*9>b.widthFt-2*b.sideFt-12))e.push("Requested parking reserve does not fit: allow 36 ft front depth and 9 ft per reserved bay plus a 12 ft clear strip. Vehicle maneuvering still needs review.");
 if(!e.length){
  const req=buildingInputRequirements(b)!;
  const W=b.widthFt-2*b.sideFt,D=b.depthFt-b.frontFt-b.rearFt;
  if(W+EPS<req.usableWidth)e.push("Usable frontage is "+fmt(W)+" ft; this two-wing concept needs at least "+req.usableWidth+" ft before side margins. Increase plot width or revise measured margins with a professional.");
  if(D+EPS<req.usableDepth)e.push("Usable depth is "+fmt(D)+" ft; "+b.unitsPerFloor+" primary zones per floor need at least "+Math.ceil(req.usableDepth)+" ft in this concept family. Reduce zone count or increase plot depth.");
  if(W>0&&D>0&&b.unitsPerFloor*p.minArea>W*D+EPS)e.push("Primary zone area alone exceeds the usable footprint. Reduce requested units or use a larger plot.");
 }
 return e;
}
export function validateBuildingConcept(c:BuildingConcept):string[]{
 const b=c.brief,e=validateBuildingBrief(b),ids=new Set<string>();
 if(e.length)return e;
 const p=purpose[b.purpose];
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
 if(b.purpose==="rental"&&rentalLayouts(c).length!==b.floors*b.unitsPerFloor)e.push("Every rental envelope must fit the requested internal BHK programme.");
 return [...new Set(e)];
}
export type BuildingLayoutFamily="classic"|"purpose-led";
export const buildingLayoutFamily=(id:string):BuildingLayoutFamily=>id.endsWith("-purpose-v2")?"purpose-led":"classic";
export function generateBuildingConcepts(b:BuildingBrief,limit=24,family:BuildingLayoutFamily="classic"):{plans:BuildingConcept[];blockers:string[]}{
 const blockers=validateBuildingBrief(b);if(blockers.length)return {plans:[],blockers};
 const p=purpose[b.purpose],W=b.widthFt-2*b.sideFt,D=b.depthFt-b.frontFt-b.rearFt;
 const out:BuildingConcept[]=[],seen=new Set<string>(),max=Number.isFinite(limit)?Math.max(0,Math.min(24,Math.floor(limit))):24;
 // Different circulation widths, asymmetric wings, unit allocation and service
 // locations. A fixed order makes the first preview independent of requested limit.
 for(let step=0;step<144&&out.length<max;step++){
  const recipe=step*37%144,coreFront=recipe%2===0,swapServices=Math.floor(recipe/2)%2===1;
  const corridor=(family==="purpose-led"&&b.purpose==="mall"?[12,14,16]:family==="purpose-led"&&b.purpose==="school"?[10,12,14]:[8,10,12])[Math.floor(recipe/4)%3];
  const ratio=[.5,.42,.58][Math.floor(recipe/12)%3];
  const leftUnits=Math.max(0,Math.min(b.unitsPerFloor,Math.floor(b.unitsPerFloor/2)+[-1,0,1,2][Math.floor(recipe/36)%4]));
  const rightUnits=b.unitsPerFloor-leftUnits, left=(W-corridor)*ratio,right=W-corridor-left;
  if(Math.min(left,right)<Math.max(10,p.minW)||D<30)continue;
  const zones:BuildingZone[]=[];
  const add=(floor:number,kind:ZoneKind,label:string,x:number,y:number,w:number,d:number)=>zones.push({id:floor+"-"+zones.length,kind,label,floor,x,y,w,d});
  for(let f=0;f<b.floors;f++){
   add(f,"circulation","Common access spine",b.sideFt+left,b.frontFt,corridor,D);
   for(const [bank,x,w,count] of [[0,b.sideFt,left,leftUnits],[1,b.sideFt+left+corridor,right,rightUnits]] as const){
    // Actual recessed wing massing, not cosmetic colour variation. The central
    // access spine remains continuous; no zone enters the requested margins.
    const recess=Math.min(8,D*.06),recessWing=recipe%3!==0&&bank===Math.floor(recipe/2)%2;
    const frontRecess=recessWing&&recipe%3===1?recess:0,rearRecess=recessWing&&recipe%3===2?recess:0;
    const wingDepth=D-frontRecess-rearRecess;
    const coreDepth=family==="purpose-led"&&b.floors>1?12:10,toiletDepth=8,supportShare=family==="purpose-led"&&b.purpose==="restaurant"?.23:family==="purpose-led"&&b.purpose==="school"?.18:.15,supportDepth=Math.max(10,wingDepth*supportShare),unitDepth=(wingDepth-coreDepth-toiletDepth-supportDepth)/Math.max(1,count);
    if(unitDepth<=0)continue;
    const primary=Array.from({length:count},(_,i)=>({kind:"primary" as const,label:p.unit+" "+(bank===0?i+1:leftUnits+i+1),d:unitDepth}));
    const support={kind:"support" as const,label:p.support[swapServices?1-bank:bank],d:supportDepth+(count===0?wingDepth-coreDepth-toiletDepth-supportDepth:0)};
    const core={kind:"core" as const,label:"Vertical access / exit core reserve "+(bank+1),d:coreDepth};
    const toilet={kind:"toilet" as const,label:"Toilet / accessible WC reserve "+(bank+1),d:toiletDepth};
    const front=(bank===0)===coreFront;
    const classic=front?[core,...primary,support,toilet]:[support,toilet,...primary,core];
    // Occupancy programme changes actual zone locations and sizes; this is
    // deliberately still a common-spine topology, not a compliant fire plan.
    const segments=family==="classic"?classic:
     b.purpose==="restaurant"?(front?[...primary,toilet,core,support]:[...primary,core,toilet,support]):
     b.purpose==="shops"?(front?[...primary,core,toilet,support]:[...primary,toilet,support,core]):
     b.purpose==="school"?(front?[support,core,...primary,toilet]:[core,...primary,toilet,support]):
     b.purpose==="mall"?(front?[support,...primary,toilet,core]:[...primary,core,support,toilet]):
     front?[core,...primary,toilet,support]:[core,support,toilet,...primary];
    let y=b.frontFt+frontRecess;for(const s of segments){add(f,s.kind,s.label,x,y,w,s.d);y+=s.d;}
   }
  }
  if(b.parkingBays){for(let i=0;i<b.parkingBays;i++)add(0,"parking","Reserved bay "+(i+1),b.sideFt+i*9,0,9,18);}
  if(b.rearFt>0)add(0,"open",b.purpose==="school"?"Open play / assembly reserve":"Rear open / service reserve",b.sideFt,b.depthFt-b.rearFt,W,b.rearFt);
  const signature=JSON.stringify(zones.map(z=>[z.floor,z.kind,fmt(z.x),fmt(z.y),fmt(z.w),fmt(z.d)]).sort());
  if(seen.has(signature))continue;
  const c:BuildingConcept={id:[b.purpose,b.widthFt,b.depthFt,b.roadSide,b.floors,b.unitsPerFloor,b.parkingBays,b.frontFt,b.rearFt,b.sideFt,b.purpose==="rental"?b.rentalBedrooms??1:0,recipe].join("-")+(family==="purpose-led"?"-purpose-v2":""),brief:b,zones,signature,layout:(family==="purpose-led"?({mall:"Anchor & retail",school:"Learning & administration",restaurant:"Dining front / services rear",shops:"Retail front / support rear",rental:"Entry core / private homes"}[b.purpose])+" · ":"")+(leftUnits===rightUnits?"Balanced":leftUnits>rightUnits?"Left-heavy":"Right-heavy")+" wings · "+corridor+" ft spine · "+(recipe%3===1?"front recess":recipe%3===2?"rear recess":"flush wings"),conceptOnly:true};
  if(validateBuildingConcept(c).length)continue;
  seen.add(signature);out.push(c);
 }
 return {plans:out,blockers:out.length?[]:["No supported zoning arrangement fits these exact inputs. Increase usable dimensions, reduce primary zones, or ask a qualified architect to assess the site. No inputs were silently changed."]};
}
