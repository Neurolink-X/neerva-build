import {type PlanBrief,type PlanModel,type Room,type Opening,type Side,type RoomKind,
 type Rect,sharedEdge,area,validatePlan} from "./plan-model.ts";

export type PlanningResult={plans:PlanModel[];blockers:string[]};
const eps=.01;
const round=(n:number)=>Math.round(n*100)/100;
const valid=(v:number)=>Number.isFinite(v)&&v>=0;
export function explainImpossible(b:PlanBrief):string[]{
 const x:string[]=[];
 if(!valid(b.widthFt)||!valid(b.depthFt)||b.widthFt<10||b.depthFt<15||b.widthFt>200||b.depthFt>250)x.push("Plot dimensions outside supported input range.");
 if(!["N","E","S","W"].includes(b.roadSide))x.push("Select a valid road side.");
 if(![b.setbacks.frontFt,b.setbacks.rearFt,b.setbacks.leftFt,b.setbacks.rightFt].every(valid))x.push("Setbacks must be nonnegative.");
 if(![1,2].includes(b.floors)||!Number.isInteger(b.bedrooms)||b.bedrooms<1||b.bedrooms>3)x.push("This audited prototype supports 1–3 bedrooms across G or G+1.");
 const W=b.widthFt-b.setbacks.leftFt-b.setbacks.rightFt;
 const D=b.depthFt-b.setbacks.frontFt-b.setbacks.rearFt;
 if(b.parking&&W<17.5)x.push("Parking + pedestrian entry + stairs needs at least 17.5 ft clear frontage in this layout family.");
 if(W<17.5||D<47)x.push("This road-front layout family needs at least 17.5 × 47 ft usable area; try G+1 without parking, or architect-designed alternatives.");
 if(!b.parking)x.push("Parking-free compact layout family has not yet passed circulation validation; no plan will be invented.");
 if(b.floors===1&&b.bedrooms>1)x.push("With this narrow parking-first template, only 1BHK fits on ground. Consider G+1 for 2–3 bedrooms.");
 if(b.floors===2&&b.bedrooms<2)x.push("For this G+1 family, at least one bedroom is allocated to each level.");
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
function build(b:PlanBrief,variant:"parking-left"|"parking-right"):PlanModel{
 const sb=b.setbacks,U={x:sb.leftFt,y:sb.frontFt,w:b.widthFt-sb.leftFt-sb.rightFt,d:b.depthFt-sb.frontFt-sb.rearFt};
 const W=U.w,D=U.d,parkW=Math.max(8.5,Math.min(10,round(W*.46)));
 const stairW=5.5,kitchenW=8.5,bathW=5;
 const rearBedW=Math.max(11,Math.min(12.5,W-6));
 if(W-kitchenW-bathW<3.75||W-parkW<8)return (null as never);
 const rooms:Room[]=[];
 const put=(id:string,label:string,kind:RoomKind,floor:number,x:number,y:number,w:number,d:number)=>
  rooms.push(room(id,label,kind,floor,U.x+x,U.y+y,w,d));
 put("parking","Car parking","parking",0,0,0,parkW,16);
 put("verandah","Entry verandah","verandah",0,parkW,0,W-parkW,5);
 put("living","Living / drawing","living",0,parkW,5,W-parkW,11);
 put("stairs-g","Stairs","stairs",0,0,16,stairW,10);
 put("dining","Dining","dining",0,stairW,16,W-stairW,10);
 put("kitchen","Kitchen","kitchen",0,0,26,kitchenW,8);
 put("bath-g","Bath / WC","bath",0,kitchenW,26,bathW,8);
 put("corridor-g","Passage","corridor",0,kitchenW+bathW,26,W-kitchenW-bathW,8);
 put("hall-g","Rear access hall","corridor",0,0,34,W,3);
 put("bed-g","Bedroom 1","bedroom",0,0,37,rearBedW,D-37);
 put("utility-g","Rear utility / wash","utility",0,rearBedW,37,W-rearBedW,D-37);
 if(b.floors===2){
  const upper=b.bedrooms-1;
  put("balcony-1","Street balcony","balcony",1,0,0,W,4);
  if(upper===1){
   put("bed-1a","Bedroom 2","bedroom",1,0,4,W,12);
  }else{
   put("bed-1a","Bedroom 2","bedroom",1,0,4,W/2,12);
   put("bed-1b","Bedroom 3","bedroom",1,W/2,4,W-W/2,12);
  }
  put("stairs-1","Stairs / landing","stairs",1,0,16,stairW,10);
  put("lounge-1","Family lounge","lounge",1,stairW,16,W-stairW,10);
  put("bath-1","First-floor bath","bath",1,0,26,stairW,8);
  put("utility-1","Wash / service","utility",1,stairW,26,W-stairW,8);
  put("terrace-1","Open terrace","terrace",1,0,34,W,D-34);
 }
 // A true mirrored variant: entire geometry, gates, windows and circulation, not labels alone.
 if(variant==="parking-right")for(const r of rooms)r.x=round(U.x+W-(r.x-U.x)-r.w);
 const openings:Opening[]=[];
 const joins=[
  ["verandah","living"],["living","dining"],["dining","stairs-g"],
  ["dining","kitchen"],["dining","corridor-g"],["kitchen","bath-g"],
  ["corridor-g","hall-g"],["hall-g","bed-g"],["hall-g","utility-g"]
 ];
 if(b.floors===2){
  joins.push(["stairs-1","lounge-1"],["stairs-1","bath-1"],["lounge-1","utility-1"],["lounge-1","bed-1a"],["balcony-1","bed-1a"]);
  if(b.bedrooms===3)joins.push(["lounge-1","bed-1b"],["balcony-1","bed-1b"]);
 }
 for(const [a,b] of joins)connect(rooms,openings,a,b);
 const entry=rooms.find(r=>r.id==="verandah")!;
 openings.push({id:"pedestrian-entry",roomId:entry.id,side:"front",atFt:round((entry.w-3)/2),widthFt:3,sillFt:0,heightFt:7,kind:"door"});
 const gateParking=rooms.find(r=>r.kind==="parking")!;
 const parkingGate={side:"front" as const,xFt:round(gateParking.x+.25),widthFt:Math.min(8,round(gateParking.w-.5))};
 const p:PlanModel={
  version:1,id:b.widthFt+"x"+b.depthFt+"-"+b.roadSide+"-"+b.floors+"-"+b.bedrooms+"-"+variant,
  variant,plot:{widthFt:b.widthFt,depthFt:b.depthFt,roadSide:b.roadSide},
  setbacks:{...sb,verified:false},walls:{externalFt:.75,internalFt:.375,heightFt:9.5,parapetFt:3},
  floors:b.floors,rooms,openings,gate:parkingGate,
  pedestrianGate:{side:"front",xFt:round(entry.x+(entry.w-3)/2),widthFt:3},
  parking:{roomId:"parking",clearWidthFt:gateParking.w,clearDepthFt:gateParking.d},
  stairs:{roomIds:b.floors===2?["stairs-g","stairs-1"]:["stairs-g"],
   note:"Staircase is a conceptual volume, NOT a checked tread/rise/headroom or fire escape."},
  balcony:b.floors===2?{roomId:"balcony-1"}:null,
  facade:{kit:"simple-parapet",massing:"box",main:variant==="parking-left"?"#e9e2d4":"#e7e6df",accent:"#8e755b"},
  score:0,notes:[
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
