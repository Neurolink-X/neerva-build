import {type PlanBrief,type PlanModel,type Room,type Opening,type Side,type RoomKind,
 type Rect,sharedEdge,area,validatePlan} from "./plan-model.ts";
import {conservativeEnvelope,shapeErrors} from "./site-shape.ts";
import {buildingWallCells} from "./geometry.ts";
import {frontagePanels,frontageSignature} from "./frontage.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {residentialStairStudies} from "./stair-study.ts";

export type PlanningResult={plans:PlanModel[];blockers:string[]};
const eps=.01;
const round=(n:number)=>Math.round(n*1e6)/1e6;
const valid=(v:number)=>Number.isFinite(v)&&v>=0;
export function explainImpossible(b:PlanBrief):string[]{
 const x:string[]=[];
 if(!valid(b.widthFt)||!valid(b.depthFt)||b.widthFt<10||b.depthFt<15||b.widthFt>200||b.depthFt>250)x.push("Plot dimensions outside supported input range.");
 if(!["N","E","S","W"].includes(b.roadSide))x.push("Select a valid road side.");
 if(![b.setbacks.frontFt,b.setbacks.rearFt,b.setbacks.leftFt,b.setbacks.rightFt].every(valid))x.push("Setbacks must be nonnegative.");
 if(![1,2,3].includes(b.floors)||!Number.isInteger(b.bedrooms)||b.bedrooms<1||b.bedrooms>6)x.push("Choose 1–6 bedrooms across one to three levels.");
 const shape=b.siteShape??{kind:"rectangle"} as const;
 x.push(...shapeErrors(b.widthFt,b.depthFt,shape));
 const safe=conservativeEnvelope(b.widthFt,b.depthFt,shape,b.setbacks);
 const W=b.widthFt-safe.leftFt-safe.rightFt;
 const D=b.depthFt-safe.frontFt-safe.rearFt;
 if(b.parking&&W<17.5)x.push("Parking + pedestrian entry + stairs needs at least 17.5 ft clear frontage in this layout family.");
 if(!b.parking&&(W<17.5||D<40)){
  if(W<15||D<30||b.floors!==1||b.bedrooms!==1)x.push("Compact pedestrian layouts need 15 × 30 ft usable area, one floor and one bedroom.");
 }else if(W<17.5||D<40)x.push("This road-front layout family needs at least 17.5 × 40 ft usable area. Check dimensions and setbacks.");
 if(b.bedrooms<=3&&b.floors===1&&(b.bedrooms>2||(b.bedrooms===2&&W<20))&&!(W>=26&&D>=40&&b.bedrooms===3))x.push("With this narrow parking-first template, only 1BHK fits on ground. Consider G+1 for 2–3 bedrooms.");
 if(b.bedrooms>3&&(W<26||D<40))x.push("4–6 BHK requires at least 26 × 40 ft usable space in this layout family. Your selected inputs have not been changed.");
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
 // Give real street-facing habitable walls useful window rhythm where clear
 // of doors and other openings. No window is added through a closed room.
 // These are the actual PlanModel openings, not decorative facade images.
 const model=p as PlanModel;
 for(const panel of frontagePanels({...model,floors:Math.max(1,...p.rooms.map(r=>r.floor+1))})){
  const r=p.rooms.find(room=>room.id===panel.roomId)!;
  if(!["bedroom","living","dining","lounge"].includes(r.kind)||panel.w<4.8)continue;
  if(p.openings.some(o=>o.roomId===r.id&&o.side==="front"&&o.kind==="window"))continue;
  const width=Math.min(4,round(panel.w-1)),atFt=round(panel.x-r.x+(panel.w-width)/2);
  if(p.openings.some(o=>o.roomId===r.id&&o.side==="front"&&atFt<o.atFt+o.widthFt+.15&&atFt+width>o.atFt-.15))continue;
  p.openings.push({id:"window-front-"+r.id,roomId:r.id,side:"front",atFt,widthFt:width,sillFt:3,heightFt:4,kind:"window"});
 }
}
export type SpatialProgramme="wash"|"family-gallery"|"rear-courtyard"|"rear-baranda";
type SpatialRecipe={reverseService?:boolean;reverseRear?:boolean;parkWidthFt?:number;entryDepthFt?:number;stairWidthFt?:number;kitchenWidthFt?:number;
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
 const twinRear=b.floors===1&&b.bedrooms===2;
 const stairW=twinRear?Math.max(6.5,W-13.5):recipe.stairWidthFt??5.5,kitchenW=twinRear?stairW+3:recipe.kitchenWidthFt??8.5,bathW=5;
 const rearBedW=twinRear?W/2:recipe.rearBedWidthFt??Math.max(11,Math.min(12.5,W-6));
 const entryDepth=recipe.entryDepthFt??5;
 const rearProgramme=recipe.rearProgramme??"wash";
 const rearKind:RoomKind=rearProgramme==="family-gallery"?"lounge":rearProgramme==="rear-courtyard"?"terrace":rearProgramme==="rear-baranda"?"verandah":"utility";
 const rearLabel=rearProgramme==="family-gallery"?"Covered gallery / family seating":rearProgramme==="rear-courtyard"?"Open rear courtyard":rearProgramme==="rear-baranda"?"Rear covered baranda":"Rear utility / wash";
 if(W-kitchenW-bathW<3.75||W-parkW<8)throw new RangeError("Insufficient width for kitchen, bath and passage.");
 const rooms:Room[]=[];
 const put=(id:string,label:string,kind:RoomKind,floor:number,x:number,y:number,w:number,d:number)=>
  rooms.push(room(id,label,kind,floor,U.x+x,U.y+y,w,d));
 put(b.parking?"parking":"front-court",b.parking?"Car parking":"Front garden court",b.parking?"parking":"terrace",0,0,0,parkW,16);
 put("verandah","Front verandah / baranda","verandah",0,parkW,0,W-parkW,entryDepth);
 put("living","Living / drawing","living",0,parkW,entryDepth,W-parkW,16-entryDepth);
 put("stairs-g","Stairs","stairs",0,0,16,stairW,10);
 put("dining",recipe.frontProgramme==="family-hall"?"Family hall / meeting space":recipe.frontProgramme==="family-lounge"?"Family lounge / drawing":"Dining / family hall",recipe.frontProgramme==="family-hall"?"living":recipe.frontProgramme==="family-lounge"?"lounge":"dining",0,stairW,16,W-stairW,10);
 put("kitchen","Kitchen","kitchen",0,0,26,kitchenW,8);
 put("bath-g","Bath / WC","bath",0,kitchenW,26,bathW,8);
 put("corridor-g","Passage","corridor",0,kitchenW+bathW,26,W-kitchenW-bathW,8);
 put("hall-g","Rear access hall","corridor",0,0,34,W,3);
 put("bed-g","Bedroom 1","bedroom",0,0,37,rearBedW,D-37);
 put(twinRear?"bed-g2":"utility-g",twinRear?"Bedroom 2":rearLabel,twinRear?"bedroom":rearKind,0,rearBedW,37,W-rearBedW,D-37);
 for(let level=1;level<b.floors;level++){
  const upper=b.bedrooms<b.floors?(level<b.bedrooms?1:0):b.bedrooms-b.floors+1;
  put(`balcony-${level}`,"Street balcony","balcony",level,0,0,W,4);
  if(upper===0){
   put(`family-room-${level}`,"Family room (no bedroom)","lounge",level,0,4,W,12);
  }else if(upper===1){
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
 // Place the wet core and sleeping wing independently of the street entrance.
 for(const r of rooms){
  const serviceWing=recipe.reverseService && (r.y===U.y+26);
  const sleepingWing=recipe.reverseRear && r.y===U.y+37;
  if(serviceWing||sleepingWing)r.x=round(U.x+W-(r.x-U.x)-r.w);
 }
 // On shorter plots preserve the 16 ft parking bay and the 3 ft rear hall.
 // Redistribute the stair and service bands before validating each room.
 if(D<47){
  const stairDepth=Math.max(twinRear?5.5:7,10-(47-D)*(twinRear?.65:.6));
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
  ["corridor-g","hall-g"],["hall-g","bed-g"],["hall-g",twinRear?"bed-g2":"utility-g"]
 ];
 for(let level=1;level<b.floors;level++){
  const frontRoom=b.bedrooms<b.floors&&level>=b.bedrooms?`family-room-${level}`:`bed-${level}a`;
  joins.push([`stairs-${level}`,`lounge-${level}`],[`stairs-${level}`,`bath-${level}`],[`lounge-${level}`,`utility-${level}`],[`lounge-${level}`,frontRoom],[`balcony-${level}`,frontRoom]);
  if(b.bedrooms<b.floors&&level>=b.bedrooms)joins.push([`utility-${level}`,`terrace-${level}`]);
  if(b.bedrooms>b.floors)joins.push([`lounge-${level}`,`bed-${level}b`],[`balcony-${level}`,`bed-${level}b`]);
 }
 if(!b.parking)joins.push(["verandah","front-court"]);
 for(const [a,b] of joins){
  const first=rooms.find(r=>r.id===a),second=rooms.find(r=>r.id===b);
  if(recipe.reverseService&&first&&second&&!sharedEdge(first,second)){
   // A reflected wet core opens into the adjoining landing or hall.
   const landing=rooms.find(r=>r.floor===second.floor && (r.kind==="stairs"||r.id==="dining"||r.id.startsWith("lounge-")) && sharedEdge(r,second));
   if(!landing)throw new Error("No adjacent landing for "+b);
   connect(rooms,openings,landing.id,b);
  }else connect(rooms,openings,a,b);
 }
 const entry=rooms.find(r=>r.id==="verandah")!;
 openings.push({id:"pedestrian-entry",roomId:entry.id,side:"front",atFt:round((entry.w-3)/2),widthFt:3,sillFt:0,heightFt:7,kind:"door"});
 const gateParking=rooms.find(r=>r.id===(b.parking?"parking":"front-court"))!;
 const parkingGate={side:"front" as const,xFt:round(gateParking.x+.25),widthFt:b.parking?Math.min(8,round(gateParking.w-.5)):0};
 const p:PlanModel={
  version:1,id:b.widthFt+"x"+b.depthFt+"-"+b.roadSide+"-"+b.floors+"-"+b.bedrooms+"-"+variant+(b.parking?"":"-garden")+(b.siteShape&&b.siteShape.kind!=="rectangle"?"-"+b.siteShape.kind+"-"+b.siteShape.notchWidthFt+"x"+b.siteShape.notchDepthFt:"")+(recipe.familyLabel?"-"+recipe.familyLabel:""),
  variant,plot:{widthFt:b.widthFt,depthFt:b.depthFt,roadSide:b.roadSide,siteShape:b.siteShape},
  setbacks:{...sb,verified:false},walls:{externalFt:.75,internalFt:.375,heightFt:9.5,parapetFt:3},
  floors:b.floors,rooms,openings,gate:parkingGate,
  pedestrianGate:{side:"front",xFt:round(entry.x+(entry.w-3)/2),widthFt:3},
  parking:b.parking?{roomId:"parking",clearWidthFt:gateParking.w,clearDepthFt:gateParking.d}:null,
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

/**
 * Additional verified circulation families. Unlike palette or mirrored-only ideas,
 * these move the actual entrance, stair shaft, ground bedroom and kitchen zones.
 * Road is local y=0; the common PlanModel feeds both floor drawings and 3D walls.
 */
function buildArchitecturalFamily(
 b:PlanBrief,variant:"parking-left"|"parking-right",
 family:"front-stair"|"front-bedroom",rearProgramme:SpatialProgramme
):PlanModel{
 if(!b.parking)throw new Error("Pedestrian variants are handled separately");
 const sb=houseEnvelope(b),U={x:sb.leftFt,y:sb.frontFt,
  w:b.widthFt-sb.leftFt-sb.rightFt,d:b.depthFt-sb.frontFt-sb.rearFt};
 const W=U.w,D=U.d,parkW=8.5;
 if(D<47||W<(family==="front-bedroom"?20:17.5)||b.bedrooms<b.floors||
    (b.floors===1&&b.bedrooms!==1))throw new Error("Footprint cannot fit this circulation family");
 const rooms:Room[]=[],openings:Opening[]=[];
 const add=(id:string,label:string,kind:RoomKind,floor:number,x:number,y:number,w:number,d:number)=>
  rooms.push(room(id,label,kind,floor,U.x+x,U.y+y,w,d));
 const rearKind:RoomKind=rearProgramme==="rear-courtyard"?"terrace":rearProgramme==="family-gallery"?"lounge":
  rearProgramme==="rear-baranda"?"verandah":"utility";
 add("parking","Car parking","parking",0,0,0,parkW,16);
 if(family==="front-stair"){
  add("stairs-g","Street-side stair bay","stairs",0,parkW,0,5,10);
  add("verandah","Front pedestrian verandah","verandah",0,parkW+5,0,W-parkW-5,10);
  add("living","Living / drawing","living",0,parkW,10,W-parkW,16);
  add("kitchen","Kitchen","kitchen",0,0,16,parkW,10);
  add("dining","Dining / family hall","dining",0,parkW,26,W-parkW,8);
  add("bath-g","Bath / WC","bath",0,0,26,5,8);
  add("corridor-g","Service passage","corridor",0,5,26,parkW-5,8);
  add("hall-g","Bedroom access hall","corridor",0,0,34,W,3);
  const rearBed=Math.min(12,Math.max(10.5,W*.61));
  add("bed-g","Ground bedroom","bedroom",0,0,37,rearBed,D-37);
  add("utility-g",rearProgramme.replace(/-/g," "),"utility"===rearKind?"utility":rearKind,0,rearBed,37,W-rearBed,D-37);
  for(let level=1;level<b.floors;level++){
   add("stairs-"+level,"Stairs / landing","stairs",level,parkW,0,5,10);
   add("balcony-"+level,"Street balcony","balcony",level,parkW+5,0,W-parkW-5,10);
   add("bath-"+level,"Bath / WC","bath",level,0,10,5,10);
   add("corridor-"+level,"Bedroom corridor","corridor",level,5,10,parkW-5,10);
   add("lounge-"+level,"Family landing","lounge",level,parkW,10,W-parkW,10);
   const doubleBeds=level===1&&b.bedrooms>b.floors;
   if(doubleBeds){
    add("bed-"+level+"a","Bedroom "+(level+1),"bedroom",level,0,20,W/2,17);
    add("bed-"+level+"b","Bedroom "+(level+2),"bedroom",level,W/2,20,W/2,17);
   }else add("bed-"+level+"a","Bedroom "+(level+1),"bedroom",level,0,20,W,17);
   add("terrace-"+level,"Rear terrace","terrace",level,0,37,W,D-37);
  }
 }else{
  const stairsW=5.5,porchW=3.5,roomW=W-parkW-porchW;
  add("verandah","Independent entry veranda","verandah",0,parkW,0,porchW,16);
  add("bed-g","Street-facing bedroom","bedroom",0,parkW+porchW,0,roomW,16);
  add("stairs-g","Central stair bay","stairs",0,0,16,stairsW,10);
  add("living","Living / drawing","living",0,stairsW,16,W-stairsW,10);
  add("kitchen","Kitchen","kitchen",0,0,26,parkW,8);
  add("bath-g","Bath / WC","bath",0,parkW,26,5,8);
  add("corridor-g","Service passage","corridor",0,parkW+5,26,W-parkW-5,8);
  add("hall-g","Rear access hall","corridor",0,0,34,W,3);
  const split=Math.min(12,Math.max(10,W*.5));
  add("utility-g","Rear utility / wash","utility",0,0,37,split,D-37);
  add("rear-g",rearProgramme.replace(/-/g," "),rearKind,0,split,37,W-split,D-37);
  for(let level=1;level<b.floors;level++){
   add("balcony-"+level,"Front balcony","balcony",level,0,0,W,4);
   const doubleBeds=level===1&&b.bedrooms>b.floors;
   if(doubleBeds){
    add("bed-"+level+"a","Bedroom "+(level+1),"bedroom",level,0,4,W/2,12);
    add("bed-"+level+"b","Bedroom "+(level+2),"bedroom",level,W/2,4,W/2,12);
   }else add("bed-"+level+"a","Bedroom "+(level+1),"bedroom",level,0,4,W,12);
   add("stairs-"+level,"Stairs / landing","stairs",level,0,16,stairsW,10);
   add("lounge-"+level,"Family lounge","lounge",level,stairsW,16,W-stairsW,10);
   add("bath-"+level,"Bath / WC","bath",level,0,26,stairsW,8);
   add("utility-"+level,"Wash / service","utility",level,stairsW,26,W-stairsW,8);
   add("terrace-"+level,"Rear terrace","terrace",level,0,34,W,D-34);
  }
 }
 if(variant==="parking-right")for(const r of rooms)r.x=round(U.x+W-(r.x-U.x)-r.w);
 const joins:[string,string][]=
 family==="front-stair"?
 [["verandah","living"],["verandah","stairs-g"],["living","kitchen"],["living","dining"],
  ["dining","corridor-g"],["corridor-g","bath-g"],["dining","hall-g"],["hall-g","bed-g"],["hall-g","utility-g"]]:
 [["verandah","bed-g"],["verandah","living"],["living","stairs-g"],["living","kitchen"],
  ["living","corridor-g"],["corridor-g","bath-g"],["bath-g","kitchen"],["corridor-g","hall-g"],
  ["hall-g","utility-g"],["hall-g","rear-g"]];
 // The front-bedroom family has a direct living↔stair wall; not a walk-through bedroom.
 for(let level=1;level<b.floors;level++){
  if(family==="front-stair"){
   joins.push(["stairs-"+level,"lounge-"+level],
    ["lounge-"+level,"corridor-"+level],["corridor-"+level,"bath-"+level]);
   if(level===1&&b.bedrooms>b.floors){
    joins.push(["corridor-"+level,"bed-"+level+"a"],["lounge-"+level,"bed-"+level+"b"]);
   }else joins.push(["lounge-"+level,"bed-"+level+"a"]);
  }else{
   joins.push(["stairs-"+level,"lounge-"+level],["stairs-"+level,"bath-"+level],
    ["lounge-"+level,"utility-"+level],["lounge-"+level,"bed-"+level+"a"]);
   if(level===1&&b.bedrooms>b.floors)joins.push(["lounge-"+level,"bed-"+level+"b"]);
  }
 }
 for(const [a,z] of joins)connect(rooms,openings,a,z);
 const porch=rooms.find(r=>r.id==="verandah")!,park=rooms.find(r=>r.id==="parking")!;
 openings.push({id:"pedestrian-entry",roomId:porch.id,side:"front",
  atFt:round((porch.w-3)/2),widthFt:3,sillFt:0,heightFt:7,kind:"door"});
 const p:PlanModel={
  version:1,id:[b.widthFt+"x"+b.depthFt,b.roadSide,b.floors,b.bedrooms,variant,family,rearProgramme,...(b.siteShape&&b.siteShape.kind!=="rectangle"?[b.siteShape.kind,b.siteShape.notchWidthFt+"x"+b.siteShape.notchDepthFt]:[])].join("-"),
  variant,plot:{widthFt:b.widthFt,depthFt:b.depthFt,roadSide:b.roadSide,siteShape:b.siteShape},
  setbacks:{...sb,verified:false},walls:{externalFt:.75,internalFt:.375,heightFt:9.5,parapetFt:3},
  floors:b.floors,rooms,openings,gate:{side:"front",xFt:round(park.x+.25),widthFt:8},
  pedestrianGate:{side:"front",xFt:round(porch.x+(porch.w-3)/2),widthFt:3},
  parking:{roomId:"parking",clearWidthFt:park.w,clearDepthFt:park.d},
  stairs:{roomIds:rooms.filter(r=>r.kind==="stairs").map(r=>r.id),
   note:"Conceptual stair shaft; tread/rise, headroom, escape routes unverified."},
  balcony:b.floors>1?{roomId:"balcony-1"}:null,
  facade:{kit:family==="front-stair"?"jali-screen":"stepped-band",
   massing:family==="front-stair"?"stepped":"box",main:"#e9e2d4",accent:"#8e755b"},
  score:80,notes:["Architecture family: "+family+" · "+rearProgramme,
   ...(b.siteShape&&b.siteShape.kind!=="rectangle"?["L-plot rear corner omitted. Entire adjacent strip is kept unbuilt as a conservative construction envelope; a cadastral site survey and licensed architect must verify the actual boundary."]:[]),
   "City rules, setbacks, FAR, stair safety, vehicle manoeuvring and permits require a licensed architect.",
   "Concept only. Room locations are modeled; structural/municipal approval is not included."],conceptOnly:true
 };
 addWindow(p);
 return p;
}

function compactPedestrianPlans(b:PlanBrief,limit:number):PlanningResult|null{
 const sb=conservativeEnvelope(b.widthFt,b.depthFt,b.siteShape??{kind:"rectangle"},b.setbacks);
 const width=b.widthFt-sb.leftFt-sb.rightFt,depth=b.depthFt-sb.frontFt-sb.rearFt;
 // A dedicated stair-free 1 BHK is also useful on larger plots. Keep the
 // unoccupied area open rather than adding stairs or stretching bedrooms.
 if(b.parking||b.floors!==1||b.bedrooms!==1)return null;
 // Cap the occupied footprint on elongated sites; remaining area stays open.
 const w=Math.min(20,width),d=Math.min(38,depth);
 const setbacks={...sb,rightFt:sb.rightFt+width-w,rearFt:sb.rearFt+depth-d,verified:false as const};
 const plans:PlanModel[]=[];
 const recipes=[{id:"balanced",label:"Balanced living and bedroom",delta:0},...(d>=34?[{id:"living",label:"Spacious living and dining",delta:2},{id:"bedroom",label:"Spacious private bedroom",delta:-2}]:[])];
 for(const recipe of recipes)for(const left of [true,false]){
  const ox=sb.leftFt,oy=sb.frontFt,livingDepth=Math.floor((d-11)/2)+recipe.delta;
  const serviceY=3+livingDepth,bedY=serviceY+8,kitchenW=Math.max(6,w-8);
  const rooms:Room[]=[];
  const add=(id:string,label:string,kind:RoomKind,x:number,y:number,rw:number,rd:number)=>
   rooms.push(room(id,label,kind,0,ox+(left?x:w-x-rw),oy+y,rw,rd));
  add("verandah","Front porch","verandah",0,0,w,3);
  add("living","Living and dining","living",0,3,w,livingDepth);
  add("kitchen","Kitchen","kitchen",0,serviceY,kitchenW,8);
  add("hall-g","Passage","corridor",kitchenW,serviceY,3.5,8);
  add("bath-g","Bath / WC","bath",kitchenW+3.5,serviceY,w-kitchenW-3.5,8);
  add("bed-g","Bedroom","bedroom",0,bedY,w,d-bedY);
  const openings:Opening[]=[];
  for(const [a,z] of [["verandah","living"],["living","hall-g"],["hall-g","kitchen"],["hall-g","bath-g"],["hall-g","bed-g"]])connect(rooms,openings,a,z);
  const entry=(w-3)/2;
  openings.push({id:"entry",roomId:"verandah",kind:"door",side:"front",atFt:entry,widthFt:3,heightFt:7,sillFt:0});
  const variant=left?"parking-left":"parking-right";
  const plan:PlanModel={version:1,id:b.widthFt+"x"+b.depthFt+"-"+b.roadSide+"-pedestrian-"+(left?"left":"right")+(recipe.id==="balanced"?"":"-"+recipe.id)+(b.siteShape&&b.siteShape.kind!=="rectangle"?"-"+b.siteShape.kind+"-"+b.siteShape.notchWidthFt+"x"+b.siteShape.notchDepthFt:""),
   variant,plot:{widthFt:b.widthFt,depthFt:b.depthFt,roadSide:b.roadSide,siteShape:b.siteShape},setbacks,floors:1,rooms,openings,
   walls:{externalFt:.75,internalFt:.375,heightFt:9.5,parapetFt:3},gate:{side:"front",xFt:ox,widthFt:0},
   pedestrianGate:{side:"front",xFt:ox+entry,widthFt:3},parking:null,stairs:{roomIds:[],note:"Single-level pedestrian plan."},
   balcony:null,facade:{kit:"simple-parapet",massing:"box",main:"#e9e2d4",accent:"#8e755b"},
   score:recipe.id==="balanced"?1:0,notes:[recipe.label,...(b.siteShape&&b.siteShape.kind!=="rectangle"?["L-plot rear corner omitted. Entire adjacent strip is kept unbuilt as a conservative construction envelope; a cadastral site survey and licensed architect must verify the actual boundary."]:[]),"City rules, setbacks and construction details require local professional review."],conceptOnly:true};
  addWindow(plan);
  if(validateRequestedProgramme(plan,b).length===0)plans.push(plan);
 }
 return {plans:pickDiverse(plans,limit),blockers:plans.length?[]:["Room sizes or access could not be validated within the available footprint."]};
}
/** Never display a valid geometry that silently changes the customer's room programme. */

// A wider access-spine family for larger homes. No candidate bypasses the PlanModel validator.
function widePortfolio(b:PlanBrief,limit:number):PlanModel[]{
 const base=conservativeEnvelope(b.widthFt,b.depthFt,b.siteShape??{kind:"rectangle"},b.setbacks);
 const aw=b.widthFt-base.leftFt-base.rightFt,ad=b.depthFt-base.frontFt-base.rearFt;
 if(aw<26||ad<40)return [];
 const W=Math.min(36,aw),D=Math.min(85,ad),sb={...base,leftFt:base.leftFt+(aw-W)/2,rightFt:base.rightFt+(aw-W)/2,rearFt:base.rearFt+ad-D,verified:false};
 const plans:PlanModel[]=[],seen=new Set<string>(),meshes=new Set<string>();
 type Slot={floor:number;x:number;y:number;w:number;d:number;capacity:number;count:number;key:string};
 // A coprime stride visits every recipe once, sampling materially different
 // stair, kitchen, bedroom and entry dimensions early instead of adjacent variants.
 for(let iteration=0;iteration<576&&plans.length<limit;iteration++){
  const recipe=(iteration*73)%576;
  const spine=4+recipe%2,left=round((W-spine)/2+[0,-2,2,-1,1,3][Math.floor(recipe/2)%6]),right=round(W-spine-left);
  if(left<9||right<9)continue;
  const mirror=Math.floor(recipe/12)%2===1,variant=mirror?"parking-right":"parking-left",stairDepth=9+Math.floor(recipe/24)%3,kitchenDepth=8+Math.floor(recipe/72)%2*2,entryDepth=4+Math.floor(recipe/144)%2,bedTarget=12+Math.floor(recipe/288)%2*3;
  const rooms:Room[]=[],openings:Opening[]=[],joins:[string,string][]=[],slots:Slot[]=[];
  const add=(id:string,label:string,kind:RoomKind,floor:number,x:number,y:number,w:number,d:number)=>rooms.push(room(id,label,kind,floor,sb.leftFt+(mirror?W-x-w:x),sb.frontFt+y,w,d));
  function slot(floor:number,x:number,y:number,w:number,d:number,key:string){
   if(d<.1)return;const minDepth=Math.max(10,Math.ceil(96/w),w/2.5);
   slots.push({floor,x,y,w,d,capacity:Math.floor(d/minDepth),count:0,key});
  }
  for(let floor=0;floor<b.floors;floor++){
   const hall="wide-hall-"+floor;
   add(hall,"Access passage","corridor",floor,left,floor===0?16:0,spine,D-(floor===0?16:0));
   if(floor===0){
    add("wide-front",b.parking?"Car parking":"Front garden",b.parking?"parking":"terrace",0,0,0,left,16);
    add("wide-entry","Front verandah","verandah",0,left,0,W-left,entryDepth);
    add("wide-living","Living room","living",0,left,entryDepth,W-left,16-entryDepth);
    joins.push(["wide-entry","wide-living"],["wide-living",hall]);
    add("wide-kitchen","Kitchen","kitchen",0,left+spine,16,right,kitchenDepth);
    add("wide-bath-0","Bath / WC","bath",0,left+spine,16+kitchenDepth,right,6);
    joins.push([hall,"wide-kitchen"],[hall,"wide-bath-0"]);
    slot(0,left+spine,22+kitchenDepth,right,D-22-kitchenDepth,"right-rear");
   }else{
    slot(floor,0,0,left,16,"left-front");slot(floor,left+spine,0,right,16,"right-front");
    add("wide-bath-"+floor,"Bath / WC","bath",floor,left+spine,16,right,8);joins.push([hall,"wide-bath-"+floor]);
    slot(floor,left+spine,24,right,D-24,"right-rear");
   }
   const stair="wide-stair-"+floor;
   add(stair,"Stairs / landing","stairs",floor,0,16,left,stairDepth);joins.push([hall,stair]);
   slot(floor,0,16+stairDepth,left,D-16-stairDepth,"left-rear");
  }
  const order=slots.filter(s=>s.capacity>0).sort((a,z)=>{
   const mode=Math.floor(recipe/4)%4;
   return mode===0?a.floor-z.floor||z.d-a.d:mode===1?z.floor-a.floor||z.d-a.d:mode===2?a.key.localeCompare(z.key)||a.floor-z.floor:z.key.localeCompare(a.key)||z.floor-a.floor;
  });
  if(!order.length)continue;
  const offset=Math.floor(recipe/16)%order.length,rotated=[...order.slice(offset),...order.slice(0,offset)];
  let remaining=b.bedrooms;
  while(remaining){let progress=false;for(const s of rotated){if(s.count<s.capacity&&remaining){s.count++;remaining--;progress=true}}if(!progress)break}
  if(remaining)continue;
  let n=0;
  for(const s of slots){
   const openId="wide-open-"+s.floor+"-"+s.key;
   if(!s.count){add(openId,"Open court / terrace","terrace",s.floor,s.x,s.y,s.w,s.d);continue}
   const minDepth=Math.max(10,Math.ceil(96/s.w),s.w/2.5),bedDepth=Math.min(Math.floor(s.d/s.count),Math.max(minDepth,bedTarget));
   for(let i=0;i<s.count;i++){const id="wide-bed-"+(++n);add(id,"Bedroom "+n,"bedroom",s.floor,s.x,s.y+i*bedDepth,s.w,bedDepth);joins.push(["wide-hall-"+s.floor,id])}
   const extra=s.d-s.count*bedDepth;
   if(extra>.1)add(openId,"Open court / terrace","terrace",s.floor,s.x,s.y+s.count*bedDepth,s.w,extra);
  }
  const entry=rooms.find(r=>r.id==="wide-entry")!,park=rooms.find(r=>r.id==="wide-front")!;
  try{
   for(const [a,z] of joins)connect(rooms,openings,a,z);
   openings.push({id:"wide-entry-door",roomId:entry.id,side:"front",atFt:round((entry.w-3)/2),widthFt:3,sillFt:0,heightFt:7,kind:"door"});
   const p:PlanModel={version:1,id:[b.widthFt+"x"+b.depthFt,b.roadSide,b.floors,b.bedrooms,b.parking?"car":"garden",b.siteShape?.kind??"rectangle",...(b.siteShape&&b.siteShape.kind!=="rectangle"?[b.siteShape.notchWidthFt,b.siteShape.notchDepthFt]:[]),"wide",recipe].join("-"),variant,plot:{widthFt:b.widthFt,depthFt:b.depthFt,roadSide:b.roadSide,siteShape:b.siteShape},setbacks:sb,walls:{externalFt:.75,internalFt:.375,heightFt:9.5,parapetFt:3},floors:b.floors,rooms,openings,gate:{side:"front",xFt:round(park.x+.25),widthFt:b.parking?8:0},pedestrianGate:{side:"front",xFt:round(entry.x+(entry.w-3)/2),widthFt:3},parking:b.parking?{roomId:park.id,clearWidthFt:park.w,clearDepthFt:park.d}:null,stairs:{roomIds:rooms.filter(r=>r.kind==="stairs").map(r=>r.id),note:"Concept stairs; tread, headroom and fire safety unverified."},balcony:null,facade:{kit:recipe%3===0?"stepped-band":recipe%3===1?"jali-screen":"simple-parapet",massing:"box",main:"#e9e2d4",accent:"#8e755b"},score:80,notes:["Wide circulation layout · "+(mirror?"right":"left")+" entry court","City rules, setbacks, structural design, stairs, parking and ventilation require professional review.","Open areas are intentionally unbuilt; not a certified floor plan."],conceptOnly:true};
   addWindow(p);if(validateRequestedProgramme(p,b).length)continue;
   const signature=planSignature(p),mesh=buildingWallCells(studioDesignFromPlan(p)).map(c=>[c.floorIndex,c.axis,c.planeFt,c.startFt,c.endFt,c.bottomFt,c.topFt].join(":")).sort().join("|");
   if(seen.has(signature)||!mesh||meshes.has(mesh))continue;
   seen.add(signature);meshes.add(mesh);plans.push(p);
  }catch{/* Discard invalid candidates. */}
 }
 return plans;
}
function wideResult(b:PlanBrief,limit:number):PlanningResult{
 const plans=widePortfolio(b,Math.max(1,Math.min(24,Math.floor(limit))));
 return {plans,blockers:plans.length?[]:["No geometry-checked "+b.bedrooms+" BHK concept fits your selected "+b.widthFt+" × "+b.depthFt+" ft plot, levels and parking. Try more usable space or floors, or fewer bedrooms. Your input has not been changed."]};
}

export function validateRequestedProgramme(p:PlanModel,b:PlanBrief):string[]{
 const errors=validatePlan(p);
 if(p.floors!==b.floors||p.rooms.filter(r=>r.kind==="bedroom").length!==b.bedrooms||Boolean(p.parking)!==b.parking||p.plot.widthFt!==b.widthFt||p.plot.depthFt!==b.depthFt||p.plot.roadSide!==b.roadSide)errors.push("Plan does not match requested plot, floors, bedrooms or parking.");
 if(!p.rooms.some(r=>r.kind==="living")||!p.rooms.some(r=>r.kind==="kitchen")||!p.rooms.some(r=>r.kind==="bath"))errors.push("Missing essential BHK spaces.");
 const requestedShape=b.siteShape??({kind:"rectangle"} as const),actualShape=p.plot.siteShape??({kind:"rectangle"} as const);
 if(requestedShape.kind!==actualShape.kind||(requestedShape.kind!=="rectangle"&&actualShape.kind!=="rectangle"&&(requestedShape.notchWidthFt!==actualShape.notchWidthFt||requestedShape.notchDepthFt!==actualShape.notchDepthFt)))errors.push("Plan does not match the requested plot outline.");
 for(const side of ["frontFt","rearFt","leftFt","rightFt"] as const)if(p.setbacks[side]+.00001<b.setbacks[side])errors.push("Plan encroaches on requested "+side+" setback.");
 for(let floor=0;floor<b.floors;floor++)if(!p.rooms.some(r=>r.floor===floor&&!["parking","terrace","balcony","verandah"].includes(r.kind)))errors.push("Requested floor has no enclosed room or circulation.");
 return errors;
}
export function planSignature(p:PlanModel):string{
 // IDs, labels, room names and exterior finishes cannot manufacture a new floor plan.
 return p.rooms.map(r=>[r.floor,r.x,r.y,r.w,r.d].join(":")).sort().join("|");
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
 if(brief.bedrooms>3||(brief.bedrooms===3&&brief.floors===1))return wideResult(brief,3);
 const compact=compactPedestrianPlans(brief,2);if(compact)return compact;
 const candidates:PlanModel[]=[];
 for(const variant of ["parking-left","parking-right"] as const){
  try{const p=build(brief,variant),errors=validateRequestedProgramme(p,brief);if(!errors.length)candidates.push(p);
   else blockers.push(variant+": "+errors.join("; "));
  }catch(error){blockers.push(variant+": "+(error instanceof Error?error.message:"Unknown invalid geometry"))}
 }
 const plans=pickDiverse(candidates,3);
 return {plans,blockers:plans.length?[]:blockers.length?blockers:["No circulation-safe candidate fits; revise requested programme."]};
}

/** Prefer genuinely different room zoning before small dimensional adjustments.
 * Preserve the original first plan and keep deterministic option IDs. All inputs
 * and validated coordinates are untouched; only the gallery ordering changes.
 */
function prioritizeSpatialDiversity(plans:PlanModel[]):PlanModel[]{
 if(plans.length<3)return plans;
 const important:RoomKind[]=["bedroom","living","kitchen","stairs","bath","terrace","parking"];
 const features=(p:PlanModel)=>important.flatMap(kind=>Array.from({length:p.floors},(_,floor)=>{
  const rooms=p.rooms.filter(r=>r.kind===kind&&r.floor===floor);
  if(!rooms.length)return [0,0,0,0];
  const areaSum=rooms.reduce((sum,r)=>sum+r.w*r.d,0);
  return [rooms.length,rooms.reduce((sum,r)=>sum+(r.x+r.w/2)*r.w*r.d,0)/areaSum/p.plot.widthFt,rooms.reduce((sum,r)=>sum+(r.y+r.d/2)*r.w*r.d,0)/areaSum/p.plot.depthFt,areaSum/(p.plot.widthFt*p.plot.depthFt)];
 }).flat());
 const vectors=new Map(plans.map(p=>[p.id,features(p)]));
 const distance=(a:PlanModel,b:PlanModel)=>vectors.get(a.id)!.reduce((sum,x,i)=>sum+Math.abs(x-vectors.get(b.id)![i])*(i%4===0?2:1),0);
 const signatures=new Map(plans.map(p=>[p.id,frontageSignature(p)]));
 const ordered=[plans[0]],remaining=plans.slice(1),fronts=new Set([signatures.get(plans[0].id)!]);
 while(remaining.length){let best=0,bestScore=-1;
  for(let i=0;i<remaining.length;i++){const score=Math.min(...ordered.map(p=>distance(p,remaining[i])))+(fronts.has(signatures.get(remaining[i].id)!)?0:4);if(score>bestScore){best=i;bestScore=score}}
  const next=remaining.splice(best,1)[0];ordered.push(next);fronts.add(signatures.get(next.id)!);
 }
 return ordered;
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
 if(brief.bedrooms>3||(brief.bedrooms===3&&brief.floors===1))return wideResult(brief,limit);
 if(brief.bedrooms===1&&brief.widthFt>=26&&brief.depthFt>=40){const wide=wideResult(brief,limit);if(wide.plans.length)return wide;}
 const compact=compactPedestrianPlans(brief,Math.max(1,Math.floor(limit)));if(compact)return compact;
 const envelope=houseEnvelope(brief);
 const W=brief.widthFt-envelope.leftFt-envelope.rightFt;
 const baseParking=Math.max(8.5,Math.min(10,round(W*.46)));
 const plans:PlanModel[]=[],seen=new Set<string>(),seenMeshes=new Set<string>();
 const normalized=Math.max(1,Math.min(brief.bedrooms===1?6:24,Math.floor(limit)));
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
   const recipe:SpatialRecipe={reverseService:i%4>=2,reverseRear:i%2===1,parkWidthFt:park,entryDepthFt:entryDepth,stairWidthFt:stair,
    kitchenWidthFt:kitchen,rearBedWidthFt:bedWidth,upperBedRatio:ratio,rearProgramme:prog,
    frontProgramme:family,familyLabel:"spatial-"+i+"-"+prog+"-"+family};
   try{
    const family=brief.bedrooms<brief.floors?null:i%3===1?"front-stair":i%3===2&&W>=20?"front-bedroom":null;
    const p=family?buildArchitecturalFamily(brief,variant,family,prog):build(brief,variant,recipe),
     errors=validateRequestedProgramme(p,brief);
    if(errors.length)continue;
    const geometry=planSignature(p);
    if(seen.has(geometry))continue;
    // Distinct room labels do not mean distinct buildings. Deduplicate the actual
    // 3D wall mesh geometry, including doors/windows, before advertising a plan.
    const mesh=buildingWallCells(studioDesignFromPlan(p)).map(cell=>
      [cell.floorIndex,cell.axis,cell.planeFt,cell.startFt,cell.endFt,cell.bottomFt,cell.topFt].join(":")).sort().join("|");
    if(!mesh||seenMeshes.has(mesh))continue;
    seen.add(geometry);seenMeshes.add(mesh);
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
 // Larger 2–3 BHK plots also deserve actual central-spine architecture, not only mirrored narrow-house recipes.
 if(brief.bedrooms>=2&&brief.floors>1){
  for(const p of widePortfolio(brief,normalized)){
   const signature=planSignature(p),mesh=buildingWallCells(studioDesignFromPlan(p)).map(c=>[c.floorIndex,c.axis,c.planeFt,c.startFt,c.endFt,c.bottomFt,c.topFt].join(":")).sort().join("|");
   if(!mesh||seen.has(signature)||seenMeshes.has(mesh)||validateRequestedProgramme(p,brief).length)continue;
   seen.add(signature);seenMeshes.add(mesh);ordered.push(p);
  }
 }
 return {plans:prioritizeSpatialDiversity(ordered).slice(0,normalized),
  blockers:ordered.length?[]:["No validated distinct spatial layout fits these dimensions, rooms, parking and setbacks."]};
}



/** Optional, versioned two-storey candidates: re-position reciprocal doors
 * on the real stair bay and corridor, then verify both the programme and flight.
 * Legacy portfolios and option indexes remain unchanged. */
export function generateStairReadyPortfolio(b:PlanBrief,limit=24):PlanningResult{
 const blockers=explainImpossible(b);if(blockers.length)return {plans:[],blockers};
 if(b.floors!==2)return {plans:[],blockers:["The checked dog-leg family currently supports two levels only."]};
 const max=Math.max(1,Math.min(24,Math.floor(limit))),plans:PlanModel[]=[],seen=new Set<string>();
 for(const base of widePortfolio(b,24)){
  for(const reverse of [false,true]){
   const openings=base.openings.map(o=>({...o}));
   let ok=true;
   for(const floor of [0,1]){
    const stair=base.rooms.find(r=>r.id==="wide-stair-"+floor),hall=base.rooms.find(r=>r.id==="wide-hall-"+floor);
    if(!stair||!hall){ok=false;break}
    const door=openings.find(o=>o.roomId===stair.id&&o.connectsTo===hall.id&&o.kind==="door"),paired=openings.find(o=>o.roomId===hall.id&&o.connectsTo===stair.id&&o.kind==="door");
    if(!door||!paired||(door.side!=="left"&&door.side!=="right")){ok=false;break}
    const start=(floor===0)!==reverse?.5:3.75;
    door.atFt=start;paired.atFt=round(stair.y+start-hall.y);
   }
   if(!ok)continue;
   const p:PlanModel={...base,id:base.id+"-stair-v1-"+(reverse?1:0),openings,stairs:{...base.stairs,note:"Dog-leg flight footprint and reciprocal doors checked; headroom, railing, structure and code require review."}};
   if(validateRequestedProgramme(p,b).length||residentialStairStudies(p).studies[0]?.kind!=="dog-leg")continue;
   const signature=planSignature(p);if(seen.has(signature))continue;
   seen.add(signature);plans.push(p);
   if(plans.length===max)return {plans,blockers:[]};
  }
 }
 return {plans,blockers:plans.length?[]:["No dog-leg stair candidate fits the exact requested programme and door alignment. Try the standard concepts or review usable frontage with an architect."]};
}
export function portfolioForPlanId(b:PlanBrief,planId:string):PlanningResult{
 return /-stair-v1-[01]$/.test(planId)?generateStairReadyPortfolio(b,24):generateSpatialPortfolio(b,24);
}
