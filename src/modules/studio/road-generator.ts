import {type PlanBrief,type PlanModel,type Room,type Opening,type Side,type RoomKind,
 type Rect,sharedEdge,area,validatePlan} from "./plan-model.ts";
import {conservativeEnvelope,shapeErrors} from "./site-shape.ts";

export type PlanningResult={plans:PlanModel[];blockers:string[]};
const eps=.01;
const round=(n:number)=>Math.round(n*1e6)/1e6;
const valid=(v:number)=>Number.isFinite(v)&&v>=0;
export function explainImpossible(b:PlanBrief):string[]{
 const x:string[]=[];
 if(!valid(b.widthFt)||!valid(b.depthFt)||b.widthFt<10||b.depthFt<15||b.widthFt>200||b.depthFt>250)x.push("Plot dimensions outside supported input range.");
 if(!["N","E","S","W"].includes(b.roadSide))x.push("Select a valid road side.");
 if(![b.setbacks.frontFt,b.setbacks.rearFt,b.setbacks.leftFt,b.setbacks.rightFt].every(valid))x.push("Setbacks must be nonnegative.");
 if(![1,2,3].includes(b.floors)||!Number.isInteger(b.bedrooms)||b.bedrooms<1||b.bedrooms>3)x.push("This audited prototype supports 1–3 bedrooms across one to three levels.");
 const shape=b.siteShape??{kind:"rectangle"} as const;
 x.push(...shapeErrors(b.widthFt,b.depthFt,shape));
 const safe=conservativeEnvelope(b.widthFt,b.depthFt,shape,b.setbacks);
 const W=b.widthFt-safe.leftFt-safe.rightFt;
 const D=b.depthFt-safe.frontFt-safe.rearFt;
 if(b.parking&&W<17.5)x.push("Parking + pedestrian entry + stairs needs at least 17.5 ft clear frontage in this layout family.");
 if(W<17.5||D<40)x.push("This road-front layout family needs at least 17.5 × 40 ft usable area. Check dimensions and setbacks.");
 if(!b.parking)x.push("Parking-free compact layout family has not yet passed circulation validation; no plan will be invented.");
 if(b.floors===1&&b.bedrooms>1)x.push("With this narrow parking-first template, only 1BHK fits on ground. Consider G+1 for 2–3 bedrooms.");
 if(b.bedrooms<b.floors)x.push("Choose at least one bedroom per level.");
 if(b.widthFt<=15&&b.depthFt<=30&&b.parking&&b.bedrooms>=3)x.push("3BHK + car parking on 15 × 30 ft cannot pass the tested room and access constraints.");
 return [...new Set(x)];
}
function room(id:string,label:string,kind:RoomKind,floor:number,x:number,y:number,w:number,d:number):Room{
 return {id,label,kind,floor,x:round(x),y:round(y),w:round(w),d:round(d),minClearWidthFt:kind==="stairs"?3.25:kind==="parking"?8:kind==="corridor"?3:0};
}
function connect(rooms:Room[],openings:Opening[],aId:string,bId:string){
 const a=rooms.find(r=>r.id===aId),b=rooms.find(r=>r.id===bId);
 if(!a||!b)throw new Error("Missing room for connection "+aId+"/"+bId);
 const edge=sharedEdge(a,b);
 if(!edge)throw new Error("Rooms do not share accessible wall: "+aId+"/"+bId);
 const width=Math.min(3,round(edge.length-.15));
 if(width<2.5)throw new Error("Access width under 2.5 ft");
 const start=edge.from+(edge.length-width)/2;
 const local=(r:Rect,side:Side)=>round(start-(side==="front"||side==="rear"?r.x:r.y));
 for(const [r,other,side] of [[a,b,edge.aSide],[b,a,edge.bSide]] as [Room,Room,Side][]){
  openings.push({id:"door-"+r.id+"-"+other.id,roomId:r.id,side,atFt:local(r,side),widthFt:width,sillFt:0,heightFt:7,
   kind:"door",connectsTo:other.id});
 }
}
function addWindow(p:Pick<PlanModel,"rooms"|"openings"|"plot"|"setbacks">){
 const sb=p.setbacks,{widthFt:pw,depthFt:pd}=p.plot;
 const front=sb.frontFt,rear=pd-sb.rearFt,left=sb.leftFt,right=pw-sb.rightFt;
 for(const r of p.rooms.filter(q=>["bedroom","living","kitchen","dining","lounge"].includes(q.kind))){
  const sides:Side[]=[];
  if(Math.abs(r.x-left)<eps)sides.push("left");
  if(Math.abs(r.x+r.w-right)<eps)sides.push("right");
  if(Math.abs(r.y-front)<eps)sides.push("front");
  if(Math.abs(r.y+r.d-rear)<eps)sides.push("rear");
  const side=sides.find(s=>(s==="left"||s==="right"?r.d:r.w)>=4.8);
  if(!side)continue;
  const len=side==="left"||side==="right"?r.d:r.w;
  const width=Math.min(4,round(len-1));
  p.openings.push({id:"window-"+r.id+"-"+side,roomId:r.id,side,atFt:round((len-width)/2),
   widthFt:width,sillFt:3,heightFt:4,kind:"window"});
 }
}
export type SpatialProgramme="wash"|"family-gallery"|"rear-courtyard"|"rear-baranda";
type SpatialRecipe={parkWidthFt?:number;entryDepthFt?:number;stairWidthFt?:number;kitchenWidthFt?:number;
 rearBedWidthFt?:number;upperBedRatio?:number;rearProgramme?:SpatialProgramme;frontProgramme?:"dining"|"family-hall"|"family-lounge";familyLabel?:string;};
function houseEnvelope(b:PlanBrief){
 const envelope=conservativeEnvelope(b.widthFt,b.depthFt,b.siteShape??{kind:"rectangle"},b.setbacks);
 const width=b.widthFt-envelope.leftFt-envelope.rightFt,depth=b.depthFt-envelope.frontFt-envelope.rearFt;
 // Keep oversized plots useful as gardens rather than stretching habitable rooms.
 const maxWidth=Math.min(30,23+Math.max(0,depth-42)*1.4);
 const sideGarden=Math.max(0,width-maxWidth)/2;
 return {...envelope,leftFt:envelope.leftFt+sideGarden,rightFt:envelope.rightFt+sideGarden,
  rearFt:envelope.rearFt+Math.max(0,depth-60)};
}
function build(b:PlanBrief,variant:"parking-left"|"parking-right",recipe:SpatialRecipe={}):PlanModel{
 const sb=houseEnvelope(b),
 U={x:sb.leftFt,y:sb.frontFt,w:b.widthFt-sb.leftFt-sb.rightFt,d:b.depthFt-sb.frontFt-sb.rearFt};
 const W=U.w,D=U.d,parkW=recipe.parkWidthFt??Math.max(8.5,Math.min(10,round(W*.46)));
 const stairW=recipe.stairWidthFt??5.5,kitchenW=recipe.kitchenWidthFt??8.5,bathW=5;
 const rearBedW=recipe.rearBedWidthFt??Math.max(11,Math.min(12.5,W-6));
 const entryDepth=recipe.entryDepthFt??5;
 const rearProgramme=recipe.rearProgramme??"wash";
 const rearKind:RoomKind=rearProgramme==="family-gallery"?"lounge":rearProgramme==="rear-courtyard"?"terrace":rearProgramme==="rear-baranda"?"verandah":"utility";
 const rearLabel=rearProgramme==="family-gallery"?"Covered gallery / family seating":rearProgramme==="rear-courtyard"?"Open rear courtyard":rearProgramme==="rear-baranda"?"Rear covered baranda":"Rear utility / wash";
 if(W-kitchenW-bathW<3.75||W-parkW<8)throw new RangeError("Insufficient width for kitchen, bath and passage.");
 const rooms:Room[]=[];
 const put=(id:string,label:string,kind:RoomKind,floor:number,x:number,y:number,w:number,d:number)=>
  rooms.push(room(id,label,kind,floor,U.x+x,U.y+y,w,d));
 put("parking","Car parking","parking",0,0,0,parkW,16);
 put("verandah","Front verandah / baranda","verandah",0,parkW,0,W-parkW,entryDepth);
 put("living","Living / drawing","living",0,parkW,entryDepth,W-parkW,16-entryDepth);
 put("stairs-g","Stairs","stairs",0,0,16,stairW,10);
 put("dining",recipe.frontProgramme==="family-hall"?"Family hall / meeting space":recipe.frontProgramme==="family-lounge"?"Family lounge / drawing":"Dining / family hall",recipe.frontProgramme==="family-hall"?"living":recipe.frontProgramme==="family-lounge"?"lounge":"dining",0,stairW,16,W-stairW,10);
 put("kitchen","Kitchen","kitchen",0,0,26,kitchenW,8);
 put("bath-g","Bath / WC","bath",0,kitchenW,26,bathW,8);
 put("corridor-g","Passage","corridor",0,kitchenW+bathW,26,W-kitchenW-bathW,8);
 put("hall-g","Rear access hall","corridor",0,0,34,W,3);
 put("bed-g","Bedroom 1","bedroom",0,0,37,rearBedW,D-37);
 put("utility-g",rearLabel,rearKind,0,rearBedW,37,W-rearBedW,D-37);
 for(let level=1;level<b.floors;level++){
  const upper=b.bedrooms-b.floors+1;
  put(`balcony-${level}`,"Street balcony","balcony",level,0,0,W,4);
  if(upper===1){
   put(`bed-${level}a`,`Bedroom ${level+1}`,"bedroom",level,0,4,W,12);
  }else{
   put(`bed-${level}a`,`Bedroom ${level+1}`,"bedroom",level,0,4,round(W*(recipe.upperBedRatio??.5)),12);
   put(`bed-${level}b`,"Bedroom 3","bedroom",level,round(W*(recipe.upperBedRatio??.5)),4,W-round(W*(recipe.upperBedRatio??.5)),12);
  }
  put(`stairs-${level}`,"Stairs / landing","stairs",level,0,16,stairW,10);
  put(`lounge-${level}`,"Family lounge","lounge",level,stairW,16,W-stairW,10);
  put(`bath-${level}`,"Bath / WC","bath",level,0,26,stairW,8);
  put(`utility-${level}`,"Wash / service","utility",level,stairW,26,W-stairW,8);
  put(`terrace-${level}`,"Open terrace","terrace",level,0,34,W,D-34);
 }
 // On shorter plots preserve the 16 ft parking bay and the 3 ft rear hall.
 // Redistribute the stair and service bands before validating each room.
 if(D<47){
  const stairDepth=Math.max(7,10-(47-D)*.6);
  const serviceDepth=Math.max(6,8-(47-D)*.4);
  const stations=[[0,0],[16,16],[26,16+stairDepth],[34,16+stairDepth+serviceDepth],
   [37,19+stairDepth+serviceDepth],[D,D]];
  const position=(y:number)=>{
   const end=stations.findIndex(([original])=>original>=y-.000001);
   if(end<=0)return end===0?0:D;
   const [from,to]=stations[end-1], [next,target]=stations[end];
   return to+(y-from)*(target-to)/(next-from);
  };
  for(const r of rooms){
   const near=r.y-U.y,far=near+r.d;
   r.y=round(U.y+position(near));r.d=round(position(far)-position(near));
  }
 }
 // A true mirrored variant: entire geometry, gates, windows and circulation, not labels alone.
 if(variant==="parking-right")for(const r of rooms)r.x=round(U.x+W-(r.x-U.x)-r.w);
 const openings:Opening[]=[];
 const joins=[
  ["verandah","living"],["living","dining"],["dining","stairs-g"],
  ["dining","kitchen"],["dining","corridor-g"],[recipe.familyLabel?"dining":"kitchen","bath-g"],
  ["corridor-g","hall-g"],["hall-g","bed-g"],["hall-g","utility-g"]
 ];
 for(let level=1;level<b.floors;level++){
  joins.push([`stairs-${level}`,`lounge-${level}`],[`stairs-${level}`,`bath-${level}`],[`lounge-${level}`,`utility-${level}`],[`lounge-${level}`,`bed-${level}a`],[`balcony-${level}`,`bed-${level}a`]);
  if(b.bedrooms>b.floors)joins.push([`lounge-${level}`,`bed-${level}b`],[`balcony-${level}`,`bed-${level}b`]);
 }
 for(const [a,b] of joins)connect(rooms,openings,a,b);
 const entry=rooms.find(r=>r.id==="verandah")!;
 openings.push({id:"pedestrian-entry",roomId:entry.id,side:"front",atFt:round((entry.w-3)/2),widthFt:3,sillFt:0,heightFt:7,kind:"door"});
 const gateParking=rooms.find(r=>r.kind==="parking")!;
 const parkingGate={side:"front" as const,xFt:round(gateParking.x+.25),widthFt:Math.min(8,round(gateParking.w-.5))};
 const p:PlanModel={
  version:1,id:b.widthFt+"x"+b.depthFt+"-"+b.roadSide+"-"+b.floors+"-"+b.bedrooms+"-"+variant+(b.siteShape&&b.siteShape.kind!=="rectangle"?"-"+b.siteShape.kind+"-"+b.siteShape.notchWidthFt+"x"+b.siteShape.notchDepthFt:"")+(recipe.familyLabel?"-"+recipe.familyLabel:""),
  variant,plot:{widthFt:b.widthFt,depthFt:b.depthFt,roadSide:b.roadSide,siteShape:b.siteShape},
  setbacks:{...sb,verified:false},walls:{externalFt:.75,internalFt:.375,heightFt:9.5,parapetFt:3},
  floors:b.floors,rooms,openings,gate:parkingGate,
  pedestrianGate:{side:"front",xFt:round(entry.x+(entry.w-3)/2),widthFt:3},
  parking:{roomId:"parking",clearWidthFt:gateParking.w,clearDepthFt:gateParking.d},
  stairs:{roomIds:rooms.filter(r=>r.kind==="stairs").map(r=>r.id),
   note:"Staircase is a conceptual volume, NOT a checked tread/rise/headroom or fire escape."},
  balcony:b.floors>1?{roomId:"balcony-1"}:null,
  facade:{kit:"simple-parapet",massing:"box",main:variant==="parking-left"?"#e9e2d4":"#e7e6df",accent:"#8e755b"},
  score:0,notes:[
   ...(recipe.familyLabel?["Spatial programme: "+recipe.familyLabel+" · "+rearLabel+" · "+(recipe.frontProgramme==="family-hall"?"family hall":recipe.frontProgramme==="family-lounge"?"lounge / drawing":"dining")]:[]),
   ...(b.siteShape&&b.siteShape.kind!=="rectangle"?["L-plot rear corner omitted. Entire adjacent strip is kept unbuilt as a conservative construction envelope; a cadastral site survey and licensed architect must verify the actual boundary."]:[]),
   "City rules, setbacks, FAR, actual stair rise/tread/headroom, vehicle turning and parking permissions are unverified.",
   "Concept only; engage a licensed architect/engineer and obtain local authority approval before construction.",
   "Bathrooms require a licensed professional to check exhaust/ventilation shafts, drainage falls and plumbing."
  ],conceptOnly:true
 };
 addWindow(p);
 // Penalise inefficiency, reward explicit circulation and independent external windows.
 const roomsByKind=(k:RoomKind)=>p.rooms.filter(r=>r.kind===k);
 const outside=roomsByKind("bedroom").length+roomsByKind("living").length+roomsByKind("kitchen").length+roomsByKind("dining").length;
 const windows=p.openings.filter(o=>o.kind==="window").length;
 const circulation=p.rooms.filter(r=>r.kind==="corridor").reduce((sum,r)=>sum+area(r),0);
 const occupied=p.rooms.filter(r=>r.kind!=="terrace").reduce((sum,r)=>sum+area(r),0);
 p.score=Math.max(1,Math.min(90,round(82+Math.min(8,windows/outside*5)-circulation/occupied*18)));
 return p;
}
export function planSignature(p:PlanModel):string{
 return p.rooms.map(r=>[r.floor,r.id,r.kind,r.x,r.y,r.w,r.d].join(":")).sort().join("|")+"#"+p.facade.kit+"#"+p.facade.massing;
}
export function pickDiverse(plans:readonly PlanModel[],limit=3):PlanModel[]{
 const unique=new Set<string>();return [...plans].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).filter(p=>{
  const sig=planSignature(p);if(unique.has(sig))return false;unique.add(sig);return true;
 }).slice(0,limit);
}
/** Strictly conservative benchmark family; never use random search to fake feasibility. */
export function generateRoadPlans(brief:PlanBrief):PlanningResult{
 const blockers=explainImpossible(brief);
 if(blockers.length)return {plans:[],blockers};
 const candidates:PlanModel[]=[];
 for(const variant of ["parking-left","parking-right"] as const){
  try{const p=build(brief,variant),errors=validatePlan(p);if(!errors.length)candidates.push(p);
   else blockers.push(variant+": "+errors.join("; "));
  }catch(error){blockers.push(variant+": "+(error instanceof Error?error.message:"Unknown invalid geometry"))}
 }
 const plans=pickDiverse(candidates,3);
 return {plans,blockers:plans.length?[]:blockers.length?blockers:["No circulation-safe candidate fits; revise requested programme."]};
}

/** Deterministic portfolio for a single EXACT plot/road/floor brief.
 * Each returned draft changes partition boundaries, circulation adjacency and/or
 * actual room use. All candidates pass the same walkability/window/parking and
 * 2D/3D PlanModel validator; never stretch static image cards into a fake fit.
 *
 * Smaller or awkward plots may return fewer than 24; no fake room or local-law
 * compliance is manufactured to hit a marketing number.
 */
export function generateSpatialPortfolio(brief:PlanBrief,limit=24):PlanningResult{
 const blockers=explainImpossible(brief);
 if(blockers.length)return {plans:[],blockers};
 const envelope=houseEnvelope(brief);
 const W=brief.widthFt-envelope.leftFt-envelope.rightFt;
 const baseParking=Math.max(8.5,Math.min(10,round(W*.46)));
 const plans:PlanModel[]=[],seen=new Set<string>();
 const normalized=Math.max(1,Math.min(24,Math.floor(limit)));
 for(const variant of ["parking-left","parking-right"] as const){
  const perSide=normalized===24?12:Math.ceil(normalized/2);
  let sideCount=0;
  for(let i=0;i<100&&sideCount<perSide;i++){
   const prog=(["wash","family-gallery","rear-courtyard","rear-baranda"] as SpatialProgramme[])[i%4];
   const family=(["dining","family-hall","family-lounge"] as const)[Math.floor(i/4)%3];
   const park=Math.min(Math.max(8.5,baseParking+(Math.floor(i/4)%3)*.25),W-8.8);
   const entryDepth=4.5+(Math.floor(i/18)%3)*.25;
   const stair=5.25+(Math.floor(i/3)%2)*.25;
   const kitchen=8.5+(Math.floor(i/9)%3)*.25;
   const bedWidth=Math.min(W-4.5,Math.max(10.5,Math.min(12.5,W-6)+(Math.floor(i/12)%3-1)*.5));
   const ratio=(Math.floor(i/5)%3===0?.48:Math.floor(i/5)%3===1?.5:.52);
   const recipe:SpatialRecipe={parkWidthFt:park,entryDepthFt:entryDepth,stairWidthFt:stair,
    kitchenWidthFt:kitchen,rearBedWidthFt:bedWidth,upperBedRatio:ratio,rearProgramme:prog,
    frontProgramme:family,familyLabel:"spatial-"+i+"-"+prog+"-"+family};
   try{
    const p=build(brief,variant,recipe),errors=validatePlan(p);
    if(errors.length)continue;
    const geometry=p.rooms.map(r=>[r.floor,r.kind,r.x,r.y,r.w,r.d].join(":")).sort().join("|");
    if(seen.has(geometry))continue;
    seen.add(geometry);
    plans.push(p);sideCount++;
   }catch{/* Invalid spatial combinations are discarded, not shown to customers. */}
  }
 }
 // Interleave parking-side alternatives rather than showing 12 identical-looking gates in a row.
 const left=plans.filter(p=>p.variant==="parking-left"),right=plans.filter(p=>p.variant==="parking-right");
 const ordered:PlanModel[]=[];
 for(let i=0;i<Math.max(left.length,right.length);i++){
  if(left[i])ordered.push(left[i]);if(right[i])ordered.push(right[i]);
 }
 return {plans:ordered.slice(0,normalized),
  blockers:ordered.length?[]:["No validated distinct spatial layout fits these dimensions, rooms, parking and setbacks."]};
}

